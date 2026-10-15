import type { V2Runtime } from '../runtime/v2-runtime';
import { BackupEvent, CONSENT_VERSION } from './events';
import { applyEvent, ReplayDriftError, replayInto } from './replay';

// ─── Sync client: local, non-persistent prototype (talks to a ServerPort; no network code here) ──────────────────────────────
// Invariants it maintains (each is tested):
//  1. With backup off, it makes ZERO port calls. Events are still journaled locally.
//  2. The server log ALWAYS replays cleanly through the engine. A conflicting event is dropped, never forced in.
//  3. Nothing is overwritten silently: when both sides hold different history the person decides.
//  4. One device deleting the server copy is never undone by another device re-uploading.

export interface PortStatus { enabled: boolean; lastSeq: number; lastDay: string | null }
export type AppendResult = { status: 'ok'; lastSeq: number; results: string[] } | { status: 'stale'; lastSeq: number };
export interface ServerPort {
  status(): Promise<PortStatus | null>;                       // null = no profile on the server
  enable(engine: string, consentVersion: string): Promise<PortStatus>;
  disable(): Promise<void>;
  append(baseSeq: number, events: BackupEvent[]): Promise<AppendResult>;
  pull(afterSeq: number): Promise<{ seq: number; event: BackupEvent }[]>;
  deleteAll(): Promise<void>;
}
export interface Dropped { event: BackupEvent; reason: string }
export interface SyncOutcome { skipped?: 'disabled' | 'server_copy_removed' | 'offline'; sent: number; pulled: number; dropped: Dropped[]; rebuilt: boolean }
export type ConnectOutcome =
  | { status: 'connected'; mode: 'upload' | 'restore' | 'upload_rest' | 'in_sync'; rebuilt: boolean }
  | { status: 'decision_required'; localCount: number; accountCount: number };
export type Resolution = 'keep_account' | 'keep_account_and_export' | { keep_device: { confirmOverwriteAccountCopy: true } };

const canon = (x: unknown): string => JSON.stringify(x, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v));
const isPrefix = (a: BackupEvent[], b: BackupEvent[]) => a.length <= b.length && a.every((e, i) => canon(e) === canon(b[i]));
const isRep = (e: BackupEvent) => e.kind === 'rep_completed' || e.kind === 'rep_abandoned';

export class SyncClient {
  server: BackupEvent[] = []; outbox: BackupEvent[] = []; dropped: Dropped[] = [];
  enabled = false; private pendingRemote: BackupEvent[] | null = null;
  constructor(private o: { port: ServerPort; uid: string; engine: string; makeRuntime: () => { rt: V2Runtime; clock: { d: Date } } }) {}

  /** The device's full structured history, in order: what the account has, then what is waiting to be sent. */
  journal(): BackupEvent[] { return [...this.server, ...this.outbox]; }
  /** Called by the recorder for every new local event. Always journals locally; sending happens only in sync(). */
  record = (e: BackupEvent) => { this.outbox.push(e); };
  /** History that existed on this device before backup was ever turned on. */
  adoptLocal(events: BackupEvent[]) { this.outbox = [...events]; }

