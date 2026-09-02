// ─── Edge Function: daily-reminder ────────────────────────────────────────────
// Cron: runs daily at 8:00 AM UTC (configure in Supabase dashboard)
// Sends push notification to users who haven't completed today's check-in

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function sendExpoPush(token: string, title: string, body: string) {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: 'default',
      data: { type: 'daily_reminder' },
    }),
  });
  return res.ok;
}

// Same fix as lib/scoring.ts's getCycleDay (kept in sync manually — this is a
// separate Deno runtime, can't import that file): was a rolling 24-hour
// window from the exact cycle-start clock time, not a calendar-day boundary,
// so a user's day_number wouldn't advance until the same time-of-day the
// next day. Normalizing to midnight first fixes it. This function runs in
// UTC (server time) rather than the user's own timezone, so it can still be
// off by a few hours right around midnight for non-UTC users — acceptable
// here since this only decides whether to send a reminder push, not the
// canonical day_number a check-in gets recorded under (that comes from the
// client's own getCycleDay, which correctly uses the device's local time).
function getCycleDay(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((nowMidnight.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 28);
}

const REMINDER_BODY: Record<string, string> = {
  en: 'Your mirror is ready today. Takes less than 2 minutes.',
  hi: 'आपका आज का दर्पण तैयार है। दो मिनट से भी कम समय लगता है।',
  gu: 'તમારો આજનો દર્પણ તૈયાર છે. બે મિનિટથી પણ ઓછો સમય લાગે છે.',
};

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all active cycles
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('id, user_id, start_date')
      .eq('status', 'active');

    if (cyclesErr) throw cyclesErr;

    let notified = 0;
    let skipped = 0;

    for (const cycle of cycles ?? []) {
      const dayNumber = getCycleDay(cycle.start_date);

      // Check if already completed today
      const { data: existing } = await supabase
        .from('responses')
        .select('id')
        .eq('user_id', cycle.user_id)
        .eq('cycle_id', cycle.id)
        .eq('day_number', dayNumber)
        .limit(1);

      if (existing?.length) {
        skipped++;
        continue;
      }

      // Get push tokens
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', cycle.user_id);

      if (!tokens?.length) {
        skipped++;
        continue;
      }

      const { data: userRow } = await supabase
        .from('users')
        .select('language')
        .eq('id', cycle.user_id)
        .maybeSingle();
      const language = userRow?.language === 'hi' || userRow?.language === 'gu' ? userRow.language : 'en';
      const body = REMINDER_BODY[language];

      await Promise.all(
        tokens.map((t: any) => sendExpoPush(t.token, 'Mirar', body))
      );

      notified++;
    }

    return new Response(
      JSON.stringify({ ok: true, notified, skipped }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('daily-reminder error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
