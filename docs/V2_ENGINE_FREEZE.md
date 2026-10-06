# Inner Rep v2 engine — freeze

**Engine version:** `v2.0.0-mvp` (`ENGINE_VERSION` in `lib/innerRep/v2/config.ts`). **Frozen** for the first integrated MVP, pending the Codex Daily Inner Rep implementation.

## What is frozen
- All values in `lib/innerRep/v2/config.ts` (snapshot: `scripts/sim/freeze.json`; the suite fails if they drift).
- Engine behaviour in `engine.ts`, `evidence.ts`, `insights.ts`, `state.ts`.
- The 23 templates in `templates.ts`.
- The UI contract (`contracts.ts`, `docs/V2_CONTRACTS.md`), unchanged since the Codex handoff apart from the documented orientation difference.

## What is not allowed without a reviewed decision
Tuning against synthetic simulations (they are my own models; further tuning would overfit them). A change needs: a stated defect or real-user evidence, an entry in `docs/V2_DECISIONS.md`, a version bump, and a deliberate `UPDATE_FREEZE=1` snapshot update.

## Verification at freeze
- Suite: `npx tsx scripts/sim/suite.ts` → 85/85 pass.
- Sweep: `npx tsx scripts/sim/sweep.ts` → 420 runs; one rule class still open (selection-bias-A tail, 1 of 20 seeds past day 17: day 18), unchanged by this work and not tuned.
- No migration exists. Nothing is deployed. The shipping app still runs the v1 flow.

## Next
Behavioural review of the integrated Codex Daily Inner Rep implementation against `docs/V2_CONTRACTS.md`: check that the UI renders `prompt` verbatim, never emits or expects orientation, treats "I don't know" and skips correctly, stores no raw text, never shows overdue/missed wording, never exposes internal terms, and that deferred commitments are not presented as a list.
