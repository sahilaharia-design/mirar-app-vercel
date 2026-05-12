// ─── Edge Function: send-notification ────────────────────────────────────────
// Triggered on report generation.
// Sends push notification + email via Brevo.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendBrevoEmail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  apiKey: string
) {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Mirar', email: 'noreply@mirar.life' },
      to: [{ email: toEmail }],
      subject,
      htmlContent,
    }),
  });
  return res.ok;
}

async function sendExpoPush(token: string, title: string, body: string) {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: 'default',
      data: { type: 'report_ready' },
    }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const { user_id, cycle_id, stage, report_id } = await req.json();
    if (!user_id || !report_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const brevoKey = Deno.env.get('BREVO_API_KEY');

    // Get user email
    const { data: user } = await supabase
      .from('users')
      .select('email, mirar_id')
      .eq('id', user_id)
      .single();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Get push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id);

    const stageLabel = stage === 0 ? 'full reflection summary' : 'reflection summary';
    const notifBody = stage === 0
      ? 'Your full reflection summary is ready.'
      : 'A new reflection summary is ready to view.';

    // Push notifications
    const pushResults = await Promise.all(
      (tokens ?? []).map((t: any) =>
        sendExpoPush(t.token, 'Mirar', notifBody)
      )
    );

    // Email notification
    let emailSent = false;
    if (brevoKey && user.email) {
      const subject = `Mirar: ${stageLabel} ready`;
      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #4A4A55;">
          <p style="font-size: 16px;">${notifBody}</p>
          <p style="font-size: 13px; color: #9494A0;">
            Open Mirar to view your ${stageLabel}. Read it as a mirror, not a verdict.
          </p>
          <hr style="border: none; border-top: 1px solid #E0DDD8; margin: 24px 0;" />
          <p style="font-size: 11px; color: #C4C4CC;">
            Mirar ID: ${user.mirar_id}<br/>
            This message was sent to the address registered for this ID only.
          </p>
        </div>
      `;
      emailSent = await sendBrevoEmail(user.email, subject, html, brevoKey);
    }

    // Mark report as delivered
    await supabase
      .from('reports')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', report_id);

    return new Response(
      JSON.stringify({
        ok: true,
        push_sent: pushResults.filter(Boolean).length,
        email_sent: emailSent,
      }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('send-notification error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
