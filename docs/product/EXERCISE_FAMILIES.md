# Exercise families — specification

Part of [MIRAR_VALUE_AND_RUNTIME_CONTRACT.md](MIRAR_VALUE_AND_RUNTIME_CONTRACT.md). **Proposal.** Nothing here is in the catalog. The current catalog is 23 templates (18 training, 3 per capacity) [CODE]; most are one-tap questions. This document specifies what real exercises would be, which of today's templates already approximate them, and what each needs.

No clinical efficacy is claimed for any family. They are structured practice of everyday skills, framed in the way established self-reflection and attention practices frame them, and must be evaluated with users before any claim of benefit is made.

## Common rules (every family)
- **Always available:** "I don't know" and "Leave it for today". Both are real outcomes (see contract §4).
- **No free text is stored.** Optional words, where offered, are safety-checked and discarded.
- **Safety boundary:** none of these is for acute distress. Crisis language in any optional text stops the rep and shows the resource panel (existing behaviour). A family must never instruct someone to confront trauma, suppress a feeling, or "fix" a relationship.
- **Content is authored**, not generated from the person's data. Variation comes from authored variants and the engine's existing deterministic per-user variant choice.
- **Every family declares a same-day outcome** from: clarity · capacity exercised · intentional action · permission not to act · continuity.
- **Acceptance tests (shared):** completes in ≤ 90 s typical; works with "I don't know" at every step; produces a closing computed only from the session's structured answers; stores only structured answers; passes the engine's variety, intensity and burden guards; exact labels are recorded; no step is gesture-only.

Status key: **Exists** (approximated by a current template) · **Partial** · **New**.

---

## F1 — Notice (awareness, granularity)
1. **Capacity:** noticing accurately; emotional/situational granularity.
2. **Everyday problem:** "I feel off" with no handle on what.
3. **User does:** moves from a broad option to a more specific one, then says whether it is *close* or *not quite*. Two refinements maximum.
4. **Exercise, not questionnaire:** the user performs a discrimination and checks it against their own sense. They are refining, not reporting.
5. **Mechanics:** tiered choice list (broad → specific) with an explicit "close / not quite" choice; "something else" allowed (no text stored).
6. **Same-day outcome:** clarity. Closing restates their own refined choice and the one they rejected ("Closer to X than to Y").
7. **Memory:** none required.
8. **Variation:** different situations (the moment, the body, the day) from authored sets; engine variety guard.
9. **Safety/privacy:** no body-focused prompts for users who answered "I don't know" repeatedly (the existing ease rule applies); no text.
10. **Acceptance:** the closing differs when the user's choices differ; "not quite" is never treated as an error.
**Status:** Partial (`foc_attention`, `en_drain` approximate the first tier). Refinement tier is New.

## F2 — Attend (attention)
1. **Capacity:** directing attention.
2. **Problem:** attention is being pulled by things that do not matter.
3. **User does:** names what pulled at attention, then *chooses* one thing to give the next stretch to, or deliberately sets one thing aside "for now".
4. **Exercise:** a deliberate allocation, and an explicit act of setting something down.
5. **Mechanics:** choose-one with a paired "set aside until later today" action; compare for "settled / switching".
6. **Outcome:** capacity exercised + permission not to act (setting aside is first-class).
7. **Memory:** optional. If the user sets something aside, Mirar may ask once, later, whether it came up again (existing event-check pattern).
8. **Variation:** domain (work, phone, people), time window.
9. **Safety/privacy:** do not frame attention as a performance to optimise; no timers that pressure.
10. **Acceptance:** "set aside" never creates a to-do or a due state unless the user asks for one.
**Status:** Partial (`foc_attention`, `foc_loops`, `foc_settle`).

## F3 — Reframe (perspective)
1. **Capacity:** taking another perspective; flexible interpretation.
2. **Problem:** stuck on one reading of a situation.
3. **User does:** names the domain of a situation (no description), is offered 2–3 authored readings (including a less charitable and a more charitable one), picks which fits best *and* which fits least, then reports whether the weight of it moves: *lighter / the same / heavier*. "Keep my view" is an equal option.
4. **Exercise:** generating and weighing alternatives is the skill; the before/after is the user's own report.
5. **Mechanics:** pick best/least-fit among readings, then a three-way weight report. Aperture's "change the frame" metaphor maps here as a real mechanic.
6. **Outcome:** clarity + capacity exercised. Closing: "You saw it as X; Y fit least. It feels [lighter/the same/heavier]. Either is fine."
7. **Memory:** none required. If the user repeatedly picks "keep my view", Mirar does nothing about it.
8. **Variation:** authored reading sets per domain.
9. **Safety/privacy:** never invalidate how the person feels; never label a reading "healthy"; no suggestion that a reading is the correct one; avoid in domains marked sensitive until the user has used the product for a while.
10. **Acceptance:** "heavier" is a legitimate result and produces a non-corrective closing.
**Status:** Partial (`gro_update` asks whether a view changed; no alternatives are generated). Reframe proper is New.

