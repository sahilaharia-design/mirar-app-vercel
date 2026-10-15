// ─── Option B (opt-in "Back up my practice"): event contract v1 ───────────────────────────────────────────────────────
// PURE TypeScript. LOCAL, NON-PERSISTENT PROTOTYPE: nothing in this directory is imported by the app, calls the network,
// or touches Supabase. It defines the structured event log that durable history would store, the whitelist that makes
// free text impossible to transmit, and the vocabulary the server would enforce. See docs/product/OPTION_B_IMPLEMENTATION_SPEC.md.
//
// An event is one deterministic operation on the frozen engine's runtime. The engine is deterministic from
// (userSeed, engine version, ordered operations), so replaying the log reproduces the state.
import { DOMAINS, Domain, Frame, Timeframe } from '../v2/types';
import { TEMPLATES, LENS_OPTIONS } from '../v2/templates';
import { CORRECTION_REASONS } from '../v2/contracts';

export const BACKUP_SCHEMA = 1 as const;
/** The consent text version a person accepted. Changing the consent wording bumps this and requires re-consent. */
export const CONSENT_VERSION = '2026-10-v1' as const;
export const MAX_ANSWERS = 8;

export type FeedbackValue = 'accurate' | 'partly' | 'no' | 'unsure';
export const FEEDBACK_VALUES: FeedbackValue[] = ['accurate', 'partly', 'no', 'unsure'];
export const CORRECTION_IDS = CORRECTION_REASONS.map((r) => r.id as string);
export const TIMEFRAMES: Timeframe[] = ['today', 'tomorrow', 'this_week', 'specific_date', 'none'];
export const ANSWER_KINDS = ['option', 'unknown', 'skip', 'domain', 'timeframe', 'yes', 'no', 'words'] as const;
export type AnswerKind = (typeof ANSWER_KINDS)[number];
export const FRAMES: Frame[] = ['base', 'lens', 'thread_check', 'resolution', 'event_check', 'commitment_check'];

/** One answer, flattened and stripped to ids. `words` is a marker only: no text exists in the contract. */
export interface WireAnswer { s: string; k: AnswerKind; o?: string; d?: Domain; tf?: Timeframe; date?: string }

export type BackupEvent =
  | { kind: 'rep_completed'; day: string; engine: string; template: string; frame: Frame; bound?: Domain; variant?: number; answers: WireAnswer[] }
  | { kind: 'rep_abandoned'; day: string; engine: string; template: string }
  | { kind: 'feedback'; day: string; engine: string; insightDay: string; value: FeedbackValue }
  | { kind: 'correction'; day: string; engine: string; insightDay: string; reason: string };
export type BackupKind = BackupEvent['kind'];
export const KINDS: BackupKind[] = ['rep_completed', 'rep_abandoned', 'feedback', 'correction'];

// ─── vocabulary: every id the server may accept, generated from the frozen catalog ───────────────────────────────────
export interface Vocabulary { engine: string; templates: string[]; options: string[]; steps: string[] }
export const STEP_IDS = ['primary', 'follow_up', 'words', 'capture_domain', 'capture_orientation', 'timeframe', 'thread_offer'];
export function buildVocabulary(engine: string): Vocabulary {
  const opts = new Set<string>();
  for (const t of TEMPLATES) { for (const o of t.options) opts.add(o.id); for (const o of t.followUp?.options ?? []) opts.add(o.id); }
  for (const d of DOMAINS) for (const o of LENS_OPTIONS(d)) opts.add(o.id);
  for (const id of ['settled', 'mostly', 'not_yet']) opts.add(id);        // the resolution frame (contracts.ts primaryOptions)
  return { engine, templates: TEMPLATES.map((t) => t.id).sort(), options: [...opts].sort(), steps: [...STEP_IDS].sort() };
}

// ─── whitelist validation (mirrored 1:1 by inner_rep_validate_event in docs/proposed/option-b/001) ─────────────────────
export type Verdict = { ok: true } | { ok: false; reason: string };
const ID = /^[a-z][a-z0-9_]{0,47}$/;
const ENGINE = /^v\d+\.\d+\.\d+(-[a-z0-9]+(-[a-z0-9]+)*)?$/;
const realDate = (v: unknown): boolean => { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false; const [y, m, d] = v.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; };
const bad = (reason: string): Verdict => ({ ok: false, reason });
const onlyKeys = (o: object, keys: string[]) => Object.keys(o).every((k) => keys.includes(k));

