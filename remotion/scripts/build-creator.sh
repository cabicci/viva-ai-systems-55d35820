#!/usr/bin/env bash
# Build all Creator lesson videos sequentially. Logs per-lesson to /tmp/build-creator-logs/.
set -uo pipefail
cd "$(dirname "$0")/../.."

export REMOTION_CONCURRENCY="${REMOTION_CONCURRENCY:-4}"

LESSONS=(
  creator-m1-why-content
  creator-m1-attention-economy
  creator-m3-know-audience
  creator-m3-content-pillars
  creator-m2-hook
  creator-m2-script-structure
  creator-m2-cta
  creator-m4-reality-check
  creator-m4-mobile-shooting
  creator-m4-ai-writing
  creator-m4-editing
  creator-m4-thumbnails-captions
  creator-m5-platforms
  creator-m5-scheduling
  creator-m5-analytics
  creator-m5-leads
  creator-m6-brand-basics
  creator-m6-grid-consistency
)

mkdir -p /tmp/build-creator-logs
TOTAL=${#LESSONS[@]}
DONE=0
FAIL=0

for id in "${LESSONS[@]}"; do
  out="public/lessons/intro/${id}.mp4"
  if [ -f "$out" ]; then
    echo "[skip] $id (exists)"
    DONE=$((DONE+1))
    continue
  fi
  echo "[build $((DONE+FAIL+1))/$TOTAL] $id ..."
  log="/tmp/build-creator-logs/${id}.log"
  if python3 remotion/scripts/build-lesson.py "$id" > "$log" 2>&1; then
    echo "[ok] $id"
    DONE=$((DONE+1))
  else
    echo "[FAIL] $id (log: $log)"
    FAIL=$((FAIL+1))
  fi
done

echo "DONE=$DONE  FAIL=$FAIL  TOTAL=$TOTAL"