  // ── first opt-in (and reconnect): never an automatic merge ──
  async connect(): Promise<ConnectOutcome> {
    let st = await this.o.port.status(); if (!st || !st.enabled) st = await this.o.port.enable(this.o.engine, CONSENT_VERSION);
    void st;
    const remote = (await this.o.port.pull(0)).map((x) => x.event); const local = this.journal();
    if (remote.length === 0) { this.server = []; this.outbox = local; this.enabled = true; await this.sync(); return { status: 'connected', mode: 'upload', rebuilt: false }; }
    if (local.length === 0) { this.server = remote; this.outbox = []; this.enabled = true; return { status: 'connected', mode: 'restore', rebuilt: true }; }
    if (isPrefix(local, remote)) { this.server = remote; this.outbox = []; this.enabled = true; return { status: 'connected', mode: local.length === remote.length ? 'in_sync' : 'restore', rebuilt: local.length < remote.length }; }
    if (isPrefix(remote, local)) { this.server = remote; this.outbox = local.slice(remote.length); this.enabled = true; await this.sync(); return { status: 'connected', mode: 'upload_rest', rebuilt: false }; }
    this.pendingRemote = remote;                                             // different histories on both sides: ask, change nothing
    return { status: 'decision_required', localCount: local.length, accountCount: remote.length };
  }
  /** `keep_account_and_export` returns the device's history as a file string BEFORE anything is set aside. `keep_device` replaces the account copy and needs an explicit confirmation flag. */
  async resolve(choice: Resolution): Promise<{ exported?: string; rebuilt: boolean }> {
    if (!this.pendingRemote) throw new Error('no decision is pending');
    const remote = this.pendingRemote; const local = this.journal();
    if (typeof choice === 'object') {
      if (choice.keep_device.confirmOverwriteAccountCopy !== true) throw new Error('replacing the account copy needs explicit confirmation');
      await this.o.port.deleteAll(); await this.o.port.enable(this.o.engine, CONSENT_VERSION); this.server = []; this.outbox = local; this.pendingRemote = null; this.enabled = true; await this.sync(); return { rebuilt: false };
    }
    const exported = choice === 'keep_account_and_export' ? exportJournal(local, this.o.engine) : undefined;
    this.dropped.push(...local.map((event) => ({ event, reason: 'kept on this device only (the account copy was chosen)' })));
    this.server = remote; this.outbox = []; this.pendingRemote = null; this.enabled = true; return { exported, rebuilt: true };
  }

  // ── ongoing sync ──
  async sync(): Promise<SyncOutcome> {
    const out: SyncOutcome = { sent: 0, pulled: 0, dropped: [], rebuilt: false };
    if (!this.enabled) return { ...out, skipped: 'disabled' };                    // invariant 1: backup off means no port call at all
    let st: PortStatus | null; try { st = await this.o.port.status(); } catch { return { ...out, skipped: 'offline' }; }
    if (!st || !st.enabled) { this.enabled = false; return { ...out, skipped: 'server_copy_removed' }; }
    try {
      if (st.lastSeq > this.server.length) await this.pullMerge(out);
      const bulk = this.server.length === 0 && st.lastSeq === 0;
      let guard = 0;
      while (this.outbox.length && guard++ < 1000) {
        const batch = bulk ? this.outbox.slice(0, 50) : isRep(this.outbox[0]) ? [this.outbox[0]] : takeRun(this.outbox);
        const r = await this.o.port.append(this.server.length, batch);
        if (r.status === 'stale') { await this.pullMerge(out); continue; }
        this.outbox.splice(0, batch.length);
        batch.forEach((e, i) => {
          if (r.results[i] === 'ok') { this.server.push(e); out.sent++; return; }
          this.drop(out, e, r.results[i]);
          if (isRep(e)) this.dropDependents(out, e.day, 'its rep was not accepted');
        });
        if (r.results.some((x) => x !== 'ok')) await this.verifyOutbox(out);   // everything queued after a rejected event must be re-checked before it is sent
      }
    } catch (e) { if (e instanceof ReplayDriftError) throw e; return { ...out, skipped: 'offline' }; }
    return out;
  }
  private drop(out: SyncOutcome, e: BackupEvent, reason: string) { const d = { event: e, reason }; this.dropped.push(d); out.dropped.push(d); }
  private dropDependents(out: SyncOutcome, day: string, reason: string) {
    const keep: BackupEvent[] = [];
    for (const e of this.outbox) { if ((e.kind === 'feedback' || e.kind === 'correction') && e.insightDay === day) this.drop(out, e, reason); else keep.push(e); }
    this.outbox = keep;
  }
  /** Pull what this device is missing, then re-check the waiting events against the engine as the merged history would serve them. */
  private async pullMerge(out: SyncOutcome) {
    const remote = await this.o.port.pull(this.server.length);
    this.server.push(...remote.map((x) => x.event)); out.pulled += remote.length;
    await this.verifyOutbox(out);
  }
  /**
   * Re-check every waiting event against the engine, replaying the CURRENT account history first. An event the engine would no longer ask for is
   * dropped, and so is anything that depended on it (feedback or a correction on a dropped rep must never attach to another device's insight).
   * This runs after a pull AND after any rejection: events recorded after a rejected one were produced by a local state that included it, so
   * they are not replay-valid on the account's log until they are re-verified. Without this the account log could stop replaying.
   */
  private async verifyOutbox(out: SyncOutcome) {
    const fresh = async (events: BackupEvent[]) => {
      const r = this.o.makeRuntime();
      try { await replayInto(r.rt, r.clock, this.o.uid, events, this.o.engine); }
      catch (e) { throw new ReplayDriftError('the account history does not replay under this engine version; restore is refused (export is still possible): ' + (e as Error).message); }
      return r;
    };
    let { rt, clock } = await fresh(this.server);
    const keep: BackupEvent[] = []; const lostDays = new Set<string>();
    let lastDay = this.server.length ? this.server[this.server.length - 1].day : '';
    for (const e of this.outbox) {
      if ((e.kind === 'feedback' || e.kind === 'correction') && lostDays.has(e.insightDay)) { this.drop(out, e, 'its rep was not kept'); continue; }
      if (e.day < lastDay) { this.drop(out, e, 'rejected_day_passed (the account history has already moved past this day)'); if (isRep(e)) lostDays.add(e.day); continue; }   // the server's own ordering rule, applied here first
      try { await applyEvent(rt, clock, this.o.uid, e, this.o.engine); keep.push(e); lastDay = e.day; }
      catch (err) {
        if (!(err instanceof ReplayDriftError)) throw err;
        this.drop(out, e, 'drift: ' + err.message); if (isRep(e)) lostDays.add(e.day);
        // a refused attempt is not free of side effects (the engine has already served and registered that day's rep): discard the verifier and rebuild it from what is actually kept
        ({ rt, clock } = await fresh([...this.server, ...keep]));
      }
    }
    this.outbox = keep; out.rebuilt = true;
  }

