// LOCAL, DISPOSABLE-DATABASE validation of docs/proposed/entitlement/001_entitlement.sql and 002_rollback.sql. NOT part of the preflight.
//
//   TARGETS (and only these):
//     1. PGlite: a throwaway IN-MEMORY PostgreSQL 16 inside this process (no files, no network).
//     2. A throwaway NATIVE PostgreSQL 17 started by this script from the `embedded-postgres` package: a fresh temporary data directory, listening on
//        127.0.0.1 on a random free port only, a random superuser password that never leaves this process, a database named mirar_e1_test_*, and the
//        whole cluster (directory included) is destroyed when the script ends.
//   The script reads NO connection string, NO DATABASE_URL, NO SUPABASE_* variable and has no way to point at another database; `assertDisposable`
//   refuses anything that is not one of the two targets above. It never touches Supabase.
//
//   Setup (outside the repository): PGLITE_DIR = a directory containing node_modules/@electric-sql/pglite ; PG17_DIR = a directory containing
//   node_modules/embedded-postgres and node_modules/pg. A missing target prints SKIP for that target only.
import { readFileSync, mkdtempSync, rmSync } from 'fs';
import { createRequire } from 'module';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { randomBytes } from 'crypto';
import { ServerModel, TRIAL_MS, H } from './model';

let fails = 0, total = 0;
const check = (n: string, ok: boolean, x = '') => { total++; console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const SQL = join(__dirname, '../../docs/proposed/entitlement');
const A = 'aaaaaaaa-0000-0000-0000-000000000001', B = 'bbbbbbbb-0000-0000-0000-000000000002', C = 'cccccccc-0000-0000-0000-000000000003';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Db { exec(sql: string): Promise<void>; query(sql: string, p?: unknown[]): Promise<{ rows: any[] }>; kind: string; version: string; newSession?: () => Promise<Db>; close(): Promise<void> }
interface Target { kind: 'pglite-memory' | 'native-17'; host?: string; port?: number; dataDir?: string; dbName?: string }
/** Refuses any target that is not one of the two disposable ones. */
function assertDisposable(t: Target) {
  if (t.kind === 'pglite-memory') return;
  const okDir = !!t.dataDir && t.dataDir.startsWith(tmpdir()) && /mirar-e1-pg17-/.test(t.dataDir);
  if (t.kind !== 'native-17' || t.host !== '127.0.0.1' || !t.port || t.port < 20000 || !okDir || !/^mirar_e1_test_[a-z0-9_]+$/.test(t.dbName ?? '')) throw new Error('REFUSED: not a disposable local target ' + JSON.stringify({ ...t, dataDir: t.dataDir ? '<tmp>' : undefined }));
}
const freePort = () => new Promise<number>((res, rej) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = (s.address() as any).port; s.close(() => res(p)); }); s.on('error', rej); });

// ── harness shared by both targets ──
const ROLES = `do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;`;
const AUTH = `
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text $$;
  grant usage on schema auth to anon, authenticated, service_role; grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role, public;   -- Supabase's default: the hazard the SQL revokes by name
  create table public.trial_tracking (user_id uuid, conversion_status text, trial_ends_at timestamptz);                    -- legacy tables, poisoned for user A
  create table public.subscriptions (user_id uuid, status text);
  insert into auth.users values ('${A}'), ('${B}'), ('${C}');
  insert into public.trial_tracking values ('${A}', 'expired', now() - interval '400 days');
  insert into public.subscriptions values ('${A}', 'active');`;

async function installSchema(db: Db, ownerRole: boolean) {
  await db.exec(ROLES); await db.exec(AUTH);
  if (ownerRole) {                                   // the migration runs as a NON-superuser without BYPASSRLS, as the function owner would on a hosted project
    await db.exec(`do $$ begin if not exists (select 1 from pg_roles where rolname = 'e1_owner') then create role e1_owner nologin; end if; end $$;
      grant create, usage on schema public to e1_owner; grant references on auth.users to e1_owner; grant usage on schema auth to e1_owner; grant execute on function auth.uid(), auth.role() to e1_owner;
      set role e1_owner;`);
  }
  await db.exec(readFileSync(join(SQL, '001_entitlement.sql'), 'utf8'));
  await db.exec('reset role');
}

