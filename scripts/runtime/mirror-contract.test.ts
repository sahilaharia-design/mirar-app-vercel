// Mirror contract v1 — property tests over simulated users. Every statement must be traceable to stored structured data,
// rejected readings must never be reproduced, and no scoring/trait/diagnostic vocabulary may appear.
import { DEFAULT_TRAITS, PROFILES } from '../sim/profiles';
import { respond } from '../sim/runner';
import { rng } from '../sim/rng';
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { createRuntime, KV } from '../../lib/innerRep/runtime/v2-runtime';
import { buildMirror } from '../../lib/innerRep/runtime/mirror-contract';
import { createState } from '../../lib/innerRep/v2/state';

class MemKV implements KV { m = new Map<string, string>(); async getItem(k: string) { return this.m.get(k) ?? null; } async setItem(k: string, v: string) { this.m.set(k, v); } async removeItem(k: string) { this.m.delete(k); } async getAllKeys() { return [...this.m.keys()]; } }
let fails = 0; const check = (n: string, ok: boolean, extra = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + extra}`); if (!ok) fails++; };
const FORBIDDEN = /\b(score|level|rank|ranking|streak|trait|personality|diagnos\w*|disorder|anxious|depressed|you are|you tend|you always|you never|improv\w*|progress|better than|worse than)\b/i;
const base = new Date(2026, 9, 1);
const at = (k: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + k, 10);
const fixDate = (a: StepAnswer, k: number): StepAnswer => (a.kind === 'timeframe' && a.timeframe === 'specific_date' ? ({ stepId: a.stepId, kind: 'timeframe', timeframe: 'specific_date', date: new Date(at(k + 3).getTime()).toISOString().slice(0, 10) } as any) : a);

(async () => {
  // 1 empty
  const e = buildMirror(createState(1), 20000);
  check('empty state: no completed reps → state "empty", no statements', e.state === 'empty' && e.statements.length === 0);

  const PICK = ['stable', 'work_stress', 'relationship_conflict', 'disagrees', 'dont_know', 'committer', 'sel_bias_A', 'high_burden'];
  let inferredWithoutVerdict = 0, runs = 0, populated = 0, sparse = 0, statements = 0, readingsWithRejectedRevived = 0, untraceable = 0, forbidden = 0, nondeterministic = 0, badLabels = 0, textLeak = 0, rejectedSeen = 0;
  for (const pid of PICK) for (let seed = 1; seed <= 3; seed++) {
    const p = PROFILES.find((x) => x.id === pid)!; const sd = p.seed * 1000 + seed; const rr = rng(sd);
    const tr = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
    const kv = new MemKV(); let k = 0; const r = createRuntime({ storage: kv, now: () => at(k) }); await r.init('u');
    for (k = 0; k < 30; k++) {
      if (!p.engage(k, rr)) continue; const td = r.today(); if (td.kind !== 'rep') continue;
      const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; a.push(fixDate(respond(st, td.context, p.latent(k), tr, rr, k, p), k)); }
      const c = await r.complete(a, 1000);
      if (c.insight) { const f = (['accurate', 'partly', 'no', 'unsure'] as const)[Math.floor(rr() * 4)]; await r.feedback(c.insight.id, f); if (f === 'partly' && rr() < 0.7) await r.correction(c.insight.id, 'something_missing'); }
    }
    k = 30; const s = r._state(); const m = r.mirror(); runs++; statements += m.statements.length;
    if (m.state === 'populated') populated++; if (m.state === 'sparse') sparse++;
    if (JSON.stringify(r.mirror()) !== JSON.stringify(m)) nondeterministic++;
    const obsIds = new Set(s.observations.map((o) => o.id)), instIds = new Set(s.instances.map((i) => i.id)), comIds = new Set(s.commitments.map((c) => c.id)), insIds = new Set(s.insights.map((i) => i.id));
    for (const st of m.statements) {
      const t = st.trace; const total = t.observationIds.length + t.instanceIds.length + t.commitmentIds.length + t.insightIds.length;
      if (!total || !t.observationIds.every((x) => obsIds.has(x)) || !t.instanceIds.every((x) => instIds.has(x)) || !t.commitmentIds.every((x) => comIds.has(x)) || !t.insightIds.every((x) => insIds.has(x))) untraceable++;
      if (FORBIDDEN.test(st.text.replace(/\b(chosen from a list)\b/g, '')) && st.source !== 'inferred') forbidden++;
      if (/words|note|free.?text/i.test(JSON.stringify(st.facts))) textLeak++;
      if (st.source === 'inferred' && !/(You said this|You weren’t sure|You did not respond)/.test(st.text)) inferredWithoutVerdict++;
    }
    for (const i of s.insights) if (i.feedback?.value === 'no') { rejectedSeen++; if (m.statements.some((x) => x.text.includes(i.text.slice(0, 40)))) readingsWithRejectedRevived++; }
    for (const st of m.sections.said) { if (!st.text.startsWith('You said') && !/ You chose “[^”]+”\.$/.test(st.text)) badLabels++; }
  }
  console.log(`  (${runs} simulated 30-day users, ${statements} statements, ${populated} populated / ${sparse} sparse, ${rejectedSeen} rejected readings seen)`);
  check('every statement traces to ids that exist in stored state', untraceable === 0, `${untraceable}`);
  check('no scoring / trait / diagnostic vocabulary in non-reading statements', forbidden === 0, `${forbidden}`);
  check('a reading the user rejected ("No") is never reproduced', readingsWithRejectedRevived === 0, `${readingsWithRejectedRevived}`);
  check('building the model twice yields identical output', nondeterministic === 0);
  check('"said" statements use exact authored labels or domain phrases only', badLabels === 0, `${badLabels}`);
  check('no free-text field names appear in statement facts', textLeak === 0);
  check('some simulated users stay sparse (the model does not manufacture content)', sparse >= 1, `${sparse}`);
  check('every inferred statement states the user\'s own response to it', inferredWithoutVerdict === 0, `${inferredWithoutVerdict}`);
  process.exit(fails ? 1 : 0);
})();
