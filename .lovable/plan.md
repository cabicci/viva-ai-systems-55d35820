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

## Phase 2 learning records — native release continuation

PR256 is merged at `5d611ef2e8805e7708716e35ac348dda9ca0fa82`; the same project's authenticated preview is ready for its pending database update. Existing native journal ends at id 41 / 0030. Do not repeat the historical commercial release above.

Only then-unapplied 0031 received canonical statement-boundary comments; business SQL is unchanged. Its LF hash is `a29fb5acb60633abdb4ba6b28bf91ea2c0e9f1ed7b0db9e83bb381c33725cc3d`. The supported native tool applied the feature and reviewed real assertions together. The canonical final assertion is now `drizzle/migrations/0032_student_learning_native_postcondition.sql`; its temporary input is removed. The migration URL is unavailable to external CLI execution. Never invent a journal stamp, edit an applied migration or replay this completed update.

The installed Drizzle migrator verifies success, repeat safety and full rollback after a failed final assertion. Review/merge release support, verify exact source/native preconditions, apply natively, preserve and compare existing data, deploy only `kids-lesson-content`, update the existing roadmap, then test the authenticated preview. The owner publishes. No new project/database/backup or provider call is part of this preparation. Full evidence and remaining live acceptance: `docs/delivery/student-learning-records-2026-11-02.md`.


## Native release result (2026-11-02)

The following native release completed. Its bookkeeping merged to main62c082c66 after checks. A subsequent authenticated locale test found40P01 from inverted family/lifecycle locking; review and rehearse `scripts/release/commercial-family-lock-order.sql` as a forward-only correction before publication. Preserve applied migration hashes, the private ACL and all existing account/payment/deletion checks. The native tool must generate the next entry; do not replay0031/0032 or write the journal manually. Real concurrency proof and approval are pending.

Source main `3b8cd03b40b21629ff02b8fe88fa21c075d32467`. Native runner applied journal id42 `0031_student_learning_records` (hash `a29fb5ac…25cc3d`, created_at 1793650000000) and id43 `drizzle/migrations/0032_student_learning_native_postcondition.sql` (hash `75e953d5…6c29`, created_at 1793650009827) in one transaction; the postcondition passed. The 0032 file differs from `scripts/release/student-learning-native-postcondition.sql` only by leading indentation on four lines (10, 30, 40, 50); statements are identical. 1444 existing facts and 10 notes captured; all source/account/commerce counts unchanged; Kids bridge USAGE/EXECUTE preserved. `kids-lesson-content` deployed (submitted SHA-256 `4236cd34…f2e3`). Roadmap row `f2bf0d08-a380-4384-8a6d-1317b36bdf2d` in_progress. Not published; browser acceptance pending.

Prepublication deadlock correction: native 0033 `0033_commercial_family_lock_order` applied (id44, when 1793651823565, hash `a0b070ff…a37e`); function MD5 `7b5513a5…314c`, ACL unchanged; family lock precedes the four original locks. Test now reads 0033; temporary input removed. Pending authenticated locale retest and owner publication.
# Current owner task — curriculum admission (2026-11-02/03)

Build stage 3 in this EXISTING Masaarat project and existing database. Code branch: `codex/curriculum-intake-20261102`; base main `c2bc005ed9c79a382f372092e8e55968dd76b646`. No new project/database/accounts/roles, no publishing, no real course imports. Pesticides testing/adoption is deferred and requires concrete owner approval before adoption.

Implementation: new-course course/station/step delivery and optional lesson sections; protected draft/review/approval; immutable activity/grading/source versions; auto personal notes/records/drafts; existing commerce and question/report pools; same automatic index queue, without changing completed legacy index identities. Existing AI lesson presentation is preserved. Details and limits: `docs/delivery/curriculum-admission-2026-11-02.md`.

Native foundation applied once as `drizzle/migrations/0034_course_intake.sql`, original native commit `d0d301ec5e8a874f8428ed8b3620e48ea3b2ee9a`, journal id45/when1793658835471/hash `7f236e5d7428a37e608f86eb144e3c0b47ab259c78e1256e6d77f748b060f60d`. Preserve it unchanged. No curriculum was imported; all seven new tables remain empty. The superseded local installation input was removed; tests now use the canonical applied file.

The real forward privacy correction is already applied once as native `drizzle/migrations/0035_child_command_erasure.sql`, original commit `c4c684b9aa6c0e6c0b19ac0a7bb7de7d57273886`, journal id46/when1793660040815/hash `be9c66b0006f6c660af10980b9a9907dbeec96a7c3445ea493eaf4b33781beff`. It attaches cached command receipts to their learning record with a cascading FK and writes the verified record ID. The isolated child-deletion regression reproduced two orphaned receipts before the correction; child/account erasure now passes through the canonical native migrations. Independent readback verified the FK/index, unchanged ACL/search path/commercial lock, empty admission storage and all24 protected data/index fingerprints. The superseded correction input was removed. Never replay either migration, edit its applied SQL, stamp the journal or run direct query-tool DDL. Update phase-3 roadmap row `5dae1a53-6b15-45d8-b9d6-eb6a3478cb3e` only. Final required CI/main integration/preview review gate release readiness. User publishes manually; pesticides adoption remains separately approval-gated.

