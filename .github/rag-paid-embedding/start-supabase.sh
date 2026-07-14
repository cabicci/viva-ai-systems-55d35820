#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export DOCKER_BIN="${DOCKER_BIN:-docker}"
SUPABASE_CMD="${SUPABASE_CMD:-supabase}"

cd "$ROOT"
mkdir -p artifacts/rag/paid-embedding/logs

echo "Applying temporary migration shims (paid-embedding branch only)..."
for shim in .github/rag-paid-embedding/shims/*.sql; do
  if [[ -f "$shim" ]]; then
    cp "$shim" "supabase/migrations/$(basename "$shim")"
    echo "  shim -> supabase/migrations/$(basename "$shim")"
  fi
done

echo "Starting disposable Supabase (exclude non-essential)..."
if ! $SUPABASE_CMD start -x studio,imgproxy,logflare,vector,edge-runtime 2>&1 | tee artifacts/rag/paid-embedding/logs/supabase-start.log; then
  echo "Retrying full Supabase start..."
  $SUPABASE_CMD start 2>&1 | tee artifacts/rag/paid-embedding/logs/supabase-start-retry.log
fi

$SUPABASE_CMD status | tee artifacts/rag/paid-embedding/logs/supabase-status.log
