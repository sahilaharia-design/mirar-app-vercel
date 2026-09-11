-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Data: Signal Slider content
-- 1) Reorders option_number per question so position 1→5 is a true low→high
--    signal continuum (sorted by combined theme_1_points + theme_2_points).
--    Two-phase update (offset, then final) avoids the UNIQUE(question_id,
--    option_number) constraint firing mid-permutation. No text/theme/points/
--    signal_note values change — only which position each already-existing
--    option renders at.
-- 2) Sets pole_low_label / pole_high_label per question — the two words shown
--    at the ends of the slider track.
-- Run after migration 011_signal_slider.sql.
--
-- All lookups are scoped to WHERE day_number = X AND source = 'curated' — the
-- one shared, hand-tuned bank row per day (user_id IS NULL). day_number alone
-- is NOT unique: migration 002 dropped that constraint and migration 008 added
-- per-user AI-generated questions that can share the same day_number. Without
-- this scope, the subquery returns multiple rows for any day a user has ever
-- been served a generated question on — confirmed live ("more than one row
-- returned by a subquery used as an expression").
--
-- The offset step (101-105) also needs option_number's own CHECK constraint
-- (BETWEEN 1 AND 5) out of the way temporarily — dropped here, re-added at
-- the very end once every row is back in 1-5. Safe to re-run this whole file
-- from the top at any point: every UPDATE matches by option_text (not by
-- assuming current numbering), so rows already corrected just get set to the
-- same value again.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE options DROP CONSTRAINT IF EXISTS options_option_number_check;

-- ── Day 1 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I''d feel relieved. Finally some space.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I wouldn''t know what to do with myself.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I honestly don''t know. I''ve built my whole life around being needed.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I''d probably keep moving — I''m not sure how to slow down.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I''d want to understand who I am without all the busyness.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I''d feel relieved. Finally some space.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I wouldn''t know what to do with myself.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I honestly don''t know. I''ve built my whole life around being needed.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I''d probably keep moving — I''m not sure how to slow down.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 1 AND source = 'curated') AND option_text = 'I''d want to understand who I am without all the busyness.';
UPDATE questions SET pole_low_label = 'Relieved', pole_high_label = 'Searching' WHERE day_number = 1 AND source = 'curated';

-- ── Day 2 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I''m tired from pretending to be who I''m not.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I''m not sure what I feel — I''m kind of numb.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'Something doesn''t fit anymore, and I''ve known it for a while.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I''m waiting for my life to change but not doing anything about it.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I think something needs to shift, even if I don''t know what yet.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I''m tired from pretending to be who I''m not.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I''m not sure what I feel — I''m kind of numb.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'Something doesn''t fit anymore, and I''ve known it for a while.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I''m waiting for my life to change but not doing anything about it.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 2 AND source = 'curated') AND option_text = 'I think something needs to shift, even if I don''t know what yet.';
UPDATE questions SET pole_low_label = 'Pretending', pole_high_label = 'Sensing a Shift' WHERE day_number = 2 AND source = 'curated';

-- ── Day 3 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'A choice I made that I keep second-guessing.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'Something I''m worried might happen.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'How different I feel from how I thought I''d be.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'A change I want but don''t know how to make.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'Honestly, my mind is quieter these days.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'A choice I made that I keep second-guessing.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'Something I''m worried might happen.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'How different I feel from how I thought I''d be.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'A change I want but don''t know how to make.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 3 AND source = 'curated') AND option_text = 'Honestly, my mind is quieter these days.';
UPDATE questions SET pole_low_label = 'Second-Guessing', pole_high_label = 'Quiet Mind' WHERE day_number = 3 AND source = 'curated';

-- ── Day 4 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Chasing goals that might not even be mine.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Saying yes to things to avoid disappointing people.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Staying in old patterns because they feel safe.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Following a plan I made years ago that doesn''t fit me anymore.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Questioning everything. I don''t know what''s actually mine.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Chasing goals that might not even be mine.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Saying yes to things to avoid disappointing people.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Staying in old patterns because they feel safe.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Following a plan I made years ago that doesn''t fit me anymore.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 4 AND source = 'curated') AND option_text = 'Questioning everything. I don''t know what''s actually mine.';
UPDATE questions SET pole_low_label = 'On Autopilot', pole_high_label = 'Questioning It All' WHERE day_number = 4 AND source = 'curated';

