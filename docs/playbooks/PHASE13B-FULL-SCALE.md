# Phase 13B — Full-scale learner package generation (300 cells)

Matrix-ready scaffold for generating **100 lessons × 3 learner-facing locales** toward the localized catalog goal. This phase does **not** run automatically and defaults to **dry-run only**.

## ar-MSA source vs learner-final audit

| Path | Role today | Phase 13B behavior |
|------|------------|-------------------|
| `src/lib/locale-lessons/ar-MSA/lessons/` | **Canonical source** read by `loadMsaLessonPackage()` | **Read-only** during generation — retains internal production-reference sections |
| `src/lib/locale-lessons/ar-MSA/generated/learner-final/lessons/` | *(new derived output)* | **Write target** for sanitized, title-locked ar-MSA learner packages |
| `src/lib/locale-lessons/ar-MSA/lesson-titles.json` | Catalog title index | Unchanged — used for title lock at finalization |

### Recommended strategy

**Use a separate derived output path for ar-MSA learner-final packages.**

- Canonical/source packages stay in `ar-MSA/lessons/` with internal authoring notes intact.
- Learner-final ar-MSA is deterministic: load canonical → `finalizeLearnerFacingLocalePackageForWrite()` → write to `generated/learner-final/lessons/`.
- Promotion to a runtime-facing path (if ever the same as canonical) is a **separate reviewed merge**, never an in-place overwrite during generation.

`en` and `ar-Gulf` continue writing to `src/lib/locale-lessons/{locale}/lessons/` (no canonical conflict).

## Architecture

**Per locale pipeline:**

| Locale | Pipeline | OpenAI | Finalization |
|--------|----------|--------|--------------|
| `ar-MSA` | `learner-final-derived` | Never | sanitize + leak check + title lock |
| `ar-Gulf` | `fragment-adapt` | When paid confirmed | sanitize + leak check + title lock |
| `en` | `fragment-adapt` | When paid confirmed | sanitize + leak check + title lock |

## Workflow

File: [`.github/workflows/locale-phase13b-full-generation.yml`](../../.github/workflows/locale-phase13b-full-generation.yml)

**Trigger:** `workflow_dispatch` only (not run by this prep task).

### Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `source_scope` | `ar-MSA` | Canonical source scope |
| `target_locales` | `all` | `ar-MSA`, `ar-Gulf`, `en`, comma-separated subset, or `all` |
| `lesson_ids` | *(empty)* | Optional comma-separated lesson IDs (limits all selected locales) |
| `retry_cells` | *(empty)* | Retry-only-failed: `locale/lessonId` pairs or JSON array |
| `dry_run` | `true` | Mock/deterministic validation only — no writes by default |
| `confirm_write` | `false` | Must be `true` with `dry_run=false` to write lesson JSON |
| `confirm_paid_api` | `false` | Must be `true` with `dry_run=false` for ar-Gulf/en OpenAI calls |

### Safety

- Default: **dry-run**, no paid APIs, no package writes.
- ar-MSA never calls OpenAI.
- ar-Gulf/en paid calls require `dry_run=false` **and** `confirm_paid_api=true`.
- Any write requires `dry_run=false` **and** `confirm_write=true`.
- ar-MSA writes are blocked from canonical `lessons/` path.
- Per-cell artifacts: `locale-phase13b-full-{locale}-{lessonId}`.
- Combined report: `phase13b-full-report.json`.

### Jobs

1. **prepare-matrix** — builds 300-cell `{locale, lessonId}` matrix (`fail-fast: false` on generate).
2. **generate-cell** — one cell per matrix row.
3. **collect-report** — merges job results into `phase13b-full-report.json` with retry fields.

## Local commands (no paid API)

```bash
# Print full 300-cell matrix
bun run scripts/locale-lessons/print-phase13b-full-matrix.ts \
  --source_scope ar-MSA --target_locales all

# Dry-run one ar-MSA learner-final cell (deterministic, no write)
bun run scripts/locale-lessons/run-phase13b-full-cell.ts \
  --source_scope ar-MSA --locale ar-MSA --lesson-id intro-m1-l1-what-is-ai --dry_run true

# Dry-run one en cell (mock adapt, no OpenAI, no write)
bun run scripts/locale-lessons/run-phase13b-full-cell.ts \
  --source_scope ar-MSA --locale en --lesson-id intro-m1-l1-what-is-ai --dry_run true

# Collect report after artifacts are present
bun run scripts/locale-lessons/collect-phase13b-full-report.ts \
  --source_scope ar-MSA --target_locales all --dry_run true
```

## Retry-only-failed

1. Download `locale-phase13b-full-report-{run}` from the workflow.
2. Copy `retryCells` or comma-separated `retryLessonIds` into the `retry_cells` input.
3. Re-dispatch with `dry_run=false`, `confirm_write=true`, and for ar-Gulf/en cells also `confirm_paid_api=true`.

Example:

```text
retry_cells=ar-Gulf/intro-m1-l1-what-is-ai,en/intro-m1-l1-what-is-ai
```

## Promotion note

Learner-final ar-MSA under `generated/learner-final/lessons/` is staging until a separate approved merge promotes packages for runtime serving. Canonical `ar-MSA/lessons/` remains the authoring source of truth.
