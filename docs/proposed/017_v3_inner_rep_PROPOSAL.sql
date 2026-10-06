-- PROPOSAL ONLY — lives in docs/, not supabase/migrations/. DO NOT RUN.
-- v3 changes vs v2: context taxonomy table; observations carry ORIGIN and the set
-- of contexts OFFERED (selection-bias safeguard); threads (incl. one-off events);
-- richer commitments; 3-layer decision stored on each instance; evidence types
-- extended; independence counts stored on evidence; correction path on feedback.
-- Guiding rule: what the user SAID, what Mirar SERVED, what Mirar INFERRED are
-- different tables; inference rows must reference the observations behind them.
-- ───────────────────────────────────────────────────────────────────────────

-- 0. Shared context taxonomy (small, versioned, translatable by label only).
create table public.context_taxonomy (
  id         text primary key,                       -- 'work','partner',...
  kind       text not null check (kind in ('domain','orientation')),  -- cheap to split later
  sort       integer not null,
  active     boolean not null default true
);
-- seed (15): domain: work, partner, family, friends, money, body_health, self;
--            orientation: time, phone_tech, future, past, uncertainty, rest;
--            other, unknown     ('unknown' = user couldn't/wouldn't say; ≠ no row)

-- 1. SERVED. One row per rep shown, with WHY (all three layers).
create table public.inner_rep_instances (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  local_date         date not null,                  -- the user's own calendar day
  template_id        text not null,
  template_version   integer not null,
  frame_id           text not null default 'base',   -- variant (e.g. context-bound frame)
  capacity           text not null check (capacity in ('direction','energy','focus','relationships','growth','action')),
  sub_capacity       text,
  mechanism          text not null,
  interaction_type   text not null,
  intensity          text not null check (intensity in ('light','medium','deep')),
  bound_context_id   text references public.context_taxonomy(id),   -- if the rep was framed around a context
  layer_winner       text not null check (layer_winner in ('continuity','context','training','rest')),
  intent_kind        text not null,                  -- e.g. commitment_due | thread_check | convergence_test | anchor_probe | fresh
  intent_ref         uuid,                           -- commitment / thread this serves, if any
  decision_trace     jsonb not null default '{}',    -- constraints applied + candidates considered
  engine_version     text not null,
  served_at          timestamptz not null default now(),
  completed_at       timestamptz,
  status             text not null default 'served' check (status in ('served','completed','skipped','abandoned')),
  duration_ms        integer,
  safety_panel_shown boolean not null default false, -- boolean only; never the text
  unique (user_id, local_date)
);

-- 2. SAID (structured). The unit of evidence is an OBSERVATION.
create table public.observations (
  id               uuid primary key default gen_random_uuid(),
  instance_id      uuid not null references public.inner_rep_instances(id) on delete cascade,
  user_id          uuid not null references public.users(id) on delete cascade,
  step             text not null check (step in ('primary','follow_up','context_capture','correction')),
  capacity         text not null,
  sub_capacity     text,
  mechanism        text not null,
  signal_id        text,                             -- concrete issue, e.g. 'meetings' (template-scoped vocabulary)
  context_id       text references public.context_taxonomy(id),
  context_source   text check (context_source in ('option_defined','user_tapped','none')),  -- NEVER 'inferred_from_text'
  polarity         text not null default 'present' check (polarity in ('present','absent','unknown')),
                                                     -- 'absent' = honest "not this" answer; counter-evidence
  burden           boolean,
  option_id        text, option_label text,          -- snapshot of what the user saw and chose
  -- selection-bias safeguards:
  origin           text not null check (origin in
                     ('prompted_choice','prompted_text','user_introduced','thread_continuation','commitment','correction')),
  offered_contexts text[] not null default '{}',     -- contexts that were AVAILABLE as answers (exposure)
  thread_id        uuid,                             -- continuation chain
  continuation_of  uuid references public.observations(id),
  source           text not null default 'user' check (source = 'user'),
  observed_at      timestamptz not null default now()
);
-- Independence rule (enforced in the evidence engine, documented here): observations
-- sharing a thread_id/continuation chain count as ONE independent observation.

-- 3. SAID (free text) — separate table: own retention, deletion, export;
--    never joined into analytics, never sent to a model without explicit opt-in.
create table public.inner_rep_free_text (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  instance_id     uuid not null references public.inner_rep_instances(id) on delete cascade,
  observation_id  uuid references public.observations(id) on delete set null,
  origin          text not null check (origin in ('prompted_text','user_introduced')),
  body            text not null check (char_length(body) <= 280),
  safety_checker  text not null,                      -- checker id+version that passed it
  expires_at      timestamptz,                        -- optional retention (decision pending)
  created_at      timestamptz not null default now()
);

-- 4. THREADS: something open. kind 'event' = one-off significant event (decays).
create table public.threads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  kind           text not null check (kind in ('ongoing','event')),
  context_id     text references public.context_taxonomy(id),
  state          text not null check (state in ('candidate','open','dormant','resolved')),
  state_source   text not null check (state_source in ('engine','user')),
  opened_from    uuid references public.observations(id),
  opened_via     text not null check (opened_via in ('user_introduced','user_confirmed','engine_candidate')),
  last_user_confirmation_at timestamptz,
  expires_at     timestamptz,                         -- events only
  created_at     timestamptz not null default now(),
  -- an engine-set candidate is internal: never shown as a fact, never counted as user-confirmed
  check (state <> 'resolved' or state_source = 'user')
);

