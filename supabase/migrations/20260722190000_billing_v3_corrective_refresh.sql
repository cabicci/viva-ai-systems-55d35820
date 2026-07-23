-- ============================================================================
-- Billing Launch Closure Contracts V3 — Corrective Refresh
-- Migration: 20260722190000_billing_v3_corrective_refresh.sql
--
-- Additive / forward-safe corrective migration. Does NOT modify any prior
-- migration file and does NOT touch edge functions. Every function replaced
-- here is the effective (last-wins) definition; the older definitions in
-- 20260722180000_* remain on disk unchanged but are superseded at runtime.
--
-- Five corrective defects are addressed:
--   1. Durable, separate provider-attempt ledger rows (one row per invocation).
--   2. Versioned admin-grant AI quota policy.
--   3. Real creator-admin identity on admin-access coupon creation (no all-zero
--      UUID fallback; bare service_role without a subject fails closed).
--   4. Per-user serialization of DISTINCT coupon grants with one canonical
--      active learner-grant state.
--   5. (tests / harness — see src/lib/billing/__tests__ and scripts/billing).
--
-- Depends on:
--   * billing.is_service_role_caller()  (20260710153000_*)
--   * public.has_role(uuid, app_role)   (20260603221717_*)
--   * billing.map_ledger_category_to_quota_bucket(text) (20260722180000_*)
-- ============================================================================

-- ============================================================================
-- DEFECT 1. Durable separate provider-attempt rows
-- ----------------------------------------------------------------------------
-- The reservation root row uses attempt_index = 0 (not a provider attempt).
-- Each real provider invocation creates its OWN durable ledger row with a
-- server-allocated attempt_index starting at 1 (1, 2, 3 ...). The logical
-- quota unit is committed exactly once, on the FIRST provider start.
-- ============================================================================

-- 1.1 New ledger columns (additive, nullable for the reservation root).
ALTER TABLE billing.ai_usage_ledger
  ADD COLUMN IF NOT EXISTS attempt_status text;
ALTER TABLE billing.ai_usage_ledger
  ADD COLUMN IF NOT EXISTS attempt_idempotency_key text;
ALTER TABLE billing.ai_usage_ledger
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_ledger_attempt_status_check'
  ) THEN
    ALTER TABLE billing.ai_usage_ledger
      ADD CONSTRAINT ai_usage_ledger_attempt_status_check
      CHECK (attempt_status IS NULL OR attempt_status IN (
        'registered', 'succeeded', 'failed', 'timed_out', 'canceled', 'provider_rejected'
      ));
  END IF;
END
$do$;

CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_ledger_attempt_idempotency_unique
  ON billing.ai_usage_ledger (attempt_idempotency_key)
  WHERE attempt_idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ai_usage_ledger_reservation_attempt_idx
  ON billing.ai_usage_ledger (reservation_id, attempt_index);

-- 1.2 register_provider_attempt (new signature; server allocates attempt_index).
--     The legacy 4-arg (uuid, integer, text, text) variant is dropped.
DROP FUNCTION IF EXISTS billing.register_provider_attempt(uuid, integer, text, text);

