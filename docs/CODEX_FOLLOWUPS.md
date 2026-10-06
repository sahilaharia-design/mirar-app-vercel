# Codex follow-up dependencies (v2.0.1 contract) — presentation, not fixed here

Recorded, deliberately **not** fixed visually during engineering integration.

| # | Item | Contract support now available | What Codex should do |
|---|---|---|---|
| A | **Duplicate "Today"** on the timeframe step: the control that returns to the Today view and the "Today" timeframe option share a name | `NAV_LABEL.backToToday = "Back to Today"`; `TIMEFRAME_LABEL.today = "Today"` (`lib/innerRep/v2/contracts.ts`) | Name the return control "Back to Today" (visible label and accessible name). The header button in `DailyExperience.tsx` still reads "Today" |
| B | **Commitment context**: a commitment check must identify the commitment | Step `context.commitment { label, timeframe, dueInDays? }` on the primary step; the **prompt already names it** ("You mentioned: Reach out to a friend. How is that going?"). No internal ids | Optionally render `context.commitment` as a quiet supporting line (e.g. the date). If the prompt is shown alone it is already safe |
| C | **Capacity labels** are internal structure | `RepPayload.capacityLabel` is now **optional** and is set only for training reps; continuity, open-question and presence reps omit it | Do not require it. `DailyExperience.tsx` currently renders `<Body>{today.payload.capacityLabel}</Body>` in two places; with the label absent that renders an empty element — make it conditional |

## Functional edits made inside Codex's components (needed to keep the integrated flow working with the revised contract; no styling changed)
Please review these during the next presentation pass.
- `HonestMirror.tsx`: "What's off?" now lists the six structured reasons (`CORRECTION_REASONS`) instead of domain chips; optional note field only on "Something else" (safety-checked, cleared, never passed on); new optional `onSafety` prop.
- `DailyExperience.tsx`: `onCorrection(insightId, reason)`; passes `onSafety` to `HonestMirror`.
- `Interactions.tsx` (`TimeframeInteraction`): labels from `TIMEFRAME_LABEL`; the date control accepts only future dates (`min` = tomorrow, button disabled otherwise, one line of helper text "Choose a day after today."), and emits `date` (`YYYY-MM-DD`) instead of a numeric offset.
