#!/usr/bin/env bash
# Build remaining Builder lesson videos with a faster two-stage pipeline.
# Stage 1 prepares scripts/audio in parallel; stage 2 renders videos one at a time.

set -euo pipefail
cd "$(dirname "$0")/../.."

PREP_JOBS="${PREP_JOBS:-3}"
export REMOTION_CONCURRENCY="${REMOTION_CONCURRENCY:-4}"

LESSONS=(
  builder-m6-debugging
  builder-m7-rls
  builder-m7-sessions-jwt
  builder-m8-tables-columns
  builder-m8-relations
  builder-m8-queries
  builder-m9-embeddings
  builder-m9-rag
  builder-m9-agents
  builder-m10-deploy-domain
  builder-m10-first-users
)

mkdir -p /tmp/build-remaining-logs
PENDING=()

for id in "${LESSONS[@]}"; do
  out="public/lessons/intro/${id}.mp4"
  if [ -f "$out" ]; then
    echo "[skip] $id (already exists)"
    continue
  fi
  PENDING+=("$id")
done

if [ "${#PENDING[@]}" -eq 0 ]; then
  echo "done. all videos already exist."
  exit 0
fi

echo "[stage 1/2] preparing scripts + TTS with PREP_JOBS=$PREP_JOBS"
active=0
for id in "${PENDING[@]}"; do
  log="/tmp/build-remaining-logs/${id}.prep.log"
  echo "[prep] $id -> $log"
  python3 remotion/scripts/build-lesson.py "$id" --prepare-only > "$log" 2>&1 &
  active=$((active + 1))
  if [ "$active" -ge "$PREP_JOBS" ]; then
    wait -n || true
    active=$((active - 1))
  fi
done
wait || true

echo "[stage 2/2] rendering videos one by one with REMOTION_CONCURRENCY=$REMOTION_CONCURRENCY"
for id in "${PENDING[@]}"; do
  out="public/lessons/intro/${id}.mp4"
  log="/tmp/build-remaining-logs/${id}.log"
  if [ -f "$out" ]; then
    echo "[skip] $id (already exists after prep)"
    continue
  fi
  if [ ! -s "/tmp/${id}/audio/master.mp3" ] || [ ! -s "remotion/src/lessons-generated/${id}.gen.ts" ]; then
    echo "[skip] $id (prep failed or incomplete — see /tmp/build-remaining-logs/${id}.prep.log)"
    continue
  fi
  echo "[render] $id -> $log"
  if python3 remotion/scripts/build-lesson.py "$id" --render-only > "$log" 2>&1; then
    echo "  ok"
  else
    echo "  FAILED — see $log"
  fi
done

echo "done. videos in public/lessons/intro/"