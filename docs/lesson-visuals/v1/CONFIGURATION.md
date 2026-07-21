# Lesson Images — configuration contract

This document names required GitHub configuration for the Lesson Images production workflow.
**Presence of these values in the repository is not proven unless independently verified.**
Secret values must never be logged or committed.

## Scope

- Authoritative production target: **100 lessons × 4 locales = 400 cells**
- Authoritative **12-cell pilot** via `docs/lesson-visuals/v1/AUTHORIZED_PILOT_12.json` (deterministic subset of the 400)
- Supported run modes: `pilot` | `full` | `failed-only`
- Dispatch: **Lovable-only** after Control Room authorization (Cursor/local fail-closed)
- Production MIME policy: **`image/png` only** until equivalent validators exist for other formats
- Production execution uses the configured **real HTTP provider transport**; dry-run uses the offline mock only

## Required repository variables

| Name | Purpose |
|------|---------|
| `LOVABLE_DISPATCH_ACTORS` | Preferred allowlist (comma-separated). Empty = fail closed. |
| `LESSON_VISUALS_EXECUTION_MODE` | `production` or `dry-run` (required; no implicit default in workflow) |
| `LESSON_VISUALS_PROVIDER_NAME` | Configured provider identity |
| `LESSON_VISUALS_PROVIDER_MODEL` | Model / renderer identity |
| `LESSON_VISUALS_PROVIDER_ACCOUNT_ID` | Expected provider account ID (non-secret identity; required) |
| `LESSON_VISUALS_PROVIDER_PROJECT_ID` | Expected provider project ID when the provider uses projects (may be empty) |
| `LESSON_VISUALS_AI_AUTH_ID` | Expected provider authorization ID (non-secret identity; required) |
| `LESSON_VISUALS_PROVIDER_ENDPOINT` | HTTPS provider generate endpoint (**required in production**) |
| `LESSON_VISUALS_PROVIDER_TIMEOUT_MS` | Provider HTTP timeout in ms (optional; default 60000) |
| `LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS` | Run budget ceiling (integer micro-USD) |
| `LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS` | Per-cell ceiling (integer micro-USD; must be ≤ run) |
| `LESSON_VISUALS_MAX_OUTPUT_BYTES` | Max accepted output bytes |
| `LESSON_VISUALS_ALLOWED_MIME_TYPES` | Must be `image/png` only (preflight rejects unsupported MIME) |
| `LESSON_VISUALS_REQUIRED_WIDTH` | Exact required width |
| `LESSON_VISUALS_REQUIRED_HEIGHT` | Exact required height |
| `LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA` | Max total provider generate attempts for the run |
| `LESSON_VISUALS_MAX_RETRIES` | Max retries per eligible cell (≤ hard ceiling 5) |
| `LESSON_VISUALS_OUTPUT_STORAGE_TARGET` | Artifact/storage prefix (`artifact://…` or `external:…`) |

## Required / conditional secrets

| Name | Purpose |
|------|---------|
| `LOVABLE_DISPATCH_ACTORS` | Fallback allowlist if variable unset |
| `LESSON_VISUALS_PROVIDER_API_KEY` | Provider API credential (**required in production**) |
| `LESSON_VISUALS_STORAGE_CREDENTIAL` | Required when `LESSON_VISUALS_OUTPUT_STORAGE_TARGET` starts with `external:` |

Account / project / auth IDs and the provider endpoint are **variables** (identity/config), not secrets. Secrets must never be logged.

## Authoritative 12-cell pilot

| Item | Value |
|------|-------|
| Manifest path | `docs/lesson-visuals/v1/AUTHORIZED_PILOT_12.json` |
| Schema | `lesson-visual-pilot-manifest/v1` |
| Selection | `locale-first-n/v1` — first 3 cells per locale from full manifest order |
| Count | exactly **12** (3 × 4 locales) |
| Digest input | `approved_pilot_manifest_sha256` (**required when `mode=pilot`**) |
| Full digest | still requires `approved_manifest_sha256` of the 400-cell file |

Commands:

```bash
bun run lesson-visuals:pilot:check   # read-only verification (no mutation)
bun run lesson-visuals:pilot:write   # regenerate checked-in pilot bytes (commit intentionally)
```

Pilot mode expands **only** the 12 pilot cells. It is not an arbitrary subset facility.
`full` remains 400. `failed-only` validates the 400-cell matrix and does not use the pilot manifest.

## Money representation

All ceilings and costs use **integer micro-USD** strings (`1 USD = 1_000_000`).
Financial comparisons use `bigint` — not IEEE binary floating point.

## Retry-aware provider-attempt quota

Independent of financial budget:

```
max_provider_attempts = eligible_cells × (1 + max_retries)
```

