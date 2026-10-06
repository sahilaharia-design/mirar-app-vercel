-- PROPOSAL ONLY — lives in docs/, not supabase/migrations/. DO NOT RUN.
-- Final schema proposal AFTER the v2 simulator (docs/V2_SIMULATION_REPORT.md). Supersedes the earlier v3 draft.
-- Changes driven by simulation are marked  -- SIM:  . Principles unchanged:
--   what the user SAID, what Mirar SERVED/DECIDED, and what Mirar INFERRED live in different tables;
--   every inference points at the observations behind it; only the user closes or drops things;
--   raw free text is separate, optional, deletable, and never read by the engine.
-- ───────────────────────────────────────────────────────────────────────────

-- 0. Two small vocabularies, kept independent (domain ≠ orientation).
create table public.domains      (id text primary key, sort int not null, active boolean not null default true);
create table public.orientations (id text primary key, sort int not null, active boolean not null default true);   -- DEFERRED: not collected in the MVP (docs/V2_DECISIONS.md #2); kept so it can return when a selection/evidence rule needs it
-- seed domains:      work, partner, family, friends, self, body_health, money, time, technology, rest, other, unknown
-- seed orientations (deferred): past, present, future, uncertainty, none, unknown
-- Labels live in the app's locale files (en/hi/gu), never in these tables. Extensible by insert.

-- 1. DECISIONS: one row per opened day, INCLUDING "no rep today". SIM: rest and its reason must be auditable.
create table public.inner_rep_decisions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  local_date     date not null,
  outcome        text not null check (outcome in ('rep','rest')),
  layer_winner   text not null check (layer_winner in ('continuity','context','training','probe','rest')),
  intent_kind    text not null,          -- commitment_due | commitment_revisit | event_check | thread_check | resolution_check |
                                         -- lens:<domain> | native:<domain> | probe_confirm | probe_cadence | probe_return | training | rest
  intent_ref     uuid,                   -- thread or commitment this serves
  bound_domain   text references public.domains(id),
  trace          jsonb not null,         -- primary/secondary reason, constraints applied (+what they overrode), rejected, let-rest notes, budget
  engine_version text not null,
  config_version text not null,          -- SIM: thresholds are provisional and will change; every decision records which set decided
  decided_at     timestamptz not null default now(),
  unique (user_id, local_date)
);

-- 2. SERVED: the rep that was shown (null for rest days).
create table public.inner_rep_instances (
  id               uuid primary key default gen_random_uuid(),
  decision_id      uuid not null references public.inner_rep_decisions(id) on delete cascade,
  user_id          uuid not null references public.users(id) on delete cascade,
  template_id      text not null,
  template_version integer not null,
  frame            text not null check (frame in ('base','lens','thread_check','resolution','event_check','commitment_check')),
  capacity         text not null check (capacity in ('direction','energy','focus','relationships','growth','action')),
  sub_capacity     text,
  mechanism        text not null,
  intensity        text not null check (intensity in ('light','medium')),
  interaction_type text not null,
  prompt_variant   smallint,             -- which of the rotating wordings was shown (the open question has 3)
  status           text not null default 'served' check (status in ('served','completed','skipped','abandoned')),
  served_at        timestamptz not null default now(),
  completed_at     timestamptz,
  duration_ms      integer,
  burden           boolean,              -- SIM: engine's recovery rule needs "did the last rep carry a burden" without re-reading answers
  unknown_primary  boolean,              -- SIM: "I don't know"/skip share drives simplify + tentative mode
  safety_panel_shown boolean not null default false  -- boolean only; never text
);

