#!/usr/bin/env bash
# Isolated Billing launch-closure runtime validation harness.
# Disposable local Supabase/PostgREST only. Never prints credentials.

set -euo pipefail

readonly ACCEPTED_PRODUCT_SHA="413452b22001ee4d5f6caff2b6656d3de7ce230a"
readonly SUPABASE_CLI_PIN="2.109.1"
readonly SUPABASE_CLI="npx -y supabase@${SUPABASE_CLI_PIN}"
readonly ARTIFACT_DIR="${ARTIFACT_DIR:-ci-artifacts/billing-launch-closure-runtime}"
readonly RESULTS_JSON="${ARTIFACT_DIR}/results.json"
readonly RESULTS_MD="${ARTIFACT_DIR}/gate-report.md"

mkdir -p "$ARTIFACT_DIR"

ASSERTIONS=()
FAIL_COUNT=0
GATE_TOTAL=24

record_gate() {
  local num="$1" name="$2" expected="$3" actual="$4" status="$5" evidence="$6"
  ASSERTIONS+=("$(jq -n \
    --argjson number "$num" \
    --arg name "$name" \
    --arg expected "$expected" \
    --arg actual "$actual" \
    --arg status "$status" \
    --arg evidence "$evidence" \
    '{number:$number,name:$name,expected:$expected,actual:$actual,status:$status,evidence:$evidence}')")
  if [[ "$status" != "PASS" ]]; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  printf 'GATE %02d %-70s %s\n' "$num" "$name" "$status" | tee -a "$ARTIFACT_DIR/gates.log"
}

