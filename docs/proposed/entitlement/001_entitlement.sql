-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- E1 PROPOSAL: server-authoritative trial entitlement.            *** NOT APPLIED. NOT EXECUTED ANYWHERE. ***
-- Lives outside supabase/migrations on purpose. Do not run against any Supabase project or any persistent database.
-- First execution, after founder approval, is on a THROWAWAY in-memory Postgres (see docs/product/E1_ENTITLEMENT_PROPOSAL.md).
--
-- Rules implemented (docs/product/TRIAL_ENTITLEMENT_CONTRACT.md):
--   • a 14-day trial = 348 hours (336 h + 12 h courtesy) from the server-recorded first completed rep; start is set once and is immutable
--   • the only client-callable functions are entitlement_get() and entitlement_first_rep_completed(); clients have NO table privileges
--   • the first-rep signal carries NO arguments: no answers, no emotional content, no device or time from the client
--   • per-account eligibility only (the account's own row); no email normalisation, no fingerprinting
--   • the legacy tables public.trial_tracking and public.subscriptions are NOT read, written or referenced by anything here
--   • no scheduled job: expiry is evaluated lazily with the database clock when the row is read
-- Billing states are deliberately absent: the billing contract adds them in its own migration.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

begin;

create table public.entitlement (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  state            text not null default 'new' check (state in ('new', 'trialing', 'trial_expired', 'comped')),
  cohort           text not null default 'standard' check (cohort in ('standard', 'internal')),
  trial_started_at timestamptz,
  trial_ends_at    timestamptz,
  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint entitlement_trial_pair      check ((trial_started_at is null) = (trial_ends_at is null)),
  constraint entitlement_trial_min       check (trial_ends_at is null or trial_ends_at >= trial_started_at + interval '348 hours'),
  constraint entitlement_trialing_start  check (state <> 'trialing' or trial_started_at is not null),
  constraint entitlement_expired_start   check (state <> 'trial_expired' or trial_started_at is not null),
  constraint entitlement_new_untouched   check (state <> 'new' or trial_started_at is null)
);

create table public.entitlement_event (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now(),
  kind    text not null check (kind in ('created', 'trial_started', 'trial_expired', 'admin_comp', 'admin_uncomp', 'admin_extend')),
  source  text not null check (source in ('system', 'admin')),
  hours   integer check (hours is null or hours between 1 and 8760),
  reason  text check (reason is null or char_length(reason) <= 200),
  constraint entitlement_event_admin_reason check (source <> 'admin' or reason is not null)
);
create index entitlement_event_user_at on public.entitlement_event (user_id, at);

-- Defence in depth: RLS on with NO policies (so any client role that somehow gained a privilege still sees nothing), plus no table privileges for
-- any client role. FORCE ROW LEVEL SECURITY is deliberately NOT used: with no policies it would also lock out the owner that the SECURITY DEFINER
-- functions below run as.
alter table public.entitlement       enable row level security;
alter table public.entitlement_event enable row level security;
revoke all on public.entitlement       from public, anon, authenticated;
revoke all on public.entitlement_event from public, anon, authenticated;

-- The start never moves and the end never moves earlier. (Deleting an account cascades; this trigger is on UPDATE only.)
create function public.entitlement_guard() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.trial_started_at is not null and new.trial_started_at is distinct from old.trial_started_at then
    raise exception 'trial_started_at is immutable' using errcode = '23514';
  end if;
  if old.trial_ends_at is not null and new.trial_ends_at < old.trial_ends_at then
    raise exception 'trial_ends_at cannot move earlier' using errcode = '23514';
  end if;
  new.version := old.version + 1;
  new.updated_at := pg_catalog.now();
  return new;
end $$;
create trigger entitlement_guard before update on public.entitlement for each row execute function public.entitlement_guard();

-- The answer a client may see: its own state, the two instants, and the server clock (so the client can calibrate).
create function public.entitlement_json(r public.entitlement) returns jsonb language sql stable set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'state', r.state, 'trial_started_at', r.trial_started_at, 'trial_ends_at', r.trial_ends_at,
    'server_now', pg_catalog.now(), 'version', r.version)
$$;

