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

    const { user_id, cycle_id, current_day } = await req.json()

    if (!user_id || !cycle_id || !current_day) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Check if today's question was already selected (idempotent)
    const { data: todayHistory } = await supabase
      .from('question_history')
      .select('question_id')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .eq('day_number', current_day)
      .maybeSingle()

    if (todayHistory?.question_id) {
      return serveQuestion(supabase, todayHistory.question_id, corsHeaders)
    }

    // 2. Get questions served in last 14 days (avoid repeats)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: recentHistory } = await supabase
      .from('question_history')
      .select('question_id')
      .eq('user_id', user_id)
      .gte('served_at', fourteenDaysAgo.toISOString())

    const recentIds = new Set((recentHistory ?? []).map((h: any) => h.question_id))

    // 3. Compute theme coverage from last 7 days of responses
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentResponses } = await supabase
      .from('responses')
      .select('option_id')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .gte('submitted_at', sevenDaysAgo.toISOString())

    const themeCoverage: Record<string, number> = {
      IAP: 0, EWB: 0, FAF: 0, RC: 0, GAL: 0, RA: 0,
    }

    if (recentResponses && recentResponses.length > 0) {
      const { data: optionData } = await supabase
        .from('options')
        .select('theme_1_code, theme_2_code')
        .in('id', recentResponses.map((r: any) => r.option_id))

      for (const opt of optionData ?? []) {
        themeCoverage[opt.theme_1_code] = (themeCoverage[opt.theme_1_code] ?? 0) + 1
        themeCoverage[opt.theme_2_code] = (themeCoverage[opt.theme_2_code] ?? 0) + 1
      }
    }

    // 4. Determine stage + affinity + base max depth
    const stage = current_day <= 7 ? 1 : current_day <= 14 ? 2 : current_day <= 21 ? 3 : 4
    const affinityMap: Record<number, string> = {
      1: 'awareness', 2: 'realignment', 3: 'action', 4: 'reflection',
    }
    const stageAffinity = affinityMap[stage]
    let maxDepth = stage === 1 ? 1 : stage === 4 ? 3 : 2

    // 4a. Signal trajectory: fetch current theme scores for this stage
    const { data: themeScores } = await supabase
      .from('theme_scores')
      .select('theme_code, status, signal_count')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .eq('stage', stage)

    // Themes Under Load with ≥3 signals — these need gentle questions (depth 1)
    const underLoadThemes = new Set(
      (themeScores ?? [])
        .filter((t: any) => t.status === 'Under Load' && t.signal_count >= 3)
        .map((t: any) => t.theme_code)
    )

    // If 4+ themes are Aligned, expand depth ceiling by 1 (user is stable, go deeper)
    const alignedCount = (themeScores ?? []).filter((t: any) => t.status === 'Aligned').length
    if (alignedCount >= 4) maxDepth = Math.min(maxDepth + 1, 3)

    // 4b. Latest alignment score — if consistently high, allow deeper exploration
    const today = new Date().toISOString().split('T')[0]
    const { data: latestAlign } = await supabase
      .from('alignment_scores')
      .select('score')
      .eq('user_id', user_id)
      .eq('date', today)
      .maybeSingle()
    if (latestAlign && latestAlign.score >= 70) maxDepth = Math.min(maxDepth + 1, 3)

    // 4c. Journal affinity — if user writes notes >50% of this stage's check-ins, prefer prompts with journal_prompt
    const stageStartDay = (stage - 1) * 7 + 1
    const { data: stageResponses } = await supabase
      .from('responses')
      .select('journal_text')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .gte('day_number', stageStartDay)
      .lte('day_number', stageStartDay + 6)

    const totalStageResponses = (stageResponses ?? []).length
    const journalResponses = (stageResponses ?? []).filter((r: any) => r.journal_text?.trim()).length
    const journalAffinity = totalStageResponses >= 2 && journalResponses / totalStageResponses > 0.5

    // 5. Fetch candidate questions
    const { data: candidates } = await supabase
      .from('questions')
      .select('id, theme_1, theme_2, depth_level, stage_affinity, journal_prompt')
      .eq('active', true)
      .lte('depth_level', maxDepth)
      .in('stage_affinity', [stageAffinity, 'any'])

    if (!candidates || candidates.length === 0) {
      // Fallback: any active question
      const { data: fallback } = await supabase
        .from('questions')
        .select('id')
        .eq('active', true)
        .limit(1)
        .single()

      if (!fallback) {
        return new Response(
          JSON.stringify({ error: 'No questions available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      await recordHistory(supabase, user_id, fallback.id, cycle_id, current_day)
      return serveQuestion(supabase, fallback.id, corsHeaders)
    }

    // 6. Score candidates
    const underRepresented = Object.entries(themeCoverage)
      .filter(([, count]) => count < 2)
      .map(([code]) => code)

    const unseen = candidates.filter((q: any) => !recentIds.has(q.id))
    const pool = unseen.length > 0 ? unseen : candidates // fallback to all if all seen recently

    const scored = pool
      .map((q: any) => {
        let score = 0
        if (underRepresented.includes(q.theme_1)) score += 3
        if (underRepresented.includes(q.theme_2)) score += 2
        if (q.stage_affinity === stageAffinity) score += 2

        // Under Load bonus: surface the struggling theme, but force gentle depth (depth 1 only)
        const isUnderLoad = underLoadThemes.has(q.theme_1) || underLoadThemes.has(q.theme_2)
        if (isUnderLoad) {
          if (q.depth_level <= 1) score += 3   // prefer gentle question for this theme
          else score -= 2                        // penalise deep questions on Under Load theme
        }

        // Journal affinity: if user tends to write, prefer questions with journal prompts
        if (journalAffinity && q.journal_prompt) score += 2

        score += Math.random() * 0.5 // slight randomness among equals
        return { ...q, score }
      })
      .sort((a: any, b: any) => b.score - a.score)

    // Pick randomly from top 3
    const topN = scored.slice(0, 3)
    const selected = topN[Math.floor(Math.random() * topN.length)]

    await recordHistory(supabase, user_id, selected.id, cycle_id, current_day)
    return serveQuestion(supabase, selected.id, corsHeaders)

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function serveQuestion(supabase: any, questionId: string, corsHeaders: any) {
  const { data: question, error } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('id', questionId)
    .single()

  if (error || !question) {
    return new Response(
      JSON.stringify({ error: 'Question not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  question.options = (question.options ?? []).sort(
    (a: any, b: any) => a.option_number - b.option_number
  )

  return new Response(
    JSON.stringify({ question }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function recordHistory(
  supabase: any,
  userId: string,
  questionId: string,
  cycleId: string,
  dayNumber: number
) {
  await supabase.from('question_history').insert({
    user_id: userId,
    question_id: questionId,
    cycle_id: cycleId,
    day_number: dayNumber,
  })
}
