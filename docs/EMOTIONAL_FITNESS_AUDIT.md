# Mirar → Emotional Fitness: Technical + Product Audit

Branch: `mirar-emotional-fitness` (from `main` @ 6d82cbc/b9b891e). `main` stays the
untouched production line. Nothing in this audit is destructive.

## A. Current system map
- **Stack:** Expo / React Native (+ react-native-web), expo-router, Zustand stores,
  i18next (en/hi/gu), Supabase (Postgres + RLS + Edge Functions, Deno), Vercel
  (web export). Landing site is a separate Next.js repo (`mirar-landing`).
- **Routing / auth:** `app/_layout.tsx` guard. Magic-link email auth (Supabase).
  Public routes: `(auth)`, `assess/*` (5-step quiz), `try` (5-second try-first),
  `(onboarding)`. Authed: `(tabs)` = Today / Trends / Weekly / Me.
- **Data (Postgres):** `users, cycles, responses, questions, options, theme_scores,
  alignment_scores, reports, user_state, weekly_signals, unlock_events,
  question_history, structured_signals, alignment_identity_vectors,
  onboarding_assessments, welcome_reflections, push_tokens, subscriptions,
  trial_tracking`. Content tables (`questions/options`) are shared, RLS read-only.
- **Check-in:** 6 curated theme questions (adaptive selection in
  `select-daily-question`; AI-generated personalised questions once an identity
  vector exists) → one option per day → `process-checkin` (scores, alignment
  score, mirror text, report triggers). Client this-or-that UI maps to options
  by points (`lib/everyday.ts`).
- **Scoring:** option → 1–2 themes × Low/Med/High → points → theme status
  (Under Load…Aligned) + 0–100 alignment score; client-side "week number" and
  "bounce-back" (`lib/everyday.ts`) on top.
- **Time model:** `cycles` (28-response cycles; rolls over at 28 completed
  check-ins), `responses.day_number` CHECK 1–28, stages of 7. Day number is
  completion-count-based (fixed after a real lockout bug); same-day gate is
  calendar-based (`hasCheckedInToday`).
- **AI:** Edge Functions call Anthropic: `generate-mirror-insight`,
  `generate-report`, `generate-weekly-signal`, question generation inside
  `select-daily-question`. Rule-based pattern engine client-side
  (`lib/patterns.ts`, `lib/milestones.ts`).
- **History/Reports:** Trends (themes, patterns), Weekly (stage reports),
  unlock-based Milestone card.
- **Notifications:** `daily-reminder` (Expo push; cron currently 08:00 UTC =
  1:30pm IST, wording old); `email-nudge` + `whatsapp-nudge` built, switched off.
- **Analytics:** none in the app. Only the landing has GA4; `admin-analytics`
  is server-side aggregation.
- **Safety:** **none.** No crisis detection, no helplines, no escalation path.
  Only "not therapy" copy. (Spec says "preserve existing safety" — there is
  nothing to preserve; this must be built, and before free-text is collected.)
- **Design system:** tokens in `lib/constants.ts` + `contexts/theme-context`;
  Reanimated motion in `lib/animations.ts`.
- **Deploy:** Vercel web (`mirar-app`, landing separate). Supabase changes are
  applied manually by the founder (no CLI/token in the agent environment).

## B. Keep (unchanged)
Auth + guard, Supabase client/RLS patterns, i18n scaffold, theme/design tokens,
`withTimeout`, `hasCheckedInToday`/`computeStreak` (calendar logic), the
completion-count lesson, edge-function infra and deploy scripts, landing repo,
`responses`/`options`/`questions` tables (legacy data must stay readable),
Profile, onboarding wizard shell, the email/WhatsApp nudge code (parked).

## C. Refactor (adapt)
- `lib/everyday.ts` → keep as a derived-signal helper (internal), stop surfacing
  as the product headline.
- `lib/patterns.ts` / `lib/milestones.ts` → source of evidence-typed insights
  (observation/pattern/contradiction/unknown) instead of status words.
- `stores/cycle-store.ts` → decouple "today" from cycles; keep for legacy reads.
- Six themes → "capacities" taxonomy (internal codes kept: IAP/EWB/FAF/RC/GAL/RA;
  user-facing: Direction/Energy/Focus/Relationships/Growth/Action).
