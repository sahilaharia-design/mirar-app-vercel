# Creative exploration validation

8 October 2026. Base: `6c6f0d07eab763cbe5908228856647b34d99183e`. Separate branch: `codex/mirar-creative-explorations`. No deployment or application-wide adoption.

## What was verified
- All three working concepts at **320×568, 390×844, 768×1024, 1024×768 and 1440×900**.
- **84 screenshots/geometry checks**: no horizontal overflow; visible interactive targets at least 44px. Header artwork link was corrected from a 36px target to a 44px clickable area without changing the image.
- **66 axe scans; zero reported violations.** 64 scans contain an incomplete colour-contrast rule because SVGs, layered leaves and decorative elements overlap. These are **not 66 fully clean scans**. The incomplete nodes remain in `validation/results.json` for review.
- Manually inspected representative mobile/desktop landing, story, rep and Mirror screenshots. Verified principal text palette pairs mathematically: 4.60:1–13.03:1, recorded in `validation/contrast.json`. The essential meaning is live text outside the decorative SVGs. This does not replace assistive-technology testing or certify every browser-rendered pixel.
- Exact paired response → explicit confirmation → completion; exact offered question/label in the receipt; unknown → neutral integration; Back to Today resets the local sample.
- Real action template → existing timeframe control. A past value leaves confirmation disabled; a future date is accepted and shown exactly in the receipt. Date events use the browser-native input setter in the verifier because this browser tool's text-fill helper does not reliably fill native segmented date controls. Physical date-picker ergonomics remain a device check.
- Real commitment-check template displays the authored “Reach out to a friend” context and exact offered outcomes. No internal IDs or overdue/failure treatment.
- Every Partly reason in each direction: **18 structured correction paths**, including “I'd rather not say”; Something else → exact “Optional. Not saved in this version.” note → Continue clears the field. **Nine additional feedback paths** cover Accurate/No/Not sure.
- Three safety checks: synthetic acute-risk note → existing safety wording/resources; note no longer appears. These are regression checks of the existing best-effort detector, not clinical validation.
- Keyboard confirmation, keyboard correction controls and skip-to-content. Each direction separately verifies an active reduced-motion preference, **0s diagram transition and no rep-entry animation**. A standard-motion view is also recorded. The browser tool resets emulation on navigation, so the verifier explicitly sets it again for each reduced-motion check.
- No browser runtime errors in the completed walkthrough. Each geometry record checks empty localStorage and no cross-origin resource requests. No accounts, real email, backend, telemetry or storage adapter used.

## Builds and review
- `npx tsc --noEmit`: passes, including new exploration source.
- `./node_modules/.bin/vite build --config creative-review/vite.config.ts`: passes. Build output is isolated/ignored in `creative-review/dist`.
- Review build warns about the >500kB combined bundle and dependency `use client` directives. It intentionally packages three worlds and existing native-web renderers together. This is not a production bundle claim or reason for dependency upgrades.
- React checklist: unconditional hooks; stable SVG clip IDs; selected state exposed with `aria-pressed`; exact option names; question/completion focus; optional text handled by unchanged production safety/privacy components; no new storage, auth or analytics imports.
- Protected-diff check against the base is empty for application routes, production components, engine/runtime/store, schema, canonical assets/fonts/tokens, locales, authoritative documents, previous experience work, package manifest and lockfile. The authoritative visual branch still points to the original base commit.
- Engine suites were not rerun for an isolated presentation exploration: their code and all production consumers are unchanged. Previous application validation remains in `docs/experience/VALIDATION.md`.

## Reproduce
Start the isolated server from the repository root:

```sh
./node_modules/.bin/vite --config creative-review/vite.config.ts
```

In another terminal, with agent-browser installed:

```sh
AGENT_BROWSER_BIN=/absolute/path/to/agent-browser python3 creative-review/verify.py
```

`MIRAR_CREATIVE_URL` can change the local origin. `MIRAR_QA_ONLY=motion` appends only the dedicated motion/keyboard checks to an existing evidence record. The completed evidence combines the full standard-layout/flow run with the dedicated motion checks after correcting the verifier's emulation setup. Selector/date-helper issues encountered while developing the verifier were corrected; the source preserves explicit control names and scopes feedback to its reflection panel.

## Limits before adoption
Native VoiceOver/TalkBack, actual touch ergonomics, browser/OS date-picker differences, zoom and intentional Hindi/Gujarati layout remain adoption QA. No prototype proves user preference, comprehension, adherence, efficacy or retention. No real authentication or production deployment is part of these explorations. Longitudinal Mirror integration remains gated on the approved read model and reflection eligibility/correction provenance.
