# Phase 13A — Localized lesson pilot generation

Matrix-ready scaffold for generating **small pilot batches** (10–20 lessons) toward the 300-lesson localized goal. This phase does **not** generate the full catalog.

## Architecture

**Current production path (fragment pipeline):**

1. **Extract** — `extract-localizable-fields.ts` pulls text from ar-MSA source packages.
2. **Adapt** — OpenAI adapts **text map only** (`openai-fragment-adapter.ts`).
3. **Inject** — `inject-localized-fields.ts` merges adapted text into the source structure.

**Legacy path (still in repo, not used by Phase 13A workflow):**

- `generate-localized-pilot.ts` / `openai-adaptation.ts` — full JSON lesson generation via `response_format: json_object`.

Phase 13A uses the **Extract → Adapt → Inject** fragment pipeline only.

## Workflow

File: [`.github/workflows/locale-phase13a-pilot-generation.yml`](../../.github/workflows/locale-phase13a-pilot-generation.yml)

**Trigger:** `workflow_dispatch` only (no automatic runs, no repository_dispatch).

### Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `source_scope` | `ar-MSA` | Source packages (only `ar-MSA` supported in 13A) |
| `target_locales` | `all` | `ar-Gulf`, `en`, or `all` |
| `pilot_count` | `10` | 3–20 lessons |
| `lesson_ids` | *(empty)* | Optional override; use for **retry-only-failed** |
| `dry_run` | `true` | Mock adapt only — no OpenAI, no lesson JSON |
| `confirm_paid_api` | `false` | Must be `true` when `dry_run=false` |
| `commit_results` | `false` | Local commit on runner only — **never pushes** |

### Safety

- Paid OpenAI calls require **both** `dry_run=false` and `confirm_paid_api=true`.
- Secrets: `new_openai` → `OPENAI_API_KEY` (never logged).
- Per-cell artifacts: `locale-phase13a-pilot-{locale}-{lessonId}`.
- Failed cells: `locale-phase13a-pilot-{locale}-{lessonId}-failed`.
- Combined report: `locale-phase13a-pilot-report-{run_number}`.

### Jobs

1. **prepare-matrix** — validates inputs, builds lesson×locale matrix.
2. **generate-cell** — one cell per matrix row (`fail-fast: false`).
3. **collect-report** — merges job results into `phase13a-pilot-report.json`.
4. **commit-results** — optional; only when `commit_results=true` and dry run is off.

## Pilot lesson selection

Script: `scripts/locale-lessons/lib/phase13-pilot-manifest.ts`

Deterministic cross-path batch:

1. Always includes Phase 2C sample lessons (intro · builder · business).
2. Round-robin one lesson per path (`intro`, `builder`, `creator`, `automator`, `analyst`, `business`).
3. Fills remainder from ar-MSA manifest order.

## Local commands (no paid API)

```bash
# Print matrix JSON for 10 lessons × all locales
bun run scripts/locale-lessons/print-phase13-pilot-matrix.ts \
  --source_scope ar-MSA --target_locales all --pilot_count 10

# Dry-run one cell (mock adapt, writes job result only)
bun run scripts/locale-lessons/run-phase13-pilot-cell.ts \
  --source_scope ar-MSA --locale en --lesson-id intro-m1-l1-what-is-ai --dry_run true

# Collect report after artifacts are present
bun run scripts/locale-lessons/collect-phase13-pilot-report.ts \
  --source_scope ar-MSA --target_locales all --pilot_count 10 --dry_run true
```

## Retry-only-failed

1. Download `locale-phase13a-pilot-report-{run}` from the failed workflow.
2. Copy failed `locale/lesson_id` pairs into `lesson_ids` input (comma-separated).
3. Re-dispatch with the same `pilot_count` or omit count when `lesson_ids` is set.

## Validators (unchanged)

Aggregate contract: `bun run scripts/locale-lessons/validate-localization-contract.ts`

Sub-checks: title-index-parity, manifest-curriculum-sync, ui-key-parity, locale-leak-scan.

## Related legacy workflows

| Workflow | Notes |
|----------|-------|
| `locale-pilot-generation.yml` | Legacy full-JSON pilot (single job) |
| `locale-fragment-pilot-generation.yml` | Fragment matrix without Phase 13A safety defaults |

Prefer **Phase 13A** for new pilot runs.
