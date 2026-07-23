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

    // 1. Insert response (upsert to handle re-submissions safely). Select the
    // id back inline — avoids a second round trip to look up the row we just
    // wrote (the old code re-queried `responses` right after this for that
    // single column).
    const { data: responseRow, error: insertError } = await supabase
      .from('responses')
      .upsert({
        user_id,
        cycle_id,
        question_id,
        option_id,
        day_number,
        journal_text: journal_text?.trim() || null,
      }, { onConflict: 'user_id,cycle_id,day_number' })
      .select('id')
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Pre-compute what background-job payloads will need later.
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // 2. Every read below is independent of the others — none of them
    // depend on each other's results, only on the insert above having
    // completed (recentResponses needs to see today's just-written row).
    // Running them concurrently instead of one-by-one cuts this from ~7
    // sequential round trips down to the time of the single slowest one,
    // and frees up the pooled DB connection for other requests sooner.
    const [
      { data: chosenOption },
      { data: recentResponses },
      { data: prevScore },
      { data: identityVectorRow },
      { count: totalCount },
      { data: cycleRow },
      { count: cycleResponseCount },
    ] = await Promise.all([
      supabase
        .from('options')
        .select('theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points')
        .eq('id', option_id)
        .maybeSingle(),
      supabase
        .from('responses')
        .select('option_id, submitted_at')
        .eq('user_id', user_id)
        .eq('cycle_id', cycle_id)
        .gte('submitted_at', sevenDaysAgo.toISOString()),
      (() => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        return supabase
          .from('alignment_scores')
          .select('score')
          .eq('user_id', user_id)
          .eq('date', yesterdayStr)
          .maybeSingle()
      })(),
      supabase
        .from('alignment_identity_vectors')
        .select('pattern_flags')
        .eq('user_id', user_id)
        .maybeSingle(),
      supabase
        .from('responses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id),
      supabase
        .from('cycles')
        .select('cycle_number')
        .eq('id', cycle_id)
        .maybeSingle(),
      // Real check-ins logged in THIS cycle so far (includes the one just
      // inserted above) — used to gate report generation on an actual count
      // of 7 reflections, not on the calendar day having advanced.
      supabase
        .from('responses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('cycle_id', cycle_id),
    ])

    // A stage completes on exactly the check-in that makes its count a
    // multiple of 7 — e.g. the 7th real reflection completes stage 1, the
    // 14th completes stage 2 — regardless of how many calendar days that
    // took. Only stages 1–4 (28 check-ins) generate a per-stage report here.
    const completedStage =
      cycleResponseCount && cycleResponseCount > 0 && cycleResponseCount % 7 === 0 && cycleResponseCount <= 28
        ? cycleResponseCount / 7
        : null

    let reportExists = 0
    if (completedStage) {
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('cycle_id', cycle_id)
        .eq('stage', completedStage)
      reportExists = count ?? 0
    }

    // 1b. Signal engine: persist structured signals for this reflection
    // (two rows — one per mapped theme on the chosen option)
    if (chosenOption && responseRow) {
      const signalDate = new Date().toISOString().split('T')[0]
      await supabase.from('structured_signals').upsert([
        {
          user_id,
          cycle_id,
          response_id: responseRow.id,
          day_number,
          signal_date: signalDate,
          theme_code: chosenOption.theme_1_code,
          level: chosenOption.theme_1_level,
          points: chosenOption.theme_1_points,
        },
        {
          user_id,
          cycle_id,
          response_id: responseRow.id,
          day_number,
          signal_date: signalDate,
          theme_code: chosenOption.theme_2_code,
          level: chosenOption.theme_2_level,
          points: chosenOption.theme_2_points,
        },
      ], { onConflict: 'user_id,response_id,theme_code' })
    }

    // 3. Fetch options for rolling responses — depends on recentResponses
    // above, so it can't join the parallel batch, but it's now the only
    // sequential read left before the score computation.
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

    // 6. Compute trend vs yesterday (prevScore fetched in the parallel batch above)
    let trend = 'new'
    if (alignmentScore !== null && prevScore) {
      const diff = alignmentScore - prevScore.score
      trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'steady'
    }

    // 7. Upsert alignment score for today + snapshot it on the response.
    // These write to different tables and don't depend on each other, only
    // on alignmentScore already being computed — run them together.
    if (alignmentScore !== null) {
      await Promise.all([
        supabase.from('alignment_scores').upsert({
          user_id,
          date: today,
          score: alignmentScore,
          status_label: statusLabel,
          trend,
        }, { onConflict: 'user_id,date' }),
        supabase
          .from('responses')
          .update({ alignment_score_at_time: alignmentScore })
          .eq('user_id', user_id)
          .eq('cycle_id', cycle_id)
          .eq('day_number', day_number),
      ])
    }

    // 8. Upsert rolling theme scores (stage-level) — one batched upsert
    // instead of a separate round trip per theme (previously up to 6).
    const themeScoreRows = Object.entries(themeAcc)
      .filter(([, points]) => points.length > 0)
      .map(([themeCode, points]) => {
        const avg = points.reduce((s, p) => s + p, 0) / points.length
        let themeStatus = 'No Reading'
        if (avg < 1.5) themeStatus = 'Under Load'
        else if (avg < 2.0) themeStatus = 'Stabilizing'
        else if (avg < 2.5) themeStatus = 'Forming'
        else themeStatus = 'Aligned'

        return {
          user_id,
          cycle_id,
          stage,
          theme_code: themeCode,
          signal_count: points.length,
          average_score: parseFloat(avg.toFixed(2)),
          status: themeStatus,
          computed_at: new Date().toISOString(),
        }
      })

    if (themeScoreRows.length > 0) {
      await supabase
        .from('theme_scores')
        .upsert(themeScoreRows, { onConflict: 'user_id,cycle_id,stage,theme_code' })
    }

    // Background jobs below are fire-and-forget so the response returns fast,
    // but an un-awaited fetch isn't guaranteed to survive past `return` — the
    // edge runtime can tear down the isolate as soon as the response is sent.
    // Collecting them here and handing them to EdgeRuntime.waitUntil() keeps
    // the isolate alive until they finish, so they don't silently get killed
    // mid-flight under concurrent load.
    const backgroundTasks: Promise<any>[] = []

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

      // Repeat-awareness: with only a fixed question bank, this exact prompt
      // will eventually repeat. Rather than silently re-asking as if new, let
      // the mirror insight name what's shifted — only when the answer differs
      // from the prior time this same question was served.
      let previousAnswerText: string | null = null
      const { data: historyRows } = await supabase
        .from('question_history')
        .select('day_number, cycle_id')
        .eq('user_id', user_id)
        .eq('question_id', question_id)
        .order('served_at', { ascending: false })
        .limit(2)

      const priorHistory = (historyRows ?? [])[1] // [0] is today's own entry
      if (priorHistory) {
        const { data: priorResponse } = await supabase
          .from('responses')
          .select('option_id')
          .eq('user_id', user_id)
          .eq('cycle_id', priorHistory.cycle_id)
          .eq('day_number', priorHistory.day_number)
          .maybeSingle()

        if (priorResponse && priorResponse.option_id !== option_id) {
          const { data: priorOption } = await supabase
            .from('options')
            .select('option_text')
            .eq('id', priorResponse.option_id)
            .maybeSingle()
          previousAnswerText = priorOption?.option_text ?? null
        }
      }

      // Fire async — hard 8s timeout so Deno doesn't hold the connection alive
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      const mirrorController = new AbortController()
      setTimeout(() => mirrorController.abort(), 8000)
      backgroundTasks.push(fetch(`${supabaseUrl}/functions/v1/generate-mirror-insight`, {
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
          previous_answer_text: previousAnswerText,
        }),
      }).catch(() => { /* non-fatal */ }))

      // 9b. update-identity-vector (always, non-blocking) — the system's
      // long-term memory of this user, recomputed after every check-in.
      const identityController = new AbortController()
      setTimeout(() => identityController.abort(), 8000)
      backgroundTasks.push(fetch(`${supabaseUrl}/functions/v1/update-identity-vector`, {
        method: 'POST',
        signal: identityController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ user_id }),
      }).catch(() => { /* non-fatal */ }))

      // 10. sync-user-state (always, non-blocking)
      const syncController = new AbortController()
      setTimeout(() => syncController.abort(), 8000)
      backgroundTasks.push(fetch(`${supabaseUrl}/functions/v1/sync-user-state`, {
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
      }).catch(() => { /* non-fatal */ }))

      // 11. check-unlocks (always, non-blocking)
      // total_reflections and cycle_number were already fetched in the
      // parallel batch above — no need to re-query them here.
      const totalReflections = totalCount ?? 0
      const cycleNumber = cycleRow?.cycle_number ?? 1

      const unlockController = new AbortController()
      setTimeout(() => unlockController.abort(), 8000)
      backgroundTasks.push(fetch(`${supabaseUrl}/functions/v1/check-unlocks`, {
        method: 'POST',
        signal: unlockController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ user_id, total_reflections: totalReflections, cycle_number: cycleNumber }),
      }).catch(() => { /* non-fatal */ }))

      // 12. generate-weekly-signal — only on every 7th reflection
      if (totalReflections > 0 && totalReflections % 7 === 0) {
        const weekNumber = Math.ceil(day_number / 7)
        const weeklyController = new AbortController()
        setTimeout(() => weeklyController.abort(), 15000)
        backgroundTasks.push(fetch(`${supabaseUrl}/functions/v1/generate-weekly-signal`, {
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
        }).catch(() => { /* non-fatal */ }))
      }

      // 13. generate-report — fire on the check-in that completes a stage's
      // 7 real reflections (the 7th, 14th, 21st, 28th check-in in this
      // cycle). completedStage and reportExists were resolved above.
      if (completedStage) {
        if (!reportExists || reportExists === 0) {
          const reportController = new AbortController()
          setTimeout(() => reportController.abort(), 20000)
          backgroundTasks.push(fetch(`${supabaseUrl}/functions/v1/generate-report`, {
            method: 'POST',
            signal: reportController.signal,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ user_id, cycle_id, stage: completedStage }),
          }).catch(() => { /* non-fatal */ }))
        }
      }
    }

    // 14. Read back the identity vector's pattern flags for the two touched
    // themes (state as of before this check-in — update-identity-vector above
    // runs fire-and-forget, so today's answer isn't folded in yet). This is
    // what lets the client explain *why* today's reading looks the way it
    // does, e.g. "Focus has been drifting for 3 days," instead of a bare
    // status word. Null for users with no identity vector yet — never blocks.
    // identityVectorRow was already fetched in the parallel batch above.
    let theme1PatternFlag: string | null = null
    let theme2PatternFlag: string | null = null
    if (chosenOption) {
      const flags = (identityVectorRow as any)?.pattern_flags ?? {}
      theme1PatternFlag = flags[chosenOption.theme_1_code] ?? null
      theme2PatternFlag = flags[chosenOption.theme_2_code] ?? null
    }

    // Keep the isolate alive until background jobs finish (or their own
    // timeouts fire) instead of letting the runtime tear it down the moment
    // this response is sent.
    if (backgroundTasks.length > 0 && typeof EdgeRuntime !== 'undefined') {
      EdgeRuntime.waitUntil(Promise.all(backgroundTasks))
    }

    return new Response(
      JSON.stringify({ alignmentScore, statusLabel, trend, theme1PatternFlag, theme2PatternFlag }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
