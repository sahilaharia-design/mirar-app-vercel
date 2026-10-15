import type { ContinuityIntent, ContinuityPhase, ContinuitySnapshot } from '../../../components/continuity/contract';
import type { KV } from '../runtime/v2-runtime';
import { BackupEvent, CONSENT_VERSION, validateEvent, buildVocabulary } from './events';
import { ConsentState, consentReduce, mayOffer } from './consent';
import { FileSaver, verifiedExport } from './export';
import { localIso } from './recorder';
import { RuntimeBundle, ServerPort, ServiceError, Summary, SyncClient, SyncState } from './sync';

// ─── The adapter between my real model (journal, SyncClient, consent) and Codex's ContinuityPort ──────────────────────────────
// PURE TypeScript (no React Native): testable in Node. The presentation owns wording; this owns truth. Rules it enforces:
//  • `request(intent)` is a request, never proof. The next snapshot is published only from real state after the operation settles.
//  • A failed operation keeps the previous consent and state and publishes phase 'error' with a safe human-readable message (no ids, SQL or security detail).
//  • A failure to READ the account is 'unavailable' or 'offline', never "empty".
//  • Nothing is called on the network while backup is off, except one explicit read the person asks for (`check_account`).
//  • Scope is 'engine_only': pilot history and unfinished practice stay on this device, and the snapshot says so.
import { HISTORY_KEY_PREFIX } from './keys';
export { HISTORY_KEY_PREFIX };
export const historyKey = (uid: string) => `${HISTORY_KEY_PREFIX}:${uid}`;
/** Provider backup-removal window and access wording are NOT yet verified or reviewed: no retention promise is made. */
export const PENDING_DELETION_DISCLOSURE = 'Deleting removes the account copy. How long the hosting provider may keep copies in its own backups has not been verified, so no period is promised. This wording is pending qualified review.';

export type ExtendedIntent = 'check_account' | 'delete_account_copy' | 'clear_device';   // additive to Codex's contract; the UI does not offer them yet
export type AnyIntent = ContinuityIntent | ExtendedIntent;
export type Notice = 'account_copy_removed' | 'history_reset' | 'turned_off_elsewhere' | 'account_copy_deleted_device_kept' | 'server_flag_pending';
export type ContinuitySnapshotX = ContinuitySnapshot & {
  notice?: Notice; decision?: 'histories_differ' | 'copy_was_deleted';
  /** Changes made since backup was turned off or stopped: they stay on this device and are uploaded only if backup is turned on again. */
  unsentOnDevice: number; error?: { intent: AnyIntent; message: string };
  pilotHistory: 'device_only'; unfinishedPracticeAndOffers: 'device_only';
};

export interface HostPorts {
  uid: string; engine: string; port: ServerPort; kv: KV; now: () => Date;
  makeRuntime: () => RuntimeBundle;
  /** The ONLY confirming saver. null/undefined = file export is unavailable, and so is everything that depends on it. */
  saveFile?: FileSaver | null;
  /** Capability flag, default false: export is a desired feature pending usability testing and safe-handling review. */
  exportEnabled?: boolean;
  /** Replace the app's engine state with the replayed history and reload the engine store atomically. */
  applyRebuilt: (b: RuntimeBundle) => Promise<void>;
  /** Clear this device's practice (engine state, device-only pilots, journal). Never touches the account. */
  clearDeviceState: () => Promise<void>;
  signOut: () => Promise<void>;
}
interface Persisted { v: 1; client: SyncState; consent: ConsentState; accountCopy: 'none' | 'verified' | 'unknown'; accountSummary: Summary | null; lastConfirmedDay: string | null; deletedNotice: boolean; notice: Notice | null }

class ExportBlocked extends Error { constructor(public why: 'unavailable' | 'cancelled_or_unconfirmed' | 'file_did_not_verify') { super('export ' + why); } }
export const safeMessage = (e: unknown): string => {
  if (e instanceof ServiceError) return e.kind === 'offline' ? 'You appear to be offline. Your previous choice still applies.' : 'The service could not be reached. Your previous choice still applies.';
  if (e instanceof ExportBlocked) return e.why === 'unavailable' ? 'Saving a copy of your history is not available here, so this cannot be done safely. Nothing was changed.' : e.why === 'cancelled_or_unconfirmed' ? 'The copy was not saved, so nothing was changed.' : 'The saved copy could not be verified, so nothing was changed.';
  if (e instanceof Error && /verified export/.test(e.message)) return 'A saved copy of the history is required first. Nothing was changed.';
  return 'That change was not completed. Your previous choice still applies.';
};

