# Study preparation — functional, accessibility and private-host evidence

Reconciled against owner `d2baf06`. Deployed frontend source: `e2fbb3ddff07384a20a49ae04ab4af8b8fdade08` (includes `5ee7f4a`). This evidence supersedes the original fictional Attention wrapper; `../validation/` is retained as historical evidence.

## Functional and responsive checks

- **119 state/path axe audits** in `results.json`, across 320×568, 390×844, 768×1024, 1024×768 and 1440×900. Each width covers entries, operative steps, closings and exit/restart. All Message first-reading/alternative/final-stance combinations, coherent Reply drafts, unknown/no-action, Back, set-aside time options, recovery of a foreground slot, maximum-five and rearrangement paths remain covered.
- **10 additional axe audits** in `study-results.json`: repeated own-life Attend placement and expanded support at all five widths. Touch emulation selects five synthetic pulls, verifies second foreground refusal, uses all dispositions, checks partial/unknown completion and opens support. The actual step controls precede the artwork in DOM and visual order. 320px requires vertical scrolling for later choices; nothing is clipped or drag-only. Screenshots show the current repeated-step viewport, not just the entry.
- **129 audits, zero automated accessibility violations.** All enabled tested buttons and links meet 44×44, with no horizontal page overflow. Native disabled controls show the real reason; selections expose aria-pressed. New/exit headings receive focus and scroll into view; a 16px scroll margin prevents fractional-edge clipping.
- Full keyboard-only completion of all three practices plus an emulated touch Message journey: `input-results.json`. Current final source was tested. Reduced-motion checks and ordinary interaction feedback are retained.
- Own-life/pilot versus fictional/prototype labels, no text inputs, initial uncertainty/none, all-unknown placement, no unperformed Message comparison claim and reload clearing are explicitly asserted in `study-results.json`.
- Zero exercise fetch/XHR/WebSocket/event-source or non-GET traffic; zero external requests and no page exceptions in the local static review. `results.json` records `practiceNetwork:[]` and `external:[]`. Static HTML/JS/font/artwork loads are necessary and are not misrepresented as zero HTTP traffic.
- No localStorage, sessionStorage, IndexedDB databases, Cache Storage or service-worker registrations in the fresh test context. No analytics, Mirar authentication/store, backup, engine selection, billing or account-writing code is wired to the lab. Attention uses actual PilotSession in memory with no prior history; nothing is sent to a pilot store or the Mirror.
- Strict isolated TypeScript and static Vite build pass (`types.log` has no diagnostics). Existing unrelated G3 owner-alias errors remain outside this isolated project; a globally green product build is not claimed.

## Manual accessibility review and unvalidated areas

42 of the 129 audits retain **only** color-contrast incomplete results for the layered window text. These are recorded, not removed or called automatic passes. Opaque paper text backgrounds and explicit stacking keep the text independent of the canonical gradient; the manual CSS/visual review and WCAG token ratios remain in `contrast-review.json`: ink 13.35:1, eyebrow 5.65:1, muted body 4.78:1, selected ink 11.19:1. No other incomplete rule is accepted by the checks.

Physical-device touch/zoom/rotation, VoiceOver/TalkBack, switch access and forced colours still require testing. Browser keyboard, emulation and semantic checks are not native assistive-technology certification. Human enjoyment, comprehension, pressure/quiz/chore perception, benefit and efficacy are untested. No independent adviser/clinical sign-off is claimed.

## Private hosting verification

`hosting.json`, `host-access.json` and `host-hashes.json` record the separate static Preview deployment. The address is supplied privately to the founder and is deliberately absent from this repository/PR.

- Existing Vercel Hobby/team access and project protection were verified before use; the public creative-review project was not used. No new account, credential, payment, team membership, shared protection rule or project setting was required.
- Anonymous requests for all three prototype routes, the build manifest and JavaScript redirect to `vercel.com` sign-in with HTTP 302. They do not expose the prototype. No bypass/share link was created, no custom/public alias assigned.
- Nine uploaded output/static files were checked through the existing authenticated Vercel API; their SHA-1 identifiers match the tested local artifact bytes, including the output config and manifest. This does not claim an interactive hosted SSO browser walkthrough; founder sign-in with existing access is the remaining manual host check. No new automation/bypass credential was minted to perform one.
- The production deployment target and project SSO configuration were compared before/after and are unchanged. No G3 or production files/configuration were deployed. Only the isolated prebuilt static lab was uploaded; no Functions or server build.
- `../preview-output-config.json` captures deployment-only headers: no external script/connection/frame sources, connect-src none, no-index, private no-store and no-referrer. The deployment-only preview-feedback variable is off. No environment/secrets were pulled and no shared environment variable was changed.
- Hosting necessarily serves static assets and uses Vercel sign-in/cookies and infrastructure access logs. Page/prototype URLs may appear in host logs. No exercise answers are in a URL or request; there is no app analytics or practice persistence. No claim of “no host metadata anywhere” is made.

The preview is for founder/adviser review only. Participant recruitment, access grants, recordings, notes collection and follow-up remain held until separate approval and the reconciliation's consent/adviser requirements are met.

## Reproduce

Build with `npx vite build --config explorations/everyday/vite.config.ts`, serve `dist-practice-lab` (tests default to port 5193), then run `verify.cjs`, `verify-inputs.cjs` and `verify-study.cjs`. Set `PLAYWRIGHT_MODULE`, `AXE_PATH`, `PRACTICE_URL` and `PRACTICE_EVIDENCE` to installed tooling and a fresh directory. Tooling is external to the repository; dependency manifests/lockfiles are unchanged. Do not recreate public hosting or bypass Vercel protection to reproduce browser checks. Founder review and access rules: `../STUDY_REVIEW.md`.
