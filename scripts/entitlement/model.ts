// EXECUTABLE SPECIFICATION of the trial entitlement contract (docs/product/TRIAL_ENTITLEMENT_CONTRACT.md). TEST TOOLING ONLY:
// pure TypeScript, in memory, no network, not imported by the app, not wired to Supabase. It mirrors docs/proposed/entitlement/001_entitlement.sql
// (server) and the client rules that the contract fixes (cache, offline allowances, clock-tamper protection). If the contract changes, change this.
// Instants are milliseconds since the epoch. The device's local time zone never appears in any decision.

export const H = 3_600_000;
export const TRIAL_MS = 348 * H;          // 336 h + 12 h courtesy, from the server-recorded first completed rep
export const PENDING_MS = 72 * H;         // longest the app lets a first completed rep wait for the server to confirm
export const FRESH_MS = 72 * H;           // longest the app trusts a cached answer without hearing from the server
export const BACKWARD_TOLERANCE_MS = 5 * 60_000;
export const MAX_REPS_BETWEEN_CONTACTS = 3;   // clock-independent backstop: at most this many member reps may be completed between two successful server contacts

export type State = 'new' | 'trialing' | 'trial_expired' | 'comped';
export interface Ent { state: State; trial_started_at: number | null; trial_ends_at: number | null; server_now: number; version: number }
export type Reply = { ok: true; ent: Ent } | { ok: false; kind: 'offline' | 'unavailable' | 'unauthenticated' };
export interface EventRow { uid: string; kind: string; at: number; source: 'system' | 'admin'; hours?: number; reason?: string }
interface Row { state: State; start: number | null; end: number | null; version: number }

// ── Server: mirrors the five SQL functions ──────────────────────────────────────────────────────────────────────────────────
export class ServerModel {
  rows = new Map<string, Row>(); events: EventRow[] = [];
  mode: 'up' | 'offline' | 'unavailable' = 'up';
  /** the server applies the call but the reply is lost on the way back (a retry must then be harmless) */
  dropNextReply = false;
  /** Never read by anything in this class. Tests replace it with a trap to prove legacy trial and subscription rows are not consulted. */
  legacy: unknown = null;
  constructor(public truth: () => number) {}

  private gate(uid: string | null): Reply | null {
    if (this.mode === 'offline') return { ok: false, kind: 'offline' };
    if (this.mode === 'unavailable') return { ok: false, kind: 'unavailable' };
    if (uid === null) return { ok: false, kind: 'unauthenticated' };
    return null;
  }
  private ensure(uid: string): Row {
    let r = this.rows.get(uid);
    if (!r) { r = { state: 'new', start: null, end: null, version: 1 }; this.rows.set(uid, r); this.events.push({ uid, kind: 'created', at: this.truth(), source: 'system' }); }
    return r;
  }
  private lazyExpire(uid: string, r: Row) {
    if (r.state === 'trialing' && r.end !== null && r.end <= this.truth()) { r.state = 'trial_expired'; r.version++; this.events.push({ uid, kind: 'trial_expired', at: this.truth(), source: 'system' }); }
  }
  private json(r: Row): Ent { return { state: r.state, trial_started_at: r.start, trial_ends_at: r.end, server_now: this.truth(), version: r.version }; }
  private reply(ent: Ent): Reply { if (this.dropNextReply) { this.dropNextReply = false; return { ok: false, kind: 'offline' }; } return { ok: true, ent }; }

