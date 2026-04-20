import { ThemeScore, ReportDisplay, ThemeBlock } from '../types/mirar';
import { THEMES, THEME_ORDER, STAGES } from './constants';

// ─── Chapter labels (internal — not exposed as "Stage N" in UI) ──────────────
const STAGE_LABELS: Record<number, string> = {
  1: 'First Signals',
  2: 'Patterns Emerge',
  3: 'Signal in Action',
  4: 'Mirror Deepens',
  0: 'Full Cycle Mirror',
};

// ─── Observational summary lines per theme+status ────────────────────────────
// Language rule: describe what appeared, not what it means.
const SUMMARY_LINES: Record<string, string> = {
  IAP_Aligned: 'Signals for Inner Alignment & Purpose appeared consistently across this stage.',
  IAP_Forming: 'Signals for Inner Alignment & Purpose appeared with moderate regularity.',
  IAP_Stabilizing: 'Signals for Inner Alignment & Purpose appeared intermittently.',
  'IAP_Under Load': 'Signals for Inner Alignment & Purpose registered at low levels throughout this stage.',
  IAP_NoReading: 'Coverage insufficient for an Inner Alignment & Purpose reading.',

  EWB_Aligned: 'Energy & Well-being signals were present and stable.',
  EWB_Forming: 'Energy & Well-being signals appeared with moderate consistency.',
  EWB_Stabilizing: 'Energy & Well-being signals appeared at variable levels.',
  'EWB_Under Load': 'Energy & Well-being signals registered at low levels.',
  EWB_NoReading: 'Coverage insufficient for an Energy & Well-being reading.',

  FAF_Aligned: 'Focus & Flow signals appeared with stability across this stage.',
  FAF_Forming: 'Focus & Flow signals were present at moderate levels.',
  FAF_Stabilizing: 'Focus & Flow signals showed variability.',
  'FAF_Under Load': 'Focus & Flow signals registered at low levels.',
  FAF_NoReading: 'Coverage insufficient for a Focus & Flow reading.',

  RC_Aligned: 'Relational Capital signals were consistent and present.',
  RC_Forming: 'Relational Capital signals appeared at moderate levels.',
  RC_Stabilizing: 'Relational Capital signals appeared intermittently.',
  'RC_Under Load': 'Relational Capital signals registered at low levels.',
  RC_NoReading: 'Coverage insufficient for a Relational Capital reading.',

  GAL_Aligned: 'Growth & Learning signals were consistently present.',
  GAL_Forming: 'Growth & Learning signals appeared with moderate regularity.',
  GAL_Stabilizing: 'Growth & Learning signals appeared intermittently.',
  'GAL_Under Load': 'Growth & Learning signals registered at low levels.',
  GAL_NoReading: 'Coverage insufficient for a Growth & Learning reading.',

  RA_Aligned: 'Resilience & Action signals were stable and present.',
  RA_Forming: 'Resilience & Action signals appeared with moderate consistency.',
  RA_Stabilizing: 'Resilience & Action signals showed variation.',
  'RA_Under Load': 'Resilience & Action signals registered at low levels.',
  RA_NoReading: 'Coverage insufficient for a Resilience & Action reading.',
};

function getSummaryLine(themeCode: string, status: string): string {
  const key = `${themeCode}_${status.replace(' ', '')}`;
  return SUMMARY_LINES[key] ?? `${THEMES[themeCode as keyof typeof THEMES]?.name ?? themeCode} signals were recorded.`;
}

// ─── Calibration check copy ───────────────────────────────────────────────────
function buildCalibrationChecks(themeScores: ThemeScore[]): string[] {
  const checks: string[] = [];

  for (const ts of themeScores) {
    if (ts.signalCount === 0) continue;
    const total = ts.lowCount + ts.mediumCount + ts.highCount;
    if (total === 0) continue;

    const dominantLow = ts.lowCount / total > 0.6;
    const dominantHigh = ts.highCount / total > 0.6;
    const mixed = ts.lowCount > 0 && ts.highCount > 0;

    if (dominantLow) {
      checks.push(`${THEMES[ts.code].name} (${ts.code}) — Low signals dominant across this stage.`);
    } else if (dominantHigh) {
      checks.push(`${THEMES[ts.code].name} (${ts.code}) — High signals dominant across this stage.`);
    } else if (mixed) {
      checks.push(`${THEMES[ts.code].name} (${ts.code}) — Mixed signal levels observed. Low and High both present.`);
    }
  }

  if (checks.length === 0) {
    checks.push('Signal distribution was consistent across themes.');
  }

  return checks;
}

