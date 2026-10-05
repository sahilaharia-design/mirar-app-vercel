# Morning WhatsApp nudge — setup (the parts only you can do)

The app side is built and live (Me tab → "Morning nudge on WhatsApp", with
explicit consent). Nothing sends until you finish these steps. Claude cannot
do them: they need your Meta account and your Supabase token, and tokens must
never be pasted into chat.

## 1. Meta / WhatsApp Business (one-time, ~1–3 days incl. approvals)
1. Create or use a **Meta Business** account → add a **WhatsApp Business
   Account (WABA)** in Meta Business Suite → WhatsApp Manager.
2. Add a **phone number that is NOT already on the regular WhatsApp app**
   (the number gets registered to the API; use a fresh SIM / virtual number).
3. Create a **permanent access token**: Business Settings → System users →
   add one → assign the WABA → generate token with `whatsapp_business_messaging`.
4. Note the **Phone number ID** (WhatsApp Manager → API setup).
5. Create the message **template** (category: *Marketing* — a daily nudge is
   almost certainly classed as marketing; pick Utility only if Meta accepts it):
   - Name: `mirar_morning_nudge` · Language: English
   - Body (no variables):
     `Aaj main hoon kaisa? Take 10 seconds to check in: https://mirar-app.vercel.app — To stop these, turn them off in Mirar → Me.`
   - Wait for "Approved" (usually < 24h).

## 2. Cost (India, per delivered message, + 18% GST — check current rates)
Marketing ≈ ₹0.86 · Utility ≈ ₹0.115. A daily marketing nudge ≈ ₹1/user/day
(~₹30/user/month). 200 users ≈ ₹6,000/month. Messages to people who already
checked in that day are skipped, which trims this.

## 3. Supabase (run in your own terminal — token stays with you)
```bash
cd "/Users/sahilharia/Claude Cowork/mirar-app"
export SUPABASE_ACCESS_TOKEN=<your token>
npx supabase link --project-ref jranpiyhluyuqigqfyhn

# secrets (generate NUDGE_SECRET with: openssl rand -hex 24)
npx supabase secrets set WHATSAPP_TOKEN=<token> WHATSAPP_PHONE_NUMBER_ID=<id> \
  WHATSAPP_TEMPLATE_NAME=mirar_morning_nudge WHATSAPP_TEMPLATE_LANG=en \
  NUDGE_SECRET=<your generated secret>

npx supabase functions deploy whatsapp-nudge --no-verify-jwt
```

## 4. SQL (Supabase SQL editor, in order)
1. `supabase/migrations/013_whatsapp_nudge.sql` — adds the consent columns.
2. `supabase/migrations/014_schedule_whatsapp_nudge.sql` — **first replace
   every `REPLACE_WITH_NUDGE_SECRET` with your NUDGE_SECRET.** It refuses to
   run with the placeholder still in (migration 009 once shipped a literal
   placeholder that silently failed for weeks).

## 5. Test before trusting it
1. In the app: Me → enter **your own** number, tick consent, Turn on.
2. Trigger once manually (replace values):
   `curl -X POST https://jranpiyhluyuqigqfyhn.supabase.co/functions/v1/whatsapp-nudge -H "x-nudge-secret: <secret>"`
   Expect `{"ok":true,...,"sent":1}` only if it is currently your nudge hour
   (default 8 IST) — otherwise `due:0`. To test off-hour, temporarily set your
   `nudge_hour` to the current IST hour in the `users` table.
3. Confirm the WhatsApp arrives; confirm a second call the same day sends 0.

## Known gaps (honest)
- **No "reply STOP" handling yet** — opt-out is in the app (Me → Turn off) and
  stated in the template. A webhook for STOP replies is the next step.
- **Fixed 8:00 AM IST** (column `nudge_hour` exists for per-user times later).
- **The existing `daily-reminder` push cron runs at 08:00 UTC (= 1:30 PM IST)** —
  probably not what you want; separate from this.
- Opt-in only reaches people who open the app and turn it on; the WhatsApp
  broadcast list you already message by hand is a separate consent question.