normalize_env_value() {
  local value="${1:-}"
  value="${value//$'\r'/}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  if [[ ${#value} -ge 2 && "$value" == \"*\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ ${#value} -ge 2 && "$value" == \'*\' ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

is_http_url() {
  [[ -n "${1:-}" && ( "$1" == http://* || "$1" == https://* ) ]]
}

is_postgres_url() {
  [[ -n "${1:-}" && ( "$1" == postgresql://* || "$1" == postgres://* ) ]]
}

map_supabase_api_env() {
  local resolved_url="" rest_base=""
  local norm_api norm_rest norm_supabase
  local norm_anon norm_publish norm_service norm_secret
  norm_api="$(normalize_env_value "${API_URL:-}")"
  norm_rest="$(normalize_env_value "${REST_URL:-}")"
  norm_supabase="$(normalize_env_value "${SUPABASE_URL:-}")"
  if is_http_url "$norm_api"; then
    resolved_url="$norm_api"
  elif is_http_url "$norm_rest"; then
    rest_base="$norm_rest"
    if [[ "$rest_base" == */rest/v1 ]]; then
      rest_base="${rest_base%/rest/v1}"
    fi
    resolved_url="$rest_base"
  elif is_http_url "$norm_supabase"; then
    resolved_url="$norm_supabase"
  fi
  SUPABASE_URL="$resolved_url"
  norm_anon="$(normalize_env_value "${ANON_KEY:-}")"
  norm_publish="$(normalize_env_value "${PUBLISHABLE_KEY:-}")"
  norm_service="$(normalize_env_value "${SERVICE_ROLE_KEY:-}")"
  norm_secret="$(normalize_env_value "${SECRET_KEY:-}")"
  SUPABASE_ANON_KEY="$(normalize_env_value "${SUPABASE_ANON_KEY:-}")"
  [[ -z "$SUPABASE_ANON_KEY" ]] && SUPABASE_ANON_KEY="${norm_anon:-$norm_publish}"
  if [[ -n "$norm_service" ]]; then
    SUPABASE_SERVICE_ROLE_KEY="$norm_service"
  else
    SUPABASE_SERVICE_ROLE_KEY="$norm_secret"
  fi
  if [[ -n "$norm_service" ]]; then
    SUPABASE_SERVICE_API_KEY="$norm_service"
  elif [[ -n "$norm_secret" ]]; then
    SUPABASE_SERVICE_API_KEY="$norm_secret"
  else
    SUPABASE_SERVICE_API_KEY="$SUPABASE_ANON_KEY"
  fi
}

load_supabase_status_env() {
  $SUPABASE_CLI status -o env > "$ARTIFACT_DIR/supabase-status-env.presence.txt" 2>&1 || true
  # Rewrite presence-only copy for artifacts; keep real values only in memory.
  {
    echo "status_env_keys=$(grep -E '^[A-Z_][A-Z0-9_]*=' "$ARTIFACT_DIR/supabase-status-env.presence.txt" 2>/dev/null | cut -d= -f1 | paste -sd, - || true)"
  } > "$ARTIFACT_DIR/supabase-status-env-keys.txt"
  set +u
  while IFS= read -r env_line; do
    [[ "$env_line" =~ ^[A-Z_][A-Z0-9_]*= ]] || continue
    export "$env_line"
  done < "$ARTIFACT_DIR/supabase-status-env.presence.txt"
  set -u
  # Scrub credential-bearing artifact immediately.
  rm -f "$ARTIFACT_DIR/supabase-status-env.presence.txt"
  map_supabase_api_env
}

resolve_local_pg_url() {
  local candidate="" var db_port
  load_supabase_status_env
  for var in DB_URL SUPABASE_DB_URL DATABASE_URL POSTGRES_URL PGURL; do
    candidate="${!var:-}"
    if is_postgres_url "$candidate"; then
      LOCAL_PG_URL="$candidate"
      LOCAL_PG_URL_SOURCE="$var"
      return 0
    fi
  done
  db_port="$(grep -E '^port\s*=' supabase/config.toml 2>/dev/null | head -n1 | sed -E 's/.*=\s*([0-9]+).*/\1/' || true)"
  [[ -n "$db_port" ]] || db_port="54322"
  candidate="postgresql://postgres:postgres@127.0.0.1:${db_port}/postgres"
  LOCAL_PG_URL="$candidate"
  LOCAL_PG_URL_SOURCE="config.toml fallback"
  return 0
}

require_runtime_env() {
  map_supabase_api_env
  local missing=()
  [[ -z "${SUPABASE_URL:-}" ]] && missing+=("SUPABASE_URL")
  [[ -z "${SUPABASE_ANON_KEY:-}" ]] && missing+=("SUPABASE_ANON_KEY")
  [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && missing+=("SUPABASE_SERVICE_ROLE_KEY")
  [[ -z "${LOCAL_PG_URL:-}" ]] && missing+=("LOCAL_PG_URL")
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "missing=$(IFS=,; echo "${missing[*]}")" > "$ARTIFACT_DIR/runtime-env-missing.txt"
    return 1
  fi
  echo "runtime_env_mapped=yes" > "$ARTIFACT_DIR/runtime-env-presence.txt"
  return 0
}

http_code() {
  curl -s -o /dev/null -w '%{http_code}' "$@"
}

rpc_body() {
  # Usage: rpc_body ROLE METHOD_PATH JSON
  # ROLE: service|anon|auth  (auth uses JWT_A unless JWT_OVERRIDE set)
  local role="$1" path="$2" json="$3"
  local auth_header=()
  case "$role" in
    service)
      auth_header=(-H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" -H "apikey: ${SUPABASE_SERVICE_API_KEY}")
      ;;
    anon)
      auth_header=(-H "apikey: ${SUPABASE_ANON_KEY}")
      ;;
    auth)
      auth_header=(-H "Authorization: Bearer ${JWT_OVERRIDE:-$JWT_A}" -H "apikey: ${SUPABASE_ANON_KEY}")
      ;;
    custom)
      auth_header=(-H "Authorization: Bearer ${JWT_OVERRIDE}" -H "apikey: ${SUPABASE_ANON_KEY}")
      ;;
    *)
      echo "unknown role" >&2
      return 1
      ;;
  esac
  curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/${path}" \
    "${auth_header[@]}" \
    -H "Accept-Profile: billing" \
    -H "Content-Profile: billing" \
    -H "Content-Type: application/json" \
    -d "$json"
}

rpc_code() {
  local role="$1" path="$2" json="$3"
  local auth_header=()
  case "$role" in
    service)
      auth_header=(-H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" -H "apikey: ${SUPABASE_SERVICE_API_KEY}")
      ;;
    anon)
      auth_header=(-H "apikey: ${SUPABASE_ANON_KEY}")
      ;;
    auth)
      auth_header=(-H "Authorization: Bearer ${JWT_OVERRIDE:-$JWT_A}" -H "apikey: ${SUPABASE_ANON_KEY}")
      ;;
    custom)
      auth_header=(-H "Authorization: Bearer ${JWT_OVERRIDE}" -H "apikey: ${SUPABASE_ANON_KEY}")
      ;;
  esac
  curl -s -o /dev/null -w '%{http_code}' -X POST "${SUPABASE_URL}/rest/v1/rpc/${path}" \
    "${auth_header[@]}" \
    -H "Accept-Profile: billing" \
    -H "Content-Profile: billing" \
    -H "Content-Type: application/json" \
    -d "$json"
}

b64url() {
  openssl base64 -e -A | tr '+/' '-_' | tr -d '='
}

# Build disposable HS256 JWT without logging it. Uses local JWT secret from env only.
make_local_jwt() {
  local role_claim="$1"
  local secret
  secret="$(normalize_env_value "${JWT_SECRET:-}")"
  if [[ -z "$secret" ]]; then
    # Local Supabase default demo secret (not Production).
    secret="super-secret-jwt-token-with-at-least-32-characters-long"
  fi
  local header payload unsigned sig
  header='{"alg":"HS256","typ":"JWT"}'
  payload="$(jq -nc --arg role "$role_claim" --argjson exp 1983812996 \
    '{iss:"supabase-demo",role:$role,exp:$exp}')"
  unsigned="$(printf '%s' "$header" | b64url).$(printf '%s' "$payload" | b64url)"
  sig="$(printf '%s' "$unsigned" | openssl dgst -binary -sha256 -hmac "$secret" | b64url)"
  printf '%s.%s' "$unsigned" "$sig"
}

write_results() {
  local overall="PASS"
  [[ "$FAIL_COUNT" -eq 0 ]] || overall="FAIL"
  local passed=$((GATE_TOTAL - FAIL_COUNT))
  jq -n \
    --argjson assertions "$(printf '%s\n' "${ASSERTIONS[@]}" | jq -s '.')" \
    --arg overall "$overall" \
    --argjson passed "$passed" \
    --argjson failed "$FAIL_COUNT" \
    --argjson total "$GATE_TOTAL" \
    --arg candidate_sha "$ACCEPTED_PRODUCT_SHA" \
    --arg validation_sha "$(git rev-parse HEAD)" \
    --arg supabase_cli "$SUPABASE_CLI_PIN" \
    --arg containers "$(cat "$ARTIFACT_DIR/container-versions.txt" 2>/dev/null || echo unknown)" \
    '{
      summary: {overall:$overall,passed:$passed,failed:$failed,total:$total},
      candidate_sha:$candidate_sha,
      validation_branch_sha:$validation_sha,
      supabase_cli_version:$supabase_cli,
      container_versions:$containers,
      assertions:$assertions
    }' > "$RESULTS_JSON"

  {
    echo "# Billing Launch-Closure Runtime Gate Report"
    echo
    echo "- Overall: **${overall}**"
    echo "- Candidate SHA: \`${ACCEPTED_PRODUCT_SHA}\`"
    echo "- Validation branch SHA: \`$(git rev-parse HEAD)\`"
    echo "- Supabase CLI: \`${SUPABASE_CLI_PIN}\`"
    echo "- Passed: ${passed}/${GATE_TOTAL}"
    echo
    echo "| # | Gate | Status |"
    echo "|---|------|--------|"
    local entry num name status
    for entry in "${ASSERTIONS[@]}"; do
      num="$(echo "$entry" | jq -r '.number')"
      name="$(echo "$entry" | jq -r '.name')"
      status="$(echo "$entry" | jq -r '.status')"
      echo "| ${num} | ${name} | ${status} |"
    done
  } > "$RESULTS_MD"
}

