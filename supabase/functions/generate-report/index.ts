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
  IAP: 'Direction',
  EWB: 'Energy',
  FAF: 'Attention',
  RC: 'Connection',
  GAL: 'Growth',
  RA: 'Movement',
};

const THEME_ORDER = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'];

const STAGE_LABELS: Record<number, string> = {
  1: 'First reflections',
  2: 'Pattern forming',
  3: 'Movement noticed',
  4: 'Reflection summary',
  0: 'Full pattern',
};

const STAGE_DESCS: Record<number, string> = {
  1: 'What became noticeable',
  2: 'Where adjustment signals appeared',
  3: 'Where movement occurred',
  4: 'What remained visible by the end of the cycle',
  0: 'Full pattern summary',
};

// ─── Observational summary lines — NEVER interpretive ────────────────────────
function getSummaryLine(code: string, status: string): string {
  const name = THEME_NAMES[code] ?? code;
  const map: Record<string, string> = {
    Aligned: `${name} appeared steadily across this reflection window.`,
    Forming: `${name} appeared with moderate regularity.`,
    Stabilizing: `${name} appeared intermittently.`,
    'Under Load': `${name} showed pressure across this reflection window.`,
    'No Reading': `${name}: not enough reflections yet.`,
  };
  return map[status] ?? `${name} was visible in the reflections.`;
}

function buildPrimarySignals(scores: any[], coverage: number, total: number): string[] {
  const lines = [`${coverage} of ${total} reflections included.`];
  const sorted = [...scores].filter((s) => s.signal_count > 0).sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0));
  for (const s of sorted.slice(0, 3)) {
    const pres =
      s.status === 'Aligned' ? 'steady signal presence' :
      s.status === 'Forming' ? 'moderate signal presence' :
      s.status === 'Stabilizing' ? 'settling signal pattern' : 'pressure present';
    lines.push(`${THEME_NAMES[s.theme_code]} — ${pres}.`);
  }
  return lines;
}

function buildCalibrationChecks(scores: any[]): string[] {
  const checks: string[] = [];
  for (const s of scores) {
    if (s.signal_count === 0) continue;
    const total = s.low_count + s.medium_count + s.high_count;
    if (total === 0) continue;
    if (s.low_count / total > 0.6) checks.push(`${THEME_NAMES[s.theme_code]} — pressure appeared repeatedly.`);
    else if (s.high_count / total > 0.6) checks.push(`${THEME_NAMES[s.theme_code]} — steadiness appeared repeatedly.`);
    else if (s.low_count > 0 && s.high_count > 0) checks.push(`${THEME_NAMES[s.theme_code]} — mixed signals appeared.`);
  }
  if (checks.length === 0) checks.push('The reflections were consistent across areas.');
  return checks;
}

function buildFullReportText(stage: number, coverage: number, total: number, scores: any[], mirarid: string): string {
  const lines: string[] = [];
  lines.push(`MIRAR REFLECTION SUMMARY — ${STAGE_LABELS[stage]?.toUpperCase()}`);
  lines.push(`Mirar ID: ${mirarid}`);
  lines.push('');
  lines.push(`Window: ${STAGE_LABELS[stage]}`);
  lines.push(`"${STAGE_DESCS[stage]}"`);
  lines.push('');
  lines.push(`${coverage} of ${total} reflections included.`);
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push('WHAT SHOWED UP');
  lines.push('─'.repeat(30));
  for (const code of THEME_ORDER) {
    const s = scores.find((sc) => sc.theme_code === code);
    if (!s) continue;
    lines.push('');
    lines.push(`${THEME_NAMES[code]}`);
    lines.push(`Reading: ${s.status}`);
    lines.push(getSummaryLine(code, s.status));
  }
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push('STRONGEST SIGNALS');
  lines.push('─'.repeat(30));
  for (const sig of buildPrimarySignals(scores, coverage, total)) lines.push(`• ${sig}`);
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push('GENTLE CHECKS');
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
    const summaryText = `${STAGE_LABELS[stage]} reflection summary. ${coverage}/${total} reflections included. ${(scores ?? []).filter((s) => s.status === 'Aligned').length} areas showed steadiness.`;
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
