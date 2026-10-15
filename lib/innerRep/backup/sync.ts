import type { V2Runtime } from '../runtime/v2-runtime';
import { BackupEvent, CONSENT_VERSION } from './events';
import { applyEvent, ReplayDriftError, replayInto } from './replay';
import { canon, ExportReceipt, receiptMatches } from './export';
export { exportJournal, importJournal } from './export';

// ─── Sync client: local, non-persistent prototype (talks to a ServerPort; no network code here) ──────────────────────────────
// Invariants (each is tested):
//  1. With backup off, it makes ZERO port calls. Events are still journaled locally. Turning it off stops uploads IMMEDIATELY, even mid-sync.
//  2. The account log ALWAYS replays under the engine. A conflicting event is dropped, never forced in.
//  3. Nothing is merged or overwritten automatically. When histories differ, or an account copy was deleted, the person decides, and
//     every operation that could discard a history requires a VERIFIED EXPORT receipt for exactly that history first (export.ts).
//  4. Deleting the account history can never be undone by an old device: each generation of history has an epoch; a device that synced under
//     an older epoch, or finds the copy gone, stops, keeps its history on the device, and can re-upload only after an explicit, confirmed choice.
//  5. Unsent events stay on the device when backup is off; they are sent only when backup is turned on again (and then still subject to conflict rules).

export interface PortStatus { enabled: boolean; lastSeq: number; lastDay: string | null; epoch: string }
export type AppendResult = { status: 'ok'; lastSeq: number; results: string[] } | { status: 'stale'; lastSeq: number };
export interface ServerPort {
  status(): Promise<PortStatus | null>;                       // null = no profile on the server
  enable(engine: string, consentVersion: string): Promise<PortStatus>;
  disable(): Promise<void>;
  append(baseSeq: number, events: BackupEvent[], epoch: string): Promise<AppendResult>;
  pull(afterSeq: number): Promise<{ seq: number; event: BackupEvent }[]>;
  deleteAll(): Promise<void>;
}
/** A failure of the service itself (as opposed to a conflict). `offline` and `unavailable` are different facts and are never reported as "empty". */
export class ServiceError extends Error { constructor(public kind: 'offline' | 'unavailable' | 'service', m: string) { super(m); this.name = 'ServiceError'; } }
export class EpochResetError extends Error { constructor() { super('account history was reset'); this.name = 'EpochResetError'; } }

export interface Dropped { event: BackupEvent; reason: string }
export type SkipReason = 'disabled' | 'server_copy_removed' | 'history_reset' | 'offline' | 'unavailable' | 'service_error';
export interface SyncOutcome { skipped?: SkipReason; sent: number; pulled: number; dropped: Dropped[]; rebuilt: boolean }
export type DecisionReason = 'histories_differ' | 'copy_was_deleted';
export type ConnectOutcome =
  | { status: 'connected'; mode: 'upload' | 'restore' | 'upload_rest' | 'in_sync'; rebuilt: boolean }
  | { status: 'decision_required'; reason: DecisionReason; localCount: number; accountCount: number };
export type Resolution =
  | { keep_account: { receipt: ExportReceipt } }                                                        // receipt of THIS DEVICE's history, which is set aside
  | { upload_again: { confirm: true } }                                                                // only after the account copy was deleted
  | { stay_on_device: true }                                                                           // change nothing; backup stays off
  | { clear_device: { receipt: ExportReceipt } };
export interface Summary { completedReps: number; throughDay: string }
export type Relation = 'none' | 'identical' | 'account_extends' | 'device_extends' | 'differ';
export interface RuntimeBundle { rt: V2Runtime; clock: { d: Date }; kv?: { m: Map<string, string> } }

const isPrefix = (a: BackupEvent[], b: BackupEvent[]) => a.length <= b.length && a.every((e, i) => canon(e) === canon(b[i]));
const isRep = (e: BackupEvent) => e.kind === 'rep_completed' || e.kind === 'rep_abandoned';
const summarize = (ev: BackupEvent[]): Summary => ({ completedReps: ev.filter((e) => e.kind === 'rep_completed').length, throughDay: ev.length ? ev[ev.length - 1].day : '' });
const kindOf = (e: unknown): SkipReason => (e instanceof ServiceError ? (e.kind === 'offline' ? 'offline' : e.kind === 'unavailable' ? 'unavailable' : 'service_error') : 'service_error');