-- 3. SAID (structured). The unit of evidence is an OBSERVATION. Domain and orientation are separate, optional fields.
create table public.observations (
  id               uuid primary key default gen_random_uuid(),
  instance_id      uuid not null references public.inner_rep_instances(id) on delete cascade,
  user_id          uuid not null references public.users(id) on delete cascade,
  step             text not null check (step in ('primary','follow_up','capture')),
  capacity         text not null, sub_capacity text, mechanism text not null,
  signal_id        text,
  domain_id        text references public.domains(id),            -- what part of life
  domain_source    text check (domain_source in ('option','user_tapped','binding')),
  domain_origin    text check (domain_origin in ('prompted_choice','prompted_text','user_introduced','thread_continuation','commitment','correction')),
  orientation_id   text references public.orientations(id),       -- DEFERRED: always NULL in the MVP
  orientation_source text check (orientation_source in ('option','user_tapped')),
  domain_role      text not null check (domain_role in ('issue','resource','none')),  -- SIM: "what helped" must never count as an issue
  polarity         text not null default 'present' check (polarity in ('present','absent','unknown')),
  burden           boolean not null default false,
  option_id        text, option_label text,
  offered_domains  text[] not null default '{}',                   -- exposure (selection-bias safeguard)
  closed_set       boolean not null default false,                 -- SIM: ≤8 named options = opportunities; open lists/chips = salience counts only
  stance_key       text, stance_side text, stance_durable boolean, -- SIM: only durable stances can contradict; daily states cannot
  thread_id        uuid,
  continuation_of  uuid references public.observations(id),
  is_lens          boolean not null default false,
  source           text not null default 'user' check (source = 'user'),
  observed_at      timestamptz not null default now()
);
-- Rule enforced in the evidence engine: observations from context-driven reps (lens/native/thread/event/resolution) are ALWAYS
-- domain_origin='thread_continuation' — including chips tapped inside them. They can falsify or keep a thread alive; they never build a pattern.

-- 4. Free-text: separate table. Retention is the user's choice; deletion tombstones the row and keeps provenance without the words.
create table public.inner_rep_settings (
  user_id               uuid primary key references public.users(id) on delete cascade,
  free_text_retention   text not null default 'never' check (free_text_retention in ('keep','30d','90d','never')),
  updated_at            timestamptz not null default now()
);
create table public.inner_rep_free_text (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  instance_id          uuid not null references public.inner_rep_instances(id) on delete cascade,
  observation_id       uuid references public.observations(id) on delete set null,
  origin               text not null check (origin in ('prompted_text','user_introduced')),
  body                 text check (char_length(body) <= 280),      -- NULL after deletion (tombstone)
  retention_at_write   text not null check (retention_at_write in ('keep','30d','90d')),   -- 'never' is never written
  expires_at           timestamptz,                                -- set from retention_at_write
  safety_checker       text not null,                              -- checker id+version that passed it; NOT validated (see safety notes)
  deletion_requested_at timestamptz,
  deleted_at           timestamptz,
  deleted_reason       text check (deleted_reason in ('user','retention_expired','account_deleted','safety_removed')),
  created_at           timestamptz not null default now(),
  check ((deleted_at is null) = (body is not null))               -- a live row has a body; a tombstone has none
);
-- Deletion: a function sets body = null, deleted_at = now(), deleted_reason. The row (id, instance_id, origin, created_at)
-- survives, so provenance ("the user wrote something here, and the engine used only the context chip they tapped")
-- survives without the words. Evidence never references free_text rows, only observations, so no evidence is invalidated.
-- A scheduled job tombstones rows past expires_at. The engine does not read this table.

-- 5. Threads: ongoing or one-off events.
create table public.threads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  kind           text not null check (kind in ('ongoing','event')),
  domain_id      text not null references public.domains(id),
  orientation_id text references public.orientations(id),         -- DEFERRED: always NULL in the MVP
  state          text not null check (state in ('candidate','open','resting','dormant','resolved')),
  state_source   text not null check (state_source in ('engine','user')),
  opened_from    uuid references public.observations(id),
  opened_via     text not null check (opened_via in ('user_introduced','user_confirmed','engine_candidate')),
  last_confirmed_at timestamptz, last_check_at timestamptz,
  check_count    integer not null default 0,
  neg_streak     integer not null default 0, unknown_streak integer not null default 0,
  rest_until     date, rest_reason text,                           -- SIM: "deliberately let rest" is a first-class, recorded state
  cadence_multiplier integer not null default 1,
  resolution_offered boolean not null default false,
  event_asks     integer not null default 0,
  expires_at     timestamptz,
  created_at     timestamptz not null default now(),
  check (state <> 'resolved' or state_source = 'user')             -- only the user resolves
);
-- SIM: per-domain memory the engine needs across threads (negatives pool across lens + check-ins; user-closed domains stay quiet).
create table public.domain_states (
  user_id       uuid not null references public.users(id) on delete cascade,
  domain_id     text not null references public.domains(id),
  neg_streak    integer not null default 0,
  rest_until    date, rest_reason text,
  quiet_since   date,                                              -- user closed it: only what they say AFTER this date can reactivate it
  thread_declined_until date,
  last_lens_by_capacity jsonb not null default '{}',
  primary key (user_id, domain_id)
);

