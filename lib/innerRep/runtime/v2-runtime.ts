import { V2, ENGINE_VERSION } from '../v2/config';
import { FlowContext, RepPayload, Step, StepAnswer, nextStep } from '../v2/contracts';
import { decide } from '../v2/engine';
import { computeEvidence } from '../v2/evidence';
import { applyCorrection, applyFeedback, chooseInsight } from '../v2/insights';
import { applyRep, createState, flowContext } from '../v2/state';
import { TEMPLATE_BY_ID } from '../v2/templates';
import { Capacity, CorrectionReason, Instance, State } from '../v2/types';
import { CORRECTION_REASONS } from '../v2/contracts';

// ─── Inner Rep v2 runtime adapter ─────────────────────────────────────────────
// Sits between the FROZEN engine (lib/innerRep/v2, tag inner-rep-engine-v2.0.0-mvp-freeze) and the presentation layer
// (components/inner-rep/v2). It owns: today's rep, the step contract boundary, structured persistence, completion,
// feedback and interrupted-flow restore. It decides NOTHING about selection, evidence or wording: every behavioural
// call goes to the engine. Pure TypeScript (no React Native, no Supabase) so it is testable in Node.
//
// PRIVACY: the contract has no text field. This adapter validates every answer against the step the engine emitted and
// rebuilds it from a whitelist, so raw text cannot be persisted even if a caller passes it. Nothing here logs.
// PERSISTENCE (development adapter): one JSON blob per user in a key/value store (AsyncStorage → browser localStorage on web).
// It holds STRUCTURED engine state only. It is device-local and is NOT the approved Supabase schema (no migration exists).