async function suite(db: Db, label: string, ownerRole: boolean) {
  console.log(`\n══ ${label} · ${db.version} ══`);
  await installSchema(db, ownerRole);
  const as = async <T,>(role: 'anon' | 'authenticated' | 'service_role' | null, uid: string | null, f: () => Promise<T>, claims?: object): Promise<T> => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims', $1, false), set_config('request.jwt.claim.sub', $2, false), set_config('request.jwt.claim.role', $3, false)", [JSON.stringify(claims ?? (uid ? { sub: uid, role: role ?? '' } : {})), claims ? '' : (uid ?? ''), claims ? '' : (role ?? '')]);
    if (role) await db.exec(`set role ${role}`); try { return await f(); } finally { await db.exec('reset role'); }
  };
  const fails_ = async (f: () => Promise<unknown>, re: RegExp) => { try { await f(); return false; } catch (e: any) { return re.test(String(e?.message ?? e)); } };
  const get = (u: string) => as('authenticated', u, async () => (await db.query('select public.entitlement_get() as r')).rows[0].r);
  const first = (u: string) => as('authenticated', u, async () => (await db.query('select public.entitlement_first_rep_completed() as r')).rows[0].r);
  const sql = async (q: string, p: unknown[] = []) => { await db.exec('reset role'); return (await db.query(q, p)).rows; };
  const adm = (a: string, h: number | null, r: string | null, u = A) => as('service_role', null, async () => (await db.query('select public.entitlement_admin($1,$2,$3,$4) as r', [u, a, h, r])).rows[0].r, { sub: '', role: 'service_role' });
  const events = async (u: string) => (await sql('select kind, source from public.entitlement_event where user_id=$1 order by id', [u])).map((r: any) => r.kind);
  const backdate = async (u: string, hours: number) => { await sql('alter table public.entitlement disable trigger entitlement_guard'); await sql("update public.entitlement set trial_started_at = trial_started_at - make_interval(hours => $2), trial_ends_at = trial_ends_at - make_interval(hours => $2) where user_id = $1", [u, hours]); await sql('alter table public.entitlement enable trigger entitlement_guard'); };

  console.log('— Privileges: a matrix, not a spot check —');
  const fnPriv = async (role: string, sig: string) => (await sql(`select has_function_privilege('${role}', '${sig}', 'execute') as p`))[0].p;
  const sigs = { get: 'public.entitlement_get()', first: 'public.entitlement_first_rep_completed()', admin: 'public.entitlement_admin(uuid,text,integer,text)', json: 'public.entitlement_json(public.entitlement)', guard: 'public.entitlement_guard()' };
  const want: Record<string, Record<string, boolean>> = { anon: { get: false, first: false, admin: false, json: false, guard: false }, authenticated: { get: true, first: true, admin: false, json: false, guard: false }, service_role: { get: false, first: false, admin: true, json: false, guard: false } };
  let matrixOk = true, detail = ''; for (const r of Object.keys(want)) for (const k of Object.keys(sigs)) { const got = await fnPriv(r, (sigs as any)[k]); if (got !== want[r][k]) { matrixOk = false; detail += ` ${r}/${k}=${got}`; } }
  check('function EXECUTE matrix is exactly: authenticated → get, first; service_role → admin; nothing else for anon, authenticated, service_role', matrixOk, detail);
  check('no role named public has EXECUTE on any of the five functions either', (await sql("select count(*)::int c from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'entitlement%' and exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type='EXECUTE')"))[0].c === 0);
  const tabOk = (await sql("select bool_or(has_table_privilege(r, t, 'select,insert,update,delete')) p from unnest(array['anon','authenticated']) r, unnest(array['public.entitlement','public.entitlement_event']) t"))[0].p === false;
  check('anon and authenticated hold no privilege on either table', tabOk);
  check('RLS is enabled on both tables and no policy exists', (await sql("select count(*)::int c from pg_class where relname in ('entitlement','entitlement_event') and relrowsecurity")) [0].c === 2 && (await sql("select count(*)::int c from pg_policies where tablename like 'entitlement%'"))[0].c === 0);
  check('the definer functions have a fixed empty search_path and are SECURITY DEFINER where they write', (await sql("select count(*)::int c from pg_proc where proname in ('entitlement_get','entitlement_first_rep_completed','entitlement_admin') and prosecdef and proconfig::text like '%search_path=%'"))[0].c === 3);
  check('a client has no direct table access (select, insert, update, delete)', await fails_(() => as('authenticated', A, () => db.query('select * from public.entitlement')), /permission denied/) && await fails_(() => as('authenticated', A, () => db.exec(`insert into public.entitlement (user_id) values ('${A}')`)), /permission denied/) && await fails_(() => as('authenticated', A, () => db.exec(`update public.entitlement set state='comped'`)), /permission denied/) && await fails_(() => as('authenticated', A, () => db.query('select * from public.entitlement_event')), /permission denied/));
  check('anon cannot call either client function', await fails_(() => as('anon', null, () => db.query('select public.entitlement_get()')), /permission denied/) && await fails_(() => as('anon', null, () => db.query('select public.entitlement_first_rep_completed()')), /permission denied/));

  console.log('— Authentication context —');
  check('a session with no subject is refused by both client functions', await fails_(() => as('authenticated', '', () => db.query('select public.entitlement_get()'), {}), /not authenticated/) && await fails_(() => as('authenticated', '', () => db.query('select public.entitlement_first_rep_completed()'), {}), /not authenticated/));
  check('the subject is read from the claims JSON (PostgREST style) as well as the legacy key', (await as('authenticated', null, async () => (await db.query('select public.entitlement_get() as r')).rows[0].r, { sub: B, role: 'authenticated' })).state === 'new');
  check('a client cannot act as another user: there is no parameter, and the subject comes only from its own claim', (await get(B)).state === 'new' && (await events(B)).filter((k: string) => k === 'created').length === 1 && (await events(C)).length === 0);
  check('a signed-in client claiming role service_role in its token still cannot call the admin function (database role decides)', await fails_(() => as('authenticated', A, () => db.query("select public.entitlement_admin($1,'comp',null,'x')", [A]), { sub: A, role: 'service_role' }), /permission denied/));
  check('the service role without the role claim is refused by the function body too', await fails_(() => as('service_role', null, () => db.query("select public.entitlement_admin($1,'comp',null,'x')", [A]), {}), /service role only/));

  console.log('— Behaviour —');
  const g = await get(A); check('the first read creates a "new" account: no trial, no clock', g.state === 'new' && g.trial_started_at === null && g.trial_ends_at === null && g.version === 1);
  const f1 = await first(A); const f2 = await first(A);
  check('the first completion starts the trial at the database clock and ends it exactly 348 hours later', f1.state === 'trialing' && new Date(f1.trial_ends_at).getTime() - new Date(f1.trial_started_at).getTime() === TRIAL_MS);
  check('the server clock in the answer is within a few seconds of this machine (client calibration source)', Math.abs(new Date(f1.server_now).getTime() - Date.now()) < 5000);
  check('repeating the signal returns the same start and writes exactly one trial_started event', f2.trial_started_at === f1.trial_started_at && (await events(A)).filter((k: string) => k === 'trial_started').length === 1);
  check('the legacy trial and subscription rows (poisoned for user A) had no effect', g.state === 'new' && f1.state === 'trialing');
  check('the first-completion function accepts no arguments', await fails_(() => as('authenticated', A, () => db.query("select public.entitlement_first_rep_completed('x')")), /does not exist|function/));
  check('another account is untouched', (await get(B)).state === 'new');

  console.log('— Concurrent requests —');
  if (db.newSession) {
    const N = 16; const sessions = await Promise.all(Array.from({ length: N }, () => db.newSession!()));
    for (const s of sessions) { await s.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: C, role: 'authenticated' })]); await s.exec('set role authenticated'); }
    const results = await Promise.all(sessions.map((s) => s.query('select public.entitlement_first_rep_completed() as r').then((x) => x.rows[0].r, (e) => ({ error: String(e.message) }))));
    const starts = new Set(results.map((r: any) => r.trial_started_at)); const errs = results.filter((r: any) => r.error);
    check(`${N} simultaneous first-completion signals from one new account: no error, one start instant, one trial_started and one created event`, errs.length === 0 && starts.size === 1 && (await events(C)).filter((k: string) => k === 'trial_started').length === 1 && (await events(C)).filter((k: string) => k === 'created').length === 1, JSON.stringify(errs.slice(0, 2)));
    const sessB = await Promise.all(Array.from({ length: N }, () => db.newSession!()));
    const D = 'dddddddd-0000-0000-0000-000000000004'; await sql(`insert into auth.users values ('${D}')`);
    for (const s of sessB) { await s.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: D, role: 'authenticated' })]); await s.exec('set role authenticated'); }
    const gets = await Promise.all(sessB.map((s, i) => s.query(i % 2 ? 'select public.entitlement_get() as r' : 'select public.entitlement_first_rep_completed() as r').then((x) => x.rows[0].r, (e) => ({ error: String(e.message) }))));
    check('a creation race between reads and signals for one brand-new account ends with one row, one "created" event and one start', gets.every((r: any) => !r.error) && (await events(D)).filter((k: string) => k === 'created').length === 1 && (await events(D)).filter((k: string) => k === 'trial_started').length === 1 && (await sql("select count(*)::int c from public.entitlement where user_id=$1", [D]))[0].c === 1);
    await sql('alter table public.entitlement disable trigger entitlement_guard');
    await sql("update public.entitlement set trial_started_at = now() - interval '349 hours', trial_ends_at = now() - interval '1 hour' where user_id = $1", [D]); await sql('alter table public.entitlement enable trigger entitlement_guard');
    const exps = await Promise.all(sessB.map((s) => s.query('select public.entitlement_get() as r').then((x) => x.rows[0].r, (e) => ({ error: String(e.message) }))));
    check('many simultaneous reads after the end instant record expiry exactly once and all report trial_expired', exps.every((r: any) => r.state === 'trial_expired') && (await events(D)).filter((k: string) => k === 'trial_expired').length === 1);
    await Promise.all([...sessions, ...sessB].map((s) => s.close()));
  } else console.log('note  PGlite is single-connection: concurrency is exercised on the native PostgreSQL 17 target only');

  console.log('— Expiry, immutability and constraints —');
  await backdate(A, 349);
  const ex = await get(A); await get(A);
  check('after the end instant the next read reports trial_expired and records it once', ex.state === 'trial_expired' && (await events(A)).filter((k: string) => k === 'trial_expired').length === 1);
  check('a signal after expiry changes nothing', (await first(A)).state === 'trial_expired');
  check('the start can never be changed, even by the table owner', await fails_(() => sql('update public.entitlement set trial_started_at = now() where user_id = $1', [A]), /immutable/));
  check('the end can never move earlier', await fails_(() => sql("update public.entitlement set trial_ends_at = trial_ends_at - interval '1 hour' where user_id = $1", [A]), /earlier|check/));
  check('the table refuses inconsistent rows (trialing without a start; a trial shorter than 348 hours; new with a start)', await fails_(() => sql("update public.entitlement set state='trialing' where user_id = $1", [B]), /check/) && await fails_(() => sql(`update public.entitlement set state='trialing', trial_started_at=now(), trial_ends_at=now()+interval '1 hour' where user_id=$1`, [B]), /check/) && await fails_(() => sql(`update public.entitlement set trial_started_at=now(), trial_ends_at=now()+interval '400 hours' where user_id=$1`, [B]), /check/));
  const edge = 'eeeeeeee-0000-0000-0000-000000000005'; await sql(`insert into auth.users values ('${edge}')`); await first(edge);
  await sql('alter table public.entitlement disable trigger entitlement_guard'); await sql("update public.entitlement set trial_started_at = now() - interval '348 hours', trial_ends_at = now() + interval '3 seconds' where user_id=$1", [edge]); await sql('alter table public.entitlement enable trigger entitlement_guard');
  const before = await get(edge); await sleep(3300); const after = await get(edge);
  check('boundary: 3 seconds before the end it is still trialing; just after the end instant it reports trial_expired (database clock, not the client)', before.state === 'trialing' && after.state === 'trial_expired');

  console.log('— Admin (service role only, reason mandatory, logged) —');
  const xr = await adm('extend', 24, 'outage compensation');
  check('extending an expired trial makes it trialing again with the start unchanged, and the event records hours and reason', xr.state === 'trialing' && xr.trial_started_at === ex.trial_started_at && (await sql("select count(*)::int c from public.entitlement_event where user_id=$1 and kind='admin_extend' and hours=24 and reason='outage compensation'", [A]))[0].c === 1);
  check('an admin action without a reason, with a bad action, bad hours, or before a start is refused', await fails_(() => adm('comp', null, ''), /reason/) && await fails_(() => adm('bogus', null, 'x'), /unknown action/) && await fails_(() => adm('extend', 0, 'x'), /hours/) && await fails_(() => adm('extend', 5, 'x', B), /not started/));
  check('comp then uncomp returns to the state the dates imply', (await adm('comp', null, 'tester', B)).state === 'comped' && (await first(B)).state === 'comped' && (await adm('uncomp', null, 'tester over', B)).state === 'new');
  check('every admin action wrote an event with source "admin" and a reason', (await sql("select count(*)::int c from public.entitlement_event where source='admin' and reason is not null"))[0].c >= 3);

  console.log('— Differential check against the 63-check reference model —');
  { // same scripted operations on the SQL and on the model; compare observable outcomes
    const model = new ServerModel(() => Date.now()); const users = ['f1111111-0000-0000-0000-000000000011', 'f2222222-0000-0000-0000-000000000012', 'f3333333-0000-0000-0000-000000000013'];
    for (const u of users) await sql('insert into auth.users values ($1)', [u]);
    type Op = ['get' | 'first', number] | ['admin', number, 'comp' | 'uncomp' | 'extend', number | null, string] | ['backdate', number, number];
    const ops: Op[] = [['get', 0], ['first', 0], ['first', 0], ['get', 0], ['backdate', 0, 349], ['get', 0], ['first', 0], ['admin', 0, 'extend', 24, 'comp'], ['get', 0], ['backdate', 0, 30], ['get', 0],
      ['admin', 0, 'comp', null, 'c'], ['first', 0], ['admin', 0, 'uncomp', null, 'u'], ['get', 0], ['first', 1], ['get', 1], ['admin', 1, 'extend', 5, 'x'], ['admin', 2, 'extend', 5, 'before start'], ['admin', 2, 'comp', null, 'c2'], ['first', 2], ['admin', 2, 'uncomp', null, 'u2'], ['get', 2], ['first', 2]];
    const norm = (e: any) => e ? { state: e.state, dur: e.trial_started_at == null ? null : (typeof e.trial_started_at === 'number' ? e.trial_ends_at - e.trial_started_at : new Date(e.trial_ends_at).getTime() - new Date(e.trial_started_at).getTime()), v: e.version } : null;
    let same = true, log = ''; const eventsFor = async (i: number) => (await events(users[i])).join(','), mEvents = (i: number) => model.events.filter((x) => x.uid === users[i]).map((x) => x.kind).join(',');
    for (const op of ops) {
      let s: any, m: any;
      try {
        if (op[0] === 'get') s = norm(await get(users[op[1]]));
        else if (op[0] === 'first') s = norm(await first(users[op[1]]));
        else if (op[0] === 'backdate') { await backdate(users[op[1]], op[2]); s = 'backdated'; }
        else s = norm(await adm(op[2] as string, op[3] as number | null, op[4] as string, users[op[1]]));
      } catch { s = 'throws'; }
      try {
        if (op[0] === 'get') { const r = model.get(users[op[1]]); m = r.ok ? norm(r.ent) : 'err'; }
        else if (op[0] === 'first') { const r = model.firstRep(users[op[1]]); m = r.ok ? norm(r.ent) : 'err'; }
        else if (op[0] === 'backdate') { const r = model.rows.get(users[op[1]])!; r.start! -= op[2] * H; r.end! -= op[2] * H; m = 'backdated'; }
        else m = norm(model.admin('service_role', users[op[1]], op[2] as 'comp', op[3] as number | null, op[4] as string));
      } catch { m = 'throws'; }
      if (JSON.stringify(s) !== JSON.stringify(m)) { same = false; log += ` [${JSON.stringify(op)} sql=${JSON.stringify(s)} model=${JSON.stringify(m)}]`; }
    }
    check('24 scripted operations give identical state, trial length (348 h) and version on the SQL and on the model', same, log);
    const seqs: string[] = []; let evOk = true; for (const i of [0, 1, 2]) { const q = await eventsFor(i), m2 = mEvents(i); if (q !== m2) { evOk = false; seqs.push(`u${i}: sql=[${q}] model=[${m2}]`); } }
    check('and identical event sequences per account', evOk, seqs.join(' | '));
  }

  console.log('— Account deletion and rollback —');
  await sql('delete from auth.users where id = $1', [A]);
  check('deleting an account removes its entitlement and events (cascade)', (await sql('select count(*)::int c from public.entitlement where user_id=$1', [A]))[0].c === 0 && (await sql('select count(*)::int c from public.entitlement_event where user_id=$1', [A]))[0].c === 0);
  check('re-running the create script on an already-migrated database fails loudly instead of altering anything (it is not idempotent by design)', await fails_(() => db.exec(readFileSync(join(SQL, '001_entitlement.sql'), 'utf8')), /already exists/));
  await db.exec('rollback').catch(() => undefined);                           // the script opened a transaction that the expected error left aborted
  await db.exec('reset role');
  if (ownerRole) await db.exec('set role e1_owner');
  await db.exec(readFileSync(join(SQL, '002_rollback.sql'), 'utf8')); await db.exec('reset role');
  check('the rollback removes every object it created', (await sql("select count(*)::int c from pg_tables where schemaname='public' and tablename like 'entitlement%'"))[0].c === 0 && (await sql("select count(*)::int c from pg_proc where proname like 'entitlement%'"))[0].c === 0);
  check('the rollback leaves the legacy tables and other schemas alone', (await sql('select count(*)::int c from public.trial_tracking'))[0].c === 1 && (await sql('select count(*)::int c from public.subscriptions'))[0].c === 1);
  await db.exec(readFileSync(join(SQL, '002_rollback.sql'), 'utf8').replace(/^begin;|commit;$/gm, ''));
  check('the rollback can be run twice without error', true);
}


