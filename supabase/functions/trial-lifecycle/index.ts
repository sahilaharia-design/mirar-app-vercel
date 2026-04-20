// @ts-nocheck
// trial-lifecycle
// Called daily by a Supabase scheduled cron (pg_cron) or external scheduler.
// For all active trials:
//   - Decrements trial_days_remaining
//   - Marks expired if trial_ends_at has passed
//   - Syncs trial_active + trial_days_remaining to user_state
// Safe to re-run (idempotent: uses today's date for all calculations).
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

  // Verify this is a scheduled/admin call — not an end-user request.
  // In production, gate this behind a secret header set by the cron caller.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const authHeader = req.headers.get('x-cron-secret') ?? ''
    if (authHeader !== cronSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date()
    const todayIso = now.toISOString()

    // ── Fetch all active trials ───────────────────────────────────────────────
    const { data: activeTrials, error: fetchError } = await supabase
      .from('trial_tracking')
      .select('id, user_id, trial_days_remaining, trial_ends_at, conversion_status')
      .eq('trial_active', true)
      .eq('conversion_status', 'trial')

    if (fetchError) throw new Error(fetchError.message)
    if (!activeTrials || activeTrials.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, expired: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let expiredCount = 0

    // Process in batches of 50 to avoid large single updates
    const BATCH = 50
    for (let i = 0; i < activeTrials.length; i += BATCH) {
      const batch = activeTrials.slice(i, i + BATCH)

      for (const trial of batch) {
        const trialEndsAt = new Date(trial.trial_ends_at)
        const isExpired   = now >= trialEndsAt

        const newRemaining = isExpired
          ? 0
          : Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000))

        // Update trial_tracking
        await supabase
          .from('trial_tracking')
          .update({
            trial_days_remaining: newRemaining,
            trial_active:         !isExpired,
            conversion_status:    isExpired ? 'expired' : 'trial',
            updated_at:           todayIso,
          })
          .eq('id', trial.id)

        // Sync to user_state
        await supabase
          .from('user_state')
          .update({
            trial_active:         !isExpired,
            trial_days_remaining: newRemaining,
            updated_at:           todayIso,
          })
          .eq('user_id', trial.user_id)

        if (isExpired) expiredCount++
      }
    }

    return new Response(
      JSON.stringify({
        processed: activeTrials.length,
        expired:   expiredCount,
        run_at:    todayIso,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('trial-lifecycle error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
