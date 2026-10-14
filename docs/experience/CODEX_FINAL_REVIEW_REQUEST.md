# Request: Codex final visual review of the exact hosted build

**Build under review:** branch `mirar-unified-final`, app code `988bc0b`.
**Hosted (protected, demo auth):** `https://mirar-unified-preview.vercel.app`, immutable `https://mirar-1do6dsr5q-sahilaharia-designs-projects.vercel.app`. Ask Claude for a fresh Vercel share link (they expire after about 23 hours).
**Source reconciliation:** see `docs/release/UNIFIED_STAGING.md`. Your PR #3 (`85b3322`) is incorporated and authoritative for pilot presentation; no presentation file of yours was edited in the merge beyond taking your version of the four conflicted files. The only app-code deltas on top of PR #3 are runtime-owned copy fixes in `lib/innerRep/pilots/*` and the fixtures double gate in `PilotsScreen.tsx`.

## Please review
1. Visual fidelity of Look Again and Attend, their receipts (completed and left-partway), Today with both offers, and the Mirror's pilot plane, at 320, 390 and 1440.
2. The four runtime-copy findings: confirm each corrected sentence reads honestly in your receipts (new texts: "Giving N of the M things…", "Part of what you named has a place…", "it was hard to tell what was pulling at you", and the sparse notice "A count across sessions needs 3 completed sessions of the same exercise… So far: Look Again N, Attend M").
3. Anything in the hosted build that differs from your own hosted validation of `85b3322`.

## Out of scope for this review
Engine, selection, evidence, A6/A7/A8, auth, Supabase, migrations, landing release. Please do not edit `lib/innerRep/pilots/*`; send findings back instead.

## Already verified by Claude on this build
32/32 end-to-end journey checks; 69 axe scans (0 violations); no overflow or undersized targets at 1440, 390, 320; production-equivalent export contains none of the pilot content. Evidence: `docs/release/unified-validation/results.json`.