export interface SyncState { server: BackupEvent[]; outbox: BackupEvent[]; dropped: Dropped[]; epoch: string | null; enabled: boolean; resetNotice: { syncedEvents: number } | null; serverDisablePending: boolean }

export class SyncClient {
  server: BackupEvent[] = []; outbox: BackupEvent[] = []; dropped: Dropped[] = [];
  enabled = false; epoch: string | null = null; resetNotice: { syncedEvents: number } | null = null; serverDisablePending = false;
  private pendingRemote: BackupEvent[] | null = null; private pendingReason: DecisionReason | null = null; private generation = 0;
  constructor(private o: { port: ServerPort; uid: string; engine: string; makeRuntime: () => RuntimeBundle }) {}

  /** The device's full structured history, in order: what the account has, then what is waiting to be sent. */
  journal(): BackupEvent[] { return [...this.server, ...this.outbox]; }
  /** Called for every new local event. Always journals locally; sending happens only in sync(). Idempotent: a repeat of a recorded outcome is ignored. */
  record = (e: BackupEvent): boolean => {
    const j = this.journal();
    if (isRep(e) && j.some((x) => isRep(x) && x.day === e.day)) return false;
    if ((e.kind === 'feedback' || e.kind === 'correction') && j.some((x) => x.kind === e.kind && (x as { insightDay: string }).insightDay === e.insightDay)) return false;
    this.outbox.push(e); return true;
  };
  /** History that existed on this device before backup was ever turned on. */
  adoptLocal(events: BackupEvent[]) { this.outbox = [...events]; }
  summaries(): { device: Summary; account: Summary | null; pendingAccount: Summary | null } { return { device: summarize(this.journal()), account: this.server.length ? summarize(this.server) : null, pendingAccount: this.pendingRemote ? summarize(this.pendingRemote) : null }; }
  toJSON(): SyncState { return { server: this.server, outbox: this.outbox, dropped: this.dropped, epoch: this.epoch, enabled: this.enabled, resetNotice: this.resetNotice, serverDisablePending: this.serverDisablePending }; }
  restoreState(s: SyncState) { this.server = s.server ?? []; this.outbox = s.outbox ?? []; this.dropped = s.dropped ?? []; this.epoch = s.epoch ?? null; this.enabled = !!s.enabled; this.resetNotice = s.resetNotice ?? null; this.serverDisablePending = !!s.serverDisablePending; }
  get decisionPending(): DecisionReason | null { return this.pendingReason; }
  /** The account copy a pending decision is about (for a verified export before anything is replaced). */
  get pendingAccount(): BackupEvent[] | null { return this.pendingRemote; }

  /** READ-ONLY. What does the account hold, and how does it relate to this device? Never enables, writes or changes any state except by the caller's choice. Throws ServiceError if the account cannot be read: failure is never reported as "empty". */
  async inspect(): Promise<{ relation: Relation; remote: BackupEvent[]; epoch: string | null; enabledOnServer: boolean; verdict?: 'same' | 'removed' | 'reset' }> {
    const st = await this.o.port.status(); const verdict = this.checkEpoch(st ? st.epoch : null);
    if (!st) return { relation: 'none', remote: [], epoch: null, enabledOnServer: false, verdict };
    const remote = (await this.o.port.pull(0)).map((x) => x.event); const local = this.journal();
    const relation: Relation = remote.length === 0 ? 'none' : isPrefix(local, remote) ? (local.length === remote.length ? 'identical' : 'account_extends') : isPrefix(remote, local) ? 'device_extends' : 'differ';
    return { relation, remote, epoch: st.epoch, enabledOnServer: st.enabled, verdict };
  }
  /** Records that a decision is needed (no writes). Used by the controller after an inspection found two different histories. */
  markDecision(reason: DecisionReason, remote: BackupEvent[]) { this.pendingRemote = remote; this.pendingReason = reason; }

