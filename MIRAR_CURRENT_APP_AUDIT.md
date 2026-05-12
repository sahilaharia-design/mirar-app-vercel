# MIRAR_CURRENT_APP_AUDIT

Audit date: 2026-05-12  
Scope: existing Mirar Expo app, live Vercel app, and Supabase-backed codebase.  
Instruction followed: audit only. No UI redesign, no functional app changes, no deploy.

## 1. Current App Architecture

Mirar is currently an Expo Router React Native app deployed to web through Vercel using `expo export --platform web`.

Core stack:

- Frontend: Expo, React Native, React Native Web, Expo Router, React Query, Zustand, i18next.
- State: Zustand stores for auth, check-in, cycle/dashboard data, and settings.
- Styling/design: local constants in `lib/constants.ts`, theme context in `contexts/theme-context.tsx`, custom components.
- Auth/backend: Supabase Auth magic links, Supabase Postgres tables, Supabase Edge Functions.
- Storage: Supabase session persistence through localStorage on web and SecureStore on native; language/theme preferences through AsyncStorage.
- Deployment: Vercel project builds repo root and outputs `dist`.

Key frontend areas:

- `app/(auth)` handles login and onboarding.
- `app/(tabs)` handles Today, Signals, Mirror Reports, and Profile.
- `app/(checkin)/mirror.tsx` shows the post-check-in reading.
- `app/report/[id].tsx` shows report details.
- `stores/*` own app state and server calls.
- `components/*` provide the UI surfaces.

Key backend areas:

- `supabase/migrations/*` define users, cycles, questions, options, responses, reports, alignment scores, user state, weekly signals, unlocks, subscriptions, and trial tracking.
- `supabase/functions/process-checkin` records a response, computes scores, updates rolling state, and triggers async insights/reports.
- `supabase/functions/select-daily-question` chooses the daily question adaptively.
- `supabase/functions/generate-mirror-insight` generates the post-check-in mirror text.
- `supabase/functions/generate-weekly-signal` generates a weekly signal.
- `supabase/functions/sync-user-state` recomputes streak/context state.
- `supabase/functions/daily-reminder` sends Expo push reminders.

## 2. Current Routes/Screens

