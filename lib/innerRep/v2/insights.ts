import { V2, V2Config } from './config';
import { DOMAIN_PHRASE, TEMPLATES } from './templates';
import { feedbackFor } from './evidence';
import { CorrectionReason, Evidence, InsightRecord, State } from './types';

// ─── Insights (what is SHOWN) and the user's corrections ──────────────────────
// An insight is only ever built from an Evidence object, so it carries its own
// counts. Wording follows the weakest necessary link: prompted-only evidence is
// worded as "you chose X when it was offered", never "X keeps coming up".
// Disagreement is evidence that Mirar's reading is weak — never about the user.

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const STANCE_LABEL: Record<string, string> = Object.fromEntries(TEMPLATES.flatMap((t) => t.options.filter((o) => o.stance).map((o) => [`${o.stance!.key}:${o.stance!.side}`, o.label.replace(/\.$/, '')])).reverse());

export interface InsightDecision { evidenceKey: string; verdict: 'shown' | 'eligible_not_shown' | 'not_eligible'; reason: string; insight?: Omit<InsightRecord, 'id' | 'day'> }

/** feedback on a domain claim (repeated signal OR convergence) applies to the domain, whichever kind carried it */
export const fbFor = feedbackFor;

export function buildInsight(s: State, e: Evidence, tentativeMode: boolean, cfg: V2Config = V2): Omit<InsightRecord, 'id' | 'day'> | null {
  if (e.kind === 'contradiction' && !cfg.insight.contradictionEnabled) return null; // evidence concept kept; no user-facing contradiction in the MVP
  const snap = { independentN: e.independentN, introducedN: e.introducedN, promptedN: e.promptedN };
  const fb = fbFor(s, e);
  const prior = fb?.noDay !== undefined ? ' Earlier you said a similar reading didn\'t fit, so treat this as a question.' : fb?.partlyDay !== undefined ? ' You said an earlier version was only partly right.' : '';
  const subj = cap(DOMAIN_PHRASE[e.subject as keyof typeof DOMAIN_PHRASE] ?? e.subject);
  if (e.kind === 'repeated_signal') {
    if (e.support === 'supported' && !tentativeMode && !prior)
      return { evidenceKey: e.key, kind: e.kind, tier: 'supported', text: `${subj} has come up ${e.independentN} times${e.promptedN ? ` (${e.promptedN} chosen from a list` : ' ('}${e.promptedN ? ', ' : ''}${e.introducedN} raised by you).`, snapshot: snap };
    if (fb?.partlyDay !== undefined && fb.noDay === undefined && e.independentN >= V2.evidence.repeated.minIndependent) {
      // qualified, never supported: states what was counted, and the part the user said was off
      const R = fb.partlyReason;
      const tail = R === 'situation_right_meaning_off' ? ' This is only the count: you said the situation was right but not what it means.'
        : R === 'importance_overstated' ? ' You said an earlier reading made it sound more important than it is.'
        : R === 'something_missing' ? ' You said an earlier reading was missing something, so this may be only part of the picture.'
        : R === 'changed_since' ? ' This counts only what has happened since you said things had changed.'
        : ' You said an earlier version was only partly right, so treat this as a question.';
      return { evidenceKey: e.key, kind: e.kind, tier: 'hedged', text: `${subj} has come up ${e.independentN} times${e.introducedN ? `, ${e.introducedN} raised by you` : ''}.${tail}`, snapshot: snap };
    }
    if (fb?.noDay !== undefined && e.independentN >= V2.evidence.repeated.minIndependent)
      return { evidenceKey: e.key, kind: e.kind, tier: 'hedged', text: `${subj} has come up ${e.independentN} times${e.introducedN ? `, ${e.introducedN} of them raised by you` : ''}. Treat this as a question, not a reading.${prior}`, snapshot: snap };
    if (e.promptedN >= V2.evidence.repeated.hedgedMinIndependent && e.introducedN === 0)
      return { evidenceKey: e.key, kind: e.kind, tier: 'hedged', text: `You picked ${DOMAIN_PHRASE[e.subject as keyof typeof DOMAIN_PHRASE] ?? e.subject} ${e.presentOfferedN || e.independentN} of the ${e.offeredN || e.independentN} times it was an option. That may reflect what you were asked about. Is it actually on your mind?${prior}`, snapshot: snap };
    return null;
  }
  if (e.kind === 'cross_capacity_convergence' && e.support === 'supported' && !tentativeMode && fb?.partlyDay === undefined)
    return { evidenceKey: e.key, kind: e.kind, tier: 'supported', text: `${subj} came up while Mirar was asking about ${e.capacities.join(' and ')}. ${e.introducedN === 1 ? 'Once' : `${e.introducedN} times`} you brought it up yourself, without being asked about it.${prior}`, snapshot: snap };
  if (e.kind === 'change') {
    const heavier = (e.note ?? '').startsWith('heavier');
    return { evidenceKey: e.key, kind: e.kind, tier: 'hedged', text: heavier
      ? `In the last week ${e.promptedN} of ${e.independentN} answers were heavy, against ${e.presentOfferedN} of ${e.offeredN} before. That compares you with your own earlier check-ins; it is not a verdict.${prior}`
      : `In the last week ${e.promptedN} of ${e.independentN} answers were heavy, against ${e.presentOfferedN} of ${e.offeredN} before: lighter than your own earlier check-ins. It is a comparison, not a verdict.${prior}`, snapshot: snap };
  }
  if (e.kind === 'contradiction') {
    const sides = (e.note ?? '').replace('sides: ', '').split(' / ');
    const key = e.subject;
    return { evidenceKey: e.key, kind: e.kind, tier: 'hedged', text: `You chose "${STANCE_LABEL[`${key}:${sides[0]}`] ?? sides[0]}" and also "${STANCE_LABEL[`${key}:${sides[1]}`] ?? sides[1]}" within two weeks. Both can be true.${prior}`, snapshot: snap };
  }
  if (e.kind === 'resolution') {
    const d = DOMAIN_PHRASE[e.subject as keyof typeof DOMAIN_PHRASE] ?? e.subject;
    return e.support === 'supported'
      ? { evidenceKey: e.key, kind: e.kind, tier: 'supported', text: `You said this feels settled. ${cap(d)} won't be brought up unless you raise it.`, snapshot: snap }
      : { evidenceKey: e.key, kind: e.kind, tier: 'hedged', text: `${cap(d)} hasn't come up in your last ${e.negativeN} check-ins on it.`, snapshot: snap };
  }
  return null; // thread / follow-through / one-off event drive continuity, not insights
}

/** Pick at most one insight for today, honouring suppression, cooldown, weekly cap and tentative mode. */
export function chooseInsight(s: State, evidence: Evidence[], day: number, tentativeMode: boolean, cfg: V2Config = V2): { shown?: Omit<InsightRecord, 'id' | 'day'>; decisions: InsightDecision[] } {
  const decisions: InsightDecision[] = [];
  const last7 = s.insights.filter((i) => i.day > day - 7).length;
  const cooldown = cfg.insight.cooldownDaysSameKey * (tentativeMode ? 2 : 1);
  let shown: Omit<InsightRecord, 'id' | 'day'> | undefined;
  for (const e of evidence) {
    if (e.status !== 'active') { decisions.push({ evidenceKey: e.key, verdict: 'not_eligible', reason: e.note ?? e.status }); continue; }
    const ins = buildInsight(s, e, tentativeMode, cfg);
    if (!ins) { decisions.push({ evidenceKey: e.key, verdict: 'not_eligible', reason: 'drives continuity, not an insight' }); continue; }
    const prev = [...s.insights].reverse().find((i) => i.evidenceKey === e.key);
    const cd = cooldown * (fbFor(s, e)?.partlyDay !== undefined ? cfg.feedback.partlyCooldownMultiplier : 1);
    if (prev && day - prev.day < cd) { decisions.push({ evidenceKey: e.key, verdict: 'eligible_not_shown', reason: `shown ${day - prev.day}d ago (cooldown ${cd}d)` }); continue; }
    if (prev && prev.text === ins.text) { decisions.push({ evidenceKey: e.key, verdict: 'eligible_not_shown', reason: 'would repeat unchanged text' }); continue; }
    if (last7 >= cfg.insight.maxPer7Days) { decisions.push({ evidenceKey: e.key, verdict: 'eligible_not_shown', reason: `weekly cap ${cfg.insight.maxPer7Days}` }); continue; }
    if (shown) { decisions.push({ evidenceKey: e.key, verdict: 'eligible_not_shown', reason: 'one insight per rep' }); continue; }
    shown = ins; decisions.push({ evidenceKey: e.key, verdict: 'shown', reason: `${e.kind}, ${ins.tier}`, insight: ins });
  }
  return { shown, decisions };
}

/** The user's reaction. Never produces a statement about the person. */
export function applyFeedback(s: State, insightId: number, value: 'accurate' | 'partly' | 'no' | 'unsure', day: number, cfg: V2Config = V2) {
  const ins = s.insights.find((i) => i.id === insightId);
  if (!ins) return;
  ins.feedback = { day, value };
  const keys = [ins.evidenceKey, ...(ins.kind === 'repeated_signal' || ins.kind === 'cross_capacity_convergence' ? [`domain:${ins.evidenceKey.split(':')[1]}`] : [])];
  for (const k of keys) {
  const mem = (s.feedbackMem[k] ??= { key: k });
  if (value === 'no') { mem.noDay = day; mem.independentAtNo = ins.snapshot.independentN; }
  if (value === 'partly') mem.partlyDay = day;
  if (value === 'unsure') mem.unsureDay = day;
  }
  if (value === 'no' && (ins.kind === 'repeated_signal' || ins.kind === 'cross_capacity_convergence')) {
    // the subject rests: Mirar will not bring that domain up through lenses for a while
    const d = ins.evidenceKey.split(':')[1] as keyof typeof s.domainState;
    const st = (s.domainState[d] ??= { negStreak: 0, lastLensDay: {} });
    st.restUntilDay = Math.max(st.restUntilDay ?? 0, day + cfg.feedback.suppressDaysNo); st.restReason = 'user said the reading did not fit';
  }
}

/**
 * After "Partly": the user's structured reason. This qualifies MIRAR'S interpretation of the evidence; it is stored as feedback
 * about the insight and never creates evidence or a statement about the person.
 */
export function applyCorrection(s: State, insightId: number, reason: CorrectionReason, day: number) {
  const ins = s.insights.find((i) => i.id === insightId);
  if (!ins || ins.feedback?.value !== 'partly' || ins.correction) return;
  ins.correction = { day, reason };
  const keys = [ins.evidenceKey, ...(ins.kind === 'repeated_signal' || ins.kind === 'cross_capacity_convergence' ? [`domain:${ins.evidenceKey.split(':')[1]}`] : [])];
  for (const k of keys) { const mem = (s.feedbackMem[k] ??= { key: k }); mem.partlyReason = reason; }
}
