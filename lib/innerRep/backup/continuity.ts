import type { ContinuityIntent, ContinuityPhase, ContinuitySnapshot } from '../../../components/continuity/contract';
import type { KV } from '../runtime/v2-runtime';
import { BackupEvent, CONSENT_VERSION, validateEvent, buildVocabulary } from './events';
import { ConsentState, consentReduce, mayOffer } from './consent';
import { ExportReceipt, FileSaver, receiptFor, verifiedExport } from './export';
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

export type ExtendedIntent = 'check_account' | 'delete_account_copy' | 'clear_device' | 'enable_and_upload' | 'stay_on_device' | 'upload_again' | 'save_file';   // additive to Codex's contract
/** Accepted by the controller ONLY to be refused: replacing the account copy with this device's history was removed from v1. It must never appear in the frontend's action union. */
export type RefusedIntent = 'keep_device';
export type AnyIntent = ContinuityIntent | ExtendedIntent | RefusedIntent;
/** What the person was shown when they chose. Consent-bearing requests are checked against it at this boundary, not in the presentation layer. */
export interface RequestContext { consentVersion?: string }
const CONSENT_BEARING = new Set<string>(['enable', 'enable_and_upload', 'recover', 'upload_again']);
const VERSION_REQUIRED = new Set<string>(['enable', 'enable_and_upload']);        // these screens show the disclosure and send its version; recover and upload_again send it when they can (request to the frontend)
class ConsentRefused extends Error { constructor(public why: 'not_reviewed' | 'version_mismatch' | 'version_missing') { super('consent ' + why); } }
export type Notice = 'account_copy_removed' | 'history_reset' | 'turned_off_elsewhere' | 'account_copy_deleted_device_kept' | 'server_flag_pending' | 'file_saved';
export type ContinuitySnapshotX = ContinuitySnapshot & {
  notice?: Notice; decision?: 'histories_differ' | 'copy_was_deleted';
  /** Changes made since backup was turned off or stopped: they stay on this device and are uploaded only if backup is turned on again. */
  unsentOnDevice: number; error?: { intent: AnyIntent; message: string };
  pilotHistory: 'device_only'; unfinishedPracticeAndOffers: 'device_only';
  /** 'simulated' = the in-memory stub: nothing is stored anywhere. Anything else is a live service. */
  serviceMode: 'simulated' | 'live';
  /** Which consent state the controller holds, and the wording version it will record. Recorded ONLY from this constant, never from the caller. */
  consent: 'off' | 'declined' | 'on' | 'paused' | 'needs_reconsent'; consentVersion: string;
  /** Owner truth for what the screens may offer now (the frontend must not assume these). */
  canUploadAgain: boolean; canKeepDeviceOnly: boolean; canClearDeletedDecision: boolean;
  /** Set while turning backup on would upload events that are retained on this device. Nothing is sent until `enable_and_upload`; `stay_on_device` cancels. No service call is made while this is showing. */
  confirmUpload?: { count: number; fromDay: string; throughDay: string };
  /** When the app reads the account without being asked. 'none' while backup is off; 'while_backup_on' = on opening and after changes, to keep both sides consistent. */
  automaticChecks: 'none' | 'while_backup_on';
  /** Present when signing out would remove practice that is not in the account. Sign-out is never blocked. */
  signOutWarning?: { unsent: number; canSaveFile: boolean };
};

export interface HostPorts {
  uid: string; engine: string; port: ServerPort; kv: KV; now: () => Date;
  makeRuntime: () => RuntimeBundle;
  /** The ONLY confirming saver. null/undefined = file export is unavailable, and so is everything that depends on it. */
  saveFile?: FileSaver | null;
  /** Capability flag, default false: export is a desired feature pending usability testing and safe-handling review. */
  exportEnabled?: boolean;
  /** Consent wording versions that have passed qualified review. A LIVE service refuses every consent-bearing action unless the current wording is listed here (none is, today). The simulated stub is exempt and labelled as such. */
  reviewedConsentVersions?: readonly string[];
  /** Replace the app's engine state with the replayed history and reload the engine store atomically. */
  applyRebuilt: (b: RuntimeBundle) => Promise<void>;
  /** Clear this device's practice (engine state, device-only pilots, journal). Never touches the account. */
  clearDeviceState: () => Promise<void>;
  signOut: () => Promise<void>;
}
interface Persisted { v: 1; client: SyncState; consent: ConsentState; accountCopy: 'none' | 'verified' | 'unknown'; accountSummary: Summary | null; lastConfirmedDay: string | null; deletedNotice: boolean; notice: Notice | null }

