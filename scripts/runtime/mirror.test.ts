// Mirror read model: facts only, derived from completed training reps and open commitments. No text, no ranking.
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { DEFAULT_TRAITS, PROFILES } from '../sim/profiles';
import { respond } from '../sim/runner';
import { rng } from '../sim/rng';
import { createRuntime, KV } from '../../lib/innerRep/runtime/v2-runtime';

class MemKV implements KV { m = new Map<string, string>(); async getItem(k: string) { return this.m.get(k) ?? null; } async setItem(k: string, v: string) { this.m.set(k, v); } async removeItem(k: string) { this.m.delete(k); } async getAllKeys() { return [...this.m.keys()]; } }
let fails = 0; const check = (name: string, ok: boolean) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${name}`); if (!ok) fails++; };

(async () => {
  const prof = PROFILES.find((x) => x.id === 'stable')!; const rr = rng(7); const tr = { ...DEFAULT_TRAITS, commit: { ...DEFAULT_TRAITS.commit } };
  const kv = new MemKV(); let k = 0; const base = new Date(2026, 9, 1);
  const r = createRuntime({ storage: kv, now: () => new Date(base.getFullYear(), base.getMonth(), base.getDate() + k, 10) });
  await r.init('u1');
  check('empty before any rep', r.mirrorFacts().capacities.length === 0 && r.mirrorFacts().carrying.length === 0);
  for (k = 0; k < 6; k++) {
    const td = r.today(); if (td.kind !== 'rep') continue;
    const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; a.push(respond(st, td.context, prof.latent(k), tr, rr, k, prof)); }
    await r.complete(a, 1000);
  }
  const f = r.mirrorFacts();
  check('capacities listed are practised (reps>0)', f.capacities.every((c) => c.reps > 0));
  check('alphabetical, no ranking', f.capacities.map((c) => c.label).join() === [...f.capacities.map((c) => c.label)].sort().join());
  check('no free text or insight fields in the model', !JSON.stringify(f).match(/insight|text|note|words/i));
  process.exit(fails ? 1 : 0);
})();
