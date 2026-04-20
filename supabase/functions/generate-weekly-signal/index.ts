// @ts-nocheck
// generate-weekly-signal
// Called after every 7th completed reflection in a cycle.
// Uses Claude Haiku to identify the dominant signal pattern for the week,
// stores it in weekly_signals, and updates user_state.latest_signal_text.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const THEME_NAMES: Record<string, string> = {
  IAP: 'Inner Alignment & Purpose',
  EWB: 'Energy & Well-being',
  FAF: 'Focus & Flow',
  RC:  'Relational Capital',
  GAL: 'Growth & Learning',
  RA:  'Resilience & Action',
}

const VALID_SIGNAL_TYPES = [
  'attention_shift',
  'energy_stabilization',
  'decision_clarity_increasing',
  'misalignment_repeating',
  'resilience_holding',
  'focus_variable',
  'relational_friction',
  'growth_active',
  'boundary_forming',
  'energy_low',
  'purpose_steady',
  'signals_mixed',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Service-role key — this is called server-to-server only
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, cycle_id, cycle_number, week_number } = await req.json()

    if (!user_id || !cycle_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Fetch this week's theme scores for the cycle ──────────────────────────
    // week_number maps to stage (1-4). Each week covers 7 reflections.
    const stage = week_number ?? 1
    const { data: themeScores } = await supabase
      .from('theme_scores')
      .select('theme_code, status, average_score, signal_count')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .eq('stage', stage)

    // ── Fetch last 7 alignment scores for trend context ───────────────────────
    const { data: recentAlignments } = await supabase
      .from('alignment_scores')
      .select('score, status_label, date')
      .eq('user_id', user_id)
      .order('date', { ascending: false })
      .limit(7)

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      // Fallback: deterministic signal without LLM
      return await generateDeterministicSignal(
        supabase, user_id, cycle_id, cycle_number ?? 1, week_number ?? 1, themeScores ?? []
      )
    }

    // ── Build prompt ──────────────────────────────────────────────────────────
    const themeLines = (themeScores ?? [])
      .filter((t: any) => t.signal_count > 0)
      .sort((a: any, b: any) => (a.average_score ?? 0) - (b.average_score ?? 0))
      .map((t: any) => `- ${THEME_NAMES[t.theme_code] ?? t.theme_code}: ${t.status} (avg ${t.average_score?.toFixed(1)})`)
      .join('\n')

    const alignmentTrend = (recentAlignments ?? []).length >= 3
      ? (() => {
          const scores = (recentAlignments ?? []).map((a: any) => a.score).reverse()
          const first = scores[0]
          const last = scores[scores.length - 1]
          const diff = last - first
          return diff > 5 ? 'rising' : diff < -5 ? 'declining' : 'stable'
        })()
      : 'forming'

    const systemPrompt = `You are Mirar's internal signal engine. You analyze 7 days of alignment data and identify the single most significant signal pattern.

Return ONLY valid JSON. No markdown. No explanation. Example:
{"signal_type":"energy_stabilization","display_text":"Energy signals held more steadily this week."}

Rules for display_text:
- One sentence only
- Mirror language: signal, reading, showing, holding, shifting, present, pattern
- Never use: advice, should, try, improve, heal, better, worse, good, bad
- Not celebratory, not alarming — just observational
- Calm and precise

Valid signal_type values: ${VALID_SIGNAL_TYPES.join(', ')}`

    const userPrompt = `Week ${week_number ?? 1} of Cycle ${cycle_number ?? 1}:

Theme signal status this week:
${themeLines || 'Calibrating across themes.'}

Overall alignment trend: ${alignmentTrend}

Identify the single most significant signal pattern from this week. Return JSON only.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 80,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    let signalType = 'signals_mixed'
    let displayText = 'Your signals showed a pattern this week.'

    if (response.ok) {
      const result = await response.json()
      const raw = result.content?.[0]?.text?.trim() ?? ''
      try {
        const parsed = JSON.parse(raw)
        if (VALID_SIGNAL_TYPES.includes(parsed.signal_type)) {
          signalType = parsed.signal_type
        }
        if (parsed.display_text?.length > 10) {
          displayText = parsed.display_text
        }
      } catch {
        // Use defaults
      }
    }

    return await storeWeeklySignal(
      supabase, user_id, cycle_id, cycle_number ?? 1, week_number ?? 1,
      signalType, displayText, themeScores ?? []
    )

  } catch (err) {
    console.error('generate-weekly-signal error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ── Deterministic fallback (no LLM) ──────────────────────────────────────────
async function generateDeterministicSignal(
  supabase: any,
  user_id: string,
  cycle_id: string,
  cycle_number: number,
  week_number: number,
  themeScores: any[]
) {
  const underLoad = themeScores.filter((t: any) => t.status === 'Under Load')
  const aligned   = themeScores.filter((t: any) => t.status === 'Aligned')

  let signalType = 'signals_mixed'
  let displayText = 'Your signals showed a pattern this week.'

  if (underLoad.length >= 3) {
    signalType = 'energy_low'
    displayText = 'Multiple themes held low this week. The pattern is visible.'
  } else if (underLoad.length === 1 && underLoad[0]?.theme_code === 'EWB') {
    signalType = 'energy_low'
    displayText = 'Energy signals held low this week.'
  } else if (aligned.length >= 4) {
    signalType = 'decision_clarity_increasing'
    displayText = 'Your signals held steadily this week.'
  } else if (aligned.length === 0 && underLoad.length === 0) {
    signalType = 'signals_mixed'
    displayText = 'Your signals are still forming a pattern.'
  } else if (underLoad.some((t: any) => t.theme_code === 'FAF')) {
    signalType = 'focus_variable'
    displayText = 'Focus signals showed variability this week.'
  } else if (underLoad.some((t: any) => t.theme_code === 'RC')) {
    signalType = 'relational_friction'
    displayText = 'Relational signals held low this week.'
  } else if (aligned.some((t: any) => t.theme_code === 'RA')) {
    signalType = 'resilience_holding'
    displayText = 'Resilience signals held stable this week.'
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  return await storeWeeklySignal(
    supabase, user_id, cycle_id, cycle_number, week_number,
    signalType, displayText, themeScores
  )
}

// ── Persist and return ────────────────────────────────────────────────────────
async function storeWeeklySignal(
  supabase: any,
  user_id: string,
  cycle_id: string,
  cycle_number: number,
  week_number: number,
  signalType: string,
  displayText: string,
  themeScores: any[]
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  const internalNotes = {
    theme_statuses: themeScores.map((t: any) => ({
      code: t.theme_code,
      status: t.status,
      avg: t.average_score,
    })),
  }

  // Upsert weekly signal (one per user/cycle/week)
  await supabase.from('weekly_signals').upsert({
    user_id,
    cycle_id,
    cycle_number,
    week_number,
    reflection_count: 7,
    signal_type: signalType,
    display_text: displayText,
    internal_notes: internalNotes,
  }, { onConflict: 'user_id,cycle_id,week_number', ignoreDuplicates: false })

  // Update user_state with latest signal text
  await supabase
    .from('user_state')
    .update({ latest_signal_text: displayText, updated_at: new Date().toISOString() })
    .eq('user_id', user_id)

  return new Response(
    JSON.stringify({ signal_type: signalType, display_text: displayText }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
