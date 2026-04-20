// @ts-nocheck
// admin-analytics
// Secret-gated endpoint returning retention and engagement metrics.
// Day 3/7/14/28 retention, cycle restart rate, multi-cycle retention,
// trial conversion funnel, and theme-level signal health.
// Call with: x-admin-secret header matching ADMIN_SECRET env var.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  const adminSecret = Deno.env.get('ADMIN_SECRET')
  if (adminSecret) {
    const provided = req.headers.get('x-admin-secret') ?? ''
    if (provided !== adminSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 1. Total registered users ────────────────────────────────────────────
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    // ── 2. Day-N retention (cohort: users who reached N responses) ───────────
    // Uses response counts per user — simpler than strict day-based cohort
    // since users may skip days.
    const { data: responseCounts } = await supabase
      .from('responses')
      .select('user_id')
      .order('user_id')

    // Aggregate response count per user
    const countByUser: Record<string, number> = {}
    for (const row of responseCounts ?? []) {
      countByUser[row.user_id] = (countByUser[row.user_id] ?? 0) + 1
    }
    const allCounts = Object.values(countByUser)
    const totalUsersWithResponses = allCounts.length

    const reached = (n: number) => allCounts.filter((c) => c >= n).length
    const pct = (n: number, base: number) =>
      base > 0 ? Math.round((n / base) * 100) : 0

    const r3  = reached(3)
    const r7  = reached(7)
    const r14 = reached(14)
    const r28 = reached(28)

    const retention = {
      users_with_any_response: totalUsersWithResponses,
      day3:  { count: r3,  pct: pct(r3,  totalUsersWithResponses) },
      day7:  { count: r7,  pct: pct(r7,  totalUsersWithResponses) },
      day14: { count: r14, pct: pct(r14, totalUsersWithResponses) },
      day28: { count: r28, pct: pct(r28, totalUsersWithResponses) },
    }

    // ── 3. Cycle distribution ─────────────────────────────────────────────────
    const { data: cycleRows } = await supabase
      .from('cycles')
      .select('cycle_number, user_id')

    // Users by max cycle_number
    const maxCycleByUser: Record<string, number> = {}
    for (const row of cycleRows ?? []) {
      if ((maxCycleByUser[row.user_id] ?? 0) < row.cycle_number) {
        maxCycleByUser[row.user_id] = row.cycle_number
      }
    }
    const cycleValues = Object.values(maxCycleByUser)
    const onCycle1 = cycleValues.filter((c) => c === 1).length
    const onCycle2 = cycleValues.filter((c) => c === 2).length
    const onCycle3plus = cycleValues.filter((c) => c >= 3).length

    const cycleDistribution = {
      cycle_1_only:  onCycle1,
      cycle_2:       onCycle2,
      cycle_3_plus:  onCycle3plus,
      restart_rate_pct: pct(onCycle2 + onCycle3plus, cycleValues.length),
      multi_cycle_pct:  pct(onCycle3plus, cycleValues.length),
    }

    // ── 4. Trial funnel ───────────────────────────────────────────────────────
    const { data: trials } = await supabase
      .from('trial_tracking')
      .select('conversion_status, trial_active')

    const trialGroups: Record<string, number> = {
      trial: 0, converted: 0, expired: 0, gifted: 0,
    }
    for (const t of trials ?? []) {
      trialGroups[t.conversion_status] = (trialGroups[t.conversion_status] ?? 0) + 1
    }
    const trialTotal = Object.values(trialGroups).reduce((s, v) => s + v, 0)

    const trialFunnel = {
      total:         trialTotal,
      active_trial:  trialGroups.trial,
      converted:     trialGroups.converted,
      expired:       trialGroups.expired,
      gifted:        trialGroups.gifted,
      conversion_pct: pct(trialGroups.converted, trialTotal),
      expiry_pct:     pct(trialGroups.expired,   trialTotal),
    }

    // ── 5. Unlock milestone distribution ─────────────────────────────────────
    const { data: unlockRows } = await supabase
      .from('unlock_events')
      .select('unlock_key')

    const unlockCounts: Record<string, number> = {}
    for (const row of unlockRows ?? []) {
      unlockCounts[row.unlock_key] = (unlockCounts[row.unlock_key] ?? 0) + 1
    }

    // ── 6. Weekly signal type distribution (last 90 days) ────────────────────
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString()
    const { data: signalRows } = await supabase
      .from('weekly_signals')
      .select('signal_type')
      .gte('generated_at', since90)

    const signalTypeCounts: Record<string, number> = {}
    for (const row of signalRows ?? []) {
      signalTypeCounts[row.signal_type] = (signalTypeCounts[row.signal_type] ?? 0) + 1
    }

    // ── 7. Theme health (average status across all theme_scores) ─────────────
    const { data: themeScoreRows } = await supabase
      .from('theme_scores')
      .select('theme_code, status, average_score')
      .gte('computed_at', since90)

    const themeHealth: Record<string, { aligned: number; forming: number; stabilizing: number; under_load: number; avg_score: number; count: number }> = {}
    for (const row of themeScoreRows ?? []) {
      if (!themeHealth[row.theme_code]) {
        themeHealth[row.theme_code] = { aligned: 0, forming: 0, stabilizing: 0, under_load: 0, avg_score: 0, count: 0 }
      }
      const h = themeHealth[row.theme_code]
      h.count++
      h.avg_score += row.average_score ?? 0
      if (row.status === 'Aligned')       h.aligned++
      else if (row.status === 'Forming')  h.forming++
      else if (row.status === 'Stabilizing') h.stabilizing++
      else if (row.status === 'Under Load')  h.under_load++
    }

    // Normalize averages
    for (const code of Object.keys(themeHealth)) {
      const h = themeHealth[code]
      h.avg_score = h.count > 0 ? parseFloat((h.avg_score / h.count).toFixed(2)) : 0
    }

    // ── Compose response ──────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        generated_at:     new Date().toISOString(),
        total_users:      totalUsers ?? 0,
        retention,
        cycle_distribution: cycleDistribution,
        trial_funnel:     trialFunnel,
        unlock_milestone_counts: unlockCounts,
        signal_type_distribution_90d: signalTypeCounts,
        theme_health_90d: themeHealth,
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('admin-analytics error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
