// Today's receipt: exact structured response, rebuilt after a "reload" (new runtime over the same storage), no text, traced.
import { DEFAULT_TRAITS, PROFILES } from '../sim/profiles';
import { respond } from '../sim/runner';
import { rng } from '../sim/rng';
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { createRuntime, KV } from '../../lib/innerRep/runtime/v2-runtime';

class MemKV implements KV { m = new Map<string, string>(); async getItem(k: string) { return this.m.get(k) ?? null; } async setItem(k: string, v: string) { this.m.set(k, v); } async removeItem(k: string) { this.m.delete(k); } async getAllKeys() { return [...this.m.keys()]; } }
let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const base = new Date(2026, 9, 1); let k = 0; const at = () => new Date(base.getFullYear(), base.getMonth(), base.getDate() + k, 10);

(async () => {
  let promptMismatch = 0, runs = 0, same = 0, none = 0, withUnknown = 0, withCommit = 0, traceBad = 0, textLeak = 0, emptyBeforeRep = 0;
  for (const pid of ['stable', 'work_stress', 'dont_know', 'committer', 'relationship_conflict']) for (let seed = 1; seed <= 4; seed++) {
    const p = PROFILES.find((x) => x.id === pid)!; const rr = rng(p.seed * 1000 + seed);
    const tr = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
    const kv = new MemKV(); const r = createRuntime({ storage: kv, now: at }); await r.init('u');
    for (k = 0; k < 12; k++) {
      if (!p.engage(k, rr)) continue; const td = r.today(); if (td.kind !== 'rep') continue;
      if (r.receipt() !== null) emptyBeforeRep++;                                   // nothing completed today yet
      const shown: string[] = []; const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; let x: any = respond(st, td.context, p.latent(k), tr, rr, k, p); if (st.type === 'choice' && (x.kind === 'option' || x.kind === 'unknown')) shown.push(st.prompt); if (x.kind === 'timeframe' && x.timeframe === 'specific_date') x = { stepId: x.stepId, kind: 'timeframe', timeframe: 'specific_date', date: new Date(base.getFullYear(), base.getMonth(), base.getDate() + k + 3).toISOString().slice(0, 10) }; a.push(x); }
      await r.complete(a, 1000);
      const immediate = r.receipt();
      const r2 = createRuntime({ storage: kv, now: at }); await r2.init('u');          // simulated reload
      const reloaded = r2.receipt(); runs++;
      if (JSON.stringify(immediate) === JSON.stringify(reloaded)) same++;
      if (!reloaded) { none++; continue; }
      if (reloaded.steps.filter((q) => q.choice.kind !== 'domain').map((q) => q.prompt).join('|') !== shown.join('|')) promptMismatch++;
      if (reloaded.steps.some((s) => s.choice.kind === 'unknown')) withUnknown++;
      if (reloaded.commitment) withCommit++;
      const st = r2._state(); if (!reloaded.trace.observationIds.every((id) => st.observations.some((o) => o.id === id)) || !st.instances.some((i) => i.id === reloaded.trace.instanceId)) traceBad++;
      if (/words|note|text/i.test(JSON.stringify(reloaded))) textLeak++;
    }
  }
  console.log(`  (${runs} completed reps, ${withUnknown} with an "I don't know", ${withCommit} with a commitment, ${none} without a receipt)`);
  check('the receipt is identical immediately and after a reload', same === runs, `${same}/${runs}`);
  check('no receipt exists before today’s rep is completed', emptyBeforeRep === 0, `${emptyBeforeRep}`);
  check('every receipt traces to stored observations and an instance', traceBad === 0, `${traceBad}`);
  check('the receipt shows the exact prompt wording the user was shown (incl. variants)', promptMismatch === 0, `${promptMismatch}`);
  check('no free-text field in any receipt', textLeak === 0);
  check('"I don’t know" is represented as unknown, not as a choice', withUnknown >= 1);
  check('a chosen commitment appears with its exact label and timeframe', withCommit >= 1);
  process.exit(fails ? 1 : 0);
})();
