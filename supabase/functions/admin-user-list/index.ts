// @ts-nocheck
// admin-user-list
// Secret-gated endpoint returning per-user rows for the operator dashboard.
// Returns: users + user_state + trial_tracking + today's alignment score
//          + 30-day daily check-in activity.
// Call with: x-admin-secret header matching ADMIN_SECRET env var.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  const adminSecret = Deno.env.get('ADMIN_SECRET')
  if (adminSecret) {
    const provided = req.headers.get('x-admin-secret') ?? ''
    if (provided !== adminSecret) {
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

    const today = new Date().toISOString().split('T')[0]

    // ── 1. Per-user data: users + user_state + trial_tracking ─────────────────
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        mirar_id,
        email,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (usersError) throw new Error(usersError.message)

    // Fetch user_state for all users
    const { data: userStates } = await supabase
      .from('user_state')
      .select('user_id, streak_length, total_reflections, current_cycle_day, current_stage, last_completed_reflection, trial_active, trial_days_remaining, context_message, latest_signal_text')

    const userStateMap: Record<string, any> = {}
    for (const us of userStates ?? []) {
      userStateMap[us.user_id] = us
    }

    // Fetch trial_tracking for all users
    const { data: trials } = await supabase
      .from('trial_tracking')
      .select('user_id, conversion_status, trial_ends_at, trial_active')

    const trialMap: Record<string, any> = {}
    for (const t of trials ?? []) {
      trialMap[t.user_id] = t
    }

    // Fetch today's alignment score for all users
    const { data: todayScores } = await supabase
      .from('alignment_scores')
      .select('user_id, score, status_label, trend')
      .eq('date', today)

    const scoreMap: Record<string, any> = {}
    for (const s of todayScores ?? []) {
      scoreMap[s.user_id] = s
    }

    // Fetch last 14-day alignment history per user (for sparklines in expanded rows)
    const since14 = new Date()
    since14.setDate(since14.getDate() - 13)
    const since14Str = since14.toISOString().split('T')[0]

    const { data: historyRows } = await supabase
      .from('alignment_scores')
      .select('user_id, date, score, status_label')
      .gte('date', since14Str)
      .order('date', { ascending: true })

    const historyMap: Record<string, Array<{ date: string; score: number; status_label: string }>> = {}
    for (const h of historyRows ?? []) {
      if (!historyMap[h.user_id]) historyMap[h.user_id] = []
      historyMap[h.user_id].push({ date: h.date, score: h.score, status_label: h.status_label })
    }

    // ── 2. Compose per-user rows ──────────────────────────────────────────────
    const userRows = (users ?? []).map((u) => {
      const us = userStateMap[u.id] ?? {}
      const trial = trialMap[u.id] ?? {}
      const score = scoreMap[u.id] ?? null

      // Relative time label for last check-in
      let lastCheckinLabel: string | null = null
      if (us.last_completed_reflection) {
        const diff = Date.now() - new Date(us.last_completed_reflection).getTime()
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)
        if (hours < 1) lastCheckinLabel = 'Just now'
        else if (hours < 24) lastCheckinLabel = `${hours}h ago`
        else if (days === 1) lastCheckinLabel = 'Yesterday'
        else lastCheckinLabel = `${days}d ago`
      }

      // Trial days display
      let trialDisplay: string
      if (trial.conversion_status === 'converted') {
        trialDisplay = 'Subscribed'
      } else if (trial.conversion_status === 'expired') {
        trialDisplay = 'Expired'
      } else if (trial.conversion_status === 'gifted') {
        trialDisplay = 'Gifted'
      } else {
        const rem = us.trial_days_remaining ?? null
        trialDisplay = rem !== null ? `${rem}d left` : 'Trial'
      }

      return {
        id: u.id,
        mirar_id: u.mirar_id,
        email: u.email,
        created_at: u.created_at,
        streak_length: us.streak_length ?? 0,
        total_reflections: us.total_reflections ?? 0,
        current_cycle_day: us.current_cycle_day ?? 1,
        current_stage: us.current_stage ?? 1,
        last_completed_reflection: us.last_completed_reflection ?? null,
        last_checkin_label: lastCheckinLabel,
        trial_active: trial.trial_active ?? true,
        trial_days_remaining: us.trial_days_remaining ?? null,
        trial_ends_at: trial.trial_ends_at ?? null,
        conversion_status: trial.conversion_status ?? 'trial',
        trial_display: trialDisplay,
        today_score: score?.score ?? null,
        today_status: score?.status_label ?? null,
        today_trend: score?.trend ?? null,
        context_message: us.context_message ?? null,
        latest_signal_text: us.latest_signal_text ?? null,
        alignment_history: historyMap[u.id] ?? [],
      }
    })

    // ── 3. 30-day daily check-in activity (all users combined) ────────────────
    const since30 = new Date()
    since30.setDate(since30.getDate() - 29)
    const since30Str = since30.toISOString().split('T')[0]

    const { data: activityRows } = await supabase
      .from('alignment_scores')
      .select('date, user_id')
      .gte('date', since30Str)
      .order('date', { ascending: true })

    // Count unique users who checked in per day
    const dailyActivity: Record<string, Set<string>> = {}
    for (const row of activityRows ?? []) {
      if (!dailyActivity[row.date]) dailyActivity[row.date] = new Set()
      dailyActivity[row.date].add(row.user_id)
    }

    // Fill in all 30 days (0 for missing days)
    const activityChart: Array<{ date: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      activityChart.push({
        date: dateStr,
        count: dailyActivity[dateStr]?.size ?? 0,
      })
    }

    // ── 4. Summary stats ──────────────────────────────────────────────────────
    const totalUsers = userRows.length
    const activeToday = activityChart[activityChart.length - 1]?.count ?? 0
    const usersWithAny = userRows.filter((u) => u.total_reflections > 0).length
    const usersDay7 = userRows.filter((u) => u.total_reflections >= 7).length
    const avgScore = (() => {
      const scoredUsers = userRows.filter((u) => u.today_score !== null)
      if (!scoredUsers.length) return null
      return Math.round(scoredUsers.reduce((s, u) => s + (u.today_score ?? 0), 0) / scoredUsers.length)
    })()

    return new Response(
      JSON.stringify({
        generated_at: new Date().toISOString(),
        summary: {
          total_users: totalUsers,
          active_today: activeToday,
          day7_retention_pct: usersWithAny > 0 ? Math.round((usersDay7 / usersWithAny) * 100) : 0,
          avg_score_today: avgScore,
        },
        users: userRows,
        activity_chart: activityChart,
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('admin-user-list error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
