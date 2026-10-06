# Free-text storage model (design; nothing implemented)

**Current build:** free text is **not stored anywhere**. It is passed to the safety check and dropped. The hint reads "Optional. Not saved in this version." This stays until safety review and this model are approved.
**Safety detector:** unchanged in this pass. Pre-production safeguard only; **not validated.** Persisted free text must not ship until the safety review is complete.

## 1. User-controlled retention

`inner_rep_settings.free_text_retention`:

| Value | Meaning | `expires_at` |
|---|---|---|
| `never` *(default)* | Text is never written. The words step still works as a pause/safety-check, then discards | n/a |
| `30d` | Written; tombstoned after 30 days | `created_at + 30d` |
| `90d` | Written; tombstoned after 90 days | `created_at + 90d` |
| `keep` | Written; kept until the user deletes it or deletes the account | null |

The row records `retention_at_write`, so a later change of preference does not silently re-label old text. A change to `never` offers "also delete what's saved" as a separate, explicit choice.

## 2. Deletion: fields, and what is removed vs kept

`inner_rep_free_text` carries `deletion_requested_at`, `deleted_at`, `deleted_reason ∈ {user, retention_expired, account_deleted, safety_removed}`.

- **Removed:** the words (`body` → `NULL`). A check constraint makes "live row ⇔ body present; tombstone ⇔ body null".
- **Kept (tombstone):** `id`, `user_id`, `instance_id`, `origin`, `retention_at_write`, `created_at`, `deleted_at`, `deleted_reason`, `safety_checker`.
- **Why keep a tombstone:** provenance. "The user wrote something here (prompted vs raised by themselves), and the engine used only the context chip they tapped" remains answerable after the words are gone. No hash or excerpt of the text is kept (a hash of short text can be reversible by guessing).
- **Evidence is not invalidated:** evidence and insights reference *observations*, never free-text rows, and the engine does not read text. Deleting text changes nothing the engine inferred.
- **Account deletion:** cascades through `users`; no tombstones remain.
- **Order of operations on request:** mark `deletion_requested_at` → null the body in the same transaction → set `deleted_at`. Retention expiry runs the same function from a scheduled job.

## 3. What must be verified about Supabase before Mirar makes any deletion promise

Not verified yet. Deleting a row is not the same as the data being gone. Before any user-facing wording such as "deleted", find out (Supabase dashboard, docs, support) and write down:

1. **Plan and backup type:** daily backups only, or Point-in-Time Recovery (PITR)? Is PITR enabled on this project?
2. **Retention window** of daily backups and of PITR/WAL on this plan; whether it can be shortened.
3. **Does a deleted row persist in backups/WAL until that window ends?** (Almost certainly yes for PITR; confirm.)
4. **Restore behaviour:** if a backup/PITR restore happens, are deleted free-text rows resurrected? What is the procedure to **re-apply deletions** after a restore (a deletion ledger that survives restores)?
5. **Read replicas, logical dumps, exports** the team or tooling has made; where they live; who can access them.
6. **Logs:** do database/API/edge-function logs ever contain request bodies for `inner_rep_free_text` inserts? (Check log settings and drains; the app itself logs nothing.)
7. **Region and sub-processors** involved in storage/backup.
8. **Encryption at rest** and key handling as documented by the provider (document the provider's statement; do not restate it as Mirar's guarantee).
9. **Storage buckets / realtime / replication** features that could copy rows elsewhere.
10. **Support-access policy:** who at the provider can read project data, under what conditions.

Until these are answered, user-facing copy must **not** say text is "permanently deleted"; it may say "removed from your account" only if that is literally true of the live database, and must disclose backup retention once known. No legal claims are made here.

## 4. Client-side rules (apply now, and to any future implementation)

- Composition state lives in memory only. No `localStorage`, `sessionStorage`, IndexedDB, cookies, URLs.
- Failed save → retry in memory while the app is open; if it closes, the text is lost and the user is told.
- Structured answers may use the per-user retry queue (no text). Cleared on sign-out (done, verified).
- Never in `console.*`, analytics, crash reports, query strings, route params, or any model call.
- The engine does not read free text (MVP rule). Any future use needs explicit opt-in and its own review.

## 5. Open decisions
- Is `never` the right default, or should the first-run ask? (Product.)
- Is the 280-character cap right? (Product + safety: shorter text reduces risk surface.)
- Do tombstones survive for audit, or only for a period? (Privacy review.)
- Server-side safety check in addition to client-side before any write. (Required before shipping.)
