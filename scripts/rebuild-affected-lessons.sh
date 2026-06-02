#!/usr/bin/env bash
# Re-render videos for lessons whose content/order changed in this batch.
# Usage: GH_PAT=... ./scripts/rebuild-affected-lessons.sh [--force-script]
set -euo pipefail
REPO="${REPO:-cabicci/ai-ecosystem-hub-72-5bf9f6ff}"
WORKFLOW="${WORKFLOW:-lesson-video.yml}"
REF="${REF:-main}"
FORCE="false"
[[ "${1:-}" == "--force-script" ]] && FORCE="true"

: "${GH_PAT:?GH_PAT env var not set}"

LESSONS=(
  "intro-m1-l2-first-prompt"
  "intro-m1-l3-setup-your-ai"
  "intro-m1-l4-ai-can-cannot"
  "intro-m1-l5-ai-vs-software"
  "intro-m1-l6-learn-without-fear"
  "intro-m1-l7-choose-your-path"
)

LESSON_IDS=$(IFS=,; echo "${LESSONS[*]}")

curl -sS -X POST \
  -H "Authorization: Bearer $GH_PAT" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW/dispatches" \
  -d "{\"ref\":\"$REF\",\"inputs\":{\"lesson_ids\":\"$LESSON_IDS\",\"force_script\":\"$FORCE\"}}"

echo ""
echo "Triggered video rebuild for ${#LESSONS[@]} lessons (force_script=$FORCE):"
printf '  - %s\n' "${LESSONS[@]}"
echo ""
echo "Watch: https://github.com/$REPO/actions/workflows/$WORKFLOW"
