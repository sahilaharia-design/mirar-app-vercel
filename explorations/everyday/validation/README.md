# Everyday practice — validation evidence

21 October 2026. Implementation `5781599124fc92a90ff89049233783d21bb9c721`. Review tooling and this evidence are additive. Static production-mode Vite output tested at localhost; no production app or hosted preview was modified.

## What passed

- **119 browser state/path audits**, with zero automated WCAG A/AA/best-practice violations. Actual viewports: 320×568, 390×844, 768×1024, 1024×768, 1440×900. `results.json`.
- Every viewport covers the hub, all three entries, operative middle states, closings and Not now / restart. No horizontal page overflow; every enabled tested button/action is at least 44×44. There are no drag-only or gesture-only operations.
- Message: all 27 first-reading × alternative × final-stance combinations; early unknown without a comparison claim; second scene; back and revision; no positive/preferred interpretation. Initial uncertainty closes immediately, further windows optional.
- Reply: all six legal complete draft combinations (four offers, smaller offer's three optional edge states), read-back/edit loop, uncertainty and no-reply. No actual send or commitment.
- Attend: actual session transitions, max five, one foreground only, disabled second foreground with explanation, all dispositions including unknown, all set-aside time options, hold/end/after/skip, back freeing foreground, one rearrangement, initial unknown/none and leaving during hold. Unknown placement is never equated to deliberate no-action.
- **Complete keyboard-only journeys for all three**, with visible Tab focus and Enter activation. Closing title is focused and within the viewport. One emulated touch path also completes. `input-results.json` / `inputs.log`. No hardware touch test is claimed.
- Reduced-motion browser context, zero running animations after the tested action, and ordinary-feedback state checked. Motion is only interaction-triggered reflective-layer/selection feedback.
- No page exceptions, external network requests, localStorage or sessionStorage writes in any audited state. All font/artwork requests stay local. No real-account data, server or filesystem saver is involved.
- Isolated strict TypeScript project passes (`npx tsc --project explorations/everyday/tsconfig.json`); static Vite build passes. Empty `isolated-types.log` means no compiler diagnostics.

## Accessibility manual review and limitations

**Not all axe results are fully automatic passes.** 37 of the 119 scans retain a color-contrast incomplete result for `.window-words > p` because axe cannot resolve its layered image/occlusion geometry. No other incomplete rule remains. Raw reasons/targets are preserved in `results.json`; these are not removed from the report or represented as zero-incomplete checks.

The text has an explicit opaque paper background and its own stacking layer above the artwork. Manual CSS/visual review and token-based WCAG calculations are in `contrast-review.json`: window ink 13.35:1; window eyebrow 5.65:1; muted body 4.78:1; selected ink 11.19:1. These pass normal-text AA; text contrast does not depend on the gradient's color. Screenshots show the final treatments. This addresses text contrast; it does not pretend to be an automated guarantee of every visual condition.

A named region was added to the arrangement after the initial review found an unsupported aria-label on a generic div. New-step headings receive focus and scroll into view only if outside the viewport. Native buttons expose selection with aria-pressed; disabled Attend-now includes the actual reason through aria-describedby. Unknown/no-action/exit stay ordinary controls with no grading colors. The canonical mark is decorative in the practice window and does not substitute for labels.

Native VoiceOver/TalkBack, switch controls, high-contrast/forced-colors modes, physical devices and real first-time comprehension were not tested. Browser emulation and semantic inspection are not screen-reader certification or evidence of enjoyment/usefulness.

## Existing repository blocker

The whole-repository typecheck still has the two previously handed-off G3 `keep_device` owner-alias errors in `lib/innerRep/backup/continuity.ts:105` and `scripts/runtime/continuity.test.ts:129`. `types.log` records these. No exploration source errors remain. That existing continuity issue is not repaired by this unrelated frontend exploration, and a globally green build is not claimed.

## Reproduce

Build and serve `dist-practice-lab` at port 5193 (or set `PRACTICE_URL`). Run `verify.cjs` and `verify-inputs.cjs` with `PLAYWRIGHT_MODULE` pointing to an available Playwright module and `AXE_PATH` to axe-core/axe.min.js. `PRACTICE_EVIDENCE` selects a fresh evidence directory. Tooling was installed outside the repository; no package/lockfile edits.

Screenshots are labelled by concept/state/width. All are synthetic fictional practice, never personal Mirror evidence. Human testing remains pending; the neutral protocol and comparison are in `../README.md`.
