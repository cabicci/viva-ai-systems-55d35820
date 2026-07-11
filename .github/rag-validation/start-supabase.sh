#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export DOCKER_BIN="${DOCKER_BIN:-docker}"
SUPABASE_CMD="${SUPABASE_CMD:-supabase}"

cd "$ROOT"

mkdir -p artifacts/rag/corrective-validation/logs

apply_validation_shims() {
  echo "Applying validation migration shims (validation branch only)..."
  for shim in .github/rag-validation/shims/*.sql; do
    if [[ -f "$shim" ]]; then
      cp "$shim" "supabase/migrations/$(basename "$shim")"
      echo "  shim -> supabase/migrations/$(basename "$shim")"
    fi
  done
}

apply_validation_shims

echo "Starting Supabase local stack (excluding non-essential services)..."
if ! $SUPABASE_CMD start -x studio,imgproxy,logflare,vector,edge-runtime 2>&1 | tee artifacts/rag/corrective-validation/logs/supabase-start.log; then
  echo "Retrying full Supabase start..."
  $SUPABASE_CMD start 2>&1 | tee artifacts/rag/corrective-validation/logs/supabase-start-retry.log
fi

echo "Supabase status:"
$SUPABASE_CMD status
