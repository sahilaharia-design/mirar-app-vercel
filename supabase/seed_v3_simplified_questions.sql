-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Seed v3: Simplified Questions (Days 9–28, full remaining bank)
-- Continues the simplification started in seed_v2.sql (which covered Days 1–8).
-- Same rule: shorter stems, shorter options, plain everyday language, so a
-- user can read and answer in a few seconds — not parse a paragraph.
-- Theme codes / levels / points / signal_notes are UNCHANGED — only the
-- user-facing prompt_text and option_text are rewritten. Scoring logic is
-- untouched.
-- Day 12 was previously flagged LOCKED in seed_v2.sql ("the identity
-- threshold... leave it"). Explicitly unlocked and simplified here per direct
-- instruction: "the simplification needs to be across the board, not just for
-- a few questions." All 27 open days (1–28, excluding none) are now simplified.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Day 9 ────────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'If you dropped every ''should'' today, what''s left?',
    mirror_glimmer = 'What remains when obligation pauses is worth noticing.',
    tomorrow_tease = 'Tomorrow: what scares you about letting go.'
WHERE day_number = 9;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 9);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Silence. I''m not sure what I actually want.', 'FAF', 'Low', 1, 'EWB', 'Medium', 2, 'Desire uncertainty — identity noise dependency'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Guilt. Like I''m letting people down.', 'FAF', 'Low', 1, 'EWB', 'Low', 1, 'Guilt-load — obligation as identity'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'Relief, then I wouldn''t know what to do with it.', 'FAF', 'Medium', 2, 'EWB', 'Medium', 2, 'Relief signal — freedom disorientation'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'A few things I actually love, buried under obligations.', 'FAF', 'Medium', 2, 'EWB', 'Medium', 2, 'Genuine desire present but suppressed'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'A clearer me — I already know what matters.', 'FAF', 'High', 3, 'EWB', 'High', 3, 'Clarity signal — inner knowing present'
FROM questions WHERE day_number = 9;

-- ── Day 10 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What scares you about letting go of what no longer fits?',
    mirror_glimmer = 'Fear of release is a signal about what we''re still holding.',
    tomorrow_tease = 'Tomorrow: a silent rule that has shaped your life.'
WHERE day_number = 10;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 10);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'I''d feel lost. I wouldn''t know who I am without it.', 'RA', 'Low', 1, 'GAL', 'Medium', 2, 'Identity attachment to outdated construct'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'People would be disappointed.', 'RA', 'Low', 1, 'GAL', 'Medium', 2, 'Social approval dependency — release blocked'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I''d have to start over. That scares me.', 'RA', 'Medium', 2, 'GAL', 'Low', 1, 'Restart terror — sunk cost holding'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I''d realize I held on too long.', 'RA', 'Medium', 2, 'GAL', 'Medium', 2, 'Grief anticipation — truth avoidance'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Lighter. Scared, but lighter.', 'RA', 'High', 3, 'GAL', 'Medium', 2, 'Release readiness — fear + movement co-present'
FROM questions WHERE day_number = 10;

-- ── Day 11 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What unspoken rule shapes how you live?',
    mirror_glimmer = 'Unspoken rules run the deepest.',
    tomorrow_tease = 'Tomorrow: what happens when your truth doesn''t land with someone.'
WHERE day_number = 11;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 11);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'I must always be strong.', 'RC', 'Low', 1, 'GAL', 'Medium', 2, 'Strength performance — vulnerability suppressed'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Success means being liked by everyone.', 'RC', 'Low', 1, 'GAL', 'Medium', 2, 'External validation as success metric'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'Putting myself first is selfish.', 'RC', 'Medium', 2, 'GAL', 'Low', 1, 'Self-deprioritization rule — inherited pattern'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'It''s safer to handle things alone.', 'RC', 'Medium', 2, 'GAL', 'Medium', 2, 'Hyper-independence — relational trust deficit'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I''m starting to question these rules.', 'RC', 'High', 3, 'GAL', 'Medium', 2, 'Rule examination — active inquiry emerging'
FROM questions WHERE day_number = 11;

-- ── Day 12 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'When your truth didn''t land with someone, what did you do next?',
    mirror_glimmer = 'How we respond after friction shows where we stand.',
    tomorrow_tease = 'Tomorrow: what part of you has been slowly dimming.'
