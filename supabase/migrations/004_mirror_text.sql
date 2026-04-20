-- Migration 004: Add mirror_text to alignment_scores
-- Stores the AI-generated (Claude Haiku) personal mirror observation for the day

ALTER TABLE alignment_scores
  ADD COLUMN IF NOT EXISTS mirror_text TEXT;

-- Index for fast lookup (not strictly needed but useful for admin queries)
COMMENT ON COLUMN alignment_scores.mirror_text IS
  'AI-generated (Claude Haiku) personal mirror observation. Generated async after process-checkin. NULL until generated.';
