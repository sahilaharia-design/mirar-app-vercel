// Shared fixtures for the Option B prototype tests: a synthetic user driven through the REAL runtime with the recorder attached.
import { DEFAULT_TRAITS, PROFILES } from '../sim/profiles';
import { respond } from '../sim/runner';
import { rng } from '../sim/rng';
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { ENGINE_VERSION } from '../../lib/innerRep/v2/config';
import { createRuntime } from '../../lib/innerRep/runtime/v2-runtime';
import { buildVocabulary, BackupEvent, CORRECTION_IDS, FEEDBACK_VALUES } from '../../lib/innerRep/backup/events';
import { recordRuntime } from '../../lib/innerRep/backup/recorder';
import { MemKV } from '../../lib/innerRep/backup/replay';
export { PROFILES, ENGINE_VERSION };
export const check = (fails: { n: number }) => (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails.n++; };
export const base = new Date(2026, 5, 1);
export const at = (k: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + k, 10);
export const VOCAB = buildVocabulary(ENGINE_VERSION);

export interface Run { rt: ReturnType<typeof recordRuntime>; journal: BackupEvent[]; lastDay: number; counts: Record<string, number>; uid: string }
/** Drives a synthetic user through the REAL runtime (recorder attached). Includes serve-and-leave days (abandonment), feedback, corrections and optionally safety stops. */
export async function runUser(pid: string, seed: number, o: { safety: boolean }): Promise<Run> {
  const p = PROFILES.find((x) => x.id === pid)!; const rr = rng(p.seed * 1000 + seed); const uid = `${pid}-${seed}`;
  const tr = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
  let k = 0; const clock = () => at(k);
  const rt = recordRuntime(createRuntime({ storage: new MemKV(), now: clock }), { engine: ENGINE_VERSION, now: clock });
  const counts = { rep: 0, abandoned: 0, feedback: 0, correction: 0, safety: 0 };
  await rt.init(uid);
  for (k = 0; k < p.days; k++) {
    await rt.init(uid);
    if (!p.engage(k, rr)) continue;
    const td = rt.today(); if (td.kind !== 'rep') continue;
    const roll = rr();
    if (roll < tr.abandon * 4) { counts.abandoned++; continue; }                         // opened, served, left: abandoned when the app next opens
    if (o.safety && roll > 0.97) { await rt.discardForSafety(); counts.safety++; continue; }
    const a: StepAnswer[] = [];
    for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; let x: any = respond(st, td.context, p.latent(k), tr, rr, k, p); if (x.kind === 'timeframe' && x.timeframe === 'specific_date') x = { stepId: x.stepId, kind: 'timeframe', timeframe: 'specific_date', date: new Date(base.getFullYear(), base.getMonth(), base.getDate() + k + 3).toISOString().slice(0, 10) }; a.push(x); }
    const res = await rt.complete(a, 1000); counts.rep++;
    if (res.insight) {
      const rec = rt._state().insights.find((i) => i.id === res.insight!.id)!; let fb: string | null = p.feedback?.(rec, rr) ?? null; if (!fb && rr() < 0.6) fb = FEEDBACK_VALUES[Math.floor(rr() * FEEDBACK_VALUES.length)];
      if (fb) { await rt.feedback(rec.id, fb as any); counts.feedback++; if (fb === 'partly' && rr() < 0.7) { await rt.correction(rec.id, CORRECTION_IDS[Math.floor(rr() * CORRECTION_IDS.length)] as any); counts.correction++; } }
    }
  }
  k = p.days; await rt.init(uid);                                                            // the app opens once more: any unfinished last rep is abandoned
  return { rt, journal: rt.journal(), lastDay: p.days, counts, uid };
}
export const sameJSON = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Durable-history equivalence ignores Instance.trace: it is the engine's explanatory diagnostics, which the runtime strips from its stored copy at every reload, so it legitimately differs between devices. */
export const noTrace = (s: any) => ({ ...s, instances: s.instances.map((i: any) => ({ ...i, trace: undefined })) });
/** Behavioural equivalence additionally ignores internal instance numbering (a removed safety-stop instance leaves a gap). */
export const ID_KEYS = new Set(['id', 'instanceId', 'seq', 'intentRef', 'lastProbeInstance', 'trace']);
export const noIds = (s: any): any => Array.isArray(s) ? s.map(noIds) : s && typeof s === 'object' ? Object.fromEntries(Object.entries(s).filter(([k]) => !ID_KEYS.has(k)).map(([k, v]) => [k, noIds(v)])) : s;