WHERE day_number = 12;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 12);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'I made myself smaller. Softened my truth.', 'RC', 'Low', 1, 'RA', 'Low', 1, 'Truth compression under social pressure'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'I shut down and didn''t try again for a while.', 'RC', 'Low', 1, 'RA', 'Medium', 2, 'Withdrawal after misalignment — protection response'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I got defensive, even though I was hurt.', 'RC', 'Medium', 2, 'RA', 'Low', 1, 'Defensive armor — hurt masked by resistance'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I stayed steady, but replayed it for days.', 'RC', 'Medium', 2, 'RA', 'Medium', 2, 'Rumination after boundary held'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I held my ground gently, though it was uncomfortable.', 'RC', 'High', 3, 'RA', 'High', 3, 'Grounded truth-holding — relational integrity'
FROM questions WHERE day_number = 12;


-- ── Day 13 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What part of you has been slowly dimming?',
    mirror_glimmer = 'Dimming is a signal, not a verdict.',
    tomorrow_tease = 'Tomorrow: if you let go of surviving, what might begin to emerge?'
WHERE day_number = 13;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 13);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'My energy. I''m tired even when I rest.', 'EWB', 'Low', 1, 'GAL', 'Medium', 2, 'Rest-fatigue disconnect — deep depletion'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'My curiosity. I used to care about more.', 'EWB', 'Medium', 2, 'GAL', 'Low', 1, 'Curiosity dimming — engagement narrowing'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'My self-trust. I keep asking others for answers.', 'EWB', 'Medium', 2, 'GAL', 'Low', 1, 'Self-trust erosion — external referencing increased'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'My emotions. I''ve gone numb to protect myself.', 'EWB', 'Low', 1, 'GAL', 'Medium', 2, 'Emotional numbing — protective shutdown'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Something small is coming back. I can feel it.', 'EWB', 'High', 3, 'GAL', 'Medium', 2, 'Reactivation signal — subtle return'
FROM questions WHERE day_number = 13;

-- ── Day 14 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'If you let go of just-surviving, who starts to show up?',
    mirror_glimmer = 'Survival mode is useful until it isn''t.',
    tomorrow_tease = 'Stage 3 begins tomorrow. Where have you already started changing?'
WHERE day_number = 14;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 14);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Someone gentler. Less armored, more open.', 'IAP', 'Medium', 2, 'RA', 'Low', 1, 'Armor-softening signal — openness emerging'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Someone braver. I''ve been playing small.', 'IAP', 'Medium', 2, 'RA', 'Medium', 2, 'Bravery signal — safety-seeking pattern visible'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'Someone clearer. I''m buried under others'' expectations.', 'IAP', 'Low', 1, 'RA', 'Medium', 2, 'Clarity seeking — expectation load present'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Not sure yet. Something''s shifting.', 'IAP', 'Medium', 2, 'RA', 'Medium', 2, 'Pre-verbal shift — unnamed movement'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Someone closer to who I always was.', 'IAP', 'High', 3, 'RA', 'Medium', 2, 'Return-to-self signal — core self re-emerging'
FROM questions WHERE day_number = 14;

-- ── Day 15 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'Where have you already started changing, but call it ''not a big deal''?',
    mirror_glimmer = 'The changes you minimize are often the most real.',
    tomorrow_tease = 'Tomorrow: what makes you hesitate when something feels more true.'
WHERE day_number = 15;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 15);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Saying no more, even when it feels awkward.', 'RA', 'Medium', 2, 'GAL', 'Low', 1, 'Boundary practice — discomfort still present'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'I''ve stopped faking interest in certain people.', 'RA', 'Low', 1, 'GAL', 'Medium', 2, 'Authenticity filter emerging — tolerance dropping'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I feel drained doing things I used to perform for people.', 'RA', 'Low', 1, 'GAL', 'Medium', 2, 'Performance fatigue — motivation shift'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I''ve stopped explaining my choices.', 'RA', 'Medium', 2, 'GAL', 'Medium', 2, 'Autonomy signal — justification dropping'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Random moments where I feel lighter, for no reason.', 'RA', 'High', 3, 'GAL', 'Medium', 2, 'Spontaneous alignment — effortless lightness'
FROM questions WHERE day_number = 15;

-- ── Day 16 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'When something feels more true for you, what makes you hesitate?',
    mirror_glimmer = 'Hesitation and readiness often arrive together.',
    tomorrow_tease = 'Tomorrow: the quiet message that plays when you think about living more fully.'
WHERE day_number = 16;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 16);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'What if this is just restlessness, not real change?', 'RA', 'Low', 1, 'IAP', 'Medium', 2, 'Self-doubt — change legitimacy questioned'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'I should finish what I''ve committed to first.', 'RA', 'Low', 1, 'IAP', 'Medium', 2, 'Completion trap — deferred permission'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'People rely on me. I can''t just shift.', 'RA', 'Medium', 2, 'IAP', 'Low', 1, 'Responsibility anchor — change constrained by others'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Maybe it''s not the right time.', 'RA', 'Medium', 2, 'IAP', 'Medium', 2, 'Timing loop — perpetual deferral pattern'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'It''s still there, but quieter now.', 'RA', 'High', 3, 'IAP', 'Medium', 2, 'Hesitation diminishing — movement readying'
FROM questions WHERE day_number = 16;

