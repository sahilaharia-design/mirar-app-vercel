// ─── Edge Function: generate-report ──────────────────────────────────────────
// Triggered after scores are computed.
// Assembles report using signal language. Writes to reports table.
// Language rule: observations only — no interpretation, no advice.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const THEME_NAMES: Record<string, string> = {
  IAP: 'Inner Alignment & Purpose',
  EWB: 'Energy & Well-being',
  FAF: 'Focus & Flow',
  RC: 'Relational Capital',
  GAL: 'Growth & Learning',
  RA: 'Resilience & Action',
};

const THEME_ORDER = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'];

const STAGE_LABELS: Record<number, string> = {
  1: 'Awareness',
  2: 'Realignment',
  3: 'Intentional Action',
  4: 'Recognition',
  0: 'Full Cycle Mirror',
};

const STAGE_DESCS: Record<number, string> = {
  1: 'What became noticeable',
  2: 'Where adjustment signals appeared',
  3: 'Where movement occurred',
  4: 'What remained visible by the end of the cycle',
  0: 'Full cycle signal summary',
};

// ─── Observational summary lines — NEVER interpretive ────────────────────────
function getSummaryLine(code: string, status: string): string {
  const name = THEME_NAMES[code] ?? code;
  const map: Record<string, string> = {
    Aligned: `${name} (${code}) signals appeared consistently across this stage.`,
    Forming: `${name} (${code}) signals appeared with moderate regularity.`,
    Stabilizing: `${name} (${code}) signals appeared intermittently.`,
    'Under Load': `${name} (${code}) signals registered at low levels throughout this stage.`,
    'No Reading': `${name} (${code}): coverage insufficient for a reading.`,
  };
  return map[status] ?? `${name} (${code}) signals were recorded.`;
}

function buildPrimarySignals(scores: any[], coverage: number, total: number): string[] {
  const lines = [`Coverage: ${coverage} of ${total} check-ins recorded.`];
  const sorted = [...scores].filter((s) => s.signal_count > 0).sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0));
  for (const s of sorted.slice(0, 3)) {
    const pres =
      s.status === 'Aligned' ? 'High signal presence' :
      s.status === 'Forming' ? 'Moderate signal presence' :
      s.status === 'Stabilizing' ? 'Stabilizing signal pattern' : 'Low signal presence';
    lines.push(`${THEME_NAMES[s.theme_code]} (${s.theme_code}) — ${pres}.`);
  }
  return lines;
}

function buildCalibrationChecks(scores: any[]): string[] {
  const checks: string[] = [];
  for (const s of scores) {
    if (s.signal_count === 0) continue;
    const total = s.low_count + s.medium_count + s.high_count;
    if (total === 0) continue;
    if (s.low_count / total > 0.6) checks.push(`${THEME_NAMES[s.theme_code]} (${s.theme_code}) — Low signals dominant.`);
    else if (s.high_count / total > 0.6) checks.push(`${THEME_NAMES[s.theme_code]} (${s.theme_code}) — High signals dominant.`);
    else if (s.low_count > 0 && s.high_count > 0) checks.push(`${THEME_NAMES[s.theme_code]} (${s.theme_code}) — Mixed signal levels observed.`);
  }
  if (checks.length === 0) checks.push('Signal distribution was consistent across themes.');
  return checks;
}

function buildFullReportText(stage: number, coverage: number, total: number, scores: any[], mirarid: string): string {
  const lines: string[] = [];
  lines.push(`MIRAR ALIGNMENT SUMMARY — ${STAGE_LABELS[stage]?.toUpperCase()}`);
  lines.push(`Mirar ID: ${mirarid}`);
  lines.push('');
  lines.push(`Stage: ${STAGE_LABELS[stage]}`);
  lines.push(`"${STAGE_DESCS[stage]}"`);
  lines.push('');
  lines.push(`Coverage: ${coverage} of ${total} check-ins recorded.`);
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push('THEME SIGNAL SUMMARY');
  lines.push('─'.repeat(30));
  for (const code of THEME_ORDER) {
    const s = scores.find((sc) => sc.theme_code === code);
    if (!s) continue;
    lines.push('');
    lines.push(`${THEME_NAMES[code]} (${code})`);
    lines.push(`Status: ${s.status}${s.average_score !== null ? ` (avg: ${Number(s.average_score).toFixed(2)})` : ''}`);
    lines.push(getSummaryLine(code, s.status));
  }
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push('PRIMARY SIGNALS');
  lines.push('─'.repeat(30));
  for (const sig of buildPrimarySignals(scores, coverage, total)) lines.push(`• ${sig}`);
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push('CALIBRATION CHECKS');
  lines.push('─'.repeat(30));
  for (const cal of buildCalibrationChecks(scores)) lines.push(`• ${cal}`);
  return lines.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cycle_id, stage, user_id } = await req.json();
    if (!cycle_id || stage === undefined || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch theme scores
    const { data: scores, error: scoresErr } = await supabase
      .from('theme_scores')
      .select('*')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .eq('stage', stage);

    if (scoresErr) throw scoresErr;

    // Count responses for coverage
    const dayRange = stage === 0 ? [1, 28] : [
      [1,7],[8,14],[15,21],[22,28]
    ][stage - 1] ?? [1,7];
    const { count } = await supabase
      .from('responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .gte('day_number', dayRange[0])
      .lte('day_number', dayRange[1]);

    const coverage = count ?? 0;
    const total = stage === 0 ? 28 : 7;

    // Fetch user for mirar_id
    const { data: userRow } = await supabase
      .from('users')
      .select('mirar_id')
      .eq('id', user_id)
      .single();

    const mirarid = userRow?.mirar_id ?? user_id;
    const primarySignals = buildPrimarySignals(scores ?? [], coverage, total).join('\n');
    const calibrationChecks = buildCalibrationChecks(scores ?? []).join('\n');
    const summaryText = `${STAGE_LABELS[stage]} signal summary. Coverage: ${coverage}/${total}. ${(scores ?? []).filter((s) => s.status === 'Aligned').length} themes Aligned.`;
    const fullReportText = buildFullReportText(stage, coverage, total, scores ?? [], mirarid);

    // Upsert report
    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .upsert({
        user_id,
        cycle_id,
        stage,
        coverage,
        coverage_total: total,
        primary_signals: primarySignals,
        calibration_checks: calibrationChecks,
        summary_text: summaryText,
        full_report_text: fullReportText,
        status: 'generated',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,cycle_id,stage' })
      .select()
      .single();

    if (reportErr) throw reportErr;

    return new Response(JSON.stringify({ ok: true, report_id: report.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('generate-report error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
