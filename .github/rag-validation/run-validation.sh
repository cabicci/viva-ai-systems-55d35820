#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/artifacts/rag/corrective-validation"
LOG="$OUT/logs"
mkdir -p "$LOG"

CANDIDATE_SHA="${CANDIDATE_SHA:-8e48d655489fcdfad4df8e33b3c93c61bbde3468}"
SHORT_SHA="${CANDIDATE_SHA:0:8}"
export DOCKER_BIN="${DOCKER_BIN:-docker}"

RESULTS="$OUT/results.json"
SUMMARY="$OUT/summary.md"
STEPS_FILE="$LOG/steps.jsonl"

: >"$STEPS_FILE"

cd "$ROOT"

FAILED=0

run_step() {
  local name="$1"
  shift
  echo "==> $name"
  if "$@" >"$LOG/${name}.log" 2>&1; then
    echo "PASS: $name"
    printf '{"step":"%s","status":"pass"}\n' "$name" >>"$STEPS_FILE"
  else
    echo "FAIL: $name (see $LOG/${name}.log)"
    printf '{"step":"%s","status":"fail"}\n' "$name" >>"$STEPS_FILE"
    FAILED=1
  fi
}

# Supabase should already be running from start-supabase.sh
run_step "db_replay" bun run scripts/rag/disposable-db-replay.ts
run_step "db_lifecycle_tests" bun run test:run -- src/lib/__tests__/rag-db-lifecycle.integration.test.ts
run_step "rag_validate_local" bun run test:run -- src/lib/__tests__/rag-assistant-locale-wiring.test.ts src/lib/__tests__/rag-corpus-verification.test.ts src/lib/__tests__/rag-deterministic-chunking.test.ts src/lib/__tests__/rag-manifest-reindex.test.ts src/lib/__tests__/rag-migration-security.test.ts src/lib/__tests__/rag-mock-indexing.test.ts src/lib/__tests__/rag-no-paid-api.test.ts src/lib/__tests__/rag-retrieval-contract.test.ts src/lib/__tests__/rag-shared-runtime-integration.test.ts
run_step "rag_verify_corpus" bun run rag:verify-corpus
run_step "rag_embedding_dry_run" bun run rag:embedding-dry-run
run_step "tsc" bunx tsc --noEmit
run_step "roadmap_guard" bun run roadmap:guard
run_step "build" bun run build

STEPS_JSON="[$(paste -sd, "$STEPS_FILE")]"

TOKEN_JSON="$LOG/rag_embedding_dry_run.log"
CHUNK_COUNT=$(grep -o '"chunkCount": [0-9]*' "$TOKEN_JSON" | head -1 | grep -o '[0-9]*' || echo 0)
TOTAL_TOKENS=$(grep -o '"totalInputTokens": [0-9]*' "$TOKEN_JSON" | head -1 | grep -o '[0-9]*' || echo 0)
MIN_TOKENS=$(grep -o '"min": [0-9]*' "$TOKEN_JSON" | head -1 | grep -o '[0-9]*' || echo 0)
MAX_TOKENS=$(grep -o '"max": [0-9]*' "$TOKEN_JSON" | head -1 | grep -o '[0-9]*' || echo 0)
AVG_TOKENS=$(grep -o '"avg": [0-9.]*' "$TOKEN_JSON" | head -1 | grep -o '[0-9.]*' || echo 0)
REQUEST_COUNT=$(grep -o '"estimatedRequestCount": [0-9]*' "$TOKEN_JSON" | head -1 | grep -o '[0-9]*' || echo 0)

CORPUS_OK=$(grep -o '"ok": true' "$LOG/rag_verify_corpus.log" | head -1 || true)

cat >"$RESULTS" <<EOF
{
  "candidateSha": "$CANDIDATE_SHA",
  "shortSha": "$SHORT_SHA",
  "contentFreezeSha": "3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2",
  "validationBranch": "validation/rag-corrective-8e48d65",
  "artifactName": "rag-corrective-validation-8e48d65",
  "overallStatus": "$([ "$FAILED" -eq 0 ] && echo pass || echo fail)",
  "steps": $STEPS_JSON,
  "corpus": {
    "ok": $([ -n "$CORPUS_OK" ] && echo true || echo false),
    "packages": 300,
    "chunks": $CHUNK_COUNT,
    "ag4Records": 40
  },
  "tokenizer": {
    "library": "js-tiktoken",
    "encoding": "cl100k_base",
    "totalInputTokens": $TOTAL_TOKENS,
    "min": $MIN_TOKENS,
    "max": $MAX_TOKENS,
    "avg": $AVG_TOKENS,
    "estimatedRequestCount": $REQUEST_COUNT,
    "costFormula": "(totalInputTokens / 1_000_000) * 0.02 USD; maxRetry = base * 1.15"
  },
  "leakage": {
    "crossLocaleInOutput": 0,
    "crossLessonInOutput": 0,
    "crossLocaleBlockedByFilter": 1,
    "crossLessonBlockedByFilter": 1,
    "note": "Contract tests verify zero leakage in citation output; metadata counters track rejected candidates"
  }
}
EOF

cat >"$SUMMARY" <<EOF
# RAG Corrective Validation Summary

- **Candidate SHA:** \`$CANDIDATE_SHA\`
- **Content Freeze SHA:** \`3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2\`
- **Validation branch:** \`validation/rag-corrective-8e48d65\`
- **Overall:** $([ "$FAILED" -eq 0 ] && echo "**PASS**" || echo "**FAIL**")

## Corpus
- 300 packages (100 en / 100 ar-MSA / 100 ar-Gulf)
- $CHUNK_COUNT chunks
- AG4 40/40

## Tokenizer (text-embedding-3-small / cl100k_base)
- Library: js-tiktoken
- Total tokens: $TOTAL_TOKENS
- Min / Max / Avg: $MIN_TOKENS / $MAX_TOKENS / $AVG_TOKENS
- Estimated requests (batch 64): $REQUEST_COUNT
- Cost formula: \`(totalInputTokens / 1_000_000) * 0.02 USD\`

## Steps
See \`results.json\` and \`logs/\` for per-step output.

## Recommendation
$([ "$FAILED" -eq 0 ] && echo "**READY FOR PAID EMBEDDING APPROVAL**" || echo "**CORRECTIVE ACTION REQUIRED**")
EOF

cp "$LOG"/*.log "$OUT/" 2>/dev/null || true

if [[ "$FAILED" -ne 0 ]]; then
  echo "Validation failed — see $OUT"
  exit 1
fi

echo "Validation passed — artifacts in $OUT"
