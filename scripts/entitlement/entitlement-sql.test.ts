// *** WRITTEN BUT NOT RUN. NOT IN THE PREFLIGHT. Run only after the founder approves E1 (docs/product/E1_ENTITLEMENT_PROPOSAL.md). ***
// Executes docs/proposed/entitlement/001_entitlement.sql (and 002_rollback.sql) against a THROWAWAY IN-MEMORY PostgreSQL (PGlite). It never touches
// Supabase. PGlite is kept out of the repository's dependencies: set PGLITE_DIR to a directory that has @electric-sql/pglite installed.
// Without it this prints SKIP and exits 0. Note: PGlite is Postgres 16; the Supabase project runs 17, so a real Postgres 17 run is also required before E2.
import { readFileSync } from 'fs';
import { join } from 'path';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const DIR = process.env.PGLITE_DIR || '';
const SQL = join(__dirname, '../../docs/proposed/entitlement');
const A = 'aaaaaaaa-0000-0000-0000-000000000001', B = 'bbbbbbbb-0000-0000-0000-000000000002';

(async () => {
  let PGlite: any; try { PGlite = require(join(DIR, 'node_modules/@electric-sql/pglite')).PGlite; } catch { console.log('SKIP: PGlite is not installed (set PGLITE_DIR). The SQL was not executed.'); process.exit(0); }
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
    grant usage on schema auth to anon, authenticated, service_role; grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role, public;   -- Supabase's default, the hazard the SQL revokes by name
    create table public.trial_tracking (user_id uuid, conversion_status text, trial_ends_at timestamptz);                    -- legacy tables, poisoned below
    create table public.subscriptions (user_id uuid, status text);
    insert into auth.users values ('${A}'), ('${B}');
    insert into public.trial_tracking values ('${A}', 'expired', now() - interval '400 days');
    insert into public.subscriptions values ('${A}', 'active');
  `);
  await db.exec(readFileSync(join(SQL, '001_entitlement.sql'), 'utf8'));
  const as = async <T,>(role: 'anon' | 'authenticated' | 'service_role' | null, uid: string | null, f: () => Promise<T>): Promise<T> => {
    await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? '']); await db.query("select set_config('request.jwt.claim.role', $1, false)", [role ?? '']);
    if (role) await db.exec(`set role ${role}`); try { return await f(); } finally { await db.exec('reset role'); }
  };
  const fails_ = async (f: () => Promise<unknown>, re: RegExp) => { try { await f(); return false; } catch (e: any) { return re.test(String(e?.message ?? e)); } };
  const get = (u: string) => as('authenticated', u, async () => (await db.query('select public.entitlement_get() as r')).rows[0].r);
  const first = (u: string) => as('authenticated', u, async () => (await db.query('select public.entitlement_first_rep_completed() as r')).rows[0].r);
  const sql = async (q: string, p: unknown[] = []) => { await db.exec('reset role'); return (await db.query(q, p)).rows; };

  console.log('— Privileges and security model —');
  check('a signed-in client has no direct table access (select, insert, update, delete all refused)', await fails_(() => as('authenticated', A, () => db.query('select * from public.entitlement')), /permission denied/) && await fails_(() => as('authenticated', A, () => db.exec(`insert into public.entitlement (user_id) values ('${A}')`)), /permission denied/) && await fails_(() => as('authenticated', A, () => db.query('select * from public.entitlement_event')), /permission denied/));
  check('anon cannot call either client function', await fails_(() => as('anon', null, () => db.query('select public.entitlement_get()')), /permission denied/) && await fails_(() => as('anon', null, () => db.query('select public.entitlement_first_rep_completed()')), /permission denied/));
  check('a signed-in client cannot call the admin function or the internal helpers', await fails_(() => as('authenticated', A, () => db.query("select public.entitlement_admin($1,'comp',null,'x')", [A])), /permission denied/) && await fails_(() => as('authenticated', A, () => db.query('select public.entitlement_guard()')), /permission denied/));
  check('a session with no subject is refused', await fails_(() => as('authenticated', '', () => db.query('select public.entitlement_get()')), /not authenticated/));

  console.log('— Behaviour —');
  const g = await get(A); check('the first read creates a "new" account: no trial, no clock', g.state === 'new' && g.trial_started_at === null && g.trial_ends_at === null);
  const f1 = await first(A); const f2 = await first(A);
  check('the first completion starts the trial at the database clock and ends it exactly 348 hours later', f1.state === 'trialing' && (new Date(f1.trial_ends_at).getTime() - new Date(f1.trial_started_at).getTime()) === 348 * 3600000);
  check('repeating the signal changes nothing (same start, one event)', f2.trial_started_at === f1.trial_started_at && (await sql("select count(*)::int c from public.entitlement_event where user_id=$1 and kind='trial_started'", [A]))[0].c === 1);
  check('the legacy trial and subscription rows (poisoned for this user) had no effect', g.state === 'new' && f1.state === 'trialing');
  check('another account is untouched', (await get(B)).state === 'new');
  check('the signal accepts no arguments (calling it with one is a type error, so nothing about the rep can be sent)', await fails_(() => as('authenticated', A, () => db.query("select public.entitlement_first_rep_completed('x')")), /does not exist|function/));

  console.log('— Expiry, immutability and constraints (history is back-dated by a superuser with the guard trigger off; only the test does this) —');
  await db.exec('alter table public.entitlement disable trigger entitlement_guard');
  await db.query("update public.entitlement set trial_started_at = now() - interval '349 hours', trial_ends_at = now() - interval '1 hour' where user_id = $1", [A]);
  await db.exec('alter table public.entitlement enable trigger entitlement_guard');
  const ex = await get(A); await get(A);
  check('after the end instant the next read reports "trial_expired" and records it once', ex.state === 'trial_expired' && (await sql("select count(*)::int c from public.entitlement_event where user_id=$1 and kind='trial_expired'", [A]))[0].c === 1);
  check('a signal after expiry changes nothing', (await first(A)).state === 'trial_expired');
  check('the start can never be changed, even by the table owner', await fails_(() => sql("update public.entitlement set trial_started_at = now() where user_id = $1", [A]), /immutable/));
  check('the end can never move earlier', await fails_(() => sql("update public.entitlement set trial_ends_at = trial_ends_at - interval '1 hour' where user_id = $1", [A]), /earlier|check/));
  check('the table refuses an inconsistent row (trialing without a start; a trial shorter than 348 hours)', await fails_(() => sql("update public.entitlement set state='trialing' where user_id = $1", [B]), /check/) && await fails_(() => sql("insert into auth.users values ('cccccccc-0000-0000-0000-000000000003'); insert into public.entitlement (user_id,state,trial_started_at,trial_ends_at) values ('cccccccc-0000-0000-0000-000000000003','trialing', now(), now() + interval '1 hour')"), /check/));

  console.log('— Admin (service role only, reason mandatory, logged) —');
  const adm = (a: string, h: number | null, r: string | null, u = A) => as('service_role', null, async () => (await db.query('select public.entitlement_admin($1,$2,$3,$4) as r', [u, a, h, r])).rows[0].r);
  const xr = await adm('extend', 24, 'outage compensation');
  check('the service role can extend an expired trial: it becomes trialing again, the start is unchanged, and the event records hours and reason', xr.state === 'trialing' && xr.trial_started_at === ex.trial_started_at && (await sql("select count(*)::int c from public.entitlement_event where user_id=$1 and kind='admin_extend' and hours=24 and reason='outage compensation'", [A]))[0].c === 1);
  check('an admin action without a reason is refused', await fails_(() => adm('comp', null, ''), /reason/));
  check('an admin action by a signed-in client is refused even through the role check', await fails_(() => as('authenticated', A, () => db.query("select public.entitlement_admin($1,'comp',null,'x')", [A])), /permission denied|service role/));
  check('comp then uncomp returns to the state the dates imply', (await adm('comp', null, 'tester', B)).state === 'comped' && (await adm('uncomp', null, 'tester over', B)).state === 'new');
  check('every admin action wrote an event with source "admin"', (await sql("select count(*)::int c from public.entitlement_event where source='admin' and reason is not null"))[0].c >= 3);

  console.log('— Account deletion and rollback —');
  await sql('delete from auth.users where id = $1', [A]);
  check('deleting an account removes its entitlement and events (cascade)', (await sql('select count(*)::int c from public.entitlement where user_id=$1', [A]))[0].c === 0 && (await sql('select count(*)::int c from public.entitlement_event where user_id=$1', [A]))[0].c === 0);
  await db.exec(readFileSync(join(SQL, '002_rollback.sql'), 'utf8'));
  check('the rollback removes every object it created and leaves the legacy tables alone', (await sql("select count(*)::int c from pg_tables where schemaname='public' and tablename like 'entitlement%'"))[0].c === 0 && (await sql("select count(*)::int c from pg_proc where proname like 'entitlement%'"))[0].c === 0 && (await sql('select count(*)::int c from public.trial_tracking'))[0].c === 1);
  console.log(fails ? `\n${fails} FAILED` : '\nPASS: entitlement SQL (throwaway in-memory Postgres)');
  process.exit(fails ? 1 : 0);
})();