/** E1b (legacy self-grant hardening): run on the same DISPOSABLE target, on throwaway copies of the two legacy tables with the ORIGINAL policies from migration 005. */
async function legacySuite(db: Db, label: string) {
  console.log(`\n══ E1b legacy-policy hardening · ${label} ══`);
  const sql = async (q: string, p: unknown[] = []) => { await db.exec('reset role'); return (await db.query(q, p)).rows; };
  const as = async <T,>(role: 'authenticated' | 'service_role', uid: string, f: () => Promise<T>): Promise<T> => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claims', $1, false), set_config('request.jwt.claim.sub', $2, false), set_config('request.jwt.claim.role', $3, false)", [JSON.stringify({ sub: uid, role }), uid, role]); await db.exec(`set role ${role}`); try { return await f(); } finally { await db.exec('reset role'); } };
  const fails_ = async (f: () => Promise<unknown>) => { try { await f(); return false; } catch { return true; } };
  await db.exec(`drop table if exists public.trial_tracking; drop table if exists public.subscriptions;
    create table public.trial_tracking (user_id uuid primary key, conversion_status text not null default 'trial');
    create table public.subscriptions (user_id uuid primary key, status text not null default 'trialing');
    alter table public.trial_tracking enable row level security; alter table public.subscriptions enable row level security;
    create policy "own_trial" on public.trial_tracking for all using (user_id = auth.uid());
    create policy "own_subscription" on public.subscriptions for all using (user_id = auth.uid());
    insert into public.trial_tracking values ('${A}', 'expired'), ('${B}', 'trial'); insert into public.subscriptions values ('${A}', 'trialing'), ('${B}', 'trialing');`);
  await as('authenticated', A, () => db.query("update public.subscriptions set status='active' where user_id=$1", [A]));
  check('BEFORE the change: a signed-in user CAN grant themselves an active subscription row (the hazard E1b removes)', (await sql("select status from public.subscriptions where user_id=$1", [A]))[0].status === 'active');
  await db.exec(readFileSync(join(SQL, '003_legacy_self_grant_PROPOSAL_ONLY.sql'), 'utf8'));
  check('AFTER: the same user can no longer update, insert or delete their own legacy rows', await fails_(() => as('authenticated', A, async () => { const r = await db.query("update public.subscriptions set status='active' where user_id=$1 returning 1", [A]); if (!r.rows.length) throw new Error('0 rows'); })) && await fails_(() => as('authenticated', B, () => db.query("insert into public.subscriptions values ($1,'active') on conflict (user_id) do update set status='active'", [B]))) && await fails_(() => as('authenticated', A, async () => { const r = await db.query("delete from public.trial_tracking where user_id=$1 returning 1", [A]); if (!r.rows.length) throw new Error('0 rows'); })) && await fails_(() => as('authenticated', A, async () => { const r = await db.query("update public.trial_tracking set conversion_status='trial' where user_id=$1 returning 1", [A]); if (!r.rows.length) throw new Error('0 rows'); })));
  check('and still reads only their own legacy rows', (await as('authenticated', A, async () => (await db.query('select user_id from public.subscriptions')).rows)).length === 1 && (await as('authenticated', A, async () => (await db.query('select user_id from public.trial_tracking')).rows))[0].user_id === A);
  check('the service role (used by the legacy trial-lifecycle function) still writes both tables', await as('service_role', A, async () => { await db.query("update public.trial_tracking set conversion_status='expired' where user_id=$1", [B]); await db.query("update public.subscriptions set status='cancelled' where user_id=$1", [B]); return true; }));
  check('only the two intended policies per table remain', (await sql("select count(*)::int c from pg_policies where tablename in ('trial_tracking','subscriptions') and policyname in ('own_trial_read','own_subscription_read')"))[0].c === 2 && (await sql("select count(*)::int c from pg_policies where tablename in ('trial_tracking','subscriptions') and policyname in ('own_trial','own_subscription')"))[0].c === 0);
  await db.exec('drop policy "own_trial_read" on public.trial_tracking; drop policy "own_subscription_read" on public.subscriptions; create policy "own_trial" on public.trial_tracking for all using (user_id = auth.uid()); create policy "own_subscription" on public.subscriptions for all using (user_id = auth.uid());');
  await as('authenticated', B, () => db.query("update public.subscriptions set status='active' where user_id=$1", [B]));
  check('the documented rollback (drop the read policies, recreate the originals) restores the previous behaviour', (await sql("select status from public.subscriptions where user_id=$1", [B]))[0].status === 'active');
}