| Screen/Component | Current Purpose | Current User-Facing Copy | User Action | Data/State Used | Works Well | Confusing/Needs Improvement | Preserve? |
|---|---|---|---|---|---|---|---|
| `/` `app/index.tsx` | Entry router that sends users to tabs or login. | Loading spinner only. | None. | `useAuthStore.session`, `isInitialized`. | Simple guard. | No user-facing context if auth initialization is slow. | Yes |
| `app/_layout.tsx` | App shell, providers, auth guard, deep link handling. | None. | None. | Supabase session, router segments, settings language, theme. | Centralizes auth redirect and magic-link handling. | Hidden redirect logic can make debugging onboarding harder. | Yes |
| `(auth)/login` web landing | Public landing page and email magic-link sign-in. | “Your internal alignment, made visible.” “Begin your daily reading.” “No password · No tracking · Private Beta.” | Enter email, request sign-in link, switch language. | `useAuthStore.signInWithEmail`, `LanguagePicker`, translations. | Strong brand/positioning and low-friction auth. | Landing still explains a lot: “alignment compounds,” themes shown as chips, “2–3 minutes,” private beta. Some copy may conflict with “daily mirror, less than 2 minutes.” | Yes, simplify later |
| `(auth)/login` mobile landing | Mobile-specific sign-in landing. | “SOME DAYS, NOTHING IS WRONG.” “But something feels slightly off.” “Begin your daily reading.” | Enter email, request sign-in link, switch language. | Platform check, auth store, translations. | Emotional entry is clear. | Different mobile/web content means product promise may feel inconsistent. | Yes |
| `(auth)/onboarding` | First-run onboarding after sign-in. | “Mirar asks one simple question each day.” “It helps you notice what is shifting inside you.” “Takes less than 2 minutes.” CTA: “Start.” | Continue through 3 slides, choose language, start. | Supabase `users`, `cycles`; generated Mirar ID; auth session. | Now close to desired 3-screen onboarding. | It creates user/cycle directly from client; errors are console-only. Some unused old styles remain. | Yes |
| `(tabs)/_layout` | Bottom tab navigation. | Today, Signals, Mirror, Profile. | Switch tabs. | i18n nav labels. | Clear main structure. | “Mirror” means reports, while post-check-in also has a mirror screen. Could confuse. | Yes |
| `(tabs)/index` Today | Main signed-in dashboard and start point for daily check-in. | “Your alignment reading,” “Your daily signal is ready,” “Begin your check-in,” “Your Signals,” “Mirror observes.” | Pull refresh, start check-in, expand theme mini cards. | Cycle store, check-in store, alignment score/history, rolling theme scores, user state. | Centralizes the ritual and shows immediate status. | Still exposes Day/Chapter/stage language; has multiple analytic surfaces that may feel heavier than the core ritual. | Yes, refine carefully |
| Inline `CheckInFlow` inside Today | Two-step daily response flow. | “Day N / 28,” question text, option text, “Continue →,” “A LINE, IF YOU HAVE ONE,” “Write freely. Not scored,” “Record signal →.” | Select one MCQ option, optionally write/skip journal note, submit. | `question`, selected option, journal text, active cycle, auth session. | Preserves MCQ-first behavior and optional note. | Option rows display HIGH/MID/LOW badges and theme codes in journal echo, exposing backend scoring. | Yes, but hide backend language later |
| `(checkin)/mirror` | Route wrapper for post-check-in mirror result. | None directly. | Close reading. | Route params from submission; auth session; cycle refresh. | Clean separation of result screen. | Result depends on route params; direct reload may have weak fallback context. | Yes |
| `MirrorScreen` | Immediate signal/result screen after check-in. | “Today’s reading,” score/status, “Mirror · today,” “Themes read today,” “Tomorrow at dawn,” “Close.” | Read result, close to Today. | Alignment score, 14-day history, theme codes/levels, Supabase `alignment_scores.mirror_text`. | Strong immediate feedback after answering. | Shows numeric score, threshold bar, 14-day signature, theme cards, Day/28. This may be more dashboard-like than “one reflection.” | Preserve, simplify later |
| `(tabs)/signals` | Signals dashboard for theme/stage history. | “Current Reading,” “Chapter N,” “Signal Status · 7 days,” “Signal pattern,” “Signal History.” | Pull refresh, tap theme row for detail. | Stage overviews, theme scores, histories, alignment history. | Valuable pattern layer exists. | Heavy “chapter/stage/signal status” analytics may feel complex for a daily mirror. | Yes |
| `ThemeDetailSheet` | Modal detail view for a selected signal area. | Back to “Signals,” theme name, status, coverage, observations. | Open/close detail sheet. | Theme history, stage overviews, current day. | Rich inspection of one theme. | Uses theme codes and detailed distribution/trend language; likely too technical for casual users. | Yes, but make less visible |
| `(tabs)/reports` | Lists chapter and full-cycle reports. | “Mirror Reports,” “Short reflections appear as your daily signals build,” “Chapter Mirrors,” “Full Cycle,” “Building…” | Pull refresh, open generated reports. | Active cycle, Supabase `reports`. | Report list and locked/generated states are clear. | Reports are hidden behind “Mirror” tab, but daily mirror is elsewhere. Locked report timing is not explained. | Yes |
| `report/[id]` | Detailed report view. | “Summary,” “Signal Areas,” “Primary Signals,” “Calibration Checks,” disclaimer. | Read report, go back. | Report row, theme scores, report display builder. | Preserves structured summary/report feature. | Still exposes internal report language, theme codes, averages, calibration checks. | Yes |
| `(tabs)/profile` | Account, cycle, settings, language, notes, sign out. | “Mirar ID,” “Current cycle,” “Language,” “Settings,” “Signal Notes,” “Sign out.” | Change language, toggle dark mode, expand notes, sign out. | Auth user, cycle store, settings store, theme context, responses with `journal_text`. | Important controls and privacy ID are available. | Reminder/report notification rows are static display only; dark mode toggles but many V3 screens use fixed light colors. | Yes |
| `(dev)/test-panel` | Developer/test tools route. | Dev-only content. | Developer testing. | Dev code. | Useful for internal QA. | Should not be discoverable in production UX. | Internal only |
| `admin/index` | Admin analytics/user list surface. | Admin metrics/copy. | Admin inspection. | Supabase admin functions/data. | Useful operations tooling. | Needs access-control confidence before public use. | Internal only |

