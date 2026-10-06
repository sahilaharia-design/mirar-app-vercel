// Runtime adapter tests. Run: npx tsx scripts/runtime/runtime.test.ts
// The frozen engine suite (scripts/sim/suite.ts) is NOT modified; these tests check the ADAPTER against it.
import * as fs from 'fs';
import * as path from 'path';
import { V2 } from '../../lib/innerRep/v2/config';
import { FlowContext, Step, StepAnswer, nextStep } from '../../lib/innerRep/v2/contracts';
import { V2_KEY_PREFIX, clearV2Keys, createRuntime, InvalidAnswerError, KV, V2Runtime } from '../../lib/innerRep/runtime/v2-runtime';
import { createLocalStore } from '../../lib/innerRep/local-store';
import { PROFILES } from '../sim/profiles';
import { respond, runProfile } from '../sim/runner';
import { rng } from '../sim/rng';

class MemKV implements KV {
  m = new Map<string, string>();
  async getItem(k: string) { return this.m.get(k) ?? null; }
  async setItem(k: string, v: string) { this.m.set(k, v); }
  async removeItem(k: string) { this.m.delete(k); }
  async getAllKeys() { return [...this.m.keys()]; }
}
let fails = 0; const rows: { name: string; pass: boolean; detail: string }[] = [];
const t = async (name: string, fn: () => Promise<string>) => { try { const detail = await fn(); rows.push({ name, pass: true, detail }); console.log('PASS', name, '—', detail); } catch (e: any) { fails++; rows.push({ name, pass: false, detail: e?.message ?? String(e) }); console.log('FAIL', name, '—', e?.message ?? e); } };
const assert = (c: unknown, m: string) => { if (!c) throw new Error(m); };

let clock = new Date('2026-10-06T09:00:00');
const mk = (kv: KV, d = () => clock, dayNumber?: (x: Date) => number): V2Runtime => createRuntime({ storage: kv, now: d, dayNumber });
const firstOption = (st: Step): StepAnswer => st.type === 'choice' ? { stepId: st.id, kind: 'option', optionId: st.options[0].id } : st.type === 'domain_chips' ? { stepId: st.id, kind: 'domain', domain: st.domains[0] } : st.type === 'timeframe' ? { stepId: st.id, kind: 'timeframe', timeframe: 'tomorrow' } : st.type === 'yes_no' ? { stepId: st.id, kind: 'yes' } : { stepId: st.id, kind: 'skip' };
function autoComplete(ctx: FlowContext, pick: (s: Step) => StepAnswer = firstOption): StepAnswer[] { const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(ctx, a); if (!st) break; a.push(pick(st)); } return a; }
const SECRET = 'my private sentence about my father xyzzy';