class ExportBlocked extends Error { constructor(public why: 'unavailable' | 'cancelled_or_unconfirmed' | 'file_did_not_verify') { super('export ' + why); } }
export const safeMessage = (e: unknown): string => {
  if (e instanceof ConsentRefused) return e.why === 'not_reviewed' ? 'Backup cannot be turned on in this build. Nothing was changed.' : 'The backup disclosure changed or was not shown, so nothing was changed. Please review it and choose again.';
  if (e instanceof Error && /not available in this version/.test(e.message)) return 'That choice is not available in this version. Nothing was changed.';
  if (e instanceof ServiceError) return e.kind === 'offline' ? 'You appear to be offline. Your previous choice still applies.' : 'The service could not be reached. Your previous choice still applies.';
  if (e instanceof ExportBlocked) return e.why === 'unavailable' ? 'Saving a copy of your history is not available here, so this cannot be done safely. Nothing was changed.' : e.why === 'cancelled_or_unconfirmed' ? 'The copy was not saved, so nothing was changed.' : 'The saved copy could not be verified, so nothing was changed.';
  if (e instanceof Error && /verified export/.test(e.message)) return 'A saved copy of the history is required first. Nothing was changed.';
  return 'That change was not completed. Your previous choice still applies.';
};

export class ContinuityController {
  client: SyncClient; consent: ConsentState = { s: 'off' };
  private accountCopy: 'none' | 'verified' | 'unknown' = 'unknown'; private accountSummary: Summary | null = null; private lastConfirmedDay: string | null = null;
  private awaitingUpload: { count: number; fromDay: string; throughDay: string } | null = null; private deletedNotice = false; private notice: Notice | null = null; private busy: null | 'syncing' | 'recovering' | 'deleting' | 'working' = null;
  private disposed = false; private offline = false; private unavailable = false; private error: { intent: AnyIntent; message: string } | null = null; private lastIntent: AnyIntent | null = null; private lastCtx: RequestContext | undefined;
  private listeners = new Set<(s: ContinuitySnapshotX) => void>(); private chain: Promise<unknown> = Promise.resolve(); private syncQueued = false;
  snap: ContinuitySnapshotX;
  constructor(public host: HostPorts) { this.client = new SyncClient({ port: host.port, uid: host.uid, engine: host.engine, makeRuntime: host.makeRuntime }); this.snap = this.compute(); }

  subscribe(cb: (s: ContinuitySnapshotX) => void) { this.listeners.add(cb); return () => { this.listeners.delete(cb); }; }
  get canExport() { return !!this.host.exportEnabled && !!this.host.saveFile; }
  get serviceMode(): 'simulated' | 'live' { return this.host.port.simulated ? 'simulated' : 'live'; }
  /** The simulated stub is exempt (and labelled). A live service needs the current wording to be on the reviewed list. */
  private get consentReviewed() { return this.serviceMode === 'simulated' || (this.host.reviewedConsentVersions ?? []).includes(CONSENT_VERSION); }
  /** Called when the account signs out or changes: nothing more is written or published. */
  dispose() { this.disposed = true; this.listeners.clear(); }
  private publish() { this.snap = this.compute(); this.listeners.forEach((cb) => cb(this.snap)); }
  private async persist() { if (this.disposed) return; const p: Persisted = { v: 1, client: this.client.toJSON(), consent: this.consent, accountCopy: this.accountCopy, accountSummary: this.accountSummary, lastConfirmedDay: this.lastConfirmedDay, deletedNotice: this.deletedNotice, notice: this.notice }; try { await this.host.kv.setItem(historyKey(this.host.uid), JSON.stringify(p)); } catch { /* device storage unavailable: state stays in memory */ } }

