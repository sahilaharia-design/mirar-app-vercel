# Mirar — Full Rebuild Brief

**For**: the AI/tool doing the from-scratch rebuild ("Astra")
**From**: a long Claude Code session that built, debugged, and shipped
several rounds of changes to the current live app — this brief distills
everything worth carrying forward from that work into the new build.
**Status of the current app**: live at mirar-app.vercel.app, with real
users and real historical data. The current codebase is tagged
`pre-astra-rebuild` in git as a rollback point and will stay live and
untouched throughout this rebuild — nothing about this brief requires
taking the current app down.

---

## 1. Product identity

Mirar is a continuous internal alignment system — think **WHOOP, but for
your inner state instead of your body**. WHOOP never stops reading your
biometrics; Mirar never stops reading your internal signals.

It is **daily emotional hygiene** — as routine and non-negotiable as
brushing your teeth. Not a 28-day program you complete, not a challenge
with an end date, not something you "finish." Something you do every
single day because your internal state shifts every single day, the same
way your teeth need brushing every single day regardless of how clean
they were yesterday.

**The brushing-teeth analogy is the actual design language for this
rebuild, not just a tagline.** Take it literally into the visual and
interaction system:
- A daily action that takes 2-3 minutes, feels routine rather than
  effortful, and has a clear, satisfying "done" state each time (the way
  a clean mouth feels different from a dirty one).
- A visual sense of **built-up "residue" that gets cleared** by showing
  up — not guilt-based (missing a day doesn't mean something is now
  "dirty" or "broken"), but a satisfying moment of clarity/freshness each
  time the user completes today's signal.
- The payoff is cumulative and physical-feeling: "emotional fitness"
  that visibly strengthens over weeks of consistent small check-ins,
  the same way physical fitness does, not a score you're chasing but a
  state you're building.

**The core question the whole product exists to answer**: *"Am I still
aligned with who I actually am, or have I been making decisions from an
outdated version of myself?"*

**What Mirar explicitly is NOT** (preserve this positioning — it's the
thing that differentiates the product):
- Not a 28-day program or challenge
- Not a journaling app
- Not a meditation or mindfulness app
- Not therapy, coaching, or self-help
- Not a productivity optimizer
- Not something you complete
- Not static like a personality test (Myers-Briggs, Enneagram) — it
  updates continuously
- Not reactive like therapy (you go when something breaks) — it's
  present every day, catching drift before it becomes a crisis
- Not dependent on another human like coaching

**The six themes it reads continuously** (not in stages — these are the
six vital signs of the "emotional fitness" metaphor):

| Code | Theme | What it tracks |
|---|---|---|
| IAP | Direction (Inner Alignment & Purpose) | What feels true, chosen, and internally clear |
| EWB | Energy (Energy & Well-being) | Capacity, heaviness, steadiness, recovery |
| FAF | Attention (Focus & Flow) | Where the mind keeps returning |
| RC | Connection (Relational Capital) | How honest and spacious relationships feel |
| GAL | Growth (Growth & Learning) | Openness, change, what's becoming visible |
| RA | Movement (Resilience & Action) | Small steps, hesitation, follow-through |

**The AI Mirror layer**: after each daily check-in, an AI reflects back a
short synthesis — not advice, not coaching, just a mirror: *"Here is
what your signals showed today."* It tracks drift across days and
surfaces patterns the user can't see themselves ("If your energy has
been dropping for 6 days, Mirar notices before you do"). Language
register throughout the product: **signal, alignment, drift, calibration,
check-in, internal state, notice, holding, shifting** — never *heal,
healing, journal, journaling, therapy, motivational, should, fix,
improve, coach, advise*.

Design principles to carry forward: soft dark mode with warm undertones,
mirror/water/light visual metaphors, calm and generous whitespace,
poetic but not heavy, calm but not cold.

---

## 2. The retention goal — stated precisely

The brief that produced this document was explicit: **not** "get the
user to open the app every 2-4 minutes." The actual goal is —

> How does the user come back every day, spend 2-3 minutes, and
> genuinely develop (and feel themselves developing) emotional fitness
> over time?