-- ── Day 5 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'Something I''ve accepted but don''t believe in anymore.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'A relationship I care about but don''t feel the same way in.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'How I show up around people — looks fine outside, doesn''t feel true.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'My routine — it keeps me going, but I''m not growing.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'A few quiet things. Nothing big, just shifts I''m noticing.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'Something I''ve accepted but don''t believe in anymore.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'A relationship I care about but don''t feel the same way in.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'How I show up around people — looks fine outside, doesn''t feel true.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'My routine — it keeps me going, but I''m not growing.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 5 AND source = 'curated') AND option_text = 'A few quiet things. Nothing big, just shifts I''m noticing.';
UPDATE questions SET pole_low_label = 'Going Through Motions', pole_high_label = 'Noticing Shifts' WHERE day_number = 5 AND source = 'curated';

-- ── Day 6 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'Please stop pushing — I''m running on empty.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'Slow down. I can''t keep up with your pace.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'You''re not listening. I''m trying to tell you something.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'I''m protecting you by shutting down.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'I''m waking up. Something is shifting.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'Please stop pushing — I''m running on empty.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'Slow down. I can''t keep up with your pace.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'You''re not listening. I''m trying to tell you something.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'I''m protecting you by shutting down.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 6 AND source = 'curated') AND option_text = 'I''m waking up. Something is shifting.';
UPDATE questions SET pole_low_label = 'Running on Empty', pole_high_label = 'Waking Up' WHERE day_number = 6 AND source = 'curated';

-- ── Day 7 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'This is harder than I expected.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'I see things about myself I''ve been avoiding.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'I realize I''ve been running from something.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'Nothing has changed yet, but something is moving.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'I''m starting to understand what I want.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'This is harder than I expected.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'I see things about myself I''ve been avoiding.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'I realize I''ve been running from something.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'Nothing has changed yet, but something is moving.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 7 AND source = 'curated') AND option_text = 'I''m starting to understand what I want.';
UPDATE questions SET pole_low_label = 'Harder Than Expected', pole_high_label = 'Gaining Clarity' WHERE day_number = 7 AND source = 'curated';

-- ── Day 8 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'The exhaustion from pretending everything is fine.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'I''m not sure. It all feels tangled right now.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'An honesty I''ve been avoiding.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'A part of me that doesn''t fit this life anymore.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'A desire for something I can''t even name.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'The exhaustion from pretending everything is fine.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'I''m not sure. It all feels tangled right now.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'An honesty I''ve been avoiding.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'A part of me that doesn''t fit this life anymore.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 8 AND source = 'curated') AND option_text = 'A desire for something I can''t even name.';
UPDATE questions SET pole_low_label = 'Exhausted, Pretending', pole_high_label = 'Reaching for Something' WHERE day_number = 8 AND source = 'curated';

-- ── Day 9 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'Guilt. Like I''m letting people down.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'Silence. I''m not sure what I actually want.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'Relief, then I wouldn''t know what to do with it.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'A few things I actually love, buried under obligations.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'A clearer me — I already know what matters.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'Guilt. Like I''m letting people down.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'Silence. I''m not sure what I actually want.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'Relief, then I wouldn''t know what to do with it.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'A few things I actually love, buried under obligations.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 9 AND source = 'curated') AND option_text = 'A clearer me — I already know what matters.';
UPDATE questions SET pole_low_label = 'Guilt', pole_high_label = 'Clarity' WHERE day_number = 9 AND source = 'curated';

-- ── Day 10 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'I''d feel lost. I wouldn''t know who I am without it.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'People would be disappointed.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'I''d have to start over. That scares me.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'I''d realize I held on too long.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'Lighter. Scared, but lighter.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'I''d feel lost. I wouldn''t know who I am without it.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'People would be disappointed.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'I''d have to start over. That scares me.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'I''d realize I held on too long.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 10 AND source = 'curated') AND option_text = 'Lighter. Scared, but lighter.';
UPDATE questions SET pole_low_label = 'Lost Without It', pole_high_label = 'Lighter' WHERE day_number = 10 AND source = 'curated';

