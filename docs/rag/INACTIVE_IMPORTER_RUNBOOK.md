# Inactive RAG Corpus Importer â€” Runbook

**Authorization (implementation / disposable only):** `CR-RAG-INACTIVE-IMPORTER-20260724-01`
**Production import requires a new Control Room execution authorization.**
This implementation ID must never authorize Production corpus writes.

## Why existing tools are not valid Production importers

1. `scripts/seed-knowledge/run.py` â€” legacy 100-lesson scope, DELETE+INSERT, no four-locale staging version contract.
2. `scripts/rag/db-lifecycle-integration.ts` â€” disposable harness with mock vectors and sample rows only.

## CLI

```bash
bun run scripts/rag/inactive-import.ts --op preflight
bun run scripts/rag/inactive-import.ts --op import --env disposable --execute
bun run scripts/rag/inactive-import.ts --op validate --env disposable --execute
```

Forbidden modes: `activate`, `rollback`, `seed-100`, `delete`, `replace`.

Default is dry-run (zero DB writes, zero provider calls).

## Artifact digests (compute locally)

```bash
bun run scripts/rag/inactive-import.ts --print-digests
```

## STAGE 3A â€” Production preflight (future; do not run now)

Working directory:

`E:/Masaarat/Worktrees/viva-rag-production-inactive-importer`

```powershell
$env:CONTROL_ROOM_AUTHORIZATION_ID = "<NEW_PRODUCTION_EXECUTION_AUTH_ID>"
$env:EXPECTED_REPOSITORY = "cabicci/viva-ai-systems-55d35820"
# Authorized expected SHA must match the checked-out source (`git rev-parse HEAD`).
# Do not set OBSERVED_MAIN_SHA — the importer derives the observed SHA from Git.
$env:EXPECTED_MAIN_SHA = "<LOCKED_CHECKED_OUT_SOURCE_SHA>"
$env:EXPECTED_PROJECT_REF = "abyqqeboyrkkwhjpwmtd"
$env:EXPECTED_SOURCE_SHA = "3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2"
$env:EXPECTED_INDEX_VERSION = "rag-index-v1"
$env:EXPECTED_PACKAGE_MANIFEST_SHA256 = "<from --print-digests>"
$env:EXPECTED_CHUNK_MANIFEST_SHA256 = "<from --print-digests>"
$env:EXPECTED_CHUNKS_SHA256 = "<from --print-digests>"
$env:EXPECTED_AUTHORITATIVE_LOOKUP_SHA256 = "<from --print-digests>"
$env:EXPECTED_PACKAGE_COUNT = "400"
$env:EXPECTED_CHUNK_COUNT = "3700"
$env:EXPECTED_EMBEDDING_MODEL = "text-embedding-3-small"
$env:EXPECTED_EMBEDDING_DIMENSIONS = "1536"
$env:MAX_EMBEDDING_REQUESTS = "67"
$env:DATABASE_URL_ENV_NAME = "SUPABASE_DB_URL"
$env:PROVIDER_CREDENTIAL_ENV_NAME = "OPENAI_API_KEY"
$env:EXECUTION_ID = "<CONTROL_ROOM_EXECUTION_ID>"
$env:OBSERVED_PROJECT_REF = "abyqqeboyrkkwhjpwmtd"

bun run scripts/rag/inactive-import.ts --op preflight --env production --report-dir E:/Temp/rag-inactive-preflight
```

Expected: zero DB writes, zero provider calls, `preflight.json` with `dryRun: true`.

Stop if any digest/count/lock fails.

## STAGE 3B â€” Inactive import (future)

Requires `CONFIRM_INACTIVE_RAG_IMPORT=<future token>` and `PAID_CALL_AUTHORIZATION_ID=<future token>`.
Do not use `CR-RAG-INACTIVE-IMPORTER-20260724-01` for Production.

