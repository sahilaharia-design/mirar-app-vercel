-- Migration 009 shipped with a literal placeholder (YOUR_PROJECT_ANON_KEY)
-- in the cron job's Authorization header instead of the real anon key being
-- substituted before running. That placeholder got applied to the live
-- database, so the 8am reminder cron exists but every call 401s silently.
-- Reschedule with the actual public anon key (safe to embed — same key
-- already shipped in the mobile app's .env).

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
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyYW5waXlobHV5dXFpZ3FmeWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDMxNzUsImV4cCI6MjA5MTMxOTE3NX0.y59A6oUf1pexIgKsBUALaGmBZcuNICrcqrebxVC3UHE'
    ),
    body := '{}'::jsonb
  );
  $$
);