-- ── Day 11 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'I must always be strong.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'Success means being liked by everyone.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'Putting myself first is selfish.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'It''s safer to handle things alone.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'I''m starting to question these rules.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'I must always be strong.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'Success means being liked by everyone.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'Putting myself first is selfish.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'It''s safer to handle things alone.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 11 AND source = 'curated') AND option_text = 'I''m starting to question these rules.';
UPDATE questions SET pole_low_label = 'Holding the Rule', pole_high_label = 'Questioning It' WHERE day_number = 11 AND source = 'curated';

-- ── Day 12 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I made myself smaller. Softened my truth.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I shut down and didn''t try again for a while.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I got defensive, even though I was hurt.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I stayed steady, but replayed it for days.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I held my ground gently, though it was uncomfortable.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I made myself smaller. Softened my truth.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I shut down and didn''t try again for a while.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I got defensive, even though I was hurt.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I stayed steady, but replayed it for days.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 12 AND source = 'curated') AND option_text = 'I held my ground gently, though it was uncomfortable.';
UPDATE questions SET pole_low_label = 'Made Myself Smaller', pole_high_label = 'Held My Ground' WHERE day_number = 12 AND source = 'curated';

-- ── Day 13 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My energy. I''m tired even when I rest.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My emotions. I''ve gone numb to protect myself.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My curiosity. I used to care about more.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My self-trust. I keep asking others for answers.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'Something small is coming back. I can feel it.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My energy. I''m tired even when I rest.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My emotions. I''ve gone numb to protect myself.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My curiosity. I used to care about more.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'My self-trust. I keep asking others for answers.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 13 AND source = 'curated') AND option_text = 'Something small is coming back. I can feel it.';
UPDATE questions SET pole_low_label = 'Depleted', pole_high_label = 'Something Returning' WHERE day_number = 13 AND source = 'curated';

-- ── Day 14 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone clearer. I''m buried under others'' expectations.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone gentler. Less armored, more open.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone braver. I''ve been playing small.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Not sure yet. Something''s shifting.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone closer to who I always was.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone clearer. I''m buried under others'' expectations.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone gentler. Less armored, more open.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone braver. I''ve been playing small.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Not sure yet. Something''s shifting.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 14 AND source = 'curated') AND option_text = 'Someone closer to who I always was.';
UPDATE questions SET pole_low_label = 'Buried', pole_high_label = 'Closer to Myself' WHERE day_number = 14 AND source = 'curated';

-- ── Day 15 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'I''ve stopped faking interest in certain people.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'I feel drained doing things I used to perform for people.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'Saying no more, even when it feels awkward.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'I''ve stopped explaining my choices.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'Random moments where I feel lighter, for no reason.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'I''ve stopped faking interest in certain people.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'I feel drained doing things I used to perform for people.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'Saying no more, even when it feels awkward.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'I''ve stopped explaining my choices.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 15 AND source = 'curated') AND option_text = 'Random moments where I feel lighter, for no reason.';
UPDATE questions SET pole_low_label = 'Dropping the Act', pole_high_label = 'Feeling Lighter' WHERE day_number = 15 AND source = 'curated';

-- ── Day 16 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'What if this is just restlessness, not real change?';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'I should finish what I''ve committed to first.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'People rely on me. I can''t just shift.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'Maybe it''s not the right time.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'It''s still there, but quieter now.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'What if this is just restlessness, not real change?';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'I should finish what I''ve committed to first.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'People rely on me. I can''t just shift.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'Maybe it''s not the right time.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 16 AND source = 'curated') AND option_text = 'It''s still there, but quieter now.';
UPDATE questions SET pole_low_label = 'Doubting It', pole_high_label = 'Quieter Now' WHERE day_number = 16 AND source = 'curated';

-- ── Day 17 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'You''re being selfish. People need you stable.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'Be careful. Don''t risk what you''ve built.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'You don''t deserve to want more than this.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'Maybe later. Get through this phase first.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'Those voices are still there, but mine is getting louder.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'You''re being selfish. People need you stable.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'Be careful. Don''t risk what you''ve built.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'You don''t deserve to want more than this.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'Maybe later. Get through this phase first.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 17 AND source = 'curated') AND option_text = 'Those voices are still there, but mine is getting louder.';
UPDATE questions SET pole_low_label = 'Old Voice, Loud', pole_high_label = 'My Voice Rising' WHERE day_number = 17 AND source = 'curated';