```powershell
$env:CONFIRM_INACTIVE_RAG_IMPORT = "<FUTURE_CONTROL_ROOM_TOKEN>"
$env:PAID_CALL_AUTHORIZATION_ID = "<FUTURE_PAID_CALL_AUTH>"
# plus all Stage 3A locks, with secrets injected into SUPABASE_DB_URL / OPENAI_API_KEY without printing

bun run scripts/rag/inactive-import.ts --op import --env production --execute --report-dir E:/Temp/rag-inactive-import
```

Ceilings: model `text-embedding-3-small`, dims `1536`, batch `64`, concurrency `2`, max attempts/batch `3`, hard request ceiling `67`.

Stop if request 68 would be required, any conflict, or active-corpus mutation â‰  0.

## STAGE 3C â€” Resume (future)

Reuse the exact same locks and `EXECUTION_ID` so `--version-key` / deterministic key matches:

```powershell
bun run scripts/rag/inactive-import.ts --op import --env production --execute --version-key "<SAME_STAGING_VERSION_KEY>" --report-dir E:/Temp/rag-inactive-resume
```

Must not create a second registry version for the same identity material.

## STAGE 4 â€” Staging validation (future; SELECT-only)

```powershell
bun run scripts/rag/inactive-import.ts --op validate --env production --execute --version-key "<SAME_STAGING_VERSION_KEY>" --report-dir E:/Temp/rag-inactive-validate
```

Expect: packages 400, staging chunks 3700, locale totals 1008/866/862/964, vector dims 1536, active mutations 0.

## Activation (separate; NOT part of importer Stages 3â€“4)

```sql
SELECT public.activate_rag_index_version('<authorized staging version>');
```

Requires service_role and a separate Control Room activation authorization. The importer never calls this.

---

# Lovable-native resumable importer

**Authorization (implementation / disposable only):** `CR-RAG-LOVABLE-NATIVE-RESUMABLE-IMPORTER-20260727-01`

## Complementary execution identities

| Path                                       | Lock                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Bun CLI (`scripts/rag/inactive-import.ts`) | Git checkout SHA via `git rev-parse HEAD` + digest locks                           |
| Lovable-native Worker                      | Corpus provenance (four artifact digests + frozen source SHA + migration contract) |

No caller-supplied observed SHA is trusted on either path.

## Admin control surface

Admin route: `/assistant-runtime` → **RAG LOVABLE-NATIVE IMPORT** panel.

Authorized actions only:

- Refresh status
- Initialize or resume
- Execute next batch (exactly one embedding batch per invocation)
- Validate staging
- View sanitized evidence

Activation and rollback UI controls are disabled and have no callable handlers in this PR.

## Server contract

- TanStack `createServerFn` + `requireSupabaseAuth` + admin `has_role`
- Service-role RPCs only (`rag_initialize_or_resume_import`, `rag_claim_next_import_batch`, …)
- Server-private `?raw` corpus imports under `src/lib/rag/lovable-native/corpus.server.ts`
- Batch plan: 64 chunks × 57 + final 52 = 58 batches; max 67 provider attempts
- Progress is DB session state (survives browser close)

## Post-merge Control Room sequence (do not execute in this PR)

1. Merge the approved PR through normal governance.
2. Reverify merged main and candidate path inventory.
3. Ask Lovable to pull/synchronize the approved repository state.
4. Apply only `20260727010000_rag_lovable_native_resumable_importer.sql`.
5. Publish the approved server code only after migration verification.
6. Run a read-only Lovable-native preflight (673 legacy / 0 locale / no active / digests / admin boundary / zero provider / zero writes).
7. Obtain separate Control Room authorization for initialization and paid batch execution.
8. Initialize or resume one staging session.
9. Execute one explicit bounded batch per authorized admin action.
10. Validate after all 58 batches complete.
11. Obtain separate activation authorization.
12. Activate transactionally.
13. Run Production retrieval and assistant smoke tests.
14. Use application-level rollback if required (`rag_deactivate_first_active_version` only when no prior superseded version).
15. Never use Lovable destructive full-database restore without Khalil’s explicit approval.
