# MIRAR Guidance Layer

## What Changed

This pass adds a lightweight in-app education layer without rebuilding the product or changing Supabase logic.

Mirar now explains itself while the user moves through the app:

- One answer becomes a signal.
- Repeated signals become a pattern.
- Patterns become a mirror.

## The Mirror Guide

Added a reusable in-app guide modal:

- `components/guide/MirrorGuideModal.tsx`
- `lib/guidance.ts`

The guide includes short cards for:

- What is Mirar?
- What is a daily mirror?
- What is a signal?
- What is a pattern?
- Why one question a day?
- Is this therapy?
- What happens if I miss a day?
- How should I read my summary?
- How does Mirar help over time?

The guide is available from:

- Today screen
- Signals tab
- Reports tab
- Profile/settings

## Contextual Explanations

Added shared tooltip copy for:

- Signal
- Pattern
- Reflection summary
- Today’s mirror
- Under Load
- Steady
- Drifting
- Aligned
- Still forming
- Recent reflections
- What’s been showing up

These use the existing `InfoTooltipInline` component.

## Screens Updated

### Today

Added a guidance block near the top:

“Today’s mirror is ready.”

“One question. One answer. One small signal.”

“Choose what feels closest. There is no right answer.”

The daily mirror action now appears earlier in the screen so Today feels less like a dashboard first.

### Daily Mirror Flow

The question step keeps the existing MCQ behavior.

The optional note step now says:

“Add a private line, only if you want.”

“This is optional. Your answer is enough.”

The submit button now says:

“Record today’s mirror”

### Post-Answer Signal

The result screen now frames the result as:

“Your signal today”

It includes a “How to read this” expandable explanation:

“This signal reflects what your answer pointed toward today. It is not advice, diagnosis, or judgment.”

Numeric scoring remains available because the existing logic depends on it, but the screen puts the human signal first.

### Signals

Added explanation:

“Signals are small reflections from your daily mirrors. When they repeat, they start to show a pattern.”

For low-data states:

“Your signals are still forming. A few more reflections will make this clearer.”

The tab now includes “How this works” access to The Mirror Guide.

### Reports

Reports are now framed as reflection summaries:

“Summaries help you see what repeated across your reflections.”

Report details now include:

- Your reflection summary
- What kept showing up
- Your strongest signal
- What this may help you notice
- How to read this

## What Was Preserved

- Auth
- Magic-link sign-in
- Onboarding
- Multilingual settings
- Daily MCQ check-in
- Optional note
- Signal/result screen
- Signals tab
- Reports tab
- Report detail pages
- Profile/settings
- Supabase schema
- Existing data-write logic
- Existing deployment setup

## What Was Not Changed

- No Supabase schema change
- No AI decision-making change
- No backend routing logic change
- No admin dashboard change
- No deployment
- No WhatsApp/Brevo/Zapier integration

## Recommended Next Step

Run the signed-in UX QA checklist against this guidance layer, especially:

- Does a new user know what to do?
- Does the signal screen feel valuable immediately?
- Do Reports now feel like reflection summaries instead of analytics?
- Does “28-day program” language feel sufficiently hidden from the normal user experience?