-- ── Day 18 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Lighter. No more invisible weight.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Calmer. Less noise in my head.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Clearer. Decisions would feel simpler.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'More alive. Energy would return on its own.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Peace and uncertainty. No more pretending.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Lighter. No more invisible weight.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Calmer. Less noise in my head.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Clearer. Decisions would feel simpler.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'More alive. Energy would return on its own.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 18 AND source = 'curated') AND option_text = 'Peace and uncertainty. No more pretending.';
UPDATE questions SET pole_low_label = 'Setting Down Weight', pole_high_label = 'Peace, Uncertain' WHERE day_number = 18 AND source = 'curated';

-- ── Day 19 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'Other people''s emotions. I absorb what isn''t mine.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'Old guilt from choices I didn''t know better on.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'The pressure to keep proving myself.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'An image that doesn''t feel like me anymore.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'I''m starting to set it down, slowly.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'Other people''s emotions. I absorb what isn''t mine.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'Old guilt from choices I didn''t know better on.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'The pressure to keep proving myself.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'An image that doesn''t feel like me anymore.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 19 AND source = 'curated') AND option_text = 'I''m starting to set it down, slowly.';
UPDATE questions SET pole_low_label = 'Carrying It', pole_high_label = 'Setting It Down' WHERE day_number = 19 AND source = 'curated';

-- ── Day 20 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'A conversation I keep avoiding.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'A boundary I keep softening at the last minute.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'A decision I''ve made but haven''t followed through on.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'Something I want but haven''t said out loud.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'Something that''s already started. I just haven''t owned it yet.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'A conversation I keep avoiding.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'A boundary I keep softening at the last minute.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'A decision I''ve made but haven''t followed through on.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'Something I want but haven''t said out loud.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 20 AND source = 'curated') AND option_text = 'Something that''s already started. I just haven''t owned it yet.';
UPDATE questions SET pole_low_label = 'Avoiding It', pole_high_label = 'Already in Motion' WHERE day_number = 20 AND source = 'curated';

-- ── Day 21 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'The part that thinks safety means staying small.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'The part that wants certainty before I move.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'I act confident, but feel shaky underneath.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'I notice it, but it doesn''t stop me as much now.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'Still there, but I''m learning to move with it.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'The part that thinks safety means staying small.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'The part that wants certainty before I move.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'I act confident, but feel shaky underneath.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'I notice it, but it doesn''t stop me as much now.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 21 AND source = 'curated') AND option_text = 'Still there, but I''m learning to move with it.';
UPDATE questions SET pole_low_label = 'Staying Small', pole_high_label = 'Moving With It' WHERE day_number = 21 AND source = 'curated';

-- ── Day 22 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I''m starting to care less what others think.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'Something I used to fear now feels like curiosity.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I''ve already started changing without realizing it.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I''m listening to my own voice before asking others.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I don''t recognize parts of myself, and that''s freeing.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I''m starting to care less what others think.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'Something I used to fear now feels like curiosity.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I''ve already started changing without realizing it.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I''m listening to my own voice before asking others.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 22 AND source = 'curated') AND option_text = 'I don''t recognize parts of myself, and that''s freeing.';
UPDATE questions SET pole_low_label = 'Less Concerned', pole_high_label = 'Becoming New' WHERE day_number = 22 AND source = 'curated';

-- ── Day 23 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'The fear that what I want will disappoint others.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'The instinct to hide when things get real.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'Second-guessing, even when I already know.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'A voice that says: what if this is as good as it gets?';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'Still there, but it''s caution now, not fear.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'The fear that what I want will disappoint others.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'The instinct to hide when things get real.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'Second-guessing, even when I already know.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'A voice that says: what if this is as good as it gets?';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 23 AND source = 'curated') AND option_text = 'Still there, but it''s caution now, not fear.';
UPDATE questions SET pole_low_label = 'Fear of Disappointing', pole_high_label = 'Caution, Not Fear' WHERE day_number = 23 AND source = 'curated';

