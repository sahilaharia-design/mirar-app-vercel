# Decision memo — durable structured history

Status: **proposal for explicit product approval.** Nothing is applied: no migration, no table, no change to production privacy behaviour. Free text remains unstored under every option below.
Part of [MIRAR_VALUE_AND_RUNTIME_CONTRACT.md](MIRAR_VALUE_AND_RUNTIME_CONTRACT.md). Builds on `docs/proposed/017_v3_FINAL_after_simulation.sql` (a proposal, never applied).

## 1. The decision

Should Mirar store each user's **structured** practice history on the server, so it follows the person across devices and survives a cleared browser?

**Recommendation: yes, as an opt-in "Back up my practice" setting, default off, event-sourced, row-level secured, with a first-class delete.** Do not make it default until the Mirror has shipped and been used. Do not apply until this memo is approved.

## 2. What we gain
- **A Day-30 Mirror is possible.** Today a cleared browser, new phone, or sign-out deletes the history the Mirror depends on [CODE]. Without durable history we cannot honestly promise "what changes over time".
- **Continuity across devices** (phone and laptop).
- **Recovery** from lost or replaced devices.
- **A foundation for support and debugging without asking users to describe their history** (structured state only; access policy below).

## 3. What users give up
- Their structured choices (which options they selected and when, domains they named, commitment labels, readings shown and their verdicts) would be held on the server, linked to their account email. This is sensitive even without text: "domain: partner, burden: true, day X" says something about a life.
- The current plain promise, "practice stays on this device", becomes "stays in your account, structured only, and you can delete it."
- A larger breach surface: a breach would expose sensitive structured data, not just an email.

## 4. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Breach exposes sensitive structured data | Minimise: day-level dates only, no timestamps; no free text; no device identifiers beyond a random id; encryption at rest (provider); strict RLS; no analytics reads. |
| Staff or support access | Policy: no routine access; service role not used by clients; any access logged. |
| Silent expansion later (text, analytics) | The schema has no text columns; a CI test fails if a text-like column is added to the table. |
| User confusion about where data lives | Setting is opt-in, plain-language, shown before sign-in and in Me; Privacy page states it. |
| Client-side encryption would remove most of this risk but magic-link auth has no password to derive a key from | Not recommended in v1: key loss would make history unrecoverable. Keep as a future option. |
| Replay drift when the engine version changes | Events pin `engine_version`; snapshots are rebuilt only under the version that produced them or explicitly migrated. |
| Legal (retention, backups, data-subject requests) | Needs review by someone qualified. This memo does not make legal claims. |

## 5. Proposed design

**Why event-sourced.** The engine is deterministic from `(userSeed, engine_version, ordered completions)`. Storing events, not just a blob, makes conflicts tractable and the data auditable.

### Schema (illustrative; not applied)
```sql
-- one row per user
create table inner_rep_profile (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  user_seed      integer not null,
  engine_version text    not null,
  sync_enabled   boolean not null default false,
  revision       bigint  not null default 0,        -- optimistic concurrency
  updated_day    date    not null
);

-- immutable, append-only, structured only
create table inner_rep_event (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  seq         integer not null,                     -- per-user monotonic
  day         date    not null,                     -- calendar day, no time of day
  kind        text    not null check (kind in ('rep_completed','feedback','correction','commitment_status','abandoned')),
  payload     jsonb   not null,                     -- structured answers / ids only (validated)
  engine_version text not null,
  unique (user_id, seq)
);
-- one completed rep per user per day, across devices (feedback/commitment events are not limited)
create unique index inner_rep_one_rep_per_day on inner_rep_event (user_id, day) where kind = 'rep_completed';
-- RLS: select/insert only where user_id = auth.uid(); no update; delete only via the delete function.
```
A server-side check function rejects any payload key outside the structured whitelist the runtime already enforces (`v2-runtime.ts` rebuilds answers from a whitelist), so free text cannot be stored even by a buggy client.

### Authentication identity
`auth.uid()` from the existing Supabase magic-link session. No new identity system.