-- 6. Commitments. Only the user sets done/partly_done/postponed/changed_mind/dropped_on_purpose; the system may only set 'unconfirmed'.
create table public.commitments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  origin_observation uuid references public.observations(id) on delete set null,
  kind             text not null check (kind in ('reach_out','start','finish','decide','rest','other')),
  domain_id        text references public.domains(id),
  label_free_text_id uuid references public.inner_rep_free_text(id) on delete set null,
  timeframe_kind   text not null check (timeframe_kind in ('today','tomorrow','this_week','specific_date','none')),
  timeframe_source text not null default 'user' check (timeframe_source = 'user'),
  due_on           date,
  status           text not null default 'open' check (status in ('open','done','partly_done','postponed','changed_mind','dropped_on_purpose','unconfirmed')),
  postponed_until  date,
  status_source    text not null check (status_source in ('user','system')),
  asks             integer not null default 0,                     -- SIM: ≤2 per user-set date; a user postponement resets it
  last_ask_on      date,
  none_revisits    integer not null default 0,
  status_changed_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  check (status <> 'unconfirmed' or status_source = 'system'),
  check (status in ('open','unconfirmed') or status_source = 'user')
);
create table public.commitment_events (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  from_status text, to_status text not null, by text not null check (by in ('user','system')), at timestamptz not null default now()
);

-- 7. INFERRED: evidence, insights, feedback — as in the earlier draft, with simulation changes:
create table public.mirror_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('repeated_signal','cross_capacity_convergence','change','contradiction','unresolved_thread','follow_through','resolution','one_off_event')),
  subject jsonb not null,
  independent_n int not null, prompted_n int not null default 0, introduced_n int not null default 0,
  continuation_n int not null default 0, negative_n int not null default 0, unknown_n int not null default 0,
  offered_n int, present_offered_n int,
  support text not null check (support in ('tentative','supported')),
  status  text not null default 'active' check (status in ('active','withheld','retired')),   -- SIM: 'withheld' after the user said "No"/"Not sure"
  window_start timestamptz not null, window_end timestamptz not null,
  rule_id text not null, engine_version text not null, config_version text not null,
  source text not null default 'rules' check (source in ('rules','model')),
  computed_at timestamptz not null default now()
);
create table public.mirror_evidence_refs (
  evidence_id uuid not null references public.mirror_evidence(id) on delete cascade,
  observation_id uuid not null references public.observations(id) on delete cascade,
  role text not null check (role in ('supports','counters','context')),
  primary key (evidence_id, observation_id)
);
create table public.mirror_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  instance_id uuid references public.inner_rep_instances(id) on delete set null,
  kind text not null check (kind in ('observation','repeated_signal','cross_capacity_convergence','change','contradiction','resolution')),  -- 'contradiction' is allowed by the schema but disabled as a user-facing insight in the MVP
  tier text not null check (tier in ('supported','tentative','hedged')),                         -- SIM: wording tier is stored, not recomputed
  template_id text not null, template_params jsonb not null default '{}',
  shown_text text not null,
  generated_by text not null,
  tentative_mode boolean not null default false,       -- SIM: was interpretive confidence lowered when this was shown?
  status text not null default 'shown' check (status in ('shown','retired','refuted_by_user')),
  shown_at timestamptz not null default now()
);
create table public.mirror_insight_evidence (
  insight_id uuid not null references public.mirror_insights(id) on delete cascade,
  evidence_id uuid not null references public.mirror_evidence(id) on delete restrict,
  primary key (insight_id, evidence_id)
);
-- Provenance rule: every mirror_insights row needs >=1 mirror_insight_evidence row (deferred constraint trigger).
create table public.mirror_insight_feedback (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid not null references public.mirror_insights(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  value text not null check (value in ('accurate','partly','no','unsure')),
  correction_domain_id text references public.domains(id),
  created_at timestamptz not null default now()
);
-- Disagreement is evidence about Mirar's reading, not about the user. The engine derives suppression and tentative mode
-- from this table (no stored judgement about the person), so nothing here can say "denial", "avoidance", etc.

-- Indexes (first cut): observations(user_id, observed_at desc), observations(user_id, domain_id, observed_at desc),
-- inner_rep_decisions(user_id, local_date), threads(user_id, state), commitments(user_id, status, due_on),
-- inner_rep_free_text(user_id, expires_at) where deleted_at is null.
-- RLS: enable on all; own-rows select/insert; update only on instances (completion), threads (state), commitments (status),
-- domain_states, inner_rep_settings; delete own inner_rep_free_text (via the deletion function) and cascade via users.
-- domains/orientations: read-only to authenticated. Evidence/insight writes from the client are acceptable ONLY while rules run
-- client-side; move to a function before any model-generated insight.
