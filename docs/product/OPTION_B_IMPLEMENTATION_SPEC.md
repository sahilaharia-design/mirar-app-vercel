# Option B, implementation-ready: opt-in "Back up my practice"

**Status (15 October 2026, updated after G1):** design approved in direction with conditions (§16); **G3 local-only integration built and tested** behind a default-off flag with a stub service; **nothing executed against Supabase.** No migration has been run, no table exists, RLS is unchanged, no practice is stored on Supabase, sync is not enabled, production retention is unchanged. Every database statement below was executed only on a throwaway in-memory PostgreSQL 16 (PGlite) outside the repository's dependencies.

**Decision of record (founder, 15 October):** Option B from `DURABLE_HISTORY_DECISION_MEMO.md` is the intended architecture: explicitly opt-in, off by default, structured history that survives sign-out and moves across devices, with user control central. This is **continuity, not surveillance, scoring or a time-bound program.** This document is the implementation-ready version of that memo. It extends it; where it departs from it, §3 says so and why.

Builds on: `DURABLE_HISTORY_DECISION_MEMO.md` (architecture), `OPTION_B_BACKUP_PLAN.md` (consent flow and minimisation, 14 Oct), `REAL_AUTH_TEST_RECORD.md` (the evidence for it).

---

## 1. What a person gets
- Their practice survives signing out, a cleared browser, and a new phone, **if and only if they turned it on**.
- A Mirror that can mean "what has changed over time" because history persists.
- A way to leave: turn it off (stops new copies, keeps what is stored) or delete it (removes it for good). Two different buttons, two stated consequences.
- A file export and import of the same history, so continuity does not require a server at all if they prefer.

## 2. Architecture (one diagram, three layers)

```
 EVERY device, always (no consent needed, device-local, cleared at sign-out):
   runtime op ──▶ Recorder ──▶ local JOURNAL (structured events, calendar days, ids only)
 
 ONLY after explicit consent (state 'on'), per device:
   JOURNAL ──▶ SyncClient ──▶ ServerPort ──▶ inner_rep_append_events (SQL function)
                   ▲                                   │ owner-only, whitelist, ordering, consent
                   └──── pull + replay ◀── inner_rep_event (read-only table, RLS)

 Restore on a new device / after sign-out: pull events ──▶ replay through the FROZEN engine ──▶ identical state
```

Why a **local journal first**: the engine's state is a result, not a log, so importing "what is on this device" as events would be lossy (the exact answers are not recoverable from the state). Recording events from the first rep means turning backup on later loses nothing, export/import is the same data, and there is no migration of legacy state to design. v2 is not in production, so there is no legacy.

## 3. Departures from the memo, and why
| Memo | This spec | Reason |
|---|---|---|
| `id bigint identity` + `unique (user_id, seq)` | Primary key `(user_id, seq)` | the identity is the sequence; one fewer column |
| `user_seed` stored in the profile | **not stored** | the runtime derives it from the account id, identical on every device; less data |
| event kinds incl. `commitment_status` | `rep_completed`, `rep_abandoned`, `feedback`, `correction` | every commitment change is either an answer inside a rep or a deterministic function of the day: replay reproduces it, so storing it would duplicate data |
| `abandoned` implied | explicit `rep_abandoned` | the engine records an unfinished rep when the app next opens, and variety/burden logic depends on it; replay needs it |
| insight referenced by numeric id | referenced by **the day it was shown** | at most one insight per day; ids drift between devices, days do not |
| client inserts allowed under owner RLS | **clients have SELECT only**; all writes through `SECURITY DEFINER` functions | an inserted row must pass consent, whitelist and ordering; a leaked token cannot write arbitrary rows |
| whitelist "a server function" | whitelist **plus a server-side vocabulary of every id the engine can emit** (`inner_rep_catalog_vocab`) | makes "no free text" a data-layer fact: a string that is not a catalog id cannot be stored however it is spelled |
| not specified | optimistic concurrency (`base_seq`), non-decreasing day order, per-day single outcome, feedback-before-correction order | what makes multi-device safe and the log always replayable (§7) |
| not specified | consent text version + day recorded server-side | proves which wording was accepted; wording change forces re-consent |
| "import local state as events" | local journal from the first rep | see §2 |
| commitment labels stored | **not stored** | derived from option ids on replay; less data than the memo's payload |
Everything else (opt-in, off by default, event-sourced, owner-only RLS, first-class delete, no free text, no time of day, replay verification, rollback by flag) is as in the memo.

