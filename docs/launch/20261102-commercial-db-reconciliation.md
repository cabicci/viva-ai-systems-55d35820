# Commercial database release reconciliation

Target: existing Lovable project `658adce0-747d-4c8e-90e3-d22225070b94`, database reference `abyqqeboyrkkwhjpwmtd`.
Approved application merge: PR250, main `40d583494b234e197858dc13978d0a7b95df3a26`.

## Observed release gap

The native `drizzle.__drizzle_migrations` journal ends at entry 0025 (row 36, `created_at=1793312624810`). The operational card assistant, current RAG release and automatic indexing objects already exist. The free-access tables and public reader/command are absent. The new commercial-policy and discount-policy migrations 0027/0028 are also absent.

The original unapplied 0026 deliberately rejects this partial installation. Native Drizzle applies every pending entry in order; applying 0027/0028 separately and advancing its watermark would hide the unresolved earlier entry. No journal stamp, skipped entry or second Supabase migration family is permitted.

## Reviewed source strategy

Keep the original nine source inputs SHA-pinned and reproducible through `scripts/release/assemble-unified-assistant-migration.mjs`. Pristine targets execute the original assistant sections. The specifically captured operational target must match every protected schema, routine, ACL, trigger and registry fingerprint before those existing sections can be preserved without replay. Both paths install the unchanged missing free-access section. Unknown partial installations or changed protected objects must fail before installing anything.

The native runner owns the transaction. Pending 0026/0027/0028 must not commit inside that outer transaction. Rehearse pristine installation, operational preservation, mismatched definitions/permissions/registry, and a deliberate failure after 0028 to verify complete rollback.

Canonical Drizzle statement-breakpoint comments separate top-level statements in these three pending files. This lets both the native postgres-js batch adapter and prepared-query adapters execute the same checked-in SQL. Removing those markers and the reviewed outer transaction envelopes leaves the original 0027/0028 SQL bodies unchanged; the regression test pins their body hashes.

`scripts/release/commercial-native-postcondition.sql` is a final assertion candidate outside migration auto-discovery. It verifies the installed tables, privacy boundaries, authenticated/service RPCs and exact reviewed catalogue. If the supported native tool requires a new custom migration to flush pending entries, use these reviewed assertions as that migration, rather than inventing a successful history row or a dummy operation.

## Preservation evidence and recovery

Schema-only preimages and non-learner registry/policy preimages are held privately in the existing ROOT11-LIVE-PROMOTION evidence directory. Only hashes and structural guards belong in source control. Existing vectors, active release receipts, jobs and policy state must retain their before/after fingerprints. Do not reset, relabel, regenerate or retire them as part of this release.

The project's actual Backups UI showed a restorable daily backup at **2026-11-02 05:15:48 UTC**, followed by prior daily entries. No backup export or new database copy was created. This is an existing daily restore point, not a claim of a fresh point-in-time snapshot; restoring it would lose later writes and is not an automatic rollback instruction. A SQL transaction rollback and captured function text are not full database backups.

## Execution boundary

The owner approved preparation/application of the reviewed database updates and will publish the website personally. This document records preparation, not an executed migration. Apply only through the supported native Drizzle mechanism after the source correction and tests pass. Verify real journal hashes, installed privacy boundaries and unchanged protected RAG state afterward. Do not publish, invoke a provider, enable a campaign or change automatic-indexing policy as part of migration execution.

## Local review evidence

All 35 focused tests passed: seven reconciliation cases using the installed Drizzle/PGlite migrator, 19 commercial-policy SQL cases and nine coupon SQL cases. They verify pristine installation, preservation of an operational fixture with enabled policies and existing vectors/jobs/paid receipts, rejection of changed functions/permissions/registry, unknown partial-install rejection, and rollback of all pending SQL and real migrator journal writes when a later migration fails. The fixture uses its own PostgreSQL major and schema fingerprints through an explicit test-only assembler option; production assembly remains pinned to the captured PostgreSQL 17 target and its exact 66-object map.

TypeScript, focused ESLint/formatting, deterministic assembly and whitespace checks passed. A fresh read-only production query still matched all 66 captured object fingerprints. Protected data counts and full-row hashes were separately captured privately for post-application comparison, including all existing vector rows and index versions. These checks do not claim that a production migration has run.