cleanup() {
  write_results || true
  if [[ -f supabase/config.toml.ci-backup ]]; then
    cp supabase/config.toml.ci-backup supabase/config.toml
    rm -f supabase/config.toml.ci-backup
  fi
  $SUPABASE_CLI stop --no-backup > "$ARTIFACT_DIR/cleanup-stop.log" 2>&1 || true
  # Remove any residual credential-bearing files if created.
  rm -f "$ARTIFACT_DIR"/*.env "$ARTIFACT_DIR"/*secret* "$ARTIFACT_DIR"/*password* 2>/dev/null || true
}
trap cleanup EXIT

# --- Preflight versions ---
docker version > "$ARTIFACT_DIR/docker-version.txt" 2>&1 || true
docker info --format '{{.ServerVersion}} {{.OSType}} {{.Architecture}}' > "$ARTIFACT_DIR/docker-info-sanitized.txt" 2>&1 || true
$SUPABASE_CLI --version > "$ARTIFACT_DIR/supabase-cli-version.txt" 2>&1 || true
{
  echo "supabase_cli=${SUPABASE_CLI_PIN}"
  docker images --format '{{.Repository}}:{{.Tag}}@{{.Digest}}' 2>/dev/null | grep -E 'supabase|postgres|postgrest' | head -n 40 || true
} > "$ARTIFACT_DIR/container-versions.txt" || true

PRODUCT_PARENT="$(git rev-parse HEAD^)"
VALIDATION_HEAD="$(git rev-parse HEAD)"
echo "validation_head=${VALIDATION_HEAD}" > "$ARTIFACT_DIR/sha-evidence.txt"
echo "product_parent=${PRODUCT_PARENT}" >> "$ARTIFACT_DIR/sha-evidence.txt"
echo "accepted_product=${ACCEPTED_PRODUCT_SHA}" >> "$ARTIFACT_DIR/sha-evidence.txt"

if [[ "$PRODUCT_PARENT" != "$ACCEPTED_PRODUCT_SHA" ]]; then
  echo "FATAL: validation branch parent is not accepted product SHA" >&2
  exit 1
fi

# --- Start disposable local stack ---
$SUPABASE_CLI start > "$ARTIFACT_DIR/supabase-start.log" 2>&1

# Expose billing schema locally only.
cp supabase/config.toml supabase/config.toml.ci-backup
if grep -q 'schemas = \["public", "graphql_public"\]' supabase/config.toml; then
  sed -i 's/schemas = \["public", "graphql_public"\]/schemas = ["public", "graphql_public", "billing"]/' supabase/config.toml
elif grep -q '^schemas =' supabase/config.toml; then
  sed -i 's/^schemas = .*/schemas = ["public", "graphql_public", "billing"]/' supabase/config.toml
else
  printf '\n[api]\nenabled = true\nschemas = ["public", "graphql_public", "billing"]\n' >> supabase/config.toml
fi
grep -E '^\[api\]|^schemas' supabase/config.toml > "$ARTIFACT_DIR/config-toml-billing-schemas.txt" || true

$SUPABASE_CLI stop --no-backup > "$ARTIFACT_DIR/supabase-stop-for-profile.log" 2>&1 || true
$SUPABASE_CLI start > "$ARTIFACT_DIR/supabase-restart-for-profile.log" 2>&1

# Gate 1: complete migration application
if $SUPABASE_CLI db reset --local --no-seed > "$ARTIFACT_DIR/db-reset.log" 2>&1; then
  $SUPABASE_CLI migration list --local > "$ARTIFACT_DIR/migration-list.txt" 2>&1 || true
  if grep -q "20260714173000" "$ARTIFACT_DIR/migration-list.txt" \
    && grep -q "20260710153000" "$ARTIFACT_DIR/migration-list.txt"; then
    record_gate 1 "Complete migration application from empty local database" "applied incl launch-closure" "applied" "PASS" "migration-list.txt"
  else
    record_gate 1 "Complete migration application from empty local database" "applied incl launch-closure" "missing expected migrations" "FAIL" "migration-list.txt"
  fi
else
  record_gate 1 "Complete migration application from empty local database" "applied" "db reset failed" "FAIL" "db-reset.log"
fi

resolve_local_pg_url
require_runtime_env || true

# Collect SQL security evidence
psql "$LOCAL_PG_URL" -v ON_ERROR_STOP=1 -At -c "
  SELECT p.proname || '|' || p.prosecdef::text || '|' || pg_get_userbyid(p.proowner) || '|' || COALESCE(array_to_string(p.proconfig, ','), '')
  FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
  WHERE n.nspname='billing' AND p.prokind='f'
    AND p.proname IN ('evaluate_access','reserve_ai_quota','commit_ai_quota','get_entitlement_snapshot','is_service_role_caller','jwt_role')
  ORDER BY 1;
" > "$ARTIFACT_DIR/billing-functions-security.txt"

psql "$LOCAL_PG_URL" -At -c "
  SELECT routine_name || '|' || grantee || '|' || privilege_type
  FROM information_schema.routine_privileges
  WHERE specific_schema='billing'
    AND routine_name IN ('evaluate_access','reserve_ai_quota','commit_ai_quota','get_entitlement_snapshot')
  ORDER BY 1;
" > "$ARTIFACT_DIR/billing-routine-privileges.txt"

psql "$LOCAL_PG_URL" -At -c "
  SELECT 'rls_enabled_missing=' || count(*)::text
  FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
  WHERE n.nspname='billing' AND c.relkind='r' AND NOT c.relrowsecurity;
" > "$ARTIFACT_DIR/rls-evidence.txt"

# Fixtures: local users
PASS_A="$(openssl rand -base64 24)"
PASS_B="$(openssl rand -base64 24)"
PASS_FREE="$(openssl rand -base64 24)"
PASS_ZERO="$(openssl rand -base64 24)"

create_user() {
  local email="$1" password="$2"
  curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\",\"email_confirm\":true}" | jq -r '.id // empty'
}

sign_in() {
  local email="$1" password="$2"
  curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}" | jq -r '.access_token // empty'
}

USER_A_ID="$(create_user "billing-runtime-a@example.test" "$PASS_A")"
USER_B_ID="$(create_user "billing-runtime-b@example.test" "$PASS_B")"
USER_FREE_ID="$(create_user "billing-runtime-free@example.test" "$PASS_FREE")"
USER_ZERO_ID="$(create_user "billing-runtime-zero@example.test" "$PASS_ZERO")"
echo "fixture_users_created=4" > "$ARTIFACT_DIR/fixture-users.txt"