export function validateAnswer(a: unknown, v?: Vocabulary): Verdict {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return bad('answer must be an object');
  const x = a as Record<string, unknown>;
  if (!onlyKeys(x, ['s', 'k', 'o', 'd', 'tf', 'date'])) return bad('answer has a key outside the whitelist');
  if (typeof x.s !== 'string' || !ID.test(x.s) || (v && !v.steps.includes(x.s))) return bad('unknown step id');
  if (!ANSWER_KINDS.includes(x.k as AnswerKind)) return bad('unknown answer kind');
  const k = x.k as AnswerKind;
  const need = k === 'option' ? ['o'] : k === 'domain' ? ['d'] : k === 'timeframe' ? ['tf'] : [];
  for (const key of need) if (x[key] === undefined) return bad(`${k} requires ${key}`);
  for (const key of ['o', 'd', 'tf', 'date']) if (x[key] !== undefined && !need.includes(key) && !(key === 'date' && k === 'timeframe')) return bad(`${key} is not allowed for ${k}`);
  if (x.o !== undefined && (typeof x.o !== 'string' || !ID.test(x.o) || (v && !v.options.includes(x.o)))) return bad('unknown option id');
  if (x.d !== undefined && !DOMAINS.includes(x.d as Domain)) return bad('unknown domain');
  if (x.tf !== undefined && !TIMEFRAMES.includes(x.tf as Timeframe)) return bad('unknown timeframe');
  if (x.date !== undefined && (x.tf !== 'specific_date' || !realDate(x.date))) return bad('date is only valid with specific_date and must be a real calendar date');
  if (x.tf === 'specific_date' && x.date === undefined) return bad('specific_date requires a date');
  return { ok: true };
}

export function validateEvent(e: unknown, v?: Vocabulary): Verdict {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return bad('event must be an object');
  const x = e as Record<string, unknown>;
  if (!KINDS.includes(x.kind as BackupKind)) return bad('unknown kind');
  if (!realDate(x.day)) return bad('day must be a real calendar date (no time of day)');
  if (typeof x.engine !== 'string' || !ENGINE.test(x.engine) || (v && v.engine !== x.engine)) return bad('engine version missing or not the catalog version');
  const tmpl = (): Verdict => (typeof x.template === 'string' && ID.test(x.template) && (!v || v.templates.includes(x.template)) ? { ok: true } : bad('unknown template id'));
  switch (x.kind) {
    case 'rep_completed': {
      if (!onlyKeys(x, ['kind', 'day', 'engine', 'template', 'frame', 'bound', 'variant', 'answers'])) return bad('key outside the whitelist');
      const t = tmpl(); if (!t.ok) return t;
      if (!FRAMES.includes(x.frame as Frame)) return bad('unknown frame');
      if (x.bound !== undefined && !DOMAINS.includes(x.bound as Domain)) return bad('unknown domain');
      if (x.variant !== undefined && (!Number.isInteger(x.variant) || (x.variant as number) < 0 || (x.variant as number) > 9)) return bad('variant out of range');
      if (!Array.isArray(x.answers) || x.answers.length < 1 || x.answers.length > MAX_ANSWERS) return bad(`answers must have 1 to ${MAX_ANSWERS} entries`);
      for (const a of x.answers) { const r = validateAnswer(a, v); if (!r.ok) return r; }
      return { ok: true };
    }
    case 'rep_abandoned': { if (!onlyKeys(x, ['kind', 'day', 'engine', 'template'])) return bad('key outside the whitelist'); return tmpl(); }
    case 'feedback': {
      if (!onlyKeys(x, ['kind', 'day', 'engine', 'insightDay', 'value'])) return bad('key outside the whitelist');
      if (!realDate(x.insightDay) || (x.insightDay as string) > (x.day as string)) return bad('insightDay must be a real date not after day');
      return FEEDBACK_VALUES.includes(x.value as FeedbackValue) ? { ok: true } : bad('unknown feedback value');
    }
    case 'correction': {
      if (!onlyKeys(x, ['kind', 'day', 'engine', 'insightDay', 'reason'])) return bad('key outside the whitelist');
      if (!realDate(x.insightDay) || (x.insightDay as string) > (x.day as string)) return bad('insightDay must be a real date not after day');
      return CORRECTION_IDS.includes(x.reason as string) ? { ok: true } : bad('unknown correction reason');
    }
  }
  return bad('unreachable');
}
