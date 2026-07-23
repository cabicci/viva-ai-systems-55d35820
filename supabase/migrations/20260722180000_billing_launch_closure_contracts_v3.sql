-- ============================================================================
-- Billing Launch Closure Contracts V3
-- Migration: 20260722180000_billing_launch_closure_contracts_v3.sql
--
-- Additive / forward-safe hardening of the billing domain. This migration does
-- NOT modify any existing migration files and does NOT touch edge functions.
-- All new functions are SECURITY DEFINER with a pinned search_path and are
-- REVOKE'd from PUBLIC, then GRANT'd only to the intended roles.
--
-- Depends on:
--   * billing.is_service_role_caller()  (20260710153000_billing_service_role_auth_fix.sql)
--   * public.has_role(uuid, app_role)   (20260603221717_*.sql)
-- ============================================================================

-- ============================================================================
-- SECTION A. Abolish the automatic 14-day trial
-- ----------------------------------------------------------------------------
-- Contract: there is NO automatic 14-day trial. No RPC in this migration seeds
-- a free trial grant, and the seeded free entitlement policy (Section G) does
-- NOT include an automatic full-access window (assistant_runtime_period_days is
-- left NULL and quotas are 0). The marker function below is a hard guard that
-- callers/policies can invoke to assert the abolition contract.
-- ============================================================================

CREATE OR REPLACE FUNCTION billing.assert_no_automatic_trial(p_period_days integer DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = billing, public, pg_temp
AS $$
BEGIN
  -- V3 contract: a 14-day automatic trial grant is forbidden. Any attempt to
  -- provision an automatic 14-day full-access window must fail closed.
  IF p_period_days = 14 THEN
    RAISE EXCEPTION 'AUTOMATIC_TRIAL_FORBIDDEN: 14-day automatic trial grants are abolished under V3'
      USING ERRCODE = '22023';
  END IF;
END;
$$;

-- ============================================================================
-- SECTION B. Admin 72-hour access coupons
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing.admin_access_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  intended_user_id uuid NOT NULL,
  created_by_admin_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,                 -- optional coupon validity window
  redeemed_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT admin_access_coupons_status_check
    CHECK (status IN ('active', 'redeemed', 'revoked', 'expired'))
);

CREATE TABLE IF NOT EXISTS billing.admin_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_coupon_id uuid REFERENCES billing.admin_access_coupons (id),
  granted_by_admin_id uuid,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid,
  idempotency_key text NOT NULL UNIQUE,
  CONSTRAINT admin_access_grants_status_check
    CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_admin_access_grants_active_user
  ON billing.admin_access_grants (user_id)
  WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- B.1 create_admin_access_coupon
-- ----------------------------------------------------------------------------
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
  v_is_admin boolean := (v_admin IS NOT NULL AND public.has_role(v_admin, 'admin'::app_role));
  v_is_service boolean := billing.is_service_role_caller();
  v_existing billing.admin_access_coupons%ROWTYPE;
  v_created_by uuid;
  v_id uuid;
BEGIN
  IF NOT (v_is_admin OR v_is_service) THEN
    RAISE EXCEPTION 'ADMIN_COUPON_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_intended_user_id IS NULL
     OR p_reason IS NULL OR btrim(p_reason) = ''
     OR p_code_hash IS NULL OR btrim(p_code_hash) = ''
     OR p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'ADMIN_COUPON_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  -- Idempotent replay.
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

  -- created_by from auth.uid() when admin; service-role callers record the
  -- system sentinel (all-zero uuid) to satisfy the NOT NULL contract.
  v_created_by := COALESCE(v_admin, '00000000-0000-0000-0000-000000000000'::uuid);

  INSERT INTO billing.admin_access_coupons (
    code_hash, intended_user_id, created_by_admin_id, reason,
    status, expires_at, idempotency_key, metadata
  ) VALUES (
    p_code_hash, p_intended_user_id, v_created_by, p_reason,
    'active', p_valid_until, p_idempotency_key,
    jsonb_build_object('created_via', CASE WHEN v_is_admin THEN 'admin' ELSE 'service_role' END)
  )
  RETURNING id INTO v_id;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, after_state
  ) VALUES (
    CASE WHEN v_is_admin THEN 'user' ELSE 'service' END,
    COALESCE(v_admin::text, 'service_role'),
    'create_admin_access_coupon', 'admin_access_coupon', v_id,
    jsonb_build_object('intended_user_id', p_intended_user_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('coupon_id', v_id, 'status', 'active', 'idempotent_replay', false);
END;
$$;

-- ----------------------------------------------------------------------------
-- B.2 redeem_admin_access_coupon
--   Caller must be the intended user. Atomic: lock coupon FOR UPDATE, validate,
--   mark redeemed, and upsert/extend the access grant using
--   expires_at = GREATEST(now(), COALESCE(current_active_grant.expires_at, now())) + 72h.
--   Never modifies subscription paid-period fields. Full rollback on failure.
-- ----------------------------------------------------------------------------
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
  v_current_active billing.admin_access_grants%ROWTYPE;
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

  -- Idempotent replay: a grant already exists for this idempotency key.
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

  -- Lazy expiry of the coupon validity window.
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    UPDATE billing.admin_access_coupons
      SET status = 'expired'
      WHERE id = v_coupon.id AND status = 'active';
    RAISE EXCEPTION 'ADMIN_COUPON_EXPIRED' USING ERRCODE = '22023';
  END IF;

  IF v_coupon.status <> 'active' THEN
    RAISE EXCEPTION 'ADMIN_COUPON_NOT_ACTIVE' USING ERRCODE = '22023';
  END IF;

  -- Consume the coupon.
  UPDATE billing.admin_access_coupons
    SET status = 'redeemed', redeemed_at = now()
    WHERE id = v_coupon.id;

  -- Extend from the current effective active grant (lock it if present).
  SELECT * INTO v_current_active
  FROM billing.admin_access_grants
  WHERE user_id = v_caller
    AND status = 'active'
    AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1
  FOR UPDATE;

  v_new_expires := GREATEST(now(), COALESCE(v_current_active.expires_at, now())) + interval '72 hours';

  INSERT INTO billing.admin_access_grants (
    user_id, source_coupon_id, granted_by_admin_id,
    starts_at, expires_at, status, idempotency_key
  ) VALUES (
    v_caller, v_coupon.id, v_coupon.created_by_admin_id,
    now(), v_new_expires, 'active', p_idempotency_key
  )
  RETURNING id INTO v_grant_id;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, after_state
  ) VALUES (
    'user', v_caller::text,
    'redeem_admin_access_coupon', 'admin_access_grant', v_grant_id,
    jsonb_build_object('source_coupon_id', v_coupon.id, 'expires_at', v_new_expires)
  );

  RETURN jsonb_build_object(
    'grant_id', v_grant_id,
    'expires_at', v_new_expires,
    'idempotent_replay', false
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- B.3 revoke helpers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION billing.revoke_admin_access_coupon(
  p_coupon_id uuid,
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
  v_coupon billing.admin_access_coupons%ROWTYPE;
BEGIN
  IF NOT (v_is_admin OR v_is_service) THEN
    RAISE EXCEPTION 'ADMIN_COUPON_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_coupon
  FROM billing.admin_access_coupons
  WHERE id = p_coupon_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ADMIN_COUPON_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_coupon.status = 'revoked' THEN
    RETURN jsonb_build_object('coupon_id', p_coupon_id, 'status', 'revoked', 'idempotent_replay', true);
  END IF;

  UPDATE billing.admin_access_coupons
    SET status = 'revoked',
        revoked_at = now(),
        revoked_by = v_admin,
        metadata = metadata || jsonb_build_object('revoke_reason', p_reason)
    WHERE id = p_coupon_id;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, before_state, after_state
  ) VALUES (
    CASE WHEN v_is_admin THEN 'user' ELSE 'service' END,
    COALESCE(v_admin::text, 'service_role'),
    'revoke_admin_access_coupon', 'admin_access_coupon', p_coupon_id,
    jsonb_build_object('status', v_coupon.status),
    jsonb_build_object('status', 'revoked', 'reason', p_reason)
  );

  RETURN jsonb_build_object('coupon_id', p_coupon_id, 'status', 'revoked', 'idempotent_replay', false);
END;
$$;

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
-- SECTION C. Purchase-discount coupons (separate type from admin access)
-- ============================================================================

ALTER TABLE billing.coupon_definitions
  ADD COLUMN IF NOT EXISTS coupon_kind text NOT NULL DEFAULT 'purchase_discount';

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coupon_definitions_kind_check'
  ) THEN
    ALTER TABLE billing.coupon_definitions
      ADD CONSTRAINT coupon_definitions_kind_check
      CHECK (coupon_kind IN ('purchase_discount', 'admin_access'));
  END IF;
END
$do$;

CREATE TABLE IF NOT EXISTS billing.purchase_coupon_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_definition_id uuid NOT NULL REFERENCES billing.coupon_definitions (id),
  user_id uuid NOT NULL,
  checkout_id text,
  status text NOT NULL DEFAULT 'reserved',
  reserved_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  released_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_coupon_reservations_status_check
    CHECK (status IN ('reserved', 'consumed', 'released'))
);

