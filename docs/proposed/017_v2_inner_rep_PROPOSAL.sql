-- PROPOSAL ONLY — not in supabase/migrations/, not to be run. For review.
-- Principle: what the user SAID, what Mirar SERVED, and what Mirar INFERRED
-- live in different tables. Inference rows must point at the user rows that
-- justify them; an insight with no evidence rows must not exist.
-- ───────────────────────────────────────────────────────────────────────────

-- 1. SERVED: one row per rep shown. Records the decision, so "why did I get
--    this?" is answerable, and "served but abandoned" is visible.
create table public.inner_rep_instances (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  exercise_id      text not null,
  exercise_version integer not null,            -- catalog version at serve time
  capacity         text not null check (capacity in ('direction','energy','focus','relationships','growth','action')),
  sub_capacity     text,
  intensity        text not null,
  interaction_type text not null,
  decision_kind    text not null check (decision_kind in ('fresh','continuation','follow_through','recovery','rest')),
  decision_terms   jsonb not null default '[]',  -- engine score terms (explainability)
  engine_version   text not null,                -- config + code version
  served_at        timestamptz not null default now(),
  completed_at     timestamptz,
  status           text not null default 'served' check (status in ('served','completed','skipped','abandoned')),
  duration_ms      integer,
  unique (user_id, (served_at::date))            -- one rep per day (UTC date; see note below)
);
-- NOTE: calendar day is the user's local day. A UTC-date uniqueness constraint
-- is wrong for IST; store `local_date date not null` from the client and
-- unique (user_id, local_date) instead. Left as a review item.

-- 2. SAID (structured): what the user chose. Snapshots the meaning of the
--    option at answer time, so editing the catalog later cannot rewrite history.
create table public.inner_rep_answers (
  id            uuid primary key default gen_random_uuid(),
  instance_id   uuid not null references public.inner_rep_instances(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  step          text not null check (step in ('primary','follow_up')),
  option_id     text,                             -- null when unknown
  option_key    text,                             -- e.g. drain_source
  option_tag    text,                             -- e.g. work
  option_label  text,                             -- exact words the user saw
  context_tag   text,                             -- shared vocabulary: work|people|body|thoughts|phone|... (cross-exercise)
  burden        boolean,
  is_unknown    boolean not null default false,
  source        text not null default 'user' check (source = 'user'),
  answered_at   timestamptz not null default now()
);

-- 3. SAID (free text): separate table on purpose — different retention, can be
--    deleted/exported independently, never joined into analytics, never sent to
--    any AI provider unless a future, explicit opt-in says so.
create table public.inner_rep_free_text (
  id           uuid primary key default gen_random_uuid(),
  instance_id  uuid not null references public.inner_rep_instances(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  body         text not null check (char_length(body) <= 280),
  safety_checked boolean not null default true,   -- only rows that passed the check exist
  source       text not null default 'user' check (source = 'user'),
  created_at   timestamptz not null default now()
);

-- 4. COMMITMENTS: the user's stated intention + the user's own status changes.
--    "lapsed" is the only system-set status and means only "due date passed
--    with no update" — Mirar never records "failed".
create table public.commitments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  origin_answer_id  uuid references public.inner_rep_answers(id) on delete set null,
  timeframe_kind    text not null check (timeframe_kind in ('today','tomorrow','this_week','whenever','none')),
  timeframe_source  text not null check (timeframe_source in ('user','inferred')),
  due_on            date,
  status            text not null default 'open'
                    check (status in ('open','done','postponed','changed_mind','dropped_on_purpose','lapsed')),
  postponed_until   date,
  status_source     text not null check (status_source in ('user','system')),
  status_changed_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  check (status <> 'lapsed' or status_source = 'system'),
  check (status = 'lapsed' or status_source = 'user' or status = 'open')
);

-- 5. INFERRED: evidence. Derived, recomputable, always labelled with the rule
--    and version that produced it. Never contains user free text.
create table public.mirror_evidence (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  kind         text not null check (kind in ('repeated_signal','association','change','contradiction','resolution','high_salience_event')),
  subject      jsonb not null,                    -- e.g. {"key":"drain_source","tag":"work"}
  count        integer not null,
  of_total     integer not null,
  window_start timestamptz not null,
  window_end   timestamptz not null,
  rule_id      text not null,                     -- e.g. repeated_signal.v1
  engine_version text not null,
  source       text not null default 'rules' check (source in ('rules','model')),
  computed_at  timestamptz not null default now()
);
create table public.mirror_evidence_refs (
  evidence_id uuid not null references public.mirror_evidence(id) on delete cascade,
  answer_id   uuid not null references public.inner_rep_answers(id) on delete cascade,
  primary key (evidence_id, answer_id)
);

-- 6. INFERRED: insights shown to the user. Text is rebuilt from template +
--    params, so it can be audited. Hypotheses are insights with kind='hypothesis'
--    and a status the user can move.
create table public.mirror_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  instance_id   uuid references public.inner_rep_instances(id) on delete set null,
  kind          text not null check (kind in ('observation','pattern','contradiction','hypothesis','unknown')),
  template_id   text not null,
  template_params jsonb not null default '{}',
  shown_text    text not null,                    -- exactly what was displayed
  support       text not null check (support in ('tentative','supported')),  -- derived from thresholds, not a made-up probability
  generated_by  text not null,                    -- 'rules_v1' | 'model:<id>'
  status        text not null default 'shown' check (status in ('shown','retired','refuted_by_user')),
  retired_reason text,
  shown_at      timestamptz not null default now()
);
create table public.mirror_insight_evidence (
  insight_id  uuid not null references public.mirror_insights(id) on delete cascade,
  evidence_id uuid not null references public.mirror_evidence(id) on delete restrict,
  primary key (insight_id, evidence_id)
);
-- Provenance rule: a mirror_insights row must have >=1 mirror_insight_evidence
-- row. FKs cannot enforce "child exists"; enforce with a DEFERRABLE INITIALLY
-- DEFERRED constraint trigger (checked at commit), and in app code.

-- 7. USER FEEDBACK on an insight: append-only, so changing your mind keeps history.
create table public.mirror_insight_feedback (
  id         uuid primary key default gen_random_uuid(),
  insight_id uuid not null references public.mirror_insights(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  value      text not null check (value in ('accurate','partly','no','unsure')),
  created_at timestamptz not null default now()
);

-- RLS (all tables): enable; select/insert for own rows (user_id = auth.uid());
-- update only on commitments (status) and instances (completion); delete own
-- rows for a user-facing "delete my reps". mirror_* tables: insert by the
-- client is acceptable ONLY while evidence is computed client-side; move to an
-- edge function before any model-generated insight exists.
