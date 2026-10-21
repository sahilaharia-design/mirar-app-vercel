// LOCAL, DISPOSABLE-DATABASE compatibility check for Supabase's change to Data API grants (announced for existing projects on 30 October 2026:
// github.com/orgs/supabase/discussions/45329). New tables in `public` will no longer receive automatic select/insert/update/delete grants for
// anon, authenticated and service_role. This script installs the two proposed SQL drafts from an EMPTY database under three regimes and asserts
// the intended privileges (positive and negative):
//   legacy : default privileges grant ALL on new tables, and EXECUTE on new functions, to anon, authenticated, service_role (today's project)
//   new    : no default table or sequence grants; function defaults unchanged (the announced behaviour; it does not describe function defaults)
//   strict : no default table, sequence or function grants (the most conservative reading)
// Targets, exactly as in scripts/entitlement/entitlement-sql.test.ts: in-memory PGlite 16, and a throwaway native PostgreSQL 17 on 127.0.0.1
// (temp data dir, random port and password, destroyed afterwards). It reads no connection string and never touches Supabase.
//   Setup (outside the repository): PGLITE_DIR, PG17_DIR as in the entitlement test. Run: npx tsx scripts/release/grant-regime-check.ts
import { readFileSync, mkdtempSync, rmSync } from 'fs';
import { createRequire } from 'module';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { randomBytes } from 'crypto';
import { ENGINE_VERSION } from '../../lib/innerRep/v2/config';

let fails = 0, total = 0; const check = (n: string, ok: boolean, x = '') => { total++; if (!ok) { fails++; console.log(`FAIL  ${n}${x ? '  ' + x : ''}`); } };
const ROOT = join(__dirname, '../..'); const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const A = 'aaaaaaaa-0000-0000-0000-000000000001', B = 'bbbbbbbb-0000-0000-0000-000000000002';
type Regime = 'legacy' | 'new' | 'strict';
interface Db { exec(sql: string): Promise<void>; query(sql: string, p?: unknown[]): Promise<{ rows: any[] }>; version: string }
const freePort = () => new Promise<number>((res, rej) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = (s.address() as any).port; s.close(() => res(p)); }); s.on('error', rej); });

