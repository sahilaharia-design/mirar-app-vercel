# G3 frontend reconciliation evidence

15 October 2026. Frontend source `3cca3162066402246f495c3526da724e860c4a2c`. Authoritative G3 dependency: `5dcd3ab`; brought into the existing frontend branch by merge `6b90044` without changing runtime files. PR #5 remains the review; no new creative branch/public preview or production deployment.

## What was tested

The browser review now uses the **actual G3 ContinuityController, engine, recorder, replay, MemKV and StubService**. State transitions are produced by real operations on synthetic history, not manually assigned success snapshots. The service and file saver are explicitly simulated and write no network account or filesystem file. This is not a real service, security or physical-file-save verification.

- **170 broad browser axe audits:** all five requested viewports (320×568, 390×844, 768×1024, 1024×768, 1440×900), all thirteen real controller phases, export-on/off conflicts, deleted-copy decision, notices, errors, refused/cancelled saves; off, all three delete/clear screens, recovery, both save-first confirmations, unsent sign-out, Today/Mirror/Me. `matrix.json`.
- **16 functional browser axe audits:** explicit read (zero calls on mere navigation while off), actual delayed service acknowledgment, safe error/retry, turning off, unsent/server flag pending, explicit replay recovery, no-export conflict suppression, save cancellation before adoption, saved-device/account copy before conflict choices, all destructive confirmations disabled without saver, combined save cancellation and confirmed completion, account-only deletion keeping device, blocked deleted-copy decisions, keyboard Tab/Enter with reduced motion. `functional.json`.
- **30 compiled Expo-app axe audits:** actual mock-auth app routes at all five sizes: Today → Me direct Sign out → consequence screen → Cancel → history → explicit check → Mirror. Final sign-out checked that no previous continuity status/day remains visible. `app-results.json` includes that non-axe assertion separately. These are actual app hosts, not the standalone review renderer.
- **5 blocked re-upload confirmation audits:** every width, explicit consequence screen acknowledges missing controller binding and prevents submission. `upload-screen.json`.

**221 recorded axe audits, zero violations and zero incomplete.** No horizontal page overflow or enabled targets under 44×44 in the broad matrix. All visible service results are labelled simulated. Last-confirmed dates suppressed outside enabled/ready/verified/zero-pending. Functional review observed zero local/session storage writes and zero remote resources. Actual Expo app intentionally uses the existing device-local staging store; this is not confused with account persistence.

Validation was progressive: the broad static review preceded final app-only route/landmark/scroll fixes; the compiled-app checks cover those fixes. Intermediate failures/reruns are excluded from the recorded totals. Two material integration fixes found: React Navigation consumes reserved `screen` routing parameters (changed to `intent`); the sibling review panel covered 320px confirmation controls (moved inside the settings scroll flow and given a named region landmark). Final direct sign-out, Cancel and explicit Check clicks succeed at every width.

Unchanged owner's `continuity.test.ts` passes and produces all 13 controller phases. Existing `account-isolation.test.ts` passes all 13 checks. These are controller/store tests, not two real inboxes. TypeScript, Vite review build and clean Expo staging export pass. A clean default-off Expo export also passes and contains none of the new continuity UI markers. Existing bundle-size and React Native web directive notices remain; no package change.

`git diff 5dcd3ab -- lib stores app docs/proposed assets design-system` is empty: no runtime, persistence, authentication, SQL, engine/evidence, canonical artwork or tokens altered by this frontend patch. Hosted Vercel previews were not overwritten. Physical-device touch, native screen readers, human comprehension, real file picker, real Supabase/account recovery and qualified retention review remain unverified release gates.

## Required owner follow-through

This is **not full behavioral approval**. See the updated `CONTINUITY_FRONTEND_HANDOFF.md`:

- Deleted-copy upload/stay-local dispatch is absent in `5dcd3ab`; general clear leaves a pending decision. Frontend types/confirmation exist but host capabilities stay false until owner binds these properly. No fake success is substituted.
- V1 says verified file before every destructive act. The owner controller currently skips export for some identical-copy account-delete/device-clear paths. Frontend blocks without a saver; saver availability alone is not a verified file. Combined deletion must protect account-only history too.
- Conflict choices reached from an off-state explicit check can complete with backup still off; browser records actual returned state instead of forcing ready. Owner should confirm one-time-operation semantics.
- Version rejection, background withdrawal ordering, real OS save confirmation, identity/security and qualified disclosures remain owner boundaries.

## Reproduce

Build `npm run visual:build`, serve `dist-review` locally (for example port 5197) and set `MIRAR_G3_URL=http://127.0.0.1:5197/?continuity`:

```
python3 scripts/frontend/verify-continuity-g3.py matrix
python3 scripts/frontend/verify-continuity-g3.py functional
```

Use `AGENT_BROWSER` when not on PATH; `MIRAR_G3_DIR` selects a fresh output directory and `MIRAR_G3_SESSION` a separate browser context. Static review builds avoid development hot-reload resets.

For the compiled Expo app, build with synthetic public URL/key plus mock/review/history flags on, export flag off; serve with SPA fallback and `MIRAR_G3_APP_URL` (default port 5200):

```
python3 scripts/frontend/verify-continuity-g3-app.py
```

The five blocked-upload confirmations and screenshots were additional targeted checks using `?continuity&screen=upload_again` in the review harness only. This is not the production router parameter (actual Me uses `?intent=signout`).