JWT_A="$(sign_in "billing-runtime-a@example.test" "$PASS_A")"
JWT_B="$(sign_in "billing-runtime-b@example.test" "$PASS_B")"

psql "$LOCAL_PG_URL" -v ON_ERROR_STOP=1 <<SQL > "$ARTIFACT_DIR/fixture-sql.log" 2>&1
INSERT INTO billing.plan_catalog (id, plan_key, display_name, plan_family, is_active)
VALUES ('11111111-1111-1111-1111-111111111101', 'pro', '{"en":"Pro"}', 'paid', true)
ON CONFLICT (plan_key) DO NOTHING;

INSERT INTO billing.entitlement_policy_versions (
  id, policy_key, version_number, status, effective_from, lesson_allowlist_mode,
  lesson_ids, lesson_count_cap, builder_access, video_access, rag_enabled,
  assistant_runtime_general_monthly_quota, mission_evaluation_enabled,
  reveal_answer_enabled, wow_path_enabled, policy_json, published_at
) VALUES (
  '22222222-2222-2222-2222-222222222201', 'pro_v1', 1, 'published', now() - interval '30 days',
  'explicit_list', ARRAY['lesson-1'], 74, true, true, true, 272, true, true, true, '{}', now()
) ON CONFLICT (policy_key, version_number) DO NOTHING;

INSERT INTO billing.plan_versions (
  id, plan_id, entitlement_policy_version_id, version_number, billing_interval,
  status, effective_from, published_at
) VALUES (
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111101',
  '22222222-2222-2222-2222-222222222201',
  1, 'month', 'published', now() - interval '30 days', now()
) ON CONFLICT (plan_id, version_number) DO NOTHING;

INSERT INTO billing.subscriptions (
  id, user_id, plan_version_id, access_state, billing_state, cancel_at_period_end,
  current_period_start, current_period_end, paid_activation_at, entitlement_active_at,
  market_code, currency_code, billing_interval, idempotency_key
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '${USER_A_ID}', '33333333-3333-3333-3333-333333333301',
  'paid_active', 'active', false, now() - interval '10 days', now() + interval '20 days',
  now() - interval '10 days', now() - interval '10 days', 'INTL', 'USD', 'month', 'fixture-sub-a-1'
) ON CONFLICT (user_id) DO UPDATE SET access_state='paid_active';

INSERT INTO billing.user_entitlement_snapshots (
  user_id, subscription_id, entitlement_policy_version_id, plan_version_id,
  snapshot_version, access_state, entitlement_json, generated_at, expires_at
) VALUES (
  '${USER_A_ID}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301',
  1, 'paid_active',
  '{
    "paid_content_entitled": true,
    "access_state": "paid_active",
    "denial_reason_code": null,
    "lessons": {"entitled_lesson_ids": ["lesson-1"]},
    "builder_access": true,
    "video_access": true,
    "rag_allowed_lesson_ids": ["lesson-1"],
    "assistant_runtime": {"remaining_general": 2, "remaining_period": 0},
    "ai_topup_balance_units": 0
  }'::jsonb,
  now(), now() + interval '1 hour'
) ON CONFLICT (user_id, snapshot_version) DO NOTHING;

INSERT INTO billing.subscriptions (
  id, user_id, plan_version_id, access_state, billing_state, cancel_at_period_end,
  current_period_start, current_period_end, paid_activation_at, entitlement_active_at,
  market_code, currency_code, billing_interval, idempotency_key
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '${USER_B_ID}', '33333333-3333-3333-3333-333333333301',
  'paid_active', 'active', false, now() - interval '10 days', now() + interval '20 days',
  now() - interval '10 days', now() - interval '10 days', 'INTL', 'USD', 'month', 'fixture-sub-b-1'
) ON CONFLICT (user_id) DO UPDATE SET access_state='paid_active';

INSERT INTO billing.user_entitlement_snapshots (
  user_id, subscription_id, entitlement_policy_version_id, plan_version_id,
  snapshot_version, access_state, entitlement_json, generated_at, expires_at
) VALUES (
  '${USER_B_ID}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301',
  1, 'paid_active',
  '{
    "paid_content_entitled": true,
    "access_state": "paid_active",
    "lessons": {"entitled_lesson_ids": ["lesson-1"]},
    "builder_access": true,
    "video_access": true,
    "rag_allowed_lesson_ids": ["lesson-1"],
    "assistant_runtime": {"remaining_general": 1, "remaining_period": 0},
    "ai_topup_balance_units": 0
  }'::jsonb,
  now(), now() + interval '1 hour'
) ON CONFLICT (user_id, snapshot_version) DO NOTHING;

INSERT INTO billing.subscriptions (
  id, user_id, access_state, billing_state, cancel_at_period_end,
  market_code, currency_code, billing_interval, idempotency_key
) VALUES (
  'cccccccc-cccc-cccc-cccc-ccccccccccc1', '${USER_FREE_ID}',
  'free_active', 'none', false, 'INTL', 'USD', 'none', 'fixture-sub-free-1'
) ON CONFLICT (user_id) DO UPDATE SET access_state='free_active';

INSERT INTO billing.user_entitlement_snapshots (
  user_id, subscription_id, entitlement_policy_version_id, plan_version_id,
  snapshot_version, access_state, entitlement_json, generated_at, expires_at
) VALUES (
  '${USER_FREE_ID}', 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301',
  1, 'free_active',
  '{
    "paid_content_entitled": false,
    "access_state": "free_active",
    "denial_reason_code": null,
    "lessons": {"entitled_lesson_ids": ["lesson-1"]},
    "builder_access": false,
    "video_access": false,
    "rag_allowed_lesson_ids": [],
    "assistant_runtime": {"remaining_general": 1, "remaining_period": 0},
    "ai_topup_balance_units": 0
  }'::jsonb,
  now(), now() + interval '1 hour'
) ON CONFLICT (user_id, snapshot_version) DO NOTHING;

INSERT INTO billing.subscriptions (
  id, user_id, plan_version_id, access_state, billing_state, cancel_at_period_end,
  current_period_start, current_period_end, paid_activation_at, entitlement_active_at,
  market_code, currency_code, billing_interval, idempotency_key
) VALUES (
  'dddddddd-dddd-dddd-dddd-ddddddddddd1', '${USER_ZERO_ID}', '33333333-3333-3333-3333-333333333301',
  'paid_active', 'active', false, now() - interval '10 days', now() + interval '20 days',
  now() - interval '10 days', now() - interval '10 days', 'INTL', 'USD', 'month', 'fixture-sub-zero-1'
) ON CONFLICT (user_id) DO UPDATE SET access_state='paid_active';

