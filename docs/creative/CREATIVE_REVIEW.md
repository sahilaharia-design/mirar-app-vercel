# Mirar — three creative worlds

8 October 2026 · Exploration base `6c6f0d07eab763cbe5908228856647b34d99183e` · `codex/mirar-creative-explorations` (separate exploration branch)

## Review first
These are separate, working creative prototypes, not a replacement application. No direction is selected for implementation. All new interface code lives in `creative-review/`; application routes, production components, assets, tokens, contracts, engine and persistence are unchanged. No deployment.

Start: `./node_modules/.bin/vite --config creative-review/vite.config.ts`

- [Compare the three worlds](http://127.0.0.1:5176/)
- [01 — Aperture / A little more room](http://127.0.0.1:5176/?direction=aperture)
- [02 — Weave / The fabric of a day](http://127.0.0.1:5176/?direction=weave)
- [03 — Fieldnotes / Notes from the inside](http://127.0.0.1:5176/?direction=field)
- [Existing experience](http://127.0.0.1:5174/?experience=discover), when its separate `npm run visual:review` server is running.

Each world includes a landing hero, three-state interactive story, real approved sample flow, structured-response integration, beginning Mirror, illustrative future Mirror, actual feedback/correction renderer and privacy disclosure. The review selector offers attention, action/timeframe and commitment-follow-up fixtures. These are demonstration choices, not production rep selection. No authentication, storage adapter, analytics, remote artwork or remote font service is imported.

## 1. Critical audit of the implemented experience
The existing implementation was read and opened locally, including its connected sample. `docs/experience/CLAUDE_HANDOFF.md` and `VALIDATION.md` establish its boundaries and previous functional evidence. The critique concerns the presentation, not an untested claim that the engine needs replacing.

| Journey | What is worth keeping | What is holding it back | Creative opportunity |
|---|---|---|---|
| Landing/discovery | Actual sample before authentication; immediate statement of emotional fitness; exact logo | Hero plus pale sample panel is familiar premium-wellness composition. Its most prominent object is still a block of copy. | A strong graphic proposition that teaches what practice feels like before explaining it. |
| Product storytelling | Capacity language avoids scores; disagreement is explicit | Capacity list, timeline, privacy and founder are successive editorial text chapters. The reader does most of the work. | Let visitors move a frame, meet two threads or turn an observation over. Make the difference between noticing and interpreting visible. |
| Entry/authentication | Real passwordless boundary, clear errors and sent state | Removing friction does not by itself create a sense of arrival; the page could belong to several products. | Carry one motif from discovery into a quieter entrance. Keep the email field ordinary and easy. No decorative login puzzle. |
| Onboarding | Short; no questionnaire; uncertainty is legitimate | A sample phrase and explanatory copy are helpful but weak as an introduction to the practice’s distinctive character. | One interaction followed by an explicit release back into life; explain privacy at the point words could be entered. |
| Today | Actual day, draft, completion and practice facts; no invented continuity | Greeting and Begin occupy a large, neutral composition. Many returning states depend on wording rather than visual pacing. | A small, recognisable daily opening gesture. Add richness only when approved context exists; avoid a full-screen idle illustration. |
| Inner Rep | Contract sequencing, compare support, autonomy and safe optional words | Many answers are ruled rows or ordinary buttons. Compare remains a form even when beautifully typeset. | Give supported choices spatial identity, a clear selected state and deliberate confirmation. Never make a gesture the only input route. |
| Completion/integration | Exact question and chosen option; no inference; permission to leave | Receipt and advice-like carry copy lack a memorable change of state. The experience ends as another text section. | A compact graphic resolves into an artefact holding the exact response. Return attention to life rather than offer another task. |
| Honest Mirror | Evidence disclosure; equal feedback; structured Partly correction | A line and heading distinguish reflection only subtly from the rep. Interpretation and provenance compete in the same text hierarchy. | A distinct reading surface with evidence attached as annotation. Turning it over exposes limits, not hidden advice. |
| Commitments | Exact authored context, neutral outcomes, optional future date | Functional clarity is good; visual language still resembles a follow-up form. | A sentence carried forward, never a task card with status colour, due warning or checkbox reward. |
| The Mirror | Honest unavailable states; does not revive rejected insights | Too much space is devoted to explaining features still being built. Repeated empty chapters make the product feel less alive. | One generous beginning state. Future evidence arranged as different kinds of material, with provenance and uncertainty attached. |
| Me/privacy | Useful account/support boundaries; truthful local retention | Essential but visually interchangeable editorial utility screens | Keep utility quiet. Use one small identifying motif, not another hero graphic. Preserve plain-language privacy and standard controls. |
| Returning journey | Actual state-dependent invitations; no streak mechanics | Day 2/10/30 differentiation cannot be earned through new copy alone. The present data model does not support an accumulated picture. | Same recognisable opening; deeper *approved* evidence over time. Graphic changes must never pretend to measure growth. |

**Overall:** restraint is a strength; sameness is the cost. Mirar needs a visual verb, not more decorative objects. The strongest original elements today are its permission to disagree and its exact-response integration. The weakest are the passive capacity explainer, generic invitation surfaces and lengthy unavailable-history explanations. A meaningful interaction can earn an emotional connection that another paragraph cannot. None of these prototypes proves retention or user preference; that needs research.

## 2. Direction 01 — Aperture: A little more room

**Philosophy:** emotional fitness is the ability to change the frame around experience. Attention is movable; the self is not an object to repair.

**Identity:** a warm, instrument-like aperture with a field of crossing lines. Cropping and white space do the storytelling. It is a framing device, never an eye logo, radar, progress ring or psychological gauge. The canonical Mirar wordmark is a separate, untouched image.

**Colour/type:** existing ivory and charcoal, a deliberate burnt-clay graphic field (`#b94725`). Instrument Serif headlines compress the opening proposition into a few words; DM Sans labels keep the instrument legible. Accent is an expressive material, not feedback status.

**Original graphics:** clipping circle, aligned/crossing paths, finely ruled field, registration marks. Five drawn paths are a composition, not five observations. Artwork is bespoke SVG, independent of any actual account data. All diagrams carry a conceptual caption.

**Motion:** user-triggered frame movement and line reshaping, 650ms settling; selection 180–280ms; rep-stage entry 400ms/8px. No idle breathing, loop, forced pause or scroll hijack. Reduced motion removes transitions entirely. Duration is direction-specific exploration, not a change to shipping motion tokens.

**Story:** choose whole field → one thing → return. The crop changes; no claim that the visitor’s mind has improved. This is a three-state authored explanation, not a diagnostic control.

**Landing:** a large typographic proposition and a striking, cropped instrument share the viewport. The following charcoal chapter changes the pace without adding glass or gradients.

**Inner Rep:** equally weighted paired frames; the selected frame gains a border and a larger aperture mark. Continue confirms the exact engine option. Unknown stays available. Artwork is not an input and no drag is required.

**Completion:** an aperture becomes a small margin artefact next to the exact question/choice. It releases the user with one noticing cue. It does not reveal a synthetic insight.

**Mirror:** beginning state uses a lightly drawn open frame. Future view separates an exact response, engine reflection and uncertainty. Evidence can be read without claiming the frame is a complete picture.

**Mobile:** hierarchy is proposition → action → graphic; no compressed two-column layout. Pair choices stack. The graphic becomes secondary within the practice, so the question remains the hero.

**Tone:** attentive, spacious, confident. Main risk: precision can become clinical or resemble a focus-product instrument. Keep warm paper, human copy and imperfect flowing lines; avoid numerical ticks and “clearer mind” claims.

## 3. Direction 02 — Weave: The fabric of a day

**Philosophy:** a practice is made from encounters between noticing, choice and ordinary life. It does not require consecutive days or a perfect pattern.

**Identity:** interlacing paper-like ribbons, open edges, deliberate gaps and an off-register texture. The metaphor is material accumulation, not a streak chain.

**Colour/type:** plum-charcoal (`#4c2234`), oat paper (`#eee5d4`), terracotta and dry ochre. Same approved fonts; broad serif phrases feel conversational. Deep plum acts as ink, not an emotional category.

**Original graphics:** curved warp/weft strokes, small overpasses and sparse linear grain. Open intervals are intentional, not missing-day indicators. No fabricated biography is woven into the drawing.

**Motion:** a moment alone → threads meet → material forms, controlled by three labelled buttons. Curves widen/interlace on demand. No completion confetti or increasing density tied to practice count.

**Story:** the visitor sees how a choice can meet a moment without needing a complete life story. Returning is an invitation to resume a material, never repair a broken chain.

**Landing:** a broader headline faces a saturated textile study. The study has unfinished edges rather than sitting inside a familiar wellness card.

**Inner Rep:** answers become horizontal ribbons with equal ink weight. A selected ribbon is held by an outline; Continue remains explicit. Ordinary semantic buttons preserve keyboard and touch access.

**Completion:** a small crossing of material accompanies the response; “A small thing to carry.” A commitment is language carried into life, not an item to finish for a reward.

**Mirror:** observations and reflections occupy adjacent material leaves. They do not connect automatically into a pattern. Lack of evidence leaves space rather than “weaving” a conclusion.

**Mobile:** full-width response ribbons; ample room for long labels. A narrow material edge provides identity without consuming prompt space. No drag-to-weave interaction.

**Tone:** warm, handmade, human. Main risk: the craft metaphor can become decorative or imply that accumulating reps improves a measurable fabric. The prototype deliberately does not change artwork based on frequency. More complex material animation would cost more to maintain across native platforms.

## 4. Direction 03 — Fieldnotes: Notes from the inside

**Philosophy:** a person can observe their life closely without reaching a fixed conclusion. Evidence is a note with provenance, not a label applied to the self.

**Identity:** original abstract specimens, dots, margin rules, occasional registration marks and paper leaves. A field notebook without botanical stock art, stamped diagnoses or pseudo-scientific scales.

**Colour/type:** pale lichen (`#edf0e5`), blue ink (`#243b58`) and muted cobalt (`#425d89`). Instrument Serif supplies observation titles; DM Sans provides annotation and exact provenance. All text remains live, selectable and reflowable.

**Original graphics:** irregular cutout form, central path, dotted study field and annotation leaders. These are explicitly illustrative studies. They are not a map of mood, nervous system or personality.

**Motion:** look → consider another reading → take it outside. The specimen rotates slightly as the authored story changes. An observation leaf reveals its limit when turned over. No 3D flip, inaccessible hover-only content or animated handwriting.

**Story:** visitor-directed rereading demonstrates the right to revise an interpretation. The second side is a limit, not a “better” explanation.

**Landing:** editorial opening with a specimen on a separate sheet. Space feels inhabited by a meaningful study rather than a product screenshot in a card.

**Inner Rep:** response slips with small study marks and equal selection treatment. They are deliberately selected then confirmed. Long labels wrap; there is no journaling mandate.

**Completion:** exact choice becomes a single annotated observation. Raw words are never printed into a saved notebook; their existing unstored behavior stays intact.

**Mirror:** strongest direction for distinguishing explicit choice, generated reading and uncertainty. “Turn the observation over” exposes the limitation of one response. The layout is a concept pending a read model, not permission to archive rejected reflections.

**Mobile:** paper edges flatten, rotations are removed and margins become small rules. No tiny desktop annotations or side-by-side leaves. A single response remains legible without zooming.

**Tone:** curious, intimate, open-ended. Main risk: a notebook appearance can misrepresent Mirar as a journal or imply scientific authority. Keep writing optional, provenance plain and artwork explicitly metaphorical. Restrict notebook styling to reflection, not all navigation and forms.

## 5. Comparison and recommendation
These are design judgements, not measured research scores.

| Criterion | Aperture | Weave | Fieldnotes |
|---|---|---|---|
| Originality | Strong single visual verb: reframing | Original material interpretation of practice | Familiar notebook trope made more precise by reversible evidence |
| Brand distinctiveness | Strong silhouette; works at several scales | Rich, warm and ownable if material discipline holds | Distinctive annotation language, less unique as a whole brand |
| Emotional impact | Space and relief without promising calm | Warmth and a sense of ordinary life | Curiosity and permission to revise |
| Product clarity | Directly connects noticing → choice | Requires a little more explanation | Especially clear for evidence and disagreement |
| Mobile usability | Graphic can shrink into a margin device | Ribbons naturally fit a vertical phone | Excellent when leaves flatten; avoid dense annotation |
| Accessibility | Simple SVG and standard buttons; crop not required to understand copy | Same standard controls; avoid drag dependencies | Text provides complete meaning; no hover-only annotation |
| Implementation complexity | Moderate: clipping and path interpolation | Higher: believable interlacing across platforms | Low–moderate: layouts, typography, disclosures |
| Scalability | One graphic grammar for entry, practice and reflection | Risk of decorative proliferation or density-as-score | Strong evidence grammar; risk of turning every surface into a notebook |
| Long-term coherence | Best primary identity | Best alternate world, not an additional layer | Best supporting reflection grammar |

**Recommend Aperture as the primary world, with Fieldnotes’ provenance discipline inside the Mirror.** Borrow its exact-response / reflection / uncertainty separation, not its specimens, palette or paper-stack styling. This is a functional combination, not a collage of two art directions. Keep Weave intact as a credible alternative for review.

Why: “make room, choose a frame, return to life” is both recognisable and tightly connected to the practice. Aperture’s artwork can make discovery expressive while reducing to a single line/frame inside an exercise. Fieldnotes contributes a precise way to show why a reflection exists, which is more useful than extending the aperture into every evidence surface.

Explicit confirmation adds a tap compared with the current auto-advancing choice renderer. Research should decide whether it belongs on paired truths only or on all choices; it is not an engine requirement.

Trade-off: Aperture is less immediately tactile than Weave, and the current clay circle risks resemblance to an optical instrument. Human language, warm material and restrained imperfection are essential. If research finds the instrument too clinical, select Weave rather than covering Aperture in decorative craft cues. Test comprehension and emotional response with users before extending it throughout the app.

## 6. Proposed cohesive system, pending creative review
- **Canonical brand:** existing image files only; no SVG replacement, tracing, crop, filter or recolour of the logo. Keep it independent of the creative diagrams.
- **Type:** Instrument Serif and DM Sans. One expressive display moment per screen. Long prompts use responsive 32–56px; body 16–18px; functional labels at least 12px in the eventual app. Small prototype review/figure metadata is not essential product instruction.
- **Colour:** existing semantic surface/ink/paper roles continue. Candidate clay is an artwork/selection accent, not success, stress or readiness. Do not globally replace production tokens before review. Fieldnotes and Weave palettes stay isolated alternatives.
- **Space/material:** 8px rhythm; 24px mobile page margin, 20px at 320px; generous 64–112px editorial chapter separation; limited paper surfaces. No blanket card grid, glass or ambient effects.
- **Graphic rules:** one framing silhouette, directional paths and restrained ruled fields. No ring fill, intensity grade, factual interpretation of density, or changing paths based on inferred mental states. A path can react to a UI selection because it is a selected state, not a state of the person.
- **Component contracts:** FrameStudy is a deterministic authored story diagram; SupportedChoice renders exact engine options and emits exact IDs after confirmation; IntegrationArtefact shows exact structured response/timeframe; EvidenceAnnotation renders supplied provenance; MirrorBeginning has no inferred content; ReflectionSurface uses existing feedback/correction controls.
- **Motion:** 180ms feedback; 280ms disclosure; 400ms/8px stage entry. Marketing-only authored diagrams may take 650ms on explicit input. No required waiting. Reduced motion is immediate. Do not slow down reps merely to perform the brand.
- **Accessibility:** standard input semantics, visible focus, 44px+ targets, no motion-only meaning, no swipe-only answer, no hover-only content, polite story updates, focus on changed question/completion. Diagrams are decorative because full meaning is provided in text. Production screen-reader and native QA remain required.
- **Evidence:** explicit choice, engine observation, inference and uncertainty require separate source metadata. A rejected/corrected reflection must remain ineligible for reappearance. No frontend history mining.
- **Localisation:** plan intentional Hindi/Devanagari and Gujarati typography; retain equivalent hierarchy and avoid fixed art/text locks. No production system-fallback solution is introduced here.

## 7. Practical implementation roadmap
1. **Creative review:** compare the three local prototypes on a phone and desktop. Decide the primary metaphor. Review whether users can explain emotional fitness, distinguish response from interpretation and disagree without hesitation. This task stops before application-wide adoption.
2. **Contract-preserving vertical slice:** after selection, implement one real Today → paired rep → integration path behind a reversible visual flag. Keep the step machine, semantics and callbacks. Validate explicit confirmation, unknown, resume, dismissal and duplicate prevention.
3. **Arrival:** carry the chosen motif from discovery into existing email/sent/expired states and one-screen introduction. Preserve real auth, errors and account creation. Do not ship the concept’s no-auth sample as authentication.
4. **All supported reps:** extend the grammar to list/compare/context/words/timeframe/check-in. Tactility must remain appropriate to purpose. Preserve exact labels, future-only dates, optional capacity metadata and payload-free note callbacks. No new response schema.
5. **Honest Mirror and commitments:** use the selected reading surface with unchanged Accurate/Partly/No/Not sure, all correction reasons and optional-note privacy. Present a commitment as the user’s sentence and timeframe, with neutral status; no task-management redesign.
6. **Longitudinal Mirror:** Claude supplies an approved read model including eligible reflections, feedback/correction state, exact-choice provenance, practice facts, commitments and approved shifts. Implement beginning → factual records → eligible interpretations without fabricated day milestones. No production archive until this exists.
7. **Utility and quality:** Me/privacy get the smallest expression of the world. Verify local retention/sign-out wipe, real magic links, five widths, zoom, keyboard, VoiceOver/TalkBack, reduced motion, long labels/prompts and intentional multilingual typography.
8. **Controlled release:** only after creative approval and functional/privacy QA, prepare a separate reviewed rollout and domain cutover. No framework/dependency upgrade is bundled with visual adoption.

## Boundaries that remain non-negotiable
The prototypes do not persist answers or claim to know the visitor. `nextStep` owns sequencing; options and unknown emit exact `StepAnswer` shapes. Existing components own optional words, safety detection, future-date validation and Partly correction. A fixed engine-generated example uses fictional history and is labelled as separate from the sample; feedback updates demo UI only. These previews are not a new production feedback implementation. No engine, selection, schema, persistence, evidence or safety rules were edited.

## Evidence
See [validation and limitations](VALIDATION.md), the 84 representative screenshots in `validation/screenshots`, and reproducible browser checks in `creative-review/verify.py`. Standalone SVG studies are in `artwork/aperture.svg`, `artwork/weave.svg` and `artwork/field.svg`. Original vector artwork source is `creative-review/Artwork.tsx`; no stock illustration or generated logo is used.

## Representative screens
| Direction | Desktop | Phone | Inner Rep | Mirror |
|---|---|---|---|---|
| Aperture | [1440×900](validation/screenshots/aperture-hero-1440.png) | [390×844](validation/screenshots/aperture-hero-390.png) | [Paired frames](validation/screenshots/aperture-rep-390.png) | [Response and reflection](validation/screenshots/aperture-mirror-390.png) |
| Weave | [1440×900](validation/screenshots/weave-hero-1440.png) | [390×844](validation/screenshots/weave-hero-390.png) | [Response ribbons](validation/screenshots/weave-rep-390.png) | [Material leaves](validation/screenshots/weave-mirror-390.png) |
| Fieldnotes | [1440×900](validation/screenshots/field-hero-1440.png) | [390×844](validation/screenshots/field-hero-390.png) | [Observation slips](validation/screenshots/field-rep-390.png) | [Annotated evidence](validation/screenshots/field-mirror-390.png) |
