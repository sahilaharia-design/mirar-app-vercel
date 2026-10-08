import { CORRECTION_REASONS } from '../v2/contracts';
import { V2 } from '../v2/config';
import { computeEvidence } from '../v2/evidence';
import { DOMAIN_PHRASE, TEMPLATES } from '../v2/templates';
import { CAPACITIES, Capacity, InsightRecord, Option, State } from '../v2/types';

/**
 * THE MIRROR — read model, contract v1.
 *
 * A pure function of stored structured engine state. Nothing here is inferred by this module: it only selects, counts
 * and phrases things the engine already stored or emitted, and every statement carries the ids it came from.
 *
 *  user_said — a structured choice the user made (exact authored label), or a commitment they chose, or their verdict
 *  observed  — a count Mirar made over those choices (numerator, denominator, window)
 *  inferred  — an engine-emitted reading the user was shown, always with the user's own verdict beside it
 *  unknown   — what Mirar has not been told
 *
 * Never read: free text (none is stored), UI state. Never produced: scores, levels, rankings, traits, diagnoses, "you are".
 * A reading the user rejected ("No") is NEVER reproduced; it appears only as the fact that a reading did not fit.
 */
export type MirrorSource = 'user_said' | 'observed' | 'inferred' | 'unknown';
export type MirrorSection = 'said' | 'practised' | 'come_up' | 'carrying' | 'readings' | 'shifted' | 'unknown';

export interface MirrorTrace { instanceIds: number[]; observationIds: number[]; commitmentIds: number[]; insightIds: number[] }
export interface MirrorStatement {
  id: string;
  section: MirrorSection;
  source: MirrorSource;
  /** default phrasing; presentation may restyle it but must not change the facts */
  text: string;
  facts: Record<string, string | number | boolean | null>;
  trace: MirrorTrace;
  /** ISO calendar date of the most recent underlying event, when there is one */
  date?: string;
}
export type MirrorState = 'empty' | 'sparse' | 'populated';
export interface MirrorModel {
  version: 1;
  engineVersion: string;
  state: MirrorState;
  statements: MirrorStatement[];
  sections: Record<MirrorSection, MirrorStatement[]>;
}

const SECTIONS: MirrorSection[] = ['said', 'practised', 'come_up', 'carrying', 'readings', 'shifted', 'unknown'];
const CAPACITY_LABEL: Record<Capacity, string> = { direction: 'Direction', energy: 'Energy', focus: 'Focus', relationships: 'Relationships', growth: 'Growth', action: 'Action' };
const iso = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const none = (): MirrorTrace => ({ instanceIds: [], observationIds: [], commitmentIds: [], insightIds: [] });
const SAID_LIMIT = 8;

const optionLabel = (templateId: string, optionId?: string): { prompt: string; label: string } | null => {
  const t = TEMPLATES.find((x) => x.id === templateId); if (!t || !optionId) return null;
  const find = (opts: Option[]) => opts.find((o) => o.id === optionId);
  const o = find(t.options); if (o) return { prompt: t.prompt, label: o.label };
  const f = t.followUp && find(t.followUp.options); return f ? { prompt: t.followUp!.prompt, label: f.label } : null;
};

