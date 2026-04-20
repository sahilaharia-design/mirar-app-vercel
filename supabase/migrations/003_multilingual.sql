-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Migration 003: Multilingual Support
-- Adds Hindi and Gujarati translated columns to questions and options
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Questions: translated text columns ───────────────────────────────────────
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS prompt_text_hi TEXT,
  ADD COLUMN IF NOT EXISTS prompt_text_gu TEXT,
  ADD COLUMN IF NOT EXISTS mirror_glimmer_hi TEXT,
  ADD COLUMN IF NOT EXISTS mirror_glimmer_gu TEXT,
  ADD COLUMN IF NOT EXISTS tomorrow_tease_hi TEXT,
  ADD COLUMN IF NOT EXISTS tomorrow_tease_gu TEXT,
  ADD COLUMN IF NOT EXISTS journal_prompt_hi TEXT,
  ADD COLUMN IF NOT EXISTS journal_prompt_gu TEXT;

-- ── Options: translated text columns ──────────────────────────────────────────
ALTER TABLE options
  ADD COLUMN IF NOT EXISTS option_text_hi TEXT,
  ADD COLUMN IF NOT EXISTS option_text_gu TEXT;

-- ── Users: language preference ────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en'
    CHECK (language IN ('en', 'hi', 'gu'));
