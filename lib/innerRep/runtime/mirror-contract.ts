import { CORRECTION_REASONS } from '../v2/contracts';
import { V2 } from '../v2/config';
import { computeEvidence, feedbackFor } from '../v2/evidence';
import { DOMAIN_PHRASE } from '../v2/templates';
import { CAPACITIES, Capacity, InsightRecord, State } from '../v2/types';
import { resolveSteps, ResolvedStep } from './step-resolver';

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

/** Per-source, per-kind structured facts. Presentation may restyle `text`, never change these. */
export type MirrorFacts =
  | { kind: 'choice'; question: string; choice: string }
  | { kind: 'domain'; domain: string }
  | { kind: 'practised'; capacity: Capacity; reps: number }
  | { kind: 'recurring'; domain: string; count: number; chosenFromList: number; raisedByYou: number; offered: number; presentWhenOffered: number; windowDays: number }
  | { kind: 'commitment'; label: string; status: string; around: string | null }
  | { kind: 'reading'; evidenceKind: string; tier: string; verdict: 'accurate' | 'none'; independentN: number; chosenFromList: number; raisedByYou: number }
  | { kind: 'reading_history'; verdict: 'accurate' | 'partly' | 'no' | 'unsure' | 'none'; correction: string | null; reason: 'qualified' | 'rejected' | 'unsure' | 'no_longer_supported' }
  | { kind: 'dont_know'; unknown: number; of: number }
  | { kind: 'unpractised'; capacities: string };

/**
 * How well the ids in `trace` identify the data behind the statement.
 *  exact       — the ids are precisely what produced it (a user's own choice, a commitment, a verdict).
 *  approximate — the ids are the user's own responses about the same domain in the same period; the engine does not yet
 *                report the exact set it counted (amendment A5). Never describe these as "the exact responses behind the count".
 */
export type MirrorProvenance = 'exact' | 'approximate';

export interface MirrorStatement {
  id: string;
  section: MirrorSection;
  source: MirrorSource;
  /** default phrasing; presentation may restyle it but must not change the facts */
  text: string;
  facts: MirrorFacts;
  trace: MirrorTrace;
  provenance: MirrorProvenance;
  /** ISO calendar date of the most recent underlying event, when there is one */
  date?: string;
}
export type MirrorState = 'empty' | 'sparse' | 'populated';
export interface MirrorModel {
  version: 1;
  engineVersion: string;
  state: MirrorState;
  /** The model describes only the retained history. The runtime keeps the last 300 reps, 100 readings and 120 days of responses. */
  retained: { instances: number; from: string | null; mayBeTruncated: boolean };
  statements: MirrorStatement[];
  sections: Record<MirrorSection, MirrorStatement[]>;
}

const SECTIONS: MirrorSection[] = ['said', 'practised', 'come_up', 'carrying', 'readings', 'shifted', 'unknown'];
const CAPACITY_LABEL: Record<Capacity, string> = { direction: 'Direction', energy: 'Energy', focus: 'Focus', relationships: 'Relationships', growth: 'Growth', action: 'Action' };
const iso = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const none = (): MirrorTrace => ({ instanceIds: [], observationIds: [], commitmentIds: [], insightIds: [] });
const SAID_LIMIT = 8;

