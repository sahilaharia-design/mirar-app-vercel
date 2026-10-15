-- E1b PROPOSAL ONLY (a SEPARATE gate from E1). NOT EXECUTED. Do not run without its own approval and the checks below.
-- Problem: migration 005 created owner-writable policies on legacy tables (FOR ALL USING (user_id = auth.uid())), so a signed-in user can
-- edit their own legacy trial_tracking and subscriptions rows. The new entitlement gate never reads these tables, so this is not a hole in the
-- gate, but any future code that trusts them would be self-grantable. Make them read-only to clients.
-- Before running: confirm (read-only) that no deployed client or function WRITES to either table. In the repository no client code references them
-- (the v1 app reads only public.user_state); the legacy edge function trial-lifecycle writes with the service role, which bypasses RLS and is unaffected.
begin;
drop policy if exists "own_trial"        on public.trial_tracking;
drop policy if exists "own_subscription" on public.subscriptions;
create policy "own_trial_read"        on public.trial_tracking for select using (user_id = auth.uid());
create policy "own_subscription_read" on public.subscriptions  for select using (user_id = auth.uid());
commit;
-- Rollback: drop the two *_read policies and recreate the originals from supabase/migrations/005_lifelong_system.sql.