## F4 — Settle (responding rather than reacting)
1. **Capacity:** regulating a response; the gap between urge and action.
2. **Problem:** reacting before choosing.
3. **User does:** names the urge ("to reply now", "to withdraw", "to fix it"), chooses a response mode (*pause · say something small · leave it*), and optionally takes a self-paced pause with an explicit end ("I'm ready").
4. **Exercise:** practising the gap itself.
5. **Mechanics:** urge selection; response-mode choice; optional pause screen with a visible end control (no forced timer).
6. **Outcome:** capacity exercised; may produce permission not to act ("let it pass").
7. **Memory:** optional; a later check "did it pass?" (existing event-check).
8. **Variation:** relational, work, self.
9. **Safety/privacy:** not for acute distress; if the user chooses "very strong" intensity the closing links to the safety panel, no exercise follows. No breathing instructions presented as medical.
10. **Acceptance:** the pause never auto-advances; ending it early is a normal result.
**Status:** New (`en_pace` is a single contrast question).

## F5 — Relate (boundaries and relationships)
1. **Capacity:** navigating relationships; separating mine / shared / theirs.
2. **Problem:** carrying more than one's share of someone's mood or demand.
3. **User does:** for a named relationship domain, sorts a few authored items (a feeling, a task, a responsibility) into *mine / shared / theirs*, then optionally picks one authored line to hold in mind ("I can't fix this for them").
4. **Exercise:** sorting is the skill; the sort is the user's.
5. **Mechanics:** three-bucket tap sort (each item a button); optional choice of one authored phrasing.
6. **Outcome:** clarity; optionally intentional action ("Send one line").
7. **Memory:** commitment follow-up exists and is reused.
8. **Variation:** relationship domain; item sets.
9. **Safety/privacy:** never advise leaving or staying in a relationship; no assumptions about who is at fault; if the user signals unsafe circumstances, show the resource panel.
10. **Acceptance:** all-"theirs" or all-"mine" sorts are accepted without comment.
**Status:** Partial (`rel_boundary` + follow-up "How much of the mood is yours?"; `rel_connect` creates a commitment).

## F6 — Choose (values and intentional action)
1. **Capacity:** deliberate choice aligned to what matters.
2. **Problem:** time or energy going to things that do not matter, or a small intention that never starts.
3. **User does:** picks what mattered today from authored options, compares to where the day went, and chooses one small step **or** explicitly chooses "nothing now".
4. **Exercise:** a values-to-action link made by the user.
5. **Mechanics:** choice + compare + optional commitment with a future date (existing machinery).
6. **Outcome:** intentional action or permission. Both count.
7. **Memory:** commitment follow-up (budget: 1 per 3 reps).
8. **Variation:** domain; scope (today, this week).
9. **Safety/privacy:** no productivity framing, no overdue states; neutral outcomes only.
10. **Acceptance:** choosing "nothing now" never triggers a follow-up.
**Status:** Exists (`dir_time`, `dir_fits`, `act_tiny`, `act_friction`).

## F7 — Recover (resilience and rest)
1. **Capacity:** recovering after difficulty; knowing what restores.
2. **Problem:** running on empty with no sense of what helps.
3. **User does:** recalls what has helped before, picks one to use deliberately, or chooses to rest with nothing to do.
4. **Exercise:** deliberate recovery selection, including the choice to do nothing.
5. **Mechanics:** pick a resource (existing set) + "use it today / just rest".
6. **Outcome:** permission not to act, or intentional action.
7. **Memory:** the resources the user has chosen can be recalled ("Last time you chose time alone"), from structured choices only.
8. **Variation:** resource sets; time of day.
9. **Safety/privacy:** deliberate rest is a family-level *engine* concept currently disabled; a rest exercise is distinct from the engine's no-rep rest and must not be conflated.
10. **Acceptance:** "just rest" yields a closing with no task and no follow-up.
**Status:** Partial (`en_helped`, `en_pace`; `presence` template). Rest family is New and depends on the rest decision.

## F8 — Integrate (learning and noticing latency)
1. **Capacity:** learning from experience; shortening the gap between reacting and noticing.
2. **Problem:** repeating a pattern without seeing it until later.
3. **User does:** looks at one recent moment and reports *when* they noticed their reaction: *before · as it happened · afterwards · I didn't*. Then picks what they'd like to keep from it, or nothing.
4. **Exercise:** metacognitive reflection with a specific, answerable form.
5. **Mechanics:** four-way timing choice; keep-one-thing choice.
6. **Outcome:** clarity + continuity.
7. **Memory:** **valuable.** Repeated, user-reported timing across weeks is a structured, non-personality measure the Mirror can show factually ("You said you noticed afterwards in 5 of 8 of these, and as it happened in 3 of the last 4"). It is the user's own report, never a score, and never described as improvement.
8. **Variation:** domain; which moment.
9. **Safety/privacy:** no claim that earlier noticing is better; no streaks; no comparison with others.
10. **Acceptance:** the Mirror statement from this family shows numerator, denominator, window and the exact authored labels, and traces to observations.
**Status:** New. Highest value for the longitudinal Mirror; needs `stance`-bearing options (A3).

---

## Priorities
1. **F3 Reframe** and **F1 Notice (refinement)**: most distinct from a questionnaire, safest, aligned with the Aperture metaphor.
2. **F8 Integrate**: unlocks honest longitudinal change.
3. **F4 Settle** and **F7 Recover**: after safety review.
4. **F2, F5, F6**: strengthen existing templates with the new closings first.

## Cross-family acceptance for "exercise, not questionnaire"
A reviewer, seeing only the screen flow, can name the **skill** being practised and the **thing the user did**; the closing could not be swapped between two different sessions without being wrong.
