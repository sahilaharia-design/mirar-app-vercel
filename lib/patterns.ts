// ─── Mirar Pattern Engine ──────────────────────────────────────────────────────
// Derives structured signals and patterns from the user's reflection history.
// Runs client-side over data the app already loads (responses + options), so
// patterns work offline-of-backend and in every language: the engine emits
// structured insights keyed by theme code; the UI translates them via i18n.
//
// Answers the four awareness questions:
//   How am I doing?        → overall tone (steady / mixed / under pressure)
//   What am I carrying?    → themes repeatedly showing Low
//   What is changing?      → week-over-week shifts per theme
//   What deserves attention? → single highest-priority insight
//
// Language rule: observation only. The engine names what repeats, shifts, or
// holds — it never advises, diagnoses, or prescribes.

import { ThemeCode, OptionRow, ResponseRow } from '../types/mirar';
import { THEME_ORDER } from './constants';

// ─── Structured signal: one theme reading from one reflection ─────────────────
export interface StructuredSignal {
  day: number;
  date: string;
  themeCode: ThemeCode;
  level: 'Low' | 'Medium' | 'High';
  points: number;
}

export type PatternKind =
  | 'recurring_tension' // theme Low in most recent readings — what you're carrying
  | 'shift_down'        // theme moved down week-over-week
  | 'shift_up'          // theme moved up week-over-week
  | 'steady'            // theme consistently High — a stable strength
  | 'growth'            // theme trending upward across the window
  | 'forming';          // not enough data yet

export interface PatternInsight {
  kind: PatternKind;
  themeCode: ThemeCode;
  /** 0–1 — how pronounced the pattern is; used for ordering, never shown raw */
  strength: number;
  /** number of readings backing this insight */
  evidenceCount: number;
}

export type OverallTone = 'steady' | 'mixed' | 'under_pressure' | 'forming';

export interface PatternReading {
  tone: OverallTone;
  /** the single insight most worth the user's attention, if any */
  attention: PatternInsight | null;
  carrying: PatternInsight[];   // recurring tensions
  shifts: PatternInsight[];     // what is changing (up and down)
  steady: PatternInsight[];     // what is holding
  growth: PatternInsight[];     // what is building
  daysObserved: number;
  hasEnoughData: boolean;
}

