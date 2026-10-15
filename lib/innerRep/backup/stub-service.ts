import { BackupEvent, validateEvent, buildVocabulary } from './events';
import type { AppendResult, PortStatus, ServerPort } from './sync';
import { ServiceError, EpochResetError } from './sync';

// ─── The server's rules as a pure in-memory model, plus a scripted "service" with explicit simulated outcomes ────────────────────
// NOT a network client: nothing here can reach any server. `ServerCore` mirrors docs/proposed/option-b/001_history_backup.sql rule for
// rule (scripts/runtime/backup-sync.test.ts runs the same scenarios against it and against the real SQL on a throwaway database).
// `StubService` is what the app uses behind the default-off flag: every failure a real service could produce is an EXPLICIT, labelled
// choice (`mode`), never a hidden default. State lives in memory only: a page reload resets it.
export class ServerCore {
  profile: { enabled: boolean; lastSeq: number; lastDay: string | null; epoch: string } | null = null; events: BackupEvent[] = []; static epochs = 0;
  constructor(private engine: string, private today: () => string = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10)) {}
  private vocab = () => buildVocabulary(this.engine);
  status(): PortStatus | null { return this.profile ? { ...this.profile } : null; }
  enable(): PortStatus { this.profile = this.profile ? { ...this.profile, enabled: true } : { enabled: true, lastSeq: 0, lastDay: null, epoch: `epoch-${++ServerCore.epochs}` }; return { ...this.profile }; }
  disable() { if (this.profile) this.profile.enabled = false; }
  deleteAll() { this.profile = null; this.events = []; }
  pull(after: number) { return this.events.map((event, i) => ({ seq: i + 1, event })).filter((x) => x.seq > after); }
  append(baseSeq: number, evs: BackupEvent[], epoch: string): AppendResult {
    if (!this.profile || !this.profile.enabled) throw new Error('backup is not turned on');
    if (this.profile.epoch !== epoch) throw new EpochResetError();
    if (evs.length > 200) throw new Error('at most 200');
    if (this.profile.lastSeq !== baseSeq) return { status: 'stale', lastSeq: this.profile.lastSeq };
    const results: string[] = []; const v = this.vocab();
    for (const e of evs) {
      const ok = validateEvent(e, v); if (!ok.ok) throw new Error('rejected: ' + (ok as { reason: string }).reason);
      if (e.day > this.today()) throw new Error('event is dated in the future');
      let res = 'ok';
      if (this.profile.lastDay && e.day < this.profile.lastDay) res = 'rejected_day_passed';
      else if ((e.kind === 'rep_completed' || e.kind === 'rep_abandoned') && this.events.some((x) => x.day === e.day && (x.kind === 'rep_completed' || x.kind === 'rep_abandoned'))) res = 'rejected_day_taken';
      else if (e.kind === 'feedback' || e.kind === 'correction') {
        if (!this.events.some((x) => x.kind === 'rep_completed' && x.day === e.insightDay)) res = 'rejected_no_insight';
        else if (e.kind === 'correction' && !this.events.some((x) => x.kind === 'feedback' && x.insightDay === e.insightDay && x.value === 'partly')) res = 'rejected_order';
        else if (this.events.some((x) => x.kind === e.kind && (x as { insightDay?: string }).insightDay === e.insightDay)) res = 'rejected_duplicate';
      }
      if (res === 'ok') { this.events.push(e); this.profile.lastSeq++; this.profile.lastDay = e.day; }
      results.push(res);
    }
    return { status: 'ok', lastSeq: this.profile.lastSeq, results };
  }
}

/** Explicit, labelled behaviours a real service can show. `normal` is the only default; every other mode is chosen on purpose. */
export type SimulatedMode = 'normal' | 'offline' | 'unavailable' | 'service_error' | 'slow';
export interface StubServiceOptions { engine: string; sleep?: (ms: number) => Promise<void> }
export class StubService {
  cores = new Map<string, ServerCore>(); mode: SimulatedMode = 'normal'; failNext = 0; staleOnce = false; calls: { op: string; uid: string; mode: SimulatedMode }[] = [];
  constructor(private o: StubServiceOptions) {}
  core(uid: string): ServerCore { let c = this.cores.get(uid); if (!c) { c = new ServerCore(this.o.engine); this.cores.set(uid, c); } return c; }
  /** A scripted event the person did not cause on this device. */
  simulateCopyDeletedElsewhere(uid: string) { this.core(uid).deleteAll(); }
  simulateAccountReset(uid: string, events: BackupEvent[]) { const c = this.core(uid); c.deleteAll(); c.enable(); for (const e of events) c.append(c.profile!.lastSeq, [e], c.profile!.epoch); }
  simulateOtherDeviceWrites(uid: string, events: BackupEvent[]) { const c = this.core(uid); for (const e of events) c.append(c.profile!.lastSeq, [e], c.profile!.epoch); }
  port(uid: string): ServerPort {
    const guard = async <T,>(op: string, f: () => T): Promise<T> => {
      this.calls.push({ op, uid, mode: this.mode });
      if (this.mode === 'slow') await (this.o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))))(1200);
      if (this.mode === 'offline') throw new ServiceError('offline', 'no connection');
      if (this.mode === 'unavailable') throw new ServiceError('unavailable', 'service cannot be reached');
      if (this.failNext > 0 || this.mode === 'service_error') { if (this.failNext > 0) this.failNext--; throw new ServiceError('service', 'the service reported an error'); }
      return f();
    };
    const c = () => this.core(uid);
    return {
      status: () => guard('status', () => c().status()),
      enable: (_e, _v) => guard('enable', () => c().enable()),
      disable: () => guard('disable', () => c().disable()),
      append: (base, evs, epoch) => guard('append', () => { if (this.staleOnce) { this.staleOnce = false; return { status: 'stale' as const, lastSeq: c().profile?.lastSeq ?? 0 }; } return c().append(base, evs, epoch); }),
      pull: (after) => guard('pull', () => c().pull(after)),
      deleteAll: () => guard('deleteAll', () => c().deleteAll()),
    };
  }
}