export class ContinuityController {
  client: SyncClient; consent: ConsentState = { s: 'off' };
  private accountCopy: 'none' | 'verified' | 'unknown' = 'unknown'; private accountSummary: Summary | null = null; private lastConfirmedDay: string | null = null;
  private deletedNotice = false; private notice: Notice | null = null; private busy: null | 'syncing' | 'recovering' | 'deleting' | 'working' = null;
  private disposed = false; private offline = false; private unavailable = false; private error: { intent: AnyIntent; message: string } | null = null; private lastIntent: AnyIntent | null = null;
  private listeners = new Set<(s: ContinuitySnapshotX) => void>(); private chain: Promise<unknown> = Promise.resolve(); private syncQueued = false;
  snap: ContinuitySnapshotX;
  constructor(public host: HostPorts) { this.client = new SyncClient({ port: host.port, uid: host.uid, engine: host.engine, makeRuntime: host.makeRuntime }); this.snap = this.compute(); }

  subscribe(cb: (s: ContinuitySnapshotX) => void) { this.listeners.add(cb); return () => { this.listeners.delete(cb); }; }
  get canExport() { return !!this.host.exportEnabled && !!this.host.saveFile; }
  /** Called when the account signs out or changes: nothing more is written or published. */
  dispose() { this.disposed = true; this.listeners.clear(); }
  private publish() { this.snap = this.compute(); this.listeners.forEach((cb) => cb(this.snap)); }
  private async persist() { if (this.disposed) return; const p: Persisted = { v: 1, client: this.client.toJSON(), consent: this.consent, accountCopy: this.accountCopy, accountSummary: this.accountSummary, lastConfirmedDay: this.lastConfirmedDay, deletedNotice: this.deletedNotice, notice: this.notice }; try { await this.host.kv.setItem(historyKey(this.host.uid), JSON.stringify(p)); } catch { /* device storage unavailable: state stays in memory */ } }

  /** Device-local only. Makes NO network call. */
  async load() {
    try { const raw = await this.host.kv.getItem(historyKey(this.host.uid)); if (raw) { const p = JSON.parse(raw) as Persisted; if (p && p.v === 1) { this.client.restoreState(p.client); this.consent = p.consent ?? { s: 'off' }; this.accountCopy = p.accountCopy ?? 'unknown'; this.accountSummary = p.accountSummary ?? null; this.lastConfirmedDay = p.lastConfirmedDay ?? null; this.deletedNotice = !!p.deletedNotice; this.notice = p.notice ?? null; } } } catch { /* unreadable storage behaves as empty */ }
    if (this.consent.s === 'on' && !this.client.enabled) this.consent = { s: 'off' };            // a stored 'on' without a live client is not sync
    this.publish(); if (this.consent.s === 'on') this.scheduleSync();
  }

  /** Every new local engine event arrives here (via the history bus). Always journaled; sent only if backup is on. */
  async onEvent(e: BackupEvent) { if (this.disposed) return; if (this.client.record(e)) { await this.persist(); this.publish(); if (this.consent.s === 'on') this.scheduleSync(); } }
  private scheduleSync() { if (this.syncQueued || this.disposed) return; this.syncQueued = true; void this.enqueue(async () => { this.syncQueued = false; await this.runSync(); }); }
  private enqueue<T>(f: () => Promise<T>): Promise<T> { const next = this.chain.then(f, f); this.chain = next.catch(() => undefined); return next; }

  request(intent: AnyIntent): Promise<void> { return this.enqueue(async () => { await this.dispatch(intent); }); }
  /** The explicit "check for an account copy": the only read allowed while backup is off. */
  refresh() { return this.request('check_account'); }

  private async dispatch(intent: AnyIntent) {
    if (intent === 'retry') { if (!this.lastIntent || !this.error) return; intent = this.lastIntent; }
    if (intent !== 'sign_out') { this.lastIntent = intent; this.error = null; }
    const prevConsent = this.consent; this.notice = intent === 'check_account' ? this.notice : null;
    try {
      this.busy = intent === 'recover' ? 'recovering' : intent === 'delete' || intent === 'delete_account_copy' ? 'deleting' : 'working'; this.publish();
      switch (intent) {
        case 'check_account': await this.doCheck(); break;
        case 'enable': await this.doEnable(); break;
        case 'disable': await this.doDisable(); break;
        case 'recover': await this.doEnable(); break;                                            // recovering is an explicit act that restores and turns backup on here
        case 'keep_account': case 'export_then_account': await this.doKeepAccount(); break;
        case 'keep_device': await this.doKeepDevice(); break;
        case 'delete': await this.doDeleteBoth(); break;
        case 'delete_account_copy': await this.doDeleteAccountCopy(); break;
        case 'clear_device': await this.doClearDevice(); break;
        case 'sign_out': this.disposed = true; await this.host.signOut(); return;     // sign-out clears the device: nothing may be written back afterwards
      }
    } catch (e) { this.consent = prevConsent; this.error = { intent, message: safeMessage(e) }; }
    finally { if (!this.disposed) { this.busy = null; await this.persist(); this.publish(); } }
  }