  /** entitlement_get() */
  get(uid: string | null): Reply { const g = this.gate(uid); if (g) return g; const r = this.ensure(uid!); this.lazyExpire(uid!, r); return this.reply(this.json(r)); }
  /** entitlement_first_rep_completed(): NO arguments besides the authenticated subject */
  firstRep(uid: string | null): Reply {
    const g = this.gate(uid); if (g) return g; const r = this.ensure(uid!);
    if (r.state === 'new') { const now = this.truth(); r.state = 'trialing'; r.start = now; r.end = now + TRIAL_MS; r.version++; this.events.push({ uid: uid!, kind: 'trial_started', at: now, source: 'system' }); }
    else this.lazyExpire(uid!, r);
    return this.reply(this.json(r));
  }
  /** entitlement_admin(): service role only, reason mandatory */
  admin(role: string, uid: string, action: 'comp' | 'uncomp' | 'extend', hours: number | null, reason: string | null): Ent {
    if (role !== 'service_role') throw new Error('service role only');
    if (!reason || reason.length < 1 || reason.length > 200) throw new Error('a reason of 1 to 200 characters is required');
    const r = this.ensure(uid); const now = this.truth();
    if (action === 'comp') { r.state = 'comped'; r.version++; this.events.push({ uid, kind: 'admin_comp', at: now, source: 'admin', reason }); }
    else if (action === 'uncomp') { r.state = r.start === null ? 'new' : (r.end as number) <= now ? 'trial_expired' : 'trialing'; r.version++; this.events.push({ uid, kind: 'admin_uncomp', at: now, source: 'admin', reason }); }
    else {
      if (r.start === null) throw new Error('the trial has not started');
      if (hours === null || hours < 1 || hours > 8760) throw new Error('hours must be 1 to 8760');
      r.end = (r.end as number) + hours * H; r.state = r.end > now ? 'trialing' : 'trial_expired'; r.version++;
      this.events.push({ uid, kind: 'admin_extend', at: now, source: 'admin', hours, reason });
    }
    return this.json(r);
  }
  /** What the BEFORE UPDATE trigger forbids, for tests of the invariants. */
  forceUpdate(uid: string, patch: { start?: number | null; end?: number | null }) {
    const r = this.rows.get(uid)!;
    if (r.start !== null && 'start' in patch && patch.start !== r.start) throw new Error('trial_started_at is immutable');
    if (r.end !== null && 'end' in patch && (patch.end as number) < r.end) throw new Error('trial_ends_at cannot move earlier');
    if ('end' in patch) r.end = patch.end as number | null; r.version++;
  }
}

// ── Client: cache, offline allowances, clock-tamper protection ─────────────────────────────────────────────────────────────
export interface KV { get(k: string): string | null; set(k: string, v: string): void; del(k: string): void }
export class MemoryKV implements KV { m = new Map<string, string>(); get(k: string) { return this.m.get(k) ?? null; } set(k: string, v: string) { this.m.set(k, v); } del(k: string) { this.m.delete(k); } }
export interface ServerPort { get(uid: string | null): Reply; firstRep(uid: string | null): Reply }

interface Cache { uid: string; state: State; start: number | null; end: number | null; anchorServer: number; offset: number; pending: number | null; repsSince: number }
export type Reason = 'ok_first_rep' | 'ok_trial' | 'ok_comped' | 'ok_pending' | 'finish_current_rep' | 'expired' | 'needs_connection_stale' | 'needs_connection_pending' | 'needs_connection_reps' | 'needs_connection_no_status';
export interface Access { memberReps: boolean; viewHistory: true; exportFile: true; deleteAccount: true; reason: Reason; clockAnomaly: boolean; endsAt: number | null }

const HW = 'ent:hw';                    // device-time high-water mark, shared by every account on this device
const key = (uid: string) => `ent:v1:${uid}`;

export class EntitlementClient {
  constructor(private d: { kv: KV; device: () => number; server: ServerPort }) {}

  /** Read the device clock through the high-water mark: the effective time never goes backwards. */
  private observe() {
    const dev = this.d.device(); const hw = Number(this.d.kv.get(HW) ?? 0);
    const t = Math.max(dev, hw); this.d.kv.set(HW, String(t));
    return { t, anomaly: dev < hw - BACKWARD_TOLERANCE_MS };
  }
  private load(uid: string): Cache | null { const raw = this.d.kv.get(key(uid)); if (!raw) return null; try { const c = JSON.parse(raw) as Cache; return c.uid === uid ? c : null; } catch { return null; } }
  private save(c: Cache) { this.d.kv.set(key(c.uid), JSON.stringify(c)); }
  /** A successful server answer re-anchors everything: the offset absorbs any device clock error, and the high-water mark is reset to the device clock. */
  private adopt(uid: string, ent: Ent, pending: number | null) {
    const dev = this.d.device();
    this.save({ uid, state: ent.state, start: ent.trial_started_at, end: ent.trial_ends_at, anchorServer: ent.server_now, offset: ent.server_now - dev, pending: ent.state === 'new' ? pending : null, repsSince: 0 });
    this.d.kv.set(HW, String(dev));
  }

