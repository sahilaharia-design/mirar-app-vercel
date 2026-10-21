import type { TodayView, V2Runtime } from './v2-runtime';

// ─── S1a: persist-on-serve (host-side helper; the engine and the runtime module are NOT changed) ────────────────────────────────────
// Problem (verified, docs/product/MIRAR_VALUE_REALIGNMENT_SPEC.md §0 and scripts/sim/persist-trigger-eval.ts): `runtime.today()` serves a rep in
// memory but does not persist it. A person who reads the question and leaves therefore leaves no trace; the next day the engine decides again
// from the same history and serves the same exercise. The runtime's EXISTING `progress([])` persists the pending instance with an empty draft
// (validate([]) is accepted; the UI shows no "Resume"), so the next time the app opens the runtime records the unfinished rep as skipped, as it
// already does for a rep left after a first answer. This helper makes the host call it once per served rep.
//
// Rules:
//  • only for a rep that has just been served and has no draft yet (a real answer already persisted it);
//  • once per served instance per account and calendar day (the guard), so repeated focus events write nothing;
//  • NEVER after a safety stop on that day: a safety stop records nothing and leaves no marker, exactly as shipped;
//  • no content is involved: the persisted fact is "this exercise was shown and not started".
export interface ServedGuard { key: string | null; /** calendar-day key on which a safety stop happened; persist-on-serve is suppressed for that day */ safetyDay: string | null }
export const newServedGuard = (): ServedGuard => ({ key: null, safetyDay: null });
export const resetServedGuard = (g: ServedGuard) => { g.key = null; g.safetyDay = null; };

export async function recordServed(rt: Pick<V2Runtime, 'progress'>, td: TodayView, g: ServedGuard, ctx: { userId: string; dayKey: string }): Promise<boolean> {
  if (td.kind !== 'rep') return false;                       // already completed today: nothing is pending
  if (g.safetyDay === ctx.dayKey) return false;              // after a safety stop: persist nothing, record nothing
  if (td.draft.length > 0) return false;                     // a real answer has already persisted the instance
  const key = `${ctx.userId}|${ctx.dayKey}|${td.payload.instanceId}`;
  if (g.key === key) return false;
  await rt.progress([]);
  g.key = key;
  return true;
}
