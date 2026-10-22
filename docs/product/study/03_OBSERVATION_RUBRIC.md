# 03 — Observation rubric (DRAFT)

Code every exposure. One row per participant × prototype × exposure in `04_DATA_SHEET.md`. Code what is observed, not inferred feelings.

| Code | Dimension | Scale / values | Definition |
|---|---|---|---|
| U | Understood unaided | 0 = no, 1 = partly, 2 = yes | Participant's own paraphrase of what was asked matches the intent, before any explanation |
| T | Time to first choice (s) | number | Screen shown → first selection |
| C | Completed | Y / N | Reached the end of the moment |
| X | Exit | none / voluntary-skip / voluntary-exit / moderator-stop | How it ended if not completed |
| H | Hesitation | 0 / 1 / 2 | 0 none, 1 pause >5 s, 2 re-reads or asks what it means |
| M | Mismatch | Y / N | Participant said no option fit, or chose "other" |
| R | Relatable | 1–5 (self-report) | "Is this the kind of thing that happens in your day?" |
| E | Ease | 1–5 (self-report) | Asked between exposures |
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

## First-exposure flag
`first_exposure = Y` only for exposure 1 of that prototype for that participant.

## Pass criterion per prototype (screening gate, pre-registered)
A participant "passes" a prototype if, on their **first exposure**: U ≥ 1, C = Y or X = voluntary-skip with no confusion noted, M = N, and E ≥ 3. The prototype clears the gate at **≥ 6 of 8** passes. This is a go/no-go screen to decide what to iterate, not a measure of effect.

## Cross-cutting watch list
- Participant reads "my own afternoon" as hypothetical or third-person (Attention wording).
- Participant looks for typing/free text and is disappointed.
- Participant treats the output as advice or a verdict.
- Participant expects the tool to remember.
- Language drift into therapy/journaling expectations.
- Too much shown at once: participant does not know what to select first (record the screen and what they looked at).
- Wants a different format next time rather than the same one (record verbatim).
