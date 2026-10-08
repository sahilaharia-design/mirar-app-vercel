# Codex alignment review

Reviewer: Claude (product/engineering authority). Subject: `codex/mirar-creative-explorations` at `460d326` and `ad4d6a9`, read from `docs/creative/CREATIVE_REVIEW.md` and `docs/creative/BRAND_REFINEMENT.md`, plus the earlier shipped experience (`6c6f0d0`, `docs/experience/*`). The live Preview was not opened for this review; findings are from the repository documents and code, and the claims they make about their own validation are taken as Codex's, not re-verified.

`docs/experience/MIRAR_UNIFIED_EXPERIENCE_CONTRACT.md` does not exist on that branch yet. This review is written without it. The product side of the contract is [MIRAR_VALUE_AND_RUNTIME_CONTRACT.md](MIRAR_VALUE_AND_RUNTIME_CONTRACT.md) §9.

This is not a rubber stamp and not a push back toward the questionnaire. Where Codex is right and the engine cannot yet support it, the answer is to build the capability (see [ENGINE_CHANGE_PROPOSALS.md](ENGINE_CHANGE_PROPOSALS.md)), not to shrink the experience.

---

## 1. Ideas that strengthen product value

| Idea | Why it earns its place |
|---|---|
| **Response and reading are separate planes** (Aperture's core rule, Fieldnotes' discipline) | This is the product's honest distinction (USER SAID vs INFERRED) made visible. It maps exactly onto `MirrorStatement.source` in the contract. The strongest idea in the branch. |
| **Evidence as annotation with provenance, "turn the observation over" to expose its limit** (Fieldnotes) | Makes "why am I seeing this" immediate and shows limits, not hidden advice. Supported by `facts` and `trace` in the contract. Adopt inside the Mirror and Honest Mirror. |
| **"Read separately / Read alongside"** | Cheap, accessible, and genuinely useful: lets a person inspect a reading without it blending into what they said. Presentation only; keep. |
| **Exact-response integration artefact** (all three) | Returning the person's own choice is honest and good. Needs a better *closing* around it (contract §4), but the artefact is right. |
| **"Aperture = change the frame" as a mechanic, not a logo** | Maps onto a real exercise family (F3 Reframe) where the frame shift is the practice. If it stays only decorative it is weak; if it becomes the Reframe mechanic it is the best fit between creative and function in the branch. |
| **Mark-defined edge from the canonical alpha, no redrawn logo** | Brand integrity and a stable boundary. No product impact; correct. |
| **Uncertainty without failure; open space is legitimate** | Directly matches the sparse/empty Mirror states. |
| **Missing evidence never animates into an answer; corrections do not "crack or stain"** | Correct emotional posture for rejection. Keep as a design rule. |

## 2. Beautiful but functionally weak