async function install(db: Db, regime: Regime) {
  await db.exec(`do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if; end $$;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
    create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text $$;
    grant usage on schema auth to anon, authenticated, service_role; grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    insert into auth.users values ('${A}'), ('${B}');`);
  if (regime === 'legacy') await db.exec(`alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
  if (regime !== 'strict') await db.exec('alter default privileges in schema public grant execute on functions to anon, authenticated, service_role, public;');
  await db.exec(read('docs/proposed/entitlement/001_entitlement.sql'));
  await db.exec(read('docs/proposed/option-b/001_history_backup.sql')); await db.exec(read('docs/proposed/option-b/002_catalog_seed.sql'));
}

const TABLES = ['entitlement', 'entitlement_event', 'inner_rep_catalog_vocab', 'inner_rep_profile', 'inner_rep_event'];
const ENT_FN = ['entitlement_get()', 'entitlement_first_rep_completed()', 'entitlement_admin(uuid,text,integer,text)', 'entitlement_json(public.entitlement)', 'entitlement_guard()'];
const OB_FN = ['inner_rep_enable_backup(text,text)', 'inner_rep_disable_backup()', 'inner_rep_append_events(uuid,integer,jsonb)', 'inner_rep_delete_my_practice()'];
const OB_INTERNAL = ['inner_rep_validate_event(text,text,date,jsonb)', 'inner_rep_is_real_date(text)'];

async function suite(db: Db, label: string, regime: Regime) {
  await install(db, regime);
  const q = async (s: string, p: unknown[] = []) => { await db.exec('reset role'); return (await db.query(s, p)).rows; };
  const priv = async (role: string, tbl: string, p: string) => (await q(`select has_table_privilege('${role}', 'public.${tbl}', '${p}') as v`))[0].v as boolean;
  const exec = async (role: string, fn: string) => (await q(`select has_function_privilege('${role}', 'public.${fn}', 'execute') as v`))[0].v as boolean;
  const as = async <T,>(role: 'anon' | 'authenticated' | 'service_role', uid: string | null, f: () => Promise<T>) => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claims', $1, false), set_config('request.jwt.claim.sub', $2, false), set_config('request.jwt.claim.role', $3, false)", [JSON.stringify({ sub: uid ?? '', role }), uid ?? '', role]); await db.exec(`set role ${role}`); try { return await f(); } finally { await db.exec('reset role'); } };
  const denied = async (f: () => Promise<unknown>) => { try { await f(); return false; } catch (e: any) { return /permission denied/.test(String(e?.message)); } };
  const tag = `${label} · ${regime}`;

  // ── tables: clients ──
  for (const t of TABLES) for (const p of ['insert', 'update', 'delete']) for (const r of ['anon', 'authenticated']) check(`${tag}: ${r} has NO ${p} on ${t}`, !(await priv(r, t, p)));
  for (const t of ['entitlement', 'entitlement_event']) for (const r of ['anon', 'authenticated']) check(`${tag}: ${r} has NO select on ${t}`, !(await priv(r, t, 'select')));
  for (const t of ['inner_rep_catalog_vocab', 'inner_rep_profile', 'inner_rep_event']) { check(`${tag}: authenticated CAN select ${t} (explicit grant, RLS limits rows)`, await priv('authenticated', t, 'select')); check(`${tag}: anon has NO select on ${t}`, !(await priv('anon', t, 'select'))); }
  // ── tables: service_role differs by regime and the drafts do not pin it (reported, not asserted as a pass of "least privilege") ──
  const svc: boolean[] = []; for (const t of TABLES) svc.push(await priv('service_role', t, 'select'));
  check(`${tag}: service_role table access is ${regime === 'legacy' ? 'present (default grants)' : 'absent (no default grants)'} — regime-dependent, see report`, regime === 'legacy' ? svc.every(Boolean) : svc.every((x) => !x));
  // ── functions ──
  for (const f of ENT_FN) { check(`${tag}: anon cannot execute ${f}`, !(await exec('anon', f))); }
  for (const f of ['entitlement_get()', 'entitlement_first_rep_completed()']) check(`${tag}: authenticated CAN execute ${f}`, await exec('authenticated', f));
  for (const f of ['entitlement_admin(uuid,text,integer,text)', 'entitlement_json(public.entitlement)', 'entitlement_guard()']) check(`${tag}: authenticated cannot execute ${f}`, !(await exec('authenticated', f)));
  check(`${tag}: service_role can execute entitlement_admin and nothing else of the entitlement functions`, (await exec('service_role', ENT_FN[2])) && !(await exec('service_role', ENT_FN[0])) && !(await exec('service_role', ENT_FN[1])));
  for (const f of OB_FN) { check(`${tag}: authenticated CAN execute ${f}`, await exec('authenticated', f)); check(`${tag}: anon cannot execute ${f}`, !(await exec('anon', f))); }
  for (const f of OB_INTERNAL) { check(`${tag}: authenticated cannot execute internal ${f}`, !(await exec('authenticated', f))); check(`${tag}: anon cannot execute internal ${f}`, !(await exec('anon', f))); }
  // ── behaviour: positive and negative ──
  const ent = await as('authenticated', A, async () => (await db.query('select public.entitlement_first_rep_completed() as r')).rows[0].r);
  check(`${tag}: a signed-in user can start their own trial through the function`, ent.state === 'trialing');
  check(`${tag}: a signed-in user cannot read the entitlement table directly`, await denied(() => as('authenticated', A, () => db.query('select * from public.entitlement'))));
  check(`${tag}: anon cannot call the entitlement function`, await denied(() => as('anon', null, () => db.query('select public.entitlement_get()'))));
  await as('authenticated', A, () => db.query("select public.inner_rep_enable_backup($1, '2026-10-v1')", [ENGINE_VERSION]));
  check(`${tag}: the owner can read their own backup profile through the explicit select grant`, (await as('authenticated', A, async () => (await db.query('select user_id from public.inner_rep_profile')).rows)).length === 1);
  check(`${tag}: another user sees none of it (row-level security)`, (await as('authenticated', B, async () => (await db.query('select user_id from public.inner_rep_profile')).rows)).length === 0);
  check(`${tag}: no client can write a backup table directly`, await denied(() => as('authenticated', A, () => db.exec(`insert into public.inner_rep_event values ('${A}',1,'2026-06-01','rep_abandoned','${ENGINE_VERSION}','{}')`))));
  check(`${tag}: anon cannot read the backup profile`, await denied(() => as('anon', null, () => db.query('select * from public.inner_rep_profile'))));
}

(async () => {
  const PGLITE_DIR = process.env.PGLITE_DIR || '', PG17_DIR = process.env.PG17_DIR || '';
  const self = readFileSync(__filename, 'utf8').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  check('static guard: only PGLITE_DIR and PG17_DIR are read from the environment', (self.match(/process\.env\.[A-Z0-9_]+/g) ?? []).every((x) => /PGLITE_DIR|PG17_DIR/.test(x)));
  // Static guard: never copy broad example grants onto private customer tables (the announcement's example grants select to anon and write to authenticated/service_role).
  for (const f of ['docs/proposed/entitlement/001_entitlement.sql', 'docs/proposed/option-b/001_history_backup.sql']) {
    const sql = read(f).split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').toLowerCase();
    const grants = sql.match(/grant [^;]*;/g) ?? [];
    check(`static guard: ${f} grants nothing to anon or public on a table`, !grants.some((g) => /\bon (table )?public\.[a-z_, ]*\bto\b[^;]*\b(anon|public)\b/.test(g) && !/function/.test(g)));
    check(`static guard: ${f} never grants insert, update, delete or ALL on a table to a client role`, !grants.some((g) => !/function/.test(g) && /\b(insert|update|delete|all)\b/.test(g.split(' on ')[0])));
    check(`static guard: ${f} never grants a table privilege to service_role (access goes through definer functions)`, !grants.some((g) => !/function/.test(g) && /service_role/.test(g)));
  }
  const regimes: Regime[] = ['legacy', 'new', 'strict']; let ran = 0;
  let PGlite: any; try { PGlite = createRequire(join(PGLITE_DIR, 'x.js'))('@electric-sql/pglite').PGlite; } catch { PGlite = null; }
  if (!PGlite) console.log('SKIP: PGlite not found (PGLITE_DIR)');
  if (PGlite) for (const r of regimes) { const raw = new PGlite(); await suite({ exec: (s) => raw.exec(s).then(() => undefined), query: (s, p) => raw.query(s, p), version: 'PGlite 16.4' }, 'PGlite in-memory 16.4', r); ran++; console.log(`ran PGlite ${r}`); }
  if (PG17_DIR) {
    let Embedded: any; try { Embedded = (await import(pathToFileURL(join(PG17_DIR, 'node_modules/embedded-postgres/dist/index.js')).href)).default; } catch { Embedded = null; }
    if (Embedded) {
      const dataDir = mkdtempSync(join(tmpdir(), 'mirar-e1-pg17-')); const port = await freePort(); const password = randomBytes(18).toString('hex');
      const cluster = new Embedded({ databaseDir: dataDir, user: 'postgres', password, port, persistent: false, postgresFlags: ['-c', 'listen_addresses=127.0.0.1'], onLog: () => {}, onError: () => {} });
      try {
        await cluster.initialise(); await cluster.start();
        for (const r of regimes) { const name = `mirar_e1_test_grants_${r}`; await cluster.createDatabase(name); const c = cluster.getPgClient(name, '127.0.0.1'); await c.connect(); await suite({ exec: async (s) => { await c.query(s); }, query: (s, p) => c.query(s, p as any[]), version: 'PostgreSQL 17' }, 'native PostgreSQL 17.5', r); await c.end(); ran++; console.log(`ran native 17 ${r}`); }
      } finally { try { await cluster.stop(); } catch { /* ignore */ } rmSync(dataDir, { recursive: true, force: true }); }
    }
  }
  console.log(fails ? `\n${fails} FAILED of ${total} (${ran} database runs)` : `PASS: grant-regime check, ${total} assertions over ${ran} fresh disposable databases (legacy, new, strict)`);
  process.exit(fails || !ran ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });
