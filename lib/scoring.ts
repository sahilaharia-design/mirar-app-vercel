import { ThemeCode, ThemeStatus, AlignmentStatus, OptionRow, ResponseRow, ThemeScore } from '../types/mirar';
import { THEME_ORDER, THEMES, STATUS_THRESHOLDS, ALIGNMENT_THRESHOLDS } from './constants';

// ─── Determine status from numeric average ────────────────────────────────────
export function getThemeStatus(average: number | null, signalCount: number): ThemeStatus {
  if (average === null || signalCount === 0) return 'No Reading';
  for (const threshold of STATUS_THRESHOLDS) {
    if (average < threshold.max) return threshold.status;
  }
  return 'Aligned';
}

// ─── Compute theme scores from responses + options ───────────────────────────
export function computeThemeScores(
  responses: ResponseRow[],
  optionsMap: Record<string, OptionRow>
): ThemeScore[] {
  const accumulator: Record<
    ThemeCode,
    { points: number[]; low: number; medium: number; high: number }
  > = {} as any;

  for (const code of THEME_ORDER) {
    accumulator[code] = { points: [], low: 0, medium: 0, high: 0 };
  }

  for (const response of responses) {
    const option = optionsMap[response.option_id];
    if (!option) continue;

    // Theme 1
    const t1 = option.theme_1_code as ThemeCode;
    if (accumulator[t1]) {
      accumulator[t1].points.push(option.theme_1_points);
      if (option.theme_1_level === 'Low') accumulator[t1].low++;
      else if (option.theme_1_level === 'Medium') accumulator[t1].medium++;
      else accumulator[t1].high++;
    }

    // Theme 2
    const t2 = option.theme_2_code as ThemeCode;
    if (accumulator[t2]) {
      accumulator[t2].points.push(option.theme_2_points);
      if (option.theme_2_level === 'Low') accumulator[t2].low++;
      else if (option.theme_2_level === 'Medium') accumulator[t2].medium++;
      else accumulator[t2].high++;
    }
  }

  return THEME_ORDER.map((code) => {
    const acc = accumulator[code];
    const signalCount = acc.points.length;
    const average =
      signalCount > 0
        ? parseFloat(
            (acc.points.reduce((s, p) => s + p, 0) / signalCount).toFixed(2)
          )
        : null;
    return {
      code,
      // `name` is the raw English label from lib/constants.ts, kept only for
      // debugging/logging — it is NOT translated. Never render this field
      // directly; look up t(`themes.${code}`) instead (see ThemeSignalRow.tsx,
      // ThemeSignalMiniCard.tsx, StatusBadge.tsx for the established pattern).
      name: THEMES[code].name,
      status: getThemeStatus(average, signalCount),
      average,
      lowCount: acc.low,
      mediumCount: acc.medium,
      highCount: acc.high,
      signalCount,
    };
  });
}

// ─── Get current day number (1–28) from completed check-in count ─────────────
// HISTORY: this used to be calendar-elapsed — Math.floor/round((now - start)
// / 86400000) — which had two real bugs in production, both confirmed live:
//   1. Using a raw 24h rolling window (not a calendar-day boundary) meant a
//      user who checked in at 4:04 PM wouldn't "advance" to the next day
//      until 4:04 PM the next day — opening the app at 2:55 AM (a new
//      calendar day, under 24h later) still showed yesterday's check-in as
//      covering "today." Normalizing to local midnight before diffing fixed
//      this specific case.
//   2. The deeper issue that fix didn't touch: getCycleDay clamps at 28
//      (Math.min(diffDays + 1, 28)). Mirar is explicitly NOT a 28-day
//      program (see CLAUDE.md) — it's continuous, and a cycle only rolls
//      over once 28 real check-ins are completed, not once 28 calendar days
//      pass (see loadActiveCycle's rollover comment). So any user whose
//      calendar-elapsed days outran their actual check-in count — trivially
//      true for anyone who misses even a few days — would hit the day-28
//      ceiling and get stuck there PERMANENTLY: every day from then on
//      recomputes to the same clamped day_number 28, colliding with the
//      same existing response row forever, with no way to ever reach a new
//      day number again. Confirmed live: "the issue is there across the
//      board... on a new day instead of showing new check-in it shows
//      previous day" — every single day, not just once.
// Fix: day_number is now driven entirely by how many check-ins the user has
// actually completed this cycle, not by the calendar. It can never race
// ahead of real usage, never clamps into a collision, and naturally matches
// the product's own "continuous practice, not a calendar program" model —
// taking a break for a few days no longer costs you anything, you just pick
// up at the next number whenever you next check in.
export function getCycleDay(completedCount: number): number {
  return Math.min(Math.max(completedCount + 1, 1), 28);
}

// ─── Has the user already checked in today (real calendar day)? ──────────────
// This is a genuinely separate question from "what day_number is next" above
// — it's about calendar time (don't let someone submit twice in one real
// day), not about sequence. Compares submitted_at timestamps against local
// midnight, same normalization as the old calendar-boundary fix, but scoped
// to exactly what it's actually deciding: has anything been submitted since
// today started, not which day_number that submission happened to land on.
export function hasCheckedInToday(responses: { submitted_at: string }[], now: Date = new Date()): boolean {
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return responses.some((r) => {
    const submitted = new Date(r.submitted_at);
    const submittedMidnight = new Date(submitted.getFullYear(), submitted.getMonth(), submitted.getDate()).getTime();
    return submittedMidnight === todayMidnight;
  });
}

