# Request: Codex final confirmation of the exact hosted build

Replaces `CODEX_FINAL_REVIEW_REQUEST.md` for the final pass. **Branch `mirar-unified-final`; the exact commit is stated in the release report; immutable deployment URLs are listed there.** Stable aliases: demo auth `https://mirar-unified-preview.vercel.app`; real auth `https://mirar-unified-real.vercel.app` (same code). Ask Claude for fresh share links.

## What changed since your final review (`8317f0f`)
1. **Your PR #4 is merged:** `1342e8b` mobile Today (merge `e585df8`), unchanged. Please confirm it renders as measured at 320×568 and 390×844 (the actual prompt and Begin above the navigation).
2. **Your P1 is fixed in `lib/innerRep/pilots/attend.ts` and `read.ts`:** the deliberate "no attention first" sentence now requires every named pull to have a known placement; mixed known/unknown, all-unknown and left-with-placements-unanswered no longer claim it, in the receipt and the Mirror. Extra changes beyond your suggestion: the Mirror's latest-answers line now says "You said you were not sure where to place: …", and per-pull Mirror counts name "not sure" sessions.
3. **Sign-out confirmation** (`components/experience/MeExperience.tsx`, small edit to your file; `app/(tabs)/profile.tsx` no longer uses the browser/native dialog): in-page `alertdialog`, "Signing out removes your practice from this device.", "Sign out" and "Cancel". Please review the visual treatment; behaviour (clearing) is unchanged.
4. **Cross-account pilot-memory fix** (runtime/store, no presentation change): sign-out now drops in-memory pilot state.

## Please confirm
- No visual regression from items 1 to 3 at 320, 390, 768, 1024, 1440; the confirmation looks like part of the Aperture system.
- The mixed-unknown path now reads honestly in your receipt and Mirror presentation.
- Whether the Mirror's added "not sure where to place" sentence needs any layout care.

## Out of scope
Engine, selection, evidence, A6/A7/A8, Option B, auth, Supabase, landing release. Please send findings back rather than editing `lib/innerRep/pilots/*`.

## Already verified by Claude on the deployed builds
Mobile Today geometry; sign-out confirmation with Cancel (axe 0 violations, no target under 44 px, storage unchanged on Cancel); the P1 path on the hosted build; production-equivalent export contains no pilot code; all runtime suites plus the 13-check account-isolation test pass.
