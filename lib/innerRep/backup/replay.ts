import { civilDay, createRuntime, KV, V2Runtime } from '../runtime/v2-runtime';
import { BackupEvent } from './events';
import { fromWire } from './recorder';

// Event replay through the FROZEN engine runtime. LOCAL, NON-PERSISTENT PROTOTYPE.
export class ReplayDriftError extends Error { constructor(m: string) { super(m); this.name = 'ReplayDriftError'; } }
export class MemKV implements KV { m = new Map<string, string>(); async getItem(k: string) { return this.m.get(k) ?? null; } async setItem(k: string, v: string) { this.m.set(k, v); } async removeItem(k: string) { this.m.delete(k); } async getAllKeys() { return [...this.m.keys()]; } }

const at = (iso: string, plusDays = 0) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d + plusDays, 12); };

/**
 * Rebuilds a runtime from an ordered event log. The runtime must be created by the caller with `clock` as its `now` so the
 * replay can move the engine's calendar to each event's day. Throws ReplayDriftError if the engine would not have served the
 * recorded template (engine version drift or a corrupt log): the caller must then refuse to restore and offer export instead.
 */
export async function applyEvent(rt: V2Runtime, clock: { d: Date }, uid: string, e: BackupEvent, engine: string): Promise<void> {
  if (e.engine !== engine) throw new ReplayDriftError(`event engine ${e.engine} differs from ${engine}`);
  clock.d = at(e.day);
  if (e.kind === 'rep_completed' || e.kind === 'rep_abandoned') {
    const t = rt.today();
    if (t.kind !== 'rep') throw new ReplayDriftError(`no rep served on ${e.day}`);
    if (t.payload.templateId !== e.template) throw new ReplayDriftError(`${e.day}: engine serves ${t.payload.templateId}, log says ${e.template}`);
    if (e.kind === 'rep_completed') {
      if (t.payload.frame !== e.frame || (t.payload.bound ?? undefined) !== (e.bound ?? undefined)) throw new ReplayDriftError(`${e.day}: frame/domain differ`);
      try { await rt.complete(e.answers.map(fromWire)); } catch (err) { throw new ReplayDriftError(`${e.day}: the engine would not accept these answers (${(err as Error).message})`); }
    } else { await rt.progress([]); clock.d = at(e.day, 1); await rt.init(uid); }   // S1a: the live host persists a rep when it is served (lib/innerRep/runtime/serve.ts); the replay does the same, so the next time the app opens the runtime records the unfinished rep as abandoned exactly as it did live
  } else {
    const ins = rt._state().insights.find((i) => new Date(i.day * 86400000).toISOString().slice(0, 10) === e.insightDay);
    if (!ins) throw new ReplayDriftError(`${e.day}: no insight on ${e.insightDay}`);
    try { if (e.kind === 'feedback') await rt.feedback(ins.id, e.value); else await rt.correction(ins.id, e.reason as never); } catch (err) { throw new ReplayDriftError(`${e.day}: ${(err as Error).message}`); }
  }
}
export async function replayInto(rt: V2Runtime, clock: { d: Date }, uid: string, events: BackupEvent[], engine: string): Promise<void> {
  await rt.init(uid);
  let lastDay = '';
  for (const e of events) { if (e.day < lastDay) throw new ReplayDriftError('events are not in non-decreasing day order'); lastDay = e.day; await applyEvent(rt, clock, uid, e, engine); }
}

/** Convenience: replay into a fresh in-memory runtime and return it. */
export async function replayFresh(uid: string, events: BackupEvent[], engine: string): Promise<{ rt: V2Runtime; clock: { d: Date } }> {
  const clock = { d: new Date() }; const rt = createRuntime({ storage: new MemKV(), now: () => clock.d });
  await replayInto(rt, clock, uid, events, engine);
  return { rt, clock };
}
export { civilDay };
