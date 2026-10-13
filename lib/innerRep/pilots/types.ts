// ─── Exercise pilots: shared contract (v1) ────────────────────────────────────
// PURE TypeScript: no React Native, no Supabase, no engine import. The frozen engine
// (lib/innerRep/v2, tag inner-rep-engine-v2.0.1-correction-fix) is neither read nor modified by this module.
// A pilot is an optional, user-chosen extra practice. It is never selected by the engine, never changes engine
// evidence, and never creates an engine commitment (see PILOT_CAPS).
//
// PRIVACY: the contract has no text field. A words step carries only a character count. Typed text lives in the
// presentation layer's memory for the duration of one screen and is discarded; it is not an input to any function here.

export type PilotId = 'look_again' | 'attend';
export const PILOT_SCHEMA = 1 as const;

/** Capabilities that need an approved engine amendment. All false until approved (docs/product/PILOT_CONTRACTS.md §Amendments). */
export interface PilotCaps { commitments: boolean; engineEvidence: boolean; durableHistory: boolean }
export const PILOT_CAPS: PilotCaps = { commitments: false, engineEvidence: false, durableHistory: false };

export interface POption { id: string; label: string; /** present = not selectable, and why (shown to the user) */ disabled?: string }

export type PStep =
  | { id: string; type: 'choice'; prompt: string; options: POption[]; allowUnknown: boolean; allowBack: boolean }
  | { id: string; type: 'multi'; prompt: string; options: POption[]; max: number; noneLabel: string; allowUnknown: boolean; allowBack: boolean }
  | { id: string; type: 'words'; prompt: string; maxChars: number; optional: true; saved: false; sessionOnly: true; allowBack: boolean }
  | { id: string; type: 'hold'; prompt: string; endLabel: string; allowBack: false };

export type PAnswer =
  | { stepId: string; kind: 'option'; optionId: string }
  | { stepId: string; kind: 'options'; optionIds: string[] }   // empty = the explicit "none of these"
  | { stepId: string; kind: 'unknown' }
  | { stepId: string; kind: 'skip' }
  | { stepId: string; kind: 'words'; chars: number }
  | { stepId: string; kind: 'safety' }                          // the presentation layer's crisis-language check fired
  | { stepId: string; kind: 'hold_end' };

export class PilotAnswerError extends Error { constructor(m: string) { super(m); this.name = 'PilotAnswerError'; } }

/** The five-question quality standard every Inner Rep (engine or pilot) is held to. All strings are derived from the record. */
export interface RepValue {
  /** 1. What the person actually practised: only operations they performed */
  practised: string[];
  /** 2. What could be useful before they leave: a structural fact about what they now have, never an insight */
  usefulNow: string;
  /** 3. What the interaction genuinely established: the person's own choices, exact authored labels */
  established: string[];
  /** 4. What remains unknown */
  unknown: string[];
  /** 5a. What is carried forward, and 5b. what deliberately is not */
  carriedForward: string[];
  notCarried: string[];
}

export type PilotStatus = 'completed' | 'left';
export interface PilotRecordBase { id: number; schema: typeof PILOT_SCHEMA; pilot: PilotId; date: string; status: PilotStatus; /** the step the person was on if they left */ leftAt?: string; stepsSeen: number }

// ─── Look Again facts ─────────────────────────────────────────────────────────
export type Camera = 'yes' | 'partly' | 'no' | 'unknown';
export type Weight = 'certain' | 'likely' | 'one_possibility' | 'cant_tell' | 'unknown';
export type Reweigh = 'more_certain' | 'same' | 'less_certain' | 'cant_tell' | 'unknown';
export type Valence = 'neutral' | 'less_charitable' | 'more_charitable' | 'uncertain';
export interface LookAgainFacts {
  situation: string | 'unknown';
  observation: 'written' | 'none';
  cameraChecks: Camera[];
  retried: boolean;
  interpretation: { id: string; focus: 'about_them' | 'about_me' | 'about_next' } | 'none_yet' | 'unknown' | null;
  weightBefore: Weight | null;
  alternativesOffered: number;
  alternativesChosen: string[];
  valencesChosen: Valence[];
  reweigh: Reweigh | null;
  exit: 'nothing' | 'leave_open' | 'find_out' | 'unspecified' | null;
}
export interface LookAgainRecord extends PilotRecordBase { pilot: 'look_again'; facts: LookAgainFacts }

// ─── Attend facts ─────────────────────────────────────────────────────────────
export type Disposition = 'attend_now' | 'set_aside' | 'leave_open' | 'let_be' | 'unknown';
export type SetAsideWhen = 'later_today' | 'another_day' | 'no_time_set';
export interface AttendFacts {
  pulls: string[];
  outcome: 'arranged' | 'nothing_pulling' | 'could_not_name' | null;
  carriedIn: { pull: string; fromRecord: number; response: 'still_pulling' | 'not_now' | 'unknown' }[];
  dispositions: { pull: string; disposition: Disposition; when?: SetAsideWhen }[];
  attendNow: string | null;
  /** the pull that was offered the hold (the attend-now item at that moment; it can differ from the final one after a rearrange) */
  holdOn: string | null;
  hold: 'ended' | 'after' | 'skipped' | 'left_during' | null;
  sit: 'settled' | 'mixed' | 'still_pulling' | 'unknown' | null;
  rearranged: boolean;
}
export interface AttendRecord extends PilotRecordBase { pilot: 'attend'; facts: AttendFacts }

export type PilotRecord = LookAgainRecord | AttendRecord;

/** Read-model context a pilot needs from prior stored records (never from the engine). */
export interface PilotContext { today: string; caps: PilotCaps; prior: PilotRecord[] }
