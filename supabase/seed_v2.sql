-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Seed v2: Simplified Questions
-- Updates Days 1-8 with simplified stems + options from beta learnings
-- Day 12 is LOCKED — do not modify
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Day 1: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'If everything stopped demanding something from you tomorrow...',
    mirror_glimmer = 'You paused here. That''s already enough.',
    tomorrow_tease = 'Tomorrow: something you''ve been noticing inside.'
WHERE day_number = 1;

-- Replace Day 1 options (themes: EWB, IAP)
DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 1);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'I''d feel relieved. Finally some space.', 'EWB', 'Low', 1, 'IAP', 'Low', 1, 'Relief signal — expectation load present'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'I wouldn''t know what to do with myself.', 'IAP', 'Low', 1, 'EWB', 'Low', 1, 'Identity anchored in external demand'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I''d probably keep moving — I''m not sure how to slow down.', 'IAP', 'Medium', 2, 'EWB', 'Medium', 2, 'Busyness as identity anchor'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I''d want to understand who I am without all the busyness.', 'IAP', 'High', 3, 'EWB', 'Medium', 2, 'Curiosity-forward orientation'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I honestly don''t know. I''ve built my whole life around being needed.', 'IAP', 'Low', 1, 'EWB', 'Low', 1, 'Deep identity-role fusion'
FROM questions WHERE day_number = 1;

-- ── Day 2: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'Right now, inside, I notice...',
    mirror_glimmer = 'Something was named today that wasn''t named yesterday.',
    tomorrow_tease = 'Tomorrow: what your attention keeps returning to.'
WHERE day_number = 2;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 2);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Something doesn''t fit anymore, and I''ve known it for a while.', 'IAP', 'Low', 1, 'RA', 'Medium', 2, 'Quiet misalignment signal'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'I''m tired from pretending to be who I''m not.', 'IAP', 'Low', 1, 'EWB', 'Low', 1, 'Performance fatigue'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I''m waiting for my life to change but not doing anything about it.', 'IAP', 'Medium', 2, 'RA', 'Low', 1, 'Deferred action — passive mode'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I''m not sure what I feel — I''m kind of numb.', 'IAP', 'Low', 1, 'EWB', 'Low', 1, 'Emotional suppression signal'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I think something needs to shift, even if I don''t know what yet.', 'IAP', 'Medium', 2, 'RA', 'Low', 1, 'Emerging awareness — early movement'
FROM questions WHERE day_number = 2;

-- ── Day 3: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What thought keeps coming back to you?',
    mirror_glimmer = 'Recurring thoughts are signals waiting to be read.',
    tomorrow_tease = 'Tomorrow: something you''re carrying for others.'
WHERE day_number = 3;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 3);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'A choice I made that I keep second-guessing.', 'FAF', 'Low', 1, 'GAL', 'Medium', 2, 'Decision rumination loop'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Something I''m worried might happen.', 'FAF', 'Low', 1, 'GAL', 'Medium', 2, 'Anticipatory anxiety — attention distracted'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'How different I feel from how I thought I''d be.', 'FAF', 'Medium', 2, 'GAL', 'Low', 1, 'Identity gap — expectation vs reality'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'A change I want but don''t know how to make.', 'FAF', 'Medium', 2, 'GAL', 'High', 3, 'Deferred intention with growth signal'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Honestly, my mind is quieter these days.', 'FAF', 'High', 3, 'GAL', 'Medium', 2, 'Emerging clarity — focus stabilizing'
FROM questions WHERE day_number = 3;

-- ── Day 4: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'In my life right now, I''m mostly...',
    mirror_glimmer = 'Patterns become visible when we stop moving fast enough to see them.',
    tomorrow_tease = 'Tomorrow: what''s shifting inside you.'
WHERE day_number = 4;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 4);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Chasing goals that might not even be mine.', 'RC', 'Low', 1, 'IAP', 'Medium', 2, 'Borrowed purpose — external goal adoption'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Saying yes to things to avoid disappointing people.', 'RC', 'Low', 1, 'IAP', 'Medium', 2, 'Approval-driven behavior'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'Staying in old patterns because they feel safe.', 'RC', 'Medium', 2, 'IAP', 'Low', 1, 'Safety-driven inertia'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'Following a plan I made years ago that doesn''t fit me anymore.', 'RC', 'Medium', 2, 'IAP', 'Low', 1, 'Outdated identity script'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Questioning everything. I don''t know what''s actually mine.', 'RC', 'High', 3, 'IAP', 'Medium', 2, 'Active re-examination — identity deconstruction'
FROM questions WHERE day_number = 4;

