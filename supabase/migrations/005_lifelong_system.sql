-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: Lifelong System Tables
-- Adds: trial_tracking, weekly_signals, unlock_events, alignment_identity_vectors
-- These power the continuous-system architecture beyond the 28-day cycle model.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Trial Tracking ───────────────────────────────────────────────────────────
-- Tracks trial lifecycle per user. Configurable length (7 or 14 days).
-- trial_days_remaining is decremented daily by a scheduled job or edge function.
-- conversion_status: 'trial' | 'converted' | 'expired' | 'gifted'
CREATE TABLE IF NOT EXISTS trial_tracking (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_active         boolean NOT NULL DEFAULT true,
  trial_length_days    integer NOT NULL DEFAULT 14,
  trial_started_at     timestamptz NOT NULL DEFAULT now(),
  trial_ends_at        timestamptz NOT NULL,
  trial_days_remaining integer NOT NULL DEFAULT 14,
  conversion_status    text NOT NULL DEFAULT 'trial'
                         CHECK (conversion_status IN ('trial','converted','expired','gifted')),
  converted_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Auto-set trial_ends_at on insert if not supplied
CREATE OR REPLACE FUNCTION set_trial_ends_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := NEW.trial_started_at + (NEW.trial_length_days || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_trial_ends_at
  BEFORE INSERT ON trial_tracking
  FOR EACH ROW EXECUTE FUNCTION set_trial_ends_at();

-- ─── Weekly Signals ───────────────────────────────────────────────────────────
-- Generated after every 7 completed reflections within a cycle.
-- signal_type examples: 'attention_shift' | 'energy_stabilization' |
--   'decision_clarity_increasing' | 'misalignment_repeating'
-- display_text is the single human-readable line shown on dashboard.
CREATE TABLE IF NOT EXISTS weekly_signals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_id          uuid REFERENCES cycles(id) ON DELETE SET NULL,
  cycle_number      integer NOT NULL DEFAULT 1,
  week_number       integer NOT NULL,           -- 1, 2, 3, 4 within a cycle
  reflection_count  integer NOT NULL DEFAULT 7, -- how many reflections triggered this
  signal_type       text NOT NULL,
  display_text      text NOT NULL,              -- "Something became clearer this week."
  internal_notes    jsonb,                      -- pillar analysis data (not shown to user)
  shown_to_user     boolean NOT NULL DEFAULT false,
  shown_at          timestamptz,
  generated_at      timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_signals_user ON weekly_signals (user_id, generated_at DESC);

-- ─── Unlock Events ────────────────────────────────────────────────────────────
-- Records when a user unlocks each progressive insight layer.
-- unlock_key examples: 'micro_pattern_day3' | 'weekly_signal_day7' |
--   'pattern_depth_day14' | 'mirror_profile_cycle1' |
--   'signal_recurrence_cycle3' | 'drift_awareness_cycle6' | 'annual_arc_cycle13'
-- Prevents duplicate unlocks. Drives "next insight" hint on dashboard.
CREATE TABLE IF NOT EXISTS unlock_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlock_key   text NOT NULL,
  unlocked_at  timestamptz NOT NULL DEFAULT now(),
  metadata     jsonb,
  UNIQUE (user_id, unlock_key)
);

CREATE INDEX idx_unlock_events_user ON unlock_events (user_id, unlocked_at DESC);

-- ─── Alignment Identity Vectors ───────────────────────────────────────────────
-- One row per user, updated after each cycle completes.
-- These vectors are NEVER shown to users — they power adaptive personalization.
--
-- baseline_vector: JSONB map of pillar → rolling average score
--   { "IAP": 2.1, "EWB": 1.8, "FAF": 2.4, "RC": 2.0, "GAL": 1.9, "RA": 2.2 }
--
-- velocity_vector: JSONB map of pillar → change rate (positive = improving)
--   { "IAP": 0.1, "EWB": -0.2, ... }
--
-- pattern_flags: JSONB for detected long-term signals
--   { "energy_recovery_slow": true, "boundary_forming": true, ... }
--
-- cycle_count: how many cycles have been used to build this profile
CREATE TABLE IF NOT EXISTS alignment_identity_vectors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_count      integer NOT NULL DEFAULT 0,
  baseline_vector  jsonb NOT NULL DEFAULT '{}'::jsonb,
  velocity_vector  jsonb NOT NULL DEFAULT '{}'::jsonb,
  pattern_flags    jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Readiness scores (0–1) that gate adaptive features
  adaptation_readiness  numeric(4,3) NOT NULL DEFAULT 0,  -- need 3+ cycles
  personalization_depth integer NOT NULL DEFAULT 0,       -- 0=sequential,1=weighted,2=adaptive
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ─── User State (computed/cached) ────────────────────────────────────────────
-- A materialised summary of user state, updated on each check-in.
-- Avoids multiple joins on hot dashboard path.
-- All fields are derived from other tables — this is a write-through cache.
CREATE TABLE IF NOT EXISTS user_state (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_cycle_number      integer NOT NULL DEFAULT 1,
  current_cycle_day         integer NOT NULL DEFAULT 1,
  current_stage             integer NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 4),
  last_completed_reflection timestamptz,
  last_login_date           date,
  streak_length             integer NOT NULL DEFAULT 0,
  total_reflections         integer NOT NULL DEFAULT 0,
  -- Trial / subscription
  trial_active              boolean NOT NULL DEFAULT true,
  trial_days_remaining      integer,
  -- Contextual message shown at top of dashboard
  context_message           text,     -- "Picking up where you paused." / "Day 12 — …"
  -- Unlock status (cached from unlock_events for fast reads)
  highest_unlock            text NOT NULL DEFAULT 'none',
  -- Latest weekly signal display text (cached)
  latest_signal_text        text,
  updated_at                timestamptz NOT NULL DEFAULT now(),
  created_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ─── Subscriptions ────────────────────────────────────────────────────────────
-- Minimal subscription record. Expand when payment provider is integrated.
-- status: 'active' | 'cancelled' | 'past_due' | 'trialing'
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'trialing'
                        CHECK (status IN ('active','cancelled','past_due','trialing')),
  plan                text NOT NULL DEFAULT 'beta',   -- 'beta' | 'monthly' | 'annual'
  provider            text,                           -- 'stripe' | null for beta
  provider_sub_id     text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE trial_tracking             ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_signals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlock_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_identity_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_state                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions              ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rows
CREATE POLICY "own_trial"        ON trial_tracking             FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_weekly"       ON weekly_signals             FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_unlocks"      ON unlock_events              FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_vectors"      ON alignment_identity_vectors FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_user_state"   ON user_state                 FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_subscription" ON subscriptions              FOR ALL USING (user_id = auth.uid());

-- ─── Seed user_state row on new user creation ─────────────────────────────────
-- Called from create-user edge function (or add manually to that function).
-- This trigger creates the empty rows needed for the lifelong engine.
CREATE OR REPLACE FUNCTION bootstrap_user_lifelong_rows()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_state (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO alignment_identity_vectors (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO subscriptions (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO trial_tracking (
    user_id, trial_length_days, trial_days_remaining, trial_ends_at
  ) VALUES (
    NEW.id, 14, 14, now() + interval '14 days'
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bootstrap_user
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION bootstrap_user_lifelong_rows();