| Element | Concern |
|---|---|
| **The three-state authored story on the landing** ("whole field → one thing → return") | It performs an idea but the visitor does nothing that resembles the exercise. A real sample rep already exists; the story risks being the more memorable thing and the less honest preview. Prefer the sample as the hero interaction. |
| **"Notice → Choose → Look again" as the universal grammar** | This is the same risk I identified in my own "Notice → Name → Try": one three-step shape for everything becomes a formula, and it fits some families (Reframe, Integrate) and not others (Settle, Recover, Attend). Keep it as the *brand verb*; do not make it the structure of every rep. |
| **Explicit Continue after every paired choice** | Adds a tap to every compare rep. Justified for paired truths (a considered choice), not for list choices where auto-advance is kinder. Test it; do not generalise. |
| **Weave's material interlacing** | Unambiguously warm, but the strands carry no function, and Codex itself names the risk: density reading as progress. It is an attractive alternative with the most room for accidental scoring semantics. |
| **Capacity explainer / long "not available yet" Mirror chapters** (current shipped Mirror) | Explaining unbuilt features makes the product feel less alive (Codex's own criticism, correct). Replace with the contract's sparse states. |
| **Illustrative future Mirror with fictional history** | Acceptable only while clearly labelled fictional and separate from real data. Never reachable from an authenticated session. |

## 3. Requires new runtime capability

| Creative need | Runtime requirement | Status |
|---|---|---|
| Real Mirror with response / reading / uncertainty | `runtime.mirror()` (contract v1) | **Built, tested** in `mirror-contract.ts`. UI is Codex's to wire. |
| Reading surface with tier, counts, verdict, correction | Fields `facts.tier`, `facts.independentN`, `verdict`, `correction` | Present in contract |
| "Mirar remembers" on Today | Supplier for `continuityCue` from open thread/commitment | **Not built** (W3) |
| Honest Mirror consequence lines | Presentation copy bound to existing behaviour (21 / hedged / 7 days) | Copy only |
| Reframe mechanic (alternative readings, weight shift) | New templates, new step types or option semantics | **Engine change** (A3) |
| Family-specific closings | Closing = f(session answers); needs the answers surfaced to the presentation layer | Partly possible now (answers are available at completion) |
| Cross-device history | Durable store | **Needs approval** (memo) |
| Intro choice ("what would you like to practise first?") | Cold-start template parameter | **Engine amendment** (A1) |

## 4. Conflicts with evidence, privacy or product rules

None of Codex's functional claims conflict with the frozen rules as written. Points to hold the line on:

- **"Read alongside" must never merge response and reading into one sentence.** Alongside means adjacent planes, each still labelled by source.
- **A rejected reading must not be reachable through Read separately.** The contract already omits it; the UI must not add a "show anyway".
- **No visual element may encode frequency or "completeness".** Codex states this; enforce it in review (Weave density, Aperture gap-as-meter).
- **Fictional demonstration data must never share a component path with real data.** Use a distinct prop/flag so a real session cannot render it.
- **No history mining in the UI.** All content comes from `runtime.mirror()`.
- **Explicit confirmation must not change the emitted answer shape.** Codex confirms this.

## 5. Simplify or reject

- **Reject** Weave as the primary system for the Mirror: highest chance of density-as-score. Keep as the alternative world only.
- **Reject** any circular lens, reticle or calibration vocabulary (Codex already removed it; keep it removed).
- **Simplify** the number of expressive moments: one per screen, as Codex proposes; resist a hero graphic on Me and Privacy.
- **Simplify** the Mirror's explanatory copy to what helps the person (see contract §7).
- **Defer** native date-control, screen-reader and device QA claims until tested; Codex lists them as limitations, correctly.

## 6. Recommendation

Adopt **Aperture ("the revisable window")** as the visual system, with **Fieldnotes' provenance grammar inside the Mirror and Honest Mirror**, as Codex recommends. I agree for functional reasons, not only visual ones:

1. The honest distinction at the heart of the product (what you said / what Mirar reads / what is open) is the thing Aperture's separate planes show. That is a product-meaningful visual verb.
2. "Change the frame" can become a real exercise (Reframe) rather than a metaphor.
3. It adds the least new machinery and keeps text live and accessible.

Conditions: (a) it must not become the structure of every rep (§2); (b) the Mirror UI binds to `runtime.mirror()` only; (c) any chosen interaction must have a stated purpose in the §9 table, otherwise it is removed.

## 7. Where my earlier blueprint evolves

| My earlier position | Now |
|---|---|
| Universal Notice → Name → Try | Dropped. Families, each with its own form and outcome (EXERCISE_FAMILIES). |
| Display-only authored "moves" as the payoff (P2) | Dropped as a payoff. Kept only as an optional last step in families whose objective is action. |
| Ledger of choices as Mirror section 1 | Kept as provenance, collapsed by default, not a payoff. |
| Readings as the main source of value | Daily value from the exercise itself; readings are a bonus. |
| "Try" step as the cure for the generic closing | The fix is a closing computed from the session's answers (contract §4), plus real mechanics. |
| P6 starting intent as a general selection bias | Reduced to a cold-start template choice (A1); soft prior deferred. |
| P1 durable history first | Still needed for a Day-30 promise; now an explicit opt-in proposal with a decision memo, not a default. |
| Mirror built from counts | Mirror built on a typed, traced contract (done); richest content depends on family F8 (noticing latency) and more stance-bearing options. |

## 8. What I would ask Codex for next

1. A Mirror wired to `runtime.mirror()` in each candidate direction, including `empty`, `sparse` and `populated` fixtures (fixture states can be produced from the review-state builder).
2. The Reframe interaction (F3) as a prototype: reading choice → best/least fit → weight shift, with Aperture planes as the actual mechanic.
3. The unified contract document, with each interaction mapped to the §9 table.
4. A decision on explicit confirm for list choices vs paired truths, after a five-person comparison.