INSERT INTO billing.user_entitlement_snapshots (
  user_id, subscription_id, entitlement_policy_version_id, plan_version_id,
  snapshot_version, access_state, entitlement_json, generated_at, expires_at
) VALUES (
  '${USER_ZERO_ID}', 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301',
  1, 'paid_active',
  '{
    "paid_content_entitled": true,
    "access_state": "paid_active",
    "lessons": {"entitled_lesson_ids": ["lesson-1"]},
    "builder_access": true,
    "video_access": true,
    "rag_allowed_lesson_ids": ["lesson-1"],
    "assistant_runtime": {"remaining_general": 0, "remaining_period": 0},
    "ai_topup_balance_units": 0
  }'::jsonb,
  now(), now() + interval '1 hour'
) ON CONFLICT (user_id, snapshot_version) DO NOTHING;
SQL

# Gate 2: PostgreSQL function execution
PG_EVAL="$(psql "$LOCAL_PG_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT set_config('request.jwt.claims', '{\"role\":\"service_role\"}', true); SELECT billing.evaluate_access('${USER_A_ID}'::uuid, 'lesson', 'lesson-1')->>'allowed';" 2>"$ARTIFACT_DIR/pg-eval.err" || true)"
# Prefer auth.jwt path via PostgREST for product path; still prove SQL callable:
PG_CALL="$(psql "$LOCAL_PG_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT billing.is_service_role_caller() IS NOT NULL;" 2>/dev/null || echo f)"
if [[ "$PG_CALL" == "t" ]]; then
  record_gate 2 "PostgreSQL function execution" "callable" "callable" "PASS" "billing-functions-security.txt"
else
  record_gate 2 "PostgreSQL function execution" "callable" "failed" "FAIL" "pg-eval.err"
fi

# Gate 3: PostgREST RPC execution (service evaluate_access)
EVAL_LESSON="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"lesson\",\"p_resource_id\":\"lesson-1\"}")"
echo "evaluate_lesson_allowed=$(echo "$EVAL_LESSON" | jq -r '.allowed // "null"')" > "$ARTIFACT_DIR/postgrest-evaluate.txt"
if [[ "$(echo "$EVAL_LESSON" | jq -r '.allowed')" == "true" ]]; then
  record_gate 3 "PostgREST RPC execution" "2xx allowed=true" "allowed=true" "PASS" "postgrest-evaluate.txt"
else
  record_gate 3 "PostgREST RPC execution" "2xx allowed=true" "$(echo "$EVAL_LESSON" | jq -c '{code:.code,message:.message,allowed:.allowed}' 2>/dev/null || echo fail)" "FAIL" "postgrest-evaluate.txt"
fi

# Gate 4: service-role success (already partially covered; also reserve)
RESERVE_OK="$(rpc_body service reserve_ai_quota "{\"p_user_id\":\"${USER_A_ID}\",\"p_category\":\"assistant_runtime_general\",\"p_lesson_id\":\"lesson-1\",\"p_request_id\":\"11111111-1111-1111-1111-111111111111\",\"p_units\":1,\"p_idempotency_key\":\"reserve-ok-1\"}")"
echo "reserve_has_id=$(echo "$RESERVE_OK" | jq -r 'has("reservation_id")')" > "$ARTIFACT_DIR/service-role-success.txt"
if [[ "$(echo "$RESERVE_OK" | jq -r 'has("reservation_id")')" == "true" ]]; then
  record_gate 4 "Valid local service-role success" "reservation_id present" "present" "PASS" "service-role-success.txt"
else
  record_gate 4 "Valid local service-role success" "reservation_id present" "$(echo "$RESERVE_OK" | jq -c '{code:.code,message:.message}' 2>/dev/null || echo fail)" "FAIL" "service-role-success.txt"
fi

# Gate 5: anonymous denial
ANON_CODE="$(rpc_code anon evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"lesson\",\"p_resource_id\":\"lesson-1\"}")"
echo "anon_evaluate_http=${ANON_CODE}" > "$ARTIFACT_DIR/anon-denial.txt"
if [[ "$ANON_CODE" =~ ^(401|403|400)$ ]]; then
  record_gate 5 "Anonymous denial" "401/403/400" "$ANON_CODE" "PASS" "anon-denial.txt"
else
  record_gate 5 "Anonymous denial" "401/403/400" "$ANON_CODE" "FAIL" "anon-denial.txt"
fi

# Gate 6: authenticated-client denial for service-only RPC
AUTH_EVAL_CODE="$(rpc_code auth evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"lesson\",\"p_resource_id\":\"lesson-1\"}")"
echo "auth_evaluate_http=${AUTH_EVAL_CODE}" > "$ARTIFACT_DIR/auth-denial.txt"
if [[ "$AUTH_EVAL_CODE" =~ ^(401|403|400)$ ]]; then
  record_gate 6 "Authenticated-client denial where service-role required" "401/403/400" "$AUTH_EVAL_CODE" "PASS" "auth-denial.txt"
else
  record_gate 6 "Authenticated-client denial where service-role required" "401/403/400" "$AUTH_EVAL_CODE" "FAIL" "auth-denial.txt"
fi

# Gate 7: cross-user denial (get_entitlement_snapshot as user A for user B)
CROSS_CODE="$(rpc_code auth get_entitlement_snapshot "{\"p_user_id\":\"${USER_B_ID}\"}")"
CROSS_BODY="$(rpc_body auth get_entitlement_snapshot "{\"p_user_id\":\"${USER_B_ID}\"}")"
echo "cross_http=${CROSS_CODE}" > "$ARTIFACT_DIR/cross-user-denial.txt"
echo "cross_message=$(echo "$CROSS_BODY" | jq -r '.message // .code // "none"')" >> "$ARTIFACT_DIR/cross-user-denial.txt"
if [[ "$CROSS_CODE" =~ ^(401|403|400)$ ]] || [[ "$(echo "$CROSS_BODY" | jq -r '.message // empty')" == *FORBIDDEN* ]]; then
  record_gate 7 "Cross-user denial" "denied" "denied" "PASS" "cross-user-denial.txt"
