# Aperture frontend validation

12 October 2026. Local implementation/release candidate only. Production remains Claude-owned.

## Complete story checked

Discovery → actual sample → exact/unknown integration → simulated entry → short introduction → real runtime Today/rep → completion → public receipt reload → factual Mirror → return → account/privacy. Auth simulation is labelled; API delivery/Supabase and live production are not exercised by the review harness.

- Five sizes: **320×568, 390×844, 768×1024, 1024×768, 1440×900**.
- Main walkthrough: **133 records, 72 screenshots/geometry captures, 56 axe scans, zero reported violations, zero incomplete scans and zero horizontal overflow**. All visible controls checked ≥44px. This measures settled UI; a first contrast check during the approved entry fade caught an intermediate-opacity frame, so contrast checks now wait for the 400ms transition to settle.
- After adjusting the mobile hero to bring artwork into the opening, a focused five-size check repeated landing geometry/a11y: zero overflow, violations or incomplete checks (`final-landing.json`). Representative screenshots were replaced with the final composition.
- Seven additional boundary checks: exact future date accepted and commitment receipt preserved after runtime reload; structured follow-up resume; feedback failure does not claim success; correction retry; absent capacity label; optional-note Skip clears; standard/reduced motion preferences both verified (`extra-results.json`).
- Completion failure/retry checked separately (`completion-error-check.json`). No false success. Component fixtures have persistent fictional labels and do not attach an unrelated insight after unknown completion.
- All four feedback values and six reasons tested; “I'd rather not say” first-class; reason Skip ends; Something else note exact privacy copy and Continue/Skip clearing. Public study offers no live feedback buttons.
- Each geometry capture checks empty localStorage and no cross-origin resources. Review runtime stores synthetic structured state only in an in-memory Map. No account/email/service calls or analytics.
- Keyboard activation finishes unknown; reduced-motion media matched explicitly; no motion-only meaning. Screen-reader semantics checked through landmarks/headings/roles/labels/axe; **VoiceOver/TalkBack not run**. Native date setter is used for automation; **physical picker ergonomics unverified**.
- Runtime receipt suite: **7 checks**, 240 completed reps, 37 unknown, 15 commitments, zero missing receipts; reload equivalence and actual served prompts pass.
- Mirror contract suite: **9 checks**, 24 synthetic users / 430 statements, six directly rejected readings absent. This passing suite does **not** resolve the previously reproduced Partly/related-history eligibility problem. Archive release remains gated; no frontend algorithm masks it.
- Frozen engine **85/85**, correction **17/17**, runtime **18/18**, unchanged. Tests bundled to a temporary output tree so generated reports did not overwrite authoritative repository docs. No new 420-run sweep was performed; Claude's integration release gate owns rerunning it if required.
- TypeScript, standalone landing build, full review build and Expo web export pass. Existing review bundle >500kB warning and dependency use-client directives are recorded, not resolved through upgrades. Landing has its own smaller dependency graph; no review fixtures imported.
- Production build gate deliberately rejects unverified/missing CTA configuration. Official canonical/title/description/social metadata and assets exist locally; actual deployed social rendering remains a release test.
- Canonical assets verified: exact RGBA pixels after historical transparent-margin trimming; metadata mark copy byte-identical. `asset-verification.json` records provenance. No assets/tokens/engine/store changes after supplied input merge.

## Independent customer-experience review

| Moment | What the person can do / understand | Assessment and limit |
|---|---|---|
| Arrival | See Mirar's reflective opening; understand practice rather than score; try before registration | Graphic now reaches mobile opening. No promise of daily insight or day-based progression |
| Sample | Meet two offered truths or remain unsure | A real existing template; no new Reframe family is claimed |
| Introduction | Begin or go straight to Today without giving personal answers | Quiz removed; autonomy is an actual route, not a test of the right response |
| First completion | Read the chosen question/response; uncertainty ends without assignment | Clearer release; exact receipt remains grounding rather than proof of benefit |
| Return | Resume actual structured choices; see factual practice/carrying | No fictional yesterday line; missing continuity supplier remains absent |
| Correcting | See success or failure; qualify/reject without a damaged-person animation | Recorded event acknowledged; no instant rewritten insight or promised follow-up date |
| Mirror | Inspect facts and selected-response context, separately from unavailable reading history | Sparse facts useful; rich archive needs runtime repair, not more decorative cards |
| Exit/trust | Know local-retention and optional-word behavior, leave without obligation | Live legal wording still conflicts with v2 product behavior; qualified release review needed |

This is a product walkthrough by the implementer, not evidence of retention, emotional-fitness improvement or a five-person usability study. New exercise families remain product/engine proposals.

## Representative final screens

| Stage | Phone | Desktop |
|---|---|---|
| Landing | [390×844](aperture-validation/screenshots/landing-390.png) | [1440×900](aperture-validation/screenshots/landing-1440.png) |
| Entry | [Phone](aperture-validation/screenshots/entry-390.png) | [Desktop](aperture-validation/screenshots/entry-1440.png) |
| Introduction | [Phone](aperture-validation/screenshots/intro-390.png) | [Desktop](aperture-validation/screenshots/intro-1440.png) |
| Today | [Phone](aperture-validation/screenshots/today-390.png) | [Desktop](aperture-validation/screenshots/today-1440.png) |
| Mirror beginning | [Phone](aperture-validation/screenshots/mirror-390.png) | [Desktop](aperture-validation/screenshots/mirror-1440.png) |
| Privacy | [Phone](aperture-validation/screenshots/privacy-390.png) | [Desktop](aperture-validation/screenshots/privacy-1440.png) |

Other evidence: `first-rep.png`, `first-integration.png`, `done-reloaded.png`, `mirror-returning.png`, `commitment-created.png`, `commitment-reloaded.png`, `resume-followup.png`, `feedback-error.png`, `completion-error.png`, `date-picker.png`, `no-capacity.png`, six correction screens and motion screenshots.

## Reproduce

Start `npm run landing:dev` and `npm run visual:review`, then run `python3 scripts/frontend/verify-aperture.py` (set `AGENT_BROWSER_BIN` to the installed browser executable). Scenarios in `review/aperture-scenarios.json` are explicit synthetic dates from the actual runtime builder; regenerate using `scripts/runtime/scenarios.ts` for a later review date. Standalone/head/asset evidence does not replace configured staging/live auth tests.
