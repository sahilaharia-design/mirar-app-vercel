# MIRAR Testing Guide

Use this guide to test the current Mirar app after the guidance/value layer pass.

## Local Testing

Start the app:

```bash
npm run web -- --port 8081
```

Open:

```text
http://localhost:8081
```

## Test New User Onboarding

Recommended safe approach:

1. Use a fresh email address for magic-link sign-in.
2. If testing in the same browser, sign out first from Profile.
3. Clear site data for `localhost:8081` if onboarding state appears cached.
4. Complete magic-link sign-in.
5. Confirm onboarding still appears for a user without an active cycle.

Observe:

- Onboarding remains intact.
- Language remains calm and simple.
- No backend terminology appears.
- The user knows Mirar is one daily mirror, not a program.

## Test Daily Mirror

1. Go to Today.
2. Confirm the guidance block appears near the top.
3. Tap the daily mirror card.
4. Read the question.
5. Select one MCQ option.
6. Tap Continue.

Observe:

- The question is still the existing MCQ flow.
- Option selection still works.
- Copy says there is no right answer.
- No HIGH/MID/LOW badges appear.

## Test Optional Note

1. After selecting an answer, continue to the note step.
2. Confirm the note step says it is optional.
3. Tap Skip.
4. Repeat once and add a short note.

Observe:

- Skip works.
- Recording with a note works.
- The note does not feel required or like journaling homework.

## Test Completed State

1. Complete today’s mirror.
2. Return to Today.
3. Confirm the daily mirror card shows completed state.

Observe:

- The app still prevents duplicate same-day check-ins.
- Completion feels like a recorded reflection, not a streak requirement.

## Test Post-Answer Signal

1. Complete a daily mirror.
2. Review the result screen.
3. Open “How to read this.”

Observe:

- The main label is a simple signal.
- The mirror sentence is visible.
- The screen says signals are small mirrors, not scores.
- Numeric score is not the emotional center of the screen.

## Test Signals

1. Open the Signals tab.
2. Read the top explanation.
3. Tap info icons next to labels/statuses.
4. If available, open a signal detail sheet.

Observe:

- Signals explain what has been showing up recently.
- The tab does not feel like analytics first.
- “A few more reflections” appears when data is limited.
- The tab does not prominently frame the user as being “2 out of 28.”

## Test Reports

1. Open Reports.
2. Read the explanation card.
3. Tap “How this works.”
4. Open any generated report.

Observe:

- Reports feel like reflection summaries.
- Empty/locked states make sense.
- The user understands why summaries matter over time.
- “Read this as a mirror, not a verdict” remains visible.

## Test Report Detail

1. Open a generated report.
2. Read “Your reflection summary.”
3. Review “What kept showing up.”
4. Open “What does this mean?”
5. Review existing theme blocks, strongest signals, and gentle checks.

Observe:

- Report detail feels reflective and useful.
- It does not feel diagnostic, motivational, or advice-heavy.
- Existing report data is preserved.

## Test Different Languages

1. Go to Profile.
2. Change language.
3. Return to Today, Signals, Reports, and Profile.

Observe:

- Language switching still works.
- Existing translated app copy still changes.
- New guidance copy currently remains English and should be translated in a later localization pass if multilingual polish is required.

## Test Returning User Behavior

1. Sign in as a user with previous reflections.
2. Open Today.
3. Open Signals.
4. Open Reports.
5. Open Profile notes if present.

Observe:

- Existing responses still load.
- Existing reports still load.
- Existing notes still load.
- Guidance appears without blocking normal use.

## Test Development Day Simulator

The dev simulator appears only in development.

1. Start the app locally.
2. Sign in.
3. On Today, use “Development · Day Simulator.”
4. Tap “Next Day.”
5. Open Signals.

Observe:

- Today shows the simulated reflection number.
- Today attempts to load the question for the simulated day.
- Signals uses the same simulated day for current pattern display.

Known limitation:

- Submitting a check-in still writes through the existing real cycle-day logic in `stores/checkin-store.ts`.
- This was intentionally not changed in this pass to avoid breaking production date/missed-day behavior.
- A future dev-only override can be added after deciding how test writes should be isolated.

## Mobile Responsiveness

Test at a narrow mobile width.

Observe:

- Mirror Guide opens and scrolls.
- Tooltips do not block core actions.
- Today’s primary action remains visible without dashboard clutter.
- Report detail sections do not overlap.

## Desktop Responsiveness

Test in a desktop browser.

Observe:

- Cards remain readable.
- Tooltips expand cleanly.
- The guide modal feels calm and not cramped.
- Signals and Reports remain scannable.