else
  record_gate 7 "Cross-user denial" "denied" "unexpected" "FAIL" "cross-user-denial.txt"
fi

# Gate 8: free_active behavior
FREE_EVAL="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_FREE_ID}\",\"p_resource_type\":\"lesson\",\"p_resource_id\":\"lesson-1\"}")"
echo "free_active_allowed=$(echo "$FREE_EVAL" | jq -r '.allowed // "null"')" > "$ARTIFACT_DIR/free-active.txt"
if [[ "$(echo "$FREE_EVAL" | jq -r '.allowed')" == "true" ]]; then
  record_gate 8 "billing.evaluate_access correct free_active behavior" "allowed=true" "allowed=true" "PASS" "free-active.txt"
else
  record_gate 8 "billing.evaluate_access correct free_active behavior" "allowed=true" "$(echo "$FREE_EVAL" | jq -c '{allowed:.allowed,denial:.denial_reason_code}' 2>/dev/null || echo fail)" "FAIL" "free-active.txt"
fi

# Gate 9: separate Video entitlement
VIDEO_OK="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"video\",\"p_resource_id\":\"lesson-1\"}")"
VIDEO_BAD="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"video\",\"p_resource_id\":\"lesson-missing\"}")"
echo "video_ok=$(echo "$VIDEO_OK" | jq -r '.allowed // "null"')" > "$ARTIFACT_DIR/video-entitlement.txt"
echo "video_bad=$(echo "$VIDEO_BAD" | jq -r '.allowed // "null"')" >> "$ARTIFACT_DIR/video-entitlement.txt"
echo "video_bad_denial=$(echo "$VIDEO_BAD" | jq -r '.denial_reason_code // "null"')" >> "$ARTIFACT_DIR/video-entitlement.txt"
if [[ "$(echo "$VIDEO_OK" | jq -r '.allowed')" == "true" \
   && "$(echo "$VIDEO_BAD" | jq -r '.allowed')" == "false" \
   && "$(echo "$VIDEO_BAD" | jq -r '.denial_reason_code')" == "VIDEO_NOT_ENTITLED" ]]; then
  record_gate 9 "Separate Video entitlement behavior" "ok=true bad=VIDEO_NOT_ENTITLED" "matched" "PASS" "video-entitlement.txt"
else
  record_gate 9 "Separate Video entitlement behavior" "ok=true bad=VIDEO_NOT_ENTITLED" "mismatch" "FAIL" "video-entitlement.txt"
fi

# Gate 10: separate RAG entitlement
RAG_OK="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"rag\",\"p_resource_id\":\"lesson-1\"}")"
RAG_BAD="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"rag\",\"p_resource_id\":\"lesson-missing\"}")"
echo "rag_ok=$(echo "$RAG_OK" | jq -r '.allowed // "null"')" > "$ARTIFACT_DIR/rag-entitlement.txt"
echo "rag_bad=$(echo "$RAG_BAD" | jq -r '.allowed // "null"')" >> "$ARTIFACT_DIR/rag-entitlement.txt"
echo "rag_bad_denial=$(echo "$RAG_BAD" | jq -r '.denial_reason_code // "null"')" >> "$ARTIFACT_DIR/rag-entitlement.txt"
if [[ "$(echo "$RAG_OK" | jq -r '.allowed')" == "true" \
   && "$(echo "$RAG_BAD" | jq -r '.allowed')" == "false" \
   && "$(echo "$RAG_BAD" | jq -r '.denial_reason_code')" == "RAG_NOT_ENTITLED" ]]; then
  record_gate 10 "Separate RAG entitlement behavior" "ok=true bad=RAG_NOT_ENTITLED" "matched" "PASS" "rag-entitlement.txt"
else
  record_gate 10 "Separate RAG entitlement behavior" "ok=true bad=RAG_NOT_ENTITLED" "mismatch" "FAIL" "rag-entitlement.txt"
fi

# Gate 11: assistant quota enforcement via evaluate_access
ASSIST_OK="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"assistant_runtime\",\"p_resource_id\":\"\"}")"
ASSIST_ZERO="$(rpc_body service evaluate_access "{\"p_user_id\":\"${USER_ZERO_ID}\",\"p_resource_type\":\"assistant_runtime\",\"p_resource_id\":\"\"}")"
echo "assist_ok=$(echo "$ASSIST_OK" | jq -r '.allowed // "null"')" > "$ARTIFACT_DIR/assistant-quota.txt"
echo "assist_zero=$(echo "$ASSIST_ZERO" | jq -r '.allowed // "null"')" >> "$ARTIFACT_DIR/assistant-quota.txt"
echo "assist_zero_denial=$(echo "$ASSIST_ZERO" | jq -r '.denial_reason_code // "null"')" >> "$ARTIFACT_DIR/assistant-quota.txt"
if [[ "$(echo "$ASSIST_OK" | jq -r '.allowed')" == "true" \
   && "$(echo "$ASSIST_ZERO" | jq -r '.allowed')" == "false" \
   && "$(echo "$ASSIST_ZERO" | jq -r '.denial_reason_code')" == "AI_QUOTA_EXCEEDED" ]]; then
  record_gate 11 "Assistant quota enforcement" "ok=true zero=AI_QUOTA_EXCEEDED" "matched" "PASS" "assistant-quota.txt"
else
  record_gate 11 "Assistant quota enforcement" "ok=true zero=AI_QUOTA_EXCEEDED" "mismatch" "FAIL" "assistant-quota.txt"
fi

# Gate 12: reserve rejects units <= 0
NEG="$(rpc_body service reserve_ai_quota "{\"p_user_id\":\"${USER_A_ID}\",\"p_category\":\"assistant_runtime_general\",\"p_lesson_id\":\"lesson-1\",\"p_request_id\":\"22222222-2222-2222-2222-222222222222\",\"p_units\":0,\"p_idempotency_key\":\"reserve-zero-1\"}")"
echo "zero_units_message=$(echo "$NEG" | jq -r '.message // .code // "none"')" > "$ARTIFACT_DIR/invalid-units.txt"
if [[ "$(echo "$NEG" | jq -r '.message // empty')" == *QUOTA_EXCEEDED* ]] || [[ "$(echo "$NEG" | jq -r '.code // empty')" == "P0001" ]]; then
  record_gate 12 "reserve_ai_quota rejection for units <= 0" "QUOTA_EXCEEDED" "denied" "PASS" "invalid-units.txt"
