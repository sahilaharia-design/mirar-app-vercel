// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { user_id, cycle_id, question_id, option_id, day_number, journal_text } =
      await req.json()

    if (!user_id || !cycle_id || !question_id || !option_id || !day_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Insert response (upsert to handle re-submissions safely)
    const { error: insertError } = await supabase.from('responses').upsert({
      user_id,
      cycle_id,
      question_id,
      option_id,
      day_number,
      journal_text: journal_text?.trim() || null,
    }, { onConflict: 'user_id,cycle_id,day_number' })

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get all responses from last 7 days for rolling window
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentResponses } = await supabase
      .from('responses')
      .select('option_id, submitted_at')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .gte('submitted_at', sevenDaysAgo.toISOString())

    // 3. Fetch options for rolling responses
    const optionIds = (recentResponses ?? []).map((r: any) => r.option_id)
    const { data: options } = await supabase
      .from('options')
      .select('id, theme_1_code, theme_1_points, theme_2_code, theme_2_points')
      .in('id', optionIds)

    const optionsMap: Record<string, any> = {}
    for (const opt of options ?? []) {
      optionsMap[opt.id] = opt
    }

    // 4. Compute rolling 7-day theme accumulator
    const themeAcc: Record<string, number[]> = {
      IAP: [], EWB: [], FAF: [], RC: [], GAL: [], RA: [],
    }

    for (const response of recentResponses ?? []) {
      const opt = optionsMap[response.option_id]
      if (!opt) continue
      themeAcc[opt.theme_1_code]?.push(opt.theme_1_points)
      themeAcc[opt.theme_2_code]?.push(opt.theme_2_points)
    }

    // 5. Compute alignment score (0–100) from rolling 7-day window
    const allPoints: number[] = Object.values(themeAcc).flat()
    const today = new Date().toISOString().split('T')[0]
    const stage = day_number <= 7 ? 1 : day_number <= 14 ? 2 : day_number <= 21 ? 3 : 4

    let alignmentScore: number | null = null
    let statusLabel = 'Calibrating'

    if (allPoints.length >= 3) {
      const avg = allPoints.reduce((s, p) => s + p, 0) / allPoints.length
      // Normalize 1.0–3.0 range → 0–100
      alignmentScore = Math.round(((avg - 1.0) / 2.0) * 100)
      alignmentScore = Math.max(0, Math.min(100, alignmentScore))

      if (alignmentScore < 38) statusLabel = 'Under Load'
      else if (alignmentScore < 50) statusLabel = 'Stabilizing'
      else if (alignmentScore < 75) statusLabel = 'Forming'
      else statusLabel = 'Aligned'
    }

    // 6. Compute trend vs yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: prevScore } = await supabase
      .from('alignment_scores')
      .select('score')
      .eq('user_id', user_id)
      .eq('date', yesterdayStr)
      .maybeSingle()

    let trend = 'new'
    if (alignmentScore !== null && prevScore) {
      const diff = alignmentScore - prevScore.score
      trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'steady'
    }

    // 7. Upsert alignment score for today
    if (alignmentScore !== null) {
      await supabase.from('alignment_scores').upsert({
        user_id,
        date: today,
        score: alignmentScore,
        status_label: statusLabel,
        trend,
      }, { onConflict: 'user_id,date' })

      // Snapshot on the response
      await supabase
        .from('responses')
        .update({ alignment_score_at_time: alignmentScore })
        .eq('user_id', user_id)
        .eq('cycle_id', cycle_id)
        .eq('day_number', day_number)
    }

    // 8. Upsert rolling theme scores (stage-level)
    for (const [themeCode, points] of Object.entries(themeAcc)) {
      if (points.length === 0) continue

      const avg = points.reduce((s, p) => s + p, 0) / points.length
      let themeStatus = 'No Reading'
      if (avg < 1.5) themeStatus = 'Under Load'
      else if (avg < 2.0) themeStatus = 'Stabilizing'
      else if (avg < 2.5) themeStatus = 'Forming'
      else themeStatus = 'Aligned'

      await supabase.from('theme_scores').upsert({
        user_id,
        cycle_id,
        stage,
        theme_code: themeCode,
        signal_count: points.length,
        average_score: parseFloat(avg.toFixed(2)),
        status: themeStatus,
        computed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,cycle_id,stage,theme_code' })
    }

    // 9. Async: generate Haiku mirror insight (fire-and-forget, non-blocking)
    if (alignmentScore !== null) {
      const themeStatuses = Object.entries(themeAcc)
        .filter(([, pts]) => pts.length > 0)
        .map(([code, pts]) => {
          const avg = pts.reduce((s: number, p: number) => s + p, 0) / pts.length
          const status =
            avg < 1.5 ? 'Under Load' :
            avg < 2.0 ? 'Stabilizing' :
            avg < 2.5 ? 'Forming' : 'Aligned'
          const names: Record<string, string> = {
            IAP: 'Direction', EWB: 'Energy',
            FAF: 'Attention', RC: 'Connection',
            GAL: 'Growth', RA: 'Movement',
          }
          return { code, name: names[code] ?? code, status }
        })

      // Fetch today's journal for optional context
      const { data: todayResponse } = await supabase
        .from('responses')
        .select('journal_text')
        .eq('user_id', user_id)
        .eq('cycle_id', cycle_id)
        .eq('day_number', day_number)
        .maybeSingle()

      // Fire async — hard 8s timeout so Deno doesn't hold the connection alive
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      const mirrorController = new AbortController()
      setTimeout(() => mirrorController.abort(), 8000)
      fetch(`${supabaseUrl}/functions/v1/generate-mirror-insight`, {
        method: 'POST',
        signal: mirrorController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          user_id,
          cycle_id,
          day_number,
          alignment_score: alignmentScore,
          theme_statuses: themeStatuses,
          journal_snippet: todayResponse?.journal_text ?? null,
        }),
      }).catch(() => { /* non-fatal */ })

      // 10. sync-user-state (always, non-blocking)
      const syncController = new AbortController()
      setTimeout(() => syncController.abort(), 8000)
      fetch(`${supabaseUrl}/functions/v1/sync-user-state`, {
        method: 'POST',
        signal: syncController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          user_id,
          cycle_id,
          cycle_number: null, // sync-user-state will derive from user_state if available
          day_number,
        }),
      }).catch(() => { /* non-fatal */ })

      // 11. check-unlocks (always, non-blocking)
      // Compute total_reflections to evaluate milestone thresholds
      const { count: totalCount } = await supabase
        .from('responses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)

      const totalReflections = totalCount ?? 0

      const { data: cycleRow } = await supabase
        .from('cycles')
        .select('cycle_number')
        .eq('id', cycle_id)
        .maybeSingle()

      const cycleNumber = cycleRow?.cycle_number ?? 1

      const unlockController = new AbortController()
      setTimeout(() => unlockController.abort(), 8000)
      fetch(`${supabaseUrl}/functions/v1/check-unlocks`, {
        method: 'POST',
        signal: unlockController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ user_id, total_reflections: totalReflections, cycle_number: cycleNumber }),
      }).catch(() => { /* non-fatal */ })

      // 12. generate-weekly-signal — only on every 7th reflection
      if (totalReflections > 0 && totalReflections % 7 === 0) {
        const weekNumber = Math.ceil(day_number / 7)
        const weeklyController = new AbortController()
        setTimeout(() => weeklyController.abort(), 15000)
        fetch(`${supabaseUrl}/functions/v1/generate-weekly-signal`, {
          method: 'POST',
          signal: weeklyController.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            user_id,
            cycle_id,
            cycle_number: cycleNumber,
            week_number:  weekNumber,
          }),
        }).catch(() => { /* non-fatal */ })
      }

      // 13. generate-report — fire when user first checks in on stage-opening day
      // Day 8 = stage 2 opens → generate stage 1 report
      // Day 15 = stage 3 opens → generate stage 2 report
      // Day 22 = stage 4 opens → generate stage 3 report
      // Day 29 = cycle ends   → generate stage 4 report
      const stageCompletedMap: Record<number, number> = { 8: 1, 15: 2, 22: 3, 29: 4 }
      const completedStage = stageCompletedMap[day_number]
      if (completedStage) {
        // Only generate once: check whether report already exists
        const { count: reportExists } = await supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('cycle_id', cycle_id)
          .eq('stage', completedStage)
        if (!reportExists || reportExists === 0) {
          const reportController = new AbortController()
          setTimeout(() => reportController.abort(), 20000)
          fetch(`${supabaseUrl}/functions/v1/generate-report`, {
            method: 'POST',
            signal: reportController.signal,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ user_id, cycle_id, stage: completedStage }),
          }).catch(() => { /* non-fatal */ })
        }
      }
    }

    return new Response(
      JSON.stringify({ alignmentScore, statusLabel, trend }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
