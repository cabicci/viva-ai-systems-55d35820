#!/usr/bin/env bash
# Build all Creator lesson videos sequentially. Logs per-lesson to /tmp/build-creator-logs/.
set -uo pipefail
cd "$(dirname "$0")/../.."

export REMOTION_CONCURRENCY="${REMOTION_CONCURRENCY:-4}"

LESSONS=(
  creator-m1-l1-why-content
  creator-m1-l2-attention-economy
  creator-m2-l1-know-audience
  creator-m2-l2-content-pillars
  creator-m3-l1-hook
  creator-m3-l2-script-structure
  creator-m3-l3-cta
  creator-m4-l1-reality-check
  creator-m4-l2-mobile-shooting
  creator-m4-l3-ai-writing
  creator-m5-l1-editing
  creator-m5-l2-thumbnails-captions
  creator-m6-l1-platforms
  creator-m6-l2-scheduling
  creator-m6-l3-analytics
  creator-m6-l4-leads
  creator-m7-l1-brand-basics
  creator-m7-l2-grid-consistency
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
