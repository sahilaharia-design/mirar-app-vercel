import { ResponseRow, OptionRow, ThemeCode } from '../types/mirar';
import { THEME_ORDER, THEMES } from './constants';
import { computeThemeScores, getThemeStatus } from './scoring';

// ─── Milestone Reflections ─────────────────────────────────────────────────────
// unlock_events already exists (migration 005) and check-unlocks already
// writes a row here on every check-in — this module is the missing piece:
// what to actually SAY when one of those is shown. Deliberately the opposite
// of a badge/trophy: no "Achievement Unlocked," no icon, no share button —
// just a short, honest reflection grounded in the user's own data, in the
// same "signal, not verdict" register as the AI Mirror synthesis. This is
// the intentional alternative to competitive gamification (see CLAUDE.md's
// explicit "no gamification, no streaks for competition" — the engagement
// mechanic here is curiosity about your own pattern, not a scoreboard).
//
// Ordered least → most advanced, matching UNLOCK_SEQUENCE in the
// check-unlocks edge function exactly (kept in sync manually — Deno runtime
// there can't import this file).
export const MILESTONE_ORDER = [
  'micro_pattern_day3',
  'weekly_signal_day7',
  'pattern_depth_day14',
  'mirror_profile_cycle1',
  'signal_recurrence_cycle3',
  'drift_awareness_cycle6',
  'annual_arc_cycle13',
] as const;

export type MilestoneKey = (typeof MILESTONE_ORDER)[number];

interface MilestoneCopy {
  title: string;
  /** Used only when computeThemeShift can't find a meaningful shift for this user yet. */
  fallbackBody: string;
}

const MILESTONE_COPY: Record<MilestoneKey, MilestoneCopy> = {
  micro_pattern_day3: {
    title: 'Three check-ins in.',
    fallbackBody: 'Not enough yet to say much — but a signal has started to form.',
  },
  weekly_signal_day7: {
    title: 'Seven check-ins in.',
    fallbackBody: 'A week of showing up. That’s the whole practice — nothing more required.',
  },
  pattern_depth_day14: {
    title: 'Fourteen check-ins in.',
    fallbackBody: 'Two weeks of signal now exist. Mirar is starting to notice what repeats.',
  },
  mirror_profile_cycle1: {
    title: 'One full cycle. Twenty-eight check-ins in.',
    fallbackBody: 'A real signal history now exists — this is where the mirror gets sharper.',
  },
  signal_recurrence_cycle3: {
    title: 'Three cycles in.',
    fallbackBody: 'Patterns are starting to repeat. That’s how signal gets told apart from noise.',
  },
  drift_awareness_cycle6: {
    title: 'Six cycles in.',
    fallbackBody: 'This is where drift becomes visible — not in any single day, but across all of them.',
  },
  annual_arc_cycle13: {
    title: 'Thirteen cycles in — roughly a year.',
    fallbackBody: 'The full arc is visible now. Most people never get to see their own pattern over a year. You can.',
  },
};

export function getMilestoneCopy(key: string): MilestoneCopy | null {
  return MILESTONE_COPY[key as MilestoneKey] ?? null;
}

// ─── Theme-shift insight ────────────────────────────────────────────────────
// Splits the user's responses (chronological) into an early half and a
// recent half, scores each with the same computeThemeScores/getThemeStatus
// used everywhere else in the app, and surfaces the single theme with the
// clearest movement between the two — using the app's own existing status
// vocabulary (Under Load / Stabilizing / Forming / Aligned), not a new one.
// Returns null when there isn't enough signal yet in both halves for any
// theme to say something honest — the caller falls back to presence-only
// copy rather than a fabricated insight.
export function computeMilestoneInsight(
  responses: ResponseRow[],
  optionsMap: Record<string, OptionRow>
): { themeCode: ThemeCode; fromStatus: string; toStatus: string } | null {
  if (responses.length < 6) return null;

  const sorted = [...responses].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );
  const mid = Math.floor(sorted.length / 2);
  const early = sorted.slice(0, mid);
  const recent = sorted.slice(mid);

  const earlyScores = computeThemeScores(early, optionsMap);
  const recentScores = computeThemeScores(recent, optionsMap);

  let best: { code: ThemeCode; diff: number; from: number; to: number; fromCount: number; toCount: number } | null = null;

  for (const code of THEME_ORDER) {
    const e = earlyScores.find((s) => s.code === code);
    const r = recentScores.find((s) => s.code === code);
    if (!e || !r || e.average === null || r.average === null) continue;
    // Require real signal on both sides — a theme with 1 stray data point in
    // one half shouldn't drive the headline.
    if (e.signalCount < 2 || r.signalCount < 2) continue;
    const diff = Math.abs(r.average - e.average);
    if (diff < 0.4) continue; // too small to be worth saying
    if (!best || diff > best.diff) {
      best = { code, diff, from: e.average, to: r.average, fromCount: e.signalCount, toCount: r.signalCount };
    }
  }

  if (!best) return null;

  return {
    themeCode: best.code,
    fromStatus: getThemeStatus(best.from, best.fromCount),
    toStatus: getThemeStatus(best.to, best.toCount),
  };
}

export function themeDisplayName(code: ThemeCode): string {
  return THEMES[code]?.name ?? code;
}
