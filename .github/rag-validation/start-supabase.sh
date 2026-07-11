#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export DOCKER_BIN="${DOCKER_BIN:-docker}"

cd "$ROOT"

echo "Starting Supabase local stack (excluding non-essential services)..."
npx supabase start -x studio,imgproxy,logflare,vector,edge-runtime 2>&1 | tee artifacts/rag/corrective-validation/logs/supabase-start.log || {
  mkdir -p artifacts/rag/corrective-validation/logs
  npx supabase start 2>&1 | tee artifacts/rag/corrective-validation/logs/supabase-start-retry.log
}

echo "Supabase status:"
npx supabase status
