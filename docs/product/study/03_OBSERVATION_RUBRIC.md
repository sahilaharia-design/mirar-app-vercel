# 03 — Observation rubric (DRAFT)

Code every try. One row per participant × prototype × try in `04_DATA_SHEET.md`. Code what is observed, not inferred feelings.

| Code | Dimension | Scale / values | Definition |
|---|---|---|---|
| U | Understood unaided | 0 = no, 1 = partly, 2 = yes | Participant's own paraphrase of what was asked matches the intent, before any explanation |
| T | Time to first choice (s) | number | Screen shown → first selection |
| C | Completed | Y / N | Reached the end of the moment |
| X | Exit | none / voluntary-skip / voluntary-exit / moderator-stop | How it ended if not completed |
| H | Hesitation | 0 / 1 / 2 | 0 none, 1 pause >5 s, 2 re-reads or asks what it means |
| M | Mismatch | Y / N | Participant said no option fit, or chose "other" |
| R | Relatable | 1–5 (self-report) | "Is this the kind of thing that happens in your day?" |
| E | Ease | 1–5 (self-report) | Asked between tries |
| A | Again tomorrow | yes / maybe / no | Self-report only; **not** a retention measure |
| F | Felt-effect note | free text, short | Only what the participant volunteers about how it felt. Never probe for depth |
| K | Concerning content | 0 / 1 | Any trigger in 05 §3 (also triggers stop rule) |
| N1 | Unassisted first action | Y / N | Participant identified the first action without moderator coaching (no hint, no pointing, no "try tapping…") |
| NS | Unassisted next steps | count of steps identified unaided / total steps | Per step after the first; a coached step counts as not unaided |
| O | Overload events | count, with type | Tally each: pause >5 s on a screen (`P`), re-read (`RR`), repeated scrolling (`SC`, ≥2 reversals), asks what to do next (`Q`). Note the screen id |
| V | Variety preference | same / different / no preference | Asked once after both prototypes (06 Q12–13) |
| RM | Return motivation | curiosity-new-format / usefulness / both / neither | Coded from the participant's own words (06 Q14–15); see rule below |

**Exploratory codes (N1, NS, O, V, RM).** Added by the founder addendum. They are descriptive observations and carry **no pass/fail threshold**. They do not change the pass criterion below.

**Coaching rule.** Any moderator hint before the participant acts makes that step "coached". Neutral prompts ("What are you thinking?") do not. If a participant is stuck >15 s, record the step as not unaided, then give the minimum neutral prompt first, a hint only after a further 10 s.

**Return motivation rule (RM).** Code `curiosity-new-format` when the reason is the novelty or format ("different", "wanted to see what else"). Code `usefulness` when the reason is what the exercise gave them ("helped me notice", "relevant to my day"). `both` if both are stated. Never infer; if unclear, ask "What would bring you back, the new kind of thing or what it did for you?" once, neutrally.

## Two different "firsts" (never conflate)
- `first_in_order = Y` when the prototype was the participant's **first of their two** (order_slot 1).
- `first_try = Y` for the participant's **first exposure to that prototype** (try_no 1), whichever slot. The gate uses `first_try`; the order check uses `first_in_order`.

## Authoritative pre-registered gate (the ONLY pass/fail rule; fixed before any session)
This table is the founder-approved protocol from `docs/product/MIRAR_REALIGNMENT_RECONCILIATION.md` §4, copied here unchanged. If the two ever differ, fix both before testing. It replaces the earlier U/C/M/E participant-level rule that this file used to contain.

**Unit of analysis.** One *participant × prototype pairing*. Each prototype has **8 pairings** (8 of the 12 participants; 4 where it was first in that participant's order, 4 where it was second). The gate is computed on **each participant's first try of that prototype** (their first exposure to it), n = 8. Further tries are repeats (exploratory only).

| Measure (per prototype, n = 8 first tries) | **Pass** (all must hold) | **Fail** (any one) |
|---|---|---|
| M1 can say what they did (reviewer-coded, blind) | ≥ 6 of 8 | |
| M2 interesting or enjoyable (1–5) / heavy or serious (1–5) | median ≥ 4 / median ≤ 2 | |
| M4 forced choice quiz / chore / practice / game | | ≥ 3 of 8 choose "quiz" or "chore" |
| M5 wants to do another (stated) | ≥ 6 of 8 | |
| M6 discomfort | at most 1 mild, none severe | any severe; any report of pressure |
| M7 payoff truthfulness and swap test | 100% pass; no statement a participant calls untrue | any untrue statement |
| Abandoned mid-exercise | ≤ 1 of 8 | ≥ 2 of 8 |

**Reading the gate.** A prototype *clears the screen* only if every Pass condition holds and no Fail condition occurs. Any other outcome is "does not clear". A fail on M6 or M7 drops the prototype regardless of the rest. 6 of 8 is a screening gate, not an estimate (95% CI 35–97%; a true 60% rate still reaches 6/8 about 31% of the time, 70% → 55%, 80% → 80%). No ranking, efficacy, retention, conversion or segment claim.

**Reported alongside, descriptive only:** (a) the same measures for the 4 pairings where the prototype was **first in the participant's order** and the 4 where it was **second** (order check; no test); (b) repeats; (c) the exploratory codes N1, NS, O, V, RM and U/C/H/X/T/R/E/A, none of which has a threshold.

**Note on M3.** The reconciliation table has no M3. It is intentionally unused; do not add one after testing.

**Where each measure is collected.** M1: moderator asks "What, if anything, did you do here?" (feedback Q1), verbatim, coded blind later. M2, M4, M5, M6, M7: feedback Q16–20. M7 swap test: moderator shows the closing summary and asks whether any line is untrue (Q20).

## Cross-cutting watch list
- Participant reads "my own afternoon" as hypothetical or third-person (Attention wording).
- Participant looks for typing/free text and is disappointed.
- Participant treats the output as advice or a verdict.
- Participant expects the tool to remember.
- Language drift into therapy/journaling expectations.
- Too much shown at once: participant does not know what to select first (record the screen and what they looked at).
- Wants a different format next time rather than the same one (record verbatim).