  // ── first opt-in and reconnect: reads first, writes only after the person has decided ──
  async connect(): Promise<ConnectOutcome> {
    const st = await this.o.port.status(); this.checkEpoch(st ? st.epoch : null);          // a copy deleted or restarted since this device last synced is never silently refilled
    const remote = st ? (await this.o.port.pull(0)).map((x) => x.event) : []; const local = this.journal();
    const decide = (reason: DecisionReason): ConnectOutcome => { this.pendingRemote = remote; this.pendingReason = reason; return { status: 'decision_required', reason, localCount: local.length, accountCount: remote.length }; };
    if (remote.length === 0) {
      if (this.resetNotice && this.resetNotice.syncedEvents > 0 && local.length > 0) return decide('copy_was_deleted');   // this device still holds history the account no longer has
      await this.enableOnServer(); this.server = []; this.outbox = local; this.enabled = true; await this.sync(); return { status: 'connected', mode: 'upload', rebuilt: false };
    }
    if (local.length === 0) { await this.enableOnServer(); this.server = remote; this.outbox = []; this.enabled = true; this.resetNotice = null; return { status: 'connected', mode: 'restore', rebuilt: true }; }
    if (isPrefix(local, remote)) { await this.enableOnServer(); this.server = remote; this.outbox = []; this.enabled = true; this.resetNotice = null; return { status: 'connected', mode: local.length === remote.length ? 'in_sync' : 'restore', rebuilt: local.length < remote.length }; }
    if (isPrefix(remote, local)) { await this.enableOnServer(); this.server = remote; this.outbox = local.slice(remote.length); this.enabled = true; this.resetNotice = null; await this.sync(); return { status: 'connected', mode: 'upload_rest', rebuilt: false }; }
    return decide('histories_differ');                                        // different histories on both sides: ask, change nothing, write nothing
  }
  private async enableOnServer() { let st = await this.o.port.status(); if (!st || !st.enabled) st = await this.o.port.enable(this.o.engine, CONSENT_VERSION); this.epoch = st.epoch; this.serverDisablePending = false; }

  /** Resolve a pending decision. Every operation that could discard a history needs the verified-export receipt for exactly that history. */
  async resolve(choice: Resolution): Promise<{ rebuilt: boolean; cleared?: boolean }> {
    if (!this.pendingRemote || !this.pendingReason) throw new Error('no decision is pending');
    const remote = this.pendingRemote, reason = this.pendingReason, local = this.journal(), eng = this.o.engine;
    const done = () => { this.pendingRemote = null; this.pendingReason = null; };
    if ('stay_on_device' in choice) { done(); this.enabled = false; return { rebuilt: false }; }
    if ('clear_device' in choice) {
      if (!receiptMatches(choice.clear_device.receipt, local, eng)) throw new Error('a verified export of this device\'s history is required first');
      this.server = []; this.outbox = []; this.dropped = []; this.resetNotice = null; this.epoch = null; this.enabled = false; done(); return { rebuilt: true, cleared: true };
    }
    if ('upload_again' in choice) {
      if (reason !== 'copy_was_deleted' || choice.upload_again.confirm !== true) throw new Error('uploading again needs an explicit confirmation');
      await this.enableOnServer(); this.server = []; this.outbox = local; this.resetNotice = null; this.enabled = true; done(); await this.sync(); return { rebuilt: false };
    }
    if ('keep_account' in choice) {
      if (reason !== 'histories_differ') throw new Error('nothing to choose between');
      if (!receiptMatches(choice.keep_account.receipt, local, eng)) throw new Error('a verified export of this device\'s history is required first');
      await this.enableOnServer(); this.dropped.push(...local.map((event) => ({ event, reason: 'kept on this device only (the account copy was chosen; a verified file was saved first)' })));
      this.server = remote; this.outbox = []; this.resetNotice = null; this.enabled = true; done(); return { rebuilt: true };
    }
    throw new Error('unknown choice');
  }

