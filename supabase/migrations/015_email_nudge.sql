-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 015: Morning EMAIL nudge (replaces WhatsApp as the daily cue —
-- free to run: Brevo's free plan allows 300 emails/day, and we already have
-- every user's email, so no phone numbers or Meta approvals are needed).
-- Opt-in is still an explicit user action (never pre-ticked), timestamped,
-- and every email carries a one-click unsubscribe. email_nudge_hour is the
-- local (IST) hour to send; last_email_nudge_on makes sending idempotent
-- (at most one email per user per IST calendar day).
-- Users already have update-own RLS (users_update_own).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_nudge_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_nudge_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_nudge_hour smallint NOT NULL DEFAULT 8
    CHECK (email_nudge_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS last_email_nudge_on date;

CREATE INDEX IF NOT EXISTS idx_users_email_nudge
  ON users (email_nudge_hour) WHERE email_nudge_opt_in = true;
