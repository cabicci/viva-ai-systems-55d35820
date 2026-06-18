# MSA Canonical API Audit Pipeline

**Status:** Tooling · read-only audit · docs + scripts only  
**Effective:** 2026-06-04  
**Does not modify:** canonical drafts (unless a separate fix task is authorized), production lessons, runtime, Remotion, Bunny, RAG, PATHS

---

## Purpose

Run AI-assisted review of all `*.canonical.md` drafts against their **read-only** Egyptian production lesson sources. Output is a markdown report under `reports/` — never overwrites canonical files.

The runner is hardened for long corpus runs: per-lesson timeout, retry/backoff, checkpointing, resume, single-run lock, and separated content vs infrastructure error results.

---

## Prerequisites

Set **one** provider (preferred order if `AI_REVIEW_PROVIDER` unset):

1. `ANTHROPIC_API_KEY` → Anthropic (`claude-sonnet-4-6` default)
2. `OPENAI_API_KEY` → OpenAI (`gpt-4o-mini` default)
3. `GEMINI_API_KEY` (or `GEMINI_API_KEY_2` … `_4`) → Gemini (`gemini-2.5-flash` default)

Optional:

| Variable | Purpose |
|----------|---------|
| `AI_REVIEW_PROVIDER` | Force `anthropic` \| `openai` \| `gemini` |
| `AI_REVIEW_MODEL` | Override default model |
| `AI_REVIEW_DELAY_MS` | Delay between API calls (default `1200`) |
| `AI_REVIEW_TIMEOUT_MS` | Per-lesson API timeout (default `90000`) |
| `AI_REVIEW_MAX_ATTEMPTS` | Retry attempts for retryable errors (default `3`) |
| `AI_REVIEW_RETRY_BACKOFF_MS` | Comma-separated backoff delays (default `5000,15000,30000`) |

**Never commit API keys.** Use shell environment variables locally (do not commit `.env`).

---

## Commands

```bash
# Test batch (3 lessons)
bun scripts/adaptive-canonical/audit-canonical.ts --limit 3

# Full corpus — foreground only (do not background)
bun scripts/adaptive-canonical/audit-canonical.ts --all

# Resume after interruption (skips PASS / PASS WITH NOTES)
bun scripts/adaptive-canonical/audit-canonical.ts --all --resume

# Retry only infrastructure/API failures
bun scripts/adaptive-canonical/audit-canonical.ts --retry-errors

# Retry only content failures (explicit)
bun scripts/adaptive-canonical/audit-canonical.ts --retry-content-fails

# Remove stale single-run lock
bun scripts/adaptive-canonical/audit-canonical.ts --force-unlock

# Non-interactive full run (explicit opt-in only)
bun scripts/adaptive-canonical/audit-canonical.ts --all --allow-background

# Selected lessons
bun scripts/adaptive-canonical/audit-canonical.ts --lessons intro-m1-l1-what-is-ai,creator-m1-l1-why-content

# Preflight + local heuristics only (no API key)
bun scripts/adaptive-canonical/audit-canonical.ts --limit 3 --dry-run
```

---

## Result types

| Result | Meaning |
|--------|---------|
| `PASS` | Clean API review |
| `PASS WITH NOTES` | Soft notes only |
| `CONTENT FAIL` | Hard content blockers (objective drift, wrong quiz key, etc.) |
| `ERROR_RETRY_REQUIRED` | Network/API/timeout failure after retries — rerun with `--retry-errors` |

---

## Outputs

| File | Contents |
|------|----------|
| `reports/API_AUDIT_checkpoint.json` | Live checkpoint (updated after each lesson) |
| `reports/API_AUDIT_checkpoint.md` | Partial human-readable checkpoint |
| `reports/API_AUDIT_<date>.md` | Final human-readable report for the run |
| `reports/API_AUDIT_<date>.json` | Final machine-readable report (**gitignored**) |
| `reports/.audit.lock` | Single-run lock (auto-removed on clean exit; **gitignored**) |

**Committed gate record:** [`ADAPTIVE_LESSON_ENGINE.md` §9f](../ADAPTIVE_LESSON_ENGINE.md) — local `reports/` markdown may exist for debugging but checkpoint/lock/JSON are not committed.

---

## Per-lesson checks

1. Preflight: PATHS slug, not archived, production file exists  
2. Local heuristics: §4 length, slugValidation, reviewStatus  
3. API review: objective, oneAha, mission rubric, quiz key, hallucination, MSA clarity, gloss, metadata, assistant boundaries, video-script suitability

**Hard blockers** → `CONTENT FAIL`. **Soft notes** → `PASS WITH NOTES`. **API/network errors** → `ERROR_RETRY_REQUIRED`.

---

## Script layout

```
scripts/adaptive-canonical/
  audit-canonical.ts
  types.ts
  lib/
    corpus.ts
    extract.ts
    retry.ts
    lock.ts
    checkpoint.ts
  reviewers/
    index.ts
    prompt.ts
    anthropic.ts
    openai.ts
    gemini.ts
```

---

*Pipeline owner: Masaarat curriculum architecture · Audit reports only.*
