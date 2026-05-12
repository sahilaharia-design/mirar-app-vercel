# MIRAR_SIGNED_IN_UX_QA_CHECKLIST

Purpose: manually test whether Mirar now feels clearer, calmer, and more like a daily mirror after the language and visibility pass.  
Scope: signed-in UX QA only. Do not change code, copy, backend logic, or deployment during this test.

Use a real test account if possible. If the account has already completed today’s mirror, test the returning-user state and use another test account/device for the fresh daily mirror flow.

## Scoring Table

| Screen | Clarity 1-5 | Calmness 1-5 | Feels Like Mirar 1-5 | Still Feels Too Technical? | Notes |
|---|---:|---:|---:|---|---|
| Login / magic link |  |  |  |  |  |
| Onboarding |  |  |  |  |  |
| Language switching |  |  |  |  |  |
| Today screen |  |  |  |  |  |
| Daily mirror / MCQ flow |  |  |  |  |  |
| Optional reflection note |  |  |  |  |  |
| Post-answer mirror result |  |  |  |  |  |
| Signals tab |  |  |  |  |  |
| Reports / reflection summaries |  |  |  |  |  |
| Report detail page |  |  |  |  |  |
| Profile / settings |  |  |  |  |  |
| Returning user state |  |  |  |  |  |
| Mobile responsiveness |  |  |  |  |  |
| Desktop responsiveness |  |  |  |  |  |

## 1. Login / Magic Link

What to click:
- Open the app.
- Enter a test email.
- Click the primary CTA.
- Open the magic link from email.

What to observe:
- Whether the landing page explains Mirar without feeling like a program.
- Whether the CTA feels clear and low-friction.
- Whether the magic-link success state is understandable.

What should feel clear:
- Mirar is a daily mirror.
- No password is required.
- The user knows to check email.

What may still feel confusing:
- The landing page may still feel slightly explanatory or “product-like.”
- “Private Beta” may raise questions if users do not know whether they have access.

Copy to specifically review:
- “Start your daily mirror”
- “No password · No tracking · Private Beta”
- “Check your email”
- “The link is valid for 60 minutes…”

Check for technical/program feeling:
- Does the landing page still feel like alignment analytics?
- Does it still imply a long program instead of a 2-minute pause?

## 2. Onboarding

What to click:
- Complete the magic-link flow with a new test user.
- Move through each onboarding slide.
- Click Start.

What to observe:
- Whether the 3 screens are enough to understand the product.
- Whether the language picker is visible but not distracting.
- Whether Start leads cleanly into the signed-in app.

What should feel clear:
- One simple question each day.
- Mirar helps notice what is shifting.
- It takes less than 2 minutes.

What may still feel confusing:
- If setup pauses or errors, there may be no friendly error state.
- The user may not yet understand what happens immediately after Start.

Copy to specifically review:
- “Mirar asks one simple question each day.”
- “It helps you notice what is shifting inside you.”
- “Takes less than 2 minutes.”
- “Start”

Check for technical/program feeling:
- Does onboarding feel like a ritual, not a course?
- Does anything imply stages, dashboards, or scoring?

## 3. Language Switching

What to click:
- Use the language picker on login.
- Use the language picker on onboarding.
- After sign-in, open Profile and switch language.
- Return to Today, Signals, Reports, and Profile.

What to observe:
- Whether nav labels and key CTAs update.
- Whether Hindi/Gujarati text fits the UI.
- Whether mixed English appears in important places.

What should feel clear:
- Language selection is easy to find.
- Core flow remains usable in each language.

What may still feel confusing:
- Some deeper screens may still contain English.
- Generated report/mirror content may still appear in English.

Copy to specifically review:
- Today tab labels.
- Daily mirror CTA.
- Onboarding slides.
- Profile language names.

Check for technical/program feeling:
- Do translated terms feel natural, or like direct product jargon?
- Do any untranslated technical words stand out?

## 4. Today Screen

What to click:
- Open Today after signing in.
- Pull to refresh.
- Tap any expandable signal cards if present.

What to observe:
- First impression of the signed-in home screen.
- Whether the primary action is obvious.
- Whether the page feels like a calm mirror or an analytics dashboard.

What should feel clear:
- Today’s mirror is the main action.
- Recent reflections/patterns are secondary.
- The user is not being judged or graded.

What may still feel confusing:
- Numeric status may still read as a score.
- Multiple cards may still feel dashboard-like.
- “Recent pattern” and “What’s been showing up” may need real user validation.

Copy to specifically review:
- “Today’s mirror”
- “Daily pause”
- “Start today’s mirror”
- “What’s been showing up”
- “A small signal”

