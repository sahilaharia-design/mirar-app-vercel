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

    // Resolve once — every question/option field this function returns must
    // respect it, and a curated question generated in one language must
    // still fall back to English rather than showing blank/broken text.
    const { data: userRow } = await supabase
      .from('users')
      .select('language')
      .eq('id', user_id)
      .maybeSingle()
    const language: 'en' | 'hi' | 'gu' =
      userRow?.language === 'hi' || userRow?.language === 'gu' ? userRow.language : 'en'

    // 1. Check if today's question was already selected (idempotent)
    const { data: todayHistory } = await supabase
      .from('question_history')
      .select('question_id')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .eq('day_number', current_day)
      .maybeSingle()

    if (todayHistory?.question_id) {
      return serveQuestion(supabase, todayHistory.question_id, corsHeaders, language)
    }

    // 1b. Attempt a personalized, AI-generated question once the user's identity
    // vector has enough history. New users (no vector yet, or fewer than ~1
    // cycle of signal) fall straight through to curated selection below —
    // unchanged from today. Any generation failure also falls through silently;
    // a check-in must never be blocked by an AI call.
    const { data: identityVector } = await supabase
      .from('alignment_identity_vectors')
      .select('velocity_vector, pattern_flags, personalization_depth')
      .eq('user_id', user_id)
      .maybeSingle()

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

    // 4d. Attempt a personalized, AI-generated question — only once there's
    // enough identity-vector history to personalize meaningfully. Respects the
    // exact same stage/depth/gentleness rules just computed above.
    if ((identityVector?.personalization_depth ?? 0) >= 1) {
      const generated = await tryGenerateQuestion(supabase, {
        user_id,
        current_day,
        stage,
        stageAffinity,
        maxDepth,
        underLoadThemes,
        journalAffinity,
        velocity_vector: identityVector?.velocity_vector ?? {},
        pattern_flags: identityVector?.pattern_flags ?? {},
        language,
      })
      if (generated) {
        await recordHistory(supabase, user_id, generated.id, cycle_id, current_day)
        return serveQuestion(supabase, generated.id, corsHeaders, language)
      }
      // Falls through to curated selection below on any validation/API failure.
    }

    // 5. Fetch candidate questions — curated bank only (user_id IS NULL).
    // Explicitly excludes other users' private generated questions.
    const { data: candidates } = await supabase
      .from('questions')
      .select('id, theme_1, theme_2, depth_level, stage_affinity, journal_prompt')
      .is('user_id', null)
      .eq('active', true)
      .lte('depth_level', maxDepth)
      .in('stage_affinity', [stageAffinity, 'any'])

    if (!candidates || candidates.length === 0) {
      // Fallback: any active curated question
      const { data: fallback } = await supabase
        .from('questions')
        .select('id')
        .is('user_id', null)
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
      return serveQuestion(supabase, fallback.id, corsHeaders, language)
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
    return serveQuestion(supabase, selected.id, corsHeaders, language)

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Overwrites the base (English) text fields in place with the `_hi`/`_gu`
// column when one exists for the given language, falling back to the base
// field otherwise (missing translation, or language is already 'en'). This
// keeps every caller — client and edge function alike — simple: read
// `question.prompt_text` / `option.option_text` and trust it's already in
// the right language.
function localize<T extends Record<string, any>>(row: T, fields: string[], language: string): T {
  if (language === 'en') return row
  for (const field of fields) {
    const localized = row[`${field}_${language}`]
    if (typeof localized === 'string' && localized.trim().length > 0) {
      row[field] = localized
    }
  }
  return row
}

const QUESTION_LOCALIZED_FIELDS = ['prompt_text', 'tomorrow_tease', 'mirror_glimmer', 'journal_prompt']
const OPTION_LOCALIZED_FIELDS = ['option_text']

async function serveQuestion(supabase: any, questionId: string, corsHeaders: any, language: string) {
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

  localize(question, QUESTION_LOCALIZED_FIELDS, language)
  question.options = (question.options ?? [])
    .map((opt: any) => localize(opt, OPTION_LOCALIZED_FIELDS, language))
    .sort((a: any, b: any) => a.option_number - b.option_number)

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

const THEME_CODES = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'] as const
const THEME_NAMES: Record<string, string> = {
  IAP: 'Direction', EWB: 'Energy', FAF: 'Attention',
  RC: 'Connection', GAL: 'Growth', RA: 'Movement',
}
const LEVEL_POINTS: Record<string, number> = { Low: 1, Medium: 2, High: 3 }

// Generates a genuinely new question + 5 options for one specific user, using
// their long-term identity vector. Returns null on ANY failure — validation,
// API error, timeout, malformed JSON — so the caller can silently fall back
// to curated selection. A check-in must never be blocked by an AI call.
async function tryGenerateQuestion(
  supabase: any,
  ctx: {
    user_id: string
    current_day: number
    stage: number
    stageAffinity: string
    maxDepth: number
    underLoadThemes: Set<string>
    journalAffinity: boolean
    velocity_vector: Record<string, number>
    pattern_flags: Record<string, string>
    language: 'en' | 'hi' | 'gu'
  }
): Promise<{ id: string } | null> {
  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) return null

    // Pick focus themes ourselves — never trust Claude's output for the
    // question row's own theme_1/theme_2 columns, only for per-option data.
    const ranked = [...THEME_CODES].sort((a, b) => {
      const aTension = ctx.pattern_flags[a] === 'recurring_tension' ? -2 : 0
      const bTension = ctx.pattern_flags[b] === 'recurring_tension' ? -2 : 0
      const aVel = ctx.velocity_vector[a] ?? 0
      const bVel = ctx.velocity_vector[b] ?? 0
      return (aTension + aVel) - (bTension + bVel)
    })
    const focusTheme1 = ranked[0]
    const focusTheme2 = ranked.find((c) => c !== focusTheme1) ?? ranked[1]

    const isUnderLoadFocus = ctx.underLoadThemes.has(focusTheme1) || ctx.pattern_flags[focusTheme1] === 'recurring_tension'
    const depthLevel = isUnderLoadFocus ? 1 : ctx.maxDepth

    // Recent prompts (curated or previously generated) to avoid repeating.
    const { data: recentHistoryRows } = await supabase
      .from('question_history')
      .select('question_id')
      .eq('user_id', ctx.user_id)
      .order('served_at', { ascending: false })
      .limit(14)
    const recentQuestionIds = (recentHistoryRows ?? []).map((r: any) => r.question_id)
    let recentPrompts: string[] = []
    if (recentQuestionIds.length > 0) {
      const { data: recentQs } = await supabase
        .from('questions')
        .select('prompt_text')
        .in('id', recentQuestionIds)
      recentPrompts = (recentQs ?? []).map((q: any) => q.prompt_text).filter(Boolean)
    }

    const patternLines = THEME_CODES
      .map((code) => {
        const flag = ctx.pattern_flags[code]
        if (!flag) return null
        return `- ${THEME_NAMES[code]}: ${flag.replace('_', ' ')}`
      })
      .filter(Boolean)
      .join('\n')

    const LANGUAGE_NAMES: Record<string, string> = { hi: 'Hindi', gu: 'Gujarati' }
    const languageInstruction = ctx.language === 'en'
      ? ''
      : `\n\nWrite prompt_text and every option_text entirely in ${LANGUAGE_NAMES[ctx.language]} (native script, not transliteration). Keep the same calm, observational tone in that language — do not translate word-for-word from English, write it naturally.`

    const systemPrompt = `You are the question-writing engine of Mirar — a daily emotional-hygiene mirror, not a therapy or coaching app.

You write exactly ONE daily check-in question with exactly 5 answer options for a specific returning user, based on what their long-term signal history shows.

Use only this vocabulary style: signal, alignment, drift, calibration, check-in, internal state, notice, present, holding, shifting.
Never use: heal, healing, journal, journaling, therapy, motivational, should, fix, improve, better, worse, coach, advise.

The question must read like a natural continuation of a daily practice — calm, observational, never leading toward a "right" answer. Options must span a real spectrum from low signal to high signal on the focus themes, not just positive-to-negative wording.${languageInstruction}

Respond with ONLY raw JSON, no markdown fences, no prose, matching exactly this shape:
{"prompt_text": "...", "options": [{"option_text": "...", "theme_1_code": "XXX", "theme_2_code": "XXX"}, ... exactly 5 total]}

theme codes must be exactly one of: IAP, EWB, FAF, RC, GAL, RA.`

    const userPrompt = `Write today's question for this user.

Primary focus theme: ${THEME_NAMES[focusTheme1]} (${focusTheme1})${isUnderLoadFocus ? ' — this theme needs a GENTLE question, do not probe deeply' : ''}
Secondary theme: ${THEME_NAMES[focusTheme2]} (${focusTheme2})
Stage of practice: ${ctx.stageAffinity}
Depth allowed: ${depthLevel} of 3 (1 = gentle/surface, 3 = deep/probing)
${patternLines ? `Recent long-term patterns:\n${patternLines}` : 'No strong long-term pattern yet.'}
${ctx.journalAffinity ? 'This user tends to write reflective notes — a slightly more open-ended prompt suits them.' : ''}

Do not repeat or closely paraphrase any of these previously-asked questions:
${recentPrompts.map((p) => `- ${p}`).join('\n') || '(none yet)'}

Return the JSON now.`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    let response: Response
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 600,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })
    } finally {
      clearTimeout(timeout)
    }
    if (!response.ok) return null

    const result = await response.json()
    const rawText: string = result.content?.[0]?.text?.trim() ?? ''
    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim()

    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return null
    }

    // ── Strict validation — any failure here silently falls back to curated ──
    if (typeof parsed?.prompt_text !== 'string' || parsed.prompt_text.length < 8 || parsed.prompt_text.length > 300) {
      return null
    }
    if (!Array.isArray(parsed.options) || parsed.options.length !== 5) {
      return null
    }
    const validatedOptions: Array<{
      option_text: string
      theme_1_code: string
      theme_1_level: string
      theme_1_points: number
      theme_2_code: string
      theme_2_level: string
      theme_2_points: number
    }> = []
    for (const opt of parsed.options) {
      if (typeof opt?.option_text !== 'string' || opt.option_text.length < 3 || opt.option_text.length > 200) return null
      if (!THEME_CODES.includes(opt.theme_1_code) || !THEME_CODES.includes(opt.theme_2_code)) return null
      // Levels/points are derived server-side from a fixed spread across the 5
      // options rather than trusted from the model — guarantees a real Low→High
      // spectrum and removes an entire class of malformed-output risk.
      validatedOptions.push({
        option_text: opt.option_text,
        theme_1_code: opt.theme_1_code,
        theme_1_level: 'Medium',
        theme_1_points: 2,
        theme_2_code: opt.theme_2_code,
        theme_2_level: 'Medium',
        theme_2_points: 2,
      })
    }
    // Assign a real Low/Medium/High spread across the 5 validated options.
    const spread = ['Low', 'Low', 'Medium', 'High', 'High']
    validatedOptions.forEach((opt, i) => {
      const level = spread[i]
      opt.theme_1_level = level
      opt.theme_1_points = LEVEL_POINTS[level]
      opt.theme_2_level = level
      opt.theme_2_points = LEVEL_POINTS[level]
    })

    const dayNumber = Math.max(1, Math.min(28, ctx.current_day))

    const { data: newQuestion, error: qErr } = await supabase
      .from('questions')
      .insert({
        user_id: ctx.user_id,
        source: 'generated',
        day_number: dayNumber,
        stage: ctx.stage,
        stage_affinity: ctx.stageAffinity,
        depth_level: depthLevel,
        active: true,
        prompt_text: parsed.prompt_text,
        theme_1: focusTheme1,
        theme_2: focusTheme2,
      })
      .select('id')
      .single()

    if (qErr || !newQuestion) return null

    const optionRows = validatedOptions.map((opt, i) => ({
      question_id: newQuestion.id,
      option_number: i + 1,
      ...opt,
    }))
    const { error: optErr } = await supabase.from('options').insert(optionRows)
    if (optErr) return null

    return { id: newQuestion.id }
  } catch {
    return null
  }
}
