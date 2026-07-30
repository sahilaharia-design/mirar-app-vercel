// @ts-nocheck
// sync-user-state
// Runs post-check-in. Recomputes context_message, streak_length, total_reflections,
// current_cycle_day/stage, and writes them to user_state in a single upsert.
// Uses mirror-language copy — observational, not motivational.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Context messages indexed by cycle_day (1-28).
// Mirror language: observational, no advice, no motivation, no celebration.
const CONTEXT_STRINGS: Record<string, Record<string, string>> = {
  en: {
    stage1: 'Notice', stage2: 'Adjust', stage3: 'Move', stage4: 'Reflect',
    firstMirror: 'Your first mirror is forming.',
    newMirror: 'A new mirror begins.',
    firstPattern: 'A first pattern is ready to notice.',
    holdingShape: 'Your recent reflections are beginning to hold a shape.',
    threeWeeks: 'Three weeks of reflections are now visible.',
    complete: 'This reflection pattern is complete.',
    streakLong: (label: string, n: number) => `${label}. ${n} recent reflections in a row.`,
    streakShort: (label: string) => `${label}. Your recent reflections are holding a thread.`,
    stageBegins: (label: string) => `${label} begins.`,
    dailyMirror: (label: string) => `Today’s mirror · ${label}.`,
  },
  hi: {
    stage1: 'नोटिस', stage2: 'समायोजन', stage3: 'गति', stage4: 'चिंतन',
    firstMirror: 'आपका पहला दर्पण बन रहा है।',
    newMirror: 'एक नया दर्पण शुरू होता है।',
    firstPattern: 'पहला पैटर्न देखने के लिए तैयार है।',
    holdingShape: 'आपके हाल के प्रतिबिंब आकार लेने लगे हैं।',
    threeWeeks: 'तीन हफ्तों के प्रतिबिंब अब दिखाई दे रहे हैं।',
    complete: 'यह प्रतिबिंब पैटर्न पूरा हो गया है।',
    streakLong: (label: string, n: number) => `${label}। लगातार ${n} हाल के प्रतिबिंब।`,
    streakShort: (label: string) => `${label}। आपके हाल के प्रतिबिंब एक धागा थामे हुए हैं।`,
    stageBegins: (label: string) => `${label} शुरू होता है।`,
    dailyMirror: (label: string) => `आज का दर्पण · ${label}।`,
  },
  gu: {
    stage1: 'નોટિસ', stage2: 'ગોઠવણ', stage3: 'ગતિ', stage4: 'ચિંતન',
    firstMirror: 'તમારો પ્રથમ દર્પણ બની રહ્યો છે.',
    newMirror: 'એક નવો દર્પણ શરૂ થાય છે.',
    firstPattern: 'પહેલી પેટર્ન નોંધવા માટે તૈયાર છે.',
    holdingShape: 'તમારા તાજેતરના પ્રતિબિંબ આકાર લેવા લાગ્યા છે.',
    threeWeeks: 'ત્રણ અઠવાડિયાના પ્રતિબિંબ હવે દેખાઈ રહ્યા છે.',
    complete: 'આ પ્રતિબિંબ પેટર્ન પૂર્ણ થઈ ગઈ છે.',
    streakLong: (label: string, n: number) => `${label}. સતત ${n} તાજેતરના પ્રતિબિંબ.`,
    streakShort: (label: string) => `${label}. તમારા તાજેતરના પ્રતિબિંબ એક દોરો પકડી રહ્યા છે.`,
    stageBegins: (label: string) => `${label} શરૂ થાય છે.`,
    dailyMirror: (label: string) => `આજનો દર્પણ · ${label}.`,
  },
}

function buildContextMessage(cycleDay: number, cycleNumber: number, streakLength: number, lang: string): string {
  const strings = CONTEXT_STRINGS[lang] ?? CONTEXT_STRINGS.en
  const stage =
    cycleDay <= 7  ? 1 :
    cycleDay <= 14 ? 2 :
    cycleDay <= 21 ? 3 : 4

  const stageLabel = strings[`stage${stage}`]

  if (cycleDay === 1 && cycleNumber === 1) return strings.firstMirror
  if (cycleDay === 1) return strings.newMirror
  if (cycleDay === 7)  return strings.firstPattern
  if (cycleDay === 14) return strings.holdingShape
  if (cycleDay === 21) return strings.threeWeeks
  if (cycleDay === 28) return strings.complete

  const stageStart = (stage - 1) * 7 + 1
  const dayInStage = cycleDay - stageStart + 1

  if (streakLength >= 7) {
    return strings.streakLong(stageLabel, streakLength)
  }
  if (streakLength >= 3) {
    return strings.streakShort(stageLabel)
  }
  if (dayInStage === 1) {
    return strings.stageBegins(stageLabel)
  }
  return strings.dailyMirror(stageLabel)
}

// Compute consecutive-day streak from a sorted (DESC) list of ISO date strings.
function computeStreak(dates: string[]): number {
  if (!dates.length) return 0

  const unique = [...new Set(dates)].sort((a, b) => (a > b ? -1 : 1))
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Streak must include today or yesterday to be considered active
  if (unique[0] !== today && unique[0] !== yesterday) return 0

  let streak = 1
  for (let i = 0; i < unique.length - 1; i++) {
    const curr = new Date(unique[i])
    const next = new Date(unique[i + 1])
    const diff = (curr.getTime() - next.getTime()) / 86400000
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, cycle_id, cycle_number, day_number } = await req.json()

    if (!user_id || !cycle_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cycleDay    = Number(day_number   ?? 1)
    const cycleNum    = Number(cycle_number ?? 1)
    const stage       = cycleDay <= 7 ? 1 : cycleDay <= 14 ? 2 : cycleDay <= 21 ? 3 : 4

    const { data: userRow } = await supabase
      .from('users')
      .select('language')
      .eq('id', user_id)
      .maybeSingle()
    const language = userRow?.language ?? 'en'

    // ── Total reflections across ALL cycles for this user ────────────────────
    const { count: totalReflections } = await supabase
      .from('responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)

    // ── Streak: fetch all submitted dates for this user ───────────────────────
    const { data: responseDates } = await supabase
      .from('responses')
      .select('submitted_at')
      .eq('user_id', user_id)
      .order('submitted_at', { ascending: false })
      .limit(60) // 60 days is more than enough for streak computation

    const dates = (responseDates ?? []).map((r: any) =>
      new Date(r.submitted_at).toISOString().split('T')[0]
    )
    const streakLength = computeStreak(dates)

    // ── Context message ───────────────────────────────────────────────────────
    const contextMessage = buildContextMessage(cycleDay, cycleNum, streakLength, language)

    // ── Upsert user_state ─────────────────────────────────────────────────────
    await supabase.from('user_state').upsert({
      user_id,
      current_cycle_number: cycleNum,
      current_cycle_day:    cycleDay,
      current_stage:        stage,
      last_completed_reflection: new Date().toISOString(),
      streak_length:        streakLength,
      total_reflections:    totalReflections ?? 0,
      context_message:      contextMessage,
      updated_at:           new Date().toISOString(),
    }, { onConflict: 'user_id', ignoreDuplicates: false })

    return new Response(
      JSON.stringify({
        streak_length:     streakLength,
        total_reflections: totalReflections ?? 0,
        context_message:   contextMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('sync-user-state error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