Check for technical/program feeling:
- Does the alignment ring still feel like a performance score?
- Do cards feel supportive or overly analytical?

## 5. Daily Mirror / MCQ Question Flow

What to click:
- Tap Start today’s mirror.
- Read the question.
- Select one option.
- Tap Continue.

What to observe:
- Whether the question can be understood quickly.
- Whether the options feel easy and non-judgmental.
- Whether the absence of HIGH/MID/LOW badges improves calmness.

What should feel clear:
- Choose what feels closest.
- There is no right answer.
- The user only needs one selection.

What may still feel confusing:
- Some prompts may still be too abstract.
- “Continue” may make users wonder what comes next.

Copy to specifically review:
- “Choose what feels closest. There is no right answer.”
- The actual question text.
- Each MCQ option.
- “Continue →”

Check for technical/program feeling:
- Are any backend concepts visible?
- Do options feel like emotional recognition rather than scoring?

## 6. Optional Reflection Note

What to click:
- After selecting an MCQ answer, view the note screen.
- Type a short note.
- Try Skip.
- Try Record signal.

What to observe:
- Whether the note feels optional.
- Whether the selected answer echo feels calming.
- Whether the screen adds friction to the 2-minute ritual.

What should feel clear:
- The note is private.
- The note is not scored.
- The user can skip without penalty.

What may still feel confusing:
- “Record signal” may still sound system-like.
- The note step may feel like journaling even though Mirar is not a journaling app.

Copy to specifically review:
- “A LINE, IF YOU HAVE ONE”
- “Write freely. Not scored.”
- “HELD PRIVATELY”
- “Skip”
- “Record signal →”

Check for technical/program feeling:
- Does “signal” still feel too backend-heavy here?
- Does this step slow the daily pause too much?

## 7. Post-Answer Mirror Result

What to click:
- Complete a daily mirror.
- Wait for the result screen.
- Read the full screen.
- Click Close.

What to observe:
- Whether there is immediate emotional recognition.
- Whether the result feels like a mirror, not a score.
- Whether the numeric value is too prominent or acceptable.

What should feel clear:
- This is today’s reflection.
- It is not a verdict.
- The user can close and return to Today.

What may still feel confusing:
- The threshold bar may still feel analytical.
- The number may still read as a grade.
- “What today touched” may need validation.

Copy to specifically review:
- “Today’s mirror”
- “A small signal”
- “Signals are small mirrors, not scores.”
- “Read this as a reflection of today’s answer, not a verdict.”
- “Today’s reflection”
- “What today touched”
- “Return when you’re ready”

Check for technical/program feeling:
- Does the result screen still feel like a dashboard?
- Does the reflection text feel recognitional rather than advisory?

## 8. Signals Tab

What to click:
- Open Signals.
- Pull to refresh.
- Tap a signal row.
- Open and close the detail sheet.

What to observe:
- Whether the tab feels like a light pattern layer.
- Whether signal rows are understandable without codes/averages.
- Whether detail sheet language feels human enough.

What should feel clear:
- The tab shows what has been showing up recently.
- Signals are patterns, not performance metrics.
- Tapping a row gives more context.

What may still feel confusing:
- Status labels like Aligned/Forming/Stabilizing/Under Load may still feel evaluative.
- Sparklines and coverage bars may still feel analytical.

Copy to specifically review:
- “What’s showing up”
- “Recent reflections”
- “Recent signals”
- “Your pattern”
- “signal area”
- “showing more steadiness”
- “showing more pressure”
- “What showed up”

Check for technical/program feeling:
- Does Signals feel useful without feeling like a dashboard?
- Are there still visible codes, averages, or scoring cues?

## 9. Reports / Reflection Summaries

What to click:
- Open Reports/Mirror tab.
- Review locked and available cards.
- Tap an available report if present.

What to observe:
- Whether reports feel like reflection summaries.
- Whether locked states are understandable.
- Whether users can tell reports are not performance reviews.

What should feel clear:
- Reports appear after enough reflections.
- They are summaries, not grades.
- Generated reports are tappable; forming reports are not.

What may still feel confusing:
- The tab is still named Mirror in navigation.
- “Still forming” may not explain when a report will appear.

Copy to specifically review:
- “Reflection summaries”
- “Your pattern will appear after a few reflections.”
- “Read this as a mirror, not a verdict.”
- “Recent summaries”
- “Full pattern”
- “Still forming”

Check for technical/program feeling:
- Does the tab feel like analytics?
- Does the locked state create pressure to complete more days?

## 10. Report Detail Page

