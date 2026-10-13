# Aperture expansion — working frontend and integration handoff

13 October 2026. Branch `codex/mirar-aperture-expansion`. Based on approved frontend `aa9a16d`, with `origin/mirar-integration` at `3dfebc3` merged into this isolated feature branch (`c45f938`). This imports Claude’s current repaired read models; none is edited by the creative work. No production merge or release.

## The realized experience

One Aperture system: fixed source / revisable plane / open edge. The canonical artwork and its actual alpha remain the window boundary. Editorial contrasts replace an even sequence of beige chapters; selected paper and charcoal spreads create variation without gauges or ambient animation.

- **Landing:** approved sample untouched; compact hero; charcoal practice spread; six everyday scenes with distinct paired facts and switchable perspectives; a read-only, clearly fictional five-layer Mirror study; a short returning folio and point-of-use privacy. Six capacities describe relevance, not levels or a promised new catalogue.
- **Entry and introduction:** two complementary planes, ordinary email field and existing callback states. Onboarding asks no setup questions and leads straight to Today. Hosted review labels sign-in as simulated and offers a no-email continuation. Production auth/store logic is unchanged.
- **Today:** a generous invitation beside the actual next prompt from the unchanged `nextStep` contract, not invented personalized copy. Resume and done are unchanged. No continuity cue is fabricated when the supplier is absent. Practice-days remain an unranked supplied fact.
- **Supported rep:** existing `V2RepFlow`, same answers, same sequencing and callback semantics.
- **Completion:** exact receipt questions and selected responses are juxtaposed, including uncertainty, absence and genuinely chosen commitments/timeframes. Single choices do not receive a claim of a breakthrough. Receipt/state models remain Claude’s.
- **Honest Mirror:** the possible-reading plane is distinct from the count plane; count is explicitly not a cause. All four feedback choices, correction reasons, optional unstored note, failure handling and safety behavior are preserved.
- **Longitudinal Mirror:** supplied practice facts, chosen intentions, current readings, history of corrections/rejections, unknowns and collapsed source responses have distinct surfaces. Claim text is never reconstructed by the UI. Approximate provenance is labelled; retained-history limits stay visible. Empty and sparse states remain complete legitimate views.

## Candidate pilots — explicit contract request to Claude

These components are frontend-only authored scenarios, not engine exercises. They accept no personal free text, have no network/storage/analytics calls, and are never passed `StepAnswer` or runtime completion callbacks. A pilot does not appear in `runtime.receipt()` or `runtime.mirror()`.

### Look Again

Scenario ID `quiet_meeting`: a meeting ended; someone said very little. The user switches the possible reading (disagreement / listening / reason unknown) and can separate the two planes or place them alongside. The first reading and uncertainty are equally legitimate. The fixed scene never changes with the reading.

Local input: `{reading: first | another | unknown | null, apart: boolean}`. Closing is unavailable until a reading is selected, with an always-available unresolved exit. Changing a reading clears only the previous local closing so the revised view can be closed again. No causality, before/after rating or success claim.

### Attend

Scenario ID `quiet_half_hour`: a colleague’s message, an unfinished page and time to rest meet one fictional half-hour. The user places demands in **view / edge / open**. Every demand has the same controls. A maximum of one can sit in view; moving another into view leaves the earlier demand open, not silently set aside. Rest has the same standing as work. Everything may remain open.

Local input: `Record<message | page | rest, open | view | edge>`, with ≤1 `view`. All 20 valid configurations are supported. Closing describes the arrangement, not an action or improvement. The user can revise or reset it without penalty.

### Local output (both)

`PilotReceipt = { mode: fictional; family: look_again | attend; scenario: quiet_meeting | quiet_half_hour; visible: string[]; alongside: string[]; unresolved: string[]; commitment: null }`.

Labels are authored and rendered only in component memory. **This is not Claude’s Receipt contract.** No attempt to sanitize it into engine answers or carry it into authenticated history is made.

Before authentic wiring, Claude must confirm or amend:
1. Exact supported family IDs and legal step/input schema, including reversibility and an unknown/leave path.
2. Whether a view/edge arrangement is an answer, transient presentation, or an observation; it must not become personal evidence by default.
3. Any commitment step and its separate explicit consent. The current prototypes commit nothing and have no deadline.
4. Engine/catalog version, selection policy, optional context handling and approved authored content. The UI must not choose the next family.
5. Safety/privacy policy for any personal wording, if proposed; these pilots collect none.

No proposed pilot input is wired to the frozen engine, and no schema, migration or retention decision is assumed approved.

## Full review journey

`review/ExpansionReview.tsx` supplies simulated account entry plus the actual unchanged runtime with a private in-memory KV. All seeded records are explicitly fictional. Default is an empty first visit. The review nav visits landing, Today, both pilots, Mirror, Honest Mirror and account/privacy. Record controls show actual model output for retained synthetic records; they are not day-based unlocks or fabricated account history. Reopening the runtime tests the actual stored-in-memory receipt; reloading the browser clears the whole review.

The Honest Mirror study uses an engine-generated synthetic fixture with simulated callbacks, explicitly labelled. It does not derive anything from the public sample or either pilot. Authentication delivery and cross-domain session behavior are **not** validated by this harness.

## Release boundary

Claude owns application integration, auth, official landing build pipeline and production release. Codex only builds an isolated publicly accessible review preview in the existing `mirar-creative-review` project. No deployment to `mirar.life`, production alias, app promotion, production secrets, migrations, retention changes or framework upgrade.

Landing production entry remains `landing/main.tsx` with the complete verified configurable destination; official privacy/terms/cookies links remain unchanged. `landing:build` keeps its existing verification gate. Do not run the included release script from this feature branch without Claude’s controlled integration: it changes a separate landing checkout.

## Integration checklist for Claude

- Review new authored capacity scenes and the inert Mirror study for language/evidence accuracy.
- Integrate frontend components only; keep host/store/runtime contracts, repaired eligibility and receipts authoritative.
- Use actual `TodayView` and `runtime.receipt()`; use `runtime.mirror()` with the approved reading-history gate. Never import review fixtures into the app.
- Keep pilots in an explicitly fictional review surface until the input/output questions above are settled and a versioned engine/catalog amendment is approved.
- Confirm live magic-link entry/sent/expired/error behavior separately; no fabricated auth success from this review.
- Rebuild the official landing with its existing verified destination and unchanged legal routes. Run the integrated staging checks before deciding production release.
- Native VoiceOver/TalkBack, Hindi/Gujarati typography, content comprehension and safety/legal specialist review remain distinct requirements. No human test results are invented from pending invitations.