  // ── controls ──
  async disable() { await this.o.port.disable(); this.enabled = false; }
  /** Deletes the server copy. The device keeps its own history (as unsent events) unless the host clears it. Other devices will see the copy is gone and stop; they never re-upload. */
  async deleteServerCopy() { await this.o.port.deleteAll(); this.outbox = this.journal(); this.server = []; this.enabled = false; }
  /** Rebuilds a runtime from the full local history (after a restore or a conflict). */
  async rebuild(): Promise<{ rt: V2Runtime; clock: { d: Date } }> { const r = this.o.makeRuntime(); await replayInto(r.rt, r.clock, this.o.uid, this.journal(), this.o.engine); return r; }
}
const takeRun = (outbox: BackupEvent[]) => { const run: BackupEvent[] = []; for (const e of outbox) { if (isRep(e)) break; run.push(e); } return run; };

// ─── Export / import file ("Keep a copy of my practice"): the same journal, server-free ───────────────────────────────
export function exportJournal(events: BackupEvent[], engine: string): string { return JSON.stringify({ schema: 1, engine, events }); }

/** Validates a file produced by exportJournal (or hand-edited): schema, engine, every event under the whitelist and the catalog, non-decreasing days. Nothing is applied here. */
export function importJournal(text: string, engine: string, validate: (e: unknown) => { ok: boolean; reason?: string }): { ok: true; events: BackupEvent[] } | { ok: false; reason: string } {
  let f: any; try { f = JSON.parse(text); } catch { return { ok: false, reason: 'not a valid file' }; }
  if (!f || f.schema !== 1 || f.engine !== engine || !Array.isArray(f.events)) return { ok: false, reason: 'not a Mirar practice file for this version' };
  for (let i = 0; i < f.events.length; i++) { const v = validate(f.events[i]); if (!v.ok) return { ok: false, reason: `entry ${i + 1}: ${v.reason}` }; if (i > 0 && f.events[i].day < f.events[i - 1].day) return { ok: false, reason: `entry ${i + 1} is out of day order` }; }
  return { ok: true, events: f.events as BackupEvent[] };
}