| Mode | Eligible cells |
|------|----------------|
| `pilot` | 12 (pilot matrix; no failed-only skips) |
| `full` | 400 |
| `failed-only` | 400 − count of fully validated ACCEPTED prior receipts |

Rules:

- `skipped + eligible` must reconcile to the mode's authoritative scope (12 or 400)
- Invalid prior evidence **cannot** reduce the quota envelope
- Configured `LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA` must be ≥ `max_provider_attempts`
- Runtime attempts exceeding the envelope fail closed before provider invoke
- Budget projection remains a separate gate: `eligible × (1 + max_retries) × cell_ceiling ≤ run_ceiling`

## failed-only prior receipt bundle

Intentional, immutable prior-run artifact only — no arbitrary local path scanning.

Workflow inputs (both required when `mode=failed-only`):

| Input | Purpose |
|-------|---------|
| `prior_receipt_bundle_artifact` | Artifact name containing `*.receipt.json` files |
| `prior_receipt_bundle_run_id` | Numeric source workflow run id that uploaded that artifact |

Downloaded via `actions/download-artifact` with `repository` + `run-id` + `github-token`.

Loader: `loadPriorAcceptedReceipts()` in `src/lib/lesson-visuals/v1/production/priorReceipts.ts`.

Fail-closed when:

- failed-only without artifact name / run id
- artifact cannot be resolved/downloaded
- bundle empty / no `*.receipt.json`
- malformed / schema-invalid receipt
- duplicate receipt for one cell
- wrong status (must be `ACCEPTED`)
- stale source SHA / wrong manifest digest
- wrong lesson/locale/cell identity
- missing/mismatched checksum or fingerprint
- fixture/mock receipt offered for **production** reuse

Semantics:

- `full`: evaluate all 400 cells for generation
- `failed-only`: still validate the authoritative 400-cell matrix; skip only cells backed by fully valid prior ACCEPTED evidence
- `pilot`: evaluate exactly the 12 pilot cells; does not load prior receipts
- Missing receipt for a cell ⇒ regenerate (does not shrink scope)
- No smaller user-selected target set is permitted

## Runtime schema enforcement

Production artifacts are schema-validated before write/upload/reuse:

- receipt, mapping, rights/provenance, output validation, failure, run summary, aggregate report

Schemas live under `docs/lesson-visuals/v1/schemas/production-*.schema.json`.
Runtime validator: `src/lib/lesson-visuals/v1/production/schemaValidator.ts` (fail-closed; no external dependency).

## Checksum binding

Independently calculated SHA-256 of final accepted output bytes must agree across:

- output validation record
- receipt
- mapping
- rights / provenance
- aggregate artifact index (when present)

Provider-reported checksums are never trusted alone.

## Greenfield / no-legacy

Normalized path/URL checks reject Gallery, legacy directories, Bunny legacy URLs, rollback manifests, historical candidate paths, known legacy checksums, and inconsistent `prohibitedLegacySource`.

Legacy assets may remain in-repo as rollback evidence only — never as provider input or accepted production mapping.

## MIME policy

Production accepts **`image/png` only**:

- correct magic bytes
- successful decode
- exact configured dimensions
- no HTML/error-document masquerade
- byte length within limit
- independent SHA-256

Preflight rejects any configured MIME list containing unsupported types.

## Required artifact uploads

Workflow required uploads use `if-no-files-found: error`.

| Status | Required cell artifacts |
|--------|-------------------------|
| ACCEPTED | receipt, mapping, rights, validation, `output.png` |
| FAILED / NON_RETRYABLE / RETRYABLE | receipt + `failure.json` |
| SKIPPED (failed-only) | receipt |

Aggregate QA artifacts (run summary + aggregate validation) are required even when cells fail.

Optional diagnostics must be explicitly named optional and excluded from success invariants.

## dry-run vs production

| Mode | Transport | Paid network generation | Fixture/stub |
|------|-----------|-------------------------|--------------|
| `dry-run` | Offline mock only | Forbidden | Fixture marker on receipts; production reuse rejected |
| `production` | Real HTTP transport (`LESSON_VISUALS_PROVIDER_ENDPOINT` + API key) | Allowed when configured | Rejected |

No automatic fallback from production → dry-run or real → mock.

Transport: `src/lib/lesson-visuals/v1/production/httpProvider.ts` via `selectProviderTransport`.
Response must satisfy the typed provider contract; output/rights/schema/checksum/quota/budget gates remain fail-closed.

## Local scripts

```bash
bun run lesson-visuals:validate   # strictly read-only
bun run lesson-visuals:test
bun run lesson-visuals:repin:check
bun run lesson-visuals:pilot:check
```

`lesson-visuals:validate` must not rewrite ledgers, manifests, masters, fixtures, or any tracked file.

Local unit tests may exercise mocks and injected HTTP doubles. There is **no** supported Cursor/local workflow dispatch path.
Do not document or use a Cursor dispatch command.
