-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Migration 006: Signal Engine
-- Structured per-reflection signal storage. Every check-in produces two
-- theme signals (one per mapped theme on the chosen option). This table is
-- the durable, queryable signal layer behind patterns and awareness —
-- the client pattern engine computes from the same data live; this table
-- lets backend functions (weekly signal, reports, future dashboards) read
-- signals without re-deriving them from options.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS structured_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  signal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  theme_code TEXT NOT NULL CHECK (theme_code IN ('IAP','EWB','FAF','RC','GAL','RA')),
  level TEXT NOT NULL CHECK (level IN ('Low','Medium','High')),
  points NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, response_id, theme_code)
);

CREATE INDEX IF NOT EXISTS idx_structured_signals_user_date
  ON structured_signals(user_id, signal_date DESC);

ALTER TABLE structured_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "structured_signals_select_own" ON structured_signals;
CREATE POLICY "structured_signals_select_own" ON structured_signals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "structured_signals_insert_own" ON structured_signals;
CREATE POLICY "structured_signals_insert_own" ON structured_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