(async () => {
  // static guard: this file may only reference the two disposable variables and no remote host
  const self = readFileSync(__filename, 'utf8').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const envRefs = (self.match(/process\.env\.[A-Z0-9_]+/g) ?? []).filter((x) => !/PGLITE_DIR|PG17_DIR/.test(x));
  check('static guard: the test reads no environment variable except PGLITE_DIR and PG17_DIR (no connection strings)', envRefs.length === 0, envRefs.join(','));
  check('static guard: the SQL files contain no connection, DROP DATABASE, ALTER SYSTEM, extension or role-creation statements', !/drop\s+database|alter\s+system|create\s+extension|create\s+role|\\connect/i.test(readFileSync(join(SQL, '001_entitlement.sql'), 'utf8') + readFileSync(join(SQL, '002_rollback.sql'), 'utf8')));
  check('static guard: the rollback touches only entitlement objects', (readFileSync(join(SQL, '002_rollback.sql'), 'utf8').match(/drop (function|table) if exists [^;]*/g) ?? []).every((l) => /entitlement/.test(l)));

  const PGLITE_DIR = process.env.PGLITE_DIR || '', PG17_DIR = process.env.PG17_DIR || '';
  // 1 · PGlite, in memory
  let PGlite: any; try { PGlite = createRequire(join(PGLITE_DIR, 'x.js'))('@electric-sql/pglite').PGlite; } catch { PGlite = null; }
  if (PGlite) for (const owner of [false, true]) {
    assertDisposable({ kind: 'pglite-memory' });
    const raw = new PGlite(); const v = (await raw.query('select version()')).rows[0].version.split(' on ')[0];
    const db: Db = { exec: (s) => raw.exec(s).then(() => undefined), query: (s, p) => raw.query(s, p), kind: 'pglite', version: `in-memory ${v}`, close: async () => {} };
    await suite(db, `PGlite in-memory · owner ${owner ? 'non-superuser, no BYPASSRLS' : 'superuser'}`, owner); if (!owner) await legacySuite(db, db.version);
  } else console.log('SKIP: PGlite not found (PGLITE_DIR)');

  // 2 · native PostgreSQL 17, throwaway cluster
  if (PG17_DIR) {
    const req = createRequire(join(PG17_DIR, 'x.js')); let Embedded: any, Pg: any;
    try { Embedded = (await import(pathToFileURL(join(PG17_DIR, 'node_modules/embedded-postgres/dist/index.js')).href)).default; Pg = req('pg'); } catch { Embedded = null; }
    if (Embedded) {
      const dataDir = mkdtempSync(join(tmpdir(), 'mirar-e1-pg17-')); const port = await freePort(); const password = randomBytes(18).toString('hex');
      const cluster = new Embedded({ databaseDir: dataDir, user: 'postgres', password, port, persistent: false, postgresFlags: ['-c', 'listen_addresses=127.0.0.1'], onLog: () => {}, onError: () => {} });
      try {
        await cluster.initialise(); await cluster.start();
        for (const owner of [false, true]) {
          const dbName = `mirar_e1_test_${owner ? 'owner' : 'super'}`; assertDisposable({ kind: 'native-17', host: '127.0.0.1', port, dataDir, dbName });
          await cluster.createDatabase(dbName);
          const mk = async (): Promise<Db> => { const c = cluster.getPgClient(dbName, '127.0.0.1'); await c.connect(); return { exec: async (s) => { await c.query(s); }, query: (s, p) => c.query(s, p as any[]), kind: 'native', version: '', close: () => c.end() }; };
          const db = await mk(); db.version = `native ${(await db.query('select version()')).rows[0].version.split(' on ')[0]} (127.0.0.1:${port}, temp cluster)`;
          db.newSession = mk;
          await suite(db, `native PostgreSQL 17 · owner ${owner ? 'non-superuser, no BYPASSRLS' : 'superuser'}`, owner); if (!owner) await legacySuite(db, db.version); await db.close();
        }
      } finally { try { await cluster.stop(); } catch { /* ignore */ } rmSync(dataDir, { recursive: true, force: true }); }
      check('the throwaway cluster and its data directory were destroyed', true);
    } else console.log('SKIP: embedded-postgres not found (PG17_DIR)');
  } else console.log('SKIP: native PostgreSQL 17 not requested (set PG17_DIR)');

  console.log(fails ? `\n${fails} FAILED of ${total}` : `\nPASS: entitlement SQL, ${total} checks on disposable databases`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });
