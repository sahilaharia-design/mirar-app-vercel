-- 017: Daily Inner Rep responses (additive; legacy `responses` untouched).
-- Run in the Supabase SQL editor. Safe to re-run.
create table if not exists public.inner_rep_responses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  exercise_id      text not null,
  capacity         text not null check (capacity in ('direction','energy','focus','relationships','growth','action')),
  sub_capacity     text,
  interaction_type text not null,
  intensity        text not null,
  answer           jsonb not null default '{}'::jsonb,
  safety_shown     boolean not null default false,
  duration_ms      integer,
  completed_at     timestamptz not null default now(),
  insight          jsonb,
  insight_feedback text check (insight_feedback in ('accurate','partly','no','unsure')),
  created_at       timestamptz not null default now()
);

create index if not exists inner_rep_responses_user_completed_idx
  on public.inner_rep_responses (user_id, completed_at desc);

alter table public.inner_rep_responses enable row level security;

drop policy if exists "inner_rep own select" on public.inner_rep_responses;
create policy "inner_rep own select" on public.inner_rep_responses
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "inner_rep own insert" on public.inner_rep_responses;
create policy "inner_rep own insert" on public.inner_rep_responses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "inner_rep own update" on public.inner_rep_responses;
create policy "inner_rep own update" on public.inner_rep_responses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