  // ── ongoing sync ──
  async sync(): Promise<SyncOutcome> {
    const out: SyncOutcome = { sent: 0, pulled: 0, dropped: [], rebuilt: false };
    if (!this.enabled) return { ...out, skipped: 'disabled' };                    // invariant 1: backup off means no port call at all
    const gen = this.generation; const stillOn = () => this.enabled && this.generation === gen;
    try {
      const st = await this.o.port.status();
      if (!stillOn()) return { ...out, skipped: 'disabled' };
      if (!st) { this.markReset(); return { ...out, skipped: 'server_copy_removed' }; }
      if (st.epoch !== this.epoch) { this.markReset(); return { ...out, skipped: 'history_reset' }; }
      if (!st.enabled) { this.enabled = false; return { ...out, skipped: 'disabled' }; }      // turned off on another device
      if (st.lastSeq > this.server.length) await this.pullMerge(out);
      const bulk = this.server.length === 0 && st.lastSeq === 0; let guard = 0;
      while (this.outbox.length && guard++ < 1000) {
        if (!stillOn()) return { ...out, skipped: 'disabled' };                   // turning backup off takes effect before the next upload
        const batch = bulk ? this.outbox.slice(0, 50) : isRep(this.outbox[0]) ? [this.outbox[0]] : takeRun(this.outbox);
        // If backup is turned off while this request is in flight the server may already have accepted it: its result is ALWAYS applied (so the device
        // and the account agree), and no further upload follows (the check at the top of the loop).
        const r = await this.o.port.append(this.server.length, batch, this.epoch as string);
        if (r.status === 'stale') { await this.pullMerge(out); continue; }
        this.outbox.splice(0, batch.length);
        batch.forEach((e, i) => {
          if (r.results[i] === 'ok') { this.server.push(e); out.sent++; return; }
          this.drop(out, e, r.results[i]);
          if (isRep(e)) this.dropDependents(out, e.day, 'its rep was not accepted');
        });
        if (r.results.some((x) => x !== 'ok')) await this.verifyOutbox(out);     // everything queued after a rejected event must be re-checked before it is sent
      }
    } catch (e) {
      if (e instanceof EpochResetError) { this.markReset(); return { ...out, skipped: 'history_reset' }; }
      if (e instanceof ReplayDriftError) throw e;
      if (!stillOn()) return { ...out, skipped: 'disabled' };        // a request that failed because backup was just turned off is not a service fault
      return { ...out, skipped: kindOf(e) };
    }
    return out;
  }
  /** Compares the epoch this device synced under with what the account shows now. If the copy is gone or was started again, this device stops and keeps its history as unsent history. Call on every read of the account. */
  checkEpoch(accountEpoch: string | null): 'same' | 'removed' | 'reset' {
    if (!this.epoch) return 'same';
    if (accountEpoch === null) { this.markReset(); return 'removed'; }
    if (accountEpoch !== this.epoch) { this.markReset(); return 'reset'; }
    return 'same';
  }
  /** The account copy was deleted or started again elsewhere: stop, keep everything on this device as unsent history, and never re-upload without an explicit decision. */
  private markReset() { this.resetNotice = { syncedEvents: this.server.length + (this.resetNotice?.syncedEvents ?? 0) }; this.outbox = [...this.server, ...this.outbox]; this.server = []; this.epoch = null; this.enabled = false; }
  private drop(out: SyncOutcome, e: BackupEvent, reason: string) { const d = { event: e, reason }; this.dropped.push(d); out.dropped.push(d); }
  private dropDependents(out: SyncOutcome, day: string, reason: string) {
    const keep: BackupEvent[] = [];
    for (const e of this.outbox) { if ((e.kind === 'feedback' || e.kind === 'correction') && e.insightDay === day) this.drop(out, e, reason); else keep.push(e); }
    this.outbox = keep;
  }
  private async pullMerge(out: SyncOutcome) {
    const remote = await this.o.port.pull(this.server.length);
    this.server.push(...remote.map((x) => x.event)); out.pulled += remote.length;
    await this.verifyOutbox(out);
  }
  /**
   * Re-check every waiting event against the engine, replaying the CURRENT account history first. An event the engine would no longer ask for is
   * dropped, and so is anything that depended on it (feedback on a dropped rep must never attach to another device's insight). Runs after a pull AND
   * after any rejection: events recorded after a rejected one came from a local state that included it. A refused attempt has side effects in the
   * verifier (the engine already served that day), so the verifier is rebuilt from what is actually kept.
   */
  private async verifyOutbox(out: SyncOutcome) {
    const fresh = async (events: BackupEvent[]) => {
      const r = this.o.makeRuntime();
      try { await replayInto(r.rt, r.clock, this.o.uid, events, this.o.engine); }
      catch (e) { throw new ReplayDriftError('the account history does not replay under this engine version; restore is refused (export is still possible): ' + (e as Error).message); }
      return r;
    };
    let { rt, clock } = await fresh(this.server);
    const keep: BackupEvent[] = []; const lostDays = new Set<string>(); let lastDay = this.server.length ? this.server[this.server.length - 1].day : '';
    for (const e of this.outbox) {
      if ((e.kind === 'feedback' || e.kind === 'correction') && lostDays.has(e.insightDay)) { this.drop(out, e, 'its rep was not kept'); continue; }
      if (e.day < lastDay) { this.drop(out, e, 'rejected_day_passed (the account history has already moved past this day)'); if (isRep(e)) lostDays.add(e.day); continue; }
      try { await applyEvent(rt, clock, this.o.uid, e, this.o.engine); keep.push(e); lastDay = e.day; }
      catch (err) {
        if (!(err instanceof ReplayDriftError)) throw err;
        this.drop(out, e, 'drift: ' + err.message); if (isRep(e)) lostDays.add(e.day);
        ({ rt, clock } = await fresh([...this.server, ...keep]));
      }
    }
    this.outbox = keep; out.rebuilt = true;
  }