else
  record_gate 12 "reserve_ai_quota rejection for units <= 0" "QUOTA_EXCEEDED" "unexpected" "FAIL" "invalid-units.txt"
fi

# Gate 13: reserve rejects above remaining (USER_A remaining_general=2 after one successful reserve => remaining 1 conceptually from snapshot still 2; use units=5)
OVER="$(rpc_body service reserve_ai_quota "{\"p_user_id\":\"${USER_A_ID}\",\"p_category\":\"assistant_runtime_general\",\"p_lesson_id\":\"lesson-1\",\"p_request_id\":\"33333333-3333-3333-3333-333333333333\",\"p_units\":5,\"p_idempotency_key\":\"reserve-over-1\"}")"
echo "over_message=$(echo "$OVER" | jq -r '.message // .code // "none"')" > "$ARTIFACT_DIR/over-quota.txt"
if [[ "$(echo "$OVER" | jq -r '.message // empty')" == *QUOTA_EXCEEDED* ]] || [[ "$(echo "$OVER" | jq -r '.code // empty')" == "P0001" ]]; then
  record_gate 13 "reserve_ai_quota rejection above remaining quota" "QUOTA_EXCEEDED" "denied" "PASS" "over-quota.txt"
else
  record_gate 13 "reserve_ai_quota rejection above remaining quota" "QUOTA_EXCEEDED" "unexpected" "FAIL" "over-quota.txt"
fi

# Gate 14: quota exhaustion
EXH="$(rpc_body service reserve_ai_quota "{\"p_user_id\":\"${USER_ZERO_ID}\",\"p_category\":\"assistant_runtime_general\",\"p_lesson_id\":\"lesson-1\",\"p_request_id\":\"44444444-4444-4444-4444-444444444444\",\"p_units\":1,\"p_idempotency_key\":\"reserve-exh-1\"}")"
echo "exhaust_message=$(echo "$EXH" | jq -r '.message // .code // "none"')" > "$ARTIFACT_DIR/quota-exhaustion.txt"
if [[ "$(echo "$EXH" | jq -r '.message // empty')" == *QUOTA_EXCEEDED* ]] || [[ "$(echo "$EXH" | jq -r '.code // empty')" == "P0001" ]]; then
  record_gate 14 "Quota-exhaustion behavior" "QUOTA_EXCEEDED" "denied" "PASS" "quota-exhaustion.txt"
else
  record_gate 14 "Quota-exhaustion behavior" "QUOTA_EXCEEDED" "unexpected" "FAIL" "quota-exhaustion.txt"
fi

# Gate 15/16: commit idempotent replay
# Product SQL matches commit idempotency_key against ledger.idempotency_key (set at reserve).
RES_ID="$(echo "$RESERVE_OK" | jq -r '.reservation_id')"
COMMIT_KEY="reserve-ok-1"
COMMIT1="$(rpc_body service commit_ai_quota "{\"p_reservation_id\":\"${RES_ID}\",\"p_input_tokens\":1,\"p_output_tokens\":1,\"p_idempotency_key\":\"${COMMIT_KEY}\"}")"
COMMIT2="$(rpc_body service commit_ai_quota "{\"p_reservation_id\":\"${RES_ID}\",\"p_input_tokens\":1,\"p_output_tokens\":1,\"p_idempotency_key\":\"${COMMIT_KEY}\"}")"
echo "commit1_committed=$(echo "$COMMIT1" | jq -r '.committed // false')" > "$ARTIFACT_DIR/commit-replay.txt"
echo "commit1_replay=$(echo "$COMMIT1" | jq -r '.idempotent_replay // false')" >> "$ARTIFACT_DIR/commit-replay.txt"
echo "commit2_committed=$(echo "$COMMIT2" | jq -r '.committed // false')" >> "$ARTIFACT_DIR/commit-replay.txt"
echo "commit2_replay=$(echo "$COMMIT2" | jq -r '.idempotent_replay // false')" >> "$ARTIFACT_DIR/commit-replay.txt"
if [[ "$(echo "$COMMIT1" | jq -r '.committed')" == "true" \
   && "$(echo "$COMMIT2" | jq -r '.committed')" == "true" \
   && "$(echo "$COMMIT2" | jq -r '.idempotent_replay')" == "true" ]]; then
  record_gate 15 "commit_ai_quota committed-key replay idempotency" "replay=true" "replay=true" "PASS" "commit-replay.txt"
else
  record_gate 15 "commit_ai_quota committed-key replay idempotency" "replay=true" "mismatch" "FAIL" "commit-replay.txt"
fi
# No duplicate committed rows for same reservation
DUP_COUNT="$(psql "$LOCAL_PG_URL" -At -c "SELECT count(*) FROM billing.ai_usage_ledger WHERE reservation_id='${RES_ID}' AND status='committed';")"
echo "committed_rows=${DUP_COUNT}" >> "$ARTIFACT_DIR/commit-replay.txt"
if [[ "$DUP_COUNT" == "1" ]]; then
  record_gate 16 "No duplicate processing during replay" "1 committed row" "1" "PASS" "commit-replay.txt"
else
  record_gate 16 "No duplicate processing during replay" "1 committed row" "$DUP_COUNT" "FAIL" "commit-replay.txt"
fi

# Gate 17: RLS enforcement
RLS_MISSING="$(grep -E '^rls_enabled_missing=' "$ARTIFACT_DIR/rls-evidence.txt" | cut -d= -f2)"
CROSS_ROWS="$(curl -s \
  -X GET "${SUPABASE_URL}/rest/v1/subscriptions?select=id&user_id=eq.${USER_B_ID}" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Accept-Profile: billing" \
  -H "Content-Profile: billing" | jq 'if type=="array" then length else 0 end')"
echo "rls_missing=${RLS_MISSING}" > "$ARTIFACT_DIR/rls-runtime.txt"
echo "cross_subscription_rows=${CROSS_ROWS}" >> "$ARTIFACT_DIR/rls-runtime.txt"
if [[ "${RLS_MISSING:-1}" == "0" && "$CROSS_ROWS" == "0" ]]; then
  record_gate 17 "RLS enforcement" "enabled + cross-user 0" "ok" "PASS" "rls-runtime.txt"
