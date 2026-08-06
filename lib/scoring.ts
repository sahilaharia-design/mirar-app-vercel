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

// ─── Get current day number (1–28) from cycle start ──────────────────────────
export function getCycleDay(cycleStartDate: string): number {
  const start = new Date(cycleStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), 28);
}

// ─── Get elapsed day since cycle start, unclamped ─────────────────────────────
// Unlike getCycleDay, this keeps counting past 28 so stage windows that have
// fully passed (including stage 4 / day 29+) can be detected for report generation.
export function getElapsedCycleDay(cycleStartDate: string): number {
  const start = new Date(cycleStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(diffDays + 1, 1);
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

// ─── Compute streak from response day_numbers ─────────────────────────────────
// Returns count of consecutive days with at least one response, counting back
// from currentDay. A gap of 1 day (yesterday missed) resets the streak.
export function computeStreak(
  responses: ResponseRow[],
  currentDay: number
): number {
  if (responses.length === 0) return 0;
  const daysWithResponse = new Set(responses.map((r) => r.day_number));
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (daysWithResponse.has(d)) {
      streak++;
    } else {
      break;
    }
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