### Row-level security
Owner-only read/insert on both tables; no client update; no cross-user policy; no public role grants. (A separate local history shows anon Data API grants being revoked; that is not in this repository, so the live project's grants must be checked directly before relying on it.)

### Storage and retrieval
- Write: on rep completion, feedback, correction and commitment status change, append events; update `revision` with compare-and-swap.
- Read: on sign-in with sync on, fetch events after the device's last known `seq`; replay through the frozen engine to rebuild state; cache a local snapshot for speed.
- Replay is verified: the replayed state must equal the local snapshot (test below).

### Device synchronisation and concurrency
- **One rep per day per user, across devices.** The unique constraint makes the first completed rep of a day win; the second device sees "already done today" and refreshes, which matches existing product semantics.
- **Feedback and commitment status are commutative events** applied in `seq` order; last user action wins per commitment.
- **Offline:** events queue locally and flush; a conflict (same day already taken) drops the later local rep with a plain message and keeps the local copy for export.

### Deletion
- **Delete my practice data:** a function that deletes all events and the profile row, then clears the local copy; irreversible and confirmed.
- **Account deletion:** `on delete cascade`.
- **Sign-out:** keeps server data; clears the local copy (as today).

### Backups and retention
Retention: until the user deletes, or the account is deleted. Backups follow the managed provider's policy; the disclosure must state that deleted data can persist in backups for the provider's window, and that window must be **verified against the current plan before the disclosure is written** (not asserted here).

### Migration from existing local state
- First sign-in on a device with sync turned on and **no server data**: offer "Back up what's on this device" → import local instances/observations/commitments as events (idempotent by instance id and day).
- **Both** local and server data exist: do not auto-merge. Ask: keep this device's history, keep the account's, or keep the account's and export this device's as a file. Default: keep the account's.
- Never overwrite silently.

### Rollback
- Feature flag `EXPO_PUBLIC_HISTORY_SYNC` (default off) and the per-user `sync_enabled` flag. Local remains the source of truth until a user opts in.
- Reverting the flag stops writes; tables can be dropped independently of the app.
- Migration is additive; no existing table changes.

### Security and privacy disclosure (must ship with it)
Plain language, in Me and on the Privacy page and before the opt-in: *what is stored (structured choices, dates, commitment labels), what is not (anything you type), who can read it (you), how to delete it, and that backups may retain it for a limited time.* Reviewed by someone qualified before release.

## 6. Test plan (before any production use)
1. **Replay equivalence:** for the 24-profile simulator corpus, `replay(events) == local state` byte for byte.
2. **Whitelist:** inserting any payload with an unknown key is rejected by the server function.
3. **RLS:** user A cannot read, insert for, or delete user B (two real test accounts).
4. **Concurrency:** two devices complete the same day; exactly one rep is stored; the other sees the message.
5. **Deletion:** after delete, a query as the user returns zero rows; local cleared; second device cannot restore.
6. **Migration:** local-only, server-only and both-present cases each behave as specified, with no silent overwrite.
7. **Rollback:** flag off → app behaves exactly as today.
8. **No text:** a sentinel typed in every optional field never appears in any table, log or network payload.

## 7. Options considered
| Option | Gain | Cost | Verdict |
|---|---|---|---|
| A. Stay device-local | Strongest privacy; zero server risk | No cross-device, no durable Mirror; Day-30 promise impossible | Acceptable for a close beta only |
| B. Opt-in event-sourced backup (this memo) | Durable, auditable, user-controlled | New server data and obligations | **Recommended** |
| C. Default-on sync | Best continuity | Changes the privacy promise for everyone without choice | Not now |
| D. Client-side encrypted blob | Minimal server exposure | No password to derive a key; lost key = lost history; harder support | Future option |

## 8. Approval needed
1. Approve option B in principle (opt-in).
2. Approve the disclosure wording once drafted.
3. Approve that a qualified person reviews retention/backup statements.
4. Approve a staging-only build and test run before any production migration.

Until then: device-local, as today.