  /** Device-local only. Makes NO network call. */
  async load() {
    try { const raw = await this.host.kv.getItem(historyKey(this.host.uid)); if (raw) { const p = JSON.parse(raw) as Persisted; if (p && p.v === 1) { this.client.restoreState(p.client); this.consent = p.consent ?? { s: 'off' }; this.accountCopy = p.accountCopy ?? 'unknown'; this.accountSummary = p.accountSummary ?? null; this.lastConfirmedDay = p.lastConfirmedDay ?? null; this.deletedNotice = !!p.deletedNotice; this.notice = p.notice ?? null; } } } catch { /* unreadable storage behaves as empty */ }
    if (this.consent.s === 'on' && !this.client.enabled) this.consent = { s: 'off' };            // a stored 'on' without a live client is not sync
    this.guardConsentVersion();
    this.publish(); if (this.consent.s === 'on') this.scheduleSync();
  }

  /** If the wording changed since the person accepted, uploads stop at once (locally, no network) until they choose again. */
  private guardConsentVersion() {
    if (this.consent.s !== 'on' || this.consent.version === CONSENT_VERSION) return;
    this.client.pauseLocal(); this.consent = consentReduce(this.consent, { a: 'consent_text_changed' });
  }
  /** Every new local engine event arrives here (via the history bus). Always journaled; sent only if backup is on. */
  async onEvent(e: BackupEvent) { if (this.disposed) return; if (this.client.record(e)) { await this.persist(); this.publish(); if (this.consent.s === 'on') this.scheduleSync(); } }
  private scheduleSync() { if (this.syncQueued || this.disposed) return; this.syncQueued = true; void this.enqueue(async () => { this.syncQueued = false; await this.runSync(); }); }
  private enqueue<T>(f: () => Promise<T>): Promise<T> { const next = this.chain.then(f, f); this.chain = next.catch(() => undefined); return next; }

  /**
   * `ctx.consentVersion` is the wording the person was shown. Consent-bearing intents are checked HERE: enable and enable_and_upload must carry the
   * current reviewed version; recover and upload_again must match it when they carry one. Withdrawal is applied before the queue: a sync already queued
   * or in flight sees `disabled` at once instead of running first.
   */
  request(intent: AnyIntent, ctx?: RequestContext): Promise<void> {
    if (intent === 'disable' || intent === 'sign_out') {
      this.client.pauseLocal();
      if (intent === 'disable') { this.consent = consentReduce(this.consent, { a: 'turn_off' }); this.awaitingUpload = null; this.publish(); }
    }
    return this.enqueue(async () => { await this.dispatch(intent, ctx); });
  }
  private checkConsent(intent: AnyIntent, ctx?: RequestContext) {
    if (!CONSENT_BEARING.has(intent)) return;
    if (!this.consentReviewed) throw new ConsentRefused('not_reviewed');
    if (ctx?.consentVersion !== undefined && ctx.consentVersion !== CONSENT_VERSION) throw new ConsentRefused('version_mismatch');
    if (VERSION_REQUIRED.has(intent) && ctx?.consentVersion === undefined) throw new ConsentRefused('version_missing');
  }
  /** The explicit "check for an account copy": the only read allowed while backup is off. */
  refresh() { return this.request('check_account'); }

