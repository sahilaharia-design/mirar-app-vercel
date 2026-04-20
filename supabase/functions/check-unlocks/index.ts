// @ts-nocheck
// check-unlocks
// Runs post-check-in. Evaluates unlock thresholds against total_reflections
// and cycle_number. Inserts new unlock_events rows (deduped by UNIQUE constraint).
// Updates user_state.highest_unlock with the most advanced milestone reached.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Ordered from least to most advanced — used to compute highest_unlock
const UNLOCK_SEQUENCE = [
  'micro_pattern_day3',
  'weekly_signal_day7',
  'pattern_depth_day14',
  'mirror_profile_cycle1',
  'signal_recurrence_cycle3',
  'drift_awareness_cycle6',
  'annual_arc_cycle13',
]

interface UnlockThreshold {
  key: string
  condition: (totalReflections: number, cycleNumber: number) => boolean
  metadata: (totalReflections: number, cycleNumber: number) => Record<string, unknown>
}

const UNLOCK_THRESHOLDS: UnlockThreshold[] = [
  {
    key: 'micro_pattern_day3',
    condition: (r) => r >= 3,
    metadata: (r) => ({ triggered_at_reflection: r, type: 'early_signal' }),
  },
  {
    key: 'weekly_signal_day7',
    condition: (r) => r >= 7,
    metadata: (r) => ({ triggered_at_reflection: r, type: 'weekly' }),
  },
  {
    key: 'pattern_depth_day14',
    condition: (r) => r >= 14,
    metadata: (r) => ({ triggered_at_reflection: r, type: 'mid_cycle' }),
  },
  {
    key: 'mirror_profile_cycle1',
    condition: (r) => r >= 28,
    metadata: (r) => ({ triggered_at_reflection: r, type: 'cycle_complete' }),
  },
  {
    key: 'signal_recurrence_cycle3',
    condition: (_r, c) => c >= 3,
    metadata: (_r, c) => ({ triggered_at_cycle: c, type: 'multi_cycle' }),
  },
  {
    key: 'drift_awareness_cycle6',
    condition: (_r, c) => c >= 6,
    metadata: (_r, c) => ({ triggered_at_cycle: c, type: 'long_term' }),
  },
  {
    key: 'annual_arc_cycle13',
    condition: (_r, c) => c >= 13,
    metadata: (_r, c) => ({ triggered_at_cycle: c, type: 'annual' }),
  },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, total_reflections, cycle_number } = await req.json()

    if (!user_id || total_reflections == null) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const reflections = Number(total_reflections)
    const cycle = Number(cycle_number ?? 1)

    // ── Evaluate which thresholds are met ────────────────────────────────────
    const eligibleKeys = UNLOCK_THRESHOLDS
      .filter((t) => t.condition(reflections, cycle))
      .map((t) => t.key)

    if (eligibleKeys.length === 0) {
      return new Response(
        JSON.stringify({ unlocked: [], highest_unlock: 'none' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Fetch already-unlocked keys to skip ───────────────────────────────────
    const { data: existing } = await supabase
      .from('unlock_events')
      .select('unlock_key')
      .eq('user_id', user_id)
      .in('unlock_key', eligibleKeys)

    const existingKeys = new Set((existing ?? []).map((e: any) => e.unlock_key))
    const newKeys = eligibleKeys.filter((k) => !existingKeys.has(k))

    // ── Insert new unlock events ──────────────────────────────────────────────
    if (newKeys.length > 0) {
      const rows = newKeys.map((key) => {
        const threshold = UNLOCK_THRESHOLDS.find((t) => t.key === key)!
        return {
          user_id,
          unlock_key: key,
          metadata: threshold.metadata(reflections, cycle),
        }
      })

      await supabase
        .from('unlock_events')
        .upsert(rows, { onConflict: 'user_id,unlock_key', ignoreDuplicates: true })
    }

    // ── Compute highest_unlock from all earned keys (existing + new) ──────────
    const allEarnedKeys = new Set([...existingKeys, ...newKeys])
    let highestUnlock = 'none'
    for (const key of UNLOCK_SEQUENCE) {
      if (allEarnedKeys.has(key)) {
        highestUnlock = key
      }
    }

    // ── Update user_state.highest_unlock ─────────────────────────────────────
    await supabase
      .from('user_state')
      .update({ highest_unlock: highestUnlock, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)

    return new Response(
      JSON.stringify({ unlocked: newKeys, highest_unlock: highestUnlock }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('check-unlocks error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
