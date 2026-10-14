# Real-auth staging test record: `https://mirar-unified-real.vercel.app`

Tested by the account owner on 14 October 2026 with a first-time email account, after the owner-approved redirect entry `https://mirar-unified-real.vercel.app/auth/callback` was added in Supabase (one entry; Site URL and the other three entries unchanged; verified after reload). Build: reconciled `mirar-unified-final`, app code `988bc0b`. Observations below are the owner's, quoted as reported; "as observed" means the owner did not capture further detail. I observed none of them myself (a magic link returns to the browser that opens it, and I did not generate or access any link).

## A. Authentication: PASS
| Step | Result |
|---|---|
| First-time signup and email verification | **PASS** |
| Redirect to authenticated Today | **PASS** |
| Daily Inner Rep completion | **PASS** |
| Unfinished Look Again: refresh and resume | **PASS, as observed** |
| Sign-out | **PASS** |
| Returning magic-link login, same email | **PASS** |
| Return to Today | **PASS** |

Gate effect: the real-auth gate "first-time signup and returning login work on the staging build" is **satisfied**. The redirect entry did its job (the link returned to the staging build, not to production).

## B. Continuity observations after sign-out and sign-in (same email)
1. The previously completed Daily Inner Rep was **available again** (Today offered a rep, not the "done" state).
2. The **Mirror was empty**.
3. The post-sign-out state of the **unfinished pilot** was **not separately confirmed**.

## C. Diagnosis
**Observations 1 and 2 are the expected consequence of the approved device-local design, not an extra defect.**
- Sign-out runs `clearInnerRepV2Data()` (`stores/auth-store.ts` → `stores/inner-rep-v2-store.ts`), which removes every `mirar_inner_rep_v2*` key on the device and the pilot keys, by design ("sign-out clears the local copy", `DURABLE_HISTORY_DECISION_MEMO.md` §5 and the Privacy copy).
- All engine state (instances, observations, readings, commitments) lives only in that device-local blob. There is no server copy. After sign-in the runtime therefore starts from nothing, exactly like a new user on a new device: the engine has no record that today's rep was done, so it offers one, and the Mirror (a pure function of that stored state) has nothing to show.
- The two observations are the same fact seen twice. If "the completed rep was available again" had instead meant the *done* state, the Mirror could not have been empty.

**Two consequences worth stating plainly, neither a bug in the approved behaviour:**
- **The one-rep-per-day rule is enforced only by the local state.** After a sign-out and sign-in, a person can complete today's rep a second time. There is no safety or evidence harm (the first one is gone with the device data), but it is real. Only server-side history (memo §5, the unique `(user_id, day)` index) closes it.
- **The cost of continuity is borne by the person:** signing out, a cleared browser, or a different device each erase their practice. The Mirror's promise of "what changes over time" cannot be kept across any of these without durable history (memo §2).

**Observation 3: one real defect found while tracing it (fixed on the branch, not yet verified in the hosted build).**
- *Storage* is cleared correctly: sign-out calls `clearPilotKeys`, so a reload after sign-out cannot restore an unfinished pilot or any pilot record.
- *Memory* was not: the pilot store's in-memory records and unfinished session were not dropped at sign-out (`clearPilotData` existed but was never called, and would not have dropped them anyway; the engine store was reset, the pilot store was not). Within one browser tab, without a reload, the next account to sign in could briefly render the previous account's pilot offers (for example "Resume Look Again") until the store reloaded. Not durable and not a data store, but a cross-account leak on a shared device, and contrary to the approved clearing behaviour.
- *Reproduced* as a regression test at the store level (storage cleared, memory still readable), not in a browser.
- *Fix:* `PilotStore.dropMemory()` plus `resetPilotMemory()`, called from sign-out through the existing staging-only gate (`process.env.EXPO_PUBLIC_PILOTS === '1'`), so Production bundles gain nothing (verified: no pilot code in a clean production-equivalent export). Three new tests pass; engine suites unchanged. No migration, no sync, no retention change.
- *To confirm on the real build once redeployed:* start Look Again, answer one step, sign out, sign in with the same email: expect **no** "Resume" offer and empty practice. Repeat signing in with a second email in the same tab without reloading: expect no trace of the first account.

## D. Recommendation: meaningful continuity, privacy and control preserved
Use the existing decision memo; do not start a new architecture. **Option B (opt-in "Back up my practice", default off, event-sourced, owner-only RLS, first-class delete, structured data only)** remains the recommendation, and this test is the first real evidence for it. Concretely, in order:
1. **Now, no data-model change (needs your approval, because it changes what the person is told, not what is stored):** make the sign-out consequence explicit at the point of action: "Signing out removes your practice from this device." with a clear cancel. Today the person learns it only by losing it.
2. **Approve option B in principle** (memo §8.1), then **approve the disclosure wording** (§8.2) and **a qualified review of retention and backup statements** (§8.3). Nothing is built before those.
3. **Staging-only build and test run** (memo §8.4): the schema, whitelist function, RLS test with two real accounts, replay-equivalence test, and the one-rep-per-day constraint. This also closes the repeated-rep gap above. I would build it behind `EXPO_PUBLIC_HISTORY_SYNC` and the per-user `sync_enabled` flag, off by default, with the migration cases (local-only, server-only, both) exactly as in memo §5 and never a silent overwrite.
4. **User control that needs no server (optional, smaller, can come first):** an export-and-import of the person's own structured practice as a file ("Keep a copy of my practice"), which gives recovery and device moves without any server data. It is in the memo's migration section as a fallback; promoting it to a feature would need your approval.
5. **Not recommended:** default-on sync (memo option C) or changing sign-out to keep data by default. The clear-on-sign-out protects shared devices; if you want "keep on this device" it should be an explicit choice at sign-out, default clear, and it changes retention behaviour, so it needs a separate approval.
6. **Pilots follow the engine:** pilot records should join durable history only after the engine's does, as their own event kinds, with the same source separation in the Mirror. Nothing about A6, A7 or A8 changes.

Until these are decided: continuity is device-local, sign-out erases it, and the Mirror honestly shows what the device holds.

## E. Still open before any v2 promotion
Historical admin-endpoint log review (owner, dashboard; coverage depends on plan retention); safety and helpline copy sign-off; human comprehension testing of both pilots; Codex's final visual review of the hosted build; the continuity decision above; and verification of the in-memory fix on the real-auth build. Production promotion stays **blocked**.
