# Option B SQL: DRAFT, NOT APPLIED

**These files are proposals. They are deliberately outside `supabase/migrations/` so no tool can pick them up and apply them.** They have been executed only on a throwaway, in-memory PostgreSQL 16 (PGlite) by `scripts/runtime/backup-sql.test.ts` and `backup-sync.test.ts`. They have **not** been run against any Supabase project. Applying them needs the explicit, separate approvals in `docs/product/OPTION_B_IMPLEMENTATION_SPEC.md` §12 (gates G4 and later).

| File | What it is |
|---|---|
| `001_history_backup.sql` | tables, owner-only RLS (SELECT only for clients), whitelist validation, the four write functions, privileges |
| `002_catalog_seed.sql` | **generated** from the frozen catalog by `scripts/runtime/gen-backup-catalog.ts`; never edit by hand; a test fails if it drifts |

Order: `001`, then `002`. Rollback: drop the three tables and five functions (they hold no data the rest of the app depends on). Before any real use, inspect the live project's default privileges and grants directly (spec §6).
