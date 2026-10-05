-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 016: schedule the email nudge (hourly at :30 UTC = :00 IST)
--
-- BEFORE RUNNING: replace REPLACE_WITH_NUDGE_SECRET (every occurrence) with
-- the same value you set as the NUDGE_SECRET function secret
--     (generate one with: openssl rand -hex 24).
-- This script refuses to run with the placeholder still in — migration 009
-- once shipped a literal placeholder that silently failed for weeks.
-- Deploy the function with --no-verify-jwt:
--     npx supabase functions deploy email-nudge --no-verify-jwt
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  -- Right-hand side is split so find-and-replace can't also rewrite it.
  if 'REPLACE_WITH_NUDGE_SECRET' = ('REPLACE_WITH_' || 'NUDGE_SECRET')
     or length('REPLACE_WITH_NUDGE_SECRET') < 16 then
    raise exception 'Replace REPLACE_WITH_NUDGE_SECRET with your real NUDGE_SECRET before running this migration.';
  end if;
end $$;

-- WhatsApp is parked; make sure its job (if 014 was ever run) is off.
select cron.unschedule('whatsapp-nudge-hourly')
where exists (select 1 from cron.job where jobname = 'whatsapp-nudge-hourly');

select cron.unschedule('email-nudge-hourly')
where exists (select 1 from cron.job where jobname = 'email-nudge-hourly');

select cron.schedule(
  'email-nudge-hourly',
  '30 * * * *',
  $$
  select net.http_post(
    url := 'https://jranpiyhluyuqigqfyhn.supabase.co/functions/v1/email-nudge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nudge-secret', 'REPLACE_WITH_NUDGE_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
