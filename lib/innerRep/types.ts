// ─── Inner Rep: types ─────────────────────────────────────────────────────────
// Spec §10 schema. The six capacities map 1:1 onto the legacy theme codes so
// old data stays interpretable (IAP/EWB/FAF/RC/GAL/RA), but they are things to
// EXERCISE, not scores to optimise.

export type Capacity = 'direction' | 'energy' | 'focus' | 'relationships' | 'growth' | 'action';

export const LEGACY_THEME_FOR_CAPACITY: Record<Capacity, 'IAP' | 'EWB' | 'FAF' | 'RC' | 'GAL' | 'RA'> = {
  direction: 'IAP', energy: 'EWB', focus: 'FAF', relationships: 'RC', growth: 'GAL', action: 'RA',
};

export type InteractionType =
  | 'choice'                  // pick one
  | 'choice_then_reflection'  // pick one, then one follow-up pick
  | 'compare'                 // which of two statements is more true today
  | 'words'                   // answer in a few words (always skippable)
  | 'acknowledge';            // "nothing needs attention" vs "something is there"

export type Intensity = 'light' | 'medium' | 'deep';
export type Sensitivity = 'low' | 'medium' | 'high';

export interface RepOption {
  id: string;
  label: string;
  /** Evidence key + tag, e.g. key 'drain_source', tag 'work'. Used only for
   *  counting what the user actually selected — never for scoring them. */
  key?: string;
  tag?: string;
  /** True if choosing this means the user carried a burden today (used only
   *  to let the engine offer a lighter rep next — not to judge the answer). */
  burden?: boolean;
}

export interface Exercise {
  id: string;
  capacity: Capacity;
  sub_capacity: string;
  mechanism: string;
  interaction_type: InteractionType;
  intensity: Intensity;
  requires_history: boolean;
  minimum_history: number;           // completed reps needed before this can appear
  repetition_window: number;         // don't repeat within this many reps
  follow_up_possible: boolean;
  follow_up_type?: 'choice';
  bias_risk: 'low' | 'medium' | 'high';
  sensitivity: Sensitivity;
  positive_state_compatible: boolean;
  action_oriented: boolean;
  reflection_oriented: boolean;
  estimated_duration: number;        // seconds
  tags: string[];

  // ── Content ──
  prompt: string;
  options?: RepOption[];             // choice / choice_then_reflection / acknowledge
  statements?: [RepOption, RepOption]; // compare
  follow_up?: { prompt: string; options: RepOption[] };
  words_max?: number;                // words
  /** What to say when the exercise itself is the whole point (no insight). */
  closing?: string;
}

export interface RepAnswer {
  /** option id chosen on the main step, if any */
  primary?: string;
  followUp?: string;
  /** free text — only kept if it passed the safety check */
  words?: string;
  /** user chose "I don't know" / skipped */
  unknown: boolean;
}

export interface RepRecord {
  id?: string;
  exerciseId: string;
  capacity: Capacity;
  subCapacity: string;
  interactionType: InteractionType;
  intensity: Intensity;
  answer: RepAnswer;
  completedAt: string; // ISO
  safetyShown?: boolean;
  insight?: Insight | null;
  insightFeedback?: 'accurate' | 'partly' | 'no' | 'unsure' | null;
}

// ─── Truth architecture (spec §13) ────────────────────────────────────────────
export type InsightKind = 'observation' | 'pattern' | 'contradiction' | 'hypothesis' | 'unknown';
export interface Insight {
  kind: InsightKind;
  text: string;
  evidence: { count: number; of: number; windowDays: number };
}
