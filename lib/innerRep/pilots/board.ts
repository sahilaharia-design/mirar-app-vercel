import { PULLS, attendFacts, pullsOf } from './attend';
import type { PilotSession } from './session';
import type { Disposition, PAnswer, SetAsideWhen } from './types';

/**
 * ATTEND BOARD ADAPTER. Lets a spatial interface (all pulls visible at once, each placed in one of four places) drive the
 * real, sequential Attend steps. It adds NO rules to the runtime: the arrangement is replayed through session.answer(), which
 * validates every placement exactly as the step-by-step flow does. A rejected arrangement leaves the session untouched
 * (the replay runs on a clone first).
 *
 * The one convenience it provides: moving a second pull into "attend now" moves the earlier holder to "leave open" and says
 * which one moved (normalizeArrangement), instead of refusing. That mirrors the runtime rule (one attend-now) so the
 * arrangement the UI builds is always one the runtime accepts; the runtime remains the authority and is tested to agree.
 */
export interface BoardEntry { disposition: Disposition; when?: SetAsideWhen }
export type Arrangement = Record<string, BoardEntry>;
export interface BoardPull { id: string; label: string }

/** The pulls awaiting placement, in the order the session will ask for them. Null unless the session is at the placement stage. */
export function boardPulls(s: PilotSession): BoardPull[] | null {
  const st = s.step(); if (!st || !st.id.startsWith('place:')) return null;
  return pullsOf(s.context, s.snapshot().answers).map((id) => ({ id, label: PULLS.find((p) => p.id === id)?.label ?? id }));
}
export function emptyArrangement(pulls: BoardPull[]): Arrangement { return Object.fromEntries(pulls.map((p) => [p.id, { disposition: 'leave_open' as Disposition }])); }

export function normalizeArrangement(a: Arrangement, pull: string, entry: BoardEntry): { arrangement: Arrangement; moved: string | null } {
  const next: Arrangement = { ...a }; let moved: string | null = null;
  if (entry.disposition === 'attend_now') for (const [id, e] of Object.entries(next)) if (id !== pull && e.disposition === 'attend_now') { next[id] = { disposition: 'leave_open' }; moved = id; }
  next[pull] = entry.disposition === 'set_aside' ? { disposition: 'set_aside', when: entry.when ?? 'no_time_set' } : { disposition: entry.disposition };
  return { arrangement: next, moved };
}

function replay(s: PilotSession, a: Arrangement): void {
  for (let guard = 0; guard < 40; guard++) {
    const st = s.step(); if (!st || !(st.id.startsWith('place:') || st.id.startsWith('when:'))) return;
    const [kind, pull] = st.id.split(':'); const e = a[pull]; if (!e) throw new Error(`no placement for ${pull}`);
    const ans: PAnswer = kind === 'place'
      ? (e.disposition === 'unknown' ? { stepId: st.id, kind: 'unknown' } : { stepId: st.id, kind: 'option', optionId: e.disposition })
      : { stepId: st.id, kind: 'option', optionId: e.when ?? 'no_time_set' };
    s.answer(ans);
  }
}
/** Replays the arrangement into the session. Returns ok:false with the runtime's own reason and leaves the session unchanged. */
export function submitArrangement(s: PilotSession, a: Arrangement): { ok: true } | { ok: false; error: string } {
  try { const trial = s.clone(); replay(trial, a); } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'rejected' }; }
  replay(s, a); return { ok: true };
}

/** After "Rearrange it": the arrangement the person had before, so they adjust it instead of starting over. Null if never rearranged. */
export function previousArrangement(s: PilotSession): Arrangement | null {
  const answers = s.snapshot().answers; const i = answers.findIndex((a) => a.stepId === 'rearrange' && a.kind === 'option' && a.optionId === 'rearrange');
  if (i < 0) return null;
  const f = attendFacts(s.context, answers.slice(0, i)); const out: Arrangement = {};
  for (const d of f.dispositions) out[d.pull] = d.when ? { disposition: d.disposition, when: d.when } : { disposition: d.disposition };
  return out;
}