-- ── Day 17 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'When you think about living more truthfully, what message plays in your head?',
    mirror_glimmer = 'The background messages we''ve inherited deserve examination.',
    tomorrow_tease = 'Tomorrow: what alignment feels like from the inside.'
WHERE day_number = 17;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 17);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Be careful. Don''t risk what you''ve built.', 'IAP', 'Low', 1, 'EWB', 'Medium', 2, 'Risk aversion — preservation over truth'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'You''re being selfish. People need you stable.', 'IAP', 'Low', 1, 'EWB', 'Low', 1, 'Selfishness narrative — other-responsibility burden'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'You don''t deserve to want more than this.', 'IAP', 'Medium', 2, 'EWB', 'Low', 1, 'Deserving deficit — scarcity narrative'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Maybe later. Get through this phase first.', 'IAP', 'Medium', 2, 'EWB', 'Medium', 2, 'Perpetual deferral — life in next phase'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Those voices are still there, but mine is getting louder.', 'IAP', 'High', 3, 'EWB', 'Medium', 2, 'Own voice emerging — background messages fading'
FROM questions WHERE day_number = 17;

-- ── Day 18 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'If you were living honestly, not perfectly, what would that feel like?',
    mirror_glimmer = 'Imagination of alignment is a signal of its own.',
    tomorrow_tease = 'Tomorrow: the quiet weight you''ve been carrying.'
WHERE day_number = 18;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 18);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Lighter. No more invisible weight.', 'EWB', 'Low', 1, 'IAP', 'Medium', 2, 'Weight signal — invisible load present'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Calmer. Less noise in my head.', 'EWB', 'Medium', 2, 'IAP', 'Low', 1, 'Cognitive noise — internal friction present'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'More alive. Energy would return on its own.', 'EWB', 'Medium', 2, 'IAP', 'High', 3, 'Vitality signal — effortful energy currently'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Clearer. Decisions would feel simpler.', 'EWB', 'Medium', 2, 'IAP', 'Medium', 2, 'Decision clarity desire — current friction visible'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Peace and uncertainty. No more pretending.', 'EWB', 'High', 3, 'IAP', 'Medium', 2, 'Honest acceptance — pretending fatigue present'
FROM questions WHERE day_number = 18;

-- ── Day 19 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What weight have you been carrying just because it''s familiar?',
    mirror_glimmer = 'Familiarity makes weight invisible.',
    tomorrow_tease = 'Tomorrow: where you feel a small pull to act.'
WHERE day_number = 19;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 19);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Other people''s emotions. I absorb what isn''t mine.', 'RA', 'Low', 1, 'EWB', 'Low', 1, 'Emotional absorption — boundary permeability'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Old guilt from choices I didn''t know better on.', 'RA', 'Low', 1, 'EWB', 'Medium', 2, 'Retained guilt — self-forgiveness absent'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'The pressure to keep proving myself.', 'RA', 'Medium', 2, 'EWB', 'Low', 1, 'Prove-it loop — earned rest blocked'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'An image that doesn''t feel like me anymore.', 'RA', 'Medium', 2, 'EWB', 'Medium', 2, 'Image maintenance — authentic drop feared'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I''m starting to set it down, slowly.', 'RA', 'High', 3, 'EWB', 'Medium', 2, 'Gradual release — movement present'
FROM questions WHERE day_number = 19;

-- ── Day 20 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'Where do you feel a pull to act, but keep putting it off?',
    mirror_glimmer = 'A pull is a signal. Not a command, but a signal.',
    tomorrow_tease = 'Tomorrow: what wobbles when outcomes aren''t guaranteed.'
WHERE day_number = 20;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 20);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'A conversation I keep avoiding.', 'RA', 'Low', 1, 'FAF', 'Medium', 2, 'Avoided conversation — change resistance'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'A decision I''ve made but haven''t followed through on.', 'RA', 'Medium', 2, 'FAF', 'Low', 1, 'Decided but unacted — internal-external gap'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'A boundary I keep softening at the last minute.', 'RA', 'Low', 1, 'FAF', 'Medium', 2, 'Boundary softening — last-minute retreat'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Something I want but haven''t said out loud.', 'RA', 'Medium', 2, 'FAF', 'Medium', 2, 'Private desire — public acknowledgment blocked'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Something that''s already started. I just haven''t owned it yet.', 'RA', 'High', 3, 'FAF', 'Medium', 2, 'Unowned momentum — ownership gap'
FROM questions WHERE day_number = 20;