-- ── Day 24 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I''m noticing patterns I used to ignore.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I care less about performing, more about being honest.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I''m drawn to different people, without knowing why.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'Nothing''s changed yet, but I''m more willing to look.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I feel steadier inside, even though nothing outside changed.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I''m noticing patterns I used to ignore.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I care less about performing, more about being honest.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I''m drawn to different people, without knowing why.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'Nothing''s changed yet, but I''m more willing to look.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 24 AND source = 'curated') AND option_text = 'I feel steadier inside, even though nothing outside changed.';
UPDATE questions SET pole_low_label = 'Noticing Patterns', pole_high_label = 'Steadier Inside' WHERE day_number = 24 AND source = 'curated';

-- ── Day 25 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'A moment of stillness I let myself have.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'One honest conversation I finally had.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'Noticing a pattern without rushing to fix it.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'One small aligned choice, even if no one noticed.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'Just being present, without proving anything.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'A moment of stillness I let myself have.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'One honest conversation I finally had.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'Noticing a pattern without rushing to fix it.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'One small aligned choice, even if no one noticed.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 25 AND source = 'curated') AND option_text = 'Just being present, without proving anything.';
UPDATE questions SET pole_low_label = 'A Moment of Stillness', pole_high_label = 'Simply Present' WHERE day_number = 25 AND source = 'curated';

-- ── Day 26 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'Mostly still. Not empty, just waiting.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'A gentle tiredness — more like rest than exhaustion.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'Something settling. Less chaotic, not resolved.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'A mix of clarity and fog. I''m not forcing either.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'A quiet energy I didn''t expect.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'Mostly still. Not empty, just waiting.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'A gentle tiredness — more like rest than exhaustion.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'Something settling. Less chaotic, not resolved.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'A mix of clarity and fog. I''m not forcing either.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 26 AND source = 'curated') AND option_text = 'A quiet energy I didn''t expect.';
UPDATE questions SET pole_low_label = 'Still, Waiting', pole_high_label = 'Quiet Energy' WHERE day_number = 26 AND source = 'curated';

-- ── Day 27 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'A conversation I''ve been avoiding.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'Permission to rest without guilt.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'Space to not know yet, and be okay with it.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'A daily pause to check what feels true before I act.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'Something I can''t name, but my body already knows.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'A conversation I''ve been avoiding.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'Permission to rest without guilt.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'Space to not know yet, and be okay with it.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'A daily pause to check what feels true before I act.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 27 AND source = 'curated') AND option_text = 'Something I can''t name, but my body already knows.';
UPDATE questions SET pole_low_label = 'Avoiding It', pole_high_label = 'Body Already Knows' WHERE day_number = 27 AND source = 'curated';

-- ── Day 28 ────────────────────────────────────────────────────────────────
-- Phase 1: offset to avoid transient unique-constraint collisions
UPDATE options SET option_number = 101 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'The courage to stay honest, even when it''s uncomfortable.';
UPDATE options SET option_number = 102 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'The patience to let clarity arrive without forcing it.';
UPDATE options SET option_number = 103 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'Openness, and the uncertainty that comes with it.';
UPDATE options SET option_number = 104 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'Trusting that I know more than I give myself credit for.';
UPDATE options SET option_number = 105 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'All of it — the mess, the clarity, the doubts. It''s all real.';
-- Phase 2: set final position
UPDATE options SET option_number = 1 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'The courage to stay honest, even when it''s uncomfortable.';
UPDATE options SET option_number = 2 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'The patience to let clarity arrive without forcing it.';
UPDATE options SET option_number = 3 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'Openness, and the uncertainty that comes with it.';
UPDATE options SET option_number = 4 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'Trusting that I know more than I give myself credit for.';
UPDATE options SET option_number = 5 WHERE question_id = (SELECT id FROM questions WHERE day_number = 28 AND source = 'curated') AND option_text = 'All of it — the mess, the clarity, the doubts. It''s all real.';
UPDATE questions SET pole_low_label = 'Staying Honest', pole_high_label = 'All of It, Real' WHERE day_number = 28 AND source = 'curated';

-- ── Restore the constraint now that every row is back in 1-5 ─────────────────
ALTER TABLE options ADD CONSTRAINT options_option_number_check CHECK (option_number BETWEEN 1 AND 5);
