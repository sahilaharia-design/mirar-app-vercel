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

// HISTORY: this used to recompute day_number here (mirroring the old
// calendar-elapsed lib/scoring.ts getCycleDay) and check for an existing
// response at that day_number. That broke two ways in production: (1) a
// rolling 24h window instead of a calendar-day boundary, and (2) more
// seriously, day_number is now driven purely by completed-checkin COUNT
// (see lib/scoring.ts's getCycleDay), so it no longer corresponds to any
// particular calendar date at all — there's no day_number here to compute or
// match against. This function's actual job is calendar-only ("has this
// user already checked in today"), so it's answered directly against
// submitted_at, matching lib/scoring.ts's hasCheckedInToday (kept in sync
// manually — separate Deno runtime, can't import that file). Runs in UTC
// (server time) rather than the user's own timezone, so it can still be off
// by a few hours right around midnight for non-UTC users — acceptable here
// since this only decides whether to send a reminder push, not the
// canonical day_number a check-in gets recorded under.
function hasCheckedInToday(responses: { submitted_at: string }[]): boolean {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return responses.some((r) => {
    const submitted = new Date(r.submitted_at);
    const submittedMidnight = new Date(submitted.getFullYear(), submitted.getMonth(), submitted.getDate()).getTime();
    return submittedMidnight === todayMidnight;
  });
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
      // Check if already completed today — calendar-based, not day_number
      // matching (see hasCheckedInToday above). Only need recent rows, not
      // the full cycle history, to answer "did anything land today."
      const { data: recent } = await supabase
        .from('responses')
        .select('submitted_at')
        .eq('user_id', cycle.user_id)
        .eq('cycle_id', cycle.id)
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (hasCheckedInToday(recent ?? [])) {
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
