# Daily Inner Rep — final Codex polish integration

Branch `mirar-v2-integration`. Not deployed. No Supabase migration. No engine change.

## 1. Provenance

| | Commit |
|---|---|
| Prior integration HEAD | `c0e8ebc` |
| Codex polish | `23ec30d` "Polish Daily Inner Rep presentation against v2.0.1 correction contracts" |
| Engine tag (authoritative) | `inner-rep-engine-v2.0.1-correction-fix` (`fb181df`) |

`23ec30d` was fetched from the Codex worktree (`codex/mirar-v2-visual`) and fast-forwarded in. The hash is preserved; nothing was cherry-picked or recreated. This document is the only commit on top.

## 2. No-product-logic verification

- Diff `c0e8ebc..23ec30d` is empty for `lib/ stores/ app/ scripts/ supabase/ package.json package-lock.json docs/V2_CONTRACTS.md docs/V2_FEEDBACK_SEMANTICS.md`.
- `lib/innerRep/v2` and `scripts/sim` are identical to the v2.0.1 tag.
- Mixed files reviewed line by line:
  - `DailyExperience.tsx`: header control only at `stage === 'rep'`, label from `NAV_LABEL.backToToday`; `capacityLabel` rendered only when present.
  - `Foundation.tsx`: `Prompt` gains `compact` / `reveal` (scroll + focus) props.
  - `HonestMirror.tsx`: correction reasons become selection rows under a compact heading. Same `send(reason)`, `setPendingReason`, safety check and note-clearing path.
  - `Interactions.tsx`: read-only commitment timing line from `step.context.commitment`; `aria-describedby` on the date field.

## 3. Test results

| Suite | Result |
|---|---|
| `tsc --noEmit` | clean |
| Frozen engine suite | 85 / 85 |
| Correction suite | 17 / 17 |
| Runtime / adapter suite | 18 / 18 |
| 420-run sweep | only the known selection-bias-A tail (1 of 20 seeds reaches a partner-driven Relationships rep on day 18, target ≤ 17) |
| `expo export --platform web` | passes (built with dev mock on; not deployable, `dist` removed) |
| `npm run visual:build` (Codex harness) | passes |

The selection-bias-A tail is the only accepted finding. The engine was not tuned.

## 4. Browser walkthroughs (integrated build, dev mock)

All pass.

- **First session:** Today → Begin → rep → follow-up → context → completion. Header reads "Back to Today". No orientation step. `role="main"` present.
- **Honest Mirror:** Accurate (no correction step); Partly with each of `situation_right_meaning_off`, `importance_overstated`, `something_missing`, `changed_since`, `prefer_not_to_say` (stored on `insight.correction.reason`), plus Skip (Partly kept, no correction); No (domain rests); Not sure (unsure flag only). Correction rows also work by keyboard (Tab → Enter stored `situation_right_meaning_off`; visible 2px focus ring).
- **Free text:** optional words and the correction note with sentinel strings left no trace in localStorage, sessionStorage, IndexedDB, DOM after completion, URL, network or console. A crisis phrase in the note shows the safety panel and stores nothing.
- **Commitments:** create → timeframe (Today · Tomorrow · This week · Pick a date · No deadline · Skip) → follow-up shows "You mentioned: <label>. How is that going?" with the timing line and no capacity label. Done, partly, postponed (Today omitted), changed mind and dropped all store as chosen; no failure wording.
- **Returning:** completed day reopens as "Done for today."; interrupted rep → reload → Resume at the next step; sign-out leaves only unrelated keys, and signing back in starts clean.
- **Responsive / accessibility** at 320×568, 390×844, 768×1024, 1024×768 and 1440×900 on Today, choice, chips, mirror, correction list, correction note, timeframe and date picker: no horizontal overflow, no targets under 44px, no axe violations in Codex content. Focus lands on the new prompt or heading at each step.

## 5. Integration defects

None.

## 6. Notes recorded for later (not changed)

- Shell tab bar: inactive-label `color-contrast` (×3) and `region` (bar sits outside the `main` landmark). Pre-existing, outside Codex content.
- Commitment timing line reads bare "Today" / "Tomorrow"; wording such as "Planned for today" is an aesthetic option.
- The commitment prompt names the commitment; its date appears only in the timing line.

## 7. Local review build

Local only. Never deploy a build made with the mock on.

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_INNER_REP_V2` | env / `.env.local` | Default on. `0` falls back to the v1 Home. |
| `EXPO_PUBLIC_DEV_MOCK=1` | `.env.local` (gitignored) | In-memory mock Supabase and an auto-signed-in demo user. Baked into any export. |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` (see `.env.example`) | Only needed without the mock. |

v2 state is device-local (`mirar_inner_rep_v2:<userId>` in AsyncStorage / localStorage). No v2 table exists; `docs/proposed/017_v3_FINAL_after_simulation.sql` is a proposal and is not applied. Sign-out wipes the local state.

Live dev server:

```bash
npx expo start --web --port 8081
```

Static build (local only):

```bash
npx expo export --platform web && npx serve dist
```

Codex review harness (port 5174):

```bash
npm run visual:review
```

Browser scenarios for a chosen path "today" (rerun when the date changes):

```bash
npx tsx scripts/runtime/scenarios.ts
```

## 8. Not deployed

No production deploy, no Supabase migration, no push in this task.
