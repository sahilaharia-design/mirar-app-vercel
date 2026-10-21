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
