import { OptionRow, ResponseRow, ThemeCode } from '../types/mirar';

// ─── Everyday layer ───────────────────────────────────────────────────────────
// The scoring engine underneath still speaks in six themes and Low/Medium/High
// points — that doesn't change. This file is the layer that turns it into
// something a person actually says: plain areas of life, plain this-or-that
// pairs, one number for the week, and one counted sentence. Nothing here
// touches the backend; it only reads responses + options already loaded.

export interface AreaCopy {
  /** Short everyday name of the area */
  name: string;
  /** The one question asked on the check-in */
  question: string;
  /** Left (low) and right (high) pole words */
  left: string;
  right: string;
}

export const EVERYDAY_AREAS: Record<ThemeCode, AreaCopy> = {
  EWB: { name: 'Energy', question: "How's your energy today?", left: 'Drained', right: 'Charged' },
  FAF: { name: 'Focus', question: 'How does your mind feel today?', left: 'Scattered', right: 'Clear' },
  RC: { name: 'People', question: 'How do people feel today?', left: 'Distant', right: 'Close' },
  RA: { name: 'Getting things done', question: 'How is getting things done today?', left: 'Stuck', right: 'Moving' },
  IAP: { name: 'Feeling like yourself', question: 'How much like yourself do you feel today?', left: 'Off', right: 'Myself' },
  GAL: { name: 'Openness', question: 'How open are you to new things today?', left: 'Closed', right: 'Curious' },
};

export type Choice = 'left' | 'middle' | 'right';

/**
 * left / middle / right → the lowest, middle and highest option by combined
 * points (same ranking the seed_v4 migration uses for option_number). Ranking
 * by points rather than trusting option_number means this stays right even
 * for a question whose numbering was never reordered.
 */
export function optionByChoice<T extends Pick<OptionRow, 'id' | 'theme_1_points' | 'theme_2_points'>>(
  options: T[],
  choice: Choice
): T | undefined {
  if (options.length === 0) return undefined;
  const ranked = [...options].sort(
    (a, b) =>
      a.theme_1_points + a.theme_2_points - (b.theme_1_points + b.theme_2_points) ||
      a.theme_1_points - b.theme_1_points ||
      (a.id < b.id ? -1 : 1)
  );
  if (choice === 'left') return ranked[0];
  if (choice === 'right') return ranked[ranked.length - 1];
  return ranked[Math.floor((ranked.length - 1) / 2)];
}

// ─── Scores ───────────────────────────────────────────────────────────────────
/** One answer → 0–100. Combined points run 2..6, so (sum − 2) / 4. */
export function optionScore(opt: Pick<OptionRow, 'theme_1_points' | 'theme_2_points'>): number {
  const sum = (opt.theme_1_points ?? 2) + (opt.theme_2_points ?? 2);
  return Math.round(((sum - 2) / 4) * 100);
}

export function scoreWord(score: number): 'Rough' | 'Low' | 'Okay' | 'Good' | 'Great' {
  if (score < 20) return 'Rough';
  if (score < 40) return 'Low';
  if (score < 60) return 'Okay';
  if (score < 80) return 'Good';
  return 'Great';
}

export interface DayScore {
  /** Local calendar date key, YYYY-MM-DD */
  date: string;
  score: number;
  theme: ThemeCode | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const localDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Average score per local calendar day, ascending, last `days` days only. */
export function buildDailyScores(
  responses: Pick<ResponseRow, 'option_id' | 'submitted_at'>[],
  optionsMap: Record<string, OptionRow>,
  now: Date = new Date(),
  days = 14
): DayScore[] {
  const byDay = new Map<string, { total: number; count: number; theme: ThemeCode | null }>();
  for (const r of responses) {
    const opt = optionsMap[r.option_id];
    if (!opt) continue;
    const key = localDateKey(new Date(r.submitted_at));
    const cur = byDay.get(key) ?? { total: 0, count: 0, theme: opt.theme_1_code as ThemeCode };
    cur.total += optionScore(opt);
    cur.count += 1;
    byDay.set(key, cur);
  }
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const cutoffKey = localDateKey(cutoff);
  return [...byDay.entries()]
    .filter(([key]) => key >= cutoffKey)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, score: Math.round(v.total / v.count), theme: v.theme }));
}

function windowAverage(scores: DayScore[], endKey: string, span = 7): number | null {
  const end = new Date(endKey + 'T00:00:00');
  const startKey = localDateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - (span - 1)));
  const inWindow = scores.filter((s) => s.date >= startKey && s.date <= endKey);
  if (inWindow.length === 0) return null;
  return Math.round(inWindow.reduce((a, s) => a + s.score, 0) / inWindow.length);
}

/** "Your week": mean of the days checked in over the last 7 calendar days. */
export function weekAverage(scores: DayScore[], now: Date = new Date()): number | null {
  return windowAverage(scores, localDateKey(now));
}

/** Change in the week number since yesterday's — null until both exist. */
export function weekDelta(scores: DayScore[], now: Date = new Date()): number | null {
  const today = weekAverage(scores, now);
  const yKey = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const yesterday = windowAverage(scores, yKey);
  if (today === null || yesterday === null) return null;
  return today - yesterday;
}

/** The last 7 calendar days, oldest first; score null where no check-in. */
export function weekStrip(
  scores: DayScore[],
  now: Date = new Date()
): { date: string; score: number | null; letter: string }[] {
  const out: { date: string; score: number | null; letter: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = localDateKey(d);
    out.push({
      date: key,
      score: scores.find((s) => s.date === key)?.score ?? null,
      letter: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
    });
  }
  return out;
}

// ─── The one counted sentence ─────────────────────────────────────────────────
// Rule: never a mood word without a number. Deterministic, from the user's own
// last 7 days. If nothing countable is true, return null — silence beats filler.
// Never advice.
export function specificLine(scores: DayScore[], now: Date = new Date()): string | null {
  const todayKey = localDateKey(now);
  const startKey = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const last7 = scores.filter((s) => s.date >= startKey && s.date <= todayKey);
  if (last7.length < 3) return null;

  const low = last7.filter((s) => s.score <= 25).length;
  if (low >= 3) return `${low} low days in the last 7.`;

  const tail = last7.slice(-3).map((s) => s.score);
  if (tail.length === 3 && tail[0] < tail[1] && tail[1] < tail[2]) return 'Up three days in a row.';

  const high = last7.filter((s) => s.score >= 75).length;
  if (high >= 4) return `${high} good days in the last 7.`;

  const current = weekAverage(scores, now);
  if (current !== null && scores.length >= 10) {
    const earlier = scores.filter((s) => s.date < startKey);
    const prior = earlier.length ? Math.max(...earlier.map((_, i) => windowAverage(earlier, earlier[i].date) ?? 0)) : null;
    if (prior !== null && current > prior) return 'Your best week so far.';
  }
  return null;
}
