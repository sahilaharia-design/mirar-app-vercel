// Mirror contract v1 — property tests over simulated users. Every statement must be traceable to stored structured data,
// rejected readings must never be reproduced, and no scoring/trait/diagnostic vocabulary may appear.
import { DEFAULT_TRAITS, PROFILES } from '../sim/profiles';
import { respond } from '../sim/runner';
import { rng } from '../sim/rng';
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { createRuntime, KV } from '../../lib/innerRep/runtime/v2-runtime';
import { buildMirror } from '../../lib/innerRep/runtime/mirror-contract';
import { createState } from '../../lib/innerRep/v2/state';
import { computeEvidence, feedbackFor } from '../../lib/innerRep/v2/evidence';
import { V2 } from '../../lib/innerRep/v2/config';

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
  let gateM1 = 0, gateM2 = 0, gateM3 = 0, gateM4 = 0, gateM5 = 0, partlyReproduced = 0, partlyHistory = 0, inferredWithoutVerdict = 0, runs = 0, populated = 0, sparse = 0, statements = 0, readingsWithRejectedRevived = 0, untraceable = 0, forbidden = 0, nondeterministic = 0, badLabels = 0, textLeak = 0, rejectedSeen = 0;
  for (const pid of PICK) for (let seed = 1; seed <= 3; seed++) {
    const p = PROFILES.find((x) => x.id === pid)!; const sd = p.seed * 1000 + seed; const rr = rng(sd);
    const tr = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
    const shownByInst = new Map<number, string[]>(); const kv = new MemKV(); let k = 0; const r = createRuntime({ storage: kv, now: () => at(k) }); await r.init('u');
    for (k = 0; k < 30; k++) {
      if (!p.engage(k, rr)) continue; const td = r.today(); if (td.kind !== 'rep') continue;
      const a: StepAnswer[] = []; const seen: string[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; const ans = fixDate(respond(st, td.context, p.latent(k), tr, rr, k, p), k); if (st.type === 'choice' && (ans as any).kind === 'option') seen.push(`${st.prompt} You chose “${st.options.find((o) => o.id === (ans as any).optionId)!.label.replace(/\.$/, '')}”.`); a.push(ans); }
      const c = await r.complete(a, 1000); { const st0 = r._state(); shownByInst.set(st0.instances[st0.instances.length - 1].id, seen); }
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
    // ── Codex review gates (M1–M7) ──────────────────────────────────────────────────────────────────────────
    const evNow = computeEvidence(s, Math.floor(at(30).getTime() / 86400000), V2).evidence; void evNow;
    for (const i of s.insights) {
      const stmt = m.statements.find((x) => x.trace.insightIds.includes(i.id) && (x.section === 'readings' || x.section === 'shifted'));
      if (i.feedback?.value === 'partly') { if (m.statements.some((x) => x.text.includes(i.text.slice(0, 40)))) partlyReproduced++; if (stmt && /won’t repeat it unchanged/.test(stmt.text)) partlyHistory++; else gateM1++; }
      if (stmt?.source === 'inferred') {
        const subject = i.evidenceKey.split(':').slice(1).join(':'); const mem = feedbackFor(s, { key: i.evidenceKey, kind: i.kind, subject });
        const after = (d?: number) => d !== undefined && d > i.day;
        if (after(mem?.noDay) || after(mem?.partlyDay) || after(mem?.unsureDay) || i.feedback?.value === 'no' || i.feedback?.value === 'partly' || i.feedback?.value === 'unsure') gateM1++;
      }
    }
    for (const st of m.sections.said) { const id = st.trace.instanceIds[0]; const shown = shownByInst.get(id); if (st.facts.kind === 'choice' && !(shown ?? []).includes(st.text)) gateM2++; }
    for (const st of m.statements) { if ((st.provenance === 'approximate') !== (st.section === 'come_up')) gateM3++; if (st.section === 'come_up' && !(st.facts.kind === 'recurring' && typeof st.facts.offered === 'number' && typeof st.facts.presentWhenOffered === 'number')) gateM4++; if (/has not been told/.test(st.text)) gateM5++; }
    for (const st of m.sections.said) { if (!st.text.startsWith('You said') && !/ You chose “[^”]+”\.$/.test(st.text)) badLabels++; }
  }
  console.log(`  (${runs} simulated 30-day users, ${statements} statements, ${populated} populated / ${sparse} sparse, ${rejectedSeen} rejected readings seen)`);
  check('every statement traces to ids that exist in stored state', untraceable === 0, `${untraceable}`);
  check('no scoring / trait / diagnostic vocabulary in non-reading statements', forbidden === 0, `${forbidden}`);
  check('a reading the user rejected ("No") is never reproduced', readingsWithRejectedRevived === 0, `${readingsWithRejectedRevived}`);
  check('building the model twice yields identical output', nondeterministic === 0);
  check('"said" statements use exact authored labels or domain phrases only', badLabels === 0, `${badLabels}`);
  check('no free-text field names appear in statement facts', textLeak === 0);
  check('M1/M7: no inferred statement exists for a reading with later or own Partly/No/Unsure feedback', gateM1 === 0, `${gateM1}`);
  check('M1: a Partly-qualified reading is never reproduced unchanged; it becomes a history statement', partlyReproduced === 0, `${partlyReproduced}`);
  check('(non-vacuous) the simulation produced Partly-qualified readings to test against', partlyHistory >= 1, `${partlyHistory}`);
  check('M2: every "said" statement equals the prompt and label the user was actually shown', gateM2 === 0, `${gateM2}`);
  check('M3: only recurring-signal statements are marked approximate; all others exact', gateM3 === 0, `${gateM3}`);
  check('M4: recurring facts carry offered and present-when-offered denominators', gateM4 === 0, `${gateM4}`);
  check('M5: no claim that Mirar "has not been told" anything', gateM5 === 0, `${gateM5}`);
  check('some simulated users stay sparse (the model does not manufacture content)', sparse >= 1, `${sparse}`);
  check('every inferred statement states the user\'s own response to it', inferredWithoutVerdict === 0, `${inferredWithoutVerdict}`);
  // M6: long history — retention trimming (300 instances / 120 days of observations) must not break traces or exactness
  for (const pid of ['work_stress', 'relationship_conflict']) {
    const p = PROFILES.find((x) => x.id === pid)!; const rr = rng(p.seed * 1000 + 9); const tr = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
    const kv = new MemKV(); let kk = 0; const at2 = () => new Date(base.getFullYear(), base.getMonth(), base.getDate() + kk, 10); const r = createRuntime({ storage: kv, now: at2 }); await r.init('u');
    for (kk = 0; kk < 330; kk++) { const td = r.today(); if (td.kind !== 'rep') continue; const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; a.push(fixDate(respond(st, td.context, p.latent(kk % 60), tr, rr, kk % 60, p), kk)); } const c = await r.complete(a, 1000); if (c.insight) await r.feedback(c.insight.id, 'accurate'); }
    const r2 = createRuntime({ storage: kv, now: at2 }); await r2.init('u'); const m = r2.mirror(); const s2 = r2._state();
    const obsIds = new Set(s2.observations.map((o) => o.id)), instIds = new Set(s2.instances.map((i) => i.id));
    const bad = m.statements.filter((st) => !st.trace.observationIds.every((x) => obsIds.has(x)) || !st.trace.instanceIds.every((x) => instIds.has(x))).length;
    check(`M6: after ${s2.instances.length} retained reps and trimmed observations, every trace still resolves (${pid})`, bad === 0 && m.retained.instances === s2.instances.length, `${bad}`);
    check(`M6: the model reports the retained window and truncation (${pid})`, m.retained.from !== null && (s2.instances.length < 300 || m.retained.mayBeTruncated));
  }
  process.exit(fails ? 1 : 0);
})();
