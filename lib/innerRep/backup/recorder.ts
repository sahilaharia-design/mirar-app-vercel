import type { StepAnswer } from '../v2/contracts';
import type { Domain } from '../v2/types';
import type { InsightFeedbackValue, V2Runtime } from '../runtime/v2-runtime';
import { ANSWER_KINDS, AnswerKind, BackupEvent, WireAnswer } from './events';

// Turns runtime operations into structured events. LOCAL, NON-PERSISTENT PROTOTYPE (not imported by the app).
// Only ids, enums and calendar dates are copied. Free text cannot appear: the runtime contract has none, `words` becomes a
// marker, and anything else an answer object might carry (a buggy caller's extra field) is dropped by construction.

export const isoOfDayNumber = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
export const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function toWire(answers: StepAnswer[]): WireAnswer[] {
  return answers.map((a): WireAnswer => {
    switch (a.kind) {
      case 'option': return { s: a.stepId, k: 'option', o: a.optionId };
      case 'domain': return { s: a.stepId, k: 'domain', d: a.domain as Domain };
      case 'timeframe': return a.timeframe === 'specific_date' ? { s: a.stepId, k: 'timeframe', tf: 'specific_date', date: a.date } : { s: a.stepId, k: 'timeframe', tf: a.timeframe };
      case 'unknown': case 'skip': case 'yes': case 'no': case 'words': return { s: a.stepId, k: a.kind };
      default: throw new Error('answer kind is not part of the backup contract');
    }
  });
}
export function fromWire(w: WireAnswer): StepAnswer {
  if (!ANSWER_KINDS.includes(w.k)) throw new Error('unknown answer kind');
  switch (w.k) {
    case 'option': return { stepId: w.s, kind: 'option', optionId: w.o as string };
    case 'domain': return { stepId: w.s, kind: 'domain', domain: w.d as Domain };
    case 'timeframe': return w.tf === 'specific_date' ? { stepId: w.s, kind: 'timeframe', timeframe: 'specific_date', date: w.date } : { stepId: w.s, kind: 'timeframe', timeframe: w.tf as 'today' };
    default: return { stepId: w.s, kind: w.k as Exclude<AnswerKind, 'option' | 'domain' | 'timeframe'> } as StepAnswer;
  }
}

export interface Recorded extends V2Runtime { journal(): BackupEvent[]; }
/** Wraps a runtime. `now` MUST be the same clock the runtime uses. The journal is the device's structured event log. */
export function recordRuntime(rt: V2Runtime, o: { engine: string; now: () => Date; journal?: BackupEvent[]; onEvent?: (e: BackupEvent) => void }): Recorded {
  const journal: BackupEvent[] = o.journal ?? [];
  const push = (e: BackupEvent) => { journal.push(e); o.onEvent?.(e); };
  const abandoned = new Set(journal.filter((e) => e.kind === 'rep_abandoned').map((e) => e.day));
  const day = () => localIso(o.now());
  const insightDay = (id: number) => { const i = rt._state().insights.find((x) => x.id === id); if (!i) throw new Error('unknown insight'); return isoOfDayNumber(i.day); };
  return {
    ...rt,
    journal: () => journal,
    async init(uid: string) {
      await rt.init(uid);
      // an unfinished rep from an earlier day was just abandoned by the runtime: journal it once
      for (const i of rt._state().instances) if (i.skippedAll && !i.completed) { const d = isoOfDayNumber(i.day); if (!abandoned.has(d)) { abandoned.add(d); push({ kind: 'rep_abandoned', day: d, engine: o.engine, template: i.templateId }); } }
    },
    async complete(answers: StepAnswer[], durationMs?: number) {
      const t = rt.today(); if (t.kind !== 'rep') throw new Error('no active rep');
      const meta = { template: t.payload.templateId, frame: t.payload.frame, bound: t.payload.bound, variant: t.context.variant };
      const result = await rt.complete(answers, durationMs);   // throws (and records nothing) if the engine rejects the answers
      push({ kind: 'rep_completed', day: day(), engine: o.engine, template: meta.template, frame: meta.frame, ...(meta.bound ? { bound: meta.bound } : {}), ...(meta.variant ? { variant: meta.variant } : {}), answers: toWire(answers) });
      return result;
    },
    async feedback(insightId: number, value: InsightFeedbackValue) {
      const d = insightDay(insightId); const already = !!rt._state().insights.find((x) => x.id === insightId)?.feedback;
      await rt.feedback(insightId, value);
      if (!already) push({ kind: 'feedback', day: day(), engine: o.engine, insightDay: d, value });
    },
    async correction(insightId: number, reason: Parameters<V2Runtime['correction']>[1]) {
      const d = insightDay(insightId); const already = !!rt._state().insights.find((x) => x.id === insightId)?.correction;
      await rt.correction(insightId, reason);
      if (!already) push({ kind: 'correction', day: day(), engine: o.engine, insightDay: d, reason });
    },
    // a safety stop records NOTHING: no event, no marker that one happened (the runtime already stores nothing from that rep)
  };
}
