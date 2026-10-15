-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- OPTION B: opt-in "Back up my practice"   ·   DRAFT   ·   NOT APPLIED   ·   NOT IN supabase/migrations
--
-- This file is a PROPOSAL for review. It has been executed only against a throwaway, in-memory PostgreSQL 16 (PGlite) by
-- scripts/runtime/backup-sql.test.ts. It has NOT been run against the Mirar Supabase project, and must not be, until the
-- owner gives separate, explicit approval for a staging migration (docs/product/OPTION_B_IMPLEMENTATION_SPEC.md §12).
--
-- Contract: an append-only, structured, owner-only event log. No free text, no time of day, no email, no device id.
-- Clients have SELECT only. Every write goes through a SECURITY DEFINER function that checks auth.uid(), consent, the
-- whitelist and the ordering rules. Deleting is a single function. Replay of the events through the frozen engine
-- reproduces the engine state (docs/product/OPTION_B_IMPLEMENTATION_SPEC.md §5).
-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── 1. Tables ──────────────────────────────────────────────────────────────────────────────────────────────────────

-- Public, non-personal reference data: the ids the engine can ever emit, per engine version. Generated from the frozen
-- catalog by scripts/runtime/gen-backup-catalog.ts (002_catalog_seed.sql). It is what makes "no free text" a DATA-LAYER
-- guarantee: an id that is not in this table cannot be stored, however it is spelled.
create table public.inner_rep_catalog_vocab (
  engine_version text not null,
  kind           text not null check (kind in ('template', 'option', 'step')),
  id             text not null check (id ~ '^[a-z][a-z0-9_]{0,47}$'),
  primary key (engine_version, kind, id)
);

-- One row per user. user_seed is NOT stored: the runtime derives it from the account id (hashSeed(uid)), so it is identical on
-- every device. Nothing here identifies a device, a location or a time of day.
create table public.inner_rep_profile (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  engine_version  text    not null check (engine_version ~ '^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9]+(-[a-z0-9]+)*)?$'),
  sync_enabled    boolean not null default false,
  consent_version text,
  consented_on    date,
  last_seq        integer not null default 0 check (last_seq >= 0),
  last_day        date,
  -- Identifies one generation of the account's history. A new random value is created whenever the profile is created, so deleting the
  -- history and later turning backup on again yields a NEW epoch. A device that synced under an older epoch is therefore recognised as
  -- stale and can neither append to, nor silently restore, the new history (G1 condition: deletion must not be undone by an old device).
  epoch           uuid    not null default gen_random_uuid(),
  created_day     date    not null default current_date,
  updated_day     date    not null default current_date
);

-- Immutable, append-only. (user_id, seq) is the identity. Calendar days only.
create table public.inner_rep_event (
  user_id        uuid    not null references auth.users (id) on delete cascade,
  seq            integer not null check (seq >= 1),
  day            date    not null,
  kind           text    not null check (kind in ('rep_completed', 'rep_abandoned', 'feedback', 'correction')),
  engine_version text    not null,
  payload        jsonb   not null check (jsonb_typeof(payload) = 'object' and length(payload::text) <= 2000),
  primary key (user_id, seq)
);
-- One rep outcome (completed OR abandoned) per user per calendar day, across devices. The first device to write wins.
create unique index inner_rep_one_rep_outcome_per_day on public.inner_rep_event (user_id, day) where kind in ('rep_completed', 'rep_abandoned');
-- One feedback and one correction per insight.
create unique index inner_rep_one_feedback_per_insight   on public.inner_rep_event (user_id, (payload ->> 'insightDay')) where kind = 'feedback';
create unique index inner_rep_one_correction_per_insight on public.inner_rep_event (user_id, (payload ->> 'insightDay')) where kind = 'correction';

-- ─── 2. Privileges and row-level security: owner-only, read-only for clients ────────────────────────────────────────
-- Supabase grants new public tables to anon/authenticated by default. Revoke explicitly; the live project's grants must ALSO be
-- verified directly before any real data is stored (docs/product/OPTION_B_IMPLEMENTATION_SPEC.md §12, gate G4).
alter table public.inner_rep_catalog_vocab enable row level security;
alter table public.inner_rep_profile       enable row level security;
alter table public.inner_rep_event         enable row level security;
revoke all on table public.inner_rep_catalog_vocab, public.inner_rep_profile, public.inner_rep_event from public, anon, authenticated;
grant select on table public.inner_rep_catalog_vocab, public.inner_rep_profile, public.inner_rep_event to authenticated;
create policy vocab_read    on public.inner_rep_catalog_vocab for select to authenticated using (true);
create policy profile_owner on public.inner_rep_profile       for select to authenticated using (user_id = (select auth.uid()));
create policy event_owner   on public.inner_rep_event         for select to authenticated using (user_id = (select auth.uid()));
-- There is deliberately NO insert, update or delete policy and NO such grant: the only write paths are the functions below.

-- ─── 3. Validation (mirrors lib/innerRep/backup/events.ts validateEvent one for one) ────────────────────────────────
create function public.inner_rep_is_real_date(p text) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if p is null or p !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
  return to_char(p::date, 'YYYY-MM-DD') = p;     -- p::date raises for 2026-02-30; round-trip also rejects rollovers
exception when others then return false;
end $$;

-- Returns NULL when the event is acceptable, otherwise the reason. Never reads or returns anything personal.
create function public.inner_rep_validate_event(p_engine text, p_kind text, p_day date, p_payload jsonb) returns text
language plpgsql stable set search_path = '' as $$
declare
  k text; a jsonb; n int; v text;
  domains text[] := array['work','partner','family','friends','self','body_health','money','time','technology','rest','other','unknown'];
  timeframes text[] := array['today','tomorrow','this_week','specific_date','none'];
  frames text[] := array['base','lens','thread_check','resolution','event_check','commitment_check'];
  kinds_answer text[] := array['option','unknown','skip','domain','timeframe','yes','no','words'];
  fb text[] := array['accurate','partly','no','unsure'];
  corrections text[] := array['situation_right_meaning_off','importance_overstated','something_missing','changed_since','something_else','prefer_not_to_say'];
  allowed text[];
begin
  if p_kind not in ('rep_completed','rep_abandoned','feedback','correction') then return 'unknown kind'; end if;
  if p_day is null then return 'day required'; end if;
  if not exists (select 1 from public.inner_rep_catalog_vocab where engine_version = p_engine) then return 'engine version is not in the catalog'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then return 'payload must be an object'; end if;

  allowed := case p_kind
    when 'rep_completed' then array['template','frame','bound','variant','answers']
    when 'rep_abandoned' then array['template']
    when 'feedback'      then array['insightDay','value']
    else                      array['insightDay','reason'] end;
  for k in select jsonb_object_keys(p_payload) loop
    if not (k = any (allowed)) then return 'key outside the whitelist: ' || k; end if;
  end loop;

  if p_kind in ('rep_completed','rep_abandoned') then
    v := p_payload ->> 'template';
    if v is null or jsonb_typeof(p_payload -> 'template') <> 'string' or not exists (select 1 from public.inner_rep_catalog_vocab where engine_version = p_engine and kind = 'template' and id = v) then return 'unknown template id'; end if;
  end if;

  if p_kind = 'rep_completed' then
    if jsonb_typeof(p_payload -> 'frame') is distinct from 'string' or not ((p_payload ->> 'frame') = any (frames)) then return 'unknown frame'; end if;
    if p_payload ? 'bound' and (jsonb_typeof(p_payload -> 'bound') <> 'string' or not ((p_payload ->> 'bound') = any (domains))) then return 'unknown domain'; end if;
    if p_payload ? 'variant' and (jsonb_typeof(p_payload -> 'variant') <> 'number' or (p_payload ->> 'variant') !~ '^[0-9]$') then return 'variant out of range'; end if;
    if jsonb_typeof(p_payload -> 'answers') is distinct from 'array' then return 'answers must be an array'; end if;
    n := jsonb_array_length(p_payload -> 'answers');
    if n < 1 or n > 8 then return 'answers must have 1 to 8 entries'; end if;
    for a in select * from jsonb_array_elements(p_payload -> 'answers') loop
      if jsonb_typeof(a) <> 'object' then return 'answer must be an object'; end if;
      for k in select jsonb_object_keys(a) loop if not (k = any (array['s','k','o','d','tf','date'])) then return 'answer key outside the whitelist: ' || k; end if; end loop;
      if jsonb_typeof(a -> 's') is distinct from 'string' or not exists (select 1 from public.inner_rep_catalog_vocab where engine_version = p_engine and kind = 'step' and id = a ->> 's') then return 'unknown step id'; end if;
      if jsonb_typeof(a -> 'k') is distinct from 'string' or not ((a ->> 'k') = any (kinds_answer)) then return 'unknown answer kind'; end if;
      v := a ->> 'k';
      if v = 'option'    and not (a ? 'o')  then return 'option requires o'; end if;
      if v = 'domain'    and not (a ? 'd')  then return 'domain requires d'; end if;
      if v = 'timeframe' and not (a ? 'tf') then return 'timeframe requires tf'; end if;
      if a ? 'o'  and (v <> 'option'    or jsonb_typeof(a -> 'o') <> 'string' or not exists (select 1 from public.inner_rep_catalog_vocab where engine_version = p_engine and kind = 'option' and id = a ->> 'o')) then return 'unknown option id'; end if;
      if a ? 'd'  and (v <> 'domain'    or jsonb_typeof(a -> 'd') <> 'string' or not ((a ->> 'd') = any (domains))) then return 'unknown domain'; end if;
      if a ? 'tf' and (v <> 'timeframe' or jsonb_typeof(a -> 'tf') <> 'string' or not ((a ->> 'tf') = any (timeframes))) then return 'unknown timeframe'; end if;
      if a ? 'date' and (v <> 'timeframe' or (a ->> 'tf') is distinct from 'specific_date' or jsonb_typeof(a -> 'date') <> 'string' or not public.inner_rep_is_real_date(a ->> 'date')) then return 'date only with specific_date and a real calendar date'; end if;
      if (a ->> 'tf') = 'specific_date' and not (a ? 'date') then return 'specific_date requires a date'; end if;
    end loop;
  elsif p_kind in ('feedback','correction') then
    if jsonb_typeof(p_payload -> 'insightDay') is distinct from 'string' or not public.inner_rep_is_real_date(p_payload ->> 'insightDay') then return 'insightDay must be a real date'; end if;
    if (p_payload ->> 'insightDay')::date > p_day then return 'insightDay must not be after day'; end if;
    if p_kind = 'feedback'   and (jsonb_typeof(p_payload -> 'value')  is distinct from 'string' or not ((p_payload ->> 'value')  = any (fb)))          then return 'unknown feedback value'; end if;
    if p_kind = 'correction' and (jsonb_typeof(p_payload -> 'reason') is distinct from 'string' or not ((p_payload ->> 'reason') = any (corrections))) then return 'unknown correction reason'; end if;
  end if;
  return null;