  // ── controls ──
  /** Immediate: no further upload is attempted from this moment, including by a sync already in flight. Unsent events stay on this device. The server flag is updated if it can be reached. */
  async disable(): Promise<{ serverConfirmed: boolean }> {
    this.enabled = false; this.generation++;
    try { await this.o.port.disable(); this.serverDisablePending = false; return { serverConfirmed: true }; } catch { this.serverDisablePending = true; return { serverConfirmed: false }; }
  }
  /** Reads the account's current copy (status + pull). Throws ServiceError if it cannot be verified. */
  private async accountCopy(): Promise<{ epoch: string; events: BackupEvent[] } | null> {
    const st = await this.o.port.status(); if (!st) return null;
    const events = (await this.o.port.pull(0)).map((x) => x.event); return { epoch: st.epoch, events };
  }
  /** True only when discarding the device copy loses nothing: backup is on, nothing is waiting, and a FRESH read of the account shows exactly this history. */
  async canDiscardDeviceWithoutExport(): Promise<boolean> {
    if (!this.enabled || this.outbox.length > 0 || this.journal().length === 0) return this.journal().length === 0;
    try { const a = await this.accountCopy(); return !!a && a.epoch === this.epoch && canon(a.events) === canon(this.journal()); } catch { return false; }
  }
  /** DELETE THE ACCOUNT COPY ONLY. The device keeps its own history, which becomes unsent history that is never re-uploaded without an explicit decision. Needs a verified export of the account copy unless this device holds the same history. */
  async deleteAccountCopy(receipt?: ExportReceipt): Promise<void> {
    const a = await this.accountCopy();
    if (a && a.events.length > 0 && canon(a.events) !== canon(this.journal()) && !receiptMatches(receipt, a.events, this.o.engine)) throw new Error('a verified export of the account copy is required first (this device does not hold the same history)');
    await this.o.port.deleteAll();
    this.resetNotice = { syncedEvents: (a?.events.length ?? 0) + (this.resetNotice?.syncedEvents ?? 0) }; this.outbox = this.journal(); this.server = []; this.epoch = null; this.enabled = false; this.generation++;
  }
  /** CLEAR THIS DEVICE ONLY. Returns true when the device history was cleared (the host then clears storage and engine state). Needs a verified export unless a fresh account read proves nothing is lost. */
  async clearDevice(receipt?: ExportReceipt): Promise<boolean> {
    if (!(await this.canDiscardDeviceWithoutExport()) && !receiptMatches(receipt, this.journal(), this.o.engine)) throw new Error('a verified export of this device\'s history is required first');
    this.server = []; this.outbox = []; this.dropped = []; this.resetNotice = null; this.epoch = null; this.enabled = false; this.generation++; return true;
  }
  /** EXPLICIT COMBINED DELETION: the account copy and this device's copy. Always needs a verified export of the full history (nothing will remain anywhere), unless there is no history. */
  async deleteBoth(receipt?: ExportReceipt): Promise<void> {
    const all = this.journal();
    if (all.length > 0 && !receiptMatches(receipt, all, this.o.engine)) throw new Error('a verified export of the full history is required first');
    await this.o.port.deleteAll(); this.server = []; this.outbox = []; this.dropped = []; this.resetNotice = null; this.epoch = null; this.enabled = false; this.generation++;
  }
  /** Rebuilds a runtime from the full local history (after a restore or a conflict). */
  async rebuild(): Promise<RuntimeBundle> { const r = this.o.makeRuntime(); await replayInto(r.rt, r.clock, this.o.uid, this.journal(), this.o.engine); return r; }
}
const takeRun = (outbox: BackupEvent[]) => { const run: BackupEvent[] = []; for (const e of outbox) { if (isRep(e)) break; run.push(e); } return run; };