export function buildMirror(s: State, today: number): MirrorModel {
  const out: MirrorStatement[] = [];
  const push = (x: MirrorStatement) => out.push(x);
  const doneReps = s.instances.filter((i) => i.completed && !i.skippedAll);

  // ── said (USER SAID): the user's own most recent structured choices, newest first ─────────────────────────
  const said = s.observations.filter((o) => !o.unknown && (o.step === 'primary' || o.step === 'capture') && (o.optionId || o.domain))
    .slice().sort((a, b) => b.id - a.id);
  let n = 0;
  for (const o of said) {
    if (n >= SAID_LIMIT) break;
    if (o.step === 'capture' && o.domain) {
      push({ id: `said:o${o.id}`, section: 'said', source: 'user_said', text: `You said this was mostly connected to ${DOMAIN_PHRASE[o.domain] ?? o.domain}.`, facts: { domain: o.domain }, trace: { ...none(), observationIds: [o.id], instanceIds: [o.instanceId] }, date: iso(o.day) });
      n++; continue;
    }
    const l = optionLabel(o.templateId, o.optionId); if (!l) continue;
    push({ id: `said:o${o.id}`, section: 'said', source: 'user_said', text: `${l.prompt} You chose “${l.label.replace(/\.$/, '')}”.`, facts: { question: l.prompt, choice: l.label }, trace: { ...none(), observationIds: [o.id], instanceIds: [o.instanceId] }, date: iso(o.day) });
    n++;
  }

  // ── practised (OBSERVED): completed training reps per capacity; alphabetical, never ranked ──────────────────
  const by = new Map<Capacity, { ids: number[]; last: number }>();
  for (const i of doneReps) if (i.layer === 'training') { const c = by.get(i.capacity) ?? { ids: [], last: 0 }; c.ids.push(i.id); c.last = Math.max(c.last, i.day); by.set(i.capacity, c); }
  for (const [c, v] of [...by.entries()].sort((a, b) => CAPACITY_LABEL[a[0]].localeCompare(CAPACITY_LABEL[b[0]])))
    push({ id: `practised:${c}`, section: 'practised', source: 'observed', text: `${CAPACITY_LABEL[c]}: ${v.ids.length} ${v.ids.length === 1 ? 'rep' : 'reps'} completed.`, facts: { capacity: c, reps: v.ids.length }, trace: { ...none(), instanceIds: v.ids }, date: iso(v.last) });

  // ── come_up (OBSERVED): only what the ENGINE counts as an active repeated signal, using its own thresholds and
  //    its own feedback gating (a domain the user said "No" to is withheld by the engine and is therefore absent) ──
  const ev = computeEvidence(s, today, V2).evidence;
  for (const e of ev) {
    if (e.kind !== 'repeated_signal' || e.status !== 'active' || e.independentN < V2.evidence.repeated.minIndependent) continue;
    const d = DOMAIN_PHRASE[e.subject as keyof typeof DOMAIN_PHRASE] ?? e.subject;
    const obs = s.observations.filter((o) => o.domain === e.subject && !o.unknown && e.days.includes(o.day)).map((o) => o.id);
    push({
      id: `come_up:${e.key}`, section: 'come_up', source: 'observed',
      text: `${cap(d)} has come up ${e.independentN} times${e.promptedN ? ` (${e.promptedN} chosen from a list${e.introducedN ? `, ${e.introducedN} raised by you` : ''})` : e.introducedN ? ` (${e.introducedN} raised by you)` : ''} in the last ${V2.evidence.windowDays} days.`,
      facts: { domain: e.subject, count: e.independentN, chosenFromList: e.promptedN, raisedByYou: e.introducedN, windowDays: V2.evidence.windowDays },
      trace: { ...none(), observationIds: obs }, date: iso(Math.max(...e.days)),
    });
  }

  // ── carrying (USER SAID): commitments the user chose, with neutral outcomes ────────────────────────────────
  const OUTCOME: Record<string, string> = { done: 'done', partly_done: 'partly done', changed_mind: 'changed your mind', dropped_on_purpose: 'decided not to' };
  for (const c of s.commitments) {
    if (!c.label) continue;
    const last = c.events[c.events.length - 1];
    if (c.status === 'open' || c.status === 'postponed') {
      const when = c.postponedUntilDate ?? c.dueDate;
      push({ id: `carrying:c${c.id}`, section: 'carrying', source: 'user_said', text: `You chose to carry: ${c.label}${when ? ` (around ${when})` : ''}.`, facts: { label: c.label, status: c.status, around: when ?? null }, trace: { ...none(), commitmentIds: [c.id] }, date: iso(last?.day ?? c.createdDay) });
    } else if (OUTCOME[c.status]) {
      push({ id: `carrying:c${c.id}`, section: 'carrying', source: 'user_said', text: `You marked “${c.label}” as ${OUTCOME[c.status]}.`, facts: { label: c.label, status: c.status }, trace: { ...none(), commitmentIds: [c.id] }, date: iso(last?.day ?? c.createdDay) });
    }
  }

  // ── readings / shifted (INFERRED): readings the user was shown, with their own verdict; rejected ones never revived
  const verdict = (i: InsightRecord) => i.feedback?.value;
  for (const i of s.insights.slice().sort((a, b) => b.id - a.id)) {
    const section: MirrorSection = i.kind === 'change' ? 'shifted' : 'readings';
    if (verdict(i) === 'no') {
      push({ id: `readings:i${i.id}`, section: 'readings', source: 'user_said', text: 'You said one of Mirar’s readings did not fit. Mirar set it aside.', facts: { verdict: 'no' }, trace: { ...none(), insightIds: [i.id] }, date: iso(i.feedback!.day) });
      continue;
    }
    const v = verdict(i);
    const vText = v === 'accurate' ? 'You said this felt accurate.' : v === 'partly' ? `You said this was partly right${i.correction ? `: ${CORRECTION_REASONS.find((r) => r.id === i.correction!.reason)?.label ?? ''}.` : '.'}` : v === 'unsure' ? 'You weren’t sure about this.' : 'You did not respond to this.';
    push({ id: `${section}:i${i.id}`, section, source: 'inferred', text: `${i.text} ${vText}`, facts: { tier: i.tier, kind: i.kind, verdict: v ?? null, correction: i.correction?.reason ?? null, independentN: i.snapshot.independentN }, trace: { ...none(), insightIds: [i.id] }, date: iso(i.day) });
  }

  // ── unknown (UNKNOWN): what Mirar has not been told ───────────────────────────────────────────────────────
  if (doneReps.length) {
    const prim = s.observations.filter((o) => o.step === 'primary');
    const unk = prim.filter((o) => o.unknown);
    if (unk.length) push({ id: 'unknown:dont_know', section: 'unknown', source: 'unknown', text: `You answered “I don’t know” ${unk.length} of ${prim.length} times. That is respected, and nothing is assumed from it.`, facts: { unknown: unk.length, of: prim.length }, trace: { ...none(), observationIds: unk.map((o) => o.id) } });
    const missing = CAPACITIES.filter((c) => !by.has(c));
    if (missing.length) push({ id: 'unknown:unpractised', section: 'unknown', source: 'unknown', text: `Not practised yet: ${missing.map((c) => CAPACITY_LABEL[c]).join(', ')}. Mirar has not been told anything in these areas.`, facts: { capacities: missing.join(',') }, trace: { ...none(), instanceIds: doneReps.map((i) => i.id) } });
  }

  const sections = Object.fromEntries(SECTIONS.map((k) => [k, out.filter((x) => x.section === k)])) as Record<MirrorSection, MirrorStatement[]>;
  const state: MirrorState = !doneReps.length ? 'empty' : sections.come_up.length || sections.readings.some((x) => x.source === 'inferred') || sections.shifted.length ? 'populated' : 'sparse';
  return { version: 1, engineVersion: 'v2.0.1-correction-fix', state, statements: out, sections };
}
