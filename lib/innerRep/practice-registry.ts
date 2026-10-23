import type { PilotId } from './pilots/types';

// Launch catalog (docs/release/LAUNCH_RELEASE_BOARD.md §6): one engine rep chosen by the frozen engine, plus two optional, person-initiated pilots.
// Pure data and pure functions; nothing here reaches the engine, the runtime or storage.
export type PracticeId = 'engine_rep' | PilotId;
export interface PracticeKind { id: PracticeId; label: string; startsTrial: boolean; memberGated: true; chosenBy: 'engine' | 'person'; feedsEngineEvidence: false }
export const PRACTICES: readonly PracticeKind[] = [
  { id: 'engine_rep', label: 'Daily practice', startsTrial: true, memberGated: true, chosenBy: 'engine', feedsEngineEvidence: false },
  { id: 'look_again', label: 'Look Again', startsTrial: false, memberGated: true, chosenBy: 'person', feedsEngineEvidence: false },
  { id: 'attend', label: 'Attend', startsTrial: false, memberGated: true, chosenBy: 'person', feedsEngineEvidence: false },
];
export const practice = (id: PracticeId) => PRACTICES.find((p) => p.id === id)!;
export const PILOT_ORDER: readonly PilotId[] = ['look_again', 'attend'];

export interface ShelfInput {
  /** the engine rep for today is complete (an offer never precedes it unless the person opens the shelf) */
  engineDoneToday: boolean;
  /** calendar day key, same format as PilotRecord.date */
  today: string;
  /** finished or left pilot sessions, any order */
  pilotRecords: { pilot: PilotId; date: string; status: 'completed' | 'left' }[];
  safetyStopToday: boolean;
  /** the engine is in ease/simplify mode (consecutive unanswered reps) */
  easeMode: boolean;
  unfinishedPilot: PilotId | null;
  /** entitlement allows member practice */
  allowed: boolean;
}
/**
 * At most one optional format, or null. Rules: only after today's engine rep; never after a safety stop, in ease mode, while a pilot is unfinished
 * (resume is offered elsewhere) or when access is denied; never a format completed today; never the format completed most recently; otherwise
 * the one completed longest ago (never-done first, fixed order as tie-break). Deterministic. No counts, streaks or "you haven't tried".
 */
export function shelfOffer(i: ShelfInput): PilotId | null {
  if (!i.engineDoneToday || !i.allowed || i.safetyStopToday || i.easeMode || i.unfinishedPilot) return null;
  const done = i.pilotRecords.filter((r) => r.status === 'completed');
  const last = (p: PilotId) => done.filter((r) => r.pilot === p).map((r) => r.date).sort().pop() ?? '';
  const doneToday = new Set(done.filter((r) => r.date === i.today).map((r) => r.pilot));
  const mostRecent = [...done].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).pop()?.pilot ?? null;
  const cands = PILOT_ORDER.filter((p) => !doneToday.has(p) && p !== mostRecent);
  if (!cands.length) return null;
  return [...cands].sort((a, b) => (last(a) < last(b) ? -1 : last(a) > last(b) ? 1 : PILOT_ORDER.indexOf(a) - PILOT_ORDER.indexOf(b)))[0];
}