// ─── Get stage number from day ────────────────────────────────────────────────
export function getStageFromDay(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

// ─── Get day range for a stage ────────────────────────────────────────────────
export function getStageDayRange(stage: number): [number, number] {
  const ranges: Record<number, [number, number]> = {
    1: [1, 7],
    2: [8, 14],
    3: [15, 21],
    4: [22, 28],
  };
  return ranges[stage] ?? [1, 7];
}

// ─── Get coverage for a stage from responses ─────────────────────────────────
export function getStageCoverage(
  responses: ResponseRow[],
  stage: number
): number {
  const [start, end] = getStageDayRange(stage);
  return responses.filter((r) => r.day_number >= start && r.day_number <= end).length;
}

// ─── Compute Alignment Score (0–100) from rolling responses + options ────────
export function computeAlignmentScore(
  responses: ResponseRow[],
  optionsMap: Record<string, OptionRow>
): { score: number | null; status: AlignmentStatus } {
  const allPoints: number[] = [];

  for (const response of responses) {
    const option = optionsMap[response.option_id];
    if (!option) continue;
    allPoints.push(option.theme_1_points);
    allPoints.push(option.theme_2_points);
  }

  if (allPoints.length < 3) {
    return { score: null, status: 'Calibrating' };
  }

  const avg = allPoints.reduce((s, p) => s + p, 0) / allPoints.length;
  // Normalize 1.0–3.0 → 0–100
  const score = Math.round(Math.max(0, Math.min(100, ((avg - 1.0) / 2.0) * 100)));

  let status: AlignmentStatus = 'Aligned';
  for (const t of ALIGNMENT_THRESHOLDS) {
    if (score < t.max) {
      status = t.status;
      break;
    }
  }

  return { score, status };
}

// ─── Compute per-theme daily averages for last N days ─────────────────────────
// Returns 7 (or windowDays) data points per theme.
// day_number is used for grouping since responses are cycle-relative.
// Null = no response that day → renders as a gap in the sparkline.
export function computeThemeHistories(
  responses: ResponseRow[],
  optionsMap: Record<string, OptionRow>,
  currentDay: number,
  windowDays = 7
): Record<ThemeCode, { day: number; average: number | null }[]> {
  const startDay = Math.max(1, currentDay - windowDays + 1);

  // Build accumulator: day → theme → points[]
  const acc: Record<number, Record<ThemeCode, number[]>> = {};
  for (let d = startDay; d <= currentDay; d++) {
    acc[d] = { IAP: [], EWB: [], FAF: [], RC: [], GAL: [], RA: [] };
  }

  for (const response of responses) {
    const day = response.day_number;
    if (day < startDay || day > currentDay) continue;
    const opt = optionsMap[response.option_id];
    if (!opt) continue;

    const t1 = opt.theme_1_code as ThemeCode;
    const t2 = opt.theme_2_code as ThemeCode;
    if (acc[day]?.[t1]) acc[day][t1].push(opt.theme_1_points);
    if (acc[day]?.[t2]) acc[day][t2].push(opt.theme_2_points);
  }

  const themeCodes: ThemeCode[] = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'];
  const result: Record<ThemeCode, { day: number; average: number | null }[]> = {} as any;

  for (const code of themeCodes) {
    result[code] = [];
    for (let d = startDay; d <= currentDay; d++) {
      const pts = acc[d]?.[code] ?? [];
      const average =
        pts.length > 0
          ? parseFloat((pts.reduce((s, p) => s + p, 0) / pts.length).toFixed(2))
          : null;
      result[code].push({ day: d, average });
    }
  }

  return result;
}

// ─── Compute streak from response submission dates ────────────────────────────
// HISTORY: this used to count back through day_number (currentDay, currentDay-1,
// ...) looking for gaps. That only worked while day_number tracked calendar
// days. Now that getCycleDay derives day_number purely from completed-checkin
// COUNT, day_number is always contiguous (1, 2, 3, ...) by construction —
// there can never be a "gap" in it to detect, so counting backward through it
// would always just return responses.length regardless of whether the user
// actually checked in every real day. A streak is inherently a calendar
// concept ("did I show up every day"), so it's computed here the same way
// hasCheckedInToday is — directly off submitted_at calendar dates — fully
// decoupled from day_number/count sequencing.
// Counts backward from today; if today has no check-in yet, starts from
// yesterday instead so an in-progress streak doesn't read as 0 before the
// user has had a chance to check in today.
export function computeStreak(
  responses: { submitted_at: string }[],
  now: Date = new Date()
): number {
  if (responses.length === 0) return 0;

  const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const datesWithResponse = new Set(responses.map((r) => dateKey(new Date(r.submitted_at))));

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!datesWithResponse.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (datesWithResponse.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ─── Generate mirar_id ────────────────────────────────────────────────────────
export function generateMirarId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
