-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 013: Morning WhatsApp nudge (the daily cue)
-- Adds explicit-consent fields to users. Opt-in must be an active, informed
-- choice (Meta policy + India's DPDP Act) — never pre-ticked — so the app
-- only ever sets whatsapp_opt_in = true from an explicit user action, and
-- records when. nudge_hour is the local (IST) hour to send; default 8 = 8am.
-- last_nudge_on makes the sender idempotent: at most one nudge per user per
-- IST calendar day, even if the cron fires twice.
-- Users already have update-own RLS (users_update_own), so the client can
-- write these columns directly; the edge function uses the service role.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS nudge_hour smallint NOT NULL DEFAULT 8
    CHECK (nudge_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS last_nudge_on date;

-- E.164-ish sanity check (country code + digits). Stored without spaces.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_whatsapp_number_format;
ALTER TABLE users ADD CONSTRAINT users_whatsapp_number_format
  CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^\+[1-9][0-9]{9,14}$');

CREATE INDEX IF NOT EXISTS idx_users_whatsapp_nudge
  ON users (nudge_hour) WHERE whatsapp_opt_in = true;
