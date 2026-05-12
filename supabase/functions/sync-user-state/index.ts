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
function buildContextMessage(cycleDay: number, cycleNumber: number, streakLength: number): string {
  const stage =
    cycleDay <= 7  ? 1 :
    cycleDay <= 14 ? 2 :
    cycleDay <= 21 ? 3 : 4

  const stageLabel = ['Notice', 'Adjust', 'Move', 'Reflect'][stage - 1]

  if (cycleDay === 1 && cycleNumber === 1) return 'Your first mirror is forming.'
  if (cycleDay === 1) return `A new mirror begins.`
  if (cycleDay === 7)  return `A first pattern is ready to notice.`
  if (cycleDay === 14) return `Your recent reflections are beginning to hold a shape.`
  if (cycleDay === 21) return `Three weeks of reflections are now visible.`
  if (cycleDay === 28) return `This reflection pattern is complete.`

  const stageStart = (stage - 1) * 7 + 1
  const dayInStage = cycleDay - stageStart + 1

  if (streakLength >= 7) {
    return `${stageLabel}. ${streakLength} recent reflections in a row.`
  }
  if (streakLength >= 3) {
    return `${stageLabel}. Your recent reflections are holding a thread.`
  }
  if (dayInStage === 1) {
    return `${stageLabel} begins.`
  }
  return `Today’s mirror · ${stageLabel}.`
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
    const contextMessage = buildContextMessage(cycleDay, cycleNum, streakLength)

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
