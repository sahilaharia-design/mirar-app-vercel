// Review-state builder (development / staging only). Simulates a synthetic user through the REAL runtime adapter up to
// yesterday, so that "today" serves a chosen contract path. Used by scripts/runtime/scenarios.ts and the gated review panel.
import { DEFAULT_TRAITS, PROFILES } from '../sim/profiles';
import { respond } from '../sim/runner';
import { rng } from '../sim/rng';
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { createRuntime, KV } from '../../lib/innerRep/runtime/v2-runtime';

class MemKV implements KV { m = new Map<string, string>(); async getItem(k: string) { return this.m.get(k) ?? null; } async setItem(k: string, v: string) { this.m.set(k, v); } async removeItem(k: string) { this.m.delete(k); } async getAllKeys() { return [...this.m.keys()]; } }
export const UID = 'mock-user-0000-0000-000000000001';
const real = new Date(); const base = new Date(real.getFullYear(), real.getMonth(), real.getDate());
const at = (j: number, k: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() - j + k, 10, 0, 0);

// the simulator's responder still speaks the engine-internal offset; the product contract sends a real date
const fixDate = (a: StepAnswer, k: number, j: number): StepAnswer => (a.kind === 'timeframe' && a.timeframe === 'specific_date' ? ({ stepId: a.stepId, kind: 'timeframe', timeframe: 'specific_date', date: (() => { const d = at(j, k + (a.inDays ?? 3)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })() } as StepAnswer) : a);
export interface Want { name: string; match: (t: any) => boolean; insight?: boolean; profiles?: string[] }
export const WANTS: Want[] = [
  { name: 'fresh_choice', match: (t) => t.payload.templateId === 'foc_attention', profiles: ['stable'] },
  { name: 'compare', match: (t) => ['foc_settle', 'en_pace', 'gro_mistake', 'dir_know_act'].includes(t.payload.templateId) },
  { name: 'words', match: (t) => t.payload.templateId === 'rel_appreciation' },
  { name: 'followup', match: (t) => ['rel_boundary', 'act_credit'].includes(t.payload.templateId) },
  { name: 'timeframe', match: (t) => ['act_tiny', 'rel_connect'].includes(t.payload.templateId) },
  { name: 'capture', match: (t) => ['foc_attention', 'foc_loops', 'dir_fits', 'dir_time', 'act_friction'].includes(t.payload.templateId) && t.payload.frame === 'base' },
  { name: 'open_question', match: (t) => t.payload.templateId === 'probe_anchor' },
  { name: 'commitment_check', match: (t) => t.payload.frame === 'commitment_check', profiles: ['committer'] },
  { name: 'thread_check', match: (t) => t.payload.frame === 'thread_check', profiles: ['work_stress', 'relationship_conflict'] },
  { name: 'lens', match: (t) => t.payload.frame === 'lens', profiles: ['work_stress', 'relationship_conflict', 'sel_bias_A'] },
  { name: 'event_check', match: (t) => t.payload.frame === 'event_check', profiles: ['relationship_conflict', 'high_burden'] },
  { name: 'resolution', match: (t) => t.payload.frame === 'resolution', profiles: ['sel_bias_B', 'relationship_conflict'] },
  { name: 'insight', match: () => true, insight: true, profiles: ['work_stress', 'relationship_conflict', 'family_past', 'sel_bias_A'] },
];

export async function build(w: Want) {
  const profs = (w.profiles ?? PROFILES.filter((p) => p.days === 30).map((p) => p.id)).map((id) => PROFILES.find((p) => p.id === id)!);
  for (const p of profs) for (let seed = 1; seed <= 8; seed++) for (let j = 4; j <= 40; j++) {
    const kv = new MemKV(); const sd = p.seed * 1000 + seed; const rr = rng(sd);
    const tr = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
    let k = 0; const r = createRuntime({ storage: kv, now: () => at(j, k) }); await r.init(UID);
    for (k = 0; k < j; k++) {
      if (!p.engage(k, rr)) continue; const td = r.today(); if (td.kind !== 'rep') continue;
      const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; a.push(fixDate(respond(st, td.context, p.latent(k), tr, rr, k, p), k, j)); }
      const c = await r.complete(a); if (c.insight) { const f = rr() < 0.5 ? 'accurate' : 'unsure'; await r.feedback(c.insight.id, f as any); }
    }
    k = j; const td = r.today(); if (td.kind !== 'rep') continue;
    if (!w.match(td)) continue;
    if (w.insight) { // would answering today's rep like this user produce an insight?
      const snap = new Map(kv.m); const kv2 = new MemKV(); snap.forEach((v, key) => kv2.m.set(key, v)); const r2 = createRuntime({ storage: kv2, now: () => at(j, j) }); await r2.init(UID); const t2 = r2.today(); if (t2.kind !== 'rep') continue;
      const rr2 = rng(sd + 99); const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(t2.context, a); if (!st) break; a.push(fixDate(respond(st, t2.context, p.latent(j), tr, rr2, j, p), j, j)); }
      const c2 = await r2.complete(a); if (!c2.insight) continue;
      const blob = [...snap.values()][0]; return { name: w.name, profile: p.id, seed, startOffsetDays: j, templateId: td.payload.templateId, frame: td.payload.frame, bound: td.payload.bound, blob, answers: a, insightText: c2.insight.text };
    }
    // the blob must be the state BEFORE today's rep (today() does not persist), so re-read it
    return { name: w.name, profile: p.id, seed, startOffsetDays: j, templateId: td.payload.templateId, frame: td.payload.frame, bound: td.payload.bound, blob: [...kv.m.values()][0] };
  }
  return null;
}
