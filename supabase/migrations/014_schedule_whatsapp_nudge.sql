-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 014: schedule the WhatsApp nudge (hourly, at :30 UTC = :00 IST)
--
-- BEFORE RUNNING: replace REPLACE_WITH_NUDGE_SECRET (once, below) with the
-- same value you set as the NUDGE_SECRET function secret. Generate one with:
--     openssl rand -hex 24
-- Migration 009 once shipped a literal placeholder that got applied to the
-- live DB and silently 401'd for weeks (fixed in 010) — so this script
-- refuses to schedule anything if the placeholder is still there.
--
-- Deploy the function with --no-verify-jwt (auth here is the shared secret,
-- not a Supabase JWT):
--     npx supabase functions deploy whatsapp-nudge --no-verify-jwt
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  -- Right-hand side is split so a find-and-replace of the placeholder in
  -- this file can't also rewrite it (which would make the check always pass).
  if 'REPLACE_WITH_NUDGE_SECRET' = ('REPLACE_WITH_' || 'NUDGE_SECRET')
     or length('REPLACE_WITH_NUDGE_SECRET') < 16 then
    raise exception 'Replace REPLACE_WITH_NUDGE_SECRET with your real NUDGE_SECRET before running this migration.';
  end if;
end $$;

select cron.unschedule('whatsapp-nudge-hourly')
where exists (select 1 from cron.job where jobname = 'whatsapp-nudge-hourly');

select cron.schedule(
  'whatsapp-nudge-hourly',
  '30 * * * *',
  $$
  select net.http_post(
    url := 'https://jranpiyhluyuqigqfyhn.supabase.co/functions/v1/whatsapp-nudge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nudge-secret', 'REPLACE_WITH_NUDGE_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
