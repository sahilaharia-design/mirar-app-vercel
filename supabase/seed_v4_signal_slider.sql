-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Data: Signal Slider content
-- 1) Reorders option_number per question so position 1→5 is a true low→high
--    signal continuum. Computed directly from the live theme_1_points /
--    theme_2_points columns via ROW_NUMBER() — not from a hardcoded list of
--    option text matched against the table. An earlier version of this file
--    generated ~280 individual "UPDATE ... WHERE option_text = '...'"
--    statements from a static snapshot; any row whose text differed even by
--    one character (or that a prior partial run had already moved) matched
--    zero rows silently, which then collided with a later statement —
--    confirmed live twice (a CHECK-constraint violation, then a duplicate-key
--    violation on option_number). This version has no hardcoded text at all,
--    so it can't drift from whatever the table actually contains.
-- 2) Sets pole_low_label / pole_high_label per question — the two words shown
--    at the ends of the slider track. This part is still keyed by day_number
--    (unambiguous here — see the source='curated' scoping below).
-- Run after migration 011_signal_slider.sql.
--
-- All lookups are scoped to source = 'curated' (the one shared, hand-tuned
-- bank row per day, user_id IS NULL) — day_number alone is NOT unique:
-- migration 002 dropped that constraint and migration 008 added per-user
-- AI-generated questions that can share a day_number with the curated row.
--
-- The offset step also needs option_number's own CHECK constraint
-- (BETWEEN 1 AND 5) out of the way temporarily — dropped here, re-added at
-- the very end. Safe to re-run this whole file from the top at any point:
-- once every row is already in its correct final position, re-running the
-- ranking produces the same ranks, so the offset+final passes are no-ops.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE options DROP CONSTRAINT IF EXISTS options_option_number_check;

-- Phase 1: move every curated option to a temporary offset (101-105) so
-- phase 2 below can never collide with a row still holding its old value.
-- o.id (not o.option_number) is the tiebreaker for true point-ties, so the
-- rank computed here is stable and reproduced identically in phase 2 even
-- though option_number itself has already changed by then.
WITH ranked AS (
  SELECT
    o.id,
    ROW_NUMBER() OVER (
      PARTITION BY o.question_id
      ORDER BY (o.theme_1_points + o.theme_2_points) ASC, o.theme_1_points ASC, o.id ASC
    ) AS new_number
  FROM options o
  JOIN questions q ON q.id = o.question_id
  WHERE q.source = 'curated'
)
UPDATE options
SET option_number = ranked.new_number + 100
FROM ranked
WHERE options.id = ranked.id;

-- Phase 2: same ranking, recomputed the same way (deterministic — points
-- columns didn't change), now sets the real 1-5 position.
WITH ranked AS (
  SELECT
    o.id,
    ROW_NUMBER() OVER (
      PARTITION BY o.question_id
      ORDER BY (o.theme_1_points + o.theme_2_points) ASC, o.theme_1_points ASC, o.id ASC
    ) AS new_number
  FROM options o
  JOIN questions q ON q.id = o.question_id
  WHERE q.source = 'curated'
)
UPDATE options
SET option_number = ranked.new_number
FROM ranked
WHERE options.id = ranked.id;

-- ── Restore the constraint now that every row is back in 1-5 ─────────────────
ALTER TABLE options ADD CONSTRAINT options_option_number_check CHECK (option_number BETWEEN 1 AND 5);

-- ── Pole labels — one short low/high word pair per day ────────────────────────
UPDATE questions SET pole_low_label = 'Relieved', pole_high_label = 'Searching' WHERE day_number = 1 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Pretending', pole_high_label = 'Sensing a Shift' WHERE day_number = 2 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Second-Guessing', pole_high_label = 'Quiet Mind' WHERE day_number = 3 AND source = 'curated';
UPDATE questions SET pole_low_label = 'On Autopilot', pole_high_label = 'Questioning It All' WHERE day_number = 4 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Going Through Motions', pole_high_label = 'Noticing Shifts' WHERE day_number = 5 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Running on Empty', pole_high_label = 'Waking Up' WHERE day_number = 6 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Harder Than Expected', pole_high_label = 'Gaining Clarity' WHERE day_number = 7 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Exhausted, Pretending', pole_high_label = 'Reaching for Something' WHERE day_number = 8 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Guilt', pole_high_label = 'Clarity' WHERE day_number = 9 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Lost Without It', pole_high_label = 'Lighter' WHERE day_number = 10 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Holding the Rule', pole_high_label = 'Questioning It' WHERE day_number = 11 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Made Myself Smaller', pole_high_label = 'Held My Ground' WHERE day_number = 12 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Depleted', pole_high_label = 'Something Returning' WHERE day_number = 13 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Buried', pole_high_label = 'Closer to Myself' WHERE day_number = 14 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Dropping the Act', pole_high_label = 'Feeling Lighter' WHERE day_number = 15 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Doubting It', pole_high_label = 'Quieter Now' WHERE day_number = 16 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Old Voice, Loud', pole_high_label = 'My Voice Rising' WHERE day_number = 17 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Setting Down Weight', pole_high_label = 'Peace, Uncertain' WHERE day_number = 18 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Carrying It', pole_high_label = 'Setting It Down' WHERE day_number = 19 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Avoiding It', pole_high_label = 'Already in Motion' WHERE day_number = 20 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Staying Small', pole_high_label = 'Moving With It' WHERE day_number = 21 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Less Concerned', pole_high_label = 'Becoming New' WHERE day_number = 22 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Fear of Disappointing', pole_high_label = 'Caution, Not Fear' WHERE day_number = 23 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Noticing Patterns', pole_high_label = 'Steadier Inside' WHERE day_number = 24 AND source = 'curated';
UPDATE questions SET pole_low_label = 'A Moment of Stillness', pole_high_label = 'Simply Present' WHERE day_number = 25 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Still, Waiting', pole_high_label = 'Quiet Energy' WHERE day_number = 26 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Avoiding It', pole_high_label = 'Body Already Knows' WHERE day_number = 27 AND source = 'curated';
UPDATE questions SET pole_low_label = 'Staying Honest', pole_high_label = 'All of It, Real' WHERE day_number = 28 AND source = 'curated';