Design and measure against **daily-return consistency and felt
improvement**, not raw session frequency or time-in-app. A user who
opens Mirar once a day, every day, for a satisfying 2-3 minutes, and
feels their emotional fitness visibly building — that's the win
condition. A user compulsively reopening the app many times a day is not
the goal and would actually work against the brushing-teeth framing
(nobody brushes their teeth every few minutes).

---

## 3. The gamification synthesis — "a mix of both"

Directly resolving the brief: not literal competitive gamification
(leaderboards, social comparison, points-as-currency), but real gamified
**feel** through a personal-fitness visual language. Think **Apple
Fitness rings, not Duolingo leaderboards.**

Build toward:

- **Six theme rings** (or an equivalent unified visual), one per theme,
  filling based on recent signal strength — a literal "emotional fitness
  dashboard" the user watches build over time, entirely personal, never
  compared to anyone else.
- **Streak, reframed as consistency, not competition.** The current app
  already made this exact framing shift mid-session — see §5's language
  note. Carry it forward: the visual/copy language should read as *"you
  showed up"*, not *"don't break your streak"* — no loss-aversion
  pressure, no guilt state for a missed day. A missed day should be
  recoverable and gentle in the new visual system, not punished.
- **Milestone-style rewards that are earned reflections, not badges.**
  The current app has a shipped feature called Milestone Reflections
  worth preserving conceptually: at real usage thresholds (first few
  check-ins, a week in, a full month, etc.), the app surfaces a short,
  data-grounded retrospective about the user's *own* signal history
  ("your Energy has moved from Under Load to Stabilizing since you
  started") — not an icon, not "Achievement Unlocked," a genuine
  moment of the mirror showing you something true about yourself. This
  is the version of "reward" that fits the product; a trophy case does
  not.
- **The brushing-teeth completion moment** as the core daily "gamified"
  beat: a satisfying, almost physical sense of clearing/freshness when
  today's check-in is done — this is the dopamine moment to design for,
  not a score going up.
- **Explicitly out of scope**: leaderboards, social comparison, points
  redeemable for anything, competitive streaks, badges-as-status,
  push notifications that guilt ("you're about to lose your streak!").
  These are the exact patterns that make people distrust and delete
  wellness apps, and they contradict the product's own differentiation
  from journaling/gamified competitors.

---

## 4. Functional requirements (technology-agnostic)

State these as *what the product must do*, not how the current app
happens to do it — Astra should feel free to rebuild the how entirely.

1. **One daily signal input.** A single low-friction interaction per
   day that captures where the user is on one theme, on a low↔high
   spectrum. (The current app arrived at a drag-slider gesture after
   iterating away from a 5-option multiple-choice list — the lesson
   there, see §5, is about *friction*, not about the slider specifically
   being sacred.)
2. **Six-theme scoring engine.** Every answer maps to signal on 1-2
   themes, at a Low/Medium/High intensity, accumulating into a
   continuous alignment score and per-theme status (see §6 for the exact
   current formulas, offered as a reusable starting point).
3. **Adaptive question selection.** Not every user sees the same
   question source forever — the engine should prefer content that fills
   gaps in a user's recent theme coverage, adapts depth/gentleness based
   on whether a theme is currently "Under Load," and can transition a
   user from a small curated set of questions toward increasingly
   personalized ones as their history deepens.
4. **AI Mirror reflection.** After each check-in, a short AI-generated
   synthesis of that specific answer plus what it means in the context
   of recent history — signal, not advice.
5. **Pattern/drift detection.** Recurring signals across the last N
   check-ins get surfaced as gentle awareness ("this keeps showing up"),
   and a sustained decline in one theme triggers a soft alert before it
   becomes a crisis.
6. **Milestone reflections.** Real usage thresholds trigger a one-time,
   data-grounded retrospective (see §3).
7. **Multi-language.** English, Hindi, Gujarati at minimum — full parity,
   not just UI chrome; check-in questions, AI reflections, and app copy
   all need translation paths.
8. **Historical trend review.** A way to see theme trends over time
   (weekly/monthly), and a periodic (roughly every ~7 real check-ins)
   written reflection/report summarizing what's shown up.
9. **Frictionless auth.** Passwordless (magic-link style) sign-in — no
   password to remember, consistent with "no passwords, no tracking,
   your signal belongs to you" as a stated trust promise.
10. **Privacy-first framing throughout** — this is a trust-sensitive,
    mental-health-adjacent product; privacy language should be visible
    and genuine, not just a settings-page checkbox.

---

## 5. Non-negotiable lessons from this session — read before writing any data model

These are real production incidents this session found and fixed, each
with real user impact. A ground-up rebuild is exactly the kind of change
likely to reintroduce them if this isn't read first.

1. **Day/session numbering must derive from completed-response COUNT,
   never from calendar-elapsed time.** The original incident: the app
   computed "day number" from calendar days since a user's start date,
   capped at a maximum (28). Since progress is gated on actual
   completions, not calendar time, any user who fell behind (missed
   days — which is normal, expected behavior for a daily habit product)
   had their day-number permanently stuck at the cap, colliding with the
   same historical record forever. This is a **class of bug**, not a
   one-off: anywhere "which session/day is this" is computed, it must be
   `(number of things the user has actually completed) + 1`, never
   `(calendar time elapsed)`. Confirmed live via a real, frustrated user
   report before being fixed.
2. **"Already done today" is a separate, calendar-date question,
   entirely decoupled from the session-count logic above.** Don't let
   one system try to answer both "how many have you done" and "did you
   already do one today" — they're genuinely different questions
   (count vs. calendar) and conflating them was the direct cause of #1.
3. **Streaks/consistency must be computed off actual submission
   timestamps (calendar dates), never off an internal sequence
   counter.** Same root cause as #1 — a sequence-based streak silently
   stops meaning "consecutive calendar days" once the sequence is
   decoupled from calendar time.
4. **Any migration/bulk-update touching an ordinal or positional column
   must be checked against every constraint on that column — not just
   the one that seems relevant.** A real live failure this session came
   from satisfying a uniqueness constraint while missing a value-range
   CHECK constraint on the same column, mid-migration, on production
   data. Read the full constraint set before writing bulk SQL, every
   time.
5. **Content/question lookups must never assume a "day number" (or any
   single field) uniquely identifies one row, once any personalization
   or content rotation exists.** A real live failure this session came
   from a lookup written before per-user generated content existed,
   which broke the moment that feature (correctly) started inserting
   rows that shared a "day number" with a shared/curated row. Scope
   every such lookup explicitly (e.g. "the shared curated row" vs. "this
   user's private row"), don't rely on a field being unique unless a
   real database constraint actually guarantees it.
6. **Prefer smaller, mechanical, idempotent migrations over large
   hand-authored ones.** The most reliable fixes this session were the
   ones computed live from the data itself (e.g. "rank these rows by an
   existing numeric column") rather than ones built from a static
   snapshot matched by exact text — the latter silently drifts from
   reality and fails in confusing ways.
7. **RLS (row-level security) should default to "owner can read/write
   their own rows only,"** with narrow, explicit exceptions for shared
   reference content (like a curated question bank, readable by any
   authenticated user but writable only by migrations/service role).
   Never trust the client to enforce data isolation on its own.

---

## 6. Reference: current scoring model (reusable starting point, not a mandate)

Preserve the underlying *logic* even if the implementation is rebuilt
from scratch — this is genuinely tuned IP, not incidental code:

- Each answer option carries **1-2 theme codes**, each at a **Low /
  Medium / High** level, each worth **1 / 2 / 3 points** respectively.
- **Theme status** derives from the rolling average of points for that
  theme: below 1.5 → "Under Load", below 2.0 → "Stabilizing", below 2.5
  → "Forming", 2.5+ → "Aligned". A theme with zero recent signal reads
  as "No Reading" rather than a false zero.
- **Overall alignment score** (0-100): average of all recent theme
  points, normalized from the 1.0-3.0 raw range, requires at least 3
  data points before showing a real number (shows "Calibrating" before
  that — never fabricate a score from insufficient data).
- **Streak** (consistency count): count backward from today (or
  yesterday, if today isn't done yet) through consecutive calendar dates
  with at least one submission — see §5.3, this must stay calendar-based.
- **Pattern detection**: compare an early window of recent responses
  against a later window; when one theme's average shifts by a
  meaningful margin between the two windows, that's worth surfacing as
  "this theme has moved."
- **Adaptive question selection**: score each theme by how
  under-represented it's been in the user's recent answers, boost gentle
  (low-depth) content for any theme currently "Under Load" rather than
  probing it harder, and increase question depth/complexity ceiling once
  a user has several consecutive well-aligned themes (signal of
  readiness for deeper reflection).

---

## 7. Screen inventory (functional description, not visual spec — Astra should reimagine the visuals freely)

- **Sign-in**: passwordless, email magic-link. Copy emphasizes "no
  passwords, no tracking, your signal belongs to you."
- **Onboarding**: what Mirar is, how the daily check-in works, the
  privacy promise — 2-3 short screens.
- **Home ("Today")**: greeting, consistency indicator, the day's signal
  action (prominent, single primary CTA), a rolling "what's been showing
  up" awareness summary once enough history exists, occasional gentle
  milestone/pattern cards below the primary action (never competing with
  it for attention), a dev-only day simulator for testing.
- **Daily check-in flow**: a brief calming pause screen before the
  question (tap-anywhere to continue, no timer), the question itself
  with the low-friction signal input, an optional private note step
  (skippable, never required), then the submit.
- **AI Mirror reflection**: shown immediately after submitting — the
  echoed answer, the alignment score with delta from before, the AI's
  short synthesis, a light preview of what tomorrow might explore.
- **Signals tab**: recent-pattern summary ("what repeats / what's
  changing / what's building / what's holding"), a rolling coverage
  indicator, and a per-theme breakdown (status badge + recent signal
  count + trend direction) for all six themes.
- **Reports/Mirror tab**: a list of periodic written reflections (one
  roughly every ~7 check-ins, plus a longer synthesis at bigger
  milestones), each showing completion status and, once ready, a
  detail view with what kept showing up, the strongest signal, and a
  short interpretive note.
- **Profile**: a privacy-preserving user ID (not email, shown in
  analytics/exports), practice stats (since when, days practiced,
  current pattern stage), language switcher, a short in-app guide
  ("how Mirar works" — FAQ-style), theme (light/dark) setting, private
  note history.

---

## 8. Data & continuity — a decision for Sahil, not assumed here

The current app has **real accounts with real historical data**,
including weeks of the founder's own daily check-ins. Before Astra's
rebuild goes live, decide explicitly between:

1. **Migrate** existing historical data into the new system (requires
   Astra's new schema to have an import path from the current Postgres
   schema — see `supabase/migrations/*.sql` in the current repo for the
   exact current shape).
2. **Archive** the current data as a reference/export only; new accounts
   in the rebuilt app start fresh, old data preserved outside the live
   system for reference.
3. **Clean reset** — accept starting over with no data migration.

This is intentionally left as an open decision rather than defaulted,
because it's irreversible once acted on and only Sahil can weigh what
his own historical signal data is worth keeping.

---

## 9. Logistics

- The current production app (mirar-app.vercel.app) **stays live and
  untouched** throughout the rebuild — this brief and the rebuild it
  kicks off do not require taking anything down.
- The current codebase is tagged `pre-astra-rebuild` in git
  (commit `9c61714`) as an explicit, permanent rollback point.
- Astra's rebuild should happen in a **separate location** — a new
  repo, or a clearly separated branch — never developed in place against
  the current production branch, so there's never a window where the
  live app is broken mid-rebuild.
- Reference materials available in the current repo for Astra to read
  (not required to reuse): `CLAUDE.md` (canonical brand doc — the
  source for most of §1 above), `supabase/migrations/*.sql` (current
  schema, 12 migrations), `supabase/functions/*` (current edge
  functions: `select-daily-question`, `process-checkin`, `check-unlocks`,
  `generate-report`, `generate-weekly-signal`, `generate-mirror-insight`,
  `sync-user-state`, `update-identity-vector`, `compute-stage-scores`,
  `daily-reminder`, `trial-lifecycle`, `send-notification`,
  `admin-analytics`, `admin-user-list`), `lib/scoring.ts` and
  `lib/patterns.ts` (current scoring/pattern-detection logic, matching
  §6 above), `locales/{en,hi,gu}.ts` (current translation structure).