CREATE INDEX IF NOT EXISTS idx_purchase_coupon_reservations_coupon
  ON billing.purchase_coupon_reservations (coupon_definition_id, status);

-- ----------------------------------------------------------------------------
-- C.1 reserve_purchase_coupon
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION billing.reserve_purchase_coupon(
  p_coupon_definition_id uuid,
  p_user_id uuid,
  p_checkout_id text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_def billing.coupon_definitions%ROWTYPE;
  v_existing billing.purchase_coupon_reservations%ROWTYPE;
  v_used integer;
  v_id uuid;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_coupon_definition_id IS NULL OR p_user_id IS NULL
     OR p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing
  FROM billing.purchase_coupon_reservations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'reservation_id', v_existing.id,
      'status', v_existing.status,
      'idempotent_replay', true
    );
  END IF;

  SELECT * INTO v_def
  FROM billing.coupon_definitions
  WHERE id = p_coupon_definition_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_def.coupon_kind <> 'purchase_discount' THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_WRONG_KIND' USING ERRCODE = '22023';
  END IF;

  IF v_def.status <> 'active' THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_NOT_ACTIVE' USING ERRCODE = '22023';
  END IF;

  IF now() < v_def.valid_from OR now() > v_def.valid_to THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_OUT_OF_WINDOW' USING ERRCODE = '22023';
  END IF;

  IF v_def.max_redemptions IS NOT NULL THEN
    SELECT count(*) INTO v_used
    FROM billing.purchase_coupon_reservations
    WHERE coupon_definition_id = p_coupon_definition_id
      AND status IN ('reserved', 'consumed');

    IF v_used >= v_def.max_redemptions THEN
      RAISE EXCEPTION 'PURCHASE_COUPON_EXHAUSTED' USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO billing.purchase_coupon_reservations (
    coupon_definition_id, user_id, checkout_id, status, idempotency_key
  ) VALUES (
    p_coupon_definition_id, p_user_id, p_checkout_id, 'reserved', p_idempotency_key
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('reservation_id', v_id, 'status', 'reserved', 'idempotent_replay', false);
END;
$$;

-- ----------------------------------------------------------------------------
-- C.2 consume_purchase_coupon (payment success only)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION billing.consume_purchase_coupon(
  p_reservation_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_res billing.purchase_coupon_reservations%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_res
  FROM billing.purchase_coupon_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_res.status = 'consumed' THEN
    RETURN jsonb_build_object('reservation_id', p_reservation_id, 'status', 'consumed', 'idempotent_replay', true);
  END IF;

  IF v_res.status = 'released' THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_ALREADY_RELEASED' USING ERRCODE = '22023';
  END IF;

  UPDATE billing.purchase_coupon_reservations
    SET status = 'consumed', consumed_at = now()
    WHERE id = p_reservation_id;

  RETURN jsonb_build_object('reservation_id', p_reservation_id, 'status', 'consumed', 'idempotent_replay', false);
END;
$$;

-- ----------------------------------------------------------------------------
-- C.3 release_purchase_coupon
--   Only a reserved (never consumed) reservation may be released. Refunds must
--   NOT auto-reactivate a consumed coupon.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION billing.release_purchase_coupon(
  p_reservation_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_res billing.purchase_coupon_reservations%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_res
  FROM billing.purchase_coupon_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PURCHASE_COUPON_RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_res.status = 'released' THEN
    RETURN jsonb_build_object('reservation_id', p_reservation_id, 'status', 'released', 'idempotent_replay', true);
  END IF;

  IF v_res.status = 'consumed' THEN
    -- No auto-reactivation on refund.
    RAISE EXCEPTION 'PURCHASE_COUPON_CANNOT_RELEASE_CONSUMED' USING ERRCODE = '22023';
  END IF;

  UPDATE billing.purchase_coupon_reservations
    SET status = 'released', released_at = now()
    WHERE id = p_reservation_id;

  RETURN jsonb_build_object('reservation_id', p_reservation_id, 'status', 'released', 'idempotent_replay', false);
END;
$$;

-- ============================================================================
-- SECTION D. Canonical AI quota + atomic reserve
-- ============================================================================

-- D.1 Expand entitlement_usage category CHECK to add the canonical 'ai_assistant'
--     bucket while keeping legacy values for compatibility.
ALTER TABLE billing.entitlement_usage
  DROP CONSTRAINT IF EXISTS entitlement_usage_category_check;

ALTER TABLE billing.entitlement_usage
  ADD CONSTRAINT entitlement_usage_category_check CHECK (
    usage_category IN ('assistant_runtime_general', 'assistant_runtime_per_lesson', 'ai_assistant')
  );

-- D.2 Canonical bucket identity: one row per (user, period). lesson_id is NULL
--     for canonical rows so the legacy 4-column unique never applies to them.
ALTER TABLE billing.entitlement_usage
  ADD COLUMN IF NOT EXISTS quota_limit integer;

CREATE UNIQUE INDEX IF NOT EXISTS entitlement_usage_canonical_unique
  ON billing.entitlement_usage (user_id, usage_category, period_key)
  WHERE usage_category = 'ai_assistant';

-- D.3 Extend ai_usage_ledger with provider attempt tracking and new identity.
ALTER TABLE billing.ai_usage_ledger ADD COLUMN IF NOT EXISTS attempt_index integer NOT NULL DEFAULT 1;
ALTER TABLE billing.ai_usage_ledger ADD COLUMN IF NOT EXISTS reserved_units integer NOT NULL DEFAULT 1;
ALTER TABLE billing.ai_usage_ledger ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE billing.ai_usage_ledger ADD COLUMN IF NOT EXISTS provider_request_id text;
ALTER TABLE billing.ai_usage_ledger ADD COLUMN IF NOT EXISTS provider_started_at timestamptz;
ALTER TABLE billing.ai_usage_ledger ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;

ALTER TABLE billing.ai_usage_ledger
  DROP CONSTRAINT IF EXISTS ai_usage_ledger_request_category_unique;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_ledger_request_cat_attempt_unique'
  ) THEN
    ALTER TABLE billing.ai_usage_ledger
      ADD CONSTRAINT ai_usage_ledger_request_cat_attempt_unique
      UNIQUE (request_id, usage_category, attempt_index);
  END IF;
END
$do$;

CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_ledger_provider_request_unique
  ON billing.ai_usage_ledger (provider, provider_request_id)
  WHERE provider_request_id IS NOT NULL;

ALTER TABLE billing.ai_usage_ledger
  DROP CONSTRAINT IF EXISTS ai_usage_ledger_status_check;

ALTER TABLE billing.ai_usage_ledger
  ADD CONSTRAINT ai_usage_ledger_status_check CHECK (
    status IN ('reserved', 'committed', 'released', 'failed', 'stale_reconciled')
  );

-- D.4 Category -> canonical quota bucket mapping. Embeddings is unsupported.
CREATE OR REPLACE FUNCTION billing.map_ledger_category_to_quota_bucket(p_category text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = billing, public, pg_temp
AS $$
BEGIN
  IF p_category IN ('assistant_runtime', 'mission_evaluation', 'reveal_answer', 'wow_path') THEN
    RETURN 'ai_assistant';
  END IF;
  RAISE EXCEPTION 'QUOTA_CATEGORY_UNSUPPORTED: %', p_category USING ERRCODE = '22023';
END;
$$;

-- D.5 Default AI-assistant limit for admin-granted (non-paid) access windows.
CREATE OR REPLACE FUNCTION billing.admin_grant_ai_assistant_limit()
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = billing, public, pg_temp
AS $$
  SELECT 500;
$$;

-- D.6 Resolve the effective AI-assistant quota limit for a user (fail closed).
CREATE OR REPLACE FUNCTION billing.resolve_ai_assistant_limit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_paid_limit integer;
  v_has_admin_grant boolean;
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

  SELECT EXISTS (
    SELECT 1 FROM billing.admin_access_grants g
    WHERE g.user_id = p_user_id AND g.status = 'active' AND g.expires_at > now()
  ) INTO v_has_admin_grant;

  IF v_has_admin_grant THEN
    RETURN billing.admin_grant_ai_assistant_limit();
  END IF;

  -- Fail closed: no paid plan and no active admin grant means no AI quota.
  RETURN 0;
END;
$$;

-- D.7 reserve_ai_quota (canonical, atomic, idempotent).
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

  -- Map to canonical bucket (raises for unsupported categories).
  v_bucket := billing.map_ledger_category_to_quota_bucket(p_category);

  -- Idempotent replay by idempotency key.
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

  -- Canonical monthly period (UTC).
  v_period_key := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
  v_period_start := (date_trunc('month', now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC';
  v_period_end := ((date_trunc('month', now() AT TIME ZONE 'UTC')) + interval '1 month') AT TIME ZONE 'UTC';

  v_limit := billing.resolve_ai_assistant_limit(p_user_id);

  -- Lock existing usage row or create it (canonical rows use lesson_id NULL).
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

  -- Refresh the stored limit to the latest resolved value.
  IF COALESCE(v_usage.quota_limit, -1) IS DISTINCT FROM v_limit THEN
    UPDATE billing.entitlement_usage
      SET quota_limit = v_limit, updated_at = now()
      WHERE id = v_usage.id;
    v_usage.quota_limit := v_limit;
  END IF;

  v_limit := COALESCE(v_usage.quota_limit, 0);
  v_projected := v_usage.used_count + v_usage.reserved_count + p_units;

  IF v_projected > v_limit THEN
    -- Fail closed: no capacity (includes the no-entitlement limit=0 case).
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
    1, p_units, now() + interval '5 minutes', p_idempotency_key, now()
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

-- D.8 register_provider_attempt: marks provider start and commits the logical
--     quota unit exactly once (reserved -> used).
CREATE OR REPLACE FUNCTION billing.register_provider_attempt(
  p_reservation_id uuid,
  p_attempt_index integer,
  p_provider text,
  p_provider_request_id text
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
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_led
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id AND attempt_index = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_led.status IN ('released', 'stale_reconciled') THEN
    RAISE EXCEPTION 'RESERVATION_NOT_ACTIVE' USING ERRCODE = '22023';
  END IF;

  -- Idempotent: provider already registered for this reservation.
  IF v_led.provider_started_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'reservation_id', p_reservation_id,
      'provider_started_at', v_led.provider_started_at,
      'already_started', true
    );
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_led.usage_category);
  v_period_key := to_char((v_led.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');

  UPDATE billing.ai_usage_ledger
    SET provider = p_provider,
        provider_request_id = p_provider_request_id,
        provider_started_at = now(),
        status = CASE WHEN status = 'reserved' THEN 'committed' ELSE status END,
        metadata = metadata || jsonb_build_object('last_attempt_index', p_attempt_index),
        occurred_at = occurred_at
    WHERE reservation_id = p_reservation_id AND attempt_index = 1;

  -- Commit the logical quota unit(s) exactly once (only from reserved).
  IF v_led.status = 'reserved' THEN
    UPDATE billing.entitlement_usage
      SET used_count = used_count + v_led.reserved_units,
          reserved_count = GREATEST(reserved_count - v_led.reserved_units, 0),
          updated_at = now()
      WHERE user_id = v_led.user_id
        AND usage_category = v_bucket
        AND period_key = v_period_key;
  END IF;

  RETURN jsonb_build_object(
    'reservation_id', p_reservation_id,
    'provider_started_at', now(),
    'committed', true,
    'already_started', false
  );
END;
$$;

-- D.9 commit_ai_quota: idempotent; commits the logical unit once; cannot commit
--     a released reservation.
CREATE OR REPLACE FUNCTION billing.commit_ai_quota(
  p_reservation_id uuid,
  p_input_tokens integer,
  p_output_tokens integer,
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
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_led
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id AND attempt_index = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_led.status IN ('released', 'stale_reconciled') THEN
    RAISE EXCEPTION 'CANNOT_COMMIT_RELEASED' USING ERRCODE = '22023';
  END IF;

  -- Already committed: idempotent token update, no counter movement.
  IF v_led.status = 'committed' THEN
    UPDATE billing.ai_usage_ledger
      SET input_tokens = p_input_tokens,
          output_tokens = p_output_tokens
      WHERE reservation_id = p_reservation_id AND attempt_index = 1;
    RETURN jsonb_build_object('committed', true, 'idempotent_replay', true);
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_led.usage_category);
  v_period_key := to_char((v_led.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');

  UPDATE billing.ai_usage_ledger
    SET status = 'committed',
        input_tokens = p_input_tokens,
        output_tokens = p_output_tokens,
        provider_started_at = COALESCE(provider_started_at, now())
    WHERE reservation_id = p_reservation_id AND attempt_index = 1;

  UPDATE billing.entitlement_usage
    SET used_count = used_count + v_led.reserved_units,
        reserved_count = GREATEST(reserved_count - v_led.reserved_units, 0),
        updated_at = now()
    WHERE user_id = v_led.user_id
      AND usage_category = v_bucket
      AND period_key = v_period_key;

  RETURN jsonb_build_object('committed', true, 'idempotent_replay', false);
END;
$$;

-- D.10 release_ai_quota: only if still reserved and no provider attempt started.
--      The legacy variant returned void; drop it so the return type can change.
DROP FUNCTION IF EXISTS billing.release_ai_quota(uuid, text);

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
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_led
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id AND attempt_index = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotent replay.
  IF v_led.status = 'released' THEN
    RETURN jsonb_build_object('released', true, 'idempotent_replay', true);
  END IF;

  IF v_led.status = 'committed' OR v_led.provider_started_at IS NOT NULL THEN
    RAISE EXCEPTION 'CANNOT_RELEASE_STARTED' USING ERRCODE = '22023';
  END IF;

  IF v_led.status <> 'reserved' THEN
    RAISE EXCEPTION 'RESERVATION_NOT_RELEASABLE' USING ERRCODE = '22023';
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_led.usage_category);
  v_period_key := to_char((v_led.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');

  UPDATE billing.ai_usage_ledger
    SET status = 'released', occurred_at = occurred_at
    WHERE reservation_id = p_reservation_id AND attempt_index = 1;

  UPDATE billing.entitlement_usage
    SET reserved_count = GREATEST(reserved_count - v_led.reserved_units, 0),
        updated_at = now()
    WHERE user_id = v_led.user_id
      AND usage_category = v_bucket
      AND period_key = v_period_key;

  RETURN jsonb_build_object('released', true, 'idempotent_replay', false);
END;
$$;

-- D.11 reconcile_stale_ai_reservation: deterministic; never releases if the
--      provider began. Expired unstarted reservations are reconciled; started
--      reservations that never committed are committed.
CREATE OR REPLACE FUNCTION billing.reconcile_stale_ai_reservation(p_reservation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_led billing.ai_usage_ledger%ROWTYPE;
  v_bucket text;
  v_period_key text;
  v_action text;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_led
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id AND attempt_index = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_led.usage_category);
  v_period_key := to_char((v_led.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');

  IF v_led.status <> 'reserved' THEN
    -- Already terminal; nothing to reconcile.
    RETURN jsonb_build_object('reservation_id', p_reservation_id, 'action', 'noop', 'status', v_led.status);
  END IF;

  IF v_led.provider_started_at IS NOT NULL THEN
    -- Provider began: commit rather than release.
    UPDATE billing.ai_usage_ledger
      SET status = 'committed'
      WHERE reservation_id = p_reservation_id AND attempt_index = 1;

    UPDATE billing.entitlement_usage
      SET used_count = used_count + v_led.reserved_units,
          reserved_count = GREATEST(reserved_count - v_led.reserved_units, 0),
          updated_at = now()
      WHERE user_id = v_led.user_id
        AND usage_category = v_bucket
        AND period_key = v_period_key;

    v_action := 'committed';
  ELSIF v_led.reservation_expires_at IS NOT NULL AND v_led.reservation_expires_at < now() THEN
    -- Unstarted and expired: reconcile as stale and free the reserved units.
    UPDATE billing.ai_usage_ledger
      SET status = 'stale_reconciled'
      WHERE reservation_id = p_reservation_id AND attempt_index = 1;

    UPDATE billing.entitlement_usage
      SET reserved_count = GREATEST(reserved_count - v_led.reserved_units, 0),
          updated_at = now()
      WHERE user_id = v_led.user_id
        AND usage_category = v_bucket
        AND period_key = v_period_key;

    v_action := 'stale_reconciled';
  ELSE
    -- Reserved, not started, not expired yet: leave untouched.
    v_action := 'noop';
  END IF;

  RETURN jsonb_build_object('reservation_id', p_reservation_id, 'action', v_action);
END;
$$;

-- D.12 reserve_learner_ai_access: Chat-4-facing wrapper. Verifies paid OR active
--      admin grant before reserving; fails closed otherwise.
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

  SELECT EXISTS (
    SELECT 1 FROM billing.admin_access_grants g
    WHERE g.user_id = p_user_id AND g.status = 'active' AND g.expires_at > now()
  ) INTO v_admin_grant;

  IF NOT (v_paid OR v_admin_grant) THEN
    -- Fail closed: no paid access and no active admin grant.
    RAISE EXCEPTION 'AI_ACCESS_DENIED' USING ERRCODE = '42501';
  END IF;

  RETURN billing.reserve_ai_quota(
    p_user_id, p_category, p_lesson_id, p_request_id, p_units, p_idempotency_key
  );
END;
$$;

-- ============================================================================
-- SECTION E. Refunds
-- ============================================================================

-- E.1 Payment snapshot columns (additive; existing amount_minor / tax_amount_minor
--     are retained; gross_minor / tax_minor mirror them when populated).
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS plan_key text;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS plan_version_id uuid;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS market_price_id uuid;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS market_code text;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS billing_interval text;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS base_price_minor bigint;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS discount_minor bigint;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS tax_rule_version_id uuid;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS pretax_minor bigint;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS tax_minor bigint;
ALTER TABLE billing.payment_transactions ADD COLUMN IF NOT EXISTS gross_minor bigint;

-- E.2 Refund status lifecycle constraint.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refunds_status_check'
  ) THEN
    ALTER TABLE billing.refunds
      ADD CONSTRAINT refunds_status_check
      CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled'));
  END IF;
END
$do$;

-- E.3 authorize_refund
CREATE OR REPLACE FUNCTION billing.authorize_refund(
  p_payment_transaction_id uuid,
  p_amount_minor bigint,
  p_idempotency_key text,
  p_reason_code text,
  p_refund_type text
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
  v_pt billing.payment_transactions%ROWTYPE;
  v_existing billing.refunds%ROWTYPE;
  v_gross bigint;
  v_already bigint;
  v_remaining bigint;
  v_total_tax bigint;
  v_tax_already bigint;
  v_tax_alloc bigint;
  v_is_full boolean;
  v_refund_id uuid;
BEGIN
  IF NOT (v_is_admin OR v_is_service) THEN
    RAISE EXCEPTION 'REFUND_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_amount_minor IS NULL OR p_amount_minor <= 0 THEN
    RAISE EXCEPTION 'REFUND_INVALID_AMOUNT' USING ERRCODE = '22023';
  END IF;

  IF p_refund_type NOT IN ('subscription', 'monetary_credit_auto', 'manual', 'annual_to_monthly') THEN
    RAISE EXCEPTION 'REFUND_INVALID_TYPE' USING ERRCODE = '22023';
  END IF;

  -- Idempotent replay.
  SELECT * INTO v_existing
  FROM billing.refunds
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'refund_id', v_existing.id,
      'status', v_existing.status,
      'amount_minor', v_existing.amount_minor,
      'idempotent_replay', true
    );
  END IF;

  -- Lock the payment row.
  SELECT * INTO v_pt
  FROM billing.payment_transactions
  WHERE id = p_payment_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  v_gross := COALESCE(v_pt.gross_minor, v_pt.amount_minor);
  v_total_tax := COALESCE(v_pt.tax_minor, v_pt.tax_amount_minor, 0);

  -- Sum of refunds that hold value against this charge.
  SELECT COALESCE(SUM(amount_minor), 0) INTO v_already
  FROM billing.refunds
  WHERE payment_transaction_id = p_payment_transaction_id
    AND status IN ('pending', 'processing', 'succeeded');

  v_remaining := v_gross - v_already;

  IF p_amount_minor > v_remaining THEN
    RAISE EXCEPTION 'REFUND_EXCEEDS_REMAINING' USING ERRCODE = '22023';
  END IF;

  v_is_full := (p_amount_minor = v_remaining);

  -- Tax already allocated to prior refunds of this charge.
  SELECT COALESCE(SUM(COALESCE((metadata ->> 'tax_allocated_minor')::bigint, 0)), 0)
    INTO v_tax_already
  FROM billing.refunds
  WHERE payment_transaction_id = p_payment_transaction_id
    AND status IN ('pending', 'processing', 'succeeded');

  IF v_is_full THEN
    -- Remainder of tax goes on the final refund.
    v_tax_alloc := v_total_tax - v_tax_already;
  ELSIF v_gross > 0 THEN
    v_tax_alloc := (v_total_tax * p_amount_minor) / v_gross;  -- integer proportional
  ELSE
    v_tax_alloc := 0;
  END IF;

  IF v_tax_alloc < 0 THEN
    v_tax_alloc := 0;
  END IF;

  INSERT INTO billing.refunds (
    payment_transaction_id, refund_type, status, amount_minor, currency_code,
    reason_code, gateway_code, approved_by, idempotency_key, requested_at, metadata
  ) VALUES (
    p_payment_transaction_id, p_refund_type, 'pending', p_amount_minor, v_pt.currency_code,
    p_reason_code, v_pt.gateway_code, v_admin, p_idempotency_key, now(),
    jsonb_build_object(
      'tax_allocated_minor', v_tax_alloc,
      'is_full_refund', v_is_full,
      'gross_minor', v_gross
    )
  )
  RETURNING id INTO v_refund_id;

  -- Full refund: move the charge's subscription toward refund_pending. Never
  -- reactivates coupons.
  IF v_is_full AND v_pt.subscription_id IS NOT NULL THEN
    UPDATE billing.subscriptions
      SET access_state = 'refund_pending', updated_at = now()
      WHERE id = v_pt.subscription_id
        AND access_state NOT IN ('refunded', 'expired');
  END IF;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, after_state
  ) VALUES (
    CASE WHEN v_is_admin THEN 'user' ELSE 'service' END,
    COALESCE(v_admin::text, 'service_role'),
    'authorize_refund', 'refund', v_refund_id,
    jsonb_build_object(
      'amount_minor', p_amount_minor,
      'tax_allocated_minor', v_tax_alloc,
      'is_full_refund', v_is_full,
      'payment_transaction_id', p_payment_transaction_id
    )
  );

  RETURN jsonb_build_object(
    'refund_id', v_refund_id,
    'amount_minor', p_amount_minor,
    'tax_allocated_minor', v_tax_alloc,
    'remaining_after_minor', v_remaining - p_amount_minor,
    'is_full_refund', v_is_full,
    'status', 'pending',
    'idempotent_replay', false
  );
END;
$$;

-- ============================================================================
-- SECTION F. Subscription apply_subscription_event (transition matrix)
-- ============================================================================

-- F.1 Ordering / provenance columns for stale + duplicate detection.
ALTER TABLE billing.subscriptions ADD COLUMN IF NOT EXISTS last_applied_effective_at timestamptz;
ALTER TABLE billing.subscriptions ADD COLUMN IF NOT EXISTS last_applied_sequence bigint;
ALTER TABLE billing.subscriptions ADD COLUMN IF NOT EXISTS last_applied_provider text;
ALTER TABLE billing.subscriptions ADD COLUMN IF NOT EXISTS last_applied_event_id text;

ALTER TABLE billing.subscription_events ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE billing.subscription_events ADD COLUMN IF NOT EXISTS provider_event_id text;
ALTER TABLE billing.subscription_events ADD COLUMN IF NOT EXISTS effective_at timestamptz;
ALTER TABLE billing.subscription_events ADD COLUMN IF NOT EXISTS provider_sequence bigint;
ALTER TABLE billing.subscription_events ADD COLUMN IF NOT EXISTS processing_status text;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_events_processing_status_check'
  ) THEN
    ALTER TABLE billing.subscription_events
      ADD CONSTRAINT subscription_events_processing_status_check
      CHECK (processing_status IS NULL OR processing_status IN ('applied', 'duplicate', 'stale', 'rejected'));
  END IF;
END
$do$;

CREATE UNIQUE INDEX IF NOT EXISTS subscription_events_provider_event_unique
  ON billing.subscription_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- F.2 Deterministic transition matrix (mirrors the TS state machine).
CREATE OR REPLACE FUNCTION billing.subscription_next_access_state(
  p_from text,
  p_event_type text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = billing, public, pg_temp
AS $$
  SELECT CASE
    WHEN p_event_type = 'payment_succeeded'
      AND p_from IN ('free_pending_verification', 'free_active', 'free_expired', 'paid_scheduled', 'past_due', 'paid_active')
      THEN 'paid_active'
    WHEN p_event_type = 'activation_scheduled'
      AND p_from IN ('free_pending_verification', 'free_active', 'free_expired')
      THEN 'paid_scheduled'
    WHEN p_event_type = 'activated'
      AND p_from IN ('paid_scheduled')
      THEN 'paid_active'
    WHEN p_event_type = 'payment_failed'
      AND p_from IN ('paid_active', 'paid_scheduled')
      THEN 'past_due'
    WHEN p_event_type = 'cancel_at_period_end'
      AND p_from IN ('paid_active', 'past_due')
      THEN 'canceled_at_period_end'
    WHEN p_event_type = 'canceled'
      AND p_from IN ('paid_active', 'paid_scheduled', 'past_due', 'canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'period_ended'
      AND p_from IN ('canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'period_ended'
      AND p_from IN ('paid_active')
      THEN 'paid_active'
    WHEN p_event_type = 'expired'
      AND p_from IN ('paid_active', 'paid_scheduled', 'past_due', 'canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'suspended'
      AND p_from IN ('paid_active', 'past_due')
      THEN 'suspended'
    WHEN p_event_type = 'resumed'
      AND p_from IN ('suspended')
      THEN 'paid_active'
    WHEN p_event_type = 'refund_pending'
      AND p_from IN ('paid_active', 'past_due', 'canceled_at_period_end', 'suspended')
      THEN 'refund_pending'
    WHEN p_event_type = 'refunded'
      AND p_from IN ('refund_pending', 'paid_active', 'past_due', 'canceled_at_period_end', 'suspended')
      THEN 'refunded'
    ELSE NULL
  END;
$$;

-- F.3 apply_subscription_event (new provider-aware signature).
--     The legacy 4-argument variant is dropped and replaced.
DROP FUNCTION IF EXISTS billing.apply_subscription_event(uuid, text, jsonb, text);

CREATE OR REPLACE FUNCTION billing.apply_subscription_event(
  p_subscription_id uuid,
  p_provider text,
  p_provider_event_id text,
  p_effective_at timestamptz,
  p_provider_sequence bigint,
  p_event_type text,
  p_payload jsonb,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_sub billing.subscriptions%ROWTYPE;
  v_existing billing.subscription_events%ROWTYPE;
  v_dup billing.subscription_events%ROWTYPE;
  v_target text;
  v_source text := CASE WHEN p_provider IS NOT NULL THEN 'gateway_webhook' ELSE 'system' END;
  v_stale boolean := false;
  v_event_id uuid;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EVENT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  -- Idempotent replay by idempotency key.
  SELECT * INTO v_existing
  FROM billing.subscription_events
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'event_id', v_existing.id,
      'processing_status', COALESCE(v_existing.processing_status, 'applied'),
      'idempotent_replay', true
    );
  END IF;

  -- Lock the subscription for the duration of the transaction.
  SELECT * INTO v_sub
  FROM billing.subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Duplicate provider event detection (same provider + provider_event_id).
  IF p_provider_event_id IS NOT NULL THEN
    SELECT * INTO v_dup
    FROM billing.subscription_events
    WHERE provider = p_provider AND provider_event_id = p_provider_event_id
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'event_id', v_dup.id,
        'processing_status', 'duplicate',
        'idempotent_replay', true
      );
    END IF;
  END IF;

  -- Ambiguous ordering (neither sequence nor effective_at) -> fail closed.
  IF p_effective_at IS NULL AND p_provider_sequence IS NULL THEN
    INSERT INTO billing.subscription_events (
      subscription_id, event_type, payload, idempotency_key, occurred_at, source,
      provider, provider_event_id, effective_at, provider_sequence, processing_status
    ) VALUES (
      p_subscription_id, p_event_type, COALESCE(p_payload, '{}'::jsonb), p_idempotency_key, now(), v_source,
      p_provider, p_provider_event_id, p_effective_at, p_provider_sequence, 'rejected'
    )
    RETURNING id INTO v_event_id;

    RETURN jsonb_build_object('event_id', v_event_id, 'processing_status', 'rejected', 'reason', 'AMBIGUOUS_ORDERING');
  END IF;

  -- Stale detection: effective_at older OR sequence not newer than last applied.
  IF p_provider_sequence IS NOT NULL AND v_sub.last_applied_sequence IS NOT NULL
     AND p_provider_sequence <= v_sub.last_applied_sequence THEN
    v_stale := true;
  END IF;

  IF p_effective_at IS NOT NULL AND v_sub.last_applied_effective_at IS NOT NULL
     AND p_effective_at < v_sub.last_applied_effective_at THEN
    v_stale := true;
  END IF;

  IF v_stale THEN
    INSERT INTO billing.subscription_events (
      subscription_id, event_type, payload, idempotency_key, occurred_at, source,
      provider, provider_event_id, effective_at, provider_sequence, processing_status
    ) VALUES (
      p_subscription_id, p_event_type, COALESCE(p_payload, '{}'::jsonb),
      p_idempotency_key, COALESCE(p_effective_at, now()), v_source,
      p_provider, p_provider_event_id, p_effective_at, p_provider_sequence, 'stale'
    )
    RETURNING id INTO v_event_id;

    RETURN jsonb_build_object('event_id', v_event_id, 'processing_status', 'stale');
  END IF;

  -- Validate transition.
  v_target := billing.subscription_next_access_state(v_sub.access_state, p_event_type);

  IF v_target IS NULL THEN
    INSERT INTO billing.subscription_events (
      subscription_id, event_type, from_access_state, to_access_state, payload,
      idempotency_key, occurred_at, source,
      provider, provider_event_id, effective_at, provider_sequence, processing_status
    ) VALUES (
      p_subscription_id, p_event_type, v_sub.access_state, NULL, COALESCE(p_payload, '{}'::jsonb),
      p_idempotency_key, COALESCE(p_effective_at, now()), v_source,
      p_provider, p_provider_event_id, p_effective_at, p_provider_sequence, 'rejected'
    )
    RETURNING id INTO v_event_id;

    RETURN jsonb_build_object(
      'event_id', v_event_id,
      'processing_status', 'rejected',
      'reason', 'INVALID_TRANSITION',
      'from_access_state', v_sub.access_state
    );
  END IF;

  -- Apply the transition and advance ordering markers.
  UPDATE billing.subscriptions
    SET access_state = v_target,
        paid_activation_at = CASE WHEN v_target = 'paid_active' THEN COALESCE(paid_activation_at, now()) ELSE paid_activation_at END,
        entitlement_active_at = CASE WHEN v_target = 'paid_active' THEN COALESCE(entitlement_active_at, now()) ELSE entitlement_active_at END,
        payment_succeeded_at = CASE WHEN p_event_type = 'payment_succeeded' THEN now() ELSE payment_succeeded_at END,
        canceled_at = CASE WHEN v_target IN ('canceled_at_period_end', 'expired') THEN COALESCE(canceled_at, now()) ELSE canceled_at END,
        expired_at = CASE WHEN v_target = 'expired' THEN COALESCE(expired_at, now()) ELSE expired_at END,
        suspended_at = CASE WHEN v_target = 'suspended' THEN COALESCE(suspended_at, now()) ELSE suspended_at END,
        cancel_at_period_end = CASE WHEN v_target = 'canceled_at_period_end' THEN true ELSE cancel_at_period_end END,
        last_applied_effective_at = COALESCE(p_effective_at, last_applied_effective_at),
        last_applied_sequence = COALESCE(p_provider_sequence, last_applied_sequence),
        last_applied_provider = COALESCE(p_provider, last_applied_provider),
        last_applied_event_id = COALESCE(p_provider_event_id, last_applied_event_id),
        updated_at = now()
    WHERE id = p_subscription_id;

  INSERT INTO billing.subscription_events (
    subscription_id, event_type, from_access_state, to_access_state, payload,
    idempotency_key, occurred_at, source,
    provider, provider_event_id, effective_at, provider_sequence, processing_status
  ) VALUES (
    p_subscription_id, p_event_type, v_sub.access_state, v_target, COALESCE(p_payload, '{}'::jsonb),
    p_idempotency_key, COALESCE(p_effective_at, now()), v_source,
    p_provider, p_provider_event_id, p_effective_at, p_provider_sequence, 'applied'
  )
  RETURNING id INTO v_event_id;

  RETURN jsonb_build_object(
    'event_id', v_event_id,
    'processing_status', 'applied',
    'from_access_state', v_sub.access_state,
    'to_access_state', v_target
  );
END;
$$;

-- ============================================================================
-- SECTION G. Catalogue seed (no 14-day trial; draft/unpublished tax only)
-- ============================================================================

DO $do$
DECLARE
  v_free_plan uuid;
  v_pro_plan uuid;
  v_pro_plus_plan uuid;
  v_free_policy uuid;
  v_pro_policy uuid;
  v_pro_plus_policy uuid;
  v_pv_free uuid;
  v_pv_pro_month uuid;
  v_pv_pro_year uuid;
  v_pv_pp_month uuid;
  v_pv_pp_year uuid;
BEGIN
  -- Plan catalog.
  INSERT INTO billing.plan_catalog (plan_key, display_name, plan_family, is_active)
  VALUES
    ('free',     '{"en":"Free"}'::jsonb,     'free',     true),
    ('pro',      '{"en":"Pro"}'::jsonb,      'pro',      true),
    ('pro_plus', '{"en":"Pro Plus"}'::jsonb, 'pro_plus', true)
  ON CONFLICT (plan_key) DO NOTHING;

  SELECT id INTO v_free_plan     FROM billing.plan_catalog WHERE plan_key = 'free';
  SELECT id INTO v_pro_plan      FROM billing.plan_catalog WHERE plan_key = 'pro';
  SELECT id INTO v_pro_plus_plan FROM billing.plan_catalog WHERE plan_key = 'pro_plus';

  -- Entitlement policies. Free = limited public only (lesson_count_cap 12, no AI
  -- quota). No automatic 14-day trial: assistant_runtime_period_days is NULL.
  INSERT INTO billing.entitlement_policy_versions (
    policy_key, version_number, status, effective_from, lesson_allowlist_mode,
    lesson_count_cap, builder_access, video_access, rag_enabled,
    assistant_runtime_per_lesson_quota, assistant_runtime_general_monthly_quota,
    assistant_runtime_period_quota, assistant_runtime_period_days,
    mission_evaluation_enabled, reveal_answer_enabled, wow_path_enabled, policy_json, published_at
  ) VALUES
    ('free', 1, 'published', now(), 'curriculum_snapshot',
      12, false, false, false,
      0, 0, 0, NULL,
      false, false, false,
      jsonb_build_object('automatic_trial', false, 'note', 'V3: no automatic 14-day trial; limited public access only'),
      now()),
    ('pro', 1, 'published', now(), 'curriculum_snapshot',
      NULL, true, true, true,
      NULL, 1000, 1000, NULL,
      true, true, true,
      jsonb_build_object('automatic_trial', false),
      now()),
    ('pro_plus', 1, 'published', now(), 'curriculum_snapshot',
      NULL, true, true, true,
      NULL, 5000, 5000, NULL,
      true, true, true,
      jsonb_build_object('automatic_trial', false),
      now())
  ON CONFLICT (policy_key, version_number) DO NOTHING;

  SELECT id INTO v_free_policy     FROM billing.entitlement_policy_versions WHERE policy_key = 'free' AND version_number = 1;
  SELECT id INTO v_pro_policy      FROM billing.entitlement_policy_versions WHERE policy_key = 'pro' AND version_number = 1;
  SELECT id INTO v_pro_plus_policy FROM billing.entitlement_policy_versions WHERE policy_key = 'pro_plus' AND version_number = 1;

  -- Plan versions (pro/pro_plus: v1 = month, v2 = year; free: v1 = none).
  INSERT INTO billing.plan_versions (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
  SELECT v_free_plan, v_free_policy, 1, 'none', 'published', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.plan_versions WHERE plan_id = v_free_plan AND version_number = 1);

  INSERT INTO billing.plan_versions (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
  SELECT v_pro_plan, v_pro_policy, 1, 'month', 'published', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.plan_versions WHERE plan_id = v_pro_plan AND version_number = 1);

  INSERT INTO billing.plan_versions (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
  SELECT v_pro_plan, v_pro_policy, 2, 'year', 'published', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.plan_versions WHERE plan_id = v_pro_plan AND version_number = 2);

  INSERT INTO billing.plan_versions (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
  SELECT v_pro_plus_plan, v_pro_plus_policy, 1, 'month', 'published', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.plan_versions WHERE plan_id = v_pro_plus_plan AND version_number = 1);

  INSERT INTO billing.plan_versions (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
  SELECT v_pro_plus_plan, v_pro_plus_policy, 2, 'year', 'published', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.plan_versions WHERE plan_id = v_pro_plus_plan AND version_number = 2);

  SELECT id INTO v_pv_free     FROM billing.plan_versions WHERE plan_id = v_free_plan     AND version_number = 1;
  SELECT id INTO v_pv_pro_month FROM billing.plan_versions WHERE plan_id = v_pro_plan      AND version_number = 1;
  SELECT id INTO v_pv_pro_year  FROM billing.plan_versions WHERE plan_id = v_pro_plan      AND version_number = 2;
  SELECT id INTO v_pv_pp_month  FROM billing.plan_versions WHERE plan_id = v_pro_plus_plan AND version_number = 1;
  SELECT id INTO v_pv_pp_year   FROM billing.plan_versions WHERE plan_id = v_pro_plus_plan AND version_number = 2;

  -- Market prices (minor units, tax exclusive).
  -- EG / EGP.
  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pro_month, 'EG', 'EGP', 16900, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pro_month AND market_code = 'EG' AND currency_code = 'EGP');

  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pro_year, 'EG', 'EGP', 169000, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pro_year AND market_code = 'EG' AND currency_code = 'EGP');

  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pp_month, 'EG', 'EGP', 30900, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pp_month AND market_code = 'EG' AND currency_code = 'EGP');

  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pp_year, 'EG', 'EGP', 309000, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pp_year AND market_code = 'EG' AND currency_code = 'EGP');

  -- INTL / USD.
  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pro_month, 'INTL', 'USD', 699, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pro_month AND market_code = 'INTL' AND currency_code = 'USD');

  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pro_year, 'INTL', 'USD', 6990, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pro_year AND market_code = 'INTL' AND currency_code = 'USD');

  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pp_month, 'INTL', 'USD', 1299, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pp_month AND market_code = 'INTL' AND currency_code = 'USD');

  INSERT INTO billing.market_prices (plan_version_id, market_code, currency_code, amount_minor, tax_behavior, status, effective_from)
  SELECT v_pv_pp_year, 'INTL', 'USD', 12990, 'exclusive', 'active', now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE plan_version_id = v_pv_pp_year AND market_code = 'INTL' AND currency_code = 'USD');

  -- Tax config: DRAFT ONLY. Do not infer/hard-code an unverified current tax
  -- rate. default_rate_bps stays 0 and status stays 'draft' (unpublished).
  INSERT INTO billing.tax_config_versions (market_code, version_number, status, provider_code, default_rate_bps, rules_json, effective_from)
  SELECT 'EG', 1, 'draft', 'pending_verification', 0, jsonb_build_object('note', 'V3: unverified — awaiting confirmed rate'), now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.tax_config_versions WHERE market_code = 'EG' AND version_number = 1);

  INSERT INTO billing.tax_config_versions (market_code, version_number, status, provider_code, default_rate_bps, rules_json, effective_from)
  SELECT 'INTL', 1, 'draft', 'pending_verification', 0, jsonb_build_object('note', 'V3: unverified — awaiting confirmed rate'), now()
  WHERE NOT EXISTS (SELECT 1 FROM billing.tax_config_versions WHERE market_code = 'INTL' AND version_number = 1);
END
$do$;

-- G.1 publish_catalogue_version: admin-only, audited.
CREATE OR REPLACE FUNCTION billing.publish_catalogue_version(
  p_plan_version_id uuid,
  p_idempotency_key text DEFAULT NULL
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
BEGIN
  IF NOT (v_is_admin OR v_is_service) THEN
    RAISE EXCEPTION 'CATALOGUE_PUBLISH_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  UPDATE billing.plan_versions
    SET status = 'published',
        published_at = COALESCE(published_at, now()),
        published_by = v_admin
    WHERE id = p_plan_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAN_VERSION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO billing.billing_audit_log (
    actor_type, actor_id, action, resource_type, resource_id, after_state
  ) VALUES (
    CASE WHEN v_is_admin THEN 'user' ELSE 'service' END,
    COALESCE(v_admin::text, 'service_role'),
    'publish_catalogue_version', 'plan_version', p_plan_version_id,
    jsonb_build_object('status', 'published')
  );

  RETURN jsonb_build_object('plan_version_id', p_plan_version_id, 'status', 'published');
END;
$$;

-- ============================================================================
-- SECTION H. evaluate_access (paid OR active admin grant; fail closed AI)
-- ============================================================================

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

  SELECT EXISTS (
    SELECT 1 FROM billing.admin_access_grants g
    WHERE g.user_id = p_user_id AND g.status = 'active' AND g.expires_at > now()
  ) INTO v_admin_grant;

  -- Paid OR active admin grant confers "full access" for gated features.
  v_entitled := v_paid OR v_admin_grant;

  IF p_resource_type IN ('lesson', 'video', 'rag') THEN
    -- Free public content may still allow limited lessons if the snapshot says
    -- so; do NOT require paid entitlement to consult the entitled id set.
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
    -- Assistant runtime requires paid OR active admin grant. Fail closed and
    -- also deny if the canonical AI quota bucket is already exhausted.
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

-- ============================================================================
-- SECTION I. RLS for new tables
-- ============================================================================

ALTER TABLE billing.admin_access_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.admin_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.purchase_coupon_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON billing.admin_access_coupons FROM anon, authenticated;
REVOKE ALL ON billing.admin_access_grants FROM anon, authenticated;
REVOKE ALL ON billing.purchase_coupon_reservations FROM anon, authenticated;

-- Users may read their own active admin grants; admins may read all.
GRANT SELECT ON billing.admin_access_grants TO authenticated;

CREATE POLICY billing_admin_grants_own_read ON billing.admin_access_grants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_admin_grants_admin_read ON billing.admin_access_grants
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Coupons are admin-visible only (code hashes must not leak to end users).
GRANT SELECT ON billing.admin_access_coupons TO authenticated;

CREATE POLICY billing_admin_coupons_admin_read ON billing.admin_access_coupons
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Purchase reservations: owner or admin read; no client writes.
GRANT SELECT ON billing.purchase_coupon_reservations TO authenticated;

CREATE POLICY billing_purchase_reservations_read ON billing.purchase_coupon_reservations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies for authenticated => writes only via
-- SECURITY DEFINER RPCs / service_role (which bypasses RLS). anon has neither
-- grants nor policies => fail closed.

-- ============================================================================
-- SECTION J. Function grants (REVOKE PUBLIC; GRANT to intended roles)
-- ============================================================================

REVOKE ALL ON FUNCTION billing.assert_no_automatic_trial(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.create_admin_access_coupon(uuid, text, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.redeem_admin_access_coupon(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.revoke_admin_access_coupon(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.revoke_admin_access_grant(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reserve_purchase_coupon(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.consume_purchase_coupon(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.release_purchase_coupon(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.map_ledger_category_to_quota_bucket(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.admin_grant_ai_assistant_limit() FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.resolve_ai_assistant_limit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.register_provider_attempt(uuid, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.release_ai_quota(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reconcile_stale_ai_reservation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.authorize_refund(uuid, bigint, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.subscription_next_access_state(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.apply_subscription_event(uuid, text, text, timestamptz, bigint, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.publish_catalogue_version(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.evaluate_access(uuid, text, text) FROM PUBLIC;

-- Marker guard: callable by server-side roles.
GRANT EXECUTE ON FUNCTION billing.assert_no_automatic_trial(integer) TO service_role;

-- Admin access coupons: create/redeem/revoke are authenticated (admin/intended
-- user checks inside); service_role for automation.
GRANT EXECUTE ON FUNCTION billing.create_admin_access_coupon(uuid, text, text, text, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.redeem_admin_access_coupon(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.revoke_admin_access_coupon(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.revoke_admin_access_grant(uuid, text) TO authenticated, service_role;

-- Purchase coupon lifecycle: server-side only.
GRANT EXECUTE ON FUNCTION billing.reserve_purchase_coupon(uuid, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.consume_purchase_coupon(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.release_purchase_coupon(uuid, text) TO service_role;

-- AI quota: server-side only.
GRANT EXECUTE ON FUNCTION billing.map_ledger_category_to_quota_bucket(text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.admin_grant_ai_assistant_limit() TO service_role;
GRANT EXECUTE ON FUNCTION billing.resolve_ai_assistant_limit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.register_provider_attempt(uuid, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.release_ai_quota(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reconcile_stale_ai_reservation(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) TO service_role;

-- Refunds: service_role for automation; authenticated allowed (admin check inside).
GRANT EXECUTE ON FUNCTION billing.authorize_refund(uuid, bigint, text, text, text) TO authenticated, service_role;

-- Subscription events: server-side only.
GRANT EXECUTE ON FUNCTION billing.subscription_next_access_state(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.apply_subscription_event(uuid, text, text, timestamptz, bigint, text, jsonb, text) TO service_role;

-- Catalogue publishing: authenticated (admin check inside); service_role for automation.
GRANT EXECUTE ON FUNCTION billing.publish_catalogue_version(uuid, text) TO authenticated, service_role;

-- Access evaluation: server-side only.
GRANT EXECUTE ON FUNCTION billing.evaluate_access(uuid, text, text) TO service_role;

-- ============================================================================
-- End of Billing Launch Closure Contracts V3
-- ============================================================================
