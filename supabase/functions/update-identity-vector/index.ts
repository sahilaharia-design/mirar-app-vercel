// @ts-nocheck
// update-identity-vector
// Runs after every check-in (fire-and-forget from process-checkin, same
// pattern as sync-user-state/check-unlocks). Maintains alignment_identity_vectors
// — the system's long-term memory of a user, across every cycle they've ever
// run, not just the current one. This is what makes personalization compound
// over time instead of resetting each cycle.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const THEME_CODES = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'] as const

function average(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((s, n) => s + n, 0) / nums.length
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Lifetime response history (every cycle, not just the active one) ──────
    const { data: responses } = await supabase
      .from('responses')
      .select('option_id, submitted_at')
      .eq('user_id', user_id)

    const optionIds = (responses ?? []).map((r: any) => r.option_id)
    let optionsMap: Record<string, any> = {}
    if (optionIds.length > 0) {
      const { data: options } = await supabase
        .from('options')
        .select('id, theme_1_code, theme_1_points, theme_2_code, theme_2_points')
        .in('id', optionIds)
      for (const opt of options ?? []) optionsMap[opt.id] = opt
    }

    // Flatten into per-theme structured signals, newest first.
    const now = Date.now()
    const fourteenDaysAgo = now - 14 * 86400000
    const twentyEightDaysAgo = now - 28 * 86400000

    const allByTheme: Record<string, number[]> = {}
    const recentByTheme: Record<string, number[]> = {}
    const previousByTheme: Record<string, number[]> = {}
    const recentLevelsByTheme: Record<string, string[]> = {}
    for (const code of THEME_CODES) {
      allByTheme[code] = []
      recentByTheme[code] = []
      previousByTheme[code] = []
      recentLevelsByTheme[code] = []
    }

    for (const r of responses ?? []) {
      const opt = optionsMap[r.option_id]
      if (!opt) continue
      const ts = new Date(r.submitted_at).getTime()

      for (const prefix of ['theme_1', 'theme_2'] as const) {
        const code = opt[`${prefix}_code`]
        const points = opt[`${prefix}_points`]
        if (!allByTheme[code]) continue
        allByTheme[code].push(points)
        if (ts >= fourteenDaysAgo) {
          recentByTheme[code].push(points)
          recentLevelsByTheme[code].push(points >= 3 ? 'High' : points <= 1 ? 'Low' : 'Medium')
        } else if (ts >= twentyEightDaysAgo) {
          previousByTheme[code].push(points)
        }
      }
    }

    // ── Baseline, velocity, pattern flags — same thresholds as lib/patterns.ts's
    // computePatternReading, ported here so the vocabulary stays one system. ──
    const baseline_vector: Record<string, number | null> = {}
    const velocity_vector: Record<string, number> = {}
    const flagCandidates: Record<string, { kind: string; strength: number }[]> = {}
    for (const code of THEME_CODES) flagCandidates[code] = []

    for (const code of THEME_CODES) {
      baseline_vector[code] = average(allByTheme[code])

      const recentAvg = average(recentByTheme[code])
      const prevAvg = average(previousByTheme[code])
      velocity_vector[code] = recentAvg !== null && prevAvg !== null ? recentAvg - prevAvg : 0

      const levels = recentLevelsByTheme[code]
      if (levels.length >= 2) {
        const lowCount = levels.filter((l) => l === 'Low').length
        const highCount = levels.filter((l) => l === 'High').length
        if (lowCount / levels.length >= 0.6) {
          flagCandidates[code].push({ kind: 'recurring_tension', strength: lowCount / levels.length })
        }
        if (highCount / levels.length >= 0.6) {
          flagCandidates[code].push({ kind: 'steady', strength: highCount / levels.length })
        }
      }
      if (recentAvg !== null && prevAvg !== null) {
        const delta = recentAvg - prevAvg
        if (Math.abs(delta) >= 0.5) {
          flagCandidates[code].push({
            kind: delta > 0 ? 'shift_up' : 'shift_down',
            strength: Math.min(Math.abs(delta) / 2, 1),
          })
        }
        if (delta >= 0.5 && levels.length >= 3) {
          flagCandidates[code].push({ kind: 'growth', strength: Math.min(delta / 2, 1) })
        }
      }
    }

    // One flag per theme — priority order matches the client engine exactly:
    // recurring_tension > shift_down > growth > shift_up > steady.
    const priority = ['recurring_tension', 'shift_down', 'growth', 'shift_up', 'steady']
    const pattern_flags: Record<string, string> = {}
    for (const code of THEME_CODES) {
      const candidates = flagCandidates[code]
      if (candidates.length === 0) continue
      candidates.sort((a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind))
      pattern_flags[code] = candidates[0].kind
    }

    // ── Cycle count + adaptation readiness ────────────────────────────────────
    const { count: cycleCount } = await supabase
      .from('cycles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)

    const cycle_count = cycleCount ?? 0
    const adaptation_readiness = Math.min(cycle_count / 3, 1)
    const personalization_depth = adaptation_readiness < 0.34 ? 0 : adaptation_readiness < 1 ? 1 : 2

    await supabase.from('alignment_identity_vectors').upsert({
      user_id,
      cycle_count,
      baseline_vector,
      velocity_vector,
      pattern_flags,
      adaptation_readiness,
      personalization_depth,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return new Response(
      JSON.stringify({ ok: true, personalization_depth }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
