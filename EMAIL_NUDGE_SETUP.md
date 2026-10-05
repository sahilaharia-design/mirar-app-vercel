# Morning email nudge — setup (free; the parts only you can do)

The app side is live (Me tab → "Morning email", explicit consent). Nothing
sends until you do these steps — they need your Brevo account and your
Supabase token; Claude can't, and tokens never go in chat.

**Cost:** Brevo's free plan = 300 emails/day, API included. That covers up to
300 opted-in users/day for free. Above that you'd need a paid plan.
(WhatsApp is parked — it costs ~₹1/user/day; see WHATSAPP_NUDGE_SETUP.md.)

## 1. Brevo (you already use it)
1. **Verify a sender** you control, ideally on your own domain:
   Brevo → Senders, Domains & IPs → add domain `mirar.life` and add the
   SPF/DKIM DNS records it shows (this is what keeps mail out of spam).
   Use something like `hello@mirar.life` as the sender.
2. Create an **API key**: SMTP & API → API keys → Generate.

## 2. Supabase (your terminal — token stays with you)
```bash
cd "/Users/sahilharia/Claude Cowork/mirar-app"
export SUPABASE_ACCESS_TOKEN=<your token>
npx supabase link --project-ref jranpiyhluyuqigqfyhn

# generate NUDGE_SECRET with: openssl rand -hex 24
npx supabase secrets set BREVO_API_KEY=<key> EMAIL_FROM=hello@mirar.life NUDGE_SECRET=<generated>

npx supabase functions deploy email-nudge --no-verify-jwt
```

## 3. SQL (Supabase SQL editor, in order)
1. `supabase/migrations/015_email_nudge.sql` — adds the consent columns.
2. `supabase/migrations/016_schedule_email_nudge.sql` — **first replace every
   `REPLACE_WITH_NUDGE_SECRET` with your NUDGE_SECRET.** It refuses to run
   with the placeholder still in.

## 4. Test before trusting it
1. In the app: Me → tick the box → **Turn on** (uses your account email).
2. Make it your nudge hour: in the `users` table set your `email_nudge_hour`
   to the current IST hour, then:
   `curl -X POST https://jranpiyhluyuqigqfyhn.supabase.co/functions/v1/email-nudge -H "x-nudge-secret: <secret>"`
   Expect `{"ok":true,...,"sent":1}` and an email "Aaj main hoon kaisa?".
3. Call it again: expect `sent:0` (once per day). Click **Unsubscribe** in the
   email: expect the "You're unsubscribed" page, and the toggle off in Me.

## Honest trade-offs vs WhatsApp
- Email gets opened less and can land in Gmail's Promotions tab; setting up
  SPF/DKIM properly matters.
- It's free, needs no phone numbers or Meta approval, and unsubscribe is
  one click.
- Fixed 8:00 AM IST for now (`email_nudge_hour` exists for per-user times).