// ─── Primary signals copy ─────────────────────────────────────────────────────
function buildPrimarySignals(themeScores: ThemeScore[], coverage: number, total: number): string[] {
  const signals: string[] = [];

  signals.push(`Coverage: ${coverage} of ${total} check-ins recorded.`);

  const sorted = [...themeScores]
    .filter((t) => t.signalCount > 0)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

  for (const ts of sorted.slice(0, 3)) {
    const level =
      ts.status === 'Aligned'
        ? 'High signal presence'
        : ts.status === 'Forming'
        ? 'Moderate signal presence'
        : ts.status === 'Stabilizing'
        ? 'Stabilizing signal pattern'
        : 'Low signal presence';
    signals.push(`${THEMES[ts.code].name} (${ts.code}) — ${level}.`);
  }

  return signals;
}

// ─── Assemble full report text ────────────────────────────────────────────────
export function assembleReportText(
  stage: number,
  coverage: number,
  coverageTotal: number,
  themeScores: ThemeScore[],
  mirarid: string
): string {
  const stageLabel = STAGE_LABELS[stage];
  const stageDesc = stage > 0 ? STAGES[stage - 1]?.description ?? '' : 'Full cycle signal summary';

  const lines: string[] = [];

  lines.push(`MIRAR ALIGNMENT SUMMARY — ${stageLabel.toUpperCase()}`);
  lines.push(`Mirar ID: ${mirarid}`);
  lines.push('');
  lines.push(`Stage: ${stageLabel}`);
  lines.push(`"${stageDesc}"`);
  lines.push('');
  lines.push(`Coverage: ${coverage} of ${coverageTotal} check-ins recorded.`);
  lines.push('');
  lines.push('─────────────────────────────');
  lines.push('THEME SIGNAL SUMMARY');
  lines.push('─────────────────────────────');

  for (const code of THEME_ORDER) {
    const ts = themeScores.find((t) => t.code === code);
    if (!ts) continue;
    const statusLine = ts.status === 'No Reading' ? 'No Reading' : `${ts.status} (avg: ${ts.average?.toFixed(2) ?? '—'})`;
    lines.push('');
    lines.push(`${THEMES[code].name} (${code})`);
    lines.push(`Status: ${statusLine}`);
    lines.push(getSummaryLine(code, ts.status));
  }

  lines.push('');
  lines.push('─────────────────────────────');
  lines.push('PRIMARY SIGNALS');
  lines.push('─────────────────────────────');
  for (const s of buildPrimarySignals(themeScores, coverage, coverageTotal)) {
    lines.push(`• ${s}`);
  }

  lines.push('');
  lines.push('─────────────────────────────');
  lines.push('CALIBRATION CHECKS');
  lines.push('─────────────────────────────');
  for (const c of buildCalibrationChecks(themeScores)) {
    lines.push(`• ${c}`);
  }

  return lines.join('\n');
}

// ─── Build ReportDisplay for rendering ───────────────────────────────────────
export function buildReportDisplay(
  reportRow: any,
  themeScores: ThemeScore[]
): ReportDisplay {
  const themeBlocks: ThemeBlock[] = THEME_ORDER.map((code) => {
    const ts = themeScores.find((t) => t.code === code);
    return {
      code,
      name: THEMES[code].name,
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

  return {
    report: reportRow,
    stage: reportRow.stage,
    stageLabel: STAGE_LABELS[reportRow.stage] ?? `Stage ${reportRow.stage}`,
    coverage: reportRow.coverage,
    coverageTotal: reportRow.coverage_total,
    themeBlocks,
    primarySignals,
    calibrationChecks,
    summaryText: reportRow.summary_text ?? null,
  };
}
