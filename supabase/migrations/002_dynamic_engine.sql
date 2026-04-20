-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Migration 002: Dynamic Engine
-- Adds adaptive question pool, alignment scores, question history
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Questions: add pool metadata ──────────────────────────────────────────────
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS depth_level INTEGER DEFAULT 1
    CHECK (depth_level BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS stage_affinity TEXT DEFAULT 'any'
    CHECK (stage_affinity IN ('awareness','realignment','action','reflection','any')),
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Drop unique constraint on day_number — pool can have multiple questions per day
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_day_number_key;

-- ── Responses: snapshot of alignment score at submission ──────────────────────
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS alignment_score_at_time INTEGER;

-- ── Alignment Scores: daily 0–100 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alignment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  status_label TEXT NOT NULL
    CHECK (status_label IN ('Calibrating','Under Load','Stabilizing','Forming','Aligned')),
  trend TEXT CHECK (trend IN ('up','down','steady','new')),
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ── Question History: prevents repeat questions within 14 days ────────────────
CREATE TABLE IF NOT EXISTS question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  served_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE alignment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alignment_scores_select_own" ON alignment_scores
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "alignment_scores_insert_own" ON alignment_scores
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "alignment_scores_update_own" ON alignment_scores
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "question_history_select_own" ON question_history
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "question_history_insert_own" ON question_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- theme_scores needs insert/update for process-checkin edge function
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'theme_scores' AND policyname = 'theme_scores_insert_own'
  ) THEN
    CREATE POLICY "theme_scores_insert_own" ON theme_scores
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'theme_scores' AND policyname = 'theme_scores_update_own'
  ) THEN
    CREATE POLICY "theme_scores_update_own" ON theme_scores
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Tag existing questions with depth + affinity ──────────────────────────────
UPDATE questions SET depth_level = 1, stage_affinity = 'awareness'
  WHERE day_number BETWEEN 1 AND 7;
UPDATE questions SET depth_level = 2, stage_affinity = 'realignment'
  WHERE day_number BETWEEN 8 AND 14;
UPDATE questions SET depth_level = 2, stage_affinity = 'action'
  WHERE day_number BETWEEN 15 AND 21;
UPDATE questions SET depth_level = 3, stage_affinity = 'reflection'
  WHERE day_number BETWEEN 22 AND 28;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_alignment_scores_user_date
  ON alignment_scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_question_history_user_recent
  ON question_history(user_id, served_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_pool
  ON questions(active, stage_affinity, depth_level);