## 3. Main Components

| Screen/Component | Current Purpose | Current User-Facing Copy | User Action | Data/State Used | Works Well | Confusing/Needs Improvement | Preserve? |
|---|---|---|---|---|---|---|---|
| `MirarLogo` / `BrandOval` | Brand identity. | Mirar logo/oval. | None. | Static visual props. | Brand presence is consistent. | No major issue. | Yes |
| `LanguagePicker` | Switch app language. | English, हिंदी, ગુજરાતી. | Select language. | `useSettingsStore`, i18n. | Critical multilingual feature is present. | Some hardcoded English remains outside translation keys. | Yes |
| `InfoTooltip` | Inline explanations. | Alignment/check-in/cycle helper text. | Tap/hover tooltip. | Translation keys and local copy. | Can explain dense surfaces. | Tooltips may compensate for overly complex screens. | Yes, use sparingly |
| `PromptCard` | Displays the daily question. | “Day N / 28” plus prompt text. | Read question. | Question from Supabase. | Elegant focused question area. | Day/28 remains visible and may feel programmatic. | Yes |
| `OptionSelector` | MCQ option list. | Option text plus HIGH/MID/LOW badge. | Pick one option. | Question options and selected option ID. | MCQ behavior is strong and easy. | HIGH/MID/LOW exposes scoring and may bias answers. | Yes, hide badges later |
| `JournalExpander` | Optional private note step. | “A LINE, IF YOU HAVE ONE,” “Write freely. Not scored,” “Held privately,” “Skip,” “Record signal →.” | Write note or skip. | Selected option, theme codes/levels, journal text. | Keeps journaling optional rather than required. | Theme-code badges expose backend mappings. | Yes |
| `AlignmentRing` | Today’s alignment status/score. | “Calibrating,” “3 check-ins needed,” score/status. | View only. | Alignment score and trend. | Gives clear state at a glance. | Numeric scoring may feel evaluative rather than reflective. | Yes, possibly soften |
| `TodayCheckinCard` | Primary daily action card. | “Begin your check-in,” prompt preview, “Check-in recorded.” | Start check-in. | Today question, completion state. | Strong daily entry point. | Prompt preview may make dashboard feel busy before ritual. | Yes |
| `FirstDayWelcome` | First-day empty-state explanation. | “Day 1. Your first signal is live.” Pattern detection after 7–14 days. | Read only. | Current day/completion. | Sets expectation that patterns need time. | More explanatory than the desired minimal product. | Yes, simplify later |
| `WeeklySignalCard` | Shows latest weekly signal. | “WEEKLY SIGNAL,” “Generated from your last 7 check-ins.” | Read only. | `user_state.latest_signal_text`. | Lightweight pattern layer exists. | Depends on generated backend state; can be absent without explanation. | Yes |
| `InsightCard` | Dashboard mirror observation. | “Mirror · Today” or “Mirror observes” plus generated/fallback insight. | Read only. | Mirror text, rolling theme scores, alignment score. | Provides immediate recognition outside report flow. | Some fallback copy still advises/frames strongly, e.g. “Worth noticing.” | Yes |
| `ThemeSignalsGrid` | Six mini signal status cards. | Direction, Energy, Attention, Connection, Growth, Movement; status labels. | Tap to expand description. | Rolling theme statuses. | Natural theme names are now visible. | Six-card grid may feel like a dashboard rather than a mirror. | Yes |
| `ThemeSignalRow` | Signals tab row with theme trend. | Theme name, status, count/average/trend. | Tap row. | Stage theme scores and history. | Good for pattern inspection. | Detailed status and scoring can feel analytical. | Yes |
| `StageProgress`, `CoverageBar`, `CycleArc` | Progress/coverage visualization. | Check-ins this stage, chapters/cycle progress. | Read only. | Current day/stage, stage overviews. | Useful for continuity. | Reinforces 28-day program/chapter structure. | Keep but reduce prominence |
| `ReportCard` | Locked/generated report summary row. | Chapter labels, “Building…,” generated date. | Open report if generated. | Report status. | Clear locked/readable state. | “Building…” has no due timing. | Yes |
| `ThemeBlock`, `SignalList` | Report detail sections. | “Signal Areas,” averages, primary/calibration signals. | Read only. | Report display data. | Structured and scannable. | Codes/averages/calibration language are backend-like. | Yes |

