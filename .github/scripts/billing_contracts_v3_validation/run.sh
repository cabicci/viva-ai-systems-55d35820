#!/usr/bin/env bash
# Billing Launch Closure Contracts V3 — validation harness.
# Produces a sanitized markdown report of the billing unit tests and (when a
# disposable DB is available) the concurrency proofs. DO NOT MERGE gate only.
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

echo "## Billing unit tests" >> "$REPORT"
echo >> "$REPORT"
if bun run test:run -- src/lib/billing/__tests__/ > "${REPORT_DIR}/unit.log" 2>&1; then
  echo "- Result: PASS" >> "$REPORT"
else
  overall_status=1
  echo "- Result: FAIL" >> "$REPORT"
fi
echo >> "$REPORT"
echo '```' >> "$REPORT"
tail -n 40 "${REPORT_DIR}/unit.log" | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/[redacted-email]/g' >> "$REPORT"
echo '```' >> "$REPORT"
echo >> "$REPORT"

echo "## Concurrency proofs" >> "$REPORT"
echo >> "$REPORT"
if [ "${BILLING_DISPOSABLE_DB:-0}" = "1" ]; then
  if bun run scripts/billing/run-concurrency-proof.ts > "${REPORT_DIR}/concurrency.log" 2>&1; then
    echo "- Result: PASS" >> "$REPORT"
  else
    overall_status=1
    echo "- Result: FAIL" >> "$REPORT"
  fi
  echo >> "$REPORT"
  echo '```' >> "$REPORT"
  tail -n 40 "${REPORT_DIR}/concurrency.log" >> "$REPORT"
  echo '```' >> "$REPORT"
else
  echo "- Result: SKIPPED (BILLING_DISPOSABLE_DB != 1)" >> "$REPORT"
fi
echo >> "$REPORT"

echo "Report written to ${REPORT}"
exit "$overall_status"