-- ── Day 5: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What feels like it''s shifting inside me?',
    mirror_glimmer = 'Noticing the shift is the first signal.',
    tomorrow_tease = 'Tomorrow: what your inner state would say if it could speak.'
WHERE day_number = 5;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 5);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Something I''ve accepted but don''t believe in anymore.', 'IAP', 'Low', 1, 'RA', 'Medium', 2, 'Quiet disbelief — values drift'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'A relationship I care about but don''t feel the same way in.', 'IAP', 'Low', 1, 'RA', 'Medium', 2, 'Relational drift signal'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'How I show up around people — looks fine outside, doesn''t feel true.', 'IAP', 'Low', 1, 'RA', 'Medium', 2, 'Persona-authenticity gap'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'My routine — it keeps me going, but I''m not growing.', 'IAP', 'Medium', 2, 'RA', 'Low', 1, 'Routine stability without evolution'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'A few quiet things. Nothing big, just shifts I''m noticing.', 'IAP', 'High', 3, 'RA', 'Medium', 2, 'Emerging self-awareness — subtle movement'
FROM questions WHERE day_number = 5;

-- ── Day 6: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'If your inner state could speak to you, what would it say?',
    mirror_glimmer = 'The inner state doesn''t need to be understood to be real.',
    tomorrow_tease = 'Tomorrow: as you close Week 1, what''s most true.'
WHERE day_number = 6;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 6);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'Please stop pushing — I''m running on empty.', 'EWB', 'Low', 1, 'IAP', 'Medium', 2, 'Depletion signal — override pattern'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'Slow down. I can''t keep up with your pace.', 'EWB', 'Low', 1, 'IAP', 'Medium', 2, 'Pacing misalignment — body vs drive'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'You''re not listening. I''m trying to tell you something.', 'EWB', 'Low', 1, 'IAP', 'Medium', 2, 'Signal suppression — awareness block'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I''m protecting you by shutting down.', 'EWB', 'Medium', 2, 'IAP', 'Low', 1, 'Protective numbing — self-preservation'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I''m waking up. Something is shifting.', 'EWB', 'Medium', 2, 'IAP', 'High', 3, 'Emergence signal — inner activation'
FROM questions WHERE day_number = 6;

-- ── Day 7: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'As you close out your first week, what''s most true right now?',
    mirror_glimmer = 'A week of signals. The pattern is beginning to form.',
    tomorrow_tease = 'Tomorrow: Week 2 begins. What''s asking for change?'
WHERE day_number = 7;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 7);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'I see things about myself I''ve been avoiding.', 'IAP', 'Low', 1, 'FAF', 'Medium', 2, 'Avoidance becoming visible'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'This is harder than I expected.', 'IAP', 'Low', 1, 'EWB', 'Low', 1, 'Resistance signal — depth encountered'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'I''m starting to understand what I want.', 'IAP', 'High', 3, 'GAL', 'Medium', 2, 'Emerging clarity — direction forming'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'I realize I''ve been running from something.', 'RA', 'Medium', 2, 'IAP', 'Low', 1, 'Avoidance pattern recognized'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'Nothing has changed yet, but something is moving.', 'GAL', 'Medium', 2, 'FAF', 'High', 3, 'Pre-movement signal — internal momentum'
FROM questions WHERE day_number = 7;

-- ── Day 8: Update stem ────────────────────────────────────────────────────────
UPDATE questions
SET prompt_text = 'What inside you is asking for something to change?',
    mirror_glimmer = 'The part that''s asking is the most honest part.',
    tomorrow_tease = 'Tomorrow: a truth you''ve been carrying quietly.'
WHERE day_number = 8;

DELETE FROM options WHERE question_id = (SELECT id FROM questions WHERE day_number = 8);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1, 'A part of me that doesn''t fit this life anymore.', 'RA', 'Medium', 2, 'IAP', 'Low', 1, 'Identity-life incongruence signal'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2, 'The exhaustion from pretending everything is fine.', 'EWB', 'Low', 1, 'RA', 'Low', 1, 'Depletion from performance'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3, 'An honesty I''ve been avoiding.', 'IAP', 'Low', 1, 'RA', 'Medium', 2, 'Deferred truth — avoidance active'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4, 'A desire for something I can''t even name.', 'GAL', 'High', 3, 'IAP', 'Medium', 2, 'Undifferentiated growth signal'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5, 'I''m not sure. It all feels tangled right now.', 'IAP', 'Low', 1, 'RA', 'Low', 1, 'Complexity signal — processing active'
FROM questions WHERE day_number = 8;

-- ── Day 12: LOCKED — do not modify ────────────────────────────────────────────
-- This question is the identity threshold. It works. Leave it.
