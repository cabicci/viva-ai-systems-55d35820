#!/usr/bin/env bash
# Billing Launch Closure Contracts V3 — validation harness.
# Phase A and Phase B each start from an independent clean disposable database.
# Produces a sanitized markdown report. DO NOT MERGE gate only.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"

REPORT_DIR="${REPORT_DIR:-billing-v3-validation}"
REPORT="${REPORT_DIR}/report.md"
mkdir -p "$REPORT_DIR"

HEAD_SHA="$(git rev-parse HEAD)"

{
  echo "# Billing Launch Closure Contracts V3 — Validation Report"
  echo
  echo "- Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "- HEAD SHA: \`${HEAD_SHA}\`"
  echo "- Expected product SHA: \`${EXPECTED_PRODUCT_SHA:-<unset>}\`"
  echo
} > "$REPORT"

overall_status=0

reset_disposable_db() {
  echo "[billing-v3-harness] Resetting disposable database (clean migration replay)…"
  if ! npx supabase db reset --yes > "${REPORT_DIR}/db-reset.log" 2>&1; then
    echo "[billing-v3-harness] db reset FAILED"
    tail -n 40 "${REPORT_DIR}/db-reset.log" || true
    return 1
  fi
  return 0
}

assert_no_mandatory_skips() {
  local log_file="$1"
  # Fail if vitest reported any skipped tests while disposable DB is required.
  if grep -EEq 'Tests[[:space:]]+[0-9]+ skipped|skipped \([1-9]' "$log_file"; then
    # Allow "0 skipped" only.
    if grep -EEq 'Tests[[:space:]].*\b0 skipped\b' "$log_file"; then
      return 0
    fi
    if grep -EEq '\| [1-9][0-9]* skipped' "$log_file"; then
      echo "[billing-v3-harness] mandatory tests were skipped — refusing PASS"
      return 1
    fi
  fi
  # Vitest summary line like: "Tests  80 passed (80)" or "80 passed | 0 skipped"
  if grep -EEq '[1-9][0-9]* skipped' "$log_file"; then
    echo "[billing-v3-harness] detected non-zero skipped count"
    return 1
  fi
  return 0
}

# ---------------------------------------------------------------------------
# Phase A — complete billing suite on a clean disposable database
# ---------------------------------------------------------------------------
echo "## Phase A — complete billing suite (clean disposable DB)" >> "$REPORT"
echo >> "$REPORT"

if [ "${BILLING_DISPOSABLE_DB:-0}" != "1" ]; then
  overall_status=1
  echo "- Result: FAIL (BILLING_DISPOSABLE_DB != 1; disposable DB required)" >> "$REPORT"
else
  if ! reset_disposable_db; then
    overall_status=1
    echo "- Result: FAIL (database reset before Phase A)" >> "$REPORT"
  elif bunx vitest run --no-file-parallelism src/lib/billing/__tests__/ > "${REPORT_DIR}/unit.log" 2>&1; then
    if assert_no_mandatory_skips "${REPORT_DIR}/unit.log" \
      && grep -Eq '80 passed' "${REPORT_DIR}/unit.log"; then
      echo "- Result: PASS (80 / 80, 0 skipped)" >> "$REPORT"
    else
      overall_status=1
      echo "- Result: FAIL (expected 80 passed / 0 skipped)" >> "$REPORT"
    fi
  else
    overall_status=1
    echo "- Result: FAIL" >> "$REPORT"
  fi
fi

echo >> "$REPORT"
echo '```' >> "$REPORT"
tail -n 50 "${REPORT_DIR}/unit.log" 2>/dev/null \
  | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/[redacted-email]/g' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo >> "$REPORT"

# ---------------------------------------------------------------------------
# Phase B — dedicated concurrency proofs on a SEPARATE clean disposable database
# ---------------------------------------------------------------------------
echo "## Phase B — concurrency proofs (independent clean disposable DB)" >> "$REPORT"
echo >> "$REPORT"

if [ "${BILLING_DISPOSABLE_DB:-0}" = "1" ]; then
  if ! reset_disposable_db; then
    overall_status=1
    echo "- Result: FAIL (database reset before Phase B)" >> "$REPORT"
  elif bun run scripts/billing/run-concurrency-proof.ts > "${REPORT_DIR}/concurrency.log" 2>&1; then
    echo "- Result: PASS" >> "$REPORT"
  else
    overall_status=1
    echo "- Result: FAIL" >> "$REPORT"
  fi
  echo >> "$REPORT"
  echo '```' >> "$REPORT"
  tail -n 50 "${REPORT_DIR}/concurrency.log" 2>/dev/null >> "$REPORT" || true
  echo '```' >> "$REPORT"
else
  overall_status=1
  echo "- Result: FAIL (BILLING_DISPOSABLE_DB != 1; concurrency proofs required)" >> "$REPORT"
fi
echo >> "$REPORT"

echo "Report written to ${REPORT}"
exit "$overall_status"
