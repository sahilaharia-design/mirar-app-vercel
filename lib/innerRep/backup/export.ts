import { BackupEvent, Verdict } from './events';

// ─── Verified export: the safety net before anything that could discard a history ─────────────────────────────────────────────
// A file is produced, re-read, re-validated and compared with the source, and only then handed to a saver that must CONFIRM the write
// (a File System Access write that completed, a native share that reported success). A browser "download" cannot confirm that the file
// reached disk, so it does not qualify: where no confirming saver exists, export is unavailable and so are the destructive operations
// that depend on it. The receipt binds the export to the exact history it covers.

export const canon = (x: unknown): string => JSON.stringify(x, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v));
/** Integrity digest (FNV-1a, 53-bit): detects accidental mismatch between an export and a history; it is not a security primitive. */
export function digestOf(events: BackupEvent[]): string {
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0; const s = canon(events);
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}
export interface ExportReceipt { count: number; digest: string; engine: string }
export const receiptFor = (events: BackupEvent[], engine: string): ExportReceipt => ({ count: events.length, digest: digestOf(events), engine });
export const receiptMatches = (r: ExportReceipt | undefined | null, events: BackupEvent[], engine: string) => !!r && r.engine === engine && r.count === events.length && r.digest === digestOf(events);

export function exportJournal(events: BackupEvent[], engine: string): string { return JSON.stringify({ schema: 1, engine, events }); }
/** Validates a file produced by exportJournal (or hand-edited): schema, engine, every event under the whitelist and catalog, non-decreasing days. Applies nothing. */
export function importJournal(text: string, engine: string, validate: (e: unknown) => Verdict): { ok: true; events: BackupEvent[] } | { ok: false; reason: string } {
  let f: any; try { f = JSON.parse(text); } catch { return { ok: false, reason: 'not a valid file' }; }
  if (!f || f.schema !== 1 || f.engine !== engine || !Array.isArray(f.events)) return { ok: false, reason: 'not a Mirar practice file for this version' };
  for (let i = 0; i < f.events.length; i++) { const v = validate(f.events[i]); if (!v.ok) return { ok: false, reason: `entry ${i + 1}: ${(v as { reason: string }).reason}` }; if (i > 0 && f.events[i].day < f.events[i - 1].day) return { ok: false, reason: `entry ${i + 1} is out of day order` }; }
  return { ok: true, events: f.events as BackupEvent[] };
}

/** A saver must resolve true ONLY when the file is confirmed written; false when the person cancelled or the write could not be confirmed. */
export type FileSaver = (text: string, suggestedName: string) => Promise<boolean>;
export type VerifiedExport = { ok: true; receipt: ExportReceipt } | { ok: false; reason: 'unavailable' | 'cancelled_or_unconfirmed' | 'file_did_not_verify' };
export async function verifiedExport(events: BackupEvent[], engine: string, validate: (e: unknown) => Verdict, save: FileSaver | null | undefined, name = 'mirar-practice.json'): Promise<VerifiedExport> {
  if (!save) return { ok: false, reason: 'unavailable' };
  const text = exportJournal(events, engine);
  const back = importJournal(text, engine, validate);                              // re-read what is about to be written
  if (!back.ok || canon(back.events) !== canon(events)) return { ok: false, reason: 'file_did_not_verify' };
  let saved = false; try { saved = await save(text, name); } catch { saved = false; }
  return saved ? { ok: true, receipt: receiptFor(events, engine) } : { ok: false, reason: 'cancelled_or_unconfirmed' };
}