end $$;

-- ─── 4. Write paths: the ONLY way rows are created, changed or removed ──────────────────────────────────────────────

-- Turn backup ON. Records WHICH consent text version the person accepted (day only). Idempotent.
create function public.inner_rep_enable_backup(p_engine text, p_consent_version text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); prof public.inner_rep_profile%rowtype;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_consent_version is distinct from '2026-10-v1' then raise exception 'consent text version not recognised' using errcode = '22023'; end if;
  if not exists (select 1 from public.inner_rep_catalog_vocab where engine_version = p_engine) then raise exception 'engine version is not in the catalog' using errcode = '22023'; end if;
  insert into public.inner_rep_profile (user_id, engine_version, sync_enabled, consent_version, consented_on)
  values (uid, p_engine, true, p_consent_version, current_date)
  on conflict (user_id) do update set sync_enabled = true, consent_version = excluded.consent_version, consented_on = excluded.consented_on, updated_day = current_date
  returning * into prof;
  return jsonb_build_object('sync_enabled', prof.sync_enabled, 'last_seq', prof.last_seq, 'last_day', prof.last_day, 'engine_version', prof.engine_version, 'epoch', prof.epoch);
end $$;

-- Turn backup OFF. Stops new writes. Keeps what is already stored (deleting is a separate, deliberate function).
create function public.inner_rep_disable_backup() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  update public.inner_rep_profile set sync_enabled = false, updated_day = current_date where user_id = uid;
  return jsonb_build_object('sync_enabled', false);
end $$;

