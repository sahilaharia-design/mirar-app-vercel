import { CATALOG, CATALOG_BY_ID } from './catalog';
import { ENGINE_CONFIG, EngineConfig } from './config';
import { Exercise, RepRecord } from './types';

// ─── Today's decision ─────────────────────────────────────────────────────────
// The question is not "which rep next?" but "what, if anything, is most useful
// to exercise today?". decideToday returns a Decision, which may be "no rep".
// Every candidate carries its score terms so the choice can be explained.
// Pure + deterministic per (history, day). All numbers come from config.ts.

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAY_MS = 86400000;

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

const chosenIds = (rec: RepRecord) => [rec.answer.primary, rec.answer.followUp].filter(Boolean) as string[];

/** Did this completed rep involve an option marked as a burden? */
export function repHadBurden(rec: RepRecord): boolean {
  const ex = CATALOG_BY_ID[rec.exerciseId];
  if (!ex) return false;
  const opts = [...(ex.options ?? []), ...(ex.statements ?? []), ...(ex.follow_up?.options ?? [])];
  const chosen = chosenIds(rec);
  return opts.some((o) => o.burden && chosen.includes(o.id));
}

export interface ScoreTerm { factor: string; delta: number }
export interface Candidate { exercise: Exercise; score: number; terms: ScoreTerm[] }

export type DecisionKind =
  | 'fresh'          // nothing recent argues for anything in particular
  | 'continuation'   // recent days point at this capacity — stay with it
  | 'follow_through' // an open commitment is due to be revisited
  | 'recovery'       // go light after a heavy day or "I don't know" run
  | 'rest';          // nothing needs examining today (no exercise served)

export type Decision =
  | { kind: Exclude<DecisionKind, 'rest'>; exercise: Exercise; score: number; reasons: string[]; candidates: Candidate[] }
  | { kind: 'rest'; reasons: string[] };

/** Open commitment state, derived from history only. */
export function openCommitment(sorted: RepRecord[], now: Date, cfg: EngineConfig = ENGINE_CONFIG) {
  const ft = cfg.followThrough;
  const idx = sorted.findIndex((r) => r.exerciseId === ft.exerciseId);
  if (idx === -1) return null;
  const rec = sorted[idx]; // the most recent follow-through answer decides
  if (!rec.answer.primary || !ft.openAnswerIds.includes(rec.answer.primary)) return null;
  const ageDays = Math.floor((now.getTime() - new Date(rec.completedAt).getTime()) / DAY_MS);
  return { rec, ageDays, due: ageDays >= ft.minDaysBeforeResurface };
}

/** Count of recent reps (within relevance.recentDays) carrying a burden in `capacity`. */
function recentBurdenReps(sorted: RepRecord[], capacity: string, now: Date, cfg: EngineConfig) {
  const cutoff = now.getTime() - cfg.relevance.recentDays * DAY_MS;
  return sorted.filter((r) => r.capacity === capacity && new Date(r.completedAt).getTime() >= cutoff && repHadBurden(r)).length;
}

function consecutiveSameCapacity(sorted: RepRecord[]) {
  let n = 0;
  for (const r of sorted) { if (sorted[0] && r.capacity === sorted[0].capacity) n++; else break; }
  return n;
}

