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
  IAP: 'Direction',
  EWB: 'Energy',
  FAF: 'Attention',
  RC:  'Connection',
  GAL: 'Growth',
  RA:  'Movement',
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

// Drift Alert system — which signal types are worth a proactive push, not
// just a passive card the next time the app is opened. Mirrors
// CONCERNING_SIGNAL_TYPES in lib/constants.ts (separate runtime, kept in
// sync manually — Deno can't import that React Native file).
const CONCERNING_SIGNAL_TYPES = ['misalignment_repeating', 'energy_low', 'relational_friction']

async function sendExpoPush(token: string, title: string, body: string) {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: 'default',
        data: { type: 'drift_alert' },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Fire a push notification using the weekly signal's own display_text —
// it's already localized and written in the brand's "signal, not verdict"
// voice, so no separate notification copy is needed. Non-fatal: a failure
// here must never affect the weekly_signals write, since the in-app
// DriftSignalCard is the reliable fallback surface regardless.
async function notifyIfConcerning(
  supabase: any,
  userId: string,
  signalType: string,
  displayText: string
) {
  if (!CONCERNING_SIGNAL_TYPES.includes(signalType)) return
  try {
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
    if (!tokens?.length) return
    await Promise.all(tokens.map((t: any) => sendExpoPush(t.token, 'Mirar', displayText)))
  } catch (err) {
    console.error('[Mirar] drift alert push failed:', err)
  }
}

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

    // Language preference — weekly signal text is generated in the user's language
    const { data: userRow } = await supabase
      .from('users')
      .select('language')
      .eq('id', user_id)
      .maybeSingle()
    const language = userRow?.language ?? 'en'

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      // Fallback: deterministic signal without LLM
      return await generateDeterministicSignal(
        supabase, user_id, cycle_id, cycle_number ?? 1, week_number ?? 1, themeScores ?? [], language
      )
    }

    // ── Build prompt ──────────────────────────────────────────────────────────
    const themeLines = (themeScores ?? [])
      .filter((t: any) => t.signal_count > 0)
      .sort((a: any, b: any) => (a.average_score ?? 0) - (b.average_score ?? 0))
      .map((t: any) => `- ${THEME_NAMES[t.theme_code] ?? t.theme_code}: ${t.status}`)
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

Valid signal_type values: ${VALID_SIGNAL_TYPES.join(', ')}${
      language === 'en' ? '' :
      `\n\nWrite display_text in ${language === 'hi' ? 'natural everyday Hindi (Devanagari script)' : 'natural everyday Gujarati (Gujarati script)'}. signal_type stays in English.`
    }`

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
    let displayText = FALLBACK_TEXT[language] ?? FALLBACK_TEXT.en

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

// ── Localized fallback strings (used when LLM is unavailable or fails) ───────
const FALLBACK_TEXT: Record<string, string> = {
  en: 'Your signals showed a pattern this week.',
  hi: 'इस हफ़्ते आपके संकेतों में एक पैटर्न दिखा।',
  gu: 'આ અઠવાડિયે તમારા સંકેતોમાં એક પેટર્ન દેખાઈ.',
}

const DETERMINISTIC_TEXT: Record<string, Record<string, string>> = {
  multiple_low: {
    en: 'Multiple themes held low this week. The pattern is visible.',
    hi: 'इस हफ़्ते कई क्षेत्रों के संकेत धीमे रहे। पैटर्न दिखाई दे रहा है।',
    gu: 'આ અઠવાડિયે ઘણા ક્ષેત્રોના સંકેત ધીમા રહ્યા. પેટર્ન દેખાય છે.',
  },
  energy_low: {
    en: 'Energy signals held low this week.',
    hi: 'इस हफ़्ते ऊर्जा के संकेत धीमे रहे।',
    gu: 'આ અઠવાડિયે ઊર્જાના સંકેત ધીમા રહ્યા.',
  },
  steady: {
    en: 'Your signals held steadily this week.',
    hi: 'इस हफ़्ते आपके संकेत स्थिर रहे।',
    gu: 'આ અઠવાડિયે તમારા સંકેત સ્થિર રહ્યા.',
  },
  forming: {
    en: 'Your signals are still forming a pattern.',
    hi: 'आपके संकेत अभी पैटर्न बना रहे हैं।',
    gu: 'તમારા સંકેત હજી પેટર્ન બનાવી રહ્યા છે.',
  },
  focus_variable: {
    en: 'Focus signals showed variability this week.',
    hi: 'इस हफ़्ते ध्यान के संकेतों में उतार-चढ़ाव रहा।',
    gu: 'આ અઠવાડિયે ધ્યાનના સંકેતોમાં વધઘટ રહી.',
  },
  relational_friction: {
    en: 'Relational signals held low this week.',
    hi: 'इस हफ़्ते रिश्तों के संकेत धीमे रहे।',
    gu: 'આ અઠવાડિયે સંબંધોના સંકેત ધીમા રહ્યા.',
  },
  resilience_holding: {
    en: 'Resilience signals held stable this week.',
    hi: 'इस हफ़्ते सहनशीलता के संकेत स्थिर रहे।',
    gu: 'આ અઠવાડિયે સ્થિતિસ્થાપકતાના સંકેત સ્થિર રહ્યા.',
  },
}

// ── Deterministic fallback (no LLM) ──────────────────────────────────────────
async function generateDeterministicSignal(
  supabase: any,
  user_id: string,
  cycle_id: string,
  cycle_number: number,
  week_number: number,
  themeScores: any[],
  language: string = 'en'
) {
  const underLoad = themeScores.filter((t: any) => t.status === 'Under Load')
  const aligned   = themeScores.filter((t: any) => t.status === 'Aligned')

  const pick = (key: string) =>
    DETERMINISTIC_TEXT[key]?.[language] ?? DETERMINISTIC_TEXT[key]?.en

  let signalType = 'signals_mixed'
  let displayText = FALLBACK_TEXT[language] ?? FALLBACK_TEXT.en

  if (underLoad.length >= 3) {
    signalType = 'energy_low'
    displayText = pick('multiple_low')
  } else if (underLoad.length === 1 && underLoad[0]?.theme_code === 'EWB') {
    signalType = 'energy_low'
    displayText = pick('energy_low')
  } else if (aligned.length >= 4) {
    signalType = 'decision_clarity_increasing'
    displayText = pick('steady')
  } else if (aligned.length === 0 && underLoad.length === 0) {
    signalType = 'signals_mixed'
    displayText = pick('forming')
  } else if (underLoad.some((t: any) => t.theme_code === 'FAF')) {
    signalType = 'focus_variable'
    displayText = pick('focus_variable')
  } else if (underLoad.some((t: any) => t.theme_code === 'RC')) {
    signalType = 'relational_friction'
    displayText = pick('relational_friction')
  } else if (aligned.some((t: any) => t.theme_code === 'RA')) {
    signalType = 'resilience_holding'
    displayText = pick('resilience_holding')
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

  // Drift Alert: proactive push for signal types worth naming now, not just
  // whenever the user next opens the app. Fire-and-forget from the response's
  // perspective, but kept alive via waitUntil so the isolate isn't torn down
  // before the push actually sends — same pattern as process-checkin's
  // background tasks. Never blocks or fails the response either way, since
  // the in-app DriftSignalCard is the reliable fallback surface.
  const pushTask = notifyIfConcerning(supabase, user_id, signalType, displayText)
  if (typeof EdgeRuntime !== 'undefined') {
    EdgeRuntime.waitUntil(pushTask)
  }

  return new Response(
    JSON.stringify({ signal_type: signalType, display_text: displayText }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
