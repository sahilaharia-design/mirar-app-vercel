// Test-only ports for the Option B sync client. NON-PERSISTENT: an in-memory model of the server rules, and an adapter over a
// throwaway in-memory PostgreSQL (PGlite) that runs the real SQL draft. Neither touches Supabase.
import { readFileSync } from 'fs';
import { join } from 'path';
import { BackupEvent } from '../../lib/innerRep/backup/events';
import { AppendResult, EpochResetError, PortStatus, ServerPort } from '../../lib/innerRep/backup/sync';
import { ServerCore } from '../../lib/innerRep/backup/stub-service';
import { ENGINE_VERSION } from './backup-fixtures';

/** The in-memory model of the server rules (lib/innerRep/backup/stub-service.ts ServerCore), behind the ServerPort used by the sync scenarios. */
export class FakeServer implements ServerPort {
  core = new ServerCore(ENGINE_VERSION); calls = { append: 0, pull: 0, status: 0, other: 0 }; appended: string[] = [];
  async status(): Promise<PortStatus | null> { this.calls.status++; return this.core.status(); }
  async enable(): Promise<PortStatus> { this.calls.other++; return this.core.enable(); }
  async disable() { this.calls.other++; this.core.disable(); }
  async deleteAll() { this.calls.other++; this.core.deleteAll(); }
  async pull(after: number) { this.calls.pull++; return this.core.pull(after); }
  async append(base: number, evs: BackupEvent[], epoch: string): Promise<AppendResult> { this.calls.append++; this.appended.push(JSON.stringify(evs)); return this.core.append(base, evs, epoch); }
  get events() { return this.core.events; } get profile() { return this.core.profile; }
}

const DIR = process.env.PGLITE_DIR || '/private/tmp/claude-501/-Users-sahilharia-Claude-Cowork/035ac76a-79da-4fb1-a311-14baeae30199/scratchpad/pglite';
const OPT = join(__dirname, '../../docs/proposed/option-b');
export async function installPg(): Promise<any | null> {
  let PGlite: any; try { PGlite = require(join(DIR, 'node_modules/@electric-sql/pglite')).PGlite; } catch { return null; }
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role, public;
  `);
  await db.exec(readFileSync(join(OPT, '001_history_backup.sql'), 'utf8')); await db.exec(readFileSync(join(OPT, '002_catalog_seed.sql'), 'utf8'));
  return db;
}
export async function asUser<T>(db: any, uid: string | null, fn: () => Promise<T>): Promise<T> { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? '']); await db.exec(uid === null ? 'set role anon' : 'set role authenticated'); try { return await fn(); } finally { await db.exec('reset role'); } }

/** The real SQL, called as a signed-in user, behind the same ServerPort. */
export class PgPort implements ServerPort {
  calls = { append: 0, pull: 0, status: 0, other: 0 }; appended: string[] = [];
  constructor(private db: any, private uid: string) {}
  private q<T>(sql: string, p: unknown[] = []) { return asUser(this.db, this.uid, async () => (await this.db.query(sql, p)).rows as T[]); }
  async status(): Promise<PortStatus | null> { this.calls.status++; const r = await this.q<any>("select sync_enabled, last_seq, to_char(last_day,'YYYY-MM-DD') as last_day, epoch::text as epoch from public.inner_rep_profile"); return r[0] ? { enabled: r[0].sync_enabled, lastSeq: r[0].last_seq, lastDay: r[0].last_day, epoch: r[0].epoch } : null; }
  async enable() { this.calls.other++; await this.q("select public.inner_rep_enable_backup($1, '2026-10-v1')", [ENGINE_VERSION]); return (await this.status())!; }
  async disable() { this.calls.other++; await this.q('select public.inner_rep_disable_backup()'); }
  async deleteAll() { this.calls.other++; await this.q('select public.inner_rep_delete_my_practice()'); }
  async pull(after: number) { this.calls.pull++; const r = await this.q<any>("select seq, to_char(day,'YYYY-MM-DD') as day, kind, engine_version, payload from public.inner_rep_event where seq > $1 order by seq", [after]); return r.map((x) => ({ seq: x.seq, event: { kind: x.kind, day: x.day, engine: x.engine_version, ...x.payload } as BackupEvent })); }
  async append(base: number, evs: BackupEvent[], epoch: string): Promise<AppendResult> {
    this.calls.append++; this.appended.push(JSON.stringify(evs));
    let x: any; try { x = (await this.q<any>('select public.inner_rep_append_events($1::uuid, $2, $3::jsonb) as r', [epoch, base, JSON.stringify(evs)]))[0].r; } catch (e: any) { if (/account history was reset/.test(String(e?.message))) throw new EpochResetError(); throw e; }
    return x.status === 'stale' ? { status: 'stale', lastSeq: x.last_seq } : { status: 'ok', lastSeq: x.last_seq, results: x.results };
  }
}