-- Read (and, if this is the first call, create) the caller's own entitlement. Lazily records expiry once.
create function public.entitlement_get() returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r   public.entitlement;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  insert into public.entitlement (user_id) values (uid) on conflict (user_id) do nothing;
  if found then insert into public.entitlement_event (user_id, kind, source) values (uid, 'created', 'system'); end if;
  select * into r from public.entitlement where user_id = uid for update;
  if r.state = 'trialing' and r.trial_ends_at <= pg_catalog.now() then
    update public.entitlement set state = 'trial_expired' where user_id = uid returning * into r;
    insert into public.entitlement_event (user_id, kind, source) values (uid, 'trial_expired', 'system');
  end if;
  return public.entitlement_json(r);
end $$;

-- The first-completion signal. No arguments. Idempotent: only the first call from a 'new' account starts the trial.
create function public.entitlement_first_rep_completed() returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r   public.entitlement;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  insert into public.entitlement (user_id) values (uid) on conflict (user_id) do nothing;
  if found then insert into public.entitlement_event (user_id, kind, source) values (uid, 'created', 'system'); end if;
  select * into r from public.entitlement where user_id = uid for update;
  if r.state = 'new' then
    update public.entitlement
       set state = 'trialing', trial_started_at = pg_catalog.now(), trial_ends_at = pg_catalog.now() + interval '348 hours'
     where user_id = uid returning * into r;
    insert into public.entitlement_event (user_id, kind, source) values (uid, 'trial_started', 'system');
  elsif r.state = 'trialing' and r.trial_ends_at <= pg_catalog.now() then
    update public.entitlement set state = 'trial_expired' where user_id = uid returning * into r;
    insert into public.entitlement_event (user_id, kind, source) values (uid, 'trial_expired', 'system');
  end if;
  return public.entitlement_json(r);
end $$;

-- Explicit, logged founder actions. Callable ONLY by the service role. A reason is mandatory and is stored.
--   comp   : grant complete access (testers, partners)          uncomp : return to the state the dates imply
--   extend : add hours to a trial that has started (compensation for an outage, for example)
create function public.entitlement_admin(p_user uuid, p_action text, p_hours integer, p_reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.entitlement;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service role only' using errcode = '42501'; end if;
  if p_reason is null or char_length(p_reason) not between 1 and 200 then raise exception 'a reason of 1 to 200 characters is required' using errcode = '22023'; end if;
  insert into public.entitlement (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into r from public.entitlement where user_id = p_user for update;
  if p_action = 'comp' then
    update public.entitlement set state = 'comped' where user_id = p_user returning * into r;
    insert into public.entitlement_event (user_id, kind, source, reason) values (p_user, 'admin_comp', 'admin', p_reason);
  elsif p_action = 'uncomp' then
    update public.entitlement
       set state = case when trial_started_at is null then 'new'
                        when trial_ends_at <= pg_catalog.now() then 'trial_expired' else 'trialing' end
     where user_id = p_user returning * into r;
    insert into public.entitlement_event (user_id, kind, source, reason) values (p_user, 'admin_uncomp', 'admin', p_reason);
  elsif p_action = 'extend' then
    if r.trial_started_at is null then raise exception 'the trial has not started' using errcode = '22023'; end if;
    if p_hours is null or p_hours not between 1 and 8760 then raise exception 'hours must be 1 to 8760' using errcode = '22023'; end if;
    update public.entitlement
       set trial_ends_at = trial_ends_at + (p_hours * interval '1 hour'),
           state = case when trial_ends_at + (p_hours * interval '1 hour') > pg_catalog.now() then 'trialing' else 'trial_expired' end
     where user_id = p_user returning * into r;
    insert into public.entitlement_event (user_id, kind, source, hours, reason) values (p_user, 'admin_extend', 'admin', p_hours, p_reason);
  else
    raise exception 'unknown action' using errcode = '22023';
  end if;
  return public.entitlement_json(r);
end $$;

-- Supabase grants EXECUTE on new functions to anon/authenticated/service_role by default (found while testing Option B), so revoke BY NAME first.
revoke all on function public.entitlement_guard()                                        from public, anon, authenticated, service_role;
revoke all on function public.entitlement_json(public.entitlement)                       from public, anon, authenticated, service_role;
revoke all on function public.entitlement_get()                                          from public, anon, authenticated, service_role;
revoke all on function public.entitlement_first_rep_completed()                          from public, anon, authenticated, service_role;
revoke all on function public.entitlement_admin(uuid, text, integer, text)               from public, anon, authenticated, service_role;
grant execute on function public.entitlement_get()                                       to authenticated;
grant execute on function public.entitlement_first_rep_completed()                       to authenticated;
grant execute on function public.entitlement_admin(uuid, text, integer, text)            to service_role;

commit;
