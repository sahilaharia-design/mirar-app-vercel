# MIRAR Implementation Notes

## What Changed

Implemented the Step 4 guidance and value layer on top of the existing app.

The work focused on helping users understand:

- What to do in Mirar
- What a signal means
- What a pattern means
- Why one daily answer matters
- Why reports are useful
- How to read summaries without treating them as scores or verdicts

## Guidance Components Added

### `lib/guidance.ts`

Centralized copy for:

- The Mirror Guide cards
- Tooltip explanations
- Signal label helpers

### `components/guide/MirrorGuideModal.tsx`

Reusable in-app guide modal available from:

- Today
- Signals
- Reports
- Profile

### `stores/dev-store.ts`

Small shared dev store for simulated day state.

This lets the development day simulator affect both Today and Signals without touching production persistence.

## Screens Updated

### Today

- Added a top guidance block.
- Moved the daily mirror action earlier.
- Added “How Mirar works.”
- Added clearer value language for low-data users.
- Connected the dev simulated day to shared state.

### Daily Mirror

- Preserved MCQ flow.
- Kept existing question and option logic.
- Softened optional note copy.
- Changed final note action to “Record today’s mirror.”

### Post-Answer Signal

- Added “Your signal today.”
- Added status explanation tooltip.
- Added expandable “How to read this.”
- Kept numeric score and existing threshold logic, but reduced its conceptual importance.

### Signals

- Added explanation of signals and patterns.
- Added low-data “still forming” copy.
- Added “How this works.”
- Added contextual tooltips.
- Connected Signals to the dev simulated day display.

### Reports

- Added report value explanation.
- Added “How this works.”
- Reframed reports as reflection summaries.

### Report Detail

- Added reflection-summary sections:
  - Your reflection summary
  - What kept showing up
  - Your strongest signal
  - What this may help you notice
  - How to read this
- Preserved existing report data, theme blocks, strongest signals, and gentle checks.

### Profile

- Added Mirror Guide entry.
- Preserved Mirar ID, language settings, profile behavior, notes, and sign-out.

## Report/Value Improvements

Reports now answer more clearly:

- What has been showing up?
- What repeated?
- What is the strongest signal?
- How should this be read?

Language stays reflective and non-diagnostic.

## 28-Day / Program Language Softened

Normal user-facing language now favors:

- Today’s mirror
- Reflection
- Signal
- Pattern
- Recent reflections
- Your pattern is forming

Visible “Day X / 28” language was removed from the daily mirror note step and softened in pattern components.

Admin/dev surfaces may still mention day numbers because those are operational/testing contexts.

## Development Day Simulator

What was fixed:

- The simulated day is now shared through `stores/dev-store.ts`.
- Today and Signals now read the same simulated day.
- Refreshing Today keeps the simulated day question-loading behavior in development.

What was intentionally not changed:

- Actual check-in submission still uses the real cycle start date and real cycle day from `stores/checkin-store.ts`.
- This avoids changing missed-day/date behavior or Supabase writes during a guidance-layer pass.

Recommended safe next fix:

- Add a dev-only submission override that never runs in production.
- Decide whether simulated submissions should write to Supabase test data or stay local/mock-only.
- Add a visible dev warning explaining whether the next submitted reflection will write to the real day or simulated day.

## What Was Not Changed

- No rebuild from scratch
- No Supabase schema change
- No auth change
- No multilingual setting removal
- No MCQ logic removal
- No Signals tab removal
- No Reports tab removal
- No Profile removal
- No production date/missed-day logic change
- No deployment

## Recommended Next Step

Run manual signed-in QA using `MIRAR_TESTING_GUIDE.md`, then do the smallest targeted refinement based on what feels unclear:

1. Translate the new guidance copy into Hindi and Gujarati if multilingual polish is required.
2. Tighten report detail copy after seeing real report data.
3. Add a safer dev-only simulated submission path if day simulation remains important for testing.
