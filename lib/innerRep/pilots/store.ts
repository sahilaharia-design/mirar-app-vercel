import type { KV } from '../runtime/v2-runtime';
import { PILOT_KEY_PREFIX, clearPilotKeys } from './keys';
export { PILOT_KEY_PREFIX, clearPilotKeys };
import { PilotSession, PilotSnapshot } from './session';
import { PILOT_CAPS, PILOT_SCHEMA, PilotCaps, PilotContext, PilotId, PilotRecord } from './types';

/**
 * PILOT STORE (development adapter). Device-local, per user, structured records only.
 *   • key: mirar_pilots_v1:<userId> — a separate key from the engine blob; nothing here touches engine state.
 *   • holds records (no text field exists), a monotonically increasing id, and at most ONE unfinished draft.
 *   • a draft is restored only on the same local calendar day; it is never counted, and an old one is dropped on load.
 *   • retention: records older than RETENTION_DAYS or beyond MAX_RECORDS are dropped on every write. The Mirror reports this.
 *   • device-local: NOT synced, NOT the approved durable-history schema (docs/product/DURABLE_HISTORY_DECISION_MEMO.md).
 */
export const RETENTION_DAYS = 180;
export const MAX_RECORDS = 200;
const keyFor = (u: string) => `${PILOT_KEY_PREFIX}:${u}`;


interface Blob { v: typeof PILOT_SCHEMA; seq: number; records: PilotRecord[]; draft: PilotSnapshot | null }
const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNumber = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000);

export class PilotStore {
  private blob: Blob = { v: PILOT_SCHEMA, seq: 0, records: [], draft: null };
  private userId = ''; private current: PilotSession | null = null;
  constructor(private o: { storage: KV; now?: () => Date; caps?: PilotCaps }) {}
  private today() { return isoOf((this.o.now ?? (() => new Date()))()); }
  context(): PilotContext { return { today: this.today(), caps: this.o.caps ?? PILOT_CAPS, prior: this.blob.records }; }

  async init(userId: string) {
    this.userId = userId; this.current = null;
    try {
      const raw = await this.o.storage.getItem(keyFor(userId)); const b = raw ? JSON.parse(raw) : null;
      this.blob = b && b.v === PILOT_SCHEMA && Array.isArray(b.records) ? { v: PILOT_SCHEMA, seq: +b.seq || 0, records: b.records, draft: b.draft ?? null } : { v: PILOT_SCHEMA, seq: 0, records: [], draft: null };
    } catch { this.blob = { v: PILOT_SCHEMA, seq: 0, records: [], draft: null }; }   // unreadable storage behaves as empty, never throws into the UI
    if (this.blob.draft) { const s = PilotSession.restore(this.blob.draft, this.context()); if (s) this.current = s; else { this.blob.draft = null; await this.persist(); } }
  }
  records(): PilotRecord[] { return this.blob.records; }
  session(): PilotSession | null { return this.current; }
  /** an unfinished draft from earlier today, for a "Resume" offer */
  resumable(): { pilot: PilotId } | null { return this.current && !this.current.isComplete && !this.current.isHalted ? { pilot: this.current.pilot } : null; }

  start(pilot: PilotId): PilotSession { this.current = new PilotSession(pilot, this.context()); return this.current; }

  /** call after every answer or back(): keeps the draft so a reload resumes where the person was */
  async saveDraft() { if (!this.current || this.current.isHalted) { this.blob.draft = null; } else this.blob.draft = this.current.snapshot(); await this.persist(); }

  /** Finish (completed) or leave (left): stores the record if there is one, clears the draft. Returns the stored record. */
  async close(how: 'finish' | 'leave'): Promise<PilotRecord | null> {
    const s = this.current; this.current = null; this.blob.draft = null;
    if (!s) { await this.persist(); return null; }
    if (how === 'leave') s.leave();
    const id = this.blob.seq + 1; const rec = s.record(id);
    if (rec) { this.blob.seq = id; this.blob.records.push(rec); }
    await this.persist(); return rec;
  }
  /** DEV/STAGING ONLY: replace this user's records with clearly-labelled fixtures (never called from production code paths) */
  async replaceRecords(records: PilotRecord[]) { this.current = null; this.blob = { v: PILOT_SCHEMA, seq: records.reduce((m, r) => Math.max(m, r.id), 0), records, draft: null }; await this.persist(); }
  /** Sign-out: forget everything held in memory (records, draft, session, user). Storage is cleared separately by clearPilotKeys. */
  dropMemory() { this.current = null; this.blob = { v: PILOT_SCHEMA, seq: 0, records: [], draft: null }; this.userId = ''; }
  async clearAll() { this.current = null; this.blob = { v: PILOT_SCHEMA, seq: 0, records: [], draft: null }; try { await this.o.storage.removeItem(keyFor(this.userId)); } catch {} }
  /** discard without recording (e.g. after a safety halt) */
  async discard() { this.current = null; this.blob.draft = null; await this.persist(); }

  private prune() {
    const t = dayNumber(this.today());
    this.blob.records = this.blob.records.filter((r) => t - dayNumber(r.date) <= RETENTION_DAYS).slice(-MAX_RECORDS);
  }
  private async persist() { this.prune(); try { await this.o.storage.setItem(keyFor(this.userId), JSON.stringify(this.blob)); } catch { /* storage unavailable: state stays in memory for this session */ } }
}
