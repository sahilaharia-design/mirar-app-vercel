// S1a persist-on-serve: host helper (lib/innerRep/runtime/serve.ts), store wiring (stores/inner-rep-v2-store.ts) and replay alignment
// (lib/innerRep/backup/replay.ts). Drives the REAL runtime, recorder, replay and store; only the device key/value store is in memory.
// The frozen engine and lib/innerRep/runtime/v2-runtime.ts are not touched by S1a.
process.env.EXPO_PUBLIC_PILOTS = '1';
const Module = require('module'); const origLoad = Module._load;
const mem = new Map<string, string>();
const AsyncStorage = { getItem: async (k: string) => mem.get(k) ?? null, setItem: async (k: string, v: string) => { mem.set(k, v); }, removeItem: async (k: string) => { mem.delete(k); }, getAllKeys: async () => [...mem.keys()], clear: async () => mem.clear() };
Module._load = function (req: string, ...a: unknown[]) { if (req === '@react-native-async-storage/async-storage') return { __esModule: true, default: AsyncStorage }; return origLoad.call(this, req, ...a); };

import { createRuntime } from '../../lib/innerRep/runtime/v2-runtime';
import { newServedGuard, recordServed, resetServedGuard } from '../../lib/innerRep/runtime/serve';
import { recordRuntime } from '../../lib/innerRep/backup/recorder';
import { MemKV, replayFresh } from '../../lib/innerRep/backup/replay';
import { BackupEvent, validateEvent, buildVocabulary } from '../../lib/innerRep/backup/events';
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { ENGINE_VERSION } from '../../lib/innerRep/v2/config';
import { at, noTrace, sameJSON } from './backup-fixtures';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const settled = (s: any) => ({ ...noTrace(s), seq: undefined, day: undefined, instances: noTrace(s).instances.filter((i: any) => i.completed || i.skippedAll) });
const dayKey = (k: number) => at(k).toDateString();
const answers = (td: any, pick = 0): StepAnswer[] => { const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; if (st.type === 'choice') a.push({ stepId: st.id, kind: 'option', optionId: st.options[pick % st.options.length].id }); else if (st.type === 'timeframe') a.push({ stepId: st.id, kind: 'timeframe', timeframe: 'none' }); else if (st.type === 'domain_chips') a.push({ stepId: st.id, kind: 'domain', domain: st.domains[0] }); else if (st.type === 'yes_no') a.push({ stepId: st.id, kind: 'no' }); else a.push({ stepId: st.id, kind: 'skip' }); } return a; };

interface Host { rt: ReturnType<typeof recordRuntime>; raw: ReturnType<typeof createRuntime>; clock: { d: Date }; events: BackupEvent[]; guard: ReturnType<typeof newServedGuard>; progressCalls: { n: number }; kv: MemKV; persisted: () => Promise<number>; open: (k: number, h?: number) => Promise<any> }
/** A host that behaves like the app: opens (init + today) and, when persistOnServe, records the served rep. */
function host(uid: string, persistOnServe: boolean): Host {
  const clock = { d: at(0) }; const events: BackupEvent[] = []; const progressCalls = { n: 0 };
  const kv = new MemKV(); const raw = createRuntime({ storage: kv, now: () => clock.d });
  const rt = recordRuntime(raw, { engine: ENGINE_VERSION, now: () => clock.d, onEvent: (e) => events.push(e) });
  const counted = { ...rt, progress: (a: StepAnswer[]) => { progressCalls.n++; return rt.progress(a); } } as typeof rt;
  const guard = newServedGuard();
  const open = async (k: number, h = 10) => { clock.d = new Date(at(k).getFullYear(), at(k).getMonth(), at(k).getDate(), h); await rt.init(uid); const td = rt.today(); if (persistOnServe) await recordServed(counted, td, guard, { userId: uid, dayKey: clock.d.toDateString() }); return td; };
  const persisted = async () => { const r2 = createRuntime({ storage: kv, now: () => clock.d }); await r2.init(uid); return r2._state().instances.length; };
  return { rt, raw, clock, events, guard, progressCalls, kv, persisted, open };
}