What to click:
- Open an available reflection summary.
- Scroll through summary, what showed up, strongest signals, gentle checks.
- Go back.

What to observe:
- Whether the report language feels observational.
- Whether theme/status data is understandable.
- Whether stored older report content still leaks technical language.

What should feel clear:
- This is a mirror summary.
- It contains observations, not advice.
- The user can read it lightly.

What may still feel confusing:
- Existing stored reports may still include older terms.
- Status labels and report structure may still feel formal.

Copy to specifically review:
- “What showed up”
- “Strongest signals”
- “Gentle checks”
- “based on reflections”
- “Read this as a mirror, not a verdict.”

Check for technical/program feeling:
- Are codes, averages, or calibration language still visible?
- Does it feel like a report card?

## 11. Profile / Settings

What to click:
- Open Profile.
- Review Mirar ID section.
- Switch language.
- Toggle dark mode.
- Expand reflection notes if available.
- Sign out test only if ready to re-authenticate.

What to observe:
- Whether privacy wording feels accurate and reassuring.
- Whether settings look real/configurable.
- Whether reflection notes feel private and optional.

What should feel clear:
- Mirar ID helps separate reflection history inside the app.
- Language can be changed.
- Sign out is available.

What may still feel confusing:
- Reminder and notification rows may look editable but are static.
- Dark mode may not affect every screen consistently.

Copy to specifically review:
- “Your Mirar ID helps separate your reflection history from your public identity inside the app.”
- “Daily mirror reminder”
- “Summary notifications”
- “Reflection notes”
- “Daily mirror”
- “Current pattern”

Check for technical/program feeling:
- Does Profile feel like account/settings, not a metrics page?
- Are cycle/current pattern labels still too programmatic?

## 12. Returning User State If Testable

What to click:
- Sign in with an account that already completed today’s mirror.
- Open Today.
- Leave and return to app.
- Refresh Today.

What to observe:
- Whether completed state is clear.
- Whether the app avoids asking for another mirror today.
- Whether Today still feels useful after completion.

What should feel clear:
- Today’s mirror has already been recorded.
- The user can read their current reflection/pattern.
- They know they can return tomorrow.

What may still feel confusing:
- If the post-answer result is gone, user may not know how to revisit today’s reflection.
- Completed state may be too subtle.

Copy to specifically review:
- “Check-in recorded”
- “Today’s mirror”
- Time recorded.
- Any context line at the top of Today.

Check for technical/program feeling:
- Does returning feel like continuity or a dashboard?
- Is there any streak pressure?

## 13. Mobile Responsiveness

What to click:
- Test on a phone viewport or real phone.
- Go through login, onboarding, Today, daily mirror, result, Signals, Reports, Profile.

What to observe:
- Text wrapping.
- Button sizing.
- Scroll behavior.
- Keyboard behavior on email and optional note.
- Bottom nav spacing.

What should feel clear:
- Main CTA is always easy to reach.
- Question and options fit without awkward truncation.
- Result screen is readable.

What may still feel confusing:
- Dense cards may stack too heavily.
- Report/detail screens may feel long.
- Hindi/Gujarati text may wrap unexpectedly.

Copy to specifically review:
- Long translated strings.
- Button labels.
- Result screen helper text.
- Profile privacy note.

Check for technical/program feeling:
- Does mobile feel like a 2-minute pause?
- Does anything feel like a compressed dashboard?

## 14. Desktop Responsiveness

What to click:
- Test on laptop/desktop width.
- Resize from narrow to wide.
- Go through signed-in tabs.

What to observe:
- Whether content width feels intentional.
- Whether cards stretch too wide.
- Whether the landing page and app feel visually related.

What should feel clear:
- Mirar remains calm and focused on larger screens.
- The daily mirror action is still primary.
- Secondary pattern surfaces do not overwhelm.

What may still feel confusing:
- App screens may feel mobile-first inside a wide browser.
- Some dashboard cards may look more analytical on desktop.

Copy to specifically review:
- Landing hero and CTA.
- Today section labels.
- Signals and Reports headings.

Check for technical/program feeling:
- Does desktop make Mirar feel like SaaS analytics?
- Does the mirror ritual still feel intimate?

## Recommended Next Build Step After QA

After this QA pass, the smallest safe build step is to refine the **daily mirror flow only**, without touching backend logic:

- Make the MCQ question screen even calmer.
- Make the optional note feel clearly skippable.
- Make the post-answer result prioritize one short reflection before any numeric or pattern detail.
- Keep Today, Signals, Reports, Profile, auth, multilingual support, and Supabase logic intact.

Do not change missed-day/date behavior until the signed-in UX feels stable.
