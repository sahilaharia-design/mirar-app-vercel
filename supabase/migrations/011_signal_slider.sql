-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Migration 011: Signal Slider
-- Adds two short pole-label columns to questions, replacing the 5-sentence
-- multiple-choice check-in with a single-gesture drag slider. The 5 existing
-- options per question are unchanged in meaning (theme codes/levels/points/
-- signal_notes stay exactly as they are) — they become the 5 snap positions
-- along one spectrum, from pole_low_label to pole_high_label.
-- hi/gu columns follow the same convention as migration 003 (multilingual);
-- left NULL here — translation is a follow-up pass, English is the fallback
-- via the app's existing localize() logic in checkin-store.ts.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS pole_low_label TEXT,
  ADD COLUMN IF NOT EXISTS pole_high_label TEXT,
  ADD COLUMN IF NOT EXISTS pole_low_label_hi TEXT,
  ADD COLUMN IF NOT EXISTS pole_high_label_hi TEXT,
  ADD COLUMN IF NOT EXISTS pole_low_label_gu TEXT,
  ADD COLUMN IF NOT EXISTS pole_high_label_gu TEXT;