-- Append events. p_epoch must be the epoch the caller synced under (a mismatch means the account history was deleted and started again since). p_base_seq is the last server sequence the caller has replayed (optimistic concurrency): if the log has moved on,
-- NOTHING is written and the caller must pull, replay and rebase. Validation failures abort the whole batch (a bug or tampering);
-- ordering conflicts are reported per event and do not abort (a second device that lost a day is a normal outcome).
create function public.inner_rep_append_events(p_epoch uuid, p_base_seq integer, p_events jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); prof public.inner_rep_profile%rowtype; ev jsonb; i int := 0; reason text; d date;
  results jsonb := '[]'::jsonb; res text; has_rep boolean; has_part boolean;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 200 then raise exception 'events must be an array of at most 200' using errcode = '22023'; end if;
  select * into prof from public.inner_rep_profile where user_id = uid for update;
  if not found or not prof.sync_enabled then raise exception 'backup is not turned on' using errcode = '42501'; end if;
  if prof.epoch is distinct from p_epoch then raise exception 'account history was reset' using errcode = '55000'; end if;
  if prof.last_seq <> p_base_seq then return jsonb_build_object('status', 'stale', 'last_seq', prof.last_seq); end if;

  for ev in select * from jsonb_array_elements(p_events) loop
    i := i + 1;
    if jsonb_typeof(ev) <> 'object' or not (ev ? 'day') or not public.inner_rep_is_real_date(ev ->> 'day') then raise exception 'event % has no valid day', i using errcode = '22023'; end if;
    d := (ev ->> 'day')::date;
    if (ev ->> 'engine') is distinct from prof.engine_version then raise exception 'event % engine version differs from the account''s', i using errcode = '22023'; end if;
    reason := public.inner_rep_validate_event(ev ->> 'engine', ev ->> 'kind', d, ev - 'kind' - 'day' - 'engine');
    if reason is not null then raise exception 'event % rejected: %', i, reason using errcode = '22023'; end if;
    if d > current_date + 1 then raise exception 'event % is dated in the future', i using errcode = '22023'; end if;

    res := 'ok';
    if prof.last_day is not null and d < prof.last_day then res := 'rejected_day_passed';
    elsif (ev ->> 'kind') in ('rep_completed','rep_abandoned') and exists (select 1 from public.inner_rep_event where user_id = uid and day = d and kind in ('rep_completed','rep_abandoned')) then res := 'rejected_day_taken';
    elsif (ev ->> 'kind') in ('feedback','correction') then
      select exists (select 1 from public.inner_rep_event where user_id = uid and kind = 'rep_completed' and day = ((ev ->> 'insightDay')::date)) into has_rep;
      if not has_rep then res := 'rejected_no_insight';
      elsif (ev ->> 'kind') = 'correction' then
        select exists (select 1 from public.inner_rep_event where user_id = uid and kind = 'feedback' and payload ->> 'insightDay' = ev ->> 'insightDay' and payload ->> 'value' = 'partly') into has_part;
        if not has_part then res := 'rejected_order'; end if;
      end if;
    end if;

    if res = 'ok' then
      begin
        insert into public.inner_rep_event (user_id, seq, day, kind, engine_version, payload)
        values (uid, prof.last_seq + 1, d, ev ->> 'kind', prof.engine_version, ev - 'kind' - 'day' - 'engine');
        prof.last_seq := prof.last_seq + 1; prof.last_day := d;
      exception when unique_violation then res := 'rejected_duplicate';
      end;
    end if;
    results := results || to_jsonb(res);
  end loop;

  update public.inner_rep_profile set last_seq = prof.last_seq, last_day = prof.last_day, updated_day = current_date where user_id = uid;
  return jsonb_build_object('status', 'ok', 'last_seq', prof.last_seq, 'results', results);
end $$;

-- Delete everything stored for the caller: events and profile. Irreversible. The client clears its own copy separately, on request.
create function public.inner_rep_delete_my_practice() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); n_events int; n_profile int;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  delete from public.inner_rep_event where user_id = uid; get diagnostics n_events = row_count;
  delete from public.inner_rep_profile where user_id = uid; get diagnostics n_profile = row_count;
  return jsonb_build_object('deleted_events', n_events, 'deleted_profile', n_profile);
end $$;

-- ─── 5. Function privileges: signed-in users only; never anon, never public ─────────────────────────────────────────
revoke all on function public.inner_rep_is_real_date(text), public.inner_rep_validate_event(text, text, date, jsonb),
  public.inner_rep_enable_backup(text, text), public.inner_rep_disable_backup(), public.inner_rep_append_events(uuid, integer, jsonb),
  public.inner_rep_delete_my_practice() from public, anon, authenticated;   -- Supabase's default privileges grant EXECUTE to authenticated explicitly, so it must be revoked by name
grant execute on function public.inner_rep_enable_backup(text, text), public.inner_rep_disable_backup(),
  public.inner_rep_append_events(uuid, integer, jsonb), public.inner_rep_delete_my_practice() to authenticated;
-- inner_rep_validate_event / inner_rep_is_real_date are internal (called by the definer functions); not granted to clients.