(async () => {
  // 1 ── baseline vs S1a: serve-and-leave
  { const uid = 'base'; const N = host(uid, false), S = host(uid, true);
    const served = async (H: Host) => { const t: string[] = []; for (let k = 0; k < 3; k++) { const td = await H.open(k); if (td.kind === 'rep') t.push(td.payload.templateId); } return t; };
    const tn = await served(N), ts = await served(S);
    check('baseline (today): an exercise that was shown and left is served again the next day', tn[0] === tn[1], tn.join());
    check('S1a: an exercise that was shown and left is NOT served again the next day', ts[0] !== ts[1] && ts[1] !== ts[2], ts.join());
    check('S1a: the engine learns of the unfinished reps (rep_abandoned events recorded for each left rep)', S.events.filter((e) => e.kind === 'rep_abandoned').length === 2 && N.events.filter((e) => e.kind === 'rep_abandoned').length === 0, `${S.events.map((e) => e.kind)}`);
    check('S1a: abandonment events carry only template id and day (no content)', S.events.filter((e) => e.kind === 'rep_abandoned').every((e: any) => Object.keys(e).sort().join() === 'day,engine,kind,template'), JSON.stringify(S.events[0])); }

  // 2 ── same-day reload and completion
  { const uid = 'sameday'; const H = host(uid, true);
    const t1 = await H.open(0, 9); const id1 = t1.payload.instanceId; const tpl = t1.payload.templateId;
    const t2 = await H.open(0, 14); const t3 = await H.open(0, 18);
    check('same-day reloads: the same exercise and instance are shown, with no draft', t2.payload.instanceId === id1 && t3.payload.instanceId === id1 && t2.payload.templateId === tpl && t2.draft.length === 0);
    check('same-day reloads: exactly one instance exists and nothing is marked skipped/abandoned', H.raw._state().instances.length === 1 && H.events.filter((e) => e.kind === 'rep_abandoned').length === 0);
    check('same-day reloads: the guard writes once (progress called once across three opens)', H.progressCalls.n === 1, String(H.progressCalls.n));
    await H.rt.complete(answers(t3));
    const t4 = await H.open(0, 21);
    check('same-day completion after served-and-reopened: Today is done, the rep is complete, no abandonment', t4.kind === 'done' && H.raw._state().instances.filter((i: any) => i.completed).length === 1 && H.events.filter((e) => e.kind === 'rep_abandoned').length === 0 && H.events.filter((e) => e.kind === 'rep_completed').length === 1);
    check('a completed day persists nothing further (open does not call progress)', H.progressCalls.n === 1); }

  // 3 ── offered-but-unfinished (partial answers) is unchanged: resume with draft, still one instance
  { const uid = 'partial'; const H = host(uid, true); const td = await H.open(0, 9); const a = answers(td).slice(0, 1);
    await H.rt.progress(a); const again = await H.open(0, 15);
    check('partial answers: reopening resumes the draft and does not overwrite it with an empty one', again.draft.length === a.length && H.raw._state().instances.length === 1, String(again.draft.length));
    const next = await H.open(1, 9);
    check('partial answers left overnight: recorded as abandoned and a different exercise is served', H.events.some((e) => e.kind === 'rep_abandoned') && next.kind === 'rep' && next.payload.templateId !== td.payload.templateId); }

  // 4 ── easier mode: consecutive unanswered reps feed the existing ease/simplify rules
  { const N = host('ease', false), S = host('ease', true); const seen = async (H: Host) => { for (let k = 0; k < 4; k++) await H.open(k); const inst = H.raw._state().instances; return inst.filter((i: any) => (i.trace?.constraints ?? []).some((c: any) => c.name === 'ease' || c.name === 'simplify')).length; };
    const en = await seen(N), es = await seen(S);
    check('easier mode today: leaving every rep unopened never triggers ease/simplify (the engine never learns)', en === 0, String(en));
    check('easier mode with S1a: after two unanswered reps in a row the engine eases the next rep (expected, existing rule)', es >= 1, String(es));
    const lastS = S.raw.today(); check('easier mode with S1a: the eased rep is light', lastS.kind !== 'rep' || (S.raw._state().instances.at(-1) as any)?.trace?.constraints?.some((c: any) => c.name === 'ease' || c.name === 'simplify')); }

  // 5 ── backup/replay consistency (S1a replay alignment)
  { const uid = 'replay'; const H = host(uid, true); let doneN = 0;
    for (let k = 0; k < 14; k++) { const td = await H.open(k); if (td.kind !== 'rep') continue; if (k % 3 === 0) { await H.rt.complete(answers(td, k)); doneN++; } else if (k % 5 === 1) { await H.rt.progress(answers(td).slice(0, 1)); } }
    await H.open(14); const live = H.raw._state();
    let rp: any, err = ''; try { rp = await replayFresh(uid, H.events, ENGINE_VERSION); } catch (e) { err = (e as Error).message; }
    check('replay: the recorded journal of a persist-on-serve run replays without drift', !err, err);
    check('replay: replayed durable state equals the live state (completed, abandoned, evidence, insights)', !err && sameJSON(settled(rp.rt._state()), settled(live)));
    check('journal: contains completed reps and abandoned reps and every event validates', doneN > 0 && H.events.some((e) => e.kind === 'rep_abandoned') && H.events.every((e) => validateEvent(e, buildVocabulary(ENGINE_VERSION)).ok)); }

  // 6 ── safety stop leaves no trace and no persist-on-serve for the rest of that day
  { const uid = 'safety'; const H = host(uid, true); const td = await H.open(0, 9);
    check('safety: the rep was persisted on serve before the stop', (await H.persisted()) === 1);
    await H.rt.discardForSafety(); H.guard.safetyDay = H.clock.d.toDateString();
    check('safety: after the stop the instance is removed and nothing is recorded', H.raw._state().instances.length === 0 && H.events.filter((e) => e.kind === 'rep_abandoned').length === 0);
    const again = await H.open(0, 16);
    check('safety: reopening later the same day persists nothing (no marker of the stop)', (await H.persisted()) === 0 && again.kind !== 'done', String(await H.persisted()));
    await H.open(1, 9);
    check('safety: next day persist-on-serve resumes normally and no abandoned event exists for the stopped day', (await H.persisted()) === 1 && H.events.filter((e) => e.kind === 'rep_abandoned').length === 0); }

  // 7 ── helper unit rules
  { const g = newServedGuard(); let calls = 0; const rt = { progress: async () => { calls++; return undefined as any; } };
    const rep: any = { kind: 'rep', draft: [], payload: { instanceId: 'x1' } }; const ctx = { userId: 'u', dayKey: 'D' };
    check('helper: done state writes nothing', !(await recordServed(rt as any, { kind: 'done' } as any, g, ctx)) && calls === 0);
    check('helper: a rep with a draft writes nothing', !(await recordServed(rt as any, { ...rep, draft: [{}] }, g, ctx)) && calls === 0);
    check('helper: first serve writes once; repeat is a no-op', (await recordServed(rt as any, rep, g, ctx)) && !(await recordServed(rt as any, rep, g, ctx)) && calls === 1);
    check('helper: a different account on the same instance id writes again (guard keyed by account)', await recordServed(rt as any, rep, g, { userId: 'u2', dayKey: 'D' }) && calls === 2);
    g.safetyDay = 'D2'; check('helper: suppressed on the safety day only', !(await recordServed(rt as any, { ...rep, payload: { instanceId: 'x9' } }, g, { userId: 'u', dayKey: 'D2' })) && (await recordServed(rt as any, { ...rep, payload: { instanceId: 'x9' } }, g, { userId: 'u', dayKey: 'D3' })));
    resetServedGuard(g); check('helper: reset clears the guard', g.key === null && g.safetyDay === null); }

  // 8 ── REAL store: same-day reload, sign-out, account switch, safety
  { const v2 = await import('../../stores/inner-rep-v2-store'); const E = () => v2.useInnerRepV2Store.getState();
    const keysFor = (u: string) => [...mem.keys()].filter((k) => k.includes(u));
    await E().load('storeA'); const t1: any = E().today; const id = t1.payload.instanceId;
    check('store: loading Today persists the served rep (instance exists in device storage)', t1.kind === 'rep' && keysFor('storeA').length > 0 && JSON.stringify([...mem.values()]).includes(id));
    await E().load('storeA'); const t2: any = E().today;
    check('store: reload the same day shows the same exercise, no duplicate, no draft', t2.payload.instanceId === id && t2.draft.length === 0);
    await E().complete(answers(t2), 1000);
    await E().load('storeA'); check('store: after completion and reload Today is done', E().today?.kind === 'done');
    await v2.clearInnerRepV2Data();
    check('store: sign-out clears state and device keys', E().today === null && E().userId === null && keysFor('storeA').length === 0);
    await E().load('storeB'); const b: any = E().today;
    check('store: account B after A in the same tab is served and persisted independently (guard was reset)', b.kind === 'rep' && keysFor('storeB').length > 0 && keysFor('storeA').length === 0);
    await E().discardForSafety(); await E().load('storeB');
    check('store: after a safety stop, reopening Today the same day does not persist the rep', (JSON.parse([...mem.entries()].find(([k]) => k.includes('storeB'))![1]).state.instances ?? []).length === 0);
    await v2.clearInnerRepV2Data();
    await E().load('storeC'); const c1: any = E().today; await v2.resetDevicePractice('storeC'); const c2: any = E().today;
    check('store: device reset reloads cleanly and serves (and persists) a rep again', c1.kind === 'rep' && c2.kind === 'rep' && (JSON.parse([...mem.entries()].find(([k]) => k.includes('storeC'))![1]).state.instances ?? []).length === 1); }

  console.log(fails ? `\n${fails} FAILED` : '\nall persist-on-serve checks passed'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
