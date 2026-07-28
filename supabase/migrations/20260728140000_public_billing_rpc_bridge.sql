-- Public PostgREST bridge for Chat-4 / entitlement Edge Functions on Lovable Cloud.
-- Private billing.* implementation remains authoritative. These thin public wrappers
-- exist only so service_role callers can invoke the contract without Accept-Profile:
-- billing (custom schemas cannot be added to Lovable Data API db-schemas).
--
-- Authorization: CR-RAG-BILLING-PUBLIC-RPC-BRIDGE-CANDIDATE-20260728-01

-- ---------------------------------------------------------------------------
-- 1. public.reserve_learner_ai_access
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_learner_ai_access(
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
SET search_path = public, billing, pg_temp
AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  RETURN billing.reserve_learner_ai_access(
    p_user_id,
    p_category,
    p_lesson_id,
    p_request_id,
    p_units,
    p_idempotency_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_learner_ai_access(uuid, text, text, uuid, integer, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. public.register_provider_attempt
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_provider_attempt(
  p_reservation_id uuid,
  p_provider text,
  p_provider_request_id text,
  p_attempt_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  RETURN billing.register_provider_attempt(
    p_reservation_id,
    p_provider,
    p_provider_request_id,
    p_attempt_idempotency_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.register_provider_attempt(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_provider_attempt(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.register_provider_attempt(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.register_provider_attempt(uuid, text, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. public.finalize_provider_attempt
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_provider_attempt(
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
SET search_path = public, billing, pg_temp
AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  RETURN billing.finalize_provider_attempt(
    p_reservation_id,
    p_attempt_index,
    p_attempt_status,
    p_input_tokens,
    p_output_tokens,
    p_provider_cost_micro
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_provider_attempt(uuid, integer, text, integer, integer, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_provider_attempt(uuid, integer, text, integer, integer, bigint) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_provider_attempt(uuid, integer, text, integer, integer, bigint) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_provider_attempt(uuid, integer, text, integer, integer, bigint) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. public.commit_ai_quota
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commit_ai_quota(
  p_reservation_id uuid,
  p_input_tokens integer,
  p_output_tokens integer,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  RETURN billing.commit_ai_quota(
    p_reservation_id,
    p_input_tokens,
    p_output_tokens,
    p_idempotency_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.commit_ai_quota(uuid, integer, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.commit_ai_quota(uuid, integer, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public.commit_ai_quota(uuid, integer, integer, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.commit_ai_quota(uuid, integer, integer, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. public.release_ai_quota
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_ai_quota(
  p_reservation_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  RETURN billing.release_ai_quota(
    p_reservation_id,
    p_idempotency_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.release_ai_quota(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_ai_quota(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.release_ai_quota(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.release_ai_quota(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. public.get_entitlement_snapshot
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entitlement_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'ENTITLEMENT_UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  RETURN billing.get_entitlement_snapshot(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_entitlement_snapshot(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_entitlement_snapshot(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_entitlement_snapshot(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_entitlement_snapshot(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 7. public.evaluate_access
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.evaluate_access(
  p_user_id uuid,
  p_resource_type text,
  p_resource_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'EVALUATE_ACCESS_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  RETURN billing.evaluate_access(
    p_user_id,
    p_resource_type,
    p_resource_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.evaluate_access(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evaluate_access(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.evaluate_access(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_access(uuid, text, text) TO service_role;
