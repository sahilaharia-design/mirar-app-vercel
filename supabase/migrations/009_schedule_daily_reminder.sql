-- Activates the daily check-in reminder that already exists in code
-- (supabase/functions/daily-reminder) by scheduling it via pg_cron + pg_net.
-- Runs 8:00 AM UTC daily. Push-only (Expo) — no email, no new integrations.
--
-- Before running: replace YOUR_PROJECT_ANON_KEY below with the anon/public
-- key from Supabase Dashboard → Project Settings → API. That key is meant
-- to be public (it's already embedded in the mobile app), so it's safe to
-- paste directly here.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('daily-reminder-8am-utc')
where exists (select 1 from cron.job where jobname = 'daily-reminder-8am-utc');

select cron.schedule(
  'daily-reminder-8am-utc',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://jranpiyhluyuqigqfyhn.supabase.co/functions/v1/daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_PROJECT_ANON_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