// ─── Flatten responses into structured signals ────────────────────────────────
export function extractSignals(
  responses: ResponseRow[],
  optionsMap: Record<string, OptionRow>
): StructuredSignal[] {
  const signals: StructuredSignal[] = [];
  for (const r of responses) {
    const opt = optionsMap[r.option_id];
    if (!opt) continue;
    const date = (r.submitted_at ?? '').split('T')[0];
    signals.push({
      day: r.day_number,
      date,
      themeCode: opt.theme_1_code as ThemeCode,
      level: opt.theme_1_level as StructuredSignal['level'],
      points: opt.theme_1_points,
    });
    signals.push({
      day: r.day_number,
      date,
      themeCode: opt.theme_2_code as ThemeCode,
      level: opt.theme_2_level as StructuredSignal['level'],
      points: opt.theme_2_points,
    });
  }
  return signals;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function themeSignals(signals: StructuredSignal[], code: ThemeCode) {
  return signals.filter((s) => s.themeCode === code);
}

// ─── The engine ───────────────────────────────────────────────────────────────
export function computePatternReading(
  responses: ResponseRow[],
  optionsMap: Record<string, OptionRow>,
  currentDay: number
): PatternReading {
  const signals = extractSignals(responses, optionsMap);
  const daysObserved = new Set(responses.map((r) => r.day_number)).size;

  const empty: PatternReading = {
    tone: 'forming',
    attention: null,
    carrying: [],
    shifts: [],
    steady: [],
    growth: [],
    daysObserved,
    hasEnoughData: false,
  };

  // Pattern language needs at least ~4 reflections to say anything honest.
  if (daysObserved < 4) return empty;

  const recentWindow = signals.filter((s) => s.day > currentDay - 7);
  const previousWindow = signals.filter(
    (s) => s.day <= currentDay - 7 && s.day > currentDay - 14
  );

  const carrying: PatternInsight[] = [];
  const shifts: PatternInsight[] = [];
  const steady: PatternInsight[] = [];
  const growth: PatternInsight[] = [];

  for (const code of THEME_ORDER as ThemeCode[]) {
    const recent = themeSignals(recentWindow, code);
    if (recent.length === 0) continue;

    const lowCount = recent.filter((s) => s.level === 'Low').length;
    const highCount = recent.filter((s) => s.level === 'High').length;

    // Recurring tension: Low in the majority of recent readings (≥2 readings)
    if (recent.length >= 2 && lowCount / recent.length >= 0.6) {
      carrying.push({
        kind: 'recurring_tension',
        themeCode: code,
        strength: lowCount / recent.length,
        evidenceCount: lowCount,
      });
    }

    // Steady strength: High in the majority of recent readings (≥2 readings)
    if (recent.length >= 2 && highCount / recent.length >= 0.6) {
      steady.push({
        kind: 'steady',
        themeCode: code,
        strength: highCount / recent.length,
        evidenceCount: highCount,
      });
    }

    // Week-over-week shift: compare averages when both windows have data
    const recentAvg = average(recent.map((s) => s.points));
    const prevAvg = average(themeSignals(previousWindow, code).map((s) => s.points));
    if (recentAvg !== null && prevAvg !== null) {
      const delta = recentAvg - prevAvg;
      if (Math.abs(delta) >= 0.5) {
        shifts.push({
          kind: delta > 0 ? 'shift_up' : 'shift_down',
          themeCode: code,
          strength: Math.min(Math.abs(delta) / 2, 1),
          evidenceCount: recent.length,
        });
      }
      // Growth: meaningful upward movement sustained across the full window
      if (delta >= 0.5 && recent.length >= 3) {
        growth.push({
          kind: 'growth',
          themeCode: code,
          strength: Math.min(delta / 2, 1),
          evidenceCount: recent.length,
        });
      }
    }
  }

  const byStrength = (a: PatternInsight, b: PatternInsight) => b.strength - a.strength;
  carrying.sort(byStrength);
  shifts.sort(byStrength);
  steady.sort(byStrength);
  growth.sort(byStrength);

  // Dedup across buckets so a single theme never appears in two places (e.g.
  // "Movement is lifting" AND "Movement is building" AND "Movement is holding").
  // Each theme is claimed by exactly one bucket, in priority order:
  // carrying > downward shift > growth > upward shift > steady.
  const claimed = new Set<string>();
  const claim = (insights: PatternInsight[]) =>
    insights.filter((i) => {
      if (claimed.has(i.themeCode)) return false;
      claimed.add(i.themeCode);
      return true;
    });

  const carryingFinal = claim(carrying);
  const shiftsDown = claim(shifts.filter((s) => s.kind === 'shift_down'));
  const growthFinal = claim(growth);
  const shiftsUp = claim(shifts.filter((s) => s.kind === 'shift_up'));
  const steadyFinal = claim(steady);
  const shiftsFinal = [...shiftsDown, ...shiftsUp].sort(byStrength);

  // Overall tone from the recent window
  const recentAvgAll = average(recentWindow.map((s) => s.points));
  let tone: OverallTone = 'forming';
  if (recentAvgAll !== null) {
    if (carrying.length >= 2 || (recentAvgAll < 1.7 && recentWindow.length >= 4)) {
      tone = 'under_pressure';
    } else if (recentAvgAll >= 2.3 && carrying.length === 0) {
      tone = 'steady';
    } else {
      tone = 'mixed';
    }
  }

  // What deserves attention — one thing, by priority:
  // recurring tension > strongest downward shift > strongest growth > steadiest strength
  const attention: PatternInsight | null =
    carryingFinal[0] ??
    shiftsDown[0] ??
    growthFinal[0] ??
    steadyFinal[0] ??
    null;

  return {
    tone,
    attention,
    carrying: carryingFinal.slice(0, 2),
    shifts: shiftsFinal.slice(0, 3),
    steady: steadyFinal.slice(0, 2),
    growth: growthFinal.slice(0, 2),
    daysObserved,
    hasEnoughData: true,
  };
}