  // ── operations ──
  private async doCheck() {
    try { const r = await this.client.inspect(); this.offline = false; this.unavailable = false;
      if (r.verdict === 'removed' || r.verdict === 'reset') { this.consent = consentReduce(this.consent, { a: 'server_copy_removed' }); this.notice = r.verdict === 'removed' ? 'account_copy_removed' : 'history_reset'; }
      this.accountCopy = r.relation === 'none' ? 'none' : 'verified'; this.accountSummary = r.relation === 'none' ? null : summaryOf(r.remote);
      if (r.relation === 'differ') this.client.markDecision('histories_differ', r.remote);
    } catch (e) { this.accountCopy = 'unknown'; if (e instanceof ServiceError && e.kind === 'offline') this.offline = true; else this.unavailable = true; }   // a failed read is never "empty"
  }
  private async doEnable() {
    // Consent is recorded only after the service has answered: while the request is in flight the snapshot says "syncing" and `enabled` stays false.
    const out = await this.client.connect();
    this.consent = consentReduce(this.consent, { a: 'accept', version: CONSENT_VERSION, day: localIso(this.host.now()) });
    this.offline = false; this.unavailable = false; this.accountCopy = 'verified';
    if (out.status === 'decision_required') { this.accountSummary = this.client.summaries().pendingAccount; return; }
    this.accountSummary = this.client.summaries().account;
    if (out.rebuilt) await this.host.applyRebuilt(await this.client.rebuild());
    this.settle(); if (this.client.outbox.length) this.scheduleSync();
  }
  private async doDisable() {
    const r = await this.client.disable(); this.consent = consentReduce(this.consent, { a: 'turn_off' });
    this.accountCopy = this.client.server.length || this.accountSummary ? 'verified' : this.accountCopy; this.accountSummary = this.client.summaries().account ?? this.accountSummary;
    if (!r.serverConfirmed) this.notice = 'server_flag_pending';
  }
  private async needExport(events: BackupEvent[]) {
    if (!this.canExport) throw new ExportBlocked('unavailable');
    const r = await verifiedExport(events, this.host.engine, (e) => validateEvent(e, buildVocabulary(this.host.engine)), this.host.saveFile);
    if (!r.ok) throw new ExportBlocked(r.reason); return r.receipt;
  }
  private async doKeepAccount() {
    if (this.client.decisionPending !== 'histories_differ') throw new Error('nothing to choose between');
    const receipt = await this.needExport(this.client.journal());
    await this.client.resolve({ keep_account: { receipt } }); this.accountSummary = this.client.summaries().account;
    await this.host.applyRebuilt(await this.client.rebuild()); this.settle();
  }
  private async doKeepDevice() {
    const remote = this.client.pendingAccount; if (this.client.decisionPending !== 'histories_differ' || !remote) throw new Error('nothing to choose between');
    const receipt = await this.needExport(remote);
    await this.client.resolve({ keep_device: { confirmOverwriteAccountCopy: true, accountCopyReceipt: receipt } }); this.accountSummary = this.client.summaries().account; this.settle();
  }
  private async doDeleteBoth() {
    const all = this.client.journal(); const receipt = all.length ? await this.needExport(all) : undefined;
    await this.client.deleteBoth(receipt); await this.host.clearDeviceState();
    this.consent = consentReduce(this.consent, { a: 'delete_data' }); this.accountCopy = 'none'; this.accountSummary = null; this.lastConfirmedDay = null; this.deletedNotice = true;
  }
  private async doDeleteAccountCopy() {
    const r = await this.client.inspect(); const needs = r.remote.length > 0 && r.relation !== 'identical';
    const receipt = needs ? await this.needExport(r.remote) : undefined;
    await this.client.deleteAccountCopy(receipt); this.consent = consentReduce(this.consent, { a: 'delete_data' });
    this.accountCopy = 'none'; this.accountSummary = null; this.lastConfirmedDay = null; this.notice = 'account_copy_deleted_device_kept';
  }
  private async doClearDevice() {
    const keepSummary = this.client.summaries().account ?? this.accountSummary; const free = await this.client.canDiscardDeviceWithoutExport();
    const receipt = free ? undefined : await this.needExport(this.client.journal());
    await this.client.clearDevice(receipt); await this.host.clearDeviceState();
    this.consent = consentReduce(this.consent, { a: 'sign_out' }); this.accountSummary = keepSummary; this.accountCopy = keepSummary ? 'verified' : this.accountCopy;
  }