- Trends / Weekly tabs → become History + Capacities views (later phases).

## D. Remove / deprioritise (conflicts with the new direction)
- **Alignment score / week number as the home headline** (spec §19). I built this
  *last week at the founder's request* — see "Decisions" below.
- **28-day cycle framing** (`cycles`, `day_number` 1–28, stages, "Week 1–4",
  cycle rollover, stage reports) — keep tables for legacy; stop using for new flow.
- Streak-adjacent "13 days in a row" → "N days of practice this month".
- Status vocabulary (Under Load / Aligned…) and the AI prompts that emit it.
- "Five seconds" promise on landing/app copy (spec: 30s–2min of real work).

## E. Data migration
- **Additive only.** New tables; old tables untouched and still readable.
- New: `inner_rep_responses` (migration 017). Existing `responses` stay as the
  legacy record; History later unions both.
- Existing users: no backfill needed for slice 1; engine treats them as
  "no rep history" (cold start) but may use legacy theme coverage as a weak hint
  later. No deletion, no rewrite. Rollback = switch `main`.
- Risk: users on the branch stop generating `responses` (legacy score stops
  updating). Acceptable only because branch ≠ production until promoted.

## F. Proposed architecture
```
lib/innerRep/catalog.ts   typed Exercise catalog (spec §10 schema) — versioned in code
lib/innerRep/engine.ts    selectExercise(history, context) — pure, unit-tested
lib/innerRep/evidence.ts  Truth Architecture: observation/pattern/contradiction/unknown
lib/innerRep/safety.ts    crisis-language check on any free text (+ resources)
stores/inner-rep-store.ts load history, pick today's rep, save response/feedback
components/inner-rep/*    renderers per interaction type (choice, compare, words…)
app/inner-rep.tsx         the rep flow; Home shows one card + continuity cue
supabase/migrations/017   inner_rep_responses (+ insight feedback)
```
Catalog in code (not DB) for now: fast to iterate, reviewable in git, no SQL
step to ship content. Move to DB when content volume/ops need it.
Honest Mirror v1 = rule-based evidence (counts over history) with a feedback
tap; LLM-phrased insights only after the evidence model is trustworthy.

## G. Phases (as in spec §38; slice 1 = P2+P3+thin P4)
1. Audit (this doc) · 2. Taxonomy+engine · 3. Daily Inner Rep flow ·
4. Evidence/Honest Mirror foundations · 5. Longitudinal context/follow-ups ·
6. History rebuild · 7. Capacities view · 8. Website · 9. Migration/QA/analytics.

## H. Risks
- **Technical:** two data models during transition; no app analytics to judge
  the change; Supabase changes need the founder to run SQL; branch/prod drift.
- **UX:** richer reps (words, reorder) are *more* effortful than the this-or-that
  the founder asked to simplify last week — retention may drop at day 1–10
  (industry median 30-day retention ≈ 3%). Needs measuring, not assuming.
- **Bias:** exercise ordering and wording can steer; "challenge" prompts can
  feel like judgement. Mitigate: "I don't know" always present, no scoring of
  answers, disagreement stored.
- **Inference:** small-N pattern claims. Rule: no pattern language below
  explicit evidence thresholds; the engine must prefer "no pattern yet."
- **Migration:** legacy users lose continuity of the old score; mitigated by
  additive tables + branch isolation.
- **Safety (highest):** free-text exercises + no crisis path = unacceptable.
  Slice 1 ships `safety.ts` first. Needs founder/clinical review of wording and
  the helpline list before production.

## Decisions needed from the founder (flagged, not assumed)
1. This spec **reverses** the home-screen number, the bounce-back score line, and
   the "five seconds" positioning that were built/shipped on `main` days ago.
   The branch removes them from Home; `main` keeps them until you choose.
2. Richer reps vs. "simpler" — see UX risk. Slice 1 keeps most reps ≤ 45s and
   leads with choice-based reps; free-text reps are optional and skippable.
3. Safety wording/helplines need your (or a clinician's) sign-off before launch.