## 4. Current Onboarding Flow

Current onboarding happens only after a signed-in user has no `users` row / active cycle. The flow is:

1. User signs in with email magic link.
2. App loads Supabase session.
3. If no active cycle exists, Today redirects to onboarding.
4. Onboarding shows 3 slides with a logo and language picker.
5. Pressing Start inserts a `users` row and a first active `cycles` row.
6. User is routed to Today.

The current onboarding copy is close to the stated Mirar V2 direction:

- “Mirar asks one simple question each day.”
- “It helps you notice what is shifting inside you.”
- “Takes less than 2 minutes.”
- CTA: “Start.”

Current risks:

- User/cycle setup is client-side and errors are only logged.
- The app assumes the `users.id` equals the Supabase Auth user ID.
- Some unused old onboarding styles remain, suggesting prior structure was removed visually but not fully cleaned.

## 5. Current Login/Sign-In Flow

Mirar uses Supabase passwordless email OTP/magic links.

Flow:

1. Public user lands on `/login`.
2. User enters email.
3. `supabase.auth.signInWithOtp` sends magic link.
4. Web redirect returns to current origin; Supabase detects session in URL.
5. Native redirect uses `mirar://` and app-level deep link parsing calls `supabase.auth.setSession`.
6. `useAuthStore.initialize` loads session and user row.
7. If no user row / cycle exists, onboarding begins.
8. If user exists, app opens Today.

Preserve:

- Passwordless sign-in.
- No-password positioning.
- Magic-link deep link support.
- Privacy separation through Mirar ID.

Needs review:

- The landing copy says email never appears in signal data, but `users` stores both email and Mirar ID in the same row. This may still be operationally fine, but the privacy claim should be worded carefully.
- `settings-store` updates `users.language` using `auth_id`, while the user type/schema use `id`; this may mean language is not persisted server-side.

## 6. Current Multilingual/Language Support

Supported languages:

- English (`en`)
- Hindi (`hi`)
- Gujarati (`gu`)

Implementation:

- `lib/i18n.ts` initializes i18next.
- `stores/settings-store.ts` persists selected language to AsyncStorage.
- `LanguagePicker` appears on login and onboarding.
- Profile allows language switching.
- Tab labels, auth/onboarding/profile/status/report basics, and many common strings are translated.

Current gaps:

- Several visible strings are hardcoded in English, especially in Today/check-in/result/report/profile components.
- Backend-generated mirror/weekly/report text is English.
- Theme detail/report internals use hardcoded English.

Preserve:

- Three-language support.
- Language picker on pre-auth and post-auth surfaces.
- AsyncStorage persistence.

## 7. Current Daily Question/Check-In Flow

Flow:

1. Today loads active cycle and current day using `getCycleDay(cycle.start_date)`.
2. Check-in store checks if a response already exists for this user/cycle/day.
3. If completed, it loads the completed question and marks today as complete.
4. If not completed, it invokes `select-daily-question`.
5. The user taps Today’s check-in card.
6. Step 1: prompt and MCQ options.
7. Step 2: optional private note.
8. Submit invokes `process-checkin`.
9. App routes to post-check-in mirror screen.

Question selection:

- Reuses the same selected question for a day via `question_history`.
- Avoids questions served in last 14 days.
- Tracks theme coverage from last 7 days.
- Uses stage affinity and max depth by cycle day.
- Gives under-represented themes more weight.
- Uses under-load status to prefer gentler questions.
- Gives journal-prompt questions a boost if the user writes notes frequently.

Preserve:

