# Integration status — branch `mirar-integration`

Updated 12 October 2026. Release owner: Claude. Experience authority: Codex.

## What is on this branch
| Source | Commit | Notes |
|---|---|---|
| `main` (production app) | `8850cfc` | Base. Unchanged in production. |
| `mirar-product-value` | `6afcd1b` | Receipt read model, exact step resolver, typed Mirror contract (repaired for Codex gates M1–M7), docs, tests |
| `codex/mirar-unified-experience` | `9488ff5` | Reconciled contract and creative prototypes (docs and `creative-review/` only; **no production landing code**) |
| Honest Day-One (M1) | `9ef7d95` | Presentation wiring on top of both |

History is preserved by merge commits. No force-push, no rebase of shared branches.

## Honest Day-One (M1): delivered behaviour
- **Receipt from the runtime.** `runtime.receipt()` supplies the exact prompt (including per-user variants and lens/follow-up option sets) and the user's exact choice. It survives a reload. Verified in a browser (local and hosted staging).
- **Integration release depends on what happened.** "I don't know" → "Not knowing is a complete answer." and ends. An honest "nothing" choice → "Nothing to look at today is a real result." A chosen commitment → its label and timeframe, no promise of a follow-up. Otherwise a one-line description of the operation the user performed. The generic "Notice once, later today…" instruction is gone.
- **Honest Mirror acknowledgements** follow Codex's reconciled table and the engine's real behaviour. Accurate "Your response is recorded." Partly "This reading needs qualifying. It won't be repeated unchanged." Reason recorded "Your correction is recorded: …". No "This reading is set aside." Not sure "No conclusion added. This reading will wait." Skip ends the interaction. Failure never shows success.
- **The Mirror renders only `runtime.mirror()`.** Sections appear only when they have statements. A Partly-qualified reading is never reproduced unchanged; it appears as "You said a reading was only partly right… Mirar won't repeat it unchanged." The ledger is collapsed.
- **Onboarding without the quiz.** One authored statement, then Today.
- **Discovery: the fictional example is inert** (no live feedback buttons) and labelled as not connected to the sample.

## Contract repairs made after Codex's review (all tested)
M1/M7 current eligibility · M2 exact prompts (the resolver) · M3 provenance flag (`approximate` for recurring counts until amendment A5) · M4 typed facts with denominators · M5 honest unpractised copy · M6 retention window and truncation flag. 20 contract checks, including a mutation-checked Partly gate.

## Tests (this branch)
TypeScript clean. Engine 85/85. Correction 17/17. Runtime 18/18. Mirror 4. Mirror contract 20 checks. Receipt 8 checks. Codex review build passes.

## Staging (not production)
Hosted, behind Vercel protection: a demo-auth build with review states enabled (`mirar-7njn2n8wq-…`), and a production-equivalent real-auth build (`mirar-jsap1qbdq-…`). Neither is promoted.

## Not done / blockers
- Codex's production Aperture landing is not on any branch yet; nothing was released to `mirar.life`.
- `ADMIN_SECRET` in Supabase still needs rotation by the account owner.
- First-time signup and the sent-email content are untested (need an inbox).
- The live `/privacy` and `/terms` at `mirar.life` describe the retired v1 product. See `docs/infrastructure/MIRAR_ROUTING_AND_CONFIG_CONTRACT.md`.
- Hosted accessibility re-scan at all five widths, 320 and 768 and 1024 geometry, and native-device testing were not re-run on this build.
- Decisions D1–D6 (`APPROVAL_DECISIONS.md`) are pending. None was applied.


---
## Update, 12 October 2026 (Aperture integration and landing release)

- **Merged:** `codex/mirar-aperture-build` (`0a47691`) into `mirar-integration` (merge `e138569`). Seven presentation conflicts were resolved by hand in favour of Codex's Aperture components; the runtime/store wiring, `runtime.receipt()`, `runtime.mirror()` and the eligibility repairs were kept. The Mirror route now passes `readingHistory="approved"` because current eligibility is enforced and tested.
- **Landing:** Codex's `landing/` build integrated into `mirar-landing` (`fc91151`) and released to `https://mirar.life/`. Primary CTA: `https://mirar-app.vercel.app/login`. Legal pages rewritten (`docs/legal/LEGAL_REVIEW_FLAGS.md`). Google Analytics removed.
- **App:** not promoted. Staging: demo-auth `mirar-an79ew3wn-…`; real-auth production-equivalent `mirar-ns7z550pl-…`.
- **Still open:** `ADMIN_SECRET` rotation; first-time signup on a new email; qualified legal and safety review; D1–D5.