  private async dispatch(intent: AnyIntent, ctx?: RequestContext) {
    if (intent === 'retry') { if (!this.lastIntent || !this.error) return; intent = this.lastIntent; ctx = this.lastCtx; }
    if (intent !== 'sign_out') { this.lastIntent = intent; this.lastCtx = ctx; this.error = null; }
    const prevConsent = this.consent; this.notice = intent === 'check_account' ? this.notice : null;
    try {
      this.checkConsent(intent, ctx);
      this.busy = intent === 'recover' ? 'recovering' : intent === 'delete' || intent === 'delete_account_copy' ? 'deleting' : 'working'; this.publish();
      switch (intent) {
        case 'check_account': await this.doCheck(); break;
        case 'enable': await this.doEnable(); break;
        case 'disable': await this.doDisable(); break;
        case 'recover': await this.doEnable(); break;                                            // recovering is an explicit act that restores and turns backup on here
        case 'keep_account': case 'export_then_account': await this.doKeepAccount(); break;
        case 'keep_device': throw new Error('replacing the account copy is not available in this version');
        case 'enable_and_upload': await this.doEnable(true); break;
        case 'stay_on_device': await this.doStayOnDevice(); break;
        case 'upload_again': await this.doUploadAgain(); break;
        case 'save_file': await this.doSaveFile(); break;
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
  private async doEnable(confirmed = false) {
    // Events retained on this device (made before consent, or while backup was off) leave it only after the person has seen how many and said yes. No service call is made before that.
    const held = this.client.outbox;
    if (held.length && !confirmed && !this.client.enabled) { this.awaitingUpload = { count: held.length, fromDay: held[0].day, throughDay: held[held.length - 1].day }; return; }
    this.awaitingUpload = null;
    // Consent is recorded only after the service has answered: while the request is in flight the snapshot says "syncing" and `enabled` stays false.
    const out = await this.client.connect();
    this.offline = false; this.unavailable = false;
    // A decision means backup is NOT on yet: consent is not recorded, and the account facts are exactly what the service said.
    if (out.status === 'decision_required') {
      if (this.client.decisionPending === 'copy_was_deleted') { this.accountCopy = 'none'; this.accountSummary = null; }
      else { this.accountCopy = 'verified'; this.accountSummary = this.client.summaries().pendingAccount; }
      return;
    }
    this.consent = consentReduce(this.consent, { a: 'accept', version: CONSENT_VERSION, day: localIso(this.host.now()) });
    this.accountCopy = 'verified'; this.accountSummary = this.client.summaries().account;
    if (out.rebuilt) await this.host.applyRebuilt(await this.client.rebuild());
    this.settle(); if (this.client.outbox.length) this.scheduleSync();
  }
  private async doStayOnDevice() {
    const pending = this.client.decisionPending; this.awaitingUpload = null;
    if (!pending) return;
    await this.client.resolve({ stay_on_device: true });
    if (pending === 'copy_was_deleted') {                                   // the account copy is gone: say so, and leave nothing that implies it exists
      this.accountCopy = 'none'; this.accountSummary = null; this.lastConfirmedDay = null; this.consent = consentReduce(this.consent, { a: 'server_copy_removed' }); this.notice = 'account_copy_removed';
    } else this.accountSummary = this.client.summaries().account ?? this.accountSummary;      // two histories: the account copy still exists; backup stays off; consent is untouched
  }
  private async doUploadAgain() {
    if (this.client.decisionPending !== 'copy_was_deleted') throw new Error('nothing to upload again');
    await this.client.resolve({ upload_again: { confirm: true } });
    this.consent = consentReduce(this.consent, { a: 'accept', version: CONSENT_VERSION, day: localIso(this.host.now()) });
    this.accountCopy = 'verified'; this.accountSummary = this.client.summaries().account; this.settle(); if (this.client.outbox.length) this.scheduleSync();
  }
  /** A real saved file of this device's history. Changes nothing else. */
  private async doSaveFile() { await this.needExport(this.client.journal()); this.notice = 'file_saved'; }
  private async doDisable() {
    this.awaitingUpload = null;
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
    this.consent = consentReduce(this.consent, { a: 'accept', version: CONSENT_VERSION, day: localIso(this.host.now()) }); this.accountCopy = 'verified';
    await this.host.applyRebuilt(await this.client.rebuild()); this.settle();
  }
  private async doDeleteBoth() {
    // Every history this would destroy is saved and verified first: the device journal, and the account copy when it holds something the device does not.
    const receipts: ExportReceipt[] = []; for (const h of await this.client.exportPlan()) receipts.push(await this.needExport(h.events));
    await this.client.deleteBoth(receipts); await this.host.clearDeviceState();
    this.consent = consentReduce(this.consent, { a: 'delete_data' }); this.accountCopy = 'none'; this.accountSummary = null; this.lastConfirmedDay = null; this.deletedNotice = true;
  }
  private async doDeleteAccountCopy() {
    const r = await this.client.inspect(); const needs = r.remote.length > 0 && r.relation !== 'identical';
    const receipt = needs ? await this.needExport(r.remote) : undefined;
    await this.client.deleteAccountCopy(receipt); this.consent = consentReduce(this.consent, { a: 'delete_data' });
    this.accountCopy = 'none'; this.accountSummary = null; this.lastConfirmedDay = null; this.notice = 'account_copy_deleted_device_kept';
  }
  private async doClearDevice() {
    // Always a verified saved copy of this device's history first (when there is any): "the account has it" is not accepted as proof.
    const journal = this.client.journal(); const receipt = journal.length ? await this.needExport(journal) : undefined;
    const keepSummary = this.client.summaries().account ?? this.accountSummary;
    if (this.client.decisionPending === 'copy_was_deleted') {
      await this.client.resolve({ clear_device: { receipt: receipt ?? receiptFor([], this.host.engine) } }); await this.host.clearDeviceState();
      this.consent = consentReduce(this.consent, { a: 'server_copy_removed' }); this.accountCopy = 'none'; this.accountSummary = null; this.lastConfirmedDay = null; this.notice = 'account_copy_removed';
      return;
    }
    await this.client.clearDevice(receipt); await this.host.clearDeviceState();
    this.consent = consentReduce(this.consent, { a: 'sign_out' }); this.accountSummary = keepSummary; this.accountCopy = keepSummary ? 'verified' : this.accountCopy;
  }

  // ── background sync (only when backup is on) ──
  private settle() { const s = this.client.server; this.lastConfirmedDay = this.client.outbox.length === 0 && s.length ? s[s.length - 1].day : this.lastConfirmedDay; }
  private async runSync() {
    this.guardConsentVersion();
    if (this.disposed || this.consent.s !== 'on' || !this.client.enabled) return;
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
    else if (this.busy === 'working' && (this.lastIntent === 'enable' || this.lastIntent === 'enable_and_upload')) phase = 'syncing';
    else if (decision) phase = 'conflict';
    else if (on) phase = this.unavailable ? 'unavailable' : this.offline ? 'offline' : this.busy === 'syncing' || this.client.outbox.length > 0 ? 'syncing' : this.client.server.length === 0 && deviceEmpty ? 'empty' : 'ready';
    else if (this.consent.s === 'needs_reconsent') phase = 'reconsent';
    else if (this.consent.s === 'paused') phase = 'paused';
    else if (this.deletedNotice && this.accountCopy === 'none') phase = 'deleted';
    else if (this.accountCopy === 'verified' && this.accountSummary && deviceEmpty) phase = 'recoverable';
    else if (this.unavailable && !on) phase = 'unavailable';
    else phase = 'device';
    const account = decision === 'copy_was_deleted' ? null : (sums.pendingAccount ?? sums.account ?? this.accountSummary);     // a deleted copy has no summary: never show "0 completed" as if one existed
    return {
      phase, requestPending: this.busy !== null, enabled: on, accountCopy: this.accountCopy, pending: on ? this.client.outbox.length : 0,
      ...(on && phase === 'ready' && this.lastConfirmedDay ? { lastConfirmedDay: this.lastConfirmedDay } : {}),
      deviceSummary: { completedReps: device.completedReps, throughDay: device.throughDay }, ...(account ? { accountSummary: { completedReps: account.completedReps, throughDay: account.throughDay } } : {}),
      scope: 'engine_only', canExport: this.canExport, serviceMode: this.serviceMode, consent: this.consent.s, consentVersion: CONSENT_VERSION,
      canUploadAgain: decision === 'copy_was_deleted' && this.consentReviewed, canKeepDeviceOnly: !!decision || !!this.awaitingUpload,
      canClearDeletedDecision: decision === 'copy_was_deleted' && (this.canExport || this.client.journal().length === 0), deletionDisclosure: PENDING_DELETION_DISCLOSURE,
      ...(this.notice ? { notice: this.notice } : {}), ...(decision ? { decision } : {}), ...(this.error ? { error: this.error } : {}),
      unsentOnDevice: on ? 0 : this.client.outbox.length, pilotHistory: 'device_only', unfinishedPracticeAndOffers: 'device_only',
      ...(this.awaitingUpload && !on && !decision ? { confirmUpload: this.awaitingUpload } : {}), automaticChecks: on ? 'while_backup_on' : 'none',
      ...(this.client.outbox.length ? { signOutWarning: { unsent: this.client.outbox.length, canSaveFile: this.canExport } } : {}),
    };
  }
}
const summaryOf = (ev: BackupEvent[]): Summary => ({ completedReps: ev.filter((e) => e.kind === 'rep_completed').length, throughDay: ev.length ? ev[ev.length - 1].day : '' });
