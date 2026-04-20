-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Question Bank Seed
-- All 28 questions with 5 options each (140 total options)
-- Theme mappings are canonical — do not modify without validating against spec
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: level to points mapping
-- Low = 1, Medium = 2, High = 3

-- ─── Day 1 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (1, 1,
  'If no one needed anything from you today… who would you be?',
  'What does it feel like to sit with that question?',
  'That question took courage to answer honestly.',
  'Tomorrow: a truth you''ve been quietly carrying.',
  'IAP', 'EWB'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'I honestly don''t know. I''ve built my life around being needed.',
  'IAP', 'Low', 1, 'EWB', 'Medium', 2,
  'Identity anchored in external need'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'I''d feel a little lost — like I wouldn''t know what to do without external direction.',
  'IAP', 'Medium', 2, 'EWB', 'Low', 1,
  'Direction dependency on external cues'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'I''d feel relieved. I crave space from others'' expectations.',
  'IAP', 'Medium', 2, 'EWB', 'Low', 1,
  'Relief signal — expectation load present'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'I''d probably still stay busy — not sure I know how to slow down.',
  'IAP', 'Medium', 2, 'EWB', 'Medium', 2,
  'Busyness as identity anchor'
FROM questions WHERE day_number = 1;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'I''d be curious — unsure, but excited to meet myself without the noise.',
  'IAP', 'High', 3, 'EWB', 'Medium', 2,
  'Curiosity-forward orientation'
FROM questions WHERE day_number = 1;

-- ─── Day 2 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (2, 1,
  'What''s one truth about yourself you''ve been quietly avoiding?',
  'What happens when you sit with that truth for a moment?',
  'Noticing an avoided truth is a signal in itself.',
  'Tomorrow: what your body might say if it could speak.',
  'IAP', 'RA'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'That I''m tired, not physically, but emotionally, from performing who I think I should be.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Performance fatigue — identity load'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'That I''ve been coasting — not because I''m content, but because I''m afraid of what trying would reveal.',
  'IAP', 'Medium', 2, 'RA', 'Low', 1,
  'Avoidance masking capacity'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'That the version of success I''ve been chasing doesn''t actually feel like mine.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Borrowed purpose signal'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'That I already know what needs to change — I just keep postponing it.',
  'IAP', 'Medium', 2, 'RA', 'Low', 1,
  'Known but deferred — action resistance'
FROM questions WHERE day_number = 2;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'I''ve started facing it — slowly — but it''s still uncomfortable to name.',
  'IAP', 'High', 3, 'RA', 'Medium', 2,
  'Emerging honesty — early movement'
FROM questions WHERE day_number = 2;

-- ─── Day 3 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (3, 1,
  'When you''re alone and not distracting yourself, what does your mind keep circling back to?',
  'Is this a signal you''ve been trying to mute?',
  'The mind returns to what still needs attention.',
  'Tomorrow: what you''re still doing for others, not for yourself.',
  'FAF', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'A version of myself I feel disconnected from — who I was, or who I thought I''d be by now.',
  'FAF', 'Low', 1, 'GAL', 'Medium', 2,
  'Identity drift — past self comparison'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Something I keep wanting to start but haven''t yet — a project, a conversation, a decision.',
  'FAF', 'Medium', 2, 'GAL', 'Low', 1,
  'Deferred intention — low activation'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'A relationship dynamic that keeps replaying, even when I try not to think about it.',
  'FAF', 'Low', 1, 'GAL', 'Medium', 2,
  'Relational loop occupying attention'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'A quiet restlessness — not clear enough to name, but constant enough to notice.',
  'FAF', 'Medium', 2, 'GAL', 'Medium', 2,
  'Undifferentiated signal — restlessness present'
FROM questions WHERE day_number = 3;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Something I''ve been slowly understanding — a pattern I''m beginning to see.',
  'FAF', 'High', 3, 'GAL', 'Medium', 2,
  'Pattern recognition emerging'
FROM questions WHERE day_number = 3;

-- ─── Day 4 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (4, 1,
  'What are you doing in your life right now — not because it feels true, but because it would make someone else proud, relieved, or impressed?',
  'How long has this been running quietly in the background?',
  'External validation shapes more than we notice.',
  'Tomorrow: what you keep calling ''fine'' even when it isn''t.',
  'RC', 'IAP'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Pushing toward goals I''m not even sure I chose for myself.',
  'RC', 'Low', 1, 'IAP', 'Medium', 2,
  'Enmeshment with external goals'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Saying yes to things just to avoid letting someone down.',
  'RC', 'Low', 1, 'IAP', 'Medium', 2,
  'Boundary avoidance — people-pleasing signal'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'Sticking to old roles or routines because they feel safe, even if they feel off.',
  'RC', 'Medium', 2, 'IAP', 'Low', 1,
  'Safety-seeking in outdated roles'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Following a life plan I set years ago, even though I''m not that person anymore.',
  'RC', 'Medium', 2, 'IAP', 'Low', 1,
  'Outdated self-narrative — plan drift'
FROM questions WHERE day_number = 4;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Honestly, I''m questioning everything right now — I don''t know what''s mine and what''s not.',
  'RC', 'High', 3, 'IAP', 'Medium', 2,
  'Active inquiry — identity differentiation'
FROM questions WHERE day_number = 4;

-- ─── Day 5 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (5, 1,
  'What''s something in your life you keep calling ''fine'' — even though it doesn''t quite feel right anymore?',
  'Why is ''fine'' easier to say than the truth?',
  'The word ''fine'' often holds the most.',
  'Tomorrow: what your body might be trying to tell you.',
  'IAP', 'RA'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Something I''ve gotten used to — but lately, it feels like I''ve outgrown it.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Outgrown situation — low clarity signal'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'A relationship I still care about — but I don''t feel the same in it anymore.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Relational drift — held but misaligned'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'How I show up around others — it looks fine, but it doesn''t feel true.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Performance gap — appearance vs internal state'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'My daily routine — it helps me function, but I''m not sure it''s helping me grow.',
  'IAP', 'Medium', 2, 'RA', 'Low', 1,
  'Functional but stagnant routine'
FROM questions WHERE day_number = 5;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'A few things — nothing dramatic, just quiet signs I''m shifting inside.',
  'IAP', 'High', 3, 'RA', 'Medium', 2,
  'Internal shift awareness — multiple signals'
FROM questions WHERE day_number = 5;

-- ─── Day 6 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (6, 1,
  'If your body could say one thing to you today, what would it be?',
  'Have you been listening?',
  'The body registers what the mind postpones.',
  'Tomorrow: what part of you you''re still protecting.',
  'EWB', 'IAP'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Please stop pushing — I''m running on empty.',
  'EWB', 'Low', 1, 'IAP', 'Medium', 2,
  'Depletion signal — push-through pattern'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Slow down. I can''t keep up with your pace.',
  'EWB', 'Low', 1, 'IAP', 'Medium', 2,
  'Pace misalignment — body-mind gap'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'I''ve been whispering — but you haven''t been listening.',
  'EWB', 'Medium', 2, 'IAP', 'Low', 1,
  'Somatic signal ignored'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'I''m holding more than you realize. Please notice.',
  'EWB', 'Medium', 2, 'IAP', 'Medium', 2,
  'Suppressed load — noticing requested'
FROM questions WHERE day_number = 6;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Thanks for finally listening. Let''s keep going.',
  'EWB', 'High', 3, 'IAP', 'Medium', 2,
  'Body-mind alignment emerging'
FROM questions WHERE day_number = 6;

-- ─── Day 7 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (7, 1,
  'What part of you are you still protecting — even from your own honesty?',
  'What would happen if you let that protection down, just slightly?',
  'Self-protection is a signal, not a failure.',
  'Stage 2 begins tomorrow. What felt familiar that no longer feels like you?',
  'IAP', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'The part that feels vulnerable when I stop performing.',
  'IAP', 'Low', 1, 'GAL', 'Medium', 2,
  'Vulnerability guarded — performance as armor'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'The part that worries about being judged for wanting something different.',
  'IAP', 'Low', 1, 'GAL', 'Medium', 2,
  'Judgment fear blocking differentiation'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'A version of me I left behind — one I''m not ready to grieve yet.',
  'IAP', 'Medium', 2, 'GAL', 'Low', 1,
  'Unmourned past self — grief deferred'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Unnamed emotions I keep at arm''s length because I don''t trust where they''ll take me.',
  'IAP', 'Medium', 2, 'GAL', 'Medium', 2,
  'Emotional distancing — trust deficit'
FROM questions WHERE day_number = 7;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'The part that''s changing and just beginning to feel brave enough to be seen.',
  'IAP', 'High', 3, 'GAL', 'Medium', 2,
  'Emerging self-visibility — courage signal'
FROM questions WHERE day_number = 7;

-- ─── Day 8 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (8, 2,
  'What feels familiar, but no longer feels like you?',
  'How long have you been aware of this gap?',
  'Recognition is the first movement.',
  'Tomorrow: what remains when the ''should'' drops away.',
  'IAP', 'RA'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'A role I still play because people expect it.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Role enmeshment — expectation-driven identity'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'A goal I once chased, but now feels hollow or irrelevant.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Purpose erosion — goal obsolescence'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'A version of success I achieved but don''t feel proud of anymore.',
  'IAP', 'Medium', 2, 'RA', 'Low', 1,
  'Achievement-identity disconnect'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'A comfort zone that used to protect me but now holds me back.',
  'IAP', 'Medium', 2, 'RA', 'Medium', 2,
  'Protective pattern becoming limiting'
FROM questions WHERE day_number = 8;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Something I''ve already started to let go of, even if quietly.',
  'IAP', 'High', 3, 'RA', 'Medium', 2,
  'Active release — quiet movement signal'
FROM questions WHERE day_number = 8;

-- ─── Day 9 ────────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (9, 2,
  'If you paused every ''should'' in your life for a day, what would be left?',
  'What does that space feel like?',
  'What remains when obligation pauses is worth noticing.',
  'Tomorrow: what you''re scared would happen if you let go.',
  'FAF', 'EWB'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Silence — not sure I''d know what I actually want without the noise.',
  'FAF', 'Low', 1, 'EWB', 'Medium', 2,
  'Desire uncertainty — identity noise dependency'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Guilt — like I''m abandoning my responsibilities.',
  'FAF', 'Low', 1, 'EWB', 'Low', 1,
  'Guilt-load — obligation as identity'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'Relief — followed by confusion about what to do with freedom.',
  'FAF', 'Medium', 2, 'EWB', 'Medium', 2,
  'Relief signal — freedom disorientation'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'A few things I genuinely love — buried under obligations.',
  'FAF', 'Medium', 2, 'EWB', 'Medium', 2,
  'Genuine desire present but suppressed'
FROM questions WHERE day_number = 9;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'A clearer version of me — one that already knows what matters.',
  'FAF', 'High', 3, 'EWB', 'High', 3,
  'Clarity signal — inner knowing present'
FROM questions WHERE day_number = 9;

-- ─── Day 10 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (10, 2,
  'What are you scared would happen if you actually let go of what no longer fits?',
  'Is that fear based on evidence, or on a story you''ve been telling yourself?',
  'Fear of release is a signal about what we''re still holding.',
  'Tomorrow: a silent rule that has shaped your life.',
  'RA', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'I''d feel lost — like I wouldn''t know who I am without it.',
  'RA', 'Low', 1, 'GAL', 'Medium', 2,
  'Identity attachment to outdated construct'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'People would be disappointed or wouldn''t understand.',
  'RA', 'Low', 1, 'GAL', 'Medium', 2,
  'Social approval dependency — release blocked'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'I''d have to start over, and that terrifies me.',
  'RA', 'Medium', 2, 'GAL', 'Low', 1,
  'Restart terror — sunk cost holding'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'I''d realize I''d been holding on too long — and that''s painful.',
  'RA', 'Medium', 2, 'GAL', 'Medium', 2,
  'Grief anticipation — truth avoidance'
FROM questions WHERE day_number = 10;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'I think I''d feel lighter — scared, but lighter.',
  'RA', 'High', 3, 'GAL', 'Medium', 2,
  'Release readiness — fear + movement co-present'
FROM questions WHERE day_number = 10;

-- ─── Day 11 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (11, 2,
  'What silent rule has shaped how you live, even if no one ever said it out loud?',
  'Where did this rule come from?',
  'Unspoken rules run the deepest.',
  'Tomorrow: what happens when your truth doesn''t land with someone.',
  'RC', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'I must always be strong — even when I''m falling apart.',
  'RC', 'Low', 1, 'GAL', 'Medium', 2,
  'Strength performance — vulnerability suppressed'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Success means being liked, accepted, or admired.',
  'RC', 'Low', 1, 'GAL', 'Medium', 2,
  'External validation as success metric'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'It''s selfish to put myself first.',
  'RC', 'Medium', 2, 'GAL', 'Low', 1,
  'Self-deprioritization rule — inherited pattern'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'It''s safer to figure things out alone than to rely on anyone.',
  'RC', 'Medium', 2, 'GAL', 'Medium', 2,
  'Hyper-independence — relational trust deficit'
FROM questions WHERE day_number = 11;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'I''m beginning to question these rules — and that feels both scary and freeing.',
  'RC', 'High', 3, 'GAL', 'Medium', 2,
  'Rule examination — active inquiry emerging'
FROM questions WHERE day_number = 11;

-- ─── Day 12 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (12, 2,
  'Think of the last time your truth didn''t land well with someone. What did you do next?',
  'What did that response reveal about your relationship with your own truth?',
  'How we respond after friction shows where we stand.',
  'Tomorrow: what part of you has been slowly dimming.',
  'RC', 'RA'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'I made myself smaller, changed my tone, softened my truth.',
  'RC', 'Low', 1, 'RA', 'Low', 1,
  'Truth compression under social pressure'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'I shut down and didn''t try again for a while.',
  'RC', 'Low', 1, 'RA', 'Medium', 2,
  'Withdrawal after misalignment — protection response'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'I doubled down defensively, even though I was hurt inside.',
  'RC', 'Medium', 2, 'RA', 'Low', 1,
  'Defensive armor — hurt masked by resistance'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'I stayed steady but replayed it in my head for days.',
  'RC', 'Medium', 2, 'RA', 'Medium', 2,
  'Rumination after boundary held'
FROM questions WHERE day_number = 12;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'I held my ground gently, even though it was uncomfortable.',
  'RC', 'High', 3, 'RA', 'High', 3,
  'Grounded truth-holding — relational integrity'
FROM questions WHERE day_number = 12;

-- ─── Day 13 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (13, 2,
  'What part of you has been slowly dimming, because you haven''t been living in full alignment?',
  'When did you last feel that part of you fully lit?',
  'Dimming is a signal, not a verdict.',
  'Tomorrow: if you let go of surviving, what might begin to emerge?',
  'EWB', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'My energy — I''m always tired, even when I rest.',
  'EWB', 'Low', 1, 'GAL', 'Medium', 2,
  'Rest-fatigue disconnect — deep depletion'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'My curiosity — I used to care about more things.',
  'EWB', 'Medium', 2, 'GAL', 'Low', 1,
  'Curiosity dimming — engagement narrowing'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'My self-trust — I keep asking others for answers I once had.',
  'EWB', 'Medium', 2, 'GAL', 'Low', 1,
  'Self-trust erosion — external referencing increased'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'My emotional range — I''ve gone numb to protect myself.',
  'EWB', 'Low', 1, 'GAL', 'Medium', 2,
  'Emotional numbing — protective shutdown'
FROM questions WHERE day_number = 13;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Something small is coming back online — I can feel it.',
  'EWB', 'High', 3, 'GAL', 'Medium', 2,
  'Reactivation signal — subtle return'
FROM questions WHERE day_number = 13;

-- ─── Day 14 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (14, 2,
  'If you let go of the version of you who was just surviving, what version might begin to emerge?',
  'What does that version need that you haven''t given yourself yet?',
  'Survival mode is useful until it isn''t.',
  'Stage 3 begins tomorrow. Where have you already started changing?',
  'IAP', 'RA'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Someone gentler — less armored, more open.',
  'IAP', 'Medium', 2, 'RA', 'Low', 1,
  'Armor-softening signal — openness emerging'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Someone braver — I''ve been playing small to feel safe.',
  'IAP', 'Medium', 2, 'RA', 'Medium', 2,
  'Bravery signal — safety-seeking pattern visible'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'Someone clearer — I''ve been buried under other people''s expectations.',
  'IAP', 'Low', 1, 'RA', 'Medium', 2,
  'Clarity seeking — expectation load present'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'I''m not sure yet — I can feel it shifting but can''t name it.',
  'IAP', 'Medium', 2, 'RA', 'Medium', 2,
  'Pre-verbal shift — unnamed movement'
FROM questions WHERE day_number = 14;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Someone closer to who I always was — just hidden.',
  'IAP', 'High', 3, 'RA', 'Medium', 2,
  'Return-to-self signal — core self re-emerging'
FROM questions WHERE day_number = 14;

-- ─── Day 15 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (15, 3,
  'Where have you already started changing — but keep telling yourself it''s not a big deal?',
  'Why is it easier to minimize change than to acknowledge it?',
  'The changes you minimize are often the most real.',
  'Tomorrow: what makes you hesitate when something feels more true.',
  'RA', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'In ways I''ve started saying no — even when I feel awkward afterward.',
  'RA', 'Medium', 2, 'GAL', 'Low', 1,
  'Boundary practice — discomfort still present'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'In how I''m no longer faking interest in certain people or conversations.',
  'RA', 'Low', 1, 'GAL', 'Medium', 2,
  'Authenticity filter emerging — tolerance dropping'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'In how drained I feel doing things I once enjoyed performing for.',
  'RA', 'Low', 1, 'GAL', 'Medium', 2,
  'Performance fatigue — motivation shift'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'In how I stop explaining my choices — even when others expect reasons.',
  'RA', 'Medium', 2, 'GAL', 'Medium', 2,
  'Autonomy signal — justification dropping'
FROM questions WHERE day_number = 15;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'In surprising moments where I feel oddly lighter — even without trying.',
  'RA', 'High', 3, 'GAL', 'Medium', 2,
  'Spontaneous alignment — effortless lightness'
FROM questions WHERE day_number = 15;

-- ─── Day 16 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (16, 3,
  'When you start sensing what feels more true for you — what quiet thought makes you hesitate?',
  'Is the hesitation protecting you, or holding you back?',
  'Hesitation and readiness often arrive together.',
  'Tomorrow: the quiet message that plays when you think about living more fully.',
  'RA', 'IAP'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'What if I''m wrong and it''s just restlessness, not real change?',
  'RA', 'Low', 1, 'IAP', 'Medium', 2,
  'Self-doubt — change legitimacy questioned'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'I should handle what I''ve already committed to before changing anything.',
  'RA', 'Low', 1, 'IAP', 'Medium', 2,
  'Completion trap — deferred permission'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'People rely on me — I can''t just shift without warning.',
  'RA', 'Medium', 2, 'IAP', 'Low', 1,
  'Responsibility anchor — change constrained by others'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Maybe it''s not the right time — but when is?',
  'RA', 'Medium', 2, 'IAP', 'Medium', 2,
  'Timing loop — perpetual deferral pattern'
FROM questions WHERE day_number = 16;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'The hesitation is still there — but it''s quieter now.',
  'RA', 'High', 3, 'IAP', 'Medium', 2,
  'Hesitation diminishing — movement readying'
FROM questions WHERE day_number = 16;

-- ─── Day 17 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (17, 3,
  'When you think about living more fully in your truth, what quiet message still plays in the back of your mind?',
  'Whose voice is that message in?',
  'The background messages we''ve inherited deserve examination.',
  'Tomorrow: what alignment feels like from the inside.',
  'IAP', 'EWB'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Be careful. Don''t risk what you''ve built.',
  'IAP', 'Low', 1, 'EWB', 'Medium', 2,
  'Risk aversion — preservation over truth'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'You''re being selfish. Other people need stability from you.',
  'IAP', 'Low', 1, 'EWB', 'Low', 1,
  'Selfishness narrative — other-responsibility burden'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'You don''t deserve to want more than what you have.',
  'IAP', 'Medium', 2, 'EWB', 'Low', 1,
  'Deserving deficit — scarcity narrative'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Maybe later. Just get through this phase first.',
  'IAP', 'Medium', 2, 'EWB', 'Medium', 2,
  'Perpetual deferral — life in next phase'
FROM questions WHERE day_number = 17;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Those voices still whisper… but I''m starting to hear my own louder.',
  'IAP', 'High', 3, 'EWB', 'Medium', 2,
  'Own voice emerging — background messages fading'
FROM questions WHERE day_number = 17;

-- ─── Day 18 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (18, 3,
  'If you were fully living in alignment — not perfect, but honest — what do you imagine it would feel like?',
  'What''s the distance between that and where you are now?',
  'Imagination of alignment is a signal of its own.',
  'Tomorrow: the quiet weight you''ve been carrying.',
  'EWB', 'IAP'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Lighter — like I''m no longer carrying invisible weight.',
  'EWB', 'Low', 1, 'IAP', 'Medium', 2,
  'Weight signal — invisible load present'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Calmer — less noise spinning in my head all day.',
  'EWB', 'Medium', 2, 'IAP', 'Low', 1,
  'Cognitive noise — internal friction present'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'More alive — like my energy would return without forcing it.',
  'EWB', 'Medium', 2, 'IAP', 'High', 3,
  'Vitality signal — effortful energy currently'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Clearer — decisions would feel less complicated.',
  'EWB', 'Medium', 2, 'IAP', 'Medium', 2,
  'Decision clarity desire — current friction visible'
FROM questions WHERE day_number = 18;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'A mix of peace and uncertainty — but no more pretending.',
  'EWB', 'High', 3, 'IAP', 'Medium', 2,
  'Honest acceptance — pretending fatigue present'
FROM questions WHERE day_number = 18;

-- ─── Day 19 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (19, 3,
  'What quiet weight have you been carrying — not because you have to, but because it''s become familiar?',
  'What would it mean to set it down?',
  'Familiarity makes weight invisible.',
  'Tomorrow: where you feel a small pull to act.',
  'RA', 'EWB'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Others'' emotions — I absorb what isn''t mine.',
  'RA', 'Low', 1, 'EWB', 'Low', 1,
  'Emotional absorption — boundary permeability'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Old guilt from choices I made when I didn''t know better.',
  'RA', 'Low', 1, 'EWB', 'Medium', 2,
  'Retained guilt — self-forgiveness absent'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'The pressure to keep proving myself even when I''ve already earned rest.',
  'RA', 'Medium', 2, 'EWB', 'Low', 1,
  'Prove-it loop — earned rest blocked'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Keeping up an image that no longer feels like me, but feels safer than letting it drop.',
  'RA', 'Medium', 2, 'EWB', 'Medium', 2,
  'Image maintenance — authentic drop feared'
FROM questions WHERE day_number = 19;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'I''m starting to set it down — not all at once, but slowly.',
  'RA', 'High', 3, 'EWB', 'Medium', 2,
  'Gradual release — movement present'
FROM questions WHERE day_number = 19;

-- ─── Day 20 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (20, 3,
  'Where do you feel a small pull to act — even though part of you keeps postponing it?',
  'What is the postponement protecting?',
  'A pull is a signal. Not a command, but a signal.',
  'Tomorrow: what wobbles when outcomes aren''t guaranteed.',
  'RA', 'FAF'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'In conversations I keep avoiding because they''d change things.',
  'RA', 'Low', 1, 'FAF', 'Medium', 2,
  'Avoided conversation — change resistance'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'In decisions I''ve already made inside but haven''t followed through.',
  'RA', 'Medium', 2, 'FAF', 'Low', 1,
  'Decided but unacted — internal-external gap'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'In boundaries I want to set but keep softening at the last minute.',
  'RA', 'Low', 1, 'FAF', 'Medium', 2,
  'Boundary softening — last-minute retreat'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'In desires I keep privately admitting but haven''t named out loud.',
  'RA', 'Medium', 2, 'FAF', 'Medium', 2,
  'Private desire — public acknowledgment blocked'
FROM questions WHERE day_number = 20;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'In something that''s already started — I just haven''t fully owned it yet.',
  'RA', 'High', 3, 'FAF', 'Medium', 2,
  'Unowned momentum — ownership gap'
FROM questions WHERE day_number = 20;

-- ─── Day 21 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (21, 3,
  'As you move closer to what feels true, what part of you still wobbles when outcomes aren''t guaranteed?',
  'What does the wobble tell you?',
  'The wobble is not failure. It''s the signal of movement.',
  'Stage 4 begins tomorrow. What will quietly surprise you about who you''re becoming?',
  'RA', 'EWB'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'The part that wants certainty before making any move.',
  'RA', 'Low', 1, 'EWB', 'Medium', 2,
  'Certainty dependency — action blocked'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'The part that still equates safety with staying small.',
  'RA', 'Low', 1, 'EWB', 'Low', 1,
  'Small-safe equation — growth blocked'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'I act outwardly confident, but feel shaky underneath.',
  'RA', 'Medium', 2, 'EWB', 'Medium', 2,
  'Surface-depth confidence gap'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'I notice the wobble — but it doesn''t stop me as much as before.',
  'RA', 'Medium', 2, 'EWB', 'Medium', 2,
  'Wobble awareness — impact reducing'
FROM questions WHERE day_number = 21;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'The wobble is still there — but I''m learning to move with it, not against it.',
  'RA', 'High', 3, 'EWB', 'High', 3,
  'Integrated movement — wobble accepted'
FROM questions WHERE day_number = 21;

-- ─── Day 22 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (22, 4,
  'If you paused everything today and looked inward — what would quietly surprise you about who you''re becoming?',
  'What part of this surprises you most?',
  'Becoming is often quieter than we expect.',
  'Tomorrow: what still holds you back when you move forward.',
  'IAP', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'That I''m starting to care less about what others think.',
  'IAP', 'Medium', 2, 'GAL', 'Low', 1,
  'External validation dependency reducing'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'That something I used to fear now feels more like curiosity.',
  'IAP', 'Medium', 2, 'GAL', 'Medium', 2,
  'Fear-to-curiosity conversion — reframing signal'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'That I''ve already started changing without fully realizing it.',
  'IAP', 'Medium', 2, 'GAL', 'Medium', 2,
  'Unconscious change — integration ahead of awareness'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'I''m realizing I''ve started listening to my own voice before asking others for direction.',
  'IAP', 'High', 3, 'GAL', 'Medium', 2,
  'Internal authority emerging — self-referencing increased'
FROM questions WHERE day_number = 22;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'That I don''t recognize parts of myself anymore — and that''s oddly freeing.',
  'IAP', 'High', 3, 'GAL', 'High', 3,
  'Identity release — unfamiliarity as freedom'
FROM questions WHERE day_number = 22;

-- ─── Day 23 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (23, 4,
  'When you think about moving forward, is there a quiet part of you that wants to hold you back?',
  'What is that part protecting you from?',
  'The part that holds back often knows something.',
  'Tomorrow: what feels quietly different when you pause and look.',
  'RA', 'IAP'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'The fear that what I want will disappoint others.',
  'RA', 'Low', 1, 'IAP', 'Medium', 2,
  'Disappointment anticipation — forward movement blocked'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'The instinct to pause or hide when things start to get real.',
  'RA', 'Low', 1, 'IAP', 'Medium', 2,
  'Retreat instinct — visibility avoidance'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'The habit of second-guessing, even when my gut already knows.',
  'RA', 'Medium', 2, 'IAP', 'Low', 1,
  'Override loop — gut knowledge discounted'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'A smaller voice that says: what if this is as good as it gets?',
  'RA', 'Medium', 2, 'IAP', 'Medium', 2,
  'Ceiling narrative — possibility cap present'
FROM questions WHERE day_number = 23;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'It''s still there — but it feels more like caution now than fear.',
  'RA', 'High', 3, 'IAP', 'Medium', 2,
  'Fear-to-caution shift — integration signal'
FROM questions WHERE day_number = 23;

-- ─── Day 24 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (24, 4,
  'When you pause and look at your life lately, what — if anything — feels quietly different?',
  'Is this the kind of different you''ve been waiting for?',
  'Quiet shifts are often the most durable.',
  'Tomorrow: what progress looks like when defined from inside.',
  'GAL', 'RC'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'I''m noticing patterns I used to ignore.',
  'GAL', 'Medium', 2, 'RC', 'Low', 1,
  'Pattern recognition — previous blind spots visible'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'I''m less interested in performing and more drawn to what''s honest.',
  'GAL', 'Medium', 2, 'RC', 'Medium', 2,
  'Authenticity pull — performance interest dropping'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'I''m drawn to different people or experiences, without fully knowing why.',
  'GAL', 'Medium', 2, 'RC', 'Medium', 2,
  'Attraction shift — values reordering signal'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Something inside me feels steadier, even when things outside haven''t changed.',
  'GAL', 'High', 3, 'RC', 'Medium', 2,
  'Internal stability — external independence'
FROM questions WHERE day_number = 24;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'I''m not sure anything has changed yet — but I feel more willing to look.',
  'GAL', 'Medium', 2, 'RC', 'Medium', 2,
  'Willingness signal — openness increased'
FROM questions WHERE day_number = 24;

-- ─── Day 25 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (25, 4,
  'If you defined progress only by what feels true inside you — not by outside results — what would that look like today?',
  'How different is that from how you''ve been measuring yourself?',
  'Internal truth is a valid measure.',
  'Tomorrow: a small spark, or a quiet still.',
  'IAP', 'RA'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'One honest conversation I finally had.',
  'IAP', 'Medium', 2, 'RA', 'Medium', 2,
  'Honest expression — action taken'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'A moment of stillness I actually allowed myself to have.',
  'IAP', 'Medium', 2, 'RA', 'Low', 1,
  'Rest permission — stillness as progress'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'Choosing one small thing that felt aligned, even if no one else noticed.',
  'IAP', 'High', 3, 'RA', 'Medium', 2,
  'Quiet alignment act — external validation absent'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Noticing a pattern without trying to fix it immediately.',
  'IAP', 'Medium', 2, 'RA', 'Medium', 2,
  'Non-reactive observation — patience signal'
FROM questions WHERE day_number = 25;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Simply being present — without needing to prove anything.',
  'IAP', 'High', 3, 'RA', 'High', 3,
  'Pure presence — proving impulse absent'
FROM questions WHERE day_number = 25;

-- ─── Day 26 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (26, 4,
  'When you gently look inside today, is there any small spark — or is it more quiet and still?',
  'What does this reading feel like — welcome, or concerning?',
  'Both spark and stillness are real readings.',
  'Tomorrow: a small next step your body or heart might be asking for.',
  'EWB', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'Mostly still — not empty, just waiting.',
  'EWB', 'Medium', 2, 'GAL', 'Low', 1,
  'Latent state — readiness without activation'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'A gentle tiredness that feels different from exhaustion — more like rest arriving.',
  'EWB', 'Medium', 2, 'GAL', 'Medium', 2,
  'Restorative signal — not depletion'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'A gentle excitement or quiet energy I didn''t expect.',
  'EWB', 'High', 3, 'GAL', 'Medium', 2,
  'Unexpected vitality — emergence signal'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Something settling — not resolved, but less chaotic.',
  'EWB', 'Medium', 2, 'GAL', 'Medium', 2,
  'Settling signal — chaos reducing'
FROM questions WHERE day_number = 26;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'A mix — some clarity, some fog, but I''m not forcing either.',
  'EWB', 'Medium', 2, 'GAL', 'High', 3,
  'Non-forcing signal — acceptance of ambiguity'
FROM questions WHERE day_number = 26;

-- ─── Day 27 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (27, 4,
  'When you listen closely to everything you''ve noticed so far, is there a small next step your heart or body might be quietly asking for?',
  'What would you need to trust to take that step?',
  'A quiet ask is worth attending to.',
  'Tomorrow: your final check-in. What will you hold as you move into your next chapter?',
  'RA', 'IAP'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'A conversation I''ve been avoiding.',
  'RA', 'Low', 1, 'IAP', 'Medium', 2,
  'Deferred conversation — readiness approaching'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'Permission to rest without guilt.',
  'RA', 'Medium', 2, 'IAP', 'Low', 1,
  'Rest permission request — guilt-load present'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'A small daily pause to check what feels true before I act.',
  'RA', 'Medium', 2, 'IAP', 'High', 3,
  'Pre-action calibration — self-checking emerging'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'Space to not know yet — and be okay with that.',
  'RA', 'Medium', 2, 'IAP', 'Medium', 2,
  'Uncertainty tolerance — not-knowing accepted'
FROM questions WHERE day_number = 27;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'Something I can''t quite name — but my body already recognizes.',
  'RA', 'High', 3, 'IAP', 'Medium', 2,
  'Somatic knowing — pre-verbal signal'
FROM questions WHERE day_number = 27;

-- ─── Day 28 ───────────────────────────────────────────────────────────────────
INSERT INTO questions (day_number, stage, prompt_text, journal_prompt, mirror_glimmer, tomorrow_tease, theme_1, theme_2)
VALUES (28, 4,
  'When you imagine moving into your next chapter, what might feel most true or important for you to hold?',
  'What do you want to carry forward, and what do you want to leave behind?',
  'You''ve completed this cycle. The Alignment Mirror is being prepared.',
  NULL,
  'IAP', 'GAL'
);

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 1,
  'The courage to stay honest, even when it''s uncomfortable.',
  'IAP', 'Medium', 2, 'GAL', 'Medium', 2,
  'Courage-honesty signal — discomfort tolerated'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 2,
  'The patience to let clarity arrive without forcing it.',
  'IAP', 'Medium', 2, 'GAL', 'Medium', 2,
  'Non-forcing signal — clarity patience'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 3,
  'The trust that I already know more than I give myself credit for.',
  'IAP', 'High', 3, 'GAL', 'Medium', 2,
  'Self-trust signal — inner knowing affirmed'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 4,
  'A sense of openness — and also the uncertainty that comes with it.',
  'IAP', 'Medium', 2, 'GAL', 'High', 3,
  'Openness + uncertainty co-held'
FROM questions WHERE day_number = 28;

INSERT INTO options (question_id, option_number, option_text, theme_1_code, theme_1_level, theme_1_points, theme_2_code, theme_2_level, theme_2_points, signal_note)
SELECT id, 5,
  'All of it — the mess, the clarity, the doubts. It''s all real.',
  'IAP', 'High', 3, 'GAL', 'High', 3,
  'Full integration — wholeness signal'
FROM questions WHERE day_number = 28;