CREATE OR REPLACE FUNCTION billing.register_provider_attempt(
  p_reservation_id uuid,
  p_provider text,
  p_provider_request_id text,
  p_attempt_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_root billing.ai_usage_ledger%ROWTYPE;
  v_existing billing.ai_usage_ledger%ROWTYPE;
  v_bucket text;
  v_period_key text;
  v_first_start boolean;
  v_next_index integer;
  v_attempt_idem text;
  v_new_id uuid;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_provider IS NULL OR btrim(p_provider) = '' THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  -- Lock the reservation root row for the duration of the transaction. All
  -- concurrent attempt registrations for this reservation serialize here, which
  -- makes attempt_index allocation and the once-only quota commit race-free.
  SELECT * INTO v_root
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id AND attempt_index = 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_root.status IN ('released', 'stale_reconciled') THEN
    RAISE EXCEPTION 'RESERVATION_NOT_ACTIVE' USING ERRCODE = '22023';
  END IF;

  -- Idempotent replay #1: by attempt_idempotency_key. A replay MUST reference
  -- the same provider + provider_request_id it originally registered.
  IF p_attempt_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM billing.ai_usage_ledger
    WHERE attempt_idempotency_key = p_attempt_idempotency_key;

    IF FOUND THEN
      IF v_existing.reservation_id IS DISTINCT FROM p_reservation_id
         OR v_existing.provider IS DISTINCT FROM p_provider
         OR v_existing.provider_request_id IS DISTINCT FROM p_provider_request_id THEN
        RAISE EXCEPTION 'PROVIDER_ATTEMPT_CONFLICT' USING ERRCODE = '22023';
      END IF;
      RETURN jsonb_build_object(
        'reservation_id', p_reservation_id,
        'attempt_index', v_existing.attempt_index,
        'attempt_status', v_existing.attempt_status,
        'provider_started_at', v_existing.provider_started_at,
        'quota_committed', false,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  -- Idempotent replay #2: by (provider, provider_request_id) within THIS
  -- reservation. A provider_request_id already tied to a DIFFERENT reservation
  -- collides on the global unique index below and fails closed.
  IF p_provider_request_id IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM billing.ai_usage_ledger
    WHERE reservation_id = p_reservation_id
      AND provider = p_provider
      AND provider_request_id = p_provider_request_id
      AND attempt_index >= 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'reservation_id', p_reservation_id,
        'attempt_index', v_existing.attempt_index,
        'attempt_status', v_existing.attempt_status,
        'provider_started_at', v_existing.provider_started_at,
        'quota_committed', false,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_root.usage_category);
  v_period_key := to_char((v_root.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');

  -- First provider start: root still reserved and no attempt has begun.
  v_first_start := (
    v_root.status = 'reserved'
    AND v_root.provider_started_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM billing.ai_usage_ledger
      WHERE reservation_id = p_reservation_id AND provider_started_at IS NOT NULL
    )
  );

  -- Allocate the next attempt index under the root lock (provider attempts only).
  SELECT COALESCE(MAX(attempt_index), 0) + 1 INTO v_next_index
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id
    AND attempt_index >= 1;

  v_attempt_idem := COALESCE(
    p_attempt_idempotency_key,
    p_reservation_id::text || ':provider_attempt:' || v_next_index::text
  );

  INSERT INTO billing.ai_usage_ledger (
    user_id, usage_category, model_key, lesson_id, request_id, reservation_id,
    input_tokens, output_tokens, provider_cost_micro, billable, status,
    attempt_index, reserved_units, reservation_expires_at,
    provider, provider_request_id, provider_started_at,
    attempt_status, attempt_idempotency_key,
    idempotency_key, occurred_at
  ) VALUES (
    v_root.user_id, v_root.usage_category, v_root.model_key, v_root.lesson_id,
    v_root.request_id, p_reservation_id,
    0, 0, 0, v_root.billable, 'committed',
    v_next_index, v_root.reserved_units, v_root.reservation_expires_at,
    p_provider, p_provider_request_id, now(),
    'registered', v_attempt_idem,
    v_attempt_idem, now()
  )
  RETURNING id INTO v_new_id;

  -- Commit the logical quota unit(s) exactly once, on the first provider start.
  -- The reservation root records only that a provider began (status +
  -- provider_started_at). Provider identity (provider_request_id) lives on the
  -- durable per-attempt rows so the global (provider, provider_request_id)
  -- unique index is never violated by duplicating it onto the root.
  IF v_first_start THEN
    UPDATE billing.ai_usage_ledger
      SET status = 'committed',
          provider_started_at = now(),
          metadata = metadata || jsonb_build_object('first_attempt_index', v_next_index)
      WHERE reservation_id = p_reservation_id AND attempt_index = 0;

    UPDATE billing.entitlement_usage
      SET used_count = used_count + v_root.reserved_units,
          reserved_count = GREATEST(reserved_count - v_root.reserved_units, 0),
          updated_at = now()
      WHERE user_id = v_root.user_id
        AND usage_category = v_bucket
        AND period_key = v_period_key;
  END IF;

  RETURN jsonb_build_object(
    'reservation_id', p_reservation_id,
    'attempt_index', v_next_index,
    'attempt_status', 'registered',
    'provider_started_at', now(),
    'quota_committed', v_first_start,
    'idempotent_replay', false
  );
END;
$$;

-- 1.3 finalize_provider_attempt: records the terminal provider outcome for a
--     single attempt row. Never moves quota. Fail-closed on invalid transitions.
CREATE OR REPLACE FUNCTION billing.finalize_provider_attempt(
  p_reservation_id uuid,
  p_attempt_index integer,
  p_attempt_status text,
  p_input_tokens integer DEFAULT 0,
  p_output_tokens integer DEFAULT 0,
  p_provider_cost_micro bigint DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_attempt billing.ai_usage_ledger%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_attempt_status NOT IN ('succeeded', 'failed', 'timed_out', 'canceled', 'provider_rejected') THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_INVALID_STATUS' USING ERRCODE = '22023';
  END IF;

  IF p_attempt_index < 1 THEN
    -- attempt_index = 0 is the reservation root, not a provider attempt.
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_NOT_FINALIZABLE' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_attempt
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id AND attempt_index = p_attempt_index
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_attempt.attempt_status IS NULL THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_NOT_REGISTERED' USING ERRCODE = '22023';
  END IF;

  -- Idempotent replay: same terminal status returns the current row.
  IF v_attempt.attempt_status = p_attempt_status THEN
    RETURN jsonb_build_object(
      'reservation_id', p_reservation_id,
      'attempt_index', p_attempt_index,
      'attempt_status', v_attempt.attempt_status,
      'idempotent_replay', true
    );
  END IF;

  -- Fail closed: only 'registered' may transition to a terminal status. Any
  -- terminal-to-different-terminal transition is rejected.
  IF v_attempt.attempt_status <> 'registered' THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_INVALID_TRANSITION: % -> %',
      v_attempt.attempt_status, p_attempt_status USING ERRCODE = '22023';
  END IF;

  UPDATE billing.ai_usage_ledger
    SET attempt_status = p_attempt_status,
        input_tokens = COALESCE(p_input_tokens, 0),
        output_tokens = COALESCE(p_output_tokens, 0),
        provider_cost_micro = COALESCE(p_provider_cost_micro, 0),
        completed_at = now()
    WHERE reservation_id = p_reservation_id AND attempt_index = p_attempt_index;

  RETURN jsonb_build_object(
    'reservation_id', p_reservation_id,
    'attempt_index', p_attempt_index,
    'attempt_status', p_attempt_status,
    'idempotent_replay', false
  );
END;
$$;

-- 1.4 release_ai_quota: refuse to release once ANY attempt for the reservation
--     began (provider_started_at set on the root or any attempt row).
CREATE OR REPLACE FUNCTION billing.release_ai_quota(
  p_reservation_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_led billing.ai_usage_ledger%ROWTYPE;
  v_bucket text;
  v_period_key text;
  v_any_started boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_led
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id AND attempt_index = 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_led.status = 'released' THEN
    RETURN jsonb_build_object('released', true, 'idempotent_replay', true);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM billing.ai_usage_ledger
    WHERE reservation_id = p_reservation_id AND provider_started_at IS NOT NULL
  ) INTO v_any_started;

  IF v_led.status = 'committed' OR v_led.provider_started_at IS NOT NULL OR v_any_started THEN
    RAISE EXCEPTION 'CANNOT_RELEASE_STARTED' USING ERRCODE = '22023';
  END IF;

  IF v_led.status <> 'reserved' THEN
    RAISE EXCEPTION 'RESERVATION_NOT_RELEASABLE' USING ERRCODE = '22023';
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_led.usage_category);
  v_period_key := to_char((v_led.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');

  UPDATE billing.ai_usage_ledger
    SET status = 'released', occurred_at = occurred_at
    WHERE reservation_id = p_reservation_id AND attempt_index = 0;

  UPDATE billing.entitlement_usage
    SET reserved_count = GREATEST(reserved_count - v_led.reserved_units, 0),
        updated_at = now()
    WHERE user_id = v_led.user_id
      AND usage_category = v_bucket
      AND period_key = v_period_key;

  RETURN jsonb_build_object('released', true, 'idempotent_replay', false);
END;
$$;

-- ============================================================================
-- DEFECT 2. Versioned admin-grant AI quota
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing.admin_grant_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key text NOT NULL DEFAULT 'admin_learner_grant',
  version_number integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  ai_assistant_quota_limit integer NOT NULL CHECK (ai_assistant_quota_limit >= 0),
  grant_duration_hours integer NOT NULL DEFAULT 72 CHECK (grant_duration_hours = 72),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  published_by uuid,
  CONSTRAINT admin_grant_policy_versions_status_check
    CHECK (status IN ('draft', 'published', 'deprecated')),
  CONSTRAINT admin_grant_policy_versions_key_version_unique
    UNIQUE (policy_key, version_number)
);

-- Seed exactly one published version (idempotent).
INSERT INTO billing.admin_grant_policy_versions (
  policy_key, version_number, status, effective_from, effective_to,
  ai_assistant_quota_limit, grant_duration_hours, published_at
)
SELECT 'admin_learner_grant', 1, 'published', now(), NULL, 500, 72, now()
WHERE NOT EXISTS (
  SELECT 1 FROM billing.admin_grant_policy_versions
  WHERE policy_key = 'admin_learner_grant' AND version_number = 1
);

-- 2.1 resolve_admin_grant_policy: the single published version effective as of
--     p_as_of. Fail closed if 0 (unavailable) or >1 (ambiguous).
CREATE OR REPLACE FUNCTION billing.resolve_admin_grant_policy(p_as_of timestamptz DEFAULT now())
RETURNS billing.admin_grant_policy_versions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_row billing.admin_grant_policy_versions%ROWTYPE;
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM billing.admin_grant_policy_versions
  WHERE policy_key = 'admin_learner_grant'
    AND status = 'published'
    AND effective_from <= p_as_of
    AND (effective_to IS NULL OR effective_to > p_as_of);

  IF v_count = 0 THEN
    RAISE EXCEPTION 'ADMIN_GRANT_POLICY_UNAVAILABLE' USING ERRCODE = '22023';
  ELSIF v_count > 1 THEN
    RAISE EXCEPTION 'ADMIN_GRANT_POLICY_AMBIGUOUS' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM billing.admin_grant_policy_versions
  WHERE policy_key = 'admin_learner_grant'
    AND status = 'published'
    AND effective_from <= p_as_of
    AND (effective_to IS NULL OR effective_to > p_as_of)
  LIMIT 1;

  RETURN v_row;
END;
$$;

-- 2.2 admin_grant_ai_assistant_limit: current published quota (STABLE).
CREATE OR REPLACE FUNCTION billing.admin_grant_ai_assistant_limit()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_policy billing.admin_grant_policy_versions%ROWTYPE;
BEGIN
  v_policy := billing.resolve_admin_grant_policy(now());
  RETURN v_policy.ai_assistant_quota_limit;
END;
$$;

-- 2.3 publish_admin_grant_policy_version: admin-only. Deprecates the previous
--     published version for the same key (effective_to = now()) atomically.
CREATE OR REPLACE FUNCTION billing.publish_admin_grant_policy_version(
  p_ai_assistant_quota_limit integer,
  p_grant_duration_hours integer DEFAULT 72,
  p_policy_key text DEFAULT 'admin_learner_grant',
  p_effective_from timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean := (v_admin IS NOT NULL AND public.has_role(v_admin, 'admin'::app_role));
  v_is_service boolean := billing.is_service_role_caller();
  v_next_version integer;
  v_id uuid;
BEGIN
  IF NOT (v_is_admin OR v_is_service) THEN
    RAISE EXCEPTION 'ADMIN_GRANT_POLICY_PUBLISH_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_ai_assistant_quota_limit IS NULL OR p_ai_assistant_quota_limit < 0 THEN
    RAISE EXCEPTION 'ADMIN_GRANT_POLICY_INVALID_QUOTA' USING ERRCODE = '22023';
  END IF;

  IF p_grant_duration_hours IS DISTINCT FROM 72 THEN
    RAISE EXCEPTION 'ADMIN_GRANT_POLICY_INVALID_DURATION' USING ERRCODE = '22023';
  END IF;

  -- Deprecate the currently-published version for this key (close its window).
  UPDATE billing.admin_grant_policy_versions
    SET status = 'deprecated',
        effective_to = COALESCE(effective_to, p_effective_from)
    WHERE policy_key = p_policy_key
      AND status = 'published';

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM billing.admin_grant_policy_versions
  WHERE policy_key = p_policy_key;

  INSERT INTO billing.admin_grant_policy_versions (
    policy_key, version_number, status, effective_from, effective_to,
    ai_assistant_quota_limit, grant_duration_hours, published_at, published_by
  ) VALUES (
    p_policy_key, v_next_version, 'published', p_effective_from, NULL,
    p_ai_assistant_quota_limit, p_grant_duration_hours, now(), v_admin
  )
  RETURNING id INTO v_id;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, after_state
  ) VALUES (
    CASE WHEN v_is_admin THEN 'user' ELSE 'service' END,
    COALESCE(v_admin::text, 'service_role'),
    'publish_admin_grant_policy_version', 'admin_grant_policy_version', v_id,
    jsonb_build_object(
      'policy_key', p_policy_key,
      'version_number', v_next_version,
      'ai_assistant_quota_limit', p_ai_assistant_quota_limit
    )
  );

  RETURN jsonb_build_object(
    'policy_version_id', v_id,
    'policy_key', p_policy_key,
    'version_number', v_next_version,
    'status', 'published'
  );
END;
$$;

-- 2.4 admin_access_grants gains a policy_version_id snapshot.
ALTER TABLE billing.admin_access_grants
  ADD COLUMN IF NOT EXISTS policy_version_id uuid
  REFERENCES billing.admin_grant_policy_versions (id);

-- ============================================================================
-- DEFECT 4. Canonical per-user admin-grant state (declared before redeem so the
-- rewritten redeem/resolve/evaluate functions can reference it).
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing.admin_user_grant_state (
  user_id uuid PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  policy_version_id uuid NOT NULL REFERENCES billing.admin_grant_policy_versions (id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- DEFECT 3. Real creator-admin identity for admin-access coupon creation
-- ----------------------------------------------------------------------------
-- REQUIRES auth.uid() (a real subject) AND has_role(admin). A bare service_role
-- token without a subject fails closed even though the EXECUTE grant is kept.
-- created_by_admin_id is auth.uid() only — NO all-zero UUID fallback.
-- ============================================================================
CREATE OR REPLACE FUNCTION billing.create_admin_access_coupon(
  p_intended_user_id uuid,
  p_reason text,
  p_code_hash text,
  p_idempotency_key text,
  p_valid_until timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_existing billing.admin_access_coupons%ROWTYPE;
  v_id uuid;
BEGIN
  -- Real creator-admin identity is mandatory. A bare service_role token without
  -- a subject (auth.uid() IS NULL) is rejected even if is_service_role_caller().
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'ADMIN_COUPON_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  IF NOT public.has_role(v_admin, 'admin'::app_role) THEN
    RAISE EXCEPTION 'ADMIN_COUPON_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_intended_user_id IS NULL
     OR p_reason IS NULL OR btrim(p_reason) = ''
     OR p_code_hash IS NULL OR btrim(p_code_hash) = ''
     OR p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'ADMIN_COUPON_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing
  FROM billing.admin_access_coupons
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'coupon_id', v_existing.id,
      'status', v_existing.status,
      'idempotent_replay', true
    );
  END IF;

  INSERT INTO billing.admin_access_coupons (
    code_hash, intended_user_id, created_by_admin_id, reason,
    status, expires_at, idempotency_key, metadata
  ) VALUES (
    p_code_hash, p_intended_user_id, v_admin, p_reason,
    'active', p_valid_until, p_idempotency_key,
    jsonb_build_object('created_via', 'admin')
  )
  RETURNING id INTO v_id;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, after_state
  ) VALUES (
    'user', v_admin::text,
    'create_admin_access_coupon', 'admin_access_coupon', v_id,
    jsonb_build_object('intended_user_id', p_intended_user_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('coupon_id', v_id, 'status', 'active', 'idempotent_replay', false);
END;
$$;

-- ============================================================================
-- DEFECT 4 (cont). Serialize DISTINCT coupon grants per user
-- ----------------------------------------------------------------------------
-- Acquire a per-user advisory xact lock BEFORE reading grants, then lock the
-- coupon. Two concurrent DISTINCT coupon redemptions both succeed and stack
-- cumulatively (final expiry = now + 2 x duration). One canonical active grant
-- state is maintained in billing.admin_user_grant_state; history rows are kept
-- in billing.admin_access_grants with only the newest marked active.
-- ============================================================================
CREATE OR REPLACE FUNCTION billing.redeem_admin_access_coupon(
  p_code_hash text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_coupon billing.admin_access_coupons%ROWTYPE;
  v_existing_grant billing.admin_access_grants%ROWTYPE;
  v_state billing.admin_user_grant_state%ROWTYPE;
  v_policy billing.admin_grant_policy_versions%ROWTYPE;
  v_base timestamptz;
  v_new_expires timestamptz;
  v_grant_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'ADMIN_COUPON_REDEEM_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  IF p_code_hash IS NULL OR btrim(p_code_hash) = ''
     OR p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'ADMIN_COUPON_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  -- Idempotent replay by grant idempotency key.
  SELECT * INTO v_existing_grant
  FROM billing.admin_access_grants
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'grant_id', v_existing_grant.id,
      'expires_at', v_existing_grant.expires_at,
      'idempotent_replay', true
    );
  END IF;

  -- Per-user serialization: distinct coupons for the same user stack correctly
  -- without lost updates. The lock is held until the transaction commits.
  PERFORM pg_advisory_xact_lock(hashtextextended('billing.admin_grant:' || v_caller::text, 0));

  -- Lock the coupon for the duration of the transaction.
  SELECT * INTO v_coupon
  FROM billing.admin_access_coupons
  WHERE code_hash = p_code_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ADMIN_COUPON_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_coupon.intended_user_id IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'ADMIN_COUPON_NOT_INTENDED_USER' USING ERRCODE = '42501';
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    UPDATE billing.admin_access_coupons
      SET status = 'expired'
      WHERE id = v_coupon.id AND status = 'active';
    RAISE EXCEPTION 'ADMIN_COUPON_EXPIRED' USING ERRCODE = '22023';
  END IF;

  IF v_coupon.status <> 'active' THEN
    RAISE EXCEPTION 'ADMIN_COUPON_NOT_ACTIVE' USING ERRCODE = '22023';
  END IF;

  -- Resolve the effective grant policy (fail closed if unavailable/ambiguous).
  v_policy := billing.resolve_admin_grant_policy(now());

  -- Consume the coupon.
  UPDATE billing.admin_access_coupons
    SET status = 'redeemed', redeemed_at = now()
    WHERE id = v_coupon.id;

  -- Upsert the canonical grant state, stacking onto any still-active window.
  SELECT * INTO v_state
  FROM billing.admin_user_grant_state
  WHERE user_id = v_caller
  FOR UPDATE;

  v_base := GREATEST(now(), COALESCE(v_state.expires_at, now()));
  v_new_expires := v_base + make_interval(hours => v_policy.grant_duration_hours);

  INSERT INTO billing.admin_user_grant_state (user_id, expires_at, policy_version_id, updated_at)
  VALUES (v_caller, v_new_expires, v_policy.id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at,
        policy_version_id = EXCLUDED.policy_version_id,
        updated_at = now();

  -- Demote any previously-active history rows so exactly one stays active.
  UPDATE billing.admin_access_grants
    SET status = 'expired'
    WHERE user_id = v_caller AND status = 'active';

  -- Append the new active history row.
  INSERT INTO billing.admin_access_grants (
    user_id, source_coupon_id, granted_by_admin_id,
    starts_at, expires_at, status, idempotency_key, policy_version_id
  ) VALUES (
    v_caller, v_coupon.id, v_coupon.created_by_admin_id,
    now(), v_new_expires, 'active', p_idempotency_key, v_policy.id
  )
  RETURNING id INTO v_grant_id;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, after_state
  ) VALUES (
    'user', v_caller::text,
    'redeem_admin_access_coupon', 'admin_access_grant', v_grant_id,
    jsonb_build_object(
      'source_coupon_id', v_coupon.id,
      'expires_at', v_new_expires,
      'policy_version_id', v_policy.id
    )
  );

  RETURN jsonb_build_object(
    'grant_id', v_grant_id,
    'expires_at', v_new_expires,
    'policy_version_id', v_policy.id,
    'idempotent_replay', false
  );
END;
$$;

-- 4.1 revoke_admin_access_grant: also collapse the canonical state so revocation
--     is authoritative for resolve/evaluate.
CREATE OR REPLACE FUNCTION billing.revoke_admin_access_grant(
  p_grant_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean := (v_admin IS NOT NULL AND public.has_role(v_admin, 'admin'::app_role));
  v_is_service boolean := billing.is_service_role_caller();
  v_grant billing.admin_access_grants%ROWTYPE;
BEGIN
  IF NOT (v_is_admin OR v_is_service) THEN
    RAISE EXCEPTION 'ADMIN_GRANT_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_grant
  FROM billing.admin_access_grants
  WHERE id = p_grant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ADMIN_GRANT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_grant.status = 'revoked' THEN
    RETURN jsonb_build_object('grant_id', p_grant_id, 'status', 'revoked', 'idempotent_replay', true);
  END IF;

  UPDATE billing.admin_access_grants
    SET status = 'revoked',
        revoked_at = now(),
        revoked_by = v_admin
    WHERE id = p_grant_id;

  -- End the canonical window for this user (fail-closed access after revoke).
  UPDATE billing.admin_user_grant_state
    SET expires_at = LEAST(expires_at, now()), updated_at = now()
    WHERE user_id = v_grant.user_id;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, before_state, after_state
  ) VALUES (
    CASE WHEN v_is_admin THEN 'user' ELSE 'service' END,
    COALESCE(v_admin::text, 'service_role'),
    'revoke_admin_access_grant', 'admin_access_grant', p_grant_id,
    jsonb_build_object('status', v_grant.status),
    jsonb_build_object('status', 'revoked', 'reason', p_reason)
  );

  RETURN jsonb_build_object('grant_id', p_grant_id, 'status', 'revoked', 'idempotent_replay', false);
END;
$$;

-- ============================================================================
-- DEFECT 2 (cont). Rewire quota / access resolution to the versioned policy and
-- the canonical per-user grant state.
-- ============================================================================

-- resolve_ai_assistant_limit: paid plan wins; otherwise the active canonical
-- admin-grant window resolves its quota from the SNAPSHOTTED policy version, so
-- publishing a newer policy never retroactively changes existing grants.
CREATE OR REPLACE FUNCTION billing.resolve_ai_assistant_limit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_paid_limit integer;
  v_state billing.admin_user_grant_state%ROWTYPE;
  v_limit integer;
BEGIN
  SELECT GREATEST(
           COALESCE(epv.assistant_runtime_period_quota, 0),
           COALESCE(epv.assistant_runtime_general_monthly_quota, 0)
         )
    INTO v_paid_limit
  FROM billing.subscriptions s
  JOIN billing.plan_versions pv ON pv.id = s.plan_version_id
  JOIN billing.entitlement_policy_versions epv ON epv.id = pv.entitlement_policy_version_id
  WHERE s.user_id = p_user_id
    AND s.access_state IN ('paid_active', 'paid_scheduled', 'canceled_at_period_end', 'past_due')
  LIMIT 1;

  IF v_paid_limit IS NOT NULL AND v_paid_limit > 0 THEN
    RETURN v_paid_limit;
  END IF;

  SELECT * INTO v_state
  FROM billing.admin_user_grant_state
  WHERE user_id = p_user_id AND expires_at > now();

  IF FOUND THEN
    SELECT ai_assistant_quota_limit INTO v_limit
    FROM billing.admin_grant_policy_versions
    WHERE id = v_state.policy_version_id;

    RETURN COALESCE(v_limit, billing.admin_grant_ai_assistant_limit());
  END IF;

  -- Legacy fallback: an active grant row without canonical state.
  IF EXISTS (
    SELECT 1 FROM billing.admin_access_grants g
    WHERE g.user_id = p_user_id AND g.status = 'active' AND g.expires_at > now()
  ) THEN
    RETURN billing.admin_grant_ai_assistant_limit();
  END IF;

  RETURN 0;
END;
$$;

-- evaluate_access: admin-grant activeness derives from the canonical state.
CREATE OR REPLACE FUNCTION billing.evaluate_access(
  p_user_id uuid,
  p_resource_type text,
  p_resource_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_snapshot jsonb;
  v_paid boolean;
  v_admin_grant boolean;
  v_entitled boolean;
  v_allowed boolean := false;
  v_denial text := 'ENTITLEMENT_UNAVAILABLE';
  v_period_key text;
  v_usage billing.entitlement_usage%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'EVALUATE_ACCESS_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  v_snapshot := billing.get_entitlement_snapshot(p_user_id);
  v_paid := COALESCE((v_snapshot ->> 'paid_content_entitled')::boolean, false);

  SELECT (
    EXISTS (
      SELECT 1 FROM billing.admin_user_grant_state st
      WHERE st.user_id = p_user_id AND st.expires_at > now()
    )
    OR EXISTS (
      SELECT 1 FROM billing.admin_access_grants g
      WHERE g.user_id = p_user_id AND g.status = 'active' AND g.expires_at > now()
    )
  ) INTO v_admin_grant;

  v_entitled := v_paid OR v_admin_grant;

  IF p_resource_type IN ('lesson', 'video', 'rag') THEN
    v_allowed := COALESCE((v_snapshot -> 'lessons' -> 'entitled_lesson_ids') ? p_resource_id, false);
    IF NOT v_allowed THEN
      v_denial := CASE p_resource_type
        WHEN 'video' THEN 'VIDEO_NOT_ENTITLED'
        WHEN 'rag' THEN 'RAG_NOT_ENTITLED'
        ELSE 'LESSON_NOT_ENTITLED'
      END;
    END IF;

  ELSIF p_resource_type = 'builder' THEN
    v_allowed := v_entitled AND COALESCE((v_snapshot ->> 'builder_access')::boolean, false);
    IF NOT v_allowed THEN v_denial := 'BUILDER_NOT_ENTITLED'; END IF;

  ELSIF p_resource_type = 'assistant_runtime' THEN
    IF NOT v_entitled THEN
      v_allowed := false;
      v_denial := 'AI_ACCESS_DENIED';
    ELSE
      v_period_key := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
      SELECT * INTO v_usage
      FROM billing.entitlement_usage
      WHERE user_id = p_user_id
        AND usage_category = 'ai_assistant'
        AND period_key = v_period_key;

      IF FOUND AND (v_usage.used_count + v_usage.reserved_count) >= COALESCE(v_usage.quota_limit, 0) THEN
        v_allowed := false;
        v_denial := 'ASSISTANT_QUOTA_EXCEEDED';
      ELSE
        v_allowed := true;
      END IF;
    END IF;

  ELSE
    v_allowed := false;
    v_denial := 'ENTITLEMENT_UNAVAILABLE';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'denial_reason_code', CASE WHEN v_allowed THEN NULL ELSE v_denial END
  );
END;
$$;

-- reserve_learner_ai_access: admin-grant gate derives from the canonical state.
CREATE OR REPLACE FUNCTION billing.reserve_learner_ai_access(
  p_user_id uuid,
  p_category text,
  p_lesson_id text,
  p_request_id uuid,
  p_units integer,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_paid boolean;
  v_admin_grant boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM billing.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.access_state IN ('paid_active', 'canceled_at_period_end')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ) INTO v_paid;

  SELECT (
    EXISTS (
      SELECT 1 FROM billing.admin_user_grant_state st
      WHERE st.user_id = p_user_id AND st.expires_at > now()
    )
    OR EXISTS (
      SELECT 1 FROM billing.admin_access_grants g
      WHERE g.user_id = p_user_id AND g.status = 'active' AND g.expires_at > now()
    )
  ) INTO v_admin_grant;

  IF NOT (v_paid OR v_admin_grant) THEN
    RAISE EXCEPTION 'AI_ACCESS_DENIED' USING ERRCODE = '42501';
  END IF;

  RETURN billing.reserve_ai_quota(
    p_user_id, p_category, p_lesson_id, p_request_id, p_units, p_idempotency_key
  );
END;
$$;

-- ============================================================================
-- DEFECT 1 (cont). Reservation root uses attempt_index = 0
-- ----------------------------------------------------------------------------
-- Re-create reserve_ai_quota so the reservation-of-record is attempt_index = 0,
-- leaving attempt_index >= 1 exclusively for durable provider-attempt rows.
-- ============================================================================

CREATE OR REPLACE FUNCTION billing.reserve_ai_quota(
  p_user_id uuid,
  p_category text,
  p_lesson_id text,
  p_request_id uuid,
  p_units integer,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_bucket text;
  v_existing billing.ai_usage_ledger%ROWTYPE;
  v_usage billing.entitlement_usage%ROWTYPE;
  v_reservation_id uuid := gen_random_uuid();
  v_period_key text;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_limit integer;
  v_projected integer;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_units IS NULL OR p_units <= 0 THEN
    RAISE EXCEPTION 'QUOTA_INVALID_UNITS' USING ERRCODE = '22023';
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(p_category);

  SELECT * INTO v_existing
  FROM billing.ai_usage_ledger
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'reservation_id', v_existing.reservation_id,
      'request_id', v_existing.request_id,
      'bucket', v_bucket,
      'status', v_existing.status,
      'idempotent_replay', true
    );
  END IF;

  v_period_key := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
  v_period_start := (date_trunc('month', now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC';
  v_period_end := ((date_trunc('month', now() AT TIME ZONE 'UTC')) + interval '1 month') AT TIME ZONE 'UTC';

  v_limit := billing.resolve_ai_assistant_limit(p_user_id);

  SELECT * INTO v_usage
  FROM billing.entitlement_usage
  WHERE user_id = p_user_id AND usage_category = v_bucket AND period_key = v_period_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO billing.entitlement_usage (
      user_id, usage_category, period_key, lesson_id,
      used_count, reserved_count, quota_limit, period_start, period_end
    ) VALUES (
      p_user_id, v_bucket, v_period_key, NULL,
      0, 0, v_limit, v_period_start, v_period_end
    )
    ON CONFLICT (user_id, usage_category, period_key) WHERE usage_category = 'ai_assistant'
    DO NOTHING;

    SELECT * INTO v_usage
    FROM billing.entitlement_usage
    WHERE user_id = p_user_id AND usage_category = v_bucket AND period_key = v_period_key
    FOR UPDATE;
  END IF;

  IF COALESCE(v_usage.quota_limit, -1) IS DISTINCT FROM v_limit THEN
    UPDATE billing.entitlement_usage
      SET quota_limit = v_limit, updated_at = now()
      WHERE id = v_usage.id;
    v_usage.quota_limit := v_limit;
  END IF;

  v_limit := COALESCE(v_usage.quota_limit, 0);
  v_projected := v_usage.used_count + v_usage.reserved_count + p_units;

  IF v_projected > v_limit THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED' USING ERRCODE = '22023';
  END IF;

  UPDATE billing.entitlement_usage
    SET reserved_count = reserved_count + p_units, updated_at = now()
    WHERE id = v_usage.id;

  INSERT INTO billing.ai_usage_ledger (
    user_id, usage_category, model_key, lesson_id, request_id, reservation_id,
    input_tokens, output_tokens, provider_cost_micro, billable, status,
    attempt_index, reserved_units, reservation_expires_at, idempotency_key, occurred_at
  ) VALUES (
    p_user_id, p_category, 'pending', p_lesson_id, p_request_id, v_reservation_id,
    0, 0, 0, true, 'reserved',
    0, p_units, now() + interval '5 minutes', p_idempotency_key, now()
  );

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'request_id', p_request_id,
    'bucket', v_bucket,
    'remaining', GREATEST(v_limit - v_projected, 0),
    'idempotent_replay', false
  );
END;
$$;

-- ============================================================================
-- RLS for the new tables
-- ============================================================================

ALTER TABLE billing.admin_grant_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.admin_user_grant_state ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON billing.admin_grant_policy_versions FROM anon, authenticated;
REVOKE ALL ON billing.admin_user_grant_state FROM anon, authenticated;

-- Policy versions are admin-readable.
GRANT SELECT ON billing.admin_grant_policy_versions TO authenticated;

CREATE POLICY billing_admin_grant_policy_admin_read ON billing.admin_grant_policy_versions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Canonical grant state: owner or admin read; no client writes.
GRANT SELECT ON billing.admin_user_grant_state TO authenticated;

CREATE POLICY billing_admin_user_grant_state_read ON billing.admin_user_grant_state
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- Function grants (REVOKE PUBLIC; GRANT to intended roles)
-- ============================================================================

-- Defect 1.
REVOKE ALL ON FUNCTION billing.register_provider_attempt(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.finalize_provider_attempt(uuid, integer, text, integer, integer, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.release_ai_quota(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.finalize_provider_attempt(uuid, integer, text, integer, integer, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION billing.release_ai_quota(uuid, text) TO service_role;

-- Defect 2.
REVOKE ALL ON FUNCTION billing.resolve_admin_grant_policy(timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.admin_grant_ai_assistant_limit() FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.publish_admin_grant_policy_version(integer, integer, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.resolve_admin_grant_policy(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION billing.admin_grant_ai_assistant_limit() TO service_role;
GRANT EXECUTE ON FUNCTION billing.publish_admin_grant_policy_version(integer, integer, text, timestamptz) TO authenticated, service_role;

-- Defect 3 / 4. Keep the EXECUTE grants, but the functions fail closed without a
-- real admin subject (bare service_role without auth.uid() is rejected).
REVOKE ALL ON FUNCTION billing.create_admin_access_coupon(uuid, text, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.redeem_admin_access_coupon(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.revoke_admin_access_grant(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.create_admin_access_coupon(uuid, text, text, text, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.redeem_admin_access_coupon(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.revoke_admin_access_grant(uuid, text) TO authenticated, service_role;

-- Defect 2 (cont).
REVOKE ALL ON FUNCTION billing.resolve_ai_assistant_limit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.evaluate_access(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.resolve_ai_assistant_limit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION billing.evaluate_access(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) TO service_role;

-- ============================================================================
-- End of Billing Launch Closure Contracts V3 — Corrective Refresh
-- ============================================================================
