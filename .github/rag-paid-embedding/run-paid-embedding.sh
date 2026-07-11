#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/artifacts/rag/paid-embedding"
LOG="$OUT/logs"
mkdir -p "$LOG"

export DOCKER_BIN="${DOCKER_BIN:-docker}"
export CANDIDATE_SHA="${CANDIDATE_SHA:-8e48d655489fcdfad4df8e33b3c93c61bbde3468}"

cd "$ROOT"

cleanup_shims() {
  for shim in .github/rag-paid-embedding/shims/*.sql; do
    if [[ -f "$shim" ]]; then
      rm -f "supabase/migrations/$(basename "$shim")"
    fi
  done
}

echo "==> preflight (fail closed before paid calls)"
bun run .github/rag-paid-embedding/preflight.ts 2>&1 | tee "$LOG/preflight.log"

echo "==> paid embedding into disposable staging"
bun run .github/rag-paid-embedding/paid-embed.ts 2>&1 | tee "$LOG/paid-embed.log"

cleanup_shims

# Ensure vectors were never staged for git commit
if git status --porcelain | grep -E 'artifacts/rag/.*\.(bin|npy|vec)|embeddings\.json' >/dev/null 2>&1; then
  echo "ABORT: vector-like files appear in git status"
  exit 1
fi

# Do not commit artifact contents with vectors; keep summary-only paths
echo "Paid embedding orchestration complete"
