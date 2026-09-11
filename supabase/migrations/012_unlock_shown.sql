-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Migration 012: Milestone Reflections
-- unlock_events already exists (migration 005) and is already being written
-- to on every check-in (process-checkin → check-unlocks, fire-and-forget) —
-- it just never had a UI consumer. Adding shown_to_user/shown_at, the same
-- shape weekly_signals already uses for its own once-then-dismissed card, so
-- the client can show each newly-earned milestone exactly once.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE unlock_events
  ADD COLUMN IF NOT EXISTS shown_to_user boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shown_at timestamptz;
