// ─── Edge Function: compute-stage-scores ─────────────────────────────────────
// Triggered when a stage window closes (stage_start + 6d20h)
// Calculates theme averages, determines statuses, writes to theme_scores

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STATUS_THRESHOLDS = [
  { max: 1.5, status: 'Under Load' },
  { max: 2.0, status: 'Stabilizing' },
  { max: 2.5, status: 'Forming' },
  { max: Infinity, status: 'Aligned' },
] as const;

const THEME_CODES = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'] as const;

function getStatus(average: number | null, signalCount: number): string {
  if (average === null || signalCount === 0) return 'No Reading';
  for (const t of STATUS_THRESHOLDS) {
    if (average < t.max) return t.status;
  }
  return 'Aligned';
}

function getStageDayRange(stage: number): [number, number] {
  const ranges: Record<number, [number, number]> = {
    1: [1, 7], 2: [8, 14], 3: [15, 21], 4: [22, 28],
  };
  return ranges[stage] ?? [1, 7];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cycle_id, stage, user_id } = await req.json();
    if (!cycle_id || !stage || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const [startDay, endDay] = getStageDayRange(stage);

    // Fetch responses for this user/cycle/stage
    const { data: responses, error: respErr } = await supabase
      .from('responses')
      .select('option_id, day_number')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .gte('day_number', startDay)
      .lte('day_number', endDay);

    if (respErr) throw respErr;
    if (!responses?.length) {
      console.log(`No responses for cycle ${cycle_id} stage ${stage}`);
      return new Response(JSON.stringify({ ok: true, signal_count: 0 }), { status: 200 });
    }

    // Fetch options
    const optionIds = responses.map((r: any) => r.option_id);
    const { data: options, error: optErr } = await supabase
      .from('options')
      .select('id, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points')
      .in('id', optionIds);

    if (optErr) throw optErr;

    const optMap: Record<string, any> = {};
    for (const opt of options ?? []) optMap[opt.id] = opt;

    // Accumulate per theme
    const acc: Record<string, { points: number[]; low: number; medium: number; high: number }> = {};
    for (const code of THEME_CODES) acc[code] = { points: [], low: 0, medium: 0, high: 0 };

    for (const resp of responses) {
      const opt = optMap[resp.option_id];
      if (!opt) continue;

      for (const prefix of ['theme_1', 'theme_2'] as const) {
        const code = opt[`${prefix}_code`];
        const level = opt[`${prefix}_level`];
        const points = opt[`${prefix}_points`];
        if (acc[code]) {
          acc[code].points.push(points);
          if (level === 'Low') acc[code].low++;
          else if (level === 'Medium') acc[code].medium++;
          else acc[code].high++;
        }
      }
    }

    // Upsert theme scores
    const rows = THEME_CODES.map((code) => {
      const a = acc[code];
      const signalCount = a.points.length;
      const average = signalCount > 0
        ? parseFloat((a.points.reduce((s: number, p: number) => s + p, 0) / signalCount).toFixed(2))
        : null;
      return {
        user_id,
        cycle_id,
        stage,
        theme_code: code,
        signal_count: signalCount,
        low_count: a.low,
        medium_count: a.medium,
        high_count: a.high,
        average_score: average,
        status: getStatus(average, signalCount),
        computed_at: new Date().toISOString(),
      };
    });

    const { error: upsertErr } = await supabase
      .from('theme_scores')
      .upsert(rows, { onConflict: 'user_id,cycle_id,stage,theme_code' });

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ ok: true, rows_written: rows.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('compute-stage-scores error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