export function buildMirror(s: State, today: number): MirrorModel {
  const out: MirrorStatement[] = [];
  const push = (x: MirrorStatement) => out.push(x);
  const doneReps = s.instances.filter((i) => i.completed && !i.skippedAll);

  // ── said (USER SAID): the user's own most recent structured choices, newest first ─────────────────────────
  const said = s.observations.filter((o) => !o.unknown && (o.step === 'primary' || o.step === 'capture') && (o.optionId || o.domain))
    .slice().sort((a, b) => b.id - a.id);
  const resolvedBy = new Map<number, ResolvedStep>();
  const instOf = new Map(s.instances.map((i) => [i.id, i]));
  const resolvedInst = new Set<number>();
  let n = 0;
  for (const o of said) {
    if (n >= SAID_LIMIT) break;
    if (o.step === 'capture' && o.domain) {
      push({ id: `said:o${o.id}`, section: 'said', source: 'user_said', text: `You said this was mostly connected to ${DOMAIN_PHRASE[o.domain] ?? o.domain}.`, facts: { kind: 'domain', domain: o.domain }, trace: { ...none(), observationIds: [o.id], instanceIds: [o.instanceId] }, provenance: 'exact', date: iso(o.day) });
      n++; continue;
    }
    if (!resolvedInst.has(o.instanceId)) { resolvedInst.add(o.instanceId); const inst = instOf.get(o.instanceId); if (inst) for (const r of resolveSteps(s, inst, s.observations)) resolvedBy.set(r.observationId, r); }
    const r = resolvedBy.get(o.id); if (!r || r.choice.kind !== 'option') continue;
    const label = r.choice.label.replace(/\.$/, '');
    push({ id: `said:o${o.id}`, section: 'said', source: 'user_said', text: `${r.prompt} You chose “${label}”.`, facts: { kind: 'choice', question: r.prompt, choice: label }, trace: { ...none(), observationIds: [o.id], instanceIds: [o.instanceId] }, provenance: 'exact', date: iso(o.day) });
    n++;
  }

  // ── practised (OBSERVED): completed training reps per capacity; alphabetical, never ranked ──────────────────
  const by = new Map<Capacity, { ids: number[]; last: number }>();
  for (const i of doneReps) if (i.layer === 'training') { const c = by.get(i.capacity) ?? { ids: [], last: 0 }; c.ids.push(i.id); c.last = Math.max(c.last, i.day); by.set(i.capacity, c); }
  for (const [c, v] of [...by.entries()].sort((a, b) => CAPACITY_LABEL[a[0]].localeCompare(CAPACITY_LABEL[b[0]])))
    push({ id: `practised:${c}`, section: 'practised', source: 'observed', text: `${CAPACITY_LABEL[c]}: ${v.ids.length} ${v.ids.length === 1 ? 'rep' : 'reps'} completed.`, facts: { kind: 'practised', capacity: c, reps: v.ids.length }, trace: { ...none(), instanceIds: v.ids }, provenance: 'exact', date: iso(v.last) });

  // ── come_up (OBSERVED): only what the ENGINE counts as an active repeated signal, using its own thresholds and
  //    its own feedback gating (a domain the user said "No" to is withheld by the engine and is therefore absent) ──
  const ev = computeEvidence(s, today, V2).evidence;
  for (const e of ev) {
    if (e.kind !== 'repeated_signal' || e.status !== 'active' || e.independentN < V2.evidence.repeated.minIndependent) continue;
    const d = DOMAIN_PHRASE[e.subject as keyof typeof DOMAIN_PHRASE] ?? e.subject;
    // approximate support: the user's own responses about this domain on the evidence days, excluding continuation checks
    // and "I don't know". The engine does not report the exact set it counted (see ENGINE_CHANGE_PROPOSALS A5).
    const obs = s.observations.filter((o) => o.domain === e.subject && !o.unknown && o.domainOrigin !== 'thread_continuation' && e.days.includes(o.day)).map((o) => o.id);
    push({
      id: `come_up:${e.key}`, section: 'come_up', source: 'observed',
      text: `${cap(d)} has come up ${e.independentN} times${e.promptedN ? ` (${e.promptedN} chosen from a list${e.introducedN ? `, ${e.introducedN} raised by you` : ''})` : e.introducedN ? ` (${e.introducedN} raised by you)` : ''} in the last ${V2.evidence.windowDays} days.`,
      facts: { kind: 'recurring', domain: e.subject, count: e.independentN, chosenFromList: e.promptedN, raisedByYou: e.introducedN, offered: e.offeredN, presentWhenOffered: e.presentOfferedN, windowDays: V2.evidence.windowDays },
      trace: { ...none(), observationIds: obs }, provenance: 'approximate', date: iso(Math.max(...e.days)),
    });
  }

  // ── carrying (USER SAID): commitments the user chose, with neutral outcomes ────────────────────────────────
  const OUTCOME: Record<string, string> = { done: 'done', partly_done: 'partly done', changed_mind: 'changed your mind', dropped_on_purpose: 'decided not to' };
  for (const c of s.commitments) {
    if (!c.label) continue;
    const last = c.events[c.events.length - 1];
    if (c.status === 'open' || c.status === 'postponed') {
      const when = c.postponedUntilDate ?? c.dueDate;
      push({ id: `carrying:c${c.id}`, section: 'carrying', source: 'user_said', text: `You chose to carry: ${c.label}${when ? ` (around ${when})` : ''}.`, facts: { kind: 'commitment', label: c.label, status: c.status, around: when ?? null }, trace: { ...none(), commitmentIds: [c.id] }, provenance: 'exact', date: iso(last?.day ?? c.createdDay) });
    } else if (OUTCOME[c.status]) {
      push({ id: `carrying:c${c.id}`, section: 'carrying', source: 'user_said', text: `You marked “${c.label}” as ${OUTCOME[c.status]}.`, facts: { kind: 'commitment', label: c.label, status: c.status, around: null }, trace: { ...none(), commitmentIds: [c.id] }, provenance: 'exact', date: iso(last?.day ?? c.createdDay) });
    }
  }

  // ── readings / shifted (INFERRED): a reading's CLAIM TEXT is reproduced only while it is currently eligible. ──────
  //    Currently eligible = the user affirmed it or did not respond, the engine still holds the same evidence as active,
  //    and no later "No"/"Partly" (own or domain-level memory) applies. Anything else becomes a history statement that
  //    never repeats the claim: a Partly-qualified reading is never reproduced unchanged.
  const activeKeys = new Set(ev.filter((e) => e.status === 'active').map((e) => e.key));
  const reasonLabel = (r?: string) => CORRECTION_REASONS.find((x) => x.id === r)?.label;
  for (const i of s.insights.slice().sort((a, b) => b.id - a.id)) {
    const section: MirrorSection = i.kind === 'change' ? 'shifted' : 'readings';
    const v = i.feedback?.value;
    const subject = i.evidenceKey.split(':').slice(1).join(':');
    const mem = feedbackFor(s, { key: i.evidenceKey, kind: i.kind, subject });
    // feedback given AFTER this reading was shown (a hedged reading the engine legitimately re-offered later is not blocked by older feedback)
    const after = (d?: number) => d !== undefined && d > i.day;
    const laterBlock = after(mem?.noDay) || after(mem?.partlyDay) || after(mem?.unsureDay);
    const history = (reason: 'qualified' | 'rejected' | 'unsure' | 'no_longer_supported', text: string, day: number) =>
      push({ id: `${section}:i${i.id}`, section, source: 'user_said', text, facts: { kind: 'reading_history', verdict: v ?? 'none', correction: reasonLabel(i.correction?.reason) ?? null, reason }, trace: { ...none(), insightIds: [i.id] }, provenance: 'exact', date: iso(day) });
    if (v === 'no') { history('rejected', 'You said one of Mirar’s readings did not fit. Mirar set it aside.', i.feedback!.day); continue; }
    if (v === 'partly') { const r = reasonLabel(i.correction?.reason); history('qualified', `You said a reading was only partly right${r ? `: ${r}` : ''}. Mirar won’t repeat it unchanged.`, i.feedback!.day); continue; }
    if (v === 'unsure') { history('unsure', 'You weren’t sure about a reading. No conclusion was added.', i.feedback!.day); continue; }
    const current = !laterBlock && activeKeys.has(i.evidenceKey);
    if (!current) { history('no_longer_supported', 'A reading Mirar offered earlier is not being shown now.', i.day); continue; }
    push({ id: `${section}:i${i.id}`, section, source: 'inferred', text: `${i.text} ${v === 'accurate' ? 'You said this felt accurate.' : 'You did not respond to this.'}`, facts: { kind: 'reading', evidenceKind: i.kind, tier: i.tier, verdict: v === 'accurate' ? 'accurate' : 'none', independentN: i.snapshot.independentN, chosenFromList: i.snapshot.promptedN, raisedByYou: i.snapshot.introducedN }, trace: { ...none(), insightIds: [i.id] }, provenance: 'exact', date: iso(i.day) });
  }

  // ── unknown (UNKNOWN): what Mirar has not been told ───────────────────────────────────────────────────────
  if (doneReps.length) {
    const prim = s.observations.filter((o) => o.step === 'primary');
    const unk = prim.filter((o) => o.unknown);
    if (unk.length) push({ id: 'unknown:dont_know', section: 'unknown', source: 'unknown', text: `You answered “I don’t know” ${unk.length} of ${prim.length} times. That is respected, and nothing is assumed from it.`, facts: { kind: 'dont_know', unknown: unk.length, of: prim.length }, trace: { ...none(), observationIds: unk.map((o) => o.id) }, provenance: 'exact' });
    const missing = CAPACITIES.filter((c) => !by.has(c));
    if (missing.length) push({ id: 'unknown:unpractised', section: 'unknown', source: 'unknown', text: `No completed training reps yet in: ${missing.map((c) => CAPACITY_LABEL[c]).join(', ')}.`, facts: { kind: 'unpractised', capacities: missing.join(',') }, trace: { ...none(), instanceIds: doneReps.map((i) => i.id) }, provenance: 'exact' });
  }

  const sections = Object.fromEntries(SECTIONS.map((k) => [k, out.filter((x) => x.section === k)])) as Record<MirrorSection, MirrorStatement[]>;
  const state: MirrorState = !doneReps.length ? 'empty' : sections.come_up.length || sections.readings.some((x) => x.source === 'inferred') || sections.shifted.length ? 'populated' : 'sparse';
  const first = s.instances.length ? Math.min(...s.instances.map((i) => i.day)) : null;
  const retained = { instances: s.instances.length, from: first === null ? null : iso(first), mayBeTruncated: s.instances.length >= 300 };
  return { version: 1, engineVersion: 'v2.0.1-correction-fix', state, retained, statements: out, sections };
}