export function decideToday(
  history: RepRecord[],
  now: Date = new Date(),
  catalog: Exercise[] = CATALOG,
  cfg: EngineConfig = ENGINE_CONFIG
): Decision {
  const w = cfg.weights;
  const sorted = [...history].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1)); // newest first
  const n = sorted.length;
  const last = sorted[0];
  const today = dayKey(now);
  const lastIndexOf = (pred: (r: RepRecord) => boolean) => sorted.findIndex(pred);

  const lastHeavy = !!last && repHadBurden(last);
  const unknownRun = sorted.slice(0, cfg.ease.unknownRunLength);
  const unknownStreak = unknownRun.length === cfg.ease.unknownRunLength && unknownRun.every((r) => r.answer.unknown);
  const needsEase = lastHeavy || unknownStreak;

  const commit = openCommitment(sorted, now, cfg);
  const commitDue = !!commit?.due;

  // Relevance: which capacity do the last few days point at?
  let relevantCapacity: string | null = null;
  if (last && consecutiveSameCapacity(sorted) < cfg.relevance.maxConsecutiveSameCapacity) {
    if (recentBurdenReps(sorted, last.capacity, now, cfg) >= cfg.relevance.minBurdenReps) relevantCapacity = last.capacity;
  }

  // "Nothing needs examining today": calm run, nothing open, nothing continuing.
  if (cfg.rest.enabled && n >= cfg.rest.calmRunLength && !commitDue && !relevantCapacity) {
    const calm = sorted.slice(0, cfg.rest.calmRunLength).every((r) => !repHadBurden(r) && !r.answer.unknown);
    if (calm) return { kind: 'rest', reasons: [`last ${cfg.rest.calmRunLength} reps carried no burden`, 'no open commitment', 'nothing continuing'] };
  }

  const score = (ex: Exercise): Candidate => {
    const terms: ScoreTerm[] = [];
    const add = (factor: string, delta: number) => { if (delta !== 0) terms.push({ factor, delta }); };

    const capPos = lastIndexOf((r) => r.capacity === ex.capacity);
    if (capPos === -1) add('capacity not yet practised', w.capacityFresh);
    else if (capPos === 0) {
      if (relevantCapacity === ex.capacity) add('recent days point here (continuation)', w.continuation);
      else add('same capacity as last rep (nothing makes it relevant)', w.capacitySameAsLast);
    } else if (capPos === 2) add('capacity rested 3 reps', w.capacityRested3);
    else if (capPos >= 3) add('capacity rested 4+ reps', w.capacityRested4plus);

    if (last && last.interactionType === ex.interaction_type) add('same format as last rep', w.formatSameAsLast);
    else if (sorted[1] && sorted[1].interactionType === ex.interaction_type) add('same format two reps ago', w.formatSameTwoBack);
    if (sorted.slice(0, cfg.windows.formatLookback).filter((r) => r.interactionType === ex.interaction_type).length >= cfg.windows.formatSaturationCount)
      add('format saturated lately', w.formatSaturated);

    const recentHeavier = sorted.slice(0, cfg.windows.intensityLookback).filter((r) => r.intensity !== 'light').length;
    if (recentHeavier >= 1 && ex.intensity === 'light') add('lighter after a heavier rep', w.lighterAfterHeavier);
    if (recentHeavier === 0 && ex.intensity === 'medium') add('medium when nothing recent was heavy', w.mediumWhenFresh);
    if (ex.intensity === 'deep' && n < cfg.windows.deepMinHistory) add('deep rep too early', w.deepTooEarly);

    if (needsEase) {
      if (ex.positive_state_compatible && ex.intensity === 'light') add('gentle after a heavy day / "I don\'t know" run', w.easeGentle);
      if (ex.sensitivity !== 'low') add('sensitive rep during ease', w.easeSensitivePenalty);
      if (ex.action_oriented && !commitDue) add('action-oriented rep during ease', w.easeActionPenalty);
    }

    const recentPositive = sorted.slice(0, cfg.windows.positiveLookback).some((r) => (CATALOG_BY_ID[r.exerciseId]?.tags ?? []).includes('positive'));
    if (!recentPositive && ex.tags.includes('positive')) add('no positive rep lately', w.positiveMix);

    if (commitDue && ex.id === cfg.followThrough.exerciseId) add('open commitment is due', w.followThroughRevisit);

    if (n === 0 && ex.id === cfg.coldStart.preferredExerciseId) add('cold start: preferred first rep', w.coldStartPreferred);
    if (n < cfg.windows.coldStartReps && ex.id === cfg.coldStart.neutralExerciseId) add('cold start: not a first impression', w.coldStartNeutralPenalty);

    add('daily tie-break', (hash01(today + ex.id) * cfg.jitterMax));
    return { exercise: ex, score: terms.reduce((a, t) => a + t.delta, 0), terms };
  };

  const inWindow = (ex: Exercise) => {
    const pos = lastIndexOf((r) => r.exerciseId === ex.id);
    if (pos === -1 || pos >= ex.repetition_window) return false;
    if (ex.id === cfg.followThrough.exerciseId && commitDue) return false; // due follow-up may return early
    return true;
  };

  let pool = catalog.filter((ex) => ex.minimum_history <= n && !inWindow(ex));
  if (pool.length === 0) pool = catalog.filter((ex) => ex.minimum_history <= n);
  if (pool.length === 0) pool = catalog;

  const candidates = pool.map(score).sort((a, b) => b.score - a.score);
  const top = candidates[0];
  const has = (f: string) => top.terms.some((t) => t.factor.startsWith(f));
  const kind: Exclude<DecisionKind, 'rest'> =
    has('open commitment') ? 'follow_through'
    : has('recent days point here') ? 'continuation'
    : has('gentle after') ? 'recovery'
    : 'fresh';
  return {
    kind, exercise: top.exercise, score: Math.round(top.score * 100) / 100,
    reasons: top.terms.filter((t) => t.factor !== 'daily tie-break' && t.delta !== 0).map((t) => `${t.delta > 0 ? '+' : ''}${t.delta} ${t.factor}`),
    candidates,
  };
}

// Back-compat wrapper for the store: always returns a rep (rest is disabled in
// the UI until its UX is reviewed). If the engine ever says "rest", fall back
// to the best candidate with rest turned off.
export interface Selection { exercise: Exercise; score: number; reasons: string[] }
export function selectExercise(history: RepRecord[], now: Date = new Date(), catalog: Exercise[] = CATALOG): Selection {
  const d = decideToday(history, now, catalog, { ...ENGINE_CONFIG, rest: { ...ENGINE_CONFIG.rest, enabled: false } });
  if (d.kind === 'rest') throw new Error('unreachable: rest disabled');
  return { exercise: d.exercise, score: d.score, reasons: d.reasons };
}