## 4. Data model (exact SQL: `docs/proposed/option-b/001_history_backup.sql` and generated `002_catalog_seed.sql`)
- `inner_rep_catalog_vocab(engine_version, kind, id)`: public reference data; 23 templates, the closed option set, 7 step ids. Generated by `scripts/runtime/gen-backup-catalog.ts`; a test fails on drift.
- `inner_rep_profile(user_id, engine_version, sync_enabled, consent_version, consented_on, last_seq, last_day, created_day, updated_day)`: one row per user. **No email, device id, IP, location, time of day, or seed.**
- `inner_rep_event(user_id, seq, day, kind, engine_version, payload)`: immutable, append-only, `payload` ≤ 2000 characters, keys and values constrained to the whitelist.
- Functions: `inner_rep_enable_backup`, `inner_rep_disable_backup`, `inner_rep_append_events`, `inner_rep_delete_my_practice` (granted to `authenticated` only); `inner_rep_validate_event`, `inner_rep_is_real_date` (internal, not granted).
- Indexes: one rep outcome (completed **or** abandoned) per user per day; one feedback and one correction per insight.

## 5. Event contract and replay equivalence
**Event** = one deterministic operation on the frozen runtime, stripped to ids and calendar days:
`rep_completed {day, template, frame, bound?, variant?, answers[ {s,k,o?|d?|tf?+date?} ]}`, `rep_abandoned {day, template}`, `feedback {day, insightDay, value}`, `correction {day, insightDay, reason}`. `words` is a marker with no payload. Safety stops are **never recorded** (no event, no marker, no count).

**Equivalence, defined precisely and verified:** replaying the events through a fresh runtime reproduces the original engine state **except** (a) `Instance.trace`, the engine's explanatory diagnostics, which the runtime strips from its stored copy at every reload and so legitimately differs between devices; (b) `State.day`, the last-served-day cursor, and one transient unfinished instance served today (history only once the app next opens); (c) internal instance numbering where a safety stop removed an instance. The **Mirror and receipt read models are identical.**
Verified over the 21-profile simulator corpus × 2 seeds: **42 synthetic users, 1,250 reps, 140 abandoned, 22 feedback, 5 corrections: 42/42 identical state, 42/42 identical Mirror and receipt**; with safety stops (13 stops, 18 users) behaviour identical apart from numbering. Also verified end to end **through the real SQL**: upload, pull, replay reproduces the original state.
Drift is detected, never silently restored: a different template than the engine would serve, a different engine version, an out-of-order log, or feedback for a day with no insight all raise a refusal; the person is offered export instead.

## 6. Row-level security and privileges
- RLS on all three tables; **only `SELECT` policies** (`user_id = (select auth.uid())`; the vocabulary is readable by any signed-in user). No insert/update/delete policy and no such grant exist for clients.
- **Hazard found by testing:** Supabase's default privileges grant `EXECUTE` on new functions to `authenticated`, so revoking only from `public, anon` left the internal validator callable by signed-in users. The draft now revokes by name from `authenticated` too. **The live project's grants must be inspected directly before any real data is stored** (gate G4).
- Writes only through `SECURITY DEFINER` functions with `search_path = ''`, each beginning with `auth.uid()` (null → refused). Executed as `authenticated`: direct insert/update/delete denied; as `anon`: every table and function denied.

