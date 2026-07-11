# RAG Corrective Validation Scripts

Temporary CI-only validation infrastructure for disposable Docker+Supabase replay on Ubuntu runners.

## Files

- `start-supabase.sh` — applies validation migration shims, starts disposable Supabase on Ubuntu
- `shims/` — temporary SQL patches injected before migration replay (validation branch only)
- `run-validation.sh` — orchestrates migration replay, DB lifecycle tests, RAG suite, tsc, roadmap guard, and build; writes `artifacts/rag/corrective-validation/{summary.md,results.json,logs/}`

## Usage (local Linux with Docker)

```bash
export DOCKER_BIN=docker
export CANDIDATE_SHA=8e48d655489fcdfad4df8e33b3c93c61bbde3468
bash .github/rag-validation/run-validation.sh
```

## GitHub Actions

Workflow: `.github/workflows/rag-corrective-validation.yml`

Triggers:
- `workflow_dispatch` (optional `candidate_sha` input)
- Push to `validation/rag-corrective-*` branches only

Manual trigger:

```bash
gh workflow run rag-corrective-validation.yml \
  --ref validation/rag-corrective-8e48d65 \
  -f candidate_sha=8e48d655489fcdfad4df8e33b3c93c61bbde3468
```
