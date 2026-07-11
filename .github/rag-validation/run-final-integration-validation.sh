#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export DOCKER_BIN="${DOCKER_BIN:-docker}"
SUPABASE_CMD="${SUPABASE_CMD:-supabase}"

cd "$ROOT"

mkdir -p artifacts/rag/final-integration-validation/logs

apply_validation_shims() {
  echo "Applying validation migration shims (validation branch only)..."
  for shim in .github/rag-validation/shims/*.sql; do
    if [[ -f "$shim" ]]; then
      cp "$shim" "supabase/migrations/$(basename "$shim")"
      echo "  shim -> supabase/migrations/$(basename "$shim")"
    fi
  done
}

cleanup_validation_shims() {
  echo "Removing temporary validation migration shims from working tree..."
  for shim in .github/rag-validation/shims/*.sql; do
    if [[ -f "$shim" ]]; then
      rm -f "supabase/migrations/$(basename "$shim")"
      echo "  removed supabase/migrations/$(basename "$shim")"
    fi
  done
}

apply_validation_shims

FAILED=0

run_step() {
  local name="$1"
  shift
  echo "==> $name"
  if "$@" >"artifacts/rag/final-integration-validation/logs/${name}.log" 2>&1; then
    echo "PASS: $name"
    printf '{"step":"%s","status":"pass"}\n' "$name" >>"artifacts/rag/final-integration-validation/logs/steps.jsonl"
  else
    echo "FAIL: $name (see artifacts/rag/final-integration-validation/logs/${name}.log)"
    printf '{"step":"%s","status":"fail"}\n' "$name" >>"artifacts/rag/final-integration-validation/logs/steps.jsonl"
    FAILED=1
  fi
}

: >"artifacts/rag/final-integration-validation/logs/steps.jsonl"

run_step "db_replay" bun run scripts/rag/disposable-db-replay.ts
run_step "combined_billing_rag_db" bun run .github/rag-validation/combined-billing-rag-db-validation.ts
run_step "db_lifecycle_tests" bun run .github/rag-validation/db-lifecycle-validation.ts
run_step "rag_validate_local" bun run test:run -- src/lib/__tests__/rag-assistant-locale-wiring.test.ts src/lib/__tests__/rag-corpus-verification.test.ts src/lib/__tests__/rag-deterministic-chunking.test.ts src/lib/__tests__/rag-manifest-reindex.test.ts src/lib/__tests__/rag-migration-security.test.ts src/lib/__tests__/rag-mock-indexing.test.ts src/lib/__tests__/rag-no-paid-api.test.ts src/lib/__tests__/rag-retrieval-contract.test.ts src/lib/__tests__/rag-shared-runtime-integration.test.ts
run_step "billing_focused_tests" bun run test:run -- src/lib/billing/__tests__/
run_step "login_focused_tests" bun run test:run -- src/lib/__tests__/locale-auth.test.ts src/lib/__tests__/locale-public-pages.test.ts src/lib/__tests__/scale-batch-b.test.ts src/lib/__tests__/locale-learn-chrome.test.ts src/lib/__tests__/locale-package-completion.test.ts src/lib/__tests__/locale-learner-directionality.test.tsx src/lib/__tests__/security-batch-b.test.ts src/lib/__tests__/locale-runtime-wiring.test.ts src/lib/__tests__/locale-runtime-navigation.test.ts src/lib/__tests__/locale-phase9-public-routing.test.ts src/lib/__tests__/locale-runtime-import.test.ts
run_step "rag_verify_corpus" bun run rag:verify-corpus
run_step "tsc" bunx tsc --noEmit
cleanup_validation_shims
run_step "roadmap_guard" bun run roadmap:guard
run_step "build" bun run build

STEPS_JSON="[$(paste -sd, artifacts/rag/final-integration-validation/logs/steps.jsonl 2>/dev/null || echo '')]"

cat >"artifacts/rag/final-integration-validation/results.json" <<EOF
{
  "integrationSha": "${INTEGRATION_SHA:-unknown}",
  "validationBranch": "validation/rag-final-integration-9b30c1f",
  "overallStatus": "$([ "$FAILED" -eq 0 ] && echo pass || echo fail)",
  "steps": $STEPS_JSON
}
EOF

if [[ "$FAILED" -ne 0 ]]; then
  echo "Final integration validation failed"
  exit 1
fi

echo "Final integration validation passed"
