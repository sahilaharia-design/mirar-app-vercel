-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Data: Increment 1 — shorter, more immediate prompt_text
-- Part of the "Engagement & Simplification Pivot" (see
-- ~/.claude/plans/yes-please-run-a-giggly-forest.md). The Signal Slider
-- (seed_v4) already removed the 5-sentence-reading problem from the
-- OPTIONS; this does the same for the QUESTION itself — average prompt
-- length was still 10.4 words, some of them abstract/poetic phrasing that
-- needs interpreting before the user can even engage the slider ("If you
-- dropped every 'should' today, what's left?"). Rewritten toward
-- immediate, concrete, present-tense phrasing — the pattern already used
-- successfully in prompts like "Right now, inside, I notice..." — target
-- under 8 words average. Only prompt_text changes; the 5 options under
-- each question (already reordered low→high by seed_v4) are untouched,
-- since they still answer the same underlying question, just asked more
-- directly. mirror_glimmer/tomorrow_tease are untouched too — none of
-- them quote the old prompt phrasing verbatim, so nothing goes stale.
-- 8 of 28 days were already this concise and are left as-is (not
-- included below): days 2, 3, 4, 5, 9, 11, 13, 24.
-- Scoped to source = 'curated' — day_number alone is not unique once
-- per-user AI-generated questions exist (see seed_v4's own note).
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE questions SET prompt_text = 'If nothing needed you today, what then?' WHERE day_number = 1 AND source = 'curated';
UPDATE questions SET prompt_text = 'What would your inner state say?' WHERE day_number = 6 AND source = 'curated';
UPDATE questions SET prompt_text = 'One week in — what feels true?' WHERE day_number = 7 AND source = 'curated';
UPDATE questions SET prompt_text = 'What''s asking for something to change?' WHERE day_number = 8 AND source = 'curated';
UPDATE questions SET prompt_text = 'What scares you about letting go?' WHERE day_number = 10 AND source = 'curated';
UPDATE questions SET prompt_text = 'Your truth didn''t land — then what?' WHERE day_number = 12 AND source = 'curated';
UPDATE questions SET prompt_text = 'Past survival mode — who shows up?' WHERE day_number = 14 AND source = 'curated';
UPDATE questions SET prompt_text = 'Where have you quietly already changed?' WHERE day_number = 15 AND source = 'curated';
UPDATE questions SET prompt_text = 'What makes you hesitate to change?' WHERE day_number = 16 AND source = 'curated';
UPDATE questions SET prompt_text = 'What message plays when you imagine living truthfully?' WHERE day_number = 17 AND source = 'curated';
UPDATE questions SET prompt_text = 'Honest, not perfect — what would that feel like?' WHERE day_number = 18 AND source = 'curated';
UPDATE questions SET prompt_text = 'What weight do you carry out of habit?' WHERE day_number = 19 AND source = 'curated';
UPDATE questions SET prompt_text = 'Where do you feel a pull, but wait?' WHERE day_number = 20 AND source = 'curated';
UPDATE questions SET prompt_text = 'What still wobbles when outcomes aren''t sure?' WHERE day_number = 21 AND source = 'curated';
UPDATE questions SET prompt_text = 'What would surprise you about who you''re becoming?' WHERE day_number = 22 AND source = 'curated';
UPDATE questions SET prompt_text = 'What part of you wants to hold back?' WHERE day_number = 23 AND source = 'curated';
UPDATE questions SET prompt_text = 'What would progress feel like today, from inside?' WHERE day_number = 25 AND source = 'curated';
UPDATE questions SET prompt_text = 'Right now: a spark, or stillness?' WHERE day_number = 26 AND source = 'curated';
UPDATE questions SET prompt_text = 'What small step is your body asking for?' WHERE day_number = 27 AND source = 'curated';
UPDATE questions SET prompt_text = 'Moving forward — what matters to hold onto?' WHERE day_number = 28 AND source = 'curated';