-- ── Day 21 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What part of you still wobbles when outcomes aren''t guaranteed?',
    mirror_glimmer = 'The wobble is not failure. It''s the signal of movement.',
    tomorrow_tease = 'Stage 4 begins tomorrow. What will quietly surprise you about who you''re becoming?'
WHERE day_number = 21;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 21);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'The part that wants certainty before I move.', 'RA', 'Low', 1, 'EWB', 'Medium', 2, 'Certainty dependency — action blocked'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'The part that thinks safety means staying small.', 'RA', 'Low', 1, 'EWB', 'Low', 1, 'Small-safe equation — growth blocked'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I act confident, but feel shaky underneath.', 'RA', 'Medium', 2, 'EWB', 'Medium', 2, 'Surface-depth confidence gap'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I notice it, but it doesn''t stop me as much now.', 'RA', 'Medium', 2, 'EWB', 'Medium', 2, 'Wobble awareness — impact reducing'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Still there, but I''m learning to move with it.', 'RA', 'High', 3, 'EWB', 'High', 3, 'Integrated movement — wobble accepted'
FROM questions WHERE day_number = 21;

-- ── Day 22 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'If you paused and looked inward, what would surprise you about who you''re becoming?',
    mirror_glimmer = 'Becoming is often quieter than we expect.',
    tomorrow_tease = 'Tomorrow: what still holds you back when you move forward.'
WHERE day_number = 22;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 22);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'I''m starting to care less what others think.', 'IAP', 'Medium', 2, 'GAL', 'Low', 1, 'External validation dependency reducing'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Something I used to fear now feels like curiosity.', 'IAP', 'Medium', 2, 'GAL', 'Medium', 2, 'Fear-to-curiosity conversion — reframing signal'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I''ve already started changing without realizing it.', 'IAP', 'Medium', 2, 'GAL', 'Medium', 2, 'Unconscious change — integration ahead of awareness'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I''m listening to my own voice before asking others.', 'IAP', 'High', 3, 'GAL', 'Medium', 2, 'Internal authority emerging — self-referencing increased'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I don''t recognize parts of myself, and that''s freeing.', 'IAP', 'High', 3, 'GAL', 'High', 3, 'Identity release — unfamiliarity as freedom'
FROM questions WHERE day_number = 22;

-- ── Day 23 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'Is there a part of you that wants to hold you back?',
    mirror_glimmer = 'The part that holds back often knows something.',
    tomorrow_tease = 'Tomorrow: what feels quietly different when you pause and look.'
WHERE day_number = 23;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 23);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'The fear that what I want will disappoint others.', 'RA', 'Low', 1, 'IAP', 'Medium', 2, 'Disappointment anticipation — forward movement blocked'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'The instinct to hide when things get real.', 'RA', 'Low', 1, 'IAP', 'Medium', 2, 'Retreat instinct — visibility avoidance'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'Second-guessing, even when I already know.', 'RA', 'Medium', 2, 'IAP', 'Low', 1, 'Override loop — gut knowledge discounted'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'A voice that says: what if this is as good as it gets?', 'RA', 'Medium', 2, 'IAP', 'Medium', 2, 'Ceiling narrative — possibility cap present'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Still there, but it''s caution now, not fear.', 'RA', 'High', 3, 'IAP', 'Medium', 2, 'Fear-to-caution shift — integration signal'
FROM questions WHERE day_number = 23;

-- ── Day 24 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What feels quietly different in your life lately?',
    mirror_glimmer = 'Quiet shifts are often the most durable.',
    tomorrow_tease = 'Tomorrow: what progress looks like when defined from inside.'
WHERE day_number = 24;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 24);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'I''m noticing patterns I used to ignore.', 'GAL', 'Medium', 2, 'RC', 'Low', 1, 'Pattern recognition — previous blind spots visible'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'I care less about performing, more about being honest.', 'GAL', 'Medium', 2, 'RC', 'Medium', 2, 'Authenticity pull — performance interest dropping'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I''m drawn to different people, without knowing why.', 'GAL', 'Medium', 2, 'RC', 'Medium', 2, 'Attraction shift — values reordering signal'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I feel steadier inside, even though nothing outside changed.', 'GAL', 'High', 3, 'RC', 'Medium', 2, 'Internal stability — external independence'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Nothing''s changed yet, but I''m more willing to look.', 'GAL', 'Medium', 2, 'RC', 'Medium', 2, 'Willingness signal — openness increased'
FROM questions WHERE day_number = 24;

