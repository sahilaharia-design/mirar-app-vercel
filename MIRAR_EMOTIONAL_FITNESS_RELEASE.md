# MIRAR — Emotional Fitness Release

Date: 2026-06-12 · Commits: `bb6ec9d`, `64c5058` · Live: mirar-app.vercel.app

## What shipped

### Core transformation
Question → Reflection → Report has become Reflection → Signals → Patterns → Awareness.

### Signal Engine
- `lib/patterns.ts` — extracts two structured theme signals per reflection from existing response data.
- `supabase/migrations/006_signal_engine.sql` — durable `structured_signals` table (RLS-protected); `process-checkin` persists per-theme signal rows on every check-in.

### Pattern Engine (`lib/patterns.ts`)
Client-side, runs on every cycle load, works in all languages (emits structured insights translated via i18n):
- Recurring tensions (what you're carrying)
- Week-over-week shifts up/down (what's changing)
- Growth (what's building) and steady strengths (what's holding)
- Overall tone: steady / mixed / under pressure / forming
- Single "attention" insight, priority: tension > downward shift > growth > strength
- Honest minimum: says nothing before 4 reflections.

### Dashboard (Today)
- New `AwarenessCard` answers: How am I doing? What am I carrying? What's changing? What deserves attention?
- All previously hardcoded English strings on the Today screen now translate (en/hi/gu).

### Signals tab
- New `PatternsPanel`: what repeats / what's changing / what's building / what's holding.

### Landing page (all 3 languages)
Narrative restructured: Problem (some days nothing is wrong…) → Insight (emotional fitness starts with emotional hygiene) → Solution (AI mirror: reflections → signals → patterns → awareness) → Benefits (understand yourself, recognize patterns, less overwhelm, clearer relationships, easier decisions) → CTA ("Start building emotional fitness").

### Onboarding (all 3 languages)
1. You take care of your body. What about your inner world?
2. Emotional hygiene: two minutes a day → signals and patterns.
3. A mirror, not a mentor — you return because you keep learning something true about yourself.

### AI Mirror contract (`generate-mirror-insight`)
- Functions: observe, reflect, identify patterns, generate awareness.
- Never: diagnose, prescribe, coach, motivate, advise, praise, warn.
- Prompt now includes a 7-reading trend line for pattern context.
- Output in the user's language (en/hi/gu).

### Retention approach
No streaks, badges, or gamification. The return loop is the awareness layer itself: each visit surfaces something learned (attention insight, shifts, patterns).

## Pending one command from Sahil
Backend pieces (migration 006, multilingual AI functions, day-1–8 translation seed) need:
```bash
export SUPABASE_ACCESS_TOKEN=<token>
bash scripts/deploy-supabase.sh
```

## Known gaps
- Question bank days 13–28 untranslated (hi/gu) — separate task queued.
- Report detail screen still uses the older section structure; backend `generate-report` is localized but its Signals/Patterns/Shifts/Growth/Awareness restructure is the next milestone.
- Some secondary screens (Signals tab guide copy, Reports tab headers, profile rows) retain hardcoded English.
