// Host integration of the entitlement client, driven through the REAL stores (engine, pilots, entitlement) with an in-memory device store and a
// server port backed by the executable server model. Also: RPC port mapping, flag-off inertness, practice registry and shelf rules.
// Run: npx tsx scripts/entitlement/host.test.ts
const Module = require('module'); const origLoad = Module._load;
const mem = new Map<string, string>();
const AsyncStorage = { getItem: async (k: string) => mem.get(k) ?? null, setItem: async (k: string, v: string) => { mem.set(k, v); }, removeItem: async (k: string) => { mem.delete(k); }, getAllKeys: async () => [...mem.keys()], clear: async () => mem.clear() };
Module._load = function (req: string, ...a: unknown[]) { if (req === '@react-native-async-storage/async-storage') return { __esModule: true, default: AsyncStorage }; return origLoad.call(this, req, ...a); };
process.env.EXPO_PUBLIC_PILOTS = '1';

import { ServerModel } from './model';
import { createRpcPort, parseEntitlement } from '../../lib/entitlement/rpc-port';
import type { Reply } from '../../lib/entitlement/client';
import { PRACTICES, practice, shelfOffer, ShelfInput } from '../../lib/innerRep/practice-registry';
import { nextStep } from '../../lib/innerRep/v2/contracts';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };

(async () => {
  // ── RPC port mapping
  const iso = (ms: number) => new Date(ms).toISOString(); const T = Date.UTC(2026, 9, 25, 5, 0);
  const good = { state: 'trialing', trial_started_at: iso(T), trial_ends_at: iso(T + 348 * 3600000), server_now: iso(T + 1000), version: 2 };
  check('RPC port: a valid reply is parsed to epoch milliseconds', JSON.stringify(parseEntitlement(good)) === JSON.stringify({ state: 'trialing', trial_started_at: T, trial_ends_at: T + 348 * 3600000, server_now: T + 1000, version: 2 }));
  check('RPC port: malformed replies are rejected (bad state, bad date, missing server_now, non-object)', [{ ...good, state: 'paid' }, { ...good, trial_ends_at: 'x' }, { ...good, server_now: null }, 'x', null].every((b) => parseEntitlement(b) === null));
  const mk = (r: any) => createRpcPort(async () => r);
  const kind = async (r: any) => { const x = await mk(r).get(); return x.ok ? 'ok' : x.kind; };
  check('RPC port: ok / 28000 / 401 / network / server error map to ok / unauthenticated / unauthenticated / offline / unavailable', (await Promise.all([kind({ data: good, error: null }), kind({ data: null, error: { code: '28000', message: 'not authenticated' } }), kind({ data: null, error: { status: 401, message: 'x' } }), kind({ data: null, error: { message: 'TypeError: Failed to fetch' } }), kind({ data: null, error: { message: 'boom', code: 'XX000' } })])).join() === 'ok,unauthenticated,unauthenticated,offline,unavailable');
  check('RPC port: a thrown call is offline; a malformed ok reply is unavailable (never trusted)', (await createRpcPort(async () => { throw new Error('socket'); }).get() as any).kind === 'offline' && (await mk({ data: { state: 'nope' }, error: null }).get() as any).kind === 'unavailable');
  const called: string[] = []; await createRpcPort(async (fn) => { called.push(fn); return { data: good, error: null }; }).firstRep();
  check('RPC port: the first-completion call names only the one function and passes no arguments', called.join() === 'entitlement_first_rep_completed');

  // ── flag OFF: inert
  delete process.env.EXPO_PUBLIC_ENTITLEMENT;
  const ent = await import('../../stores/entitlement-store'); const EN = () => ent.useEntitlementStore.getState();
  let rpcCalls = 0; const w = { now: Date.now() }; const server = new ServerModel(() => Date.now()); let uid = 'userA';
  const port = { get: async () => { rpcCalls++; return server.get(uid) as Reply; }, firstRep: async () => { rpcCalls++; return server.firstRep(uid) as Reply; } };
  ent.__setEntitlementDeps({ port, now: () => Date.now() });
  await EN().sync('userA'); await EN().engineRepCompleted(); await EN().pilotCompleted();
  check('flag off: the store never contacts the server and always allows practice', rpcCalls === 0 && EN().access.memberReps && EN().userId === null);

  // ── flag ON through the real stores
  process.env.EXPO_PUBLIC_ENTITLEMENT = '1';
  const E = (await import('../../stores/inner-rep-v2-store')); const V2 = () => E.useInnerRepV2Store.getState();
  const { usePilotStore } = await import('../../stores/pilot-store'); const P = () => usePilotStore.getState();
  const row = (u: string) => (server.get(u) as any).ent;
  const repAnswers = (t: any) => { const a: any[] = []; for (let i = 0; i < 8; i++) { const st = nextStep(t.context, a); if (!st) break; if (st.type === 'choice') a.push({ stepId: st.id, kind: 'option', optionId: st.options[0].id }); else if (st.type === 'timeframe') a.push({ stepId: st.id, kind: 'timeframe', timeframe: 'none' }); else if (st.type === 'domain_chips') a.push({ stepId: st.id, kind: 'domain', domain: st.domains[0] }); else if (st.type === 'yes_no') a.push({ stepId: st.id, kind: 'no' }); else a.push({ stepId: st.id, kind: 'skip' }); } return a; };
  const completePilot = async () => { const s = P().start('attend'); await P().answer({ stepId: s.step()!.id, kind: 'options', optionIds: ['work', 'rest'] }); while (P().session()!.step()) { const st = P().session()!.step()!; if (st.type === 'choice') await P().answer({ stepId: st.id, kind: 'option', optionId: st.options.find((o: any) => !o.disabled)!.id }); else if (st.type === 'hold') await P().answer({ stepId: st.id, kind: 'hold_end' }); else break; } return P().close('finish'); };

  uid = 'userA'; await V2().load('userA'); await P().load('userA'); await new Promise((r) => setTimeout(r, 20));
  check('flag on: loading Today syncs the account; a new account allows its first rep and has no trial clock', EN().userId === 'userA' && EN().access.memberReps && EN().access.reason === 'ok_first_rep' && row('userA').state === 'new');
  const pr = await completePilot();
  await new Promise((r) => setTimeout(r, 20));
  check('a completed PILOT does not start the trial', pr?.status === 'completed' && row('userA').state === 'new' && EN().access.reason !== 'ok_trial');
  // safety stop on the first engine rep
  await V2().discardForSafety();
  check('a safety stop does not start the trial and records nothing', row('userA').state === 'new');
  const td: any = V2().today; check('setup: a rep is available to complete', td.kind === 'rep');
  await V2().complete(repAnswers(td), 1000);
  const afterRep = row('userA');
  check('completing the ENGINE rep starts the trial: server-stamped start, end exactly 348 h later', afterRep.state === 'trialing' && afterRep.trial_ends_at - afterRep.trial_started_at === 348 * 3600000);
  check('the client now reports trial access and the exact end instant', EN().access.reason === 'ok_trial' && EN().access.endsAt === afterRep.trial_ends_at);

  // account switch on the same device
  uid = 'userB'; await E.clearInnerRepV2Data();
  check('sign-out clears the entitlement cache and in-memory answer (history/export/delete remain allowed)', EN().userId === null && ![...mem.keys()].some((k) => k.startsWith('ent:v1:userA')) && EN().access.viewHistory && EN().access.exportFile && EN().access.deleteAccount);
  await V2().load('userB'); await new Promise((r) => setTimeout(r, 20));
  check('account B on the same device does not inherit A\'s trial', EN().userId === 'userB' && row('userB').state === 'new' && EN().access.reason === 'ok_first_rep' && EN().access.endsAt === null);
  check('A\'s server row is unchanged by B', row('userA').state === 'trialing');
  // server offline: a second account's first rep is pending, not lost
  server.mode = 'offline'; const tb: any = V2().today; await V2().complete(repAnswers(tb), 1000);
  check('offline first rep: allowed locally (pending), nothing started on the server', EN().access.reason === 'ok_pending' && row0(server) === 'new');
  server.mode = 'up'; await EN().sync('userB');
  check('reconnect: the pending first completion is delivered and the trial starts once', row('userB').state === 'trialing');
  function row0(s: ServerModel) { return (s.rows.get('userB') as any)?.state; }

  // ── practice registry and shelf
  check('registry: exactly one trial-starting practice (the engine rep); pilots never start it, never feed engine evidence', PRACTICES.filter((p) => p.startsTrial).map((p) => p.id).join() === 'engine_rep' && PRACTICES.every((p) => p.feedsEngineEvidence === false && p.memberGated) && practice('attend').chosenBy === 'person');
  const base: ShelfInput = { engineDoneToday: true, today: '2026-10-25', pilotRecords: [], safetyStopToday: false, easeMode: false, unfinishedPilot: null, allowed: true };
  check('shelf: nothing before today\'s engine rep, after a safety stop, in ease mode, with an unfinished pilot, or without access', [{ engineDoneToday: false }, { safetyStopToday: true }, { easeMode: true }, { unfinishedPilot: 'attend' as const }, { allowed: false }].every((o) => shelfOffer({ ...base, ...o }) === null));
  check('shelf: a first offer is deterministic', shelfOffer(base) === 'look_again');
  const rec = (pilot: any, date: string, status: any = 'completed') => ({ pilot, date, status });
  check('shelf: never the format done most recently, and never one done today', shelfOffer({ ...base, pilotRecords: [rec('look_again', '2026-10-24')] }) === 'attend' && shelfOffer({ ...base, pilotRecords: [rec('attend', '2026-10-23'), rec('look_again', '2026-10-24')] }) === 'attend' && shelfOffer({ ...base, pilotRecords: [rec('look_again', '2026-10-25')] }) === 'attend' && shelfOffer({ ...base, pilotRecords: [rec('look_again', '2026-10-25'), rec('attend', '2026-10-25')] }) === null);
  check('shelf: a left (unfinished) session does not count as done', shelfOffer({ ...base, pilotRecords: [rec('look_again', '2026-10-24', 'left')] }) === 'look_again');
  let bad = 0; let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < 2000; i++) { const recs = Array.from({ length: Math.floor(rnd() * 6) }, () => rec(rnd() < 0.5 ? 'look_again' : 'attend', `2026-10-${10 + Math.floor(rnd() * 15)}`, rnd() < 0.8 ? 'completed' : 'left')); const o = shelfOffer({ ...base, pilotRecords: recs }); const done = recs.filter((r) => r.status === 'completed').sort((a, b) => (a.date < b.date ? -1 : 1)); if (o && (done.at(-1)?.pilot === o || recs.some((r) => r.status === 'completed' && r.date === base.today && r.pilot === o))) bad++; }
  check('shelf property (2000 random histories): never repeats the most recent or a same-day format', bad === 0, String(bad));

  console.log(fails ? `\n${fails} FAILED` : '\nall entitlement host checks passed'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
