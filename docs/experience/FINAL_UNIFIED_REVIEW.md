# Final unified Aperture review — 14 October 2026

Reviewed Claude’s exact immutable app deployment at `988bc0bf9ae56375f4ee7285c01beeaaf3008c0b`, not the earlier PR #3 review. Vercel metadata verifies the stable alias resolves to the same READY preview deployment (`dpl_4zJQfLSpMuzk2XKapQfkNaxYb9Rv`). Documentation base: `eedcab1` on `mirar-unified-final`.

App: https://mirar-1do6dsr5q-sahilaharia-designs-projects.vercel.app

Paired landing: https://mirar-landing-82cay8e4b-sahilaharia-designs-projects.vercel.app (the existing landing preview, separate commit `e9255dd`). Its sample CTA reached the reconciled stable app. Demo auth bypasses real registration; this is visual/navigation continuity, not real-auth approval.

## Recommendation

Keep the reconciled Aperture direction. It is coherent and ready to finish with two targeted corrections below. No new creative direction or broader redesign is warranted. Full UX approval remains conditional on the mobile patch and Claude’s remaining mixed-unknown copy correction.

The canonical mark, Instrument Serif/DM Sans, reflective planes and warm paper/charcoal hierarchy make the landing and app a recognizable shared world. Look Again genuinely operates on an observation and a revisable reading: the event remains distinct, less-charitable alternatives are allowed, and “More certain” is not corrected or celebrated. Attend’s four selectable places expose the constraint and the actual placements; the second Attend-now tile is disabled with the exact reason, without silently moving anything. Completion states what was practised, what was chosen and what is unknown. The Mirror keeps engine and pilot sources distinct and is credible when sparse. These operations provide a reason to return; actual repeat usefulness still requires human testing.

The visual rhythm is restrained but has variation: the landing’s charcoal spread, paper reading planes, attention field, serif prompts and collapsed source/retention disclosures perform different jobs. There were no merge-specific artwork, typography, motion, layout-clipping or keyboard regressions requiring another design pass. Reduced motion works; selection and focus remain understandable without animation.

## P2 — Mobile Today hides the reason to begin (frontend patch supplied)

**Observed at 320×568:** the initial viewport shows the wordmark, date, greeting and Begin, but no actual exercise prompt. At 390×844 the prompt arrives below the artwork and is partly below the navigation boundary. There is too much introductory composition before the useful invitation.

**Patch:** `components/inner-rep/v2/DailyExperience.tsx`, source commit `1342e8b`, branch `codex/mirar-final-mobile-review` based on `eedcab1`. Under 768px, the runtime’s actual next prompt becomes the main heading; greeting becomes secondary; the generic first-visit invitation and duplicate prompt are omitted. Canonical artwork, real duration/capacity metadata, returning/resume cues and optional offers remain. Wide desktop composition is unchanged. Stacked columns use intrinsic heights, preventing the taller mobile prompt from overlapping the following paper panel.

No payload, flow, callbacks, selection, auth, persistence, engine or pilot runtime changed. The prompt comes from the same existing read-only `nextStep(context, answers)` call.

**Measured:** default first-visit prompt and Begin are fully above navigation at both mobile sizes. At 320, prompt ends at 335px and Begin at 409px, navigation starts at 503px. At 390, prompt ends at 300px and Begin at 374px, navigation starts at 779px. Tablet/desktop retain the greeting hierarchy and one copy of the prompt. This is measured for the actual default prompt; unusually long prompts can naturally require scrolling.

[Before 320](final-unified-review/screenshots/today-before-320.png) · [After 320](final-unified-review/screenshots/today-after-320.png) · [Before 390](final-unified-review/screenshots/today-before-390.png) · [After 390](final-unified-review/screenshots/today-after-390.png)

## P1 — A mixed unknown still becomes a deliberate no-focus choice (Claude runtime owner)

**Verified on the hosted build in both receipt and Mirror.** Attend → choose A work task + A need to rest → Leave it open for work → I don’t know for rest → Settled.

The record correctly contains `work=leave_open`, `rest=unknown`, `attendNow=null`. Both surfaces nevertheless say: “You chose not to give any one of them your attention first.” The person left one placement uncertain; the absence of an Attend-now answer is not an explicit choice to keep all attention free.

**Exact path:** `lib/innerRep/pilots/attend.ts:131`, `attendValue()`’s no-attend statement in `established`. The current gate permits any mixture containing at least one known disposition: `by('unknown').length < f.dispositions.length`.

**Suggested owner fix:** require all named pulls to have known dispositions before asserting a deliberate no-Attend-now arrangement; tighten the unknown guard to `by('unknown').length === 0` while retaining the existing full-placement check and no-attend branch. Continue showing each recorded known placement and the existing unknown wording. Add a mixed known/unknown regression through `pilotReceipt` and `buildPilotMirror`; retain the all-known/no-now result and the all-unknown result. No selection/evidence/schema change is needed.

Codex has not edited this runtime path or added a presentation workaround that would diverge from the shared read model.

[Receipt evidence](final-unified-review/screenshots/mixed-unknown-receipt.png) · [Mirror evidence](final-unified-review/screenshots/mixed-unknown-mirror.png)

## Four copy corrections reviewed

1. Look Again’s unperformed camera/weight claims are corrected in the real-session suite; hosted early-left presentation does not claim an unperformed rating.
2. Attend’s partial/all-unknown operation summaries are corrected and hosted partial receipts are truthful. The mixed-unknown deliberate-no-focus sentence above remains an uncovered case of the same finding.
3. Hard-to-tell is retained as hard-to-tell in the corrected runtime, distinct from nothing-pulling. Both hosted completion paths remain distinct and legitimate.
4. Populated now depends on an actual eligible comparison. A hosted 1 Look Again + 2 Attend result retains the sparse notice with per-family counts, without inventing a comparison. Populated fixture history and exact provenance are displayed separately from engine facts.

## Validation and limits

All five sizes: 320×568, 390×844, 768×1024, 1024×768, 1440×900.

- Exact hosted app: 32 core route/receipt/reload axe audits + 31 additional Look Again, partial/unknown, sparse/populated Mirror and keyboard/hold audits. Zero violations and zero incomplete findings; no overflow or targets under 44px. The mixed-unknown semantic defect is recorded separately.
- Paired landing: all nine sample paths at all five sizes, reversible/unknown readings, exits, disclosure, keyboard and reduced motion; 51 clean axe audits. CTA reached the stable app. No participant data or real emails.
- Local frontend patch: 32 clean app-route audits across the five sizes, actual device-local reload with no stored words, engine-domain isolation and keyboard/reduced-motion Begin → actual daily rep → unknown completion → Back to Today (one additional clean audit). TypeScript and clean Expo export pass. This patch has not been deployed to another public review URL.
- Claude’s current pilot runtime suite passes, including the new four-finding regression checks and mutation guards. No protected runtime/auth/persistence path was changed by the patch.

Raw results and representative screenshots are in `final-unified-review/`; provenance identifies each source/deployment. All exercise data is scripted demo/fixture data. Human usefulness/comprehension, real registration/returning auth, physical mobile devices/native screen readers, Devanagari/Gujarati production typography and clinical safety/legal/security release gates are not approved by this review. Existing release-owner gates remain unchanged.

Claude: incorporate the single-file frontend commit and repair the one runtime-owned sentence before declaring the final integrated UX approved. The main visual direction is settled; this is a finish checklist, not another exploration or parallel integration.
