# Mirar visual foundation — 6 October 2026

The existing product is a temporary host for visual and accessibility validation. Its four-choice model, scoring, completed-day presentation and pattern structure are not future design requirements. New Emotional Fitness interactions await product/engineering contracts.

## Brand
Use supplied PNG artwork. Product and landing now share lossless transparent-margin crops of `Just Name.png`, `Only Logo.png` and `Logo without TM_1.png`. Cropping removes empty canvas only; artwork pixels and lockup proportions remain intact. No filters, rotation, opacity effects, recoloring, blend modes or animation on artwork. The header uses the intact lockup rather than separately positioning the mark and wordmark.

`design-system/asset-provenance.json` records provenance and the previous derivatives. Previous landing derivatives were not exact alpha-bound crops and were replaced. Legacy full-canvas product `mirar-name.png` and `mirar-lockup.png`, and landing `mirar-logo-lockup.png`, remain supplied originals. No original Downloads files were modified. Dormant Logo no longer recreates artwork; its legacy light/dark prop never recolors the canonical asset.

## Tokens
Source: `design-system/tokens.css`. Product imports it directly. Landing has a checked-in identical copy, `app/mirar-tokens.css`, because it deploys as a separate repository. After editing source, run `node scripts/sync-design-tokens.mjs` and include the landing copy in its own repository changes.

Colors: ivory primary surface, paper secondary surface, warm raised surface; charcoal primary text, muted secondary text, ivory inverse text; peach decorative warmth and darker warm ink for readable emphasis. Named border, selection, focus, error, success and disabled roles separate interface semantics from emotional signals. Success/error colors describe utility outcomes, never a person’s state. The existing palette is evolved, not replaced.

Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px. Controls use 8px radius; sheets 16px; circular icon buttons use 50%. Use border and whitespace before elevation; only sheets use the subdued shared shadow.

Typography: self-hosted Instrument Serif 400 for emotional display, prompt, reflection and statement; self-hosted variable DM Sans for utility/body. These are the existing landing fonts, copied from its verified Next font output, with OFL licenses in each public/fonts directory. Both builds no longer need a Google font fetch. Latin assets cover the current English flow; system fallback covers other scripts. Future localization must verify script coverage before release.

| Role | Size | Line height | Weight / tracking |
| --- | --- | --- | --- |
| Display | 40–72px responsive | 1.08 | 400 / −.02em |
| Page title | 32–48px responsive | 1.15 in sheet | 400 / −.02em |
| Prompt | 32–56px responsive | 1.08 | 400 / −.02em |
| Reflection / statement | 28–44px responsive | 1.2 | 400 / −.02em |
| Body | 16px | 1.6 | 400 |
| Metadata / labels | 12px | inherited | 500 / .08em for labels |
| Button | 16px | inherited | 500 |
| Microcopy | 14px | inherited | 400 |

Light mode is currently supported. Do not advertise a dark theme until all semantic roles and canonical artwork backgrounds are verified.

## Components
`src/components/foundation/index.tsx` provides BrandAsset, PageShell, Header, Prompt, Statement, PrimaryButton, SecondaryAction, SelectionSurface, ReflectionSurface, PageTransition, Dialog/Sheet and ProgressivelyDisclosedContent. These accept ordinary typed HTML props and contain no exercise selection, scoring, storage or inference rules.

SelectionSurface is an action button by default. For a persistent toggle selection, supply `selected` to expose `aria-pressed`; do not label instant-answer actions as toggles. Use proper radio/listbox semantics when a future contract requires those models.

Dialog/Sheet requires an accessible title ID. Native `showModal()` provides browser focus containment and an inert background; a separate custom FocusTrap is deliberately unnecessary. The component explicitly wraps Tab/Shift+Tab within visible controls, captures/restores the trigger, locks background scrolling, supports Escape and outside click, and cleans up on close/unmount including React Strict Mode. Always include a visible close action. For future complex content, choose initial focus deliberately and verify long-content scrolling.

## Motion and restraint
Direct feedback: 180ms. Sheets: 280ms. Entry: 400ms, at most 8px movement. Shared settling easing: cubic-bezier(.22,1,.36,1). Reduced motion sets token durations to zero and removes animation/scroll movement without hiding content.

Product no longer has glass blur, oversized shadows, grid atmosphere, orbit decorations, ongoing ambient loops or fixed reminder overlays. Warm paper, authentic gradient artwork, warm ink details and editorial typography preserve tactility. Existing graph behavior/data remains a temporary host, without extra score emphasis. Landing loses pointer aura, decorative scans/sheen, selected ambient loops and card hover elevation while retaining its narrative and product copy.

## Accessibility and validation
Controls use at least 44px targets, visible 2px blue keyboard focus with 3px offset, named modal surfaces and native button semantics. Disabled roles and selected roles have explicit semantics. Existing product routing, stored response creation and reflection logic were preserved.

See `validation/` for screenshots and raw browser checks. Historical QA claims in responsive-qa.md are not new certification. Validation scope and current findings are recorded in validation-summary.md. No new exercise interaction, completion system, history or evidence view is implemented.

## Approved baseline and freeze — 6 October 2026

The user approved this visual foundation and its stopping point. Preserve canonical artwork handling, shared semantic tokens, Instrument Serif + DM Sans, warm ivory/paper/charcoal surfaces, accessibility primitives, reduced motion, responsive behavior, shared component architecture and restrained motion. Do not reintroduce glass, looping atmosphere or decorative visual noise.

Quieter does not mean emptier. Keep Mirar warm, tactile, human, editorial and emotionally intentional. Future interactions should provide its distinctive tactile character; avoid reducing the experience to beige text screens.

No further product-facing design or Emotional Fitness interactions until product/engineering supplies supported exercise and response contracts. Possible response types mentioned by the user are informational only and must not be implemented from that list. Once contracts arrive, design reusable interaction components against the schema rather than individual prompt copy.

Future localization requires intentional Devanagari and Gujarati typography, visual parity across English/Hindi/Gujarati, and no uncontrolled system-font fallback in production localization. Current Latin fonts are acceptable for English development. Do not implement localization typography until specifically requested.

Keep dependency findings documented. Framework/dependency upgrades belong to a separate controlled engineering/security task, not visual work. This approval does not authorize deployment or upgrades.
