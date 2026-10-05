// @ts-nocheck
// ─── Edge Function: email-nudge ───────────────────────────────────────────────
// The daily cue, by email (free: Brevo free plan = 300 emails/day).
//  • Cron (POST + x-nudge-secret): hourly; emails every user who EXPLICITLY
//    opted in (users.email_nudge_opt_in) and whose email_nudge_hour equals the
//    current IST hour — unless they already checked in today or were already
//    emailed today.
//  • Unsubscribe (any method, ?u=<user id>&t=<signed token>): one click, no
//    login. The token is an HMAC of the user id, so it can't be guessed or
//    reused for anyone else. Also served as the List-Unsubscribe header.
// Secrets (never in code/chat): BREVO_API_KEY, EMAIL_FROM (a sender verified
// in Brevo, e.g. hello@mirar.life), NUDGE_SECRET (cron auth + unsubscribe signing).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FN_URL = 'https://jranpiyhluyuqigqfyhn.supabase.co/functions/v1/email-nudge'
const APP_URL = 'https://mirar-app.vercel.app/?utm_source=email&utm_medium=nudge&utm_campaign=morning'
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function istNow(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  return {
    hour: ist.getUTCHours(),
    dateKey: ist.toISOString().slice(0, 10),
    midnightUtcISO: new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS).toISOString(),
  }
}

async function sign(secret: string, msg: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:system-ui,sans-serif;max-width:420px;margin:15vh auto;padding:0 20px;color:#3d3d45"><h2 style="font-weight:500">${title}</h2><p>${body}</p>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function emailBody(unsubUrl: string) {
  const text = `Aaj main hoon kaisa?\n\nTake 10 seconds to check in:\n${APP_URL}\n\nYou asked for this morning email. Stop it any time: ${unsubUrl}\n`
  const html = `<div style="font-family:system-ui,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#3d3d45">
<p style="font-size:22px;margin:0 0 12px">Aaj main hoon kaisa?</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 20px">Take 10 seconds to check in with yourself before the day takes over.</p>
<p style="margin:0 0 28px"><a href="${APP_URL}" style="background:#4a4a55;color:#faf7f2;text-decoration:none;padding:12px 22px;border-radius:10px;display:inline-block">Check in</a></p>
<p style="font-size:12px;color:#888;margin:0">You asked for this morning email. <a href="${unsubUrl}" style="color:#888">Unsubscribe</a></p></div>`
  return { text, html }
}

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('NUDGE_SECRET')
    if (!secret) return new Response(JSON.stringify({ error: 'NUDGE_SECRET not set' }), { status: 500 })
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const url = new URL(req.url)

    // ── Unsubscribe (one click, any method) ───────────────────────────────────
    const u = url.searchParams.get('u'), t = url.searchParams.get('t')
    if (u || t) {
      if (!u || !t || !safeEqual(await sign(secret, u), t)) {
        return page('Link not valid', 'This unsubscribe link is invalid or incomplete.', 400)
      }
      const { error } = await supabase.from('users').update({ email_nudge_opt_in: false }).eq('id', u)
      if (error) return page('Something went wrong', 'Please try again, or turn it off in Mirar → Me.', 500)
      return page("You're unsubscribed", 'No more morning emails. You can turn them back on any time in Mirar → Me.')
    }

    // ── Cron send ─────────────────────────────────────────────────────────────
    if (req.headers.get('x-nudge-secret') !== secret) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }
    const brevoKey = Deno.env.get('BREVO_API_KEY'), from = Deno.env.get('EMAIL_FROM')
    if (!brevoKey || !from) return new Response(JSON.stringify({ error: 'BREVO_API_KEY / EMAIL_FROM not set' }), { status: 500 })

    const { hour, dateKey, midnightUtcISO } = istNow()
    const { data: due, error } = await supabase
      .from('users')
      .select('id, email, last_email_nudge_on')
      .eq('email_nudge_opt_in', true)
      .eq('email_nudge_hour', hour)
      .not('email', 'is', null)
    if (error) throw error

    const candidates = (due ?? []).filter((x: any) => x.last_email_nudge_on !== dateKey)
    const done = new Set<string>()
    if (candidates.length) {
      const { data: today } = await supabase.from('responses').select('user_id')
        .in('user_id', candidates.map((x: any) => x.id)).gte('submitted_at', midnightUtcISO)
      for (const r of today ?? []) done.add(r.user_id)
    }

    let sent = 0, skipped = 0, failed = 0
    for (const user of candidates) {
      if (done.has(user.id)) { skipped++; continue }
      const unsubUrl = `${FN_URL}?u=${user.id}&t=${await sign(secret, user.id)}`
      const { text, html } = emailBody(unsubUrl)
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Mirar', email: from },
          to: [{ email: user.email }],
          subject: 'Aaj main hoon kaisa?',
          htmlContent: html,
          textContent: text,
          headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        }),
      })
      if (res.ok) {
        sent++
        await supabase.from('users').update({ last_email_nudge_on: dateKey }).eq('id', user.id)
      } else {
        failed++
        console.error('email-nudge send failed', user.id, res.status, await res.text().catch(() => ''))
      }
    }
    return new Response(JSON.stringify({ ok: true, hour, due: due?.length ?? 0, sent, skipped, failed }), { status: 200 })
  } catch (err: any) {
    console.error('email-nudge error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