  // ── background sync (only when backup is on) ──
  private settle() { const s = this.client.server; this.lastConfirmedDay = this.client.outbox.length === 0 && s.length ? s[s.length - 1].day : this.lastConfirmedDay; }
  private async runSync() {
    if (this.consent.s !== 'on') return;
    this.busy = 'syncing'; this.publish();
    try {
      const out = await this.client.sync(); this.offline = out.skipped === 'offline'; this.unavailable = out.skipped === 'unavailable' || out.skipped === 'service_error';
      if (out.skipped === 'server_copy_removed') { this.consent = consentReduce(this.consent, { a: 'server_copy_removed' }); this.accountCopy = 'none'; this.accountSummary = null; this.notice = 'account_copy_removed'; }
      else if (out.skipped === 'history_reset') { this.consent = consentReduce(this.consent, { a: 'server_copy_removed' }); this.accountCopy = 'unknown'; this.notice = 'history_reset'; }
      else if (out.skipped === 'disabled' && this.consent.s === 'on' && !this.client.enabled) { this.consent = consentReduce(this.consent, { a: 'turn_off' }); this.notice = 'turned_off_elsewhere'; }
      if (!out.skipped) { this.accountCopy = 'verified'; this.accountSummary = this.client.summaries().account; }
      if (out.rebuilt) await this.host.applyRebuilt(await this.client.rebuild());
      this.settle();
    } catch { this.unavailable = true; }
    finally { this.busy = null; await this.persist(); this.publish(); }
  }

  /** The optional post-completion card: after a first completed practice on this device, never while on or paused, never within the 30-day quiet period after "Not now". */
  invitationEligible(completedRepsOnDevice: number, today: string) { return completedRepsOnDevice > 0 && !this.disposed && mayOffer(this.consent, today) && this.accountCopy !== 'verified'; }
  async dismissInvitation() { this.consent = consentReduce(this.consent, { a: 'decline', day: localIso(this.host.now()) }); await this.persist(); this.publish(); }

  /** What to tell someone about to sign out (sign-out itself is never blocked). */
  signOutAdvice() { return { unconfirmed: this.client.outbox.length, accountCopy: this.accountCopy, pilotsDeviceOnly: true as const, exportRecommended: this.client.outbox.length > 0 && this.canExport }; }

  // ── the snapshot (derived only from real state) ──
  private compute(): ContinuitySnapshotX {
    const on = this.consent.s === 'on' && this.client.enabled; const sums = this.client.summaries(); const device = sums.device; const deviceEmpty = this.client.journal().length === 0;
    const decision = this.client.decisionPending;
    let phase: ContinuityPhase;
    if (this.busy === 'deleting') phase = 'deleting';
    else if (this.busy === 'recovering') phase = 'recovering';
    else if (this.error) phase = 'error';
    else if (this.busy === 'working' && this.lastIntent === 'enable') phase = 'syncing';
    else if (decision) phase = 'conflict';
    else if (on) phase = this.unavailable ? 'unavailable' : this.offline ? 'offline' : this.busy === 'syncing' || this.client.outbox.length > 0 ? 'syncing' : this.client.server.length === 0 && deviceEmpty ? 'empty' : 'ready';
    else if (this.consent.s === 'paused') phase = 'paused';
    else if (this.deletedNotice && this.accountCopy === 'none') phase = 'deleted';
    else if (this.accountCopy === 'verified' && this.accountSummary && deviceEmpty) phase = 'recoverable';
    else if (this.unavailable && !on) phase = 'unavailable';
    else phase = 'device';
    const account = sums.pendingAccount ?? sums.account ?? this.accountSummary;
    return {
      phase, requestPending: this.busy !== null, enabled: on, accountCopy: this.accountCopy, pending: on ? this.client.outbox.length : 0,
      ...(on && phase === 'ready' && this.lastConfirmedDay ? { lastConfirmedDay: this.lastConfirmedDay } : {}),
      deviceSummary: { completedReps: device.completedReps, throughDay: device.throughDay }, ...(account ? { accountSummary: { completedReps: account.completedReps, throughDay: account.throughDay } } : {}),
      scope: 'engine_only', canExport: this.canExport, deletionDisclosure: PENDING_DELETION_DISCLOSURE,
      ...(this.notice ? { notice: this.notice } : {}), ...(decision ? { decision } : {}), ...(this.error ? { error: this.error } : {}),
      unsentOnDevice: on ? 0 : this.client.outbox.length, pilotHistory: 'device_only', unfinishedPracticeAndOffers: 'device_only',
    };
  }
}
const summaryOf = (ev: BackupEvent[]): Summary => ({ completedReps: ev.filter((e) => e.kind === 'rep_completed').length, throughDay: ev.length ? ev[ev.length - 1].day : '' });
