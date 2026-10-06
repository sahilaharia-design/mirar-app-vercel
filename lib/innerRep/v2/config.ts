// ─── Inner Rep v2: behavioural thresholds (PROVISIONAL) ───────────────────────
// Every number here is a design guess to be stress-tested by scripts/sim, not a
// finding about people. Change values here, never inline. "reps" = completed
// reps (not calendar days); "days" = calendar days.
export const V2 = {
  templateWindowReps: 10,       // same template+frame not within this many reps
  lensWindowReps: 5,            // same template, different binding
  budget: { lookbackReps: 5, cap: 2, maxConsecutive: 2 },  // ≤cap of last N reps may be continuity/context-driven; never more than maxConsecutive in a row (due commitments exempt)
  intensity: {
    maxNonLightRun: 2,          // after this many consecutive non-light reps, next must be light
    lightAfterBurden: true,
  },
  ease: { unknownRun: 2 },      // consecutive unknown/skipped reps → gentle + simple
  disengage: { window: 6, threshold: 0.5 },  // share of unknown/skip/not_this in last N answers → simplify, let threads rest
  gaps: { returnDays: 7, dormantDays: 30 },
  probe: { everyReps: 7, minBetweenReps: 4, firstAfterReps: 4, unexplainedBurden: { window: 6, minBurdenReps: 2 } },
  capture: { cooldownDays: 3 }, // don't ask "what's this connected to?" more often than this
  thread: {
    checkEveryReps: 3,          // gap between thread-bound reps
    maxPerWindow: 3, windowDays: 10,   // per-thread cap so one issue can't take over
    negStreakToRest: 2,         // consecutive "not this/not today" → let it rest
    unknownStreakToRest: 2,     // consecutive "unknown/skip" on thread asks → let it rest
    restDays: 14,
    staleDays: 14,              // unconfirmed this long → no more checks until the user raises it again
    offerCooldownDays: 21,
  },
  event: { askAtDays: [2, 7], expiresDays: 14 },
  commitment: {
    maxAsks: 2, askSpacingDays: 2, unconfirmedAfterDays: 2,
    noneRevisitDays: 14, maxNoneRevisits: 1,
    silentAfterAbsenceDays: 30, // returning after a long gap: past-due items lapse quietly, no guilt ask
    thisWeekDays: 6,
  },
  evidence: {
    windowDays: 28, activeDays: 21,
    repeated: { minIndependent: 3, minDistinctDays: 3, blockShareBelow: 0.4, blockMinOpportunities: 4, hedgedMinIndependent: 4 },
    convergence: { minCapacities: 2, minIndependent: 3 },
    change: { baselineMin: 8, recentMin: 4, minDelta: 0.4, recentDays: 7 },  // 4-vs-5 style comparisons were noise in simulation; raised
    contradiction: { windowDays: 14 },
    resolution: { minNegatives: 3 },
    active: { minIndependent: 2 },   // for Layer B "active domain"
    closedSetMax: 8,
  },
  feedback: {
    suppressDaysNo: 21, suppressDaysUnsure: 7, newEvidenceAfterNo: 2,
    tentativeModeWindow: 3, tentativeModeNo: 2, // ≥2 "No" in last 3 → tentative mode
  },
  insight: { cooldownDaysSameKey: 14, maxPer7Days: 2 },
  rest: {
    enabled: false,              // OFF in the app; the simulator turns it on
    minHistoryReps: 10, issueLookbackDays: 28, calmRun: 8, maxBurdenShare14: 0.15, minAnsweredShare: 0.7,
    minGapDays: 10, coverageWindowReps: 14, nothingWithinReps: 6, maxShareLast10: 0.1,
  },
  coldStartTemplate: 'foc_attention',
  uncertaintyMode: { raiseMinIndependentBy: 1 },
};
export type V2Config = typeof V2;
