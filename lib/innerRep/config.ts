// ─── Inner Rep: behavioural thresholds (PROVISIONAL) ──────────────────────────
// Every number that shapes what Mirar serves or claims lives here, with the
// reason it exists. None of these are findings about people. They are starting
// guesses, chosen to be conservative, and are expected to change once real
// usage and the founder's review say otherwise. Change a value here, not in
// engine.ts / evidence.ts. Rationale is repeated in docs/ENGINE_REVIEW.md.

export interface EngineConfig {
  /** Selection weights. Positive = more likely to be served. */
  weights: {
    /** Capacity never practised before. Why: early reps should cover ground
     *  so the first week isn't one theme. Only a nudge, never a rule. */
    capacityFresh: number;
    /** Same capacity as the last rep, when nothing makes it relevant.
     *  Why: mild preference against monotony. Deliberately SMALL — variety is
     *  not a goal; relevance (below) overrides it. */
    capacitySameAsLast: number;
    /** Capacity last seen 3 and 4+ reps ago (slight bonus for being rested). */
    capacityRested3: number;
    capacityRested4plus: number;
    /** Same interaction format as last / two reps ago. Why: same tap-pattern
     *  daily feels like a form, which erodes attention. */
    formatSameAsLast: number;
    formatSameTwoBack: number;
    /** 3 of the last 4 reps used this format. */
    formatSaturated: number;
    /** After a heavier rep, prefer a light one. */
    lighterAfterHeavier: number;
    /** Medium rep when nothing recent was heavy (keeps depth available). */
    mediumWhenFresh: number;
    /** Deep reps before enough history exist. Effectively a gate. */
    deepTooEarly: number;
    /** After a burden / "I don't know" run, gentle + positive-compatible reps. */
    easeGentle: number;
    easeSensitivePenalty: number;
    easeActionPenalty: number;
    /** Keep some positive reps in the mix when none appeared recently. */
    positiveMix: number;
    /** Cold start: favour the configured first rep; discourage "nothing". */
    coldStartPreferred: number;
    coldStartNeutralPenalty: number;
    /** Open follow-through commitment, revisited. */
    followThroughRevisit: number;
    /** Relevance: the recent days point at this capacity (see `relevance`). */
    continuation: number;
  };

  /** "Ease" mode: when to go gentle. */
  ease: {
    /** consecutive latest reps answered "I don't know" that trigger ease. */
    unknownRunLength: number;
  };

  /** Windows used by the format / intensity / positive rules. */
  windows: {
    formatLookback: number;        // reps considered for format saturation
    formatSaturationCount: number; // of those, this many same-format = saturated
    intensityLookback: number;     // reps considered for "recently heavier"
    positiveLookback: number;      // reps considered for "any positive lately"
    deepMinHistory: number;        // completed reps before a deep rep is possible
    coldStartReps: number;         // below this many reps, cold-start rules apply
  };

  /** RELEVANCE can override rotation. A capacity stays "the thing worth looking
   *  at" when recent reps carried a burden in it. */
  relevance: {
    /** how far back (days) a rep counts as "recent" for continuation */
    recentDays: number;
    /** burden reps in the same capacity within recentDays needed to continue */
    minBurdenReps: number;
    /** Hard ceiling so a rut can't run forever: after this many consecutive
     *  reps in one capacity, continuation stops adding weight. */
    maxConsecutiveSameCapacity: number;
  };

  /** Follow-through (commitments). PROVISIONAL — the current model has no
   *  stored commitment or timeframe, so this is a placeholder for it. */
  followThrough: {
    exerciseId: string;
    /** answer ids that mean "something is open" */
    openAnswerIds: string[];
    /** answer ids that close it by choice (not by failure) */
    closedByChoiceAnswerIds: string[];
    /** days before an open item may be asked about again. Single default only
     *  because no timeframe is stored yet; see docs/ENGINE_REVIEW.md §8. */
    minDaysBeforeResurface: number;
    /** Home continuity cue is dropped for items older than this. */
    cueMaxAgeDays: number;
  };

  /** First rep for a new user. */
  coldStart: { preferredExerciseId: string; neutralExerciseId: string };

  /** "Nothing needs examining today" as a legitimate engine outcome. */
  rest: {
    /** OFF by default: the architecture supports a no-rep decision, but the
     *  UX and the trigger have not been reviewed. */
    enabled: boolean;
    /** latest reps with no burden, no open commitment, no continuation */
    calmRunLength: number;
  };

  /** Tie-break jitter, as a fraction of 1 point. Deterministic per day. */
  jitterMax: number;
}

export interface EvidenceConfig {
  /** Rolling window used for every count. */
  windowDays: number;
  pattern: {
    /** comparable reps needed before any pattern claim */
    minComparable: number;
    /** of those, this many the same */
    minCount: number;
    /** and at least this share. Why: 3-of-4 is the smallest sample where
     *  "again" isn't a coincidence of two; 60% blocks 3-of-9 claims. */
    minShare: number;
  };
  /** "Seen twice/three times, too early to call it a pattern" lower bound. */
  early: { minComparable: number };
  /** Unknown run that earns a gentle observation. */
  unknownRun: number;
  /** Continuity cue. */
  cue: { recentLookback: number; minRecent: number; minSameCapacity: number };
}

export const ENGINE_CONFIG: EngineConfig = {
  weights: {
    capacityFresh: 4,
    capacitySameAsLast: -2,
    capacityRested3: 1,
    capacityRested4plus: 2,
    formatSameAsLast: -3,
    formatSameTwoBack: -1,
    formatSaturated: -2,
    lighterAfterHeavier: 2,
    mediumWhenFresh: 1,
    deepTooEarly: -10,
    easeGentle: 3,
    easeSensitivePenalty: -2,
    easeActionPenalty: -1,
    positiveMix: 2,
    coldStartPreferred: 3,
    coldStartNeutralPenalty: -4,
    followThroughRevisit: 5,
    continuation: 6,
  },
  ease: { unknownRunLength: 2 },
  windows: {
    formatLookback: 4,
    formatSaturationCount: 3,
    intensityLookback: 2,
    positiveLookback: 5,
    deepMinHistory: 10,
    coldStartReps: 3,
  },
  relevance: { recentDays: 3, minBurdenReps: 2, maxConsecutiveSameCapacity: 4 },
  followThrough: {
    exerciseId: 'act_followthrough',
    openAnswerIds: ['yes'],
    closedByChoiceAnswerIds: ['changed_mind'],
    minDaysBeforeResurface: 3,
    cueMaxAgeDays: 14,
  },
  coldStart: { preferredExerciseId: 'foc_attention', neutralExerciseId: 'neutral_nothing' },
  rest: { enabled: false, calmRunLength: 4 },
  jitterMax: 0.1,
};

export const EVIDENCE_CONFIG: EvidenceConfig = {
  windowDays: 28,
  pattern: { minComparable: 4, minCount: 3, minShare: 0.6 },
  early: { minComparable: 2 },
  unknownRun: 3,
  cue: { recentLookback: 5, minRecent: 4, minSameCapacity: 3 },
};
