import { ThemeScore, ReportDisplay, ThemeBlock } from '../types/mirar';
import { THEME_ORDER } from './constants';

// ─── Chapter label keys (internal — not exposed as "Stage N" in UI) ──────────
// Stages 1-4 reuse the existing stages.* namespace (already translated);
// stage 0 (full-cycle report) uses its own key.
const STAGE_KEYS: Record<number, string> = {
  1: 'stages.awareness',
  2: 'stages.realignment',
  3: 'stages.action',
  4: 'stages.reflection',
  0: 'report_detail.full_cycle_label',
};

// ─── Build ReportDisplay for rendering ───────────────────────────────────────
// primary_signals/calibration_checks/summary_text are already generated
// server-side in the user's language (supabase/functions/generate-report) —
// only theme names and the stage label are localized here, client-side.
export function buildReportDisplay(
  t: (key: string) => string,
  reportRow: any,
  themeScores: ThemeScore[]
): ReportDisplay {
  const themeBlocks: ThemeBlock[] = THEME_ORDER.map((code) => {
    const ts = themeScores.find((s) => s.code === code);
    return {
      code,
      name: t(`themes.${code}`),
      status: ts?.status ?? 'No Reading',
      averageScore: ts?.average ?? null,
    };
  });

  const primarySignals = reportRow.primary_signals
    ? reportRow.primary_signals.split('\n').filter(Boolean)
    : [];

  const calibrationChecks = reportRow.calibration_checks
    ? reportRow.calibration_checks.split('\n').filter(Boolean)
    : [];

  const stageKey = STAGE_KEYS[reportRow.stage] ?? STAGE_KEYS[0];

  return {
    report: reportRow,
    stage: reportRow.stage,
    stageLabel: t(stageKey),
    coverage: reportRow.coverage,
    coverageTotal: reportRow.coverage_total,
    themeBlocks,
    primarySignals,
    calibrationChecks,
    summaryText: reportRow.summary_text ?? null,
  };
}
