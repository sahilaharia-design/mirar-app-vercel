// @ts-nocheck
// ─── Edge Function: whatsapp-nudge ────────────────────────────────────────────
// The daily cue. Runs hourly via pg_cron (see migration 014). For every user
// who EXPLICITLY opted in (users.whatsapp_opt_in) and whose nudge_hour matches
// the current IST hour, sends one approved WhatsApp template message —
// unless they've already checked in today, or were already nudged today.
//
// Uses the Meta WhatsApp Cloud API directly. Secrets (never in code/chat):
//   WHATSAPP_TOKEN            system-user access token
//   WHATSAPP_PHONE_NUMBER_ID  the sending number's ID
//   WHATSAPP_TEMPLATE_NAME    approved template (default: mirar_morning_nudge)
//   WHATSAPP_TEMPLATE_LANG    template language code (default: en)
//   NUDGE_SECRET              shared secret the cron sends in x-nudge-secret —
//                             this endpoint costs money per call, so it must
//                             not be triggerable by anyone holding the public
//                             anon key.
// Template body (no variables, so there's nothing to get wrong):
//   "Aaj main hoon kaisa? Take 10 seconds to check in: https://mirar-app.vercel.app
//    To stop these, turn them off in Mirar → Me."
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function istNow(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  return {
    hour: ist.getUTCHours(),
    dateKey: ist.toISOString().slice(0, 10), // YYYY-MM-DD in IST
    // IST midnight expressed as a UTC instant, for querying timestamptz
    midnightUtcISO: new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS).toISOString(),
  }
}

async function sendTemplate(to: string) {
  const token = Deno.env.get('WHATSAPP_TOKEN')!
  const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace('+', ''),
      type: 'template',
      template: {
        name: Deno.env.get('WHATSAPP_TEMPLATE_NAME') ?? 'mirar_morning_nudge',
        language: { code: Deno.env.get('WHATSAPP_TEMPLATE_LANG') ?? 'en' },
      },
    }),
  })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, error: body?.error?.message ?? null }
}

Deno.serve(async (req) => {
  try {
    const expected = Deno.env.get('NUDGE_SECRET')
    if (!expected || req.headers.get('x-nudge-secret') !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }
    for (const k of ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']) {
      if (!Deno.env.get(k)) {
        return new Response(JSON.stringify({ error: `${k} not set` }), { status: 500 })
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { hour, dateKey, midnightUtcISO } = istNow()

    // Only explicit opt-ins due this hour, not already nudged today.
    const { data: due, error } = await supabase
      .from('users')
      .select('id, whatsapp_number, last_nudge_on')
      .eq('whatsapp_opt_in', true)
      .eq('nudge_hour', hour)
      .not('whatsapp_number', 'is', null)
    if (error) throw error

    const candidates = (due ?? []).filter((u: any) => u.last_nudge_on !== dateKey)

    // Skip anyone who already checked in today (IST) — no point nudging them.
    const doneIds = new Set<string>()
    if (candidates.length) {
      const { data: today } = await supabase
        .from('responses')
        .select('user_id')
        .in('user_id', candidates.map((u: any) => u.id))
        .gte('submitted_at', midnightUtcISO)
      for (const r of today ?? []) doneIds.add(r.user_id)
    }

    let sent = 0, skipped = 0, failed = 0
    for (const u of candidates) {
      if (doneIds.has(u.id)) { skipped++; continue }
      const r = await sendTemplate(u.whatsapp_number)
      if (r.ok) {
        sent++
        await supabase.from('users').update({ last_nudge_on: dateKey }).eq('id', u.id)
      } else {
        failed++
        console.error('whatsapp-nudge send failed', u.id, r.status, r.error)
      }
    }

    return new Response(
      JSON.stringify({ ok: true, hour, due: due?.length ?? 0, sent, skipped, failed }),
      { status: 200 }
    )
  } catch (err: any) {
    console.error('whatsapp-nudge error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
