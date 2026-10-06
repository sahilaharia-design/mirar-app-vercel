import { V2, V2Config } from '../../lib/innerRep/v2/config';
import { FlowContext, Step, StepAnswer, nextStep, primaryOptions } from '../../lib/innerRep/v2/contracts';
import { Decision, decide, label } from '../../lib/innerRep/v2/engine';
import { computeEvidence } from '../../lib/innerRep/v2/evidence';
import { applyCorrection, applyFeedback, chooseInsight } from '../../lib/innerRep/v2/insights';
import { CORRECTION_REASONS } from '../../lib/innerRep/v2/contracts';
import { applyRep, createState, flowContext } from '../../lib/innerRep/v2/state';
import { TEMPLATE_BY_ID } from '../../lib/innerRep/v2/templates';
import { Domain, Instance, InsightRecord, Observation, Refusal, State } from '../../lib/innerRep/v2/types';
import { DEFAULT_TRAITS, FB, Latent, Profile, Traits } from './profiles';
import { Rng, pickWeighted, rng } from './rng';

export interface DayLog {
  day: number; engaged: boolean; decision?: Decision; instance?: Instance; answers: StepAnswer[];
  newObs: Observation[]; newEvidence: string[]; refusals: Refusal[]; insight?: InsightRecord; feedback?: FB; rest: boolean; insightNotes: string[]; tentativeAtInsight?: boolean;
}
export interface RunResult { profile: Profile; state: State; logs: DayLog[]; cfg: V2Config }

export function respond(step: Step, ctx: FlowContext, latent: Latent, tr: Traits, r: Rng, day: number, p: Profile): StepAnswer {
  const t = ctx.template;
  const sid = step.id;
  if (step.type === 'choice') {
    if (r() < tr.unknownRate) return { stepId: sid, kind: 'unknown' };
    const opts = sid === 'follow_up' ? t.followUp!.options : primaryOptions(t, ctx.frame, ctx.bound, ctx.variant).options;
    const total = Object.values(latent.domains).reduce((a, x) => a + (x ?? 0), 0);
    // lens / thread checks / events / commitments: purpose-built behaviour
    if (ctx.frame === 'lens' || ctx.frame === 'thread_check') {
      const pr = latent.domains[ctx.bound as Domain] ?? 0;
      if (r() < pr) return { stepId: sid, kind: 'option', optionId: pr > 0.55 ? 'a_lot' : 'somewhat' };
      return { stepId: sid, kind: 'option', optionId: r() < tr.notThisBias ? 'not_this' : 'not_today' };
    }
    if (ctx.frame === 'resolution') { const pr = latent.domains[ctx.bound as Domain] ?? 0; return { stepId: sid, kind: 'option', optionId: pr < 0.2 ? 'settled' : pr < 0.5 ? 'mostly' : 'not_yet' }; }
    if (ctx.frame === 'event_check') { if (p.settleDay !== undefined && day >= p.settleDay) return { stepId: sid, kind: 'option', optionId: 'settled' }; return { stepId: sid, kind: 'option', optionId: latent.burden > 0.5 ? 'heavier' : 'same' }; }
    if (ctx.frame === 'commitment_check') return { stepId: sid, kind: 'option', optionId: pickWeighted(r, [{ v: 'done', w: tr.commit.done }, { v: 'partly', w: tr.commit.partly }, { v: 'not_yet', w: tr.commit.not_yet }, { v: 'changed_mind', w: tr.commit.changed_mind }, { v: 'dropped', w: tr.commit.dropped }]) };
    const weights = opts.map((o) => {
      let w: number;
      if (tr.acquiesce && o.domain === tr.acquiesce && t.domainRole === 'issue' && t.role !== 'probe') w = 100;
      else if (t.role === 'probe') {
        if (o.flagEvent) w = p.eventDay !== undefined && day >= p.eventDay && !ctxEventDone(ctx, day, p) ? 6 : 0.0;
        else if (o.polarity === 'absent') w = tr.probeNothing ? 50 : Math.max(0.15, 1 - total) * 1.0;
        else w = (latent.domains[o.domain as Domain] ?? 0.01) * 2;
      } else if (t.domainRole === 'resource' && o.domain) w = 0.25;
      else if (o.stance) w = o.burden ? tr.stanceBurden : 1 - tr.stanceBurden;
      else if (o.polarity === 'absent') w = Math.max(0.12, 1 - total) * 0.9;
      else if (o.domain && t.domainRole === 'issue') w = latent.domains[o.domain] ?? 0.03;
      else if (o.burden) w = 0.1 + latent.burden * 0.5;
      else w = 0.2 + (1 - latent.burden) * 0.5;
      return { v: o.id, w: o.creates ? w * (tr.commitBias ?? 1) : w };
    });
    return { stepId: sid, kind: 'option', optionId: pickWeighted(r, weights) };
  }
  if (step.type === 'domain_chips') {
    const top = (Object.entries(latent.domains) as [Domain, number][]).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 0.25 && r() < tr.tapProb) return { stepId: sid, kind: 'domain', domain: top[0] };
    return { stepId: sid, kind: 'skip' };
  }
  if (step.type === 'orientation_chips') return latent.orientation && r() < tr.orientTap ? { stepId: sid, kind: 'orientation', orientation: latent.orientation } : { stepId: sid, kind: 'skip' };
  if (step.type === 'timeframe') {
    if (r() < tr.skipRate * 0.5) return { stepId: sid, kind: 'skip' };
    const k = pickWeighted(r, (Object.entries(tr.timeframe) as [keyof Traits['timeframe'], number][]).map(([v, w]) => ({ v, w: ctx.frame === 'commitment_check' && v === 'today' ? 0 : w })));
    return { stepId: sid, kind: 'timeframe', timeframe: k, inDays: k === 'specific_date' ? 3 + Math.floor(r() * 3) : undefined };
  }
  if (step.type === 'yes_no') return { stepId: sid, kind: r() < tr.threadYes ? 'yes' : 'no' };
  return { stepId: sid, kind: 'skip' };
}
const eventDone = new WeakMap<object, boolean>();
function ctxEventDone(_c: FlowContext, _d: number, _p: Profile) { return eventDone.get(_p) ?? false; }

