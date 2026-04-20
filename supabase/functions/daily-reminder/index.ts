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

function getCycleDay(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 28);
}

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

      const body = `Day ${dayNumber} is waiting.`;

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
