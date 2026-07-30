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

type Lang = 'en' | 'hi' | 'gu';

const STAGE_LABEL: Record<Lang, { full: string; single: string }> = {
  en: { full: 'full reflection summary', single: 'reflection summary' },
  hi: { full: 'पूर्ण प्रतिबिंब सारांश', single: 'प्रतिबिंब सारांश' },
  gu: { full: 'સંપૂર્ણ પ્રતિબિંબ સારાંશ', single: 'પ્રતિબિંબ સારાંશ' },
};

const NOTIF_BODY: Record<Lang, { full: string; single: string }> = {
  en: { full: 'Your full reflection summary is ready.', single: 'A new reflection summary is ready to view.' },
  hi: { full: 'आपका पूर्ण प्रतिबिंब सारांश तैयार है।', single: 'एक नया प्रतिबिंब सारांश देखने के लिए तैयार है।' },
  gu: { full: 'તમારો સંપૂર્ણ પ્રતિબિંબ સારાંશ તૈયાર છે.', single: 'એક નવો પ્રતિબિંબ સારાંશ જોવા માટે તૈયાર છે.' },
};

const EMAIL_TEXT: Record<Lang, { subject: (label: string) => string; openLine: (label: string) => string; footer: string }> = {
  en: {
    subject: (label) => `Mirar: ${label} ready`,
    openLine: (label) => `Open Mirar to view your ${label}. Read it as a mirror, not a verdict.`,
    footer: 'This message was sent to the address registered for this ID only.',
  },
  hi: {
    subject: (label) => `Mirar: ${label} तैयार है`,
    openLine: (label) => `अपना ${label} देखने के लिए Mirar खोलें। इसे एक दर्पण की तरह पढ़ें, फैसले की तरह नहीं।`,
    footer: 'यह संदेश केवल इस ID के लिए पंजीकृत पते पर भेजा गया था।',
  },
  gu: {
    subject: (label) => `Mirar: ${label} તૈયાર છે`,
    openLine: (label) => `તમારો ${label} જોવા માટે Mirar ખોલો. તેને દર્પણની જેમ વાંચો, ચુકાદાની જેમ નહીં.`,
    footer: 'આ સંદેશ ફક્ત આ ID માટે નોંધાયેલ સરનામે મોકલવામાં આવ્યો હતો.',
  },
};

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

    // Get user email + language
    const { data: user } = await supabase
      .from('users')
      .select('email, mirar_id, language')
      .eq('id', user_id)
      .single();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const lang: Lang = user.language === 'hi' || user.language === 'gu' ? user.language : 'en';

    // Get push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id);

    const stageLabel = stage === 0 ? STAGE_LABEL[lang].full : STAGE_LABEL[lang].single;
    const notifBody = stage === 0 ? NOTIF_BODY[lang].full : NOTIF_BODY[lang].single;

    // Push notifications
    const pushResults = await Promise.all(
      (tokens ?? []).map((t: any) =>
        sendExpoPush(t.token, 'Mirar', notifBody)
      )
    );

    // Email notification
    let emailSent = false;
    if (brevoKey && user.email) {
      const emailText = EMAIL_TEXT[lang];
      const subject = emailText.subject(stageLabel);
      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #4A4A55;">
          <p style="font-size: 16px;">${notifBody}</p>
          <p style="font-size: 13px; color: #9494A0;">
            ${emailText.openLine(stageLabel)}
          </p>
          <hr style="border: none; border-top: 1px solid #E0DDD8; margin: 24px 0;" />
          <p style="font-size: 11px; color: #C4C4CC;">
            Mirar ID: ${user.mirar_id}<br/>
            ${emailText.footer}
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
