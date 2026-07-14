-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008: Dynamic, per-user generated questions
-- Lets Claude generate a genuinely new question + options for a specific user
-- once their identity vector has enough history (personalization_depth >= 1),
-- instead of only ever selecting among the fixed 28 curated questions.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'curated' CHECK (source IN ('curated', 'generated'));

-- user_id IS NULL + source = 'curated'  → the shared, hand-tuned 28-question bank (untouched)
-- user_id set     + source = 'generated' → private to that one user, never served to anyone else

CREATE INDEX IF NOT EXISTS idx_questions_user_generated
  ON questions (user_id) WHERE source = 'generated';

-- select-daily-question runs under the calling user's own JWT (same pattern as
-- process-checkin), not service-role — so inserting a generated question needs
-- explicit INSERT policies. Curated rows are still seeded via service-role /
-- migrations, which bypasses RLS entirely, so this doesn't affect them.
CREATE POLICY "questions_insert_own_generated" ON questions
  FOR INSERT WITH CHECK (user_id = auth.uid() AND source = 'generated');

CREATE POLICY "options_insert_own_generated" ON options
  FOR INSERT WITH CHECK (
    question_id IN (SELECT id FROM questions WHERE user_id = auth.uid() AND source = 'generated')
  );
