-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Initial Schema Migration
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mirar_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  current_cycle INTEGER DEFAULT 1,
  cycle_start_date TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false
);

-- ─── Cycles ───────────────────────────────────────────────────────────────────
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  stage1_start TIMESTAMPTZ,
  stage2_start TIMESTAMPTZ,
  stage3_start TIMESTAMPTZ,
  stage4_start TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Questions (28-day bank) ──────────────────────────────────────────────────
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 28),
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 4),
  prompt_text TEXT NOT NULL,
  helper_text TEXT,
  journal_prompt TEXT,
  mirror_glimmer TEXT,
  tomorrow_tease TEXT,
  theme_1 TEXT NOT NULL,
  theme_2 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(day_number)
);

-- ─── Options (5 per question, with theme mappings) ────────────────────────────
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_number INTEGER NOT NULL CHECK (option_number BETWEEN 1 AND 5),
  option_text TEXT NOT NULL,
  theme_1_code TEXT NOT NULL,
  theme_1_level TEXT NOT NULL CHECK (theme_1_level IN ('Low', 'Medium', 'High')),
  theme_1_points INTEGER NOT NULL CHECK (theme_1_points IN (1, 2, 3)),
  theme_2_code TEXT NOT NULL,
  theme_2_level TEXT NOT NULL CHECK (theme_2_level IN ('Low', 'Medium', 'High')),
  theme_2_points INTEGER NOT NULL CHECK (theme_2_points IN (1, 2, 3)),
  signal_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, option_number)
);

-- ─── Responses ────────────────────────────────────────────────────────────────
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  option_id UUID REFERENCES options(id),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 28),
  journal_text TEXT,  -- ignored in scoring, stored only
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cycle_id, day_number)
);

-- ─── Theme Scores ─────────────────────────────────────────────────────────────
CREATE TABLE theme_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,  -- 1-4, or 0 for overall
  theme_code TEXT NOT NULL CHECK (theme_code IN ('IAP','EWB','FAF','RC','GAL','RA')),
  signal_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  average_score NUMERIC(4,2),
  status TEXT CHECK (status IN ('Under Load','Stabilizing','Forming','Aligned','No Reading')),
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cycle_id, stage, theme_code)
);

-- ─── Reports ──────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,  -- 1-4, or 0 for full cycle
  coverage INTEGER NOT NULL DEFAULT 0,
  coverage_total INTEGER NOT NULL DEFAULT 7,
  primary_signals TEXT,
  calibration_checks TEXT,
  summary_text TEXT,
  full_report_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','generated','delivered')),
  due_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cycle_id, stage)
);

-- ─── Push Notification Tokens ─────────────────────────────────────────────────
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users: own data only
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- Cycles: own data only
CREATE POLICY "cycles_select_own" ON cycles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cycles_insert_own" ON cycles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Questions and Options: readable by all authenticated users
CREATE POLICY "questions_select_all" ON questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "options_select_all" ON options
  FOR SELECT TO authenticated USING (true);

-- Responses: own data only
CREATE POLICY "responses_select_own" ON responses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "responses_insert_own" ON responses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Theme scores: own data only
CREATE POLICY "theme_scores_select_own" ON theme_scores
  FOR SELECT USING (user_id = auth.uid());

-- Reports: own data only
CREATE POLICY "reports_select_own" ON reports
  FOR SELECT USING (user_id = auth.uid());

-- Push tokens: own data only
CREATE POLICY "push_tokens_select_own" ON push_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_tokens_insert_own" ON push_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_delete_own" ON push_tokens
  FOR DELETE USING (user_id = auth.uid());

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_cycles_user_status ON cycles(user_id, status);
CREATE INDEX idx_responses_user_cycle ON responses(user_id, cycle_id);
CREATE INDEX idx_responses_day ON responses(user_id, cycle_id, day_number);
CREATE INDEX idx_theme_scores_user_cycle ON theme_scores(user_id, cycle_id, stage);
CREATE INDEX idx_reports_user_cycle ON reports(user_id, cycle_id);
CREATE INDEX idx_questions_day ON questions(day_number);