else
  record_gate 17 "RLS enforcement" "enabled + cross-user 0" "fail" "FAIL" "rls-runtime.txt"
fi

# Gate 18: required EXECUTE grants
if grep -q 'evaluate_access|service_role|EXECUTE' "$ARTIFACT_DIR/billing-routine-privileges.txt" \
  && grep -q 'reserve_ai_quota|service_role|EXECUTE' "$ARTIFACT_DIR/billing-routine-privileges.txt" \
  && grep -q 'commit_ai_quota|service_role|EXECUTE' "$ARTIFACT_DIR/billing-routine-privileges.txt"; then
  record_gate 18 "Required EXECUTE grants" "service_role EXECUTE present" "present" "PASS" "billing-routine-privileges.txt"
else
  record_gate 18 "Required EXECUTE grants" "service_role EXECUTE present" "missing" "FAIL" "billing-routine-privileges.txt"
fi

# Gate 19: PUBLIC EXECUTE revocation
PUB_COUNT="$(grep -c '|PUBLIC|EXECUTE' "$ARTIFACT_DIR/billing-routine-privileges.txt" || true)"
echo "public_execute_count=${PUB_COUNT}" > "$ARTIFACT_DIR/public-execute.txt"
if [[ "$PUB_COUNT" == "0" ]]; then
  record_gate 19 "PUBLIC EXECUTE revocation" "0" "0" "PASS" "billing-routine-privileges.txt"
else
  record_gate 19 "PUBLIC EXECUTE revocation" "0" "$PUB_COUNT" "FAIL" "billing-routine-privileges.txt"
fi

# Gate 20: SECURITY DEFINER ownership
SECDEF_OK="yes"
for fn in evaluate_access reserve_ai_quota commit_ai_quota; do
  line="$(grep -E "^${fn}\|" "$ARTIFACT_DIR/billing-functions-security.txt" || true)"
  definer="$(echo "$line" | cut -d'|' -f2)"
  owner="$(echo "$line" | cut -d'|' -f3)"
  if [[ "$definer" != "t" || "$owner" != "postgres" ]]; then
    SECDEF_OK="no"
  fi
done
if [[ "$SECDEF_OK" == "yes" ]]; then
  record_gate 20 "SECURITY DEFINER ownership and configuration" "definer+postgres" "ok" "PASS" "billing-functions-security.txt"
else
  record_gate 20 "SECURITY DEFINER ownership and configuration" "definer+postgres" "mismatch" "FAIL" "billing-functions-security.txt"
fi

# Gate 21: exact hardened search_path
SEARCH_OK="yes"
for fn in evaluate_access reserve_ai_quota commit_ai_quota; do
  if ! grep -E "^${fn}\|t\|postgres\|.*search_path=billing, public, pg_temp" "$ARTIFACT_DIR/billing-functions-security.txt" >/dev/null; then
    SEARCH_OK="no"
  fi
done
if [[ "$SEARCH_OK" == "yes" ]]; then
  record_gate 21 "Exact hardened search_path" "billing, public, pg_temp" "matched" "PASS" "billing-functions-security.txt"
else
  record_gate 21 "Exact hardened search_path" "billing, public, pg_temp" "mismatch" "FAIL" "billing-functions-security.txt"
fi

# Gate 22: missing role denial (no Authorization)
MISSING_CODE="$(rpc_code anon evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"lesson\",\"p_resource_id\":\"lesson-1\"}")"
echo "missing_role_http=${MISSING_CODE}" > "$ARTIFACT_DIR/missing-role.txt"
if [[ "$MISSING_CODE" =~ ^(401|403|400)$ ]]; then
  record_gate 22 "Missing role denial" "401/403/400" "$MISSING_CODE" "PASS" "missing-role.txt"
else
  record_gate 22 "Missing role denial" "401/403/400" "$MISSING_CODE" "FAIL" "missing-role.txt"
fi

# Gate 23: malformed role denial (JWT with role=authenticated forged as custom; or role=bogus)
JWT_OVERRIDE="$(make_local_jwt "bogus_role")"
MAL_CODE="$(rpc_code custom evaluate_access "{\"p_user_id\":\"${USER_A_ID}\",\"p_resource_type\":\"lesson\",\"p_resource_id\":\"lesson-1\"}")"
unset JWT_OVERRIDE
echo "malformed_role_http=${MAL_CODE}" > "$ARTIFACT_DIR/malformed-role.txt"
if [[ "$MAL_CODE" =~ ^(401|403|400)$ ]]; then
  record_gate 23 "Malformed role denial" "401/403/400" "$MAL_CODE" "PASS" "malformed-role.txt"
else
  record_gate 23 "Malformed role denial" "401/403/400" "$MAL_CODE" "FAIL" "malformed-role.txt"
fi

# Gate 24: fail-closed (missing snapshot user)
MISSING_USER="99999999-9999-9999-9999-999999999999"
FAIL_CLOSED="$(rpc_body service evaluate_access "{\"p_user_id\":\"${MISSING_USER}\",\"p_resource_type\":\"lesson\",\"p_resource_id\":\"lesson-1\"}")"
echo "fail_closed_allowed=$(echo "$FAIL_CLOSED" | jq -r '.allowed // "null"')" > "$ARTIFACT_DIR/fail-closed.txt"
echo "fail_closed_denial=$(echo "$FAIL_CLOSED" | jq -r '.denial_reason_code // "null"')" >> "$ARTIFACT_DIR/fail-closed.txt"
if [[ "$(echo "$FAIL_CLOSED" | jq -r '.allowed')" == "false" ]]; then
  record_gate 24 "Fail-closed behavior" "allowed=false" "allowed=false" "PASS" "fail-closed.txt"
else
  record_gate 24 "Fail-closed behavior" "allowed=false" "unexpected" "FAIL" "fail-closed.txt"
fi

write_results
if [[ "$FAIL_COUNT" -ne 0 ]]; then
  echo "FATAL: ${FAIL_COUNT} mandatory gate(s) failed" >&2
  exit 1
fi
echo "ALL_GATES_PASS"