export interface KV {
  getItem(k: string): Promise<string | null>;
  setItem(k: string, v: string): Promise<void>;
  removeItem(k: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}
export const V2_KEY_PREFIX = 'mirar_inner_rep_v2';
const keyFor = (userId: string) => `${V2_KEY_PREFIX}:${userId}`;

/** Wipes every v2 key on this device (all users). Used on sign-out. */
export async function clearV2Keys(kv: KV) {
  try { const keys = await kv.getAllKeys(); await Promise.all(keys.filter((k) => k === V2_KEY_PREFIX || k.startsWith(V2_KEY_PREFIX + ':')).map((k) => kv.removeItem(k))); } catch {}
}

export interface ShownInsightView { id: number; tier: 'supported' | 'tentative' | 'hedged'; text: string; evidence: { independentN: number; promptedN: number; introducedN: number } }
export interface CompletionView { closing?: string; insight?: ShownInsightView }
export type TodayView =
  | { kind: 'rep'; payload: RepPayload; context: FlowContext; draft: StepAnswer[] }
  | ({ kind: 'done' } & CompletionView);
export type InsightFeedbackValue = 'accurate' | 'partly' | 'no' | 'unsure';

export class InvalidAnswerError extends Error { constructor(m: string) { super(m); this.name = 'InvalidAnswerError'; } }

const CAPACITY_LABEL: Record<Capacity, string> = { direction: 'Direction', energy: 'Energy', focus: 'Focus', relationships: 'Relationships', growth: 'Growth', action: 'Action' };

interface Persisted { v: 1; engineVersion: string; userSeed: number; state: State; draft: StepAnswer[]; savedAt: string }

export interface RuntimeDeps {
  storage: KV;
  now?: () => Date;
  /** integer day number for a moment; default = local civil days since 1970 (engine only uses differences) */
  dayNumber?: (d: Date) => number;
}

export const civilDay = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
/** ISO calendar date for a civil day number */
const isoOfDay = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
/** civil day number of a YYYY-MM-DD string, or null if it is not a real calendar date */
const dayOfIso = (v: unknown): number | null => { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null; const [y, m, d] = v.split('-').map(Number); const t = Date.UTC(y, m - 1, d); const x = new Date(t); return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? t / 86400000 : null; };
const hashSeed = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

const MAX_INSTANCES = 300, MAX_TRACES = 30, MAX_INSIGHTS = 100, OBS_KEEP_DAYS = 120;

export function createRuntime(deps: RuntimeDeps) {
  const now = deps.now ?? (() => new Date());
  const dayOf = deps.dayNumber ?? civilDay;
  let userId: string | null = null;
  let s: State = createState(0);
  let draft: StepAnswer[] = [];

  const ctxFor = (i: Instance): FlowContext => flowContext(s, i.day, i.templateId, i.frame, i.bound, V2, i.variant ?? 0, i.intentRef);
  const pending = () => s.instances.find((i) => !i.completed && !i.skippedAll && i.day === dayOf(now()))
    ?? undefined;
  const todayInstance = () => s.instances.find((i) => i.day === dayOf(now()));

  async function persist() {
    if (!userId) return;
    // storage-size housekeeping only; engine windows are far shorter than these limits
    const instances = s.instances.slice(-MAX_INSTANCES).map((i, k, a) => (k < a.length - MAX_TRACES ? { ...i, trace: undefined as unknown as Instance['trace'] } : i));
    const today = dayOf(now());
    const state: State = { ...s, instances, observations: s.observations.filter((o) => o.day > today - OBS_KEEP_DAYS), insights: s.insights.slice(-MAX_INSIGHTS) };
    const blob: Persisted = { v: 1, engineVersion: ENGINE_VERSION, userSeed: s.userSeed, state, draft, savedAt: now().toISOString() };
    try { await deps.storage.setItem(keyFor(userId), JSON.stringify(blob)); } catch { /* device storage unavailable: continue in memory; nothing is thrown into the UI */ }
  }

  function sanitize(step: Step, a: StepAnswer): StepAnswer {
    const id = step.id;
    switch (a.kind) {
      case 'option': { if (step.type !== 'choice' || !step.options.some((o) => o.id === a.optionId)) throw new InvalidAnswerError(`option not offered at ${id}`); return { stepId: id, kind: 'option', optionId: a.optionId }; }
      case 'unknown': { if (step.type !== 'choice') throw new InvalidAnswerError(`"I don't know" is only valid on a choice step (${id})`); return { stepId: id, kind: 'unknown' }; }
      case 'skip': { if (step.type === 'choice') throw new InvalidAnswerError(`a choice step cannot be skipped (${id}); use "I don't know"`); return { stepId: id, kind: 'skip' }; }
      case 'domain': { if (step.type !== 'domain_chips' || !step.domains.includes(a.domain)) throw new InvalidAnswerError(`domain not offered at ${id}`); return { stepId: id, kind: 'domain', domain: a.domain }; }
      case 'orientation': throw new InvalidAnswerError('orientation is disabled in the MVP');
      case 'timeframe': {
        if (step.type !== 'timeframe') throw new InvalidAnswerError(`timeframe not requested at ${id}`);
        if (a.timeframe === 'specific_date') {
          if (!step.options.includes('pick_date')) throw new InvalidAnswerError('a date was not offered');
          // MVP date contract: a real calendar date, strictly in the future. The UI never sends a numeric offset (any `inDays` it sends is ignored).
          const target = dayOfIso(a.date); if (target === null) throw new InvalidAnswerError('invalid calendar date');
          const inDays = target - civilDay(now()); if (inDays < 1) throw new InvalidAnswerError('date must be after today');
          return { stepId: id, kind: 'timeframe', timeframe: 'specific_date', date: a.date, inDays };
        }
        if (!(step.options as string[]).includes(a.timeframe)) throw new InvalidAnswerError(`timeframe ${a.timeframe} not offered`);
        return { stepId: id, kind: 'timeframe', timeframe: a.timeframe };
      }
      case 'yes': case 'no': { if (step.type !== 'yes_no') throw new InvalidAnswerError(`yes/no not requested at ${id}`); return { stepId: id, kind: a.kind }; }
      case 'words': { if (step.type !== 'words') throw new InvalidAnswerError(`words not requested at ${id}`); return { stepId: id, kind: 'words' }; } // payload-free by construction
      default: throw new InvalidAnswerError('unknown answer kind');
    }
  }
  /** Replays the answers through the engine's own step machine; rejects anything the engine would not have asked. */
  function validate(ctx: FlowContext, answers: StepAnswer[]): StepAnswer[] {
    const clean: StepAnswer[] = [];
    for (const a of answers) {
      const step = nextStep(ctx, clean);
      if (!step) throw new InvalidAnswerError('answer after the rep was already complete');
      if (a.stepId !== step.id) throw new InvalidAnswerError(`expected step ${step.id}, got ${a.stepId}`);
      clean.push(sanitize(step, a));
    }
    return clean;
  }

  /** The engine counts abstract days; keep the real calendar dates alongside (structured, no text). */
  function stampCommitmentDates() {
    for (const c of s.commitments) {
      // engine day n → calendar date, relative to today (correct whatever day numbering the engine was given)
      const dateFor = (n: number) => isoOfDay(civilDay(now()) + (n - dayOf(now())));
      if (c.dueDay !== undefined && c.dueDate === undefined) c.dueDate = dateFor(c.dueDay);
      if (c.postponedUntil !== undefined && c.status === 'postponed') c.postponedUntilDate = dateFor(c.postponedUntil);
    }
  }
  const toView = (i: { id: number; tier: ShownInsightView['tier']; text: string; snapshot: { independentN: number; promptedN: number; introducedN: number } }): ShownInsightView =>
    ({ id: i.id, tier: i.tier, text: i.text, evidence: { independentN: i.snapshot.independentN, promptedN: i.snapshot.promptedN, introducedN: i.snapshot.introducedN } });

  function doneView(): TodayView {
    const day = dayOf(now());
    // an insight already answered is not asked again after a reload
    const ins = [...s.insights].reverse().find((x) => x.day === day && !x.feedback);
    return { kind: 'done', insight: ins ? toView(ins) : undefined };
  }

  return {
    /** Load (or start) this user's structured state. Safe to call again; never throws into the UI. */
    async init(uid: string) {
      userId = uid; draft = [];
      try {
        const raw = await deps.storage.getItem(keyFor(uid));
        if (raw) { const p = JSON.parse(raw) as Persisted; if (p && p.v === 1 && p.state && Array.isArray(p.state.instances)) { s = p.state; s.userSeed = p.userSeed; draft = Array.isArray(p.draft) ? p.draft : []; } else s = createState(hashSeed(uid)); }
        else s = createState(hashSeed(uid));
      } catch { s = createState(hashSeed(uid)); }
      // an unfinished rep from an EARLIER day was abandoned: record it exactly as the simulator's abandon path does
      const today = dayOf(now());
      for (const i of s.instances) if (!i.completed && !i.skippedAll && i.day < today) { applyRep(s, i, ctxFor(i), [{ stepId: 'primary', kind: 'skip' }], V2); draft = []; }
      await persist();
    },

    /** What to show now. Serves (and records as pending) today's rep from the frozen engine on first call of the day. */
    today(): TodayView {
      if (!userId) throw new Error('runtime not initialised');
      const day = dayOf(now());
      const existing = todayInstance();
      if (existing && existing.completed) return doneView();
      let inst = pending();
      if (!inst) {
        const dec = decide(s, day, V2);
        if (dec.layer === 'rest' || !dec.templateId) return { kind: 'done' }; // rest is disabled in the shipping config; defensive only
        const t = TEMPLATE_BY_ID[dec.templateId];
        inst = { id: ++s.seq.inst, day, templateId: t.id, frame: dec.frame!, bound: dec.bound, capacity: t.capacity, mechanism: t.mechanism, intensity: t.intensity, layer: dec.layer, intent: dec.intent, intentRef: dec.intentRef, variant: dec.variant, trace: dec.trace, completed: false, unknownPrimary: false, burden: false, skippedAll: false };
        s.instances.push(inst); draft = [];
      }
      const t = TEMPLATE_BY_ID[inst.templateId];
      const payload: RepPayload = { instanceId: inst.id, templateId: t.id, frame: inst.frame, bound: inst.bound, ...(t.role === 'training' ? { capacityLabel: CAPACITY_LABEL[t.capacity] } : {}), intensity: t.intensity, estimatedSeconds: t.seconds, dismissible: true };
      return { kind: 'rep', payload, context: ctxFor(inst), draft: [...draft] };
    },

    /** Structured answers so far, for resuming an interrupted rep. Invalid/odd input is ignored, never stored. */
    async progress(answers: StepAnswer[]) {
      const inst = pending(); if (!inst) return;
      try { draft = validate(ctxFor(inst), answers); } catch { return; }
      await persist();
    },

    /** Finish the rep. Throws InvalidAnswerError for anything the engine did not ask for. */
    async complete(answers: StepAnswer[], _durationMs?: number): Promise<CompletionView> {
      const inst = pending(); if (!inst) throw new Error('no active rep');
      const ctx = ctxFor(inst); const clean = validate(ctx, answers);
      if (nextStep(ctx, clean)) throw new InvalidAnswerError('rep is not complete');
      const day = inst.day;
      applyRep(s, inst, ctx, clean, V2);
      stampCommitmentDates();
      draft = [];
      // same insight policy the simulator uses: at most one, only after a real (non-"I don't know") answer
      const ev = computeEvidence(s, day, V2);
      const { shown } = chooseInsight(s, ev.evidence, day, ev.tentativeMode, V2);
      let insight: ShownInsightView | undefined;
      if (shown && inst.completed && !inst.unknownPrimary) { const rec = { ...shown, id: ++s.seq.insight, day }; s.insights.push(rec); insight = toView(rec); }
      await persist();
      return { insight };
    },

    /** A safety stop: store nothing from this rep. The pending instance is removed; today's rep stays undone. */
    async discardForSafety() {
      const inst = pending(); if (inst) s.instances.splice(s.instances.indexOf(inst), 1);
      draft = []; await persist();
    },

    /** Honest Mirror feedback → the engine's own correction handling (suppression, withheld evidence, tentative mode). */
    async feedback(insightId: number, value: InsightFeedbackValue) {
      const ins = s.insights.find((x) => x.id === insightId); if (!ins) throw new Error('unknown insight');
      if (ins.feedback) return; // first answer stands
      if (!['accurate', 'partly', 'no', 'unsure'].includes(value)) throw new InvalidAnswerError('invalid feedback');
      applyFeedback(s, insightId, value, dayOf(now()), V2);
      await persist();
    },

    /**
     * Structured reason after "Partly". Qualifies Mirar's interpretation only. No text is accepted or stored.
     * Only valid once, only after Partly was recorded for that insight.
     */
    async correction(insightId: number, reason: CorrectionReason) {
      const ins = s.insights.find((x) => x.id === insightId); if (!ins) throw new Error('unknown insight');
      if (!CORRECTION_REASONS.some((r) => r.id === reason)) throw new InvalidAnswerError('invalid correction reason');
      if (ins.feedback?.value !== 'partly') throw new InvalidAnswerError('a correction only follows "Partly"');
      if (ins.correction) return;
      applyCorrection(s, insightId, reason, dayOf(now()));
      await persist();
    },

    practiceDaysThisMonth(): number {
      const t = now(); const set = new Set<number>();
      for (const i of s.instances) if (i.completed) { const d = new Date(i.day * 86400000); if (d.getUTCFullYear() === t.getFullYear() && d.getUTCMonth() === t.getMonth()) set.add(i.day); }
      return set.size;
    },

    /** Test/diagnostic access to the engine state (structured only). */
    _state: () => s,
    _draft: () => draft,
  };
}
export type V2Runtime = ReturnType<typeof createRuntime>;
