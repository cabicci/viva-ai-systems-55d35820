# Technical furniture integration — capability report (read-only)

## Findings
- Workspace runtime has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` present as env vars (checked by presence only; values never printed).
- `scripts/technical-education/import.ts` does NOT exist in the current synced source (main `99eec7c`). It becomes runnable only after the integration branch is merged and synced.
- Edge function folders present: `account-welcome-job`, `billing-stripe-webhook`, `billing-stripe-portal`, `commerce-invitations`. `technical-stripe-checkout` is NOT present yet (arrives with the merge).

## Execution capability (after merge + sync)
1. Run `bun run scripts/technical-education/import.ts` in the workspace shell; the script reads the service key from env inside the process, no echo/logging of secrets.
2. Bucket `technical-downloads` (private) can be created via the storage tool if the script does not create it (SQL inserts into buckets are blocked).
3. Upload 644 PDFs, upsert 320 packages, download-back SHA-256 verify — all feasible inside one command, split into chunks if any run exceeds the 600s command limit (script must be resumable/idempotent).
4. Enable only `technical_release_control` via a migration or the script, as the merged code defines.
5. Constraint: PDFs must be inside the synced repo (or reachable path) for the workspace to read them.

## Function deployment
- Deploy tool available; can deploy by exact name: `technical-stripe-checkout`, `billing-stripe-webhook`, `billing-stripe-portal`, `account-welcome-job`, `commerce-invitations`. `config.toml` `verify_jwt` entries must come from the merged source (technical-stripe-checkout has none today).

## Then
Publish via deploy after verification, on owner instruction. No changes made in this turn.
