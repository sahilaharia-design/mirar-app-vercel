// Differential test: lib/entitlement/client.ts (async, app-facing) must behave EXACTLY like the executable spec scripts/entitlement/model.ts
// (sync). Same random operation sequences are run through both against the same server model; every reply and every Access must be identical.
// Run: npx tsx scripts/entitlement/client-port.test.ts
import { EntitlementClient as Spec, MemoryKV, ServerModel, H, TRIAL_MS, FRESH_MS, PENDING_MS, MAX_REPS_BETWEEN_CONTACTS, BACKWARD_TOLERANCE_MS } from './model';
import * as Lib from '../../lib/entitlement/client';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
check('constants equal the spec', Lib.H === H && Lib.TRIAL_MS === TRIAL_MS && Lib.FRESH_MS === FRESH_MS && Lib.PENDING_MS === PENDING_MS && Lib.MAX_REPS_BETWEEN_CONTACTS === MAX_REPS_BETWEEN_CONTACTS && Lib.BACKWARD_TOLERANCE_MS === BACKWARD_TOLERANCE_MS && Lib.TRIAL_MS === 348 * 3_600_000);
let seed = 20261023; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const T0 = Date.UTC(2026, 9, 15, 4, 0);

(async () => {
  let ops = 0, diffs = 0, denied = 0, allowed = 0;
  for (let run = 0; run < 400; run++) {
    const w = { now: T0, skew: Math.floor((rnd() - 0.5) * 6 * H) };
    const serverS = new ServerModel(() => w.now), serverL = new ServerModel(() => w.now); const device = () => w.now + w.skew;   // one server model per client, driven identically
    const kvS = new MemoryKV(); const spec = new Spec({ kv: kvS, device, server: serverS });
    const m = new Map<string, string>();
    const kvL: Lib.EntKV = { get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); }, del: async (k) => { m.delete(k); } };
    let uid = 'a';
    // the lib client sees the same server through the async port, bound to the current uid (the real port is session-bound)
    const port: Lib.EntServerPort = { get: async () => serverL.get(uid) as Lib.Reply, firstRep: async () => serverL.firstRep(uid) as Lib.Reply };
    const lib = new Lib.EntitlementClient({ kv: kvL, device, server: port });
    const same = (a: unknown, b: unknown, what: string) => { ops++; if (JSON.stringify(a) !== JSON.stringify(b)) { diffs++; if (diffs < 4) console.log('DIFF', run, what, JSON.stringify(a), JSON.stringify(b)); } };
    const steps = 40 + Math.floor(rnd() * 40);
    for (let i = 0; i < steps; i++) {
      const r = rnd();
      if (r < 0.25) w.now += Math.floor(rnd() * 30 * H);
      else if (r < 0.30) w.skew += Math.floor((rnd() - 0.5) * 8 * H);                         // device clock jumps (either way)
      else if (r < 0.40) serverS.mode = serverL.mode = (['up', 'up', 'offline', 'unavailable'] as const)[Math.floor(rnd() * 4)];
      else if (r < 0.44) serverS.dropNextReply = serverL.dropNextReply = true;
      else if (r < 0.50) { uid = rnd() < 0.5 ? 'a' : 'b'; }
      else if (r < 0.58) same(spec.sync(uid), await lib.sync(uid), 'sync');
      else if (r < 0.68) same(spec.recordFirstRepCompleted(uid), await lib.recordFirstRepCompleted(uid), 'first');
      else if (r < 0.78) { spec.recordRepCompleted(uid); await lib.recordRepCompleted(uid); }
      else if (r < 0.82) { spec.signOut(uid); await lib.signOut(uid); }
      else { const o = { repInProgress: rnd() < 0.2 }; const a = spec.access(uid, o), b = await lib.access(uid, o); same(a, b, 'access'); a.memberReps ? allowed++ : denied++; }
    }
    same([...kvS.m.entries()], [...m.entries()], 'storage');
  }
  check(`400 random runs, ${ops} compared outputs: async client identical to the spec (diffs ${diffs})`, diffs === 0);
  check('the sequences exercised both allowed and denied access', allowed > 200 && denied > 200, `${allowed}/${denied}`);

  // direct contract spot-checks against the lib itself
  const w = { now: T0 }; const server = new ServerModel(() => w.now); const m = new Map<string, string>();
  const kv: Lib.EntKV = { get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); }, del: async (k) => { m.delete(k); } };
  const c = new Lib.EntitlementClient({ kv, device: () => w.now, server: { get: async () => server.get('u') as Lib.Reply, firstRep: async () => server.firstRep('u') as Lib.Reply } });
  await c.sync('u'); check('new account: first rep allowed, history/export/delete never gated', (await c.access('u')).memberReps && (await c.access('u')).exportFile === true);
  check('first completion starts the trial', (await c.recordFirstRepCompleted('u')) === 'started' && (await c.access('u')).endsAt === T0 + TRIAL_MS);
  w.now = T0 + TRIAL_MS; const ex = await c.access('u');
  check('at 348 h the client denies new member reps but keeps history, export and deletion', !ex.memberReps && ex.reason === 'expired' && ex.viewHistory && ex.exportFile && ex.deleteAccount);
  check('a rep begun before expiry may be finished', (await c.access('u', { repInProgress: true })).memberReps);
  console.log(fails ? `\n${fails} FAILED` : '\nall entitlement client checks passed'); process.exit(fails ? 1 : 0);
})();