(async () => {
  await t('first open: the frozen engine serves a rep through the contract', async () => {
    const kv = new MemKV(); const r = mk(kv); await r.init('u1'); const td = r.today();
    assert(td.kind === 'rep', 'expected a rep'); if (td.kind !== 'rep') return '';
    assert(td.payload.dismissible === true && td.payload.estimatedSeconds > 0 && !!td.payload.capacityLabel, 'payload incomplete');
    const st = nextStep(td.context, []); assert(st && st.id === 'primary' && st.type === 'choice', 'first step must be the primary choice');
    return `${td.payload.templateId} (${td.payload.capacityLabel}, ${td.payload.estimatedSeconds}s), first step ${st!.id}`;
  });
  await t('full rep → completion → done; reload shows done (structured state survives)', async () => {
    const kv = new MemKV(); const r = mk(kv); await r.init('u1'); const td = r.today(); if (td.kind !== 'rep') throw new Error('no rep');
    const answers = autoComplete(td.context); const c = await r.complete(answers, 4000);
    const r2 = mk(kv); await r2.init('u1'); const again = r2.today();
    assert(again.kind === 'done', 'after reload the day must be done'); assert(r2.practiceDaysThisMonth() === 1, 'one practice day');
    return `answers ${answers.map((a) => a.kind).join('>')}; insight after first rep: ${c.insight ? 'yes' : 'none'}; reload → ${again.kind}; practice days ${r2.practiceDaysThisMonth()}`;
  });
  await t('interrupted flow: answer step 1, reload → same rep, same wording, draft restored; not done', async () => {
    const kv = new MemKV(); const r = mk(kv); await r.init('u1'); const td = r.today(); if (td.kind !== 'rep') throw new Error('no rep');
    const first = firstOption(nextStep(td.context, [])!); await r.progress([first]);
    const r2 = mk(kv); await r2.init('u1'); const td2 = r2.today(); if (td2.kind !== 'rep') throw new Error('expected the rep to resume');
    assert(td2.payload.templateId === td.payload.templateId && td2.payload.instanceId === td.payload.instanceId, 'must be the same instance');
    assert(td2.draft.length === 1 && td2.draft[0].stepId === 'primary', 'draft restored'); assert(td2.context.variant === td.context.variant, 'same phrasing');
    return `resumed ${td2.payload.templateId} with ${td2.draft.length} saved structured answer(s)`;
  });
  await t('an unfinished rep from an earlier day is recorded as abandoned (the simulator\'s abandon path), not as done', async () => {
    const kv = new MemKV(); let r = mk(kv); await r.init('u1'); const t0 = r.today(); if (t0.kind !== 'rep') throw new Error('no rep'); await r.progress([firstOption(nextStep(t0.context, [])!)]);
    clock = new Date('2026-10-07T09:00:00'); r = mk(kv); await r.init('u1');
    const inst = r._state().instances[0]; assert(!inst.completed && inst.skippedAll, 'abandoned'); const td = r.today();
    clock = new Date('2026-10-06T09:00:00'); return `a rep that was started but not finished yesterday → completed=${inst.completed}, abandoned=${inst.skippedAll}; (a rep that was only looked at leaves no trace); next day serves ${td.kind === 'rep' ? td.payload.templateId : td.kind}`;
  });
  await t('raw free text can never be persisted: extra properties are stripped and the blob is scanned', async () => {
    // walk ONE user through days until the engine serves the appreciation rep (the only rep with a words step)
    let found = false, detail = '';
    const kvw = new MemKV(); let k = 0; const rw = createRuntime({ storage: kvw, now: () => new Date(2026, 9, 6 + k), dayNumber: () => 1000 + k }); await rw.init('words-user');
    for (k = 0; k < 40 && !found; k++) {
      const td = rw.today(); if (td.kind !== 'rep') continue;
      if (td.payload.templateId !== 'rel_appreciation') { await rw.complete(autoComplete(td.context)); continue; }
      found = true;
      const rest = autoComplete(td.context, (st) => st.type === 'words' ? ({ stepId: st.id, kind: 'words', text: SECRET } as unknown as StepAnswer) : firstOption(st));
      assert(rest.some((x) => x.stepId === 'words'), 'the appreciation rep must ask for words after "Yes"');
      await rw.progress(rest.slice(0, 2)); const midBlob = [...kvw.m.values()].join('|'); assert(!midBlob.includes('xyzzy') && !midBlob.includes('father'), 'text leaked into the saved draft');
      await rw.complete(rest);
      const blob = [...kvw.m.values()].join('|'); assert(!blob.includes('xyzzy') && !blob.includes('father'), 'text leaked into storage');
      detail = `words step reached on day ${k + 1}; sentinel sent through progress() and complete(); saved blob ${blob.length} chars; sentinel present: false`;
    }
    // direct, no template search: a words answer with an attached property
    const kv2 = new MemKV(); const r2 = mk(kv2); await r2.init('x'); const td2 = r2.today(); if (td2.kind !== 'rep') throw new Error('no rep');
    const st = nextStep(td2.context, [])!; let rejected = false; try { await r2.complete([{ stepId: st.id, kind: 'words', text: SECRET } as unknown as StepAnswer]); } catch (e) { rejected = e instanceof InvalidAnswerError; }
    assert(rejected, 'a words answer on a choice step must be rejected'); assert(![...kv2.m.values()].join('').includes('xyzzy'), 'leak on rejection');
    assert(found, 'could not reach a words step in 40 days'); return detail + '; a words answer on a choice step is rejected and stores nothing';
  });
  await t('contract guard: out-of-order, not-offered, skipped-choice and orientation answers are rejected', async () => {
    const kv = new MemKV(); const r = mk(kv); await r.init('u1'); const td = r.today(); if (td.kind !== 'rep') throw new Error('no rep'); const bad: [string, StepAnswer[]][] = [
      ['unknown option', [{ stepId: 'primary', kind: 'option', optionId: 'not-an-option' }]], ['wrong step', [{ stepId: 'timeframe', kind: 'skip' }]], ['skip on choice', [{ stepId: 'primary', kind: 'skip' }]],
      ['orientation', [{ stepId: 'primary', kind: 'orientation', orientation: 'future' } as StepAnswer]], ['incomplete', [{ stepId: 'primary', kind: 'unknown' }, { stepId: 'primary', kind: 'unknown' }]]];
    const out: string[] = []; for (const [name, a] of bad) { let ok = false; try { await r.complete(a); } catch (e) { ok = e instanceof InvalidAnswerError; } assert(ok, name + ' was accepted'); out.push(name); }
    return `rejected: ${out.join(', ')}`;
  });
  await t('"I don\'t know" ends the rep, is stored as uncertainty (unknownPrimary), and produces no insight', async () => {
    const kv = new MemKV(); const r = mk(kv); await r.init('u1'); const td = r.today(); if (td.kind !== 'rep') throw new Error('no rep');
    const c = await r.complete([{ stepId: 'primary', kind: 'unknown' }]); const i = r._state().instances[0]; const o = r._state().observations[0];
    assert(i.unknownPrimary && i.completed && o.polarity === 'unknown' && o.unknown, 'uncertainty recorded'); assert(!c.insight, 'no insight from an unknown'); assert(!JSON.stringify(r._state()).match(/avoid|denial/i), 'no avoidance wording');
    return `observation polarity=${o.polarity}; insight=${c.insight ? 'yes' : 'none'}`;
  });
  await t('every Honest Mirror feedback value reaches the engine state (Accurate / Partly / No / Not sure)', async () => {
    const outcomes: string[] = [];
    for (const v of ['accurate', 'partly', 'no', 'unsure'] as const) {
      // build a user with an insight using the simulator's work_stress profile through the runtime, day by day
      const p = PROFILES.find((x) => x.id === 'work_stress')!; const kv = new MemKV(); let day = 0; const r = createRuntime({ storage: kv, now: () => new Date(2026, 9, 6 + day), dayNumber: () => day }); await r.init('fb-' + v);
      const rr = rng(p.seed + 7); let id = -1;
      for (day = 0; day < 30 && id < 0; day++) { const td = r.today(); if (td.kind !== 'rep') continue; const a = autoComplete(td.context, (st) => respond(st, td.context, p.latent(day), { ...require('../sim/profiles').DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...require('../sim/profiles').DEFAULT_TRAITS.commit } }, rr, day, p)); const c = await r.complete(a); if (c.insight) id = c.insight.id; }
      assert(id > 0, 'no insight reached for ' + v); await r.feedback(id, v); const rec = r._state().insights.find((x) => x.id === id)!; assert(rec.feedback?.value === v, 'feedback not stored as ' + v);
      await r.feedback(id, v === 'no' ? 'accurate' : 'no'); assert(rec.feedback?.value === v, 'first answer must stand');
      const mem = r._state().feedbackMem; const memKeys = Object.values(mem);
      if (v === 'no') assert(memKeys.some((m) => m.noDay !== undefined), 'No must create suppression memory'); if (v === 'partly') assert(memKeys.some((m) => m.partlyDay !== undefined), 'Partly memory'); if (v === 'unsure') assert(memKeys.some((m) => m.unsureDay !== undefined), 'Not-sure memory');
      outcomes.push(`${v}→stored`);
    }
    return outcomes.join(', ');
  });
  await t('adapter ≡ frozen engine: 30 days of runtime decisions are identical to the simulator for the same synthetic user', async () => {
    const p = PROFILES.find((x) => x.id === 'work_stress')!; const seed = p.seed * 1000 + 5; const prof = { ...p, seed };
    const sim = runProfile(prof); const kv = new MemKV(); let day = 0;
    const r = createRuntime({ storage: kv, now: () => new Date(2026, 9, 6 + day), dayNumber: () => day }); await r.init('equiv');
    // identical seed numbers so tie-breaks and wording rotation match
    (r._state() as any).userSeed = seed;
    const { DEFAULT_TRAITS } = require('../sim/profiles'); const tr = { ...DEFAULT_TRAITS, ...(p.traits ?? {}), commit: { ...DEFAULT_TRAITS.commit, ...(p.traits?.commit ?? {}) } };
    const rr = rng(seed); const got: string[] = []; const want = sim.state.instances.map((i) => `${i.day}|${i.templateId}|${i.frame}|${i.bound ?? ''}|${i.intent}|${i.variant ?? 0}`);
    for (day = 0; day < p.days; day++) {
      if (!p.engage(day, rr)) continue; const td = r.today(); if (td.kind !== 'rep') continue; const i = r._state().instances.find((x) => x.id === td.payload.instanceId)!; got.push(`${day}|${i.templateId}|${i.frame}|${i.bound ?? ''}|${i.intent}|${i.variant ?? 0}`);
      const abandon = rr() < tr.abandon; const answers: StepAnswer[] = []; if (abandon) answers.push({ stepId: 'primary', kind: 'skip' }); else for (let g = 0; g < 10; g++) { const st = nextStep(td.context, answers); if (!st) break; answers.push(respond(st, td.context, p.latent(day), tr, rr, day, p)); }
      if (abandon) { // the simulator records an abandon via applyRep(skip); the runtime does it on the next day's init — emulate by reloading next day
        continue; }
      const c = await r.complete(answers); if (c.insight) { const f = p.feedback ? p.feedback({} as any, rr) : (rr() < 0.6 ? 'accurate' : rr() < 0.5 ? 'partly' : 'unsure'); if (f) await r.feedback(c.insight.id, f as any); }
    }
    const same = got.length === want.length && got.every((g, k) => g === want[k]);
    assert(same, `diverged: runtime ${got.length} reps vs simulator ${want.length}; first diff ${got.findIndex((g, k) => g !== want[k])} (${got.find((g, k) => g !== want[k])} vs ${want.find((g, k) => g !== got[k])})`);
    const insA = r._state().insights.map((x) => x.text).join('¶'); const insB = sim.state.insights.map((x) => x.text).join('¶'); assert(insA === insB, 'insight texts differ from the simulator');
    return `${got.length} reps identical (template, frame, binding, intent, wording variant); ${r._state().insights.length} insights identical`;
  });
  await t('sign-out wipe: v2 + v1 + legacy keys removed, unrelated keys kept, no text anywhere', async () => {
    const kv = new MemKV(); const r = mk(kv); await r.init('u1'); const td = r.today(); if (td.kind === 'rep') await r.progress([firstOption(nextStep(td.context, [])!)]);
    kv.m.set('mirar_inner_reps_v1:u1', JSON.stringify({ records: [{ answer: { words: SECRET } }], pending: [] })); kv.m.set('mirar_inner_reps_v1', JSON.stringify({ records: [{ answer: { words: SECRET } }] })); kv.m.set('unrelated_key', 'keep'); kv.m.set('mirar_language', 'en');
    await clearV2Keys(kv); await createLocalStore(kv).clearAll();
    const left = [...kv.m.keys()].sort(); assert(left.join(',') === 'mirar_language,unrelated_key', 'left: ' + left.join(',')); assert(![...kv.m.values()].join('').includes('xyzzy'), 'text remained');
    return `remaining keys: ${left.join(', ')}`;
  });
  await t('corrupt or foreign stored data never crashes the app; it starts clean', async () => {
    const kv = new MemKV(); kv.m.set(V2_KEY_PREFIX + ':u1', '{not json'); const r = mk(kv); await r.init('u1'); assert(r.today().kind === 'rep', 'should serve a rep');
    kv.m.set(V2_KEY_PREFIX + ':u2', JSON.stringify({ v: 9, nope: true })); const r2 = mk(kv); await r2.init('u2'); assert(r2.today().kind === 'rep', 'should serve a rep'); return 'corrupt and wrong-version blobs → clean start';
  });
  await t('rest/no-rep is disabled in the shipping configuration and never served', async () => {
    assert(V2.rest.enabled === false && V2.orientation.enabled === false && V2.insight.contradictionEnabled === false, 'shipping flags'); return `rest.enabled=${V2.rest.enabled}, orientation.enabled=${V2.orientation.enabled}, contradictionEnabled=${V2.insight.contradictionEnabled}`;
  });
  await t('persisted blob holds structured engine state only (no free-form strings beyond engine vocabulary)', async () => {
    const kv = new MemKV(); const r = mk(kv); await r.init('u1'); const td = r.today(); if (td.kind !== 'rep') throw new Error(); await r.complete(autoComplete(td.context));
    const blob = JSON.parse([...kv.m.values()][0]); const keys = new Set<string>(); const walk = (o: any) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) { keys.add(k); walk(o[k]); } }; walk(blob);
    const forbidden = ['text', 'words', 'body', 'note', 'message', 'email']; const hit = forbidden.filter((k) => keys.has(k)); assert(hit.length === 0, 'forbidden key(s): ' + hit.join(','));
    return `${keys.size} distinct keys, none of ${forbidden.join('/')}; blob ${JSON.stringify(blob).length} bytes after 1 rep`;
  });
  console.log(`\n${rows.filter((x) => x.pass).length}/${rows.length} pass`);
  fs.writeFileSync(path.join(__dirname, '../../docs/INTEGRATION_RUNTIME_TESTS.md'), ['# Runtime adapter tests', '', `Generated by \`npx tsx scripts/runtime/runtime.test.ts\`: ${rows.filter((x) => x.pass).length}/${rows.length} pass.`, '', '| | Test | Detail |', '|---|---|---|', ...rows.map((x) => `| ${x.pass ? 'PASS' : '**FAIL**'} | ${x.name} | ${x.detail.replace(/\|/g, '/')} |`)].join('\n'));
  process.exit(fails ? 1 : 0);
})();
