# Guided Attention — verification evidence

Frontend source `36da9f3c456119f4900ab3486ca64e064bd7f22d`, on `codex/mirar-everyday-practice-exploration`, draft PR #6. Earlier evidence in `../validation-study/` and `../validation/` is historical and preserved. [Before/after and runtime mapping](../GUIDED_ATTENTION.md).

## What passed

- Static build and isolated strict TypeScript pass (`build.log`, `types.log`). No claim of a green unrelated G3 product build.
- **129 axe audits, zero automated violations**: 119 comprehensive entry/practice/closing/exit path audits (`results.json`) plus 10 repeated-placement/support audits (`study-results.json`). Sizes: 320×568, 390×844, 768×1024, 1024×768, 1440×900. No horizontal overflow; enabled tested controls meet 44×44.
- Full keyboard-only completion of all three prototypes, emulated-touch Message path (`input-results.json`). Reduced motion tested. Native button pressed states, fieldsets, disclosures, meaningful disabled reasons and step-heading focus are retained.
- Five focused Attention journeys (`guided-results.json`) additionally assert: local choices never advance until Continue; no silent second foreground reassignment; Back discards an unsubmitted draft and actually revisits a permitted runtime step; changing the first frees the foreground; completed choices stay collapsed until relevant; hold does not advance on its own; keyboard ends hold voluntarily; one rearrangement only; exact set-aside options; none/unknown truthful closings; keyboard Back/hold/unknown/exit; exit from a hold and an unsubmitted selection never claims completion. Focused controls are within the viewport and uncovered by header/footer at all five sizes. The focused check caught and led to a fix for footer-obscured focus at 320px.
- Broad regression checks still cover all Message readings/comparisons/stances, coherent Reply drafts, all Attend dispositions and time options, partial/unknown, maximum five, hold/after/unknown and early exits. These use real UI selection plus explicit Continue, rather than a test-only runtime shortcut.
- No external exercise requests, fetch/XHR/WebSocket/event-source or non-GET exercise traffic; no local/session storage, IndexedDB, Cache Storage or service workers. Static HTML/assets load normally. No account/store/analytics connection. Tests use synthetic fixed choices; no participant data.

## Visual evidence

Actual previous screenshots: `../validation-study/attention-repeat-320.png` and `../validation-study/attention-repeat-390.png`.

Current captures include `guided-entry-320.png`, `guided-entry-390.png`, `guided-selected-320.png`, `guided-selected-390.png`, `attention-repeat-320.png`, `attention-repeat-390.png`, plus hold/closing and wider sizes. Entry, selected state, repeated placement and hold at 320/390 were visually inspected. Message and Reply captures confirm the retained presentations.

## Accessibility limits

27 of the 119 broad audits retain only the layered-window **color-contrast incomplete** result; these are recorded, not converted to automatic passes. The 10 additional audits have no incompletes. Opaque paper backgrounds and existing explicit token contrast were manually reviewed (`contrast-review.json`: body muted 4.78:1, eyebrow 5.65:1, ink 13.35:1). No new gradient text treatment was introduced.

Physical phones, zoom/rotation, VoiceOver/TalkBack, switch access and forced-colours still require manual testing. Emulation and axe do not establish assistive-technology compatibility. First-time comprehension, whether the repeated selection feels effortful, enjoyment and usefulness remain unvalidated by this work. The founder's earlier feedback is individual feedback; no pending invitations/replies are reported as results.

## Protected preview

The address is supplied privately to the founder and omitted from GitHub and repository files. `hosting.json`, `host-access.json` and `host-hashes.json` record verification without access tokens or bypass links.

Existing approved Vercel project protection is retained. Anonymous checks of all three routes, manifest and JavaScript require Vercel sign-in; authenticated API file hashes match the tested local output. The deployment is static Preview only, no custom alias or Functions. Production target, shared protection and settings remain unchanged. No new credentials, membership, payment or spending mechanism was introduced. No invitation or access grant.

This checks artifact identity and access enforcement. It does **not** claim an interactive authenticated hosted-browser walkthrough. Founder uses their existing authorised Vercel login to review all paths. Static hosting/authentication requests, cookies and infrastructure logs exist; exercise choices are never transmitted or put in URLs. Deployment-only CSP blocks connections, external scripts, frames and forms. No share/bypass link is generated.

## Reproduce

Build with `npx vite build --config explorations/everyday/vite.config.ts`; serve `dist-practice-lab` on 5193. Run `verify.cjs`, `verify-inputs.cjs`, `verify-study.cjs`, `verify-guided.cjs` with `PLAYWRIGHT_MODULE`, `AXE_PATH`, `PRACTICE_URL`, `PRACTICE_EVIDENCE` pointing to external tooling and a fresh evidence directory. No dependency/lockfile update is required. Do not publish an unprotected deployment to reproduce these checks.
