// Mirror read model: facts only, derived from completed training reps and open commitments. No text, no ranking.
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { createRuntime, KV } from '../../lib/innerRep/runtime/v2-runtime';

class MemKV implements KV { m = new Map<string, string>(); async getItem(k: string) { return this.m.get(k) ?? null; } async setItem(k: string, v: string) { this.m.set(k, v); } async removeItem(k: string) { this.m.delete(k); } async getAllKeys() { return [...this.m.keys()]; } }
let fails = 0; const check = (name: string, ok: boolean) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${name}`); if (!ok) fails++; };

(async () => {
  const kv = new MemKV(); let k = 0; const base = new Date(2026, 9, 1);
  const r = createRuntime({ storage: kv, now: () => new Date(base.getFullYear(), base.getMonth(), base.getDate() + k, 10) });
  await r.init('u1');
  check('empty before any rep', r.mirrorFacts().capacities.length === 0 && r.mirrorFacts().carrying.length === 0);
  for (k = 0; k < 6; k++) {
    const td = r.today(); if (td.kind !== 'rep') continue;
    const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; const o: any = (st as any).options?.[0]; a.push(st.kind === 'choice' ? ({ stepId: st.id, kind: 'choice', optionId: o.id } as any) : ({ stepId: st.id, kind: st.kind, skipped: true } as any)); }
    try { await r.complete(a, 1000); } catch { /* answer shapes beyond choice are not needed here */ }
  }
  const f = r.mirrorFacts();
  check('capacities listed are practised (reps>0)', f.capacities.every((c) => c.reps > 0));
  check('alphabetical, no ranking', f.capacities.map((c) => c.label).join() === [...f.capacities.map((c) => c.label)].sort().join());
  check('no free text or insight fields in the model', !JSON.stringify(f).match(/insight|text|note|words/i));
  process.exit(fails ? 1 : 0);
})();
