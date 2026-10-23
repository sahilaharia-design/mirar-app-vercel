// Trial entitlement CLIENT (contract: docs/product/TRIAL_ENTITLEMENT_CONTRACT.md v1.0; executable spec: scripts/entitlement/model.ts).
// Pure TypeScript: no React Native, no Supabase, no network, no clock of its own. The host injects storage, the device clock and a server port.
// NOT WIRED into the app yet (launch board task L2). Nothing here changes the engine, Supabase or any stored data.
//
// Rules (all from the contract, all constants below):
//  • Time that matters comes from the server (`server_now`). The device clock is used only inside bounded offline allowances.
//  • A first completed rep is sent to the server as a no-argument call; the server stamps its own clock.
//  • Offline: a first completion may wait 72 h for server confirmation; a cached answer is trusted 72 h; at most 3 member reps may be
//    completed between two server contacts (clock-independent backstop). Viewing history, export and deletion are never gated.
export const H = 3_600_000;
export const TRIAL_MS = 348 * H;
export const PENDING_MS = 72 * H;
export const FRESH_MS = 72 * H;
export const BACKWARD_TOLERANCE_MS = 5 * 60_000;
export const MAX_REPS_BETWEEN_CONTACTS = 3;

export type EntState = 'new' | 'trialing' | 'trial_expired' | 'comped';
export interface Ent { state: EntState; trial_started_at: number | null; trial_ends_at: number | null; server_now: number; version: number }
export type Reply = { ok: true; ent: Ent } | { ok: false; kind: 'offline' | 'unavailable' | 'unauthenticated' };
export interface EntKV { get(k: string): Promise<string | null>; set(k: string, v: string): Promise<void>; del(k: string): Promise<void> }
/** The two RPCs a client may call (`entitlement_get`, `entitlement_first_rep_completed`); the second takes NO arguments. */
export interface EntServerPort { get(): Promise<Reply>; firstRep(): Promise<Reply> }

interface Cache { uid: string; state: EntState; start: number | null; end: number | null; anchorServer: number; offset: number; pending: number | null; repsSince: number }
export type Reason = 'ok_first_rep' | 'ok_trial' | 'ok_comped' | 'ok_pending' | 'finish_current_rep' | 'expired' | 'needs_connection_stale' | 'needs_connection_pending' | 'needs_connection_reps' | 'needs_connection_no_status';
export interface Access { memberReps: boolean; viewHistory: true; exportFile: true; deleteAccount: true; reason: Reason; clockAnomaly: boolean; endsAt: number | null }

const HW = 'ent:hw';                       // device-time high-water mark, shared by every account on the device
const key = (uid: string) => `ent:v1:${uid}`;

export class EntitlementClient {
  constructor(private d: { kv: EntKV; device: () => number; server: EntServerPort }) {}

  private async observe() {
    const dev = this.d.device(); const hw = Number((await this.d.kv.get(HW)) ?? 0);
    const t = Math.max(dev, hw); await this.d.kv.set(HW, String(t));
    return { t, anomaly: dev < hw - BACKWARD_TOLERANCE_MS };
  }
  private async load(uid: string): Promise<Cache | null> { const raw = await this.d.kv.get(key(uid)); if (!raw) return null; try { const c = JSON.parse(raw) as Cache; return c.uid === uid ? c : null; } catch { return null; } }
  private save(c: Cache) { return this.d.kv.set(key(c.uid), JSON.stringify(c)); }
  private async adopt(uid: string, ent: Ent, pending: number | null) {
    const dev = this.d.device();
    await this.save({ uid, state: ent.state, start: ent.trial_started_at, end: ent.trial_ends_at, anchorServer: ent.server_now, offset: ent.server_now - dev, pending: ent.state === 'new' ? pending : null, repsSince: 0 });
    await this.d.kv.set(HW, String(dev));
  }

  /** Launch / daily check / explicit "check my membership". If a first completion is waiting, send that signal first. */
  async sync(uid: string): Promise<Reply> {
    const c = await this.load(uid);
    const r = c?.pending != null ? await this.d.server.firstRep() : await this.d.server.get();
    if (r.ok) await this.adopt(uid, r.ent, c?.pending ?? null);
    else if (r.kind === 'unauthenticated') await this.d.kv.del(key(uid));
    return r;
  }
  /** Once, when the first engine rep is completed (never for a pilot, an abandoned rep or a safety stop). */
  async recordFirstRepCompleted(uid: string): Promise<'started' | 'pending' | 'not_first'> {
    const c = await this.load(uid); if (c && c.state !== 'new') return 'not_first';
    const { t } = await this.observe();
    const base: Cache = c ?? { uid, state: 'new', start: null, end: null, anchorServer: t, offset: 0, pending: null, repsSince: 0 };
    base.pending = base.pending ?? t; base.repsSince += 1; await this.save(base);
    const r = await this.d.server.firstRep();
    if (r.ok) { await this.adopt(uid, r.ent, base.pending); return 'started'; }
    if (r.kind === 'unauthenticated') await this.d.kv.del(key(uid));
    return 'pending';
  }
  /** Every completed member rep AFTER the first. */
  async recordRepCompleted(uid: string) { const c = await this.load(uid); if (c) { c.repsSince += 1; await this.save(c); } }
  signOut(uid: string) { return this.d.kv.del(key(uid)); }                  // the high-water mark deliberately stays

  async access(uid: string, o: { repInProgress?: boolean } = {}): Promise<Access> {
    const { t, anomaly } = await this.observe(); const c = await this.load(uid);
    const out = (memberReps: boolean, reason: Reason, endsAt: number | null = c?.end ?? null): Access => ({ memberReps, viewHistory: true, exportFile: true, deleteAccount: true, reason, clockAnomaly: anomaly, endsAt });
    const deny = (reason: Reason) => (o.repInProgress ? out(true, 'finish_current_rep') : out(false, reason));
    if (!c) return deny('needs_connection_no_status');
    const repsOk = c.repsSince < MAX_REPS_BETWEEN_CONTACTS;
    if (c.pending !== null) return t - c.pending > PENDING_MS ? deny('needs_connection_pending') : !repsOk ? deny('needs_connection_reps') : out(true, 'ok_pending');
    const est = t + c.offset;
    switch (c.state) {
      case 'new': return out(true, 'ok_first_rep');
      case 'trialing': if (est >= (c.end as number)) return deny('expired'); return est - c.anchorServer > FRESH_MS ? deny('needs_connection_stale') : !repsOk ? deny('needs_connection_reps') : out(true, 'ok_trial');
      case 'comped': return est - c.anchorServer > FRESH_MS ? deny('needs_connection_stale') : !repsOk ? deny('needs_connection_reps') : out(true, 'ok_comped');
      default: return deny('expired');
    }
  }
}