export function runProfile(p: Profile, over: Partial<V2Config> = {}, restEnabled = true): RunResult {
  const cfg: V2Config = { ...V2, ...over, rest: { ...V2.rest, ...(over.rest ?? {}), enabled: restEnabled } };
  const s = createState(p.seed);
  const r = rng(p.seed);
  const tr: Traits = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
  eventDone.set(p, false);
  const logs: DayLog[] = [];
  let prevEvidence = new Set<string>();
  for (let d = 0; d < p.days; d++) {
    if (!p.engage(d, r)) { logs.push({ day: d, engaged: false, answers: [], newObs: [], newEvidence: [], refusals: [], rest: false, insightNotes: [] }); continue; }
    const dec = decide(s, d, cfg);
    if (dec.layer === 'rest') { logs.push({ day: d, engaged: true, decision: dec, answers: [], newObs: [], newEvidence: [], refusals: dec.evidence.refusals, rest: true, insightNotes: [] }); continue; }
    const t = TEMPLATE_BY_ID[dec.templateId!];
    const inst: Instance = { id: ++s.seq.inst, day: d, templateId: t.id, frame: dec.frame!, bound: dec.bound, capacity: t.capacity, mechanism: t.mechanism, intensity: t.intensity, layer: dec.layer, intent: dec.intent, intentRef: dec.intentRef, variant: dec.variant, trace: dec.trace, completed: false, unknownPrimary: false, burden: false, skippedAll: false };
    s.instances.push(inst);
    const ctx = flowContext(s, d, t.id, dec.frame!, dec.bound, cfg, dec.variant);
    const latent = p.latent(d);
    const answers: StepAnswer[] = [];
    if (r() < tr.abandon) answers.push({ stepId: 'primary', kind: 'skip' });
    else for (let guard = 0; guard < 10; guard++) { const st = nextStep(ctx, answers); if (!st) break; answers.push(respond(st, ctx, latent, tr, r, d, p)); }
    const before = s.observations.length;
    applyRep(s, inst, ctx, answers, cfg);
    if (answers.some((a) => a.stepId === 'primary' && a.kind === 'option' && t.role === 'probe' && (a as any).optionId === 'event')) eventDone.set(p, true);
    const newObs = s.observations.slice(before);
    // evidence → at most one insight
    const ev = computeEvidence(s, d, cfg);
    const { shown, decisions } = chooseInsight(s, ev.evidence, d, ev.tentativeMode, cfg);
    let insight: InsightRecord | undefined; let fb: FB | undefined;
    if (shown && inst.completed && !inst.unknownPrimary) {
      insight = { ...shown, id: ++s.seq.insight, day: d }; s.insights.push(insight);
      const f = p.feedback ? p.feedback(insight, r) : (r() < 0.6 ? 'accurate' : r() < 0.5 ? 'partly' : 'unsure');
      if (f) { fb = f; applyFeedback(s, insight.id, f, d, cfg); if (f === 'partly') applyCorrection(s, insight.id, CORRECTION_REASONS[insight.id % CORRECTION_REASONS.length].id, d); } // reason cycled deterministically so every reason is exercised without disturbing the random stream
    }
    const keys = new Set(ev.evidence.map((e) => e.key));
    const newEvidence = [...keys].filter((k) => !prevEvidence.has(k));
    prevEvidence = keys;
    logs.push({ day: d, engaged: true, decision: dec, instance: inst, answers, newObs, newEvidence, refusals: ev.refusals, insight, feedback: fb, rest: false, tentativeAtInsight: ev.tentativeMode, insightNotes: decisions.map((x) => `${x.evidenceKey}: ${x.verdict} (${x.reason})`) });
  }
  return { profile: p, state: s, logs, cfg };
}
export { label };
