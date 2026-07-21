# Lesson Images — configuration contract

This document names required GitHub configuration for the Lesson Images production workflow.
**Presence of these values in the repository is not proven unless independently verified.**
Secret values must never be logged or committed.

## Scope

- Authoritative production target: **100 lessons × 4 locales = 400 cells**
- There is **no** authoritative 12-asset pilot mode
- Supported run modes: `full` | `failed-only` (both operate on the full 400-cell matrix)
- Dispatch: **Lovable-only** after Control Room authorization (Cursor/local fail-closed)

## Required repository variables

| Name | Purpose |
|------|---------|
| `LOVABLE_DISPATCH_ACTORS` | Preferred allowlist (comma-separated). Empty = fail closed. |
| `LESSON_VISUALS_EXECUTION_MODE` | `production` or `dry-run` (required; no implicit default in workflow) |
| `LESSON_VISUALS_PROVIDER_NAME` | Configured provider identity |
| `LESSON_VISUALS_PROVIDER_MODEL` | Model / renderer identity |
| `LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS` | Run budget ceiling (integer micro-USD) |
| `LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS` | Per-cell ceiling (integer micro-USD; must be ≤ run) |
| `LESSON_VISUALS_MAX_OUTPUT_BYTES` | Max accepted output bytes |
| `LESSON_VISUALS_ALLOWED_MIME_TYPES` | Comma-separated MIME allowlist (e.g. `image/png`) |
| `LESSON_VISUALS_REQUIRED_WIDTH` | Exact required width |
| `LESSON_VISUALS_REQUIRED_HEIGHT` | Exact required height |
| `LESSON_VISUALS_QUOTA_CELLS` | Max cells per run (must be ≥ 400 for full mode) |
| `LESSON_VISUALS_MAX_RETRIES` | Max retries per cell for budget projection |
| `LESSON_VISUALS_OUTPUT_STORAGE_TARGET` | Artifact/storage prefix (`artifact://…` or `external:…`) |

## Required / conditional secrets

| Name | Purpose |
|------|---------|
| `LOVABLE_DISPATCH_ACTORS` | Fallback allowlist if variable unset |
| `LESSON_VISUALS_PROVIDER_API_KEY` | Provider API credential (**required in production**) |
| `LESSON_VISUALS_PROVIDER_ACCOUNT_ID` | Provider account/project identity (**required in production**) |
| `LESSON_VISUALS_AI_AUTH_ID` | Provider authorization identifier (**required in production**) |
| `LESSON_VISUALS_STORAGE_CREDENTIAL` | Required when `LESSON_VISUALS_OUTPUT_STORAGE_TARGET` starts with `external:` |

## Money representation

All ceilings and costs use **integer micro-USD** strings (`1 USD = 1_000_000`).
Financial comparisons use `bigint` — not IEEE binary floating point.

## dry-run vs production

| Mode | Mock transport | Paid network generation | Fixture/stub bytes |
|------|----------------|-------------------------|--------------------|
| `dry-run` | Allowed (offline) | Forbidden in this candidate | Fixture **markers** in bytes rejected by validators when forced; dry-run mock emits clean PNG |
| `production` | **Rejected** | Not enabled in this candidate (workflow cell step fails closed until a non-mock transport is approved) | Rejected |

## Greenfield / no-legacy

- No legacy-image reuse
- Rights records require `prohibitedLegacySource: false`
- Workflow never publishes to Gallery, Bunny, Lovable runtime, or production CDN

## Local scripts

Local unit tests may exercise mocks. There is **no** supported Cursor/local workflow dispatch path.
Do not document or use a Cursor dispatch command.