-- 5. COMMITMENTS. Only the USER can mark done/partly/changed_mind/dropped. The only
--    system status is 'unconfirmed' (date passed, no update) — neutral, never "failed".
create table public.commitments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  origin_observation uuid references public.observations(id) on delete set null,
  kind             text not null check (kind in ('reach_out','start','finish','decide','rest','other')),
  context_id       text references public.context_taxonomy(id),
  label_free_text_id uuid references public.inner_rep_free_text(id) on delete set null, -- optional, user-written
  timeframe_kind   text not null check (timeframe_kind in ('today','tomorrow','this_week','specific_date','none')),
  timeframe_source text not null default 'user' check (timeframe_source = 'user'),
  due_on           date,
  status           text not null default 'open'
                   check (status in ('open','done','partly_done','postponed','changed_mind','dropped_on_purpose','unconfirmed')),
  postponed_until  date,
  status_source    text not null check (status_source in ('user','system')),
  status_changed_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  check (status <> 'unconfirmed' or status_source = 'system'),
  check (status in ('open','unconfirmed') or status_source = 'user')
);
create table public.commitment_events (            -- append-only history of status changes
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  from_status text, to_status text not null,
  by text not null check (by in ('user','system')),
  at timestamptz not null default now()
);

-- 6. INFERRED: evidence — one row per claim-able fact; typed, not forced through one threshold.
create table public.mirror_evidence (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  kind            text not null check (kind in
                    ('repeated_signal','cross_capacity_convergence','change','contradiction',
                     'unresolved_thread','follow_through','resolution','one_off_event')),
  subject         jsonb not null,                   -- {context_id?, signal_id?, capacities?, thread_id?, commitment_id?}
  -- evidential-weight inputs (counts, not a fake probability):
  independent_n   integer not null,                 -- after collapsing continuation chains
  offered_n       integer,                          -- opportunities (reps where the subject was an available answer)
  prompted_n      integer not null default 0,
  introduced_n    integer not null default 0,       -- user_introduced observations
  continuation_n  integer not null default 0,       -- excluded from independence
  negative_n      integer not null default 0,       -- polarity='absent' tests
  support         text not null check (support in ('tentative','supported')),
  window_start    timestamptz not null, window_end timestamptz not null,
  rule_id         text not null, engine_version text not null,
  status          text not null default 'active' check (status in ('active','retired')),
  retired_reason  text, retired_by_evidence uuid references public.mirror_evidence(id),
  source          text not null default 'rules' check (source in ('rules','model')),
  computed_at     timestamptz not null default now()
);
create table public.mirror_evidence_refs (
  evidence_id    uuid not null references public.mirror_evidence(id) on delete cascade,
  observation_id uuid not null references public.observations(id) on delete cascade,
  role           text not null check (role in ('supports','counters','context')),
  primary key (evidence_id, observation_id)
);

-- 7. INFERRED: what was SHOWN. Template + params so it can be audited and re-derived.
create table public.mirror_insights (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  instance_id      uuid references public.inner_rep_instances(id) on delete set null,
  kind             text not null check (kind in ('observation','pattern','convergence','change','contradiction','resolution','hypothesis','unknown')),
  template_id      text not null,
  template_params  jsonb not null default '{}',
  shown_text       text not null,
  generated_by     text not null,                   -- 'rules_v1' | 'model:<id>'
  status           text not null default 'shown' check (status in ('shown','retired','refuted_by_user')),
  suppress_until   timestamptz,                      -- set when the user disagrees
  shown_at         timestamptz not null default now()
);
create table public.mirror_insight_evidence (
  insight_id  uuid not null references public.mirror_insights(id) on delete cascade,
  evidence_id uuid not null references public.mirror_evidence(id) on delete restrict,
  primary key (insight_id, evidence_id)
);
-- Provenance rule: every mirror_insights row needs >=1 mirror_insight_evidence row.
-- Enforce with a DEFERRABLE INITIALLY DEFERRED constraint trigger (checked at commit).

-- 8. User feedback (append-only). 'correction' lets the user say what it IS about;
--    that becomes an observation with origin='correction' (strong user-set context).
create table public.mirror_insight_feedback (
  id                    uuid primary key default gen_random_uuid(),
  insight_id            uuid not null references public.mirror_insights(id) on delete cascade,
  user_id               uuid not null references public.users(id) on delete cascade,
  value                 text not null check (value in ('accurate','partly','no','unsure')),
  correction_context_id text references public.context_taxonomy(id),
  created_at            timestamptz not null default now()
);

-- RLS: every table enabled; user_id = auth.uid() for select/insert; update only on
-- inner_rep_instances (completion), threads (state), commitments (status); delete own rows
-- on inner_rep_free_text (user-facing delete) and everything via users cascade.
-- context_taxonomy: read-only to authenticated.
-- Evidence/insight inserts from the client are acceptable ONLY while rules run
-- client-side; move to an edge function before any model-generated insight.
