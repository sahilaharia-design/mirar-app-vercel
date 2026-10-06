import { RepRecord } from './types';

// ─── Local retry store (structured data only) ─────────────────────────────────
// Resilient retry for STRUCTURED answers only. Raw free text is never written
// here — on web, AsyncStorage is browser localStorage (unencrypted, readable by
// any script on the origin, survives until cleared). Everything is keyed per
// user and wiped on sign-out. Storage is injected so this is testable.

export interface KV {
  getItem(k: string): Promise<string | null>;
  setItem(k: string, v: string): Promise<void>;
  removeItem(k: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

export const LOCAL_PREFIX = 'mirar_inner_reps_v1';
export const MAX_LOCAL_RECORDS = 200;
const keyFor = (userId: string) => `${LOCAL_PREFIX}:${userId}`;

export interface LocalState { records: RepRecord[]; pending: string[] }

/** Remove anything sensitive. Applied on every read AND write, so data written by
 *  older builds (which stored `words`) is scrubbed the first time it is read. */
export function scrub(rec: RepRecord): RepRecord {
  const { words: _dropped, ...answer } = (rec.answer ?? { unknown: true }) as any;
  return { ...rec, answer };
}

export function createLocalStore(kv: KV) {
  return {
    async read(userId: string): Promise<LocalState> {
      try {
        const raw = await kv.getItem(keyFor(userId));
        if (raw) {
          const p = JSON.parse(raw);
          return { records: (p.records ?? []).map(scrub), pending: p.pending ?? [] };
        }
      } catch {}
      return { records: [], pending: [] };
    },
    async write(userId: string, records: RepRecord[], pending: string[]) {
      // newest-first in, keep the newest MAX_LOCAL_RECORDS
      try { await kv.setItem(keyFor(userId), JSON.stringify({ records: records.slice(0, MAX_LOCAL_RECORDS).map(scrub), pending })); } catch {}
    },
    /** Sign-out: remove every user's Inner Rep key on this device, plus the
     *  legacy un-keyed key (which may hold free text from earlier builds). */
    async clearAll() {
      try {
        const keys = await kv.getAllKeys();
        await Promise.all(keys.filter((k) => k === LOCAL_PREFIX || k.startsWith(LOCAL_PREFIX + ':')).map((k) => kv.removeItem(k)));
      } catch {}
    },
  };
}
