# Dispatch Authorization — Lovable-only (fail-closed)

## Routing lock

```
0 — Masaarat Control Room
      ↓ (issues controlRoomAuthorizationId + approved SHAs)
1 — Lovable
      ↓ (workflow_dispatch with required authorization inputs)
2 — GitHub Actions (lesson-driven-400-visual-pipeline.yml)
```

**Cursor never dispatches.** CLI, unauthenticated API callers, and GitHub UI clicks without Lovable actor credentials must fail the `dispatch-authority` gate.

There is **no** local or Cursor dispatch command for this workflow.

## Content SHA vs execution SHA

Production authorization separates two git identities:

| Identity | Workflow input / env | Meaning |
|----------|----------------------|---------|
| **Content SHA** | `approved_content_sha` → `CONTENT_SHA` / `APPROVED_CONTENT_SHA` | Immutable lesson-visual content base (`AUTHORITATIVE_BASE_SOURCE_SHA`). Matches `sourceSha` on `AUTHORIZED_MANIFEST.json` and every master file. |
| **Execution SHA** | `execution_sha` → `EXECUTION_SHA` / `APPROVED_EXECUTION_SHA` / `ACTUAL_EXECUTION_SHA` | Explicitly authorized workflow commit to check out and run. Must equal checked-out `HEAD`. May differ from content SHA. |

**Manifest/master `sourceSha` is content-only.** A new authorized execution commit does **not** require repinning manifests or masters when content bytes are unchanged.

Runtime production artifacts (receipts, mappings, rights, validations, run summaries) record both `contentSha` and `executionSha`. Image byte checksums remain `contentSha256` — do not confuse with content SHA.

## Required inputs on every `workflow_dispatch`

| Input | Rule |
|-------|------|
| `control_room_authorization_id` | Non-empty Control Room id with `CR-` prefix |
| `approved_content_sha` | 40-char hex; immutable content base; must match manifest `sourceSha` and `AUTHORITATIVE_BASE_SOURCE_SHA` |
| `execution_sha` | 40-char hex; authorized checkout commit; must equal checked-out HEAD |
| `approved_manifest_sha256` | 64-char hex of `docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json` **file bytes** |
| `approved_pilot_manifest_sha256` | Required for `mode=pilot` — 64-char hex of `AUTHORIZED_PILOT_12.json` bytes; empty for full/failed-only |
| `dispatch_actor` | Must be in Lovable allowlist (e.g. `lovable`) |
| `mode` | `pilot` \| `full` \| `failed-only` |
| `max_parallel` | Integer in `[1, 50]` |
| `prior_receipt_bundle_artifact` | Required for `failed-only` — prior-run artifact name with `*.receipt.json` |
| `prior_receipt_bundle_run_id` | Required for `failed-only` — numeric source workflow run id |

Legacy `source_sha` env aliases map to **content** SHA only (failed-only old receipt bundles).

## Fail-closed checks

### `dispatch-authority` job

1. `github.actor` ∈ allowlist (`vars.LOVABLE_DISPATCH_ACTORS` preferred, `secrets.LOVABLE_DISPATCH_ACTORS` fallback). **Empty allowlist = reject.**
2. `dispatch_actor` ∈ same allowlist; values like `cursor`, `cli`, `cursor-agent`, `github-ui`, `unauthenticated`, `api` always reject.
3. `control_room_authorization_id` present and matches `CR-…` format.
4. `approved_content_sha` is valid 40-char hex (not a branch/tag name).
5. `approved_execution_sha` is valid 40-char hex (not a branch/tag name).
6. Checked-out `git rev-parse HEAD` == `execution_sha` input.
7. `sha256(AUTHORIZED_MANIFEST.json bytes)` == `approved_manifest_sha256` input.

Content SHA is **not** required to equal execution SHA.

### `preflight` job (before matrix)

1. Required production variables/secrets present for the selected `LESSON_VISUALS_EXECUTION_MODE` (see `CONFIGURATION.md`).
2. Manifest structure: 100 lessons, 4 locales, 400 cells; manifest `sourceSha` equals authoritative content base.
3. Budget + retry-aware provider-attempt quota projection fail-closed (integer micro-USD; `eligible × (1 + max_retries)`).
4. Bounded `max_parallel`.
5. Typed dispatch authorization validation.
6. For `failed-only`: download and schema-validate the authorized prior receipt bundle before computing eligible cells / attempt quota.

Any failure stops the workflow before cell work.

## Who may dispatch

Only **Lovable**, acting after Control Room authorization. Local unit tests use a fixture allowlist (`["lovable"]`) so validation functions stay pure and offline.

## Explicit non-goals

- No Cursor-initiated `workflow_dispatch`
- No production publish / Gallery / Bunny / Preview promotion from this workflow
- No auto-merge to `main`
- No authoritative 12-asset pilot dispatch
- No paid provider calls from unit tests