  /** Launch / daily check / explicit "check my membership". If a first completion is waiting, send the signal first. */
  sync(uid: string): Reply {
    const c = this.load(uid);
    const r = c?.pending != null ? this.d.server.firstRep(uid) : this.d.server.get(uid);
    if (r.ok) this.adopt(uid, r.ent, c?.pending ?? null);
    else if (r.kind === 'unauthenticated') this.d.kv.del(key(uid));          // the session is no longer valid: nothing is trusted
    return r;
  }
  /** Called once when the first rep is completed (never on an abandoned rep or a safety stop). */
  recordFirstRepCompleted(uid: string): 'started' | 'pending' | 'not_first' {
    const c = this.load(uid); if (c && c.state !== 'new') return 'not_first';
    const { t } = this.observe();
    const base: Cache = c ?? { uid, state: 'new', start: null, end: null, anchorServer: t, offset: 0, pending: null, repsSince: 0 };
    base.pending = base.pending ?? t; base.repsSince += 1; this.save(base);
    const r = this.d.server.firstRep(uid);
    if (r.ok) { this.adopt(uid, r.ent, base.pending); return 'started'; }
    if (r.kind === 'unauthenticated') this.d.kv.del(key(uid));
    return 'pending';
  }
  /** Called for every completed member rep AFTER the first. Counts reps since the last successful server contact (the clock-independent backstop). */
  recordRepCompleted(uid: string) { const c = this.load(uid); if (c) { c.repsSince += 1; this.save(c); } }
  signOut(uid: string) { this.d.kv.del(key(uid)); }                          // the high-water mark deliberately stays

  access(uid: string, o: { repInProgress?: boolean } = {}): Access {
    const { t, anomaly } = this.observe(); const c = this.load(uid);
    const out = (memberReps: boolean, reason: Reason, endsAt: number | null = c?.end ?? null): Access => ({ memberReps, viewHistory: true, exportFile: true, deleteAccount: true, reason, clockAnomaly: anomaly, endsAt });
    const deny = (reason: Reason) => (o.repInProgress ? out(true, 'finish_current_rep') : out(false, reason));
    if (!c) return deny('needs_connection_no_status');
    const repsOk = c.repsSince < MAX_REPS_BETWEEN_CONTACTS;
    if (c.pending !== null) return t - c.pending > PENDING_MS ? deny('needs_connection_pending') : !repsOk ? deny('needs_connection_reps') : out(true, 'ok_pending');
    const est = t + c.offset;                                                // estimated server time; never goes backwards
    switch (c.state) {
      case 'new': return out(true, 'ok_first_rep');
      case 'trialing': if (est >= (c.end as number)) return deny('expired'); return est - c.anchorServer > FRESH_MS ? deny('needs_connection_stale') : !repsOk ? deny('needs_connection_reps') : out(true, 'ok_trial');
      case 'comped': return est - c.anchorServer > FRESH_MS ? deny('needs_connection_stale') : !repsOk ? deny('needs_connection_reps') : out(true, 'ok_comped');
      default: return deny('expired');
    }
  }
}

/** The end instant as the person sees it: an absolute instant rendered in THEIR zone. Display only; never used in a decision. */
export function formatInstant(ms: number, zoneMinutes: number): string {
  const d = new Date(ms + zoneMinutes * 60000); const sign = zoneMinutes >= 0 ? '+' : '-'; const z = Math.abs(zoneMinutes);
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC${sign}${String(Math.floor(z / 60)).padStart(2, '0')}:${String(z % 60).padStart(2, '0')}`;
}
