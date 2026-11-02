# 0026 reconciliation before 0027/0028 (audit result + plan)

## Findings (read-only, verified this turn)
- Code is at `40d58349` (PR250 merge). The journal has entries idx 0–28. Entries 26/27/28 have `when` values 1793444949653, 1793617687826 and 1793617728829.
- The database's latest `drizzle.__drizzle_migrations` row is id 36, with created_at 1793312624810. That matches journal idx 25.
- Native runner: `lov_database--migration`. It creates a new custom migration, runs `drizzle-kit check`, then applies it with Drizzle's migrator over a connection the tool supplies (`LOVABLE_DB_MIGRATION_URL` in `drizzle.config.ts`, empty in the sandbox). It cannot run one chosen entry by itself, and no other supported runner exists.
- Drizzle's migrator applies every journal entry whose `when` is greater than the newest applied created_at, in order. So any call will try 0026 first. The 0026 preflight raises `UNIFIED_PARTIAL_INSTALL_REQUIRES_REVIEW` because `card_assistant_policy`, `rag_current_releases` and `assistant_auto_jobs` exist. Everything then rolls back, and 0027/0028 do not install.
- 0026, 0027 and 0028 each contain their own `BEGIN;`/`COMMIT;`. That is a second risk on top of the migrator's own transaction.
- I found no textual reference to `free_access_windows` in 0027/0028. They do depend on many `billing.*` objects, and I have not checked those against the live database.

## Answer
You cannot run 0027/0028 through the native runner without first resolving 0026. Skipping it would need a fake journal row or journal surgery, and both are forbidden. The only safe route that keeps the history truthful is to reconcile 0026 in reviewed source:

## Minimal plan (each step needs owner approval)
1. **Prerequisite inventory (read-only):** list every object that 0026 creates (tables, columns, functions with signature, policies, grants, triggers). Mark each one as present or missing in the database, with a definition hash for functions. Do the same for every `billing.*`/`public.*` object that 0027/0028 reference.
2. **Reviewed source change in 0026 (by PR, not hand-edited here):** replace the all-or-nothing partial-install raise with a truthful "complete-or-verify" form:
   - Keep the baseline-prerequisite check.
   - For objects that already exist: assert that their definitions match the reviewed definitions (hash/column checks), and raise if anything differs. Never drop or recreate anything.
   - Create only what is missing (`billing.free_access_windows` with its grants, RLS, policies and helpers, plus any other gaps from step 1) using `IF NOT EXISTS` / `CREATE OR REPLACE` only where the hash already matches.
   - Do not touch active RAG vectors, `rag_current_*` receipts, auto jobs or policy rows (no DML).
   - Remove the inner `BEGIN;/COMMIT;` from 0026/0027/0028 so the migrator owns one transaction.
   - Add a header comment stating that 0026 was partially installed operationally and this file completes and verifies it.
3. **Tests:** run the existing migration and preflight tests on the edited 0026. Add a test showing that it passes on a partial-install fixture and raises on a definition mismatch.
4. **Apply:** make one `lov_database--migration` call (for example a no-op `SELECT 1` custom migration, or the next reviewed change). The migrator then applies 0026 (completion), 0027 and 0028 in order and records real journal rows.
5. **Verify (read-only):** check the new journal rows and the `free_access_windows` and 0027/0028 objects. Confirm that the active index `0c0f…` and its 3,851 rows, the `a844` receipt and the job/policy rows are unchanged. Check that the database boot time is stable.

## Still unverified
- The exact list of missing objects (step 1).
- Whether the existing objects match the reviewed definitions byte for byte.
- Whether the tool's wrapper tolerates the files' inner `BEGIN/COMMIT`.

No publishing at any point.
