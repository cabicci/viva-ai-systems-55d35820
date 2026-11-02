# Database release readiness — 2 November 2026

The owner rejected automatic implementation of the earlier Lovable audit plan. This file records release status; it does not create a new approval requirement or authorize publication.

## Approved scope

- PR250 merged into main at `40d583494b234e197858dc13978d0a7b95df3a26`.
- The owner approved preparing/applying the reviewed database updates and will publish the website personally.
- Use the existing Masaarat project and database. Preserve current RAG vectors, index versions, receipts, jobs and runtime policies.

## Reconciliation

The native journal ends at 0025. Operational assistant objects from 0026 already exist; its free-access section and commercial migrations 0027/0028 are absent. Do not replay the existing objects, skip a journal entry or fabricate a success stamp.

PR251 supplies a deterministic, fail-closed 0026 correction: pristine targets install the original sources; the captured operational target must match all 66 protected fingerprints before only the missing section is installed. Pending 0026/0027/0028 share one native transaction and canonical statement boundaries.

## Verification

- Local focused tests: 35/35 passed, including the installed Drizzle migrator, operational data preservation, changed-state rejection and complete rollback after a late failure.
- TypeScript, focused lint/formatting and reproducible assembly passed.
- Existing daily backup verified in this project's Backups UI: 2026-11-02 05:15:48 UTC. No export, database copy or new backup was created.
- Existing protected data counts and hashes are private before/after evidence.

## Remaining steps

Complete GitHub checks for PR251, merge the reviewed source, verify Lovable is synchronized to the exact merge, then apply pending updates through the supported native Drizzle mechanism. If the native tool needs a new custom migration, use the reviewed assertions in `scripts/release/commercial-native-postcondition.sql`, not a dummy operation.

Verify journal hashes, catalogue and RPC/table privacy, unchanged protected data and the refreshed preview. No website publication, provider call, reindex, campaign activation or indexing-policy change belongs to this database update.

Full procedure and limits: `docs/launch/20261102-commercial-db-reconciliation.md`.