- MCQ-first design.
- One answer per day.
- Optional private note.
- Question history/idempotency.
- Rule-based adaptive selection.

Needs improvement:

- The UI still shows Day N / 28 and HIGH/MID/LOW.
- There is no explicit plain-language “one reflection” result before score-heavy UI.
- Optional journal is a full second step; may add friction for the 2-minute ritual.

## 8. Current Signal/Result Screen

The immediate result is `MirrorScreen` after submission.

Current display:

- Day N / 28 and optional Cycle N.
- “Today’s reading.”
- Numeric alignment score.
- Status: Calibrating, Under Load, Stabilizing, Forming, Aligned.
- Delta from previous score if available.
- Threshold bar with labels: Under load, Stabilizing, Forming, Aligned.
- 14-day signature.
- AI-generated mirror text if available; fallback text otherwise.
- Two theme cards for the selected option.
- “Tomorrow at dawn.”
- Close.

Backend:

- `process-checkin` computes and writes `alignment_scores`.
- `generate-mirror-insight` writes `alignment_scores.mirror_text`.
- `MirrorScreen` polls for `mirror_text` up to 6 times, then falls back.

Works well:

- Gives immediate value after answering.
- Has fallback if AI text is unavailable.
- Uses recent history to contextualize the answer.

Confusing:

- The screen is visually rich and score-heavy.
- It exposes themes and levels immediately.
- “Tomorrow at dawn” may be poetic but not operationally clear.

## 9. Current Reports/Summaries/Dashboard Behavior

Today dashboard:

- Context line from `user_state.context_message` or fallback Day/Chapter/Streak text.
- Alignment ring.
- 14-day signal sparkline.
- Weekly signal if available.
- Daily check-in card.
- Theme grid.
- Insight card.

Signals tab:

- Current chapter reading.
- Coverage for current 7-day stage.
- Theme rows with 7-day histories.
- Cross-theme observation.
- Stage progress.
- Cycle arc.
- Theme detail sheet.

Reports tab:

- Chapter report cards for stages 1-4.
- Full cycle report card.
- Locked reports show “Building…”
- Generated reports open detail view.

Backend summaries:

- `generate-weekly-signal` runs after every 7th reflection.
- `generate-report` is triggered after stage-opening days: day 8, 15, 22, and intended day 29 for stage 4.
- Report display is assembled from `reports` and `theme_scores`.

Current issue:

- `getCycleDay` clamps to 28, so the day 29 trigger may never happen through normal client submission. Stage 4/full cycle report generation needs careful review later.

## 10. Current Profile/Settings Behavior

Profile currently includes:

- Mirar ID.
- Privacy note.
- Current cycle number, start date, current day, chapter.
- Cycle arc.
- Language selection.
- Settings card with daily check-in reminder, report notifications, dark mode.
- Signal Notes archive from journal text.
- Sign out.
- Version label.

Works well:

- Mirar ID is prominent.
- Language switching is accessible.
- User can see private notes.
- Sign out is available.

Confusing:

- Daily check-in reminder and report notification rows are display-only, not editable.
- Dark mode toggles, but several V3 components use fixed light colors directly.
- Profile says “Your signal data is indexed to this ID — not your email or name,” while the database stores user email in the users table.

## 11. Current Backend/Supabase/Local Storage Logic

Supabase tables currently include:

- `users`
- `cycles`
- `questions`
- `options`
- `responses`
- `theme_scores`
- `reports`
- `push_tokens`
- `alignment_scores`
- `question_history`
- `translations`
- `trial_tracking`
- `weekly_signals`
- `unlock_events`
- `alignment_identity_vectors`
- `user_state`
- `subscriptions`

Primary data flow:

1. Auth session persists locally.
2. User row and active cycle define current app state.
3. Question is selected from Supabase question bank.
4. Response is stored with option and optional journal text.
5. Backend computes rolling alignment and theme scores.
6. Backend updates user state, mirror text, weekly signal, unlocks, and reports.
7. Frontend reads derived state for Today, Signals, Reports, and Profile.

Local/device storage:

