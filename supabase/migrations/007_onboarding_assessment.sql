-- Onboarding assessment: stores answers from the pre-auth 5-question flow
CREATE TABLE IF NOT EXISTS onboarding_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brought_here TEXT[] DEFAULT '{}',
  misaligned_themes TEXT[] DEFAULT '{}',
  checkin_frequency TEXT,
  last_felt_self TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assessment" ON onboarding_assessments
  FOR ALL USING (auth.uid() = user_id);

-- Welcome reflection: first free-text reflection after account creation
CREATE TABLE IF NOT EXISTS welcome_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE welcome_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own welcome reflection" ON welcome_reflections
  FOR ALL USING (auth.uid() = user_id);
