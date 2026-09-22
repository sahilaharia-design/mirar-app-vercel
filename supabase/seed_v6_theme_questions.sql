-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Increment 2 of the engagement/simplification pivot
-- Collapses the 28-unique-prompt curated bank down to 6 — one per theme —
-- each with a fixed, stable phrasing asked repeatedly rather than a new
-- narrative frame every day. See ~/.claude/plans/yes-please-run-a-giggly-
-- forest.md for the full reasoning: the remaining complexity wasn't
-- sentence length (already fixed — seed_v4/v5) but BREADTH of territory —
-- 28 completely different conceptual worlds to re-orient to, day after
-- day. WHOOP doesn't ask a different creative question every day; it asks
-- the same one, in the same shape, and lets the ANSWER be what changes.
-- This does the same: 6 stable "Right now, my ___ feels..." questions,
-- one per theme, so the shape becomes instant recognition instead of
-- fresh interpretation.
--
-- IMPORTANT — this does NOT change how questions are selected. The
-- selection query in select-daily-question (candidates scored by
-- under-represented theme coverage, recency, stage/journal affinity —
-- see that function) never actually matched by day_number; content was
-- just authored 1:1 with day_number as a convention. Shrinking the active
-- pool to 6 naturally produces theme-rotation behavior through that
-- SAME existing algorithm — no selection-logic changes needed.
--
-- The 28 old curated questions are DEACTIVATED, not deleted:
-- responses.question_id has no ON DELETE clause, so real historical
-- check-ins referencing them would make a hard delete fail outright (or
-- worse, if it didn't) — active = false is the safe, reversible way to
-- retire them. depth_level = 1 on all 6 new rows guarantees they're
-- always selectable regardless of maxDepth (which is never below 1);
-- stage_affinity = 'any' likewise makes them stage-independent —
-- appropriate for evergreen questions instead of stage-narrative ones.
-- Each question is inserted with its 5 options in one atomic statement
-- (CTE + RETURNING id), so there's no day_number/text matching at all —
-- same lesson learned from the seed_v4 fixes earlier this pass.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE questions SET active = false WHERE source = 'curated';

-- ── 1. Energy (EWB / IAP) ──────────────────────────────────────────────────
WITH q AS (
  INSERT INTO questions (day_number, stage, prompt_text, mirror_glimmer, tomorrow_tease, theme_1, theme_2, depth_level, stage_affinity, active, source, pole_low_label, pole_high_label)
  VALUES (1, 1, 'Right now, my energy feels...', 'Energy is a signal, not a verdict.', 'Tomorrow: a different part of you gets to speak.', 'EWB', 'IAP', 1, 'any', true, 'curated', 'Running on Empty', 'Steady and Full')
  RETURNING id
)
INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Completely drained, running on fumes.', 'EWB', 'Low', 1, 'IAP', 'Low', 1, 'Depletion signal' FROM q
UNION ALL SELECT id, 2, 'Low, but I''m pushing through anyway.', 'EWB', 'Low', 1, 'IAP', 'Medium', 2, 'Push-through pattern' FROM q
UNION ALL SELECT id, 3, 'Up and down — hard to predict.', 'EWB', 'Medium', 2, 'IAP', 'Medium', 2, 'Variable signal' FROM q
UNION ALL SELECT id, 4, 'Mostly steady, with a few dips.', 'EWB', 'Medium', 2, 'IAP', 'High', 3, 'Mostly stable' FROM q
UNION ALL SELECT id, 5, 'Full and steady.', 'EWB', 'High', 3, 'IAP', 'High', 3, 'Full capacity' FROM q;

-- ── 2. Direction (IAP / FAF) ────────────────────────────────────────────────
WITH q AS (
  INSERT INTO questions (day_number, stage, prompt_text, mirror_glimmer, tomorrow_tease, theme_1, theme_2, depth_level, stage_affinity, active, source, pole_low_label, pole_high_label)
  VALUES (2, 1, 'Right now, I feel aligned with my choices...', 'Alignment is felt before it''s explained.', 'Tomorrow: a different part of you gets to speak.', 'IAP', 'FAF', 1, 'any', true, 'curated', 'Not at All', 'Completely')
  RETURNING id
)
INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Not at all — I''m on autopilot.', 'IAP', 'Low', 1, 'FAF', 'Low', 1, 'Autopilot signal' FROM q
UNION ALL SELECT id, 2, 'Barely — going through the motions.', 'IAP', 'Low', 1, 'FAF', 'Medium', 2, 'Low intention' FROM q
UNION ALL SELECT id, 3, 'Some days yes, some days no.', 'IAP', 'Medium', 2, 'FAF', 'Medium', 2, 'Inconsistent alignment' FROM q
UNION ALL SELECT id, 4, 'Mostly — a few things feel off.', 'IAP', 'Medium', 2, 'FAF', 'High', 3, 'Mostly aligned' FROM q
UNION ALL SELECT id, 5, 'Completely — this is who I am right now.', 'IAP', 'High', 3, 'FAF', 'High', 3, 'Full alignment' FROM q;

-- ── 3. Attention (FAF / EWB) ────────────────────────────────────────────────
WITH q AS (
  INSERT INTO questions (day_number, stage, prompt_text, mirror_glimmer, tomorrow_tease, theme_1, theme_2, depth_level, stage_affinity, active, source, pole_low_label, pole_high_label)
  VALUES (3, 1, 'Right now, my focus feels...', 'Where attention goes, signal follows.', 'Tomorrow: a different part of you gets to speak.', 'FAF', 'EWB', 1, 'any', true, 'curated', 'Scattered', 'Clear')
  RETURNING id
)
INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Scattered — I can''t hold a thought.', 'FAF', 'Low', 1, 'EWB', 'Low', 1, 'Scattered attention' FROM q
UNION ALL SELECT id, 2, 'Foggy, harder to concentrate than usual.', 'FAF', 'Low', 1, 'EWB', 'Medium', 2, 'Mental fog' FROM q
UNION ALL SELECT id, 3, 'Fine, but easily pulled away.', 'FAF', 'Medium', 2, 'EWB', 'Medium', 2, 'Distractible' FROM q
UNION ALL SELECT id, 4, 'Mostly clear, the odd drift.', 'FAF', 'Medium', 2, 'EWB', 'High', 3, 'Mostly clear' FROM q
UNION ALL SELECT id, 5, 'Sharp and clear.', 'FAF', 'High', 3, 'EWB', 'High', 3, 'Sharp focus' FROM q;

-- ── 4. Connection (RC / GAL) ────────────────────────────────────────────────
WITH q AS (
  INSERT INTO questions (day_number, stage, prompt_text, mirror_glimmer, tomorrow_tease, theme_1, theme_2, depth_level, stage_affinity, active, source, pole_low_label, pole_high_label)
  VALUES (4, 1, 'Right now, my relationships feel...', 'Closeness is a signal too.', 'Tomorrow: a different part of you gets to speak.', 'RC', 'GAL', 1, 'any', true, 'curated', 'Distant', 'Close and Honest')
  RETURNING id
)
INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Distant — I''m keeping people at arm''s length.', 'RC', 'Low', 1, 'GAL', 'Low', 1, 'Withdrawal signal' FROM q
UNION ALL SELECT id, 2, 'Strained, more effort than usual.', 'RC', 'Low', 1, 'GAL', 'Medium', 2, 'Relational strain' FROM q
UNION ALL SELECT id, 3, 'Fine, but surface-level.', 'RC', 'Medium', 2, 'GAL', 'Medium', 2, 'Surface connection' FROM q
UNION ALL SELECT id, 4, 'Warm, and mostly honest.', 'RC', 'Medium', 2, 'GAL', 'High', 3, 'Mostly warm' FROM q
UNION ALL SELECT id, 5, 'Close and honest.', 'RC', 'High', 3, 'GAL', 'High', 3, 'Full closeness' FROM q;

-- ── 5. Growth (GAL / RA) ────────────────────────────────────────────────────
WITH q AS (
  INSERT INTO questions (day_number, stage, prompt_text, mirror_glimmer, tomorrow_tease, theme_1, theme_2, depth_level, stage_affinity, active, source, pole_low_label, pole_high_label)
  VALUES (5, 1, 'Right now, I feel open to change...', 'Resistance is information, not failure.', 'Tomorrow: a different part of you gets to speak.', 'GAL', 'RA', 1, 'any', true, 'curated', 'Resistant', 'Genuinely Curious')
  RETURNING id
)
INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Resistant — I just want things to stay the same.', 'GAL', 'Low', 1, 'RA', 'Low', 1, 'Change resistance' FROM q
UNION ALL SELECT id, 2, 'Wary — change feels like a threat right now.', 'GAL', 'Low', 1, 'RA', 'Medium', 2, 'Threat response' FROM q
UNION ALL SELECT id, 3, 'Neutral, it depends on the day.', 'GAL', 'Medium', 2, 'RA', 'Medium', 2, 'Neutral openness' FROM q
UNION ALL SELECT id, 4, 'Interested, cautiously.', 'GAL', 'Medium', 2, 'RA', 'High', 3, 'Cautious interest' FROM q
UNION ALL SELECT id, 5, 'Genuinely curious what''s next.', 'GAL', 'High', 3, 'RA', 'High', 3, 'Full openness' FROM q;

-- ── 6. Movement (RA / RC) ───────────────────────────────────────────────────
WITH q AS (
  INSERT INTO questions (day_number, stage, prompt_text, mirror_glimmer, tomorrow_tease, theme_1, theme_2, depth_level, stage_affinity, active, source, pole_low_label, pole_high_label)
  VALUES (6, 1, 'Right now, I feel able to act on what matters...', 'Movement doesn''t have to be big to be real.', 'Tomorrow: a different part of you gets to speak.', 'RA', 'RC', 1, 'any', true, 'curated', 'Stuck', 'In Motion')
  RETURNING id
)
INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Stuck — I know what to do, I''m just not doing it.', 'RA', 'Low', 1, 'RC', 'Low', 1, 'Action stuck' FROM q
UNION ALL SELECT id, 2, 'Starting, but stalling quickly.', 'RA', 'Low', 1, 'RC', 'Medium', 2, 'Stalling pattern' FROM q
UNION ALL SELECT id, 3, 'Some follow-through, some avoidance.', 'RA', 'Medium', 2, 'RC', 'Medium', 2, 'Mixed follow-through' FROM q
UNION ALL SELECT id, 4, 'Mostly moving, a few things lagging.', 'RA', 'Medium', 2, 'RC', 'High', 3, 'Mostly moving' FROM q
UNION ALL SELECT id, 5, 'In motion — I''m doing the things.', 'RA', 'High', 3, 'RC', 'High', 3, 'Full movement' FROM q;
