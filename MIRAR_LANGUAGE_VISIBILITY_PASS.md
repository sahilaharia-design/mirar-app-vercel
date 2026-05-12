# MIRAR_LANGUAGE_VISIBILITY_PASS

Date: 2026-05-12  
Scope: language and visibility pass only.  
No rebuild, no routing changes, no Supabase schema changes, no missed-day/date logic changes, and no deployment.

## 1. User-Facing Terms Changed

| Previous term/copy | Updated direction |
|---|---|
| Your alignment reading | Today’s mirror |
| Your Signals | What’s been showing up |
| Begin your check-in | Start today’s mirror |
| Your daily signal is ready | Today’s mirror is ready |
| Calibrating | Still forming |
| 3 check-ins needed | A few reflections help the pattern appear |
| Signal Status · 7 days | Recent signals |
| Signal History | Recent reflections |
| Current Reading | What’s showing up |
| Mirror Reports | Reflection summaries |
| Chapter Mirrors | Recent summaries |
| Full Cycle | Full pattern |
| Signal Areas | What showed up |
| Primary Signals | Strongest signals |
| Calibration Checks | Gentle checks |
| Themes read today | What today touched |
| Tomorrow at dawn | Return when you’re ready |
| Cycle Progress | Reflection pattern |
| Daily check-in reminder | Daily mirror reminder |
| Report notifications | Summary notifications |
| Signal Notes | Reflection notes |

## 2. What Was Hidden Or Softened

- Removed visible `HIGH` / `MID` / `LOW` badges from MCQ options.
- Removed theme-code badges from the optional journal step.
- Replaced post-answer theme code display with softer “area touched” language.
- Reduced numeric score prominence on the Today alignment ring and post-answer mirror screen.
- Added mirror-not-verdict helper copy to the post-answer mirror result.
- Replaced several Day/Chapter/stage labels with Today, Daily pause, Recent reflections, or Reflection pattern.
- Removed visible theme codes and averages from report detail theme blocks.
- Sanitized report signal list display so stored report content shows less code-like language.
- Softened generated report, weekly signal, daily reminder, report notification, and mirror insight wording without changing backend behavior.
- Updated privacy language to avoid claiming that email and signal data are completely structurally separate.

## 3. What Was Intentionally Preserved

- Existing app architecture and Expo Router structure.
- Supabase Auth magic-link login.
- Onboarding flow and language picker.
- English, Hindi, and Gujarati language support.
- Today dashboard and all existing cards.
- Daily MCQ check-in behavior.
- Optional private note behavior.
- Post-answer mirror/result route.
- Signals tab and theme detail sheet.
- Reports tab and report detail screen.
- Profile/settings, sign-out, Mirar ID, language switching, and notes archive.
- Supabase schema, RLS, tables, and migrations.
- Existing date, current-day, streak, missed-day, and report-unlock logic.
- Existing scoring, question selection, report generation triggers, and AI invocation flow.
- Existing Vercel build/deploy setup.

## 4. Places Not Changed Safely Yet

- Some internal type names, variables, table names, and function names still use score/stage/theme terminology. These are implementation details and were not renamed in this pass.
- Existing stored report rows may still contain older language because the app reads report text already saved in Supabase. The display now softens some of that text, but historic content is not rewritten.
- Admin and dev tooling still show technical terms because they are internal surfaces.
- The numeric score still exists visually, but with lower emphasis. Removing it completely should be a separate product decision because several screens depend on score/status pairing.
- Some hardcoded English remains in deeper components and generated content paths. Full multilingual copy coverage should be handled as its own pass.
- Missed-day/date behavior was intentionally not changed.

## 5. Recommended Next Step

Run a focused UX QA pass on the live signed-in flow before changing logic:

1. Start from login and onboarding.
2. Complete one daily mirror.
3. Review Today, post-answer mirror, Signals, Reports, and Profile.
4. Note any remaining copy that still feels like analytics, scoring, or a program.

After that, the safest next build step is a small **daily mirror flow refinement**: keep the same MCQ and backend behavior, but make the check-in and post-answer screens feel even more like “one question, one answer, one reflection.”