## 7. Conflict handling (multi-device)
Rules enforced by the server: stale `base_seq` writes nothing and says "pull first"; events must be in **non-decreasing day order** (no rewriting the past); the **first** device to write a day wins; a correction needs a prior "Partly"; duplicates rejected; a day in the future refused; **a batch with any invalid event writes nothing** (atomic).
Rules enforced by the client: **the account log must always replay under the engine.** Before sending, and after any pull or rejection, the client replays the account history and re-checks every queued event as the merged history would serve it. An event the engine would no longer ask for is **dropped, never forced**, and so is anything depending on it (feedback on a dropped rep never attaches to another device's insight). Dropped events stay on the device as "kept on this device only", visible and exportable. A device that finds the account copy deleted **stops and never re-uploads.**
Where it stands: property tests of random **three-device** schedules with offline periods and serve-and-leave days: **68 schedules (60 on an in-memory model of the rules, 8 on the real SQL), 454 events accepted, 635 dropped with reasons**: the server log replayed in every schedule, all devices converged to it, no event vanished, no day was duplicated.
**Two real defects were found and fixed by these tests** (recorded because they are the kind of failure this design exists to prevent): (1) after the server rejected one rep, later queued events, produced by a state that included it, were still sent and the account log stopped replaying; (2) a refused verification attempt left side effects in the verifier, so later events were judged against a history that did not exist. Both are fixed and covered.

## 8. Deletion, turning off, account deletion, export
- **Turn off:** stops writes (server refuses them too), keeps stored data.
- **Delete my backed-up practice:** removes all events and the profile; irreversible; verified: zero rows for the owner afterwards, other users untouched, harmless when repeated, writes refused until backup is turned on again with fresh consent.
- **Account deletion:** `on delete cascade` removes both tables' rows (verified).
- **Another device after deletion:** detects the missing copy, stops, keeps its own history, does not re-upload (verified).
- **Export/import:** the journal as a file (`{schema, engine, events}`); import validates every event under the whitelist and catalog and the day order, and refuses other engine versions.
- Clearing the **device** copy on request is a separate client action, never implied by deleting the server copy.

## 9. Consent and disclosure requirements
State machine (`lib/innerRep/backup/consent.ts`): **off** (default) → **on** only by explicitly accepting the *current* consent text; "Not now" is respected for 30 days; **paused** (off by choice, data kept) ; **needs_reconsent** when the wording changes (sync stops until re-accepted); deletion, server-copy removal and sign-out return to **off**. The consent version and day are recorded server-side. The interface may show backup only as facts the read model allows (`view.ts`: never "up to date" while events wait, never a backed-up day while off).
The disclosure text is **drafted** in `OPTION_B_BACKUP_PLAN.md` §7 and **must be reviewed by a qualified person before use**; the backup-retention sentence cannot be written until §10's open items are verified.

## 10. What is retained, where, for how long
| Data | Where | Retention |
|---|---|---|
| Local journal (always on) | the device, same class as the engine state | until sign-out clears it (unchanged behaviour) or the person exports and clears it |
| Account events (only if opted in) | Supabase `inner_rep_event`: ids, enums and calendar days only | **until the person deletes it or deletes the account**; no automatic expiry in v1 (replay needs the full log; a snapshot/compaction option is a later, separately approved design) |
| Profile (opted in) | `inner_rep_profile`: backup on/off, consent version and day, last sequence and day | same |
| Provider backups of the database | Supabase managed backups | **unverified, see below** |
| Free text, time of day, email in practice rows, device id, IP, location | **never stored** | n/a |
Size: about one event per active day, a few hundred bytes each (the SQL caps a payload at 2,000 characters and a batch at 200 events).
**Provider limits that MUST be verified against current Supabase documentation for this project's plan before any disclosure is written** (not asserted here): (1) whether database backups exist on this plan and how long they are kept, so how long deleted data can persist; (2) whether the project pauses after inactivity (a continuity feature that goes offline is a product problem); (3) log retention (also the reason the historical admin-endpoint log review may not reach 18 April). The organisation header showed **Free** on 14 October. If the plan lacks backups or can pause, the recommendation is to decide on a paid plan **before** inviting anyone to opt in.

## 11. Security tests: required, and where each stands
Legend: **DONE-LOCAL** = passes on in-memory PostgreSQL / in-process tests (`scripts/runtime/backup*.test.ts`); **STAGING** = must be repeated on a real Supabase staging project with real accounts (nothing is run there without approval).
| Test | Status |
|---|---|
| Cross-account isolation: A cannot read or write B; B's sequence independent; A's deletion leaves B | DONE-LOCAL (SQL); **STAGING** with two real accounts |
| Client cannot insert/update/delete; anon denied everywhere; internal functions not callable | DONE-LOCAL; **STAGING**: also inspect the live project's grants and default privileges |
| Replay equivalence over the simulator corpus (state, Mirror, receipt), including abandonment, feedback, corrections, safety stops | DONE-LOCAL (42 users); and through real SQL |
| Whitelist: 16 hostile events and 108 TS/SQL parity cases rejected/agree; vocabulary drift guard | DONE-LOCAL |
| No free text in transit or at rest: sentinel injected into every answer object appears in no payload, no stored event, no journal | DONE-LOCAL; **STAGING**: also scan Supabase logs and network capture |
| Deletion: zero rows, other users untouched, cascade on account deletion, harmless repeat, writes refused after | DONE-LOCAL; **STAGING** including a second device |
| Multi-device conflicts: same-day, late device, stale base, drift, offline queue, dropped-with-reason, convergence, log always replays | DONE-LOCAL (68 random three-device schedules on model and real SQL); **STAGING** with two real devices |
| Disabled-sync: zero network calls, events still journaled, server refuses writes, stays off after another device deletes | DONE-LOCAL |
| Consent: off by default, no sync without accepting the current text, decline respected, wording change forces re-consent | DONE-LOCAL (state machine); **STAGING**: interface behaviour |
| Account-switch memory isolation | DONE-LOCAL (`account-isolation.test.ts`); two-inbox run on `mirar-unified-real` still **pending** |
| Safety: a crisis stop writes nothing anywhere | DONE-LOCAL (no event, marker or count) |
| Rollback: flag off → app identical to today | **STAGING** (flag does not exist yet; backup code is not imported by the app) |
| Performance and growth: a year of events, pull and replay time | not yet measured |

## 12. Staged implementation plan with separate approvals
Each gate needs its own explicit yes. **Nothing below is authorised except G0.**
| Gate | What happens | What I show you first | Not done without your yes |
|---|---|---|---|
| **G0 (done)** | Design and local prototype; no external system touched | this spec, the SQL draft, the test results | n/a |
| **G1 Design approval** | You approve §2–§10 (or amend them), including: minimisation table, pilots in or out of v1, file export/import as a feature, who reviews privacy/legal | the decisions list in §13 | any build beyond the prototype |
| **G2 Privacy and legal review** | A qualified person reviews the disclosure and retention/backup statements; I verify the three provider facts in §10 and report them | the verified facts, the final consent text | any wording shown to users |
| **G3 Wire it locally** | Integrate recorder + journal into the app behind a build flag `EXPO_PUBLIC_HISTORY_SYNC` (default off, absent from Production bundles; preflight scans for it); Codex builds the experience from `BACKUP_EXPERIENCE_BRIEF.md`; still **no network** (a stub port) | a demo-auth staging preview of the journey with the stub | any Supabase call |
| **G4 Staging database migration** | I show you the **exact SQL** (the draft, regenerated against the live catalog) and the live grants inspection; **you approve; then** it is applied to a **staging** Supabase project (or a separate branch/project, your choice), not the production project | the SQL diff and the grants report | running it; touching the production project |
| **G5 Staging data** | Real-auth staging build with two test accounts you control; full §11 STAGING column; no real users | the test report | inviting anyone, storing real practice |
| **G6 Production activation decision** | Separate decision, with the other release gates (security log review, safety copy sign-off, human testing, plan/backups/pausing verified) | the full release checklist | enabling it for anyone; changing production retention |
| **G7 Rollout** | Opt-in only, off by default, monitored; rollback = turn the flag off (stops writes; tables can be dropped independently) | the monitoring and rollback plan | default-on |

## 13. Decisions I need from you (G1)
1. Approve or amend the **minimisation table** (`OPTION_B_BACKUP_PLAN.md` §2) as tightened here: no seed, no commitment labels, no email, no time, ids only. The narrower option (omit the bound domain from reps) costs some Mirror fidelity; the memo's stance is to keep it.
2. **Pilot records in v1, or engine first?** Recommendation: engine first; pilots as their own event kinds afterwards, still source-separated in the Mirror.
3. **Export/import file** as a shipped feature (server-free continuity)? It is built into the client and costs little. Recommendation: yes.
4. **Plan:** accept that a paid Supabase plan may be required before opt-in is offered (§10), pending verification.
5. **Who** performs the privacy/legal review (G2)?
6. Confirm **no automatic expiry** in v1, with compaction as a later design.

## 14. Roadmap placement
Elevated to a **top product workstream**, sequenced beside, not ahead of, the release blockers: `docs/product/ROADMAP.md`. The v2 production promotion remains blocked by security and safety items independent of this work.

## 15. Delivered (all local, none imported by the app)
`lib/innerRep/backup/` (`events.ts`, `recorder.ts`, `replay.ts`, `sync.ts`, `consent.ts`, `view.ts`); `docs/proposed/option-b/` (`001_history_backup.sql`, generated `002_catalog_seed.sql`, README); tests `scripts/runtime/backup*.test.ts` and helpers; `scripts/runtime/gen-backup-catalog.ts`. A production-equivalent bundle contains none of it (preflight scan).
**To run the SQL tests:** install `@electric-sql/pglite` in a directory outside the repository and set `PGLITE_DIR`; without it the SQL suite prints SKIP and the scenario suite runs on the in-memory model only.

## 16. G1 decisions (15 October, later) and how each is resolved
| G1 decision or condition | Resolution | Evidence |
|---|---|---|
| Minimised structured-event model; preserve what exact replay needs | Unchanged: catalog ids, domain ids, calendar days; nothing else. Added: a random `epoch` per history generation (an identifier, not personal data) | SQL and replay suites |
| Engine history first; pilots stay device-local; UI discloses it | Snapshot scope is `engine_only`; `pilotHistory` and `unfinishedPracticeAndOffers` are `device_only`; sign-out advice says pilots are device-only | `continuity.test.ts` |
| Export/import approved as a feature, but never incomplete | Export is complete (verified save, re-validated, receipt-bound) and **default off** behind `EXPO_PUBLIC_HISTORY_EXPORT` and the presence of a *confirming* saver. **Import is not built and no import capability is exposed.** | `backup-sync.test.ts`, `continuity.test.ts` |
| Paid plan acceptable if verified necessary; no purchase | Nothing changed. The three provider facts (backups, pausing, logs) remain to be verified in G2 | review packet §6 |
| Independent qualified review before consent or storage | Packet prepared: `docs/privacy-review/OPTION_B_REVIEW_PACKET.md`. Interface copy is placeholder only; no retention promise appears anywhere | packet |
| No automatic expiry in v1 | Accepted, flagged for the retention review | packet §6 |
| "Delete backed-up practice" deletes the account copy; "Clear practice on this device" separate; any combined deletion explicit | Three separate controller intents: `delete_account_copy`, `clear_device`, and an explicitly named `delete`. Codex's UI still offers only the combined one (change request 1) | `continuity.test.ts` |
| Deleting account history must prevent old devices silently restoring it | Epoch per history generation (SQL + client); a device that synced under an older epoch, or finds the copy gone, stops and keeps its history; reconnecting needs an explicit decision. **A hole was found during G3 (an idle device that never saw the deletion could re-upload it by turning backup on) and fixed.** | SQL epoch tests; `backup-sync.test.ts` (3 scenarios); `continuity.test.ts` |
| Turning backup off stops new uploads immediately; unsent events remain device-local; fate disclosed | `disable()` takes effect before any further upload, including mid-sync; unsent events stay in the device journal and are uploaded only if backup is turned on again; snapshot carries `unsentOnDevice` and the UI must state the fate (change request 3). **A defect where an in-flight upload's result was dropped was found and fixed.** | `backup-sync.test.ts` |
| Conflicts never merge or replace automatically; a real export must succeed before anything that might discard a local history | `decision_required` writes nothing; every discard path (`keep_account`, `keep_device`, `clear_device`, `delete`, `delete_account_copy` when not identical) requires a verified-export **receipt bound to exactly that history**; a save the browser cannot confirm does not count | `backup-sync.test.ts`, `continuity.test.ts` |
| Reconcile profile deletion and consent state | **Deleting the account history turns backup off** (the profile, which held the flag, is gone): the snapshot reports `enabled:false`, `accountCopy:'none'`, never a misleading "on". Starting again is an explicit new consent and a new epoch | `continuity.test.ts` |
| Preserve owner-only access, no free-text transmission, exact replay | Unchanged and re-run in full | all suites |

### Decisions still open
1. **Explicit read when the history screen is opened** (the only call made while backup is off): acceptable as a stopgap, or require a visible "Check for a backed-up copy" button? (Recommended: the button.)
2. **Sign-out with unsent changes:** today it warns and never blocks. Should it require a saved copy first? (Recommended: no; offer a save, never trap someone.)
3. **Turn off, then on:** unsent changes upload on re-enable (current). Alternative: ask. (Recommended: current, with the disclosure.)
4. **Replace the account copy with this device's history** (`keep_device`): keep behind export-and-confirmation, or remove the capability entirely? (Recommended: remove from v1; offer "use the account's" or "save a file and delete".)
5. **Import:** whether and when to build it; its safe-handling and the conflict behaviour of an imported file.
6. **Who** performs the privacy/legal review; the **plan** question after provider facts are verified.

### Exact next approval gate
**G2: privacy and legal review plus provider-fact verification.** Approve (a) the packet going to the named qualified reviewer, and (b) my doing **read-only** checks in the provider dashboard (plan, backups, pausing, region, log retention). Without G2 there is no consent wording, no retention statement and no basis to request G4. In parallel (no approval needed beyond this): Codex's UI changes (`CONTINUITY_G3_UI_CHANGE_REQUESTS.md`). **G4 (a staging migration) can be requested only after G2 outputs and the UI changes exist**, and will arrive as exact SQL for your approval, never run first.
