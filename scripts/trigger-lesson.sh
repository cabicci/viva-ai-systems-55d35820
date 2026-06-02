#!/usr/bin/env bash
# Usage: ./scripts/trigger-lesson.sh <lesson-id-or-prefix> [--force-script]
set -euo pipefail
REPO="${REPO:-cabicci/ai-ecosystem-hub-72-5bf9f6ff}"
WORKFLOW="${WORKFLOW:-lesson-video.yml}"
REF="${REF:-main}"
LESSON="${1:?lesson id required}"
FORCE="false"
[[ "${2:-}" == "--force-script" ]] && FORCE="true"

: "${GH_PAT:?GH_PAT env var not set}"

curl -sS -X POST \
  -H "Authorization: Bearer $GH_PAT" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW/dispatches" \
  -d "{\"ref\":\"$REF\",\"inputs\":{\"lesson_ids\":\"$LESSON\",\"force_script\":\"$FORCE\"}}"

echo "Triggered build for: $LESSON (force_script=$FORCE)"
echo "Watch: https://github.com/$REPO/actions/workflows/$WORKFLOW"