-- ── Day 25 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'If progress meant what feels true inside, not outside results, what would today look like?',
    mirror_glimmer = 'Internal truth is a valid measure.',
    tomorrow_tease = 'Tomorrow: a small spark, or a quiet still.'
WHERE day_number = 25;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 25);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'One honest conversation I finally had.', 'IAP', 'Medium', 2, 'RA', 'Medium', 2, 'Honest expression — action taken'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'A moment of stillness I let myself have.', 'IAP', 'Medium', 2, 'RA', 'Low', 1, 'Rest permission — stillness as progress'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'One small aligned choice, even if no one noticed.', 'IAP', 'High', 3, 'RA', 'Medium', 2, 'Quiet alignment act — external validation absent'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Noticing a pattern without rushing to fix it.', 'IAP', 'Medium', 2, 'RA', 'Medium', 2, 'Non-reactive observation — patience signal'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Just being present, without proving anything.', 'IAP', 'High', 3, 'RA', 'High', 3, 'Pure presence — proving impulse absent'
FROM questions WHERE day_number = 25;

-- ── Day 26 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'Looking inside today: a small spark, or quiet stillness?',
    mirror_glimmer = 'Both spark and stillness are real readings.',
    tomorrow_tease = 'Tomorrow: a small next step your body or heart might be asking for.'
WHERE day_number = 26;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 26);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Mostly still. Not empty, just waiting.', 'EWB', 'Medium', 2, 'GAL', 'Low', 1, 'Latent state — readiness without activation'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'A gentle tiredness — more like rest than exhaustion.', 'EWB', 'Medium', 2, 'GAL', 'Medium', 2, 'Restorative signal — not depletion'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'A quiet energy I didn''t expect.', 'EWB', 'High', 3, 'GAL', 'Medium', 2, 'Unexpected vitality — emergence signal'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Something settling. Less chaotic, not resolved.', 'EWB', 'Medium', 2, 'GAL', 'Medium', 2, 'Settling signal — chaos reducing'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'A mix of clarity and fog. I''m not forcing either.', 'EWB', 'Medium', 2, 'GAL', 'High', 3, 'Non-forcing signal — acceptance of ambiguity'
FROM questions WHERE day_number = 26;

-- ── Day 27 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'Is there a small next step your body or heart is quietly asking for?',
    mirror_glimmer = 'A quiet ask is worth attending to.',
    tomorrow_tease = 'Tomorrow: your final check-in. What will you hold as you move into your next chapter?'
WHERE day_number = 27;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 27);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'A conversation I''ve been avoiding.', 'RA', 'Low', 1, 'IAP', 'Medium', 2, 'Deferred conversation — readiness approaching'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Permission to rest without guilt.', 'RA', 'Medium', 2, 'IAP', 'Low', 1, 'Rest permission request — guilt-load present'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'A daily pause to check what feels true before I act.', 'RA', 'Medium', 2, 'IAP', 'High', 3, 'Pre-action calibration — self-checking emerging'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Space to not know yet, and be okay with it.', 'RA', 'Medium', 2, 'IAP', 'Medium', 2, 'Uncertainty tolerance — not-knowing accepted'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Something I can''t name, but my body already knows.', 'RA', 'High', 3, 'IAP', 'Medium', 2, 'Somatic knowing — pre-verbal signal'
FROM questions WHERE day_number = 27;

-- ── Day 28 ───────────────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'As you move into your next chapter, what feels important to hold onto?',
    mirror_glimmer = 'You''ve completed this cycle. The Alignment Mirror is being prepared.',
    tomorrow_tease = NULL
WHERE day_number = 28;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 28);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'The courage to stay honest, even when it''s uncomfortable.', 'IAP', 'Medium', 2, 'GAL', 'Medium', 2, 'Courage-honesty signal — discomfort tolerated'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'The patience to let clarity arrive without forcing it.', 'IAP', 'Medium', 2, 'GAL', 'Medium', 2, 'Non-forcing signal — clarity patience'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'Trusting that I know more than I give myself credit for.', 'IAP', 'High', 3, 'GAL', 'Medium', 2, 'Self-trust signal — inner knowing affirmed'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Openness, and the uncertainty that comes with it.', 'IAP', 'Medium', 2, 'GAL', 'High', 3, 'Openness + uncertainty co-held'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'All of it — the mess, the clarity, the doubts. It''s all real.', 'IAP', 'High', 3, 'GAL', 'High', 3, 'Full integration — wholeness signal'
FROM questions WHERE day_number = 28;