- Supabase session: localStorage on web, SecureStore on native.
- Language: AsyncStorage key `mirar_language`.
- Theme preference: AsyncStorage key `mirar_theme`.

Push:

- Native push token registration after auth.
- `daily-reminder` sends Expo push to users who have not completed today.
- No WhatsApp integration is present in current code.

AI:

- AI is currently used for daily mirror insight and weekly signal generation through Anthropic Haiku.
- Report generation may be deterministic/edge-function based depending on the function path.

## 12. Current Missed-Day/Date Logic

Current day:

- `getCycleDay(cycleStartDate)` computes days since cycle start and clamps between 1 and 28.
- There is no explicit missed-day recovery screen.
- There is no visible catch-up/backfill flow.

Completion:

- A day is considered complete if a `responses` row exists for `user_id + cycle_id + day_number`.
- One response per user/cycle/day is enforced with a unique constraint.
- Re-submission uses upsert behavior.

Streak:

- Client `computeStreak` counts consecutive `day_number` responses backward from current day. If today is missing, streak is 0.
- Server `sync-user-state` computes streak by submitted dates and allows the active streak to include today or yesterday.
- This means client and server streak logic can diverge in edge cases.

Reminders:

- `daily-reminder` checks active cycles, computes current day, skips users who already completed that day, and sends Expo push to registered tokens.

Reports:

- Stage reports are triggered from `process-checkin` on day 8, 15, 22, and 29.
- Since current day is clamped at 28 in client logic, day 29 may require backend/scheduled handling to reliably produce the final stage report.

## 13. What Currently Works Well

- The app preserves the validated core: one daily prompt with structured MCQ options.
- Magic-link sign-in is low friction.
- Onboarding is already close to the requested 3-screen product promise.
- Multilingual support exists and is integrated into key flows.
- The check-in flow supports both simple MCQ and optional private note.
- Immediate post-check-in reflection exists.
- Pattern layers exist: alignment history, weekly signal, theme status, reports.
- Supabase schema is rich enough for V2 without rebuilding from scratch.
- Rule-based adaptive question selection exists.
- Reports and signal summaries are already modeled and rendered.
- Mirar ID/privacy concept is already surfaced.

## 14. What Feels Confusing or Unclear for a User

- The product still exposes too much internal structure: Day 1/28, Chapter, stages, theme codes, HIGH/MID/LOW, averages, calibration checks.
- “Mirror” means both the Reports tab and the immediate post-check-in reflection.
- Numeric alignment scoring can feel evaluative, not purely reflective.
- Some visible copy says “2–3 minutes,” while the newer direction says less than 2 minutes.
- The landing page still feels like a product explanation/program in places.
- Reports are “Building…” without a clear simple expectation.
- Reminder settings appear but are not configurable.
- Dark mode exists but is not consistently applied.
- Some AI/backend copy still uses older corporate theme names internally and may leak through generated text.
- Language support is partial because many components use hardcoded English.

## 15. Features That Must Be Preserved

- Existing app structure and signed-in experience.
- Supabase Auth magic-link login.
- Mirar ID concept.
- Multilingual support for English, Hindi, and Gujarati.
- Language picker on login/onboarding/profile.
- Existing users, cycles, responses, reports, signals, and profile data.
- Daily MCQ check-in.
- Optional private journal/note field.
- Immediate post-answer mirror/reflection.
- Reports tab and report detail pages.
- Signals tab and pattern/history layer.
- Profile settings, sign out, and journal archive.
- Supabase data model and RLS assumptions.
- Rule-based adaptive question selection.
- Existing Vercel deployment flow.
- Push notification infrastructure.

## Recommended Next Step

The safest next improvement step is a **language and visibility pass only**: keep all current routes, data models, auth, reports, multilingual support, and check-in logic intact, but reduce visible backend terminology in the user interface.

Specifically, update copy and labels so the app feels like a daily mirror while preserving every existing feature:

- Hide or soften theme codes, HIGH/MID/LOW badges, averages, and calibration language.
- Keep reports/signals/profile accessible, but make them feel lighter.
- Keep the 3-screen onboarding.
- Do not alter date/missed-day logic, Supabase schema, or routing until after this language pass is verified.
