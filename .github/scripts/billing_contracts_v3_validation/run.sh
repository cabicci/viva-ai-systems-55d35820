#!/usr/bin/env bash
# Billing Launch Closure Contracts V3 — validation harness.
# Phase A and Phase B each start from an independent clean disposable database.
# Produces a sanitized markdown report. DO NOT MERGE gate only.
#
# Local realtime.messages ownership accommodation lives only in the disposable
# Supabase tree prepared under REPORT_DIR (never in repo supabase/migrations/).
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"

REPORT_DIR="${REPORT_DIR:-billing-v3-validation}"
REPORT="${REPORT_DIR}/report.md"
DISPOSABLE_ROOT="${DISPOSABLE_SUPABASE_ROOT:-${REPORT_DIR}/disposable-supabase}"
mkdir -p "$REPORT_DIR"

HEAD_SHA="$(git rev-parse HEAD)"

{
  echo "# Billing Launch Closure Contracts V3 — Validation Report"
  echo
  echo "- Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "- HEAD SHA: \`${HEAD_SHA}\`"
  echo "- Expected product SHA: \`${EXPECTED_PRODUCT_SHA:-<unset>}\`"
  echo "- Disposable Supabase root: \`${DISPOSABLE_ROOT}\`"
  echo
} > "$REPORT"

overall_status=0

prepare_disposable_supabase_tree() {
  echo "[billing-v3-harness] Preparing disposable Supabase tree (realtime.messages ownership omit)…"
  rm -rf "$DISPOSABLE_ROOT"
  if ! bun scripts/billing/prepare-disposable-supabase-tree.ts --dest "$DISPOSABLE_ROOT" \
    > "${REPORT_DIR}/disposable-prepare.log" 2>&1; then
    echo "[billing-v3-harness] disposable tree prepare FAILED"
    cat "${REPORT_DIR}/disposable-prepare.log" || true
    return 1
  fi
  # Prove committed Product migration remains immutable (expected protected blob).
  local hist="supabase/migrations/20260526105117_25fc4182-0343-4234-a231-0cf38569014a.sql"
  local blob
  blob="$(git hash-object "$hist")"
  if [[ "$blob" != "d185dd59549f611fcb984bcb3459c9d5d6969ef5" ]]; then
    echo "[billing-v3-harness] committed historical migration blob mismatch: $blob"
    return 1
  fi
  return 0
}

reset_disposable_db() {
  echo "[billing-v3-harness] Resetting disposable database (clean migration replay)…"
  if ! prepare_disposable_supabase_tree; then
    return 1
  fi
  local reset_log="${REPORT_DIR}/db-reset.log"
  if (cd "$DISPOSABLE_ROOT" && npx supabase db reset --yes) \
    > "$reset_log" 2>&1; then
    return 0
  fi

  echo "[billing-v3-harness] db reset attempt 1 failed; retrying once"
  tail -n 40 "$reset_log" || true
  echo "[billing-v3-harness] retry after first reset failure" >> "$reset_log"

  if (cd "$DISPOSABLE_ROOT" && npx supabase db reset --yes) \
    >> "$reset_log" 2>&1; then
    echo "[billing-v3-harness] db reset recovered on retry"
    return 0
  fi

  echo "[billing-v3-harness] db reset FAILED after 2 attempts"
  tail -n 40 "$reset_log" || true
  return 1
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
    # Strip ANSI so count matching is stable under CI color output.
    sed -E 's/\x1B\[[0-9;]*[A-Za-z]//g' "${REPORT_DIR}/unit.log" > "${REPORT_DIR}/unit.plain.log"
    # Verify the reviewed suite paths and per-file counts as well as the exact
    # summary. A new, missing, failed, skipped or todo test fails this gate.
    if node .github/scripts/billing_contracts_v3_validation/verify-inventory.mjs A \
      "${REPORT_DIR}/unit.plain.log" > "${REPORT_DIR}/phase-a-inventory.log" 2>&1; then
      echo "- Result: PASS (17 named suites, 178 / 178, 0 failed/skipped/todo)" >> "$REPORT"
    else
      overall_status=1
      echo "- Result: FAIL (reviewed Phase A inventory: 17 suites, 178 tests)" >> "$REPORT"
      cat "${REPORT_DIR}/phase-a-inventory.log" >> "$REPORT"
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

# ---------------------------------------------------------------------------
# Phase C — quiz write ACL, isolated fixtures on the migrated disposable database
# ---------------------------------------------------------------------------
echo "## Phase C — trusted quiz writes and owner-scoped reads" >> "$REPORT"
echo >> "$REPORT"
if [ "${BILLING_DISPOSABLE_DB:-0}" = "1" ] \
  && MIGRATIONS_PREAPPLIED=1 bunx vitest run --no-file-parallelism src/lib/__tests__/quiz-attempt-db-acl.integration.test.ts \
    > "${REPORT_DIR}/quiz-acl.log" 2>&1; then
  sed -E 's/\x1B\[[0-9;]*[A-Za-z]//g' "${REPORT_DIR}/quiz-acl.log" > "${REPORT_DIR}/quiz-acl.plain.log"
  if node .github/scripts/billing_contracts_v3_validation/verify-inventory.mjs C \
    "${REPORT_DIR}/quiz-acl.plain.log" > "${REPORT_DIR}/phase-c-inventory.log" 2>&1; then
    echo "- Result: PASS (1 named suite, 1 / 1, 0 failed/skipped/todo; fixtures rolled back)" >> "$REPORT"
  else
    overall_status=1
    echo "- Result: FAIL (reviewed Phase C inventory: 1 suite, 1 test)" >> "$REPORT"
    cat "${REPORT_DIR}/phase-c-inventory.log" >> "$REPORT"
  fi
else
  overall_status=1
  echo "- Result: FAIL (quiz ACL proof or disposable DB requirement)" >> "$REPORT"
fi
echo >> "$REPORT"
echo '```' >> "$REPORT"
tail -n 40 "${REPORT_DIR}/quiz-acl.log" 2>/dev/null \
  | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/[redacted-email]/g' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo >> "$REPORT"


# Remove disposable tree from the repository worktree after validation.
rm -rf "$DISPOSABLE_ROOT"

echo "Report written to ${REPORT}"
exit "$overall_status"
