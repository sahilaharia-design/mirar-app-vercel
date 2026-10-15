// Test-only ports for the Option B sync client. NON-PERSISTENT: an in-memory model of the server rules, and an adapter over a
// throwaway in-memory PostgreSQL (PGlite) that runs the real SQL draft. Neither touches Supabase.
import { readFileSync } from 'fs';
import { join } from 'path';
import { BackupEvent, validateEvent } from '../../lib/innerRep/backup/events';
import { AppendResult, PortStatus, ServerPort } from '../../lib/innerRep/backup/sync';
import { ENGINE_VERSION, VOCAB } from './backup-fixtures';

/** Mirrors 001_history_backup.sql rule for rule (the SQL suite and the scenario suite run the SAME scenarios against both). */
export class FakeServer implements ServerPort {
  profile: { enabled: boolean; lastSeq: number; lastDay: string | null } | null = null; events: BackupEvent[] = []; calls = { append: 0, pull: 0, status: 0, other: 0 }; appended: string[] = [];
  today = '2099-12-31';
  async status(): Promise<PortStatus | null> { this.calls.status++; return this.profile ? { ...this.profile } : null; }
  async enable(): Promise<PortStatus> { this.calls.other++; this.profile = this.profile ? { ...this.profile, enabled: true } : { enabled: true, lastSeq: 0, lastDay: null }; return { ...this.profile }; }
  async disable() { this.calls.other++; if (this.profile) this.profile.enabled = false; }
  async deleteAll() { this.calls.other++; this.profile = null; this.events = []; }
  async pull(after: number) { this.calls.pull++; return this.events.map((event, i) => ({ seq: i + 1, event })).filter((x) => x.seq > after); }
  async append(base: number, evs: BackupEvent[]): Promise<AppendResult> {
    this.calls.append++; this.appended.push(JSON.stringify(evs));
    if (!this.profile || !this.profile.enabled) throw new Error('backup is not turned on');
    if (evs.length > 200) throw new Error('at most 200');
    if (this.profile.lastSeq !== base) return { status: 'stale', lastSeq: this.profile.lastSeq };
    const results: string[] = [];
    for (const e of evs) {
      const v = validateEvent(e, VOCAB); if (!v.ok) throw new Error('rejected: ' + (v as any).reason);
      let res = 'ok';
      if (this.profile.lastDay && e.day < this.profile.lastDay) res = 'rejected_day_passed';
      else if ((e.kind === 'rep_completed' || e.kind === 'rep_abandoned') && this.events.some((x) => x.day === e.day && (x.kind === 'rep_completed' || x.kind === 'rep_abandoned'))) res = 'rejected_day_taken';
      else if (e.kind === 'feedback' || e.kind === 'correction') {
        if (!this.events.some((x) => x.kind === 'rep_completed' && x.day === e.insightDay)) res = 'rejected_no_insight';
        else if (e.kind === 'correction' && !this.events.some((x) => x.kind === 'feedback' && x.insightDay === e.insightDay && x.value === 'partly')) res = 'rejected_order';
        else if (this.events.some((x) => x.kind === e.kind && (x as any).insightDay === e.insightDay)) res = 'rejected_duplicate';
      }
      if (res === 'ok') { this.events.push(e); this.profile.lastSeq++; this.profile.lastDay = e.day; }
      results.push(res);
    }
    return { status: 'ok', lastSeq: this.profile.lastSeq, results };
  }
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
  async status(): Promise<PortStatus | null> { this.calls.status++; const r = await this.q<any>("select sync_enabled, last_seq, to_char(last_day,'YYYY-MM-DD') as last_day from public.inner_rep_profile"); return r[0] ? { enabled: r[0].sync_enabled, lastSeq: r[0].last_seq, lastDay: r[0].last_day } : null; }
  async enable() { this.calls.other++; await this.q("select public.inner_rep_enable_backup($1, '2026-10-v1')", [ENGINE_VERSION]); return (await this.status())!; }
  async disable() { this.calls.other++; await this.q('select public.inner_rep_disable_backup()'); }
  async deleteAll() { this.calls.other++; await this.q('select public.inner_rep_delete_my_practice()'); }
  async pull(after: number) { this.calls.pull++; const r = await this.q<any>("select seq, to_char(day,'YYYY-MM-DD') as day, kind, engine_version, payload from public.inner_rep_event where seq > $1 order by seq", [after]); return r.map((x) => ({ seq: x.seq, event: { kind: x.kind, day: x.day, engine: x.engine_version, ...x.payload } as BackupEvent })); }
  async append(base: number, evs: BackupEvent[]): Promise<AppendResult> {
    this.calls.append++; this.appended.push(JSON.stringify(evs));
    const r = await this.q<any>('select public.inner_rep_append_events($1, $2::jsonb) as r', [base, JSON.stringify(evs)]); const x = r[0].r;
    return x.status === 'stale' ? { status: 'stale', lastSeq: x.last_seq } : { status: 'ok', lastSeq: x.last_seq, results: x.results };
  }
}
