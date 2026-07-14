-- Billing launch-closure RPC hardening.
-- Align SQL authorization paths with the approved TypeScript entitlement contract.

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
  v_allowed boolean := false;
  v_denial text := 'ENTITLEMENT_UNAVAILABLE';
  v_access_state text;
  v_paid_entitled boolean;
  v_remaining integer := 0;
  v_rag_ids jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'EVALUATE_ACCESS_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  v_snapshot := billing.get_entitlement_snapshot(p_user_id);
  v_access_state := COALESCE(v_snapshot ->> 'access_state', v_snapshot ->> 'accessState', '');
  v_paid_entitled := COALESCE(
    (v_snapshot ->> 'paid_content_entitled')::boolean,
    (v_snapshot ->> 'paidContentEntitled')::boolean,
    false
  );

  IF NOT v_paid_entitled AND v_access_state IS DISTINCT FROM 'free_active' THEN
    v_denial := COALESCE(
      v_snapshot ->> 'denial_reason_code',
      v_snapshot ->> 'denialReasonCode',
      'ENTITLEMENT_UNAVAILABLE'
    );
    RETURN jsonb_build_object('allowed', false, 'denial_reason_code', v_denial);
  END IF;

  IF p_resource_type = 'lesson' THEN
    v_allowed := v_snapshot -> 'lessons' -> 'entitled_lesson_ids' ? p_resource_id
      OR v_snapshot -> 'lessons' -> 'entitledLessonIds' ? p_resource_id;
    IF NOT v_allowed THEN
      v_denial := 'LESSON_NOT_ENTITLED';
    END IF;
  ELSIF p_resource_type = 'video' THEN
    IF NOT COALESCE(
      (v_snapshot ->> 'video_access')::boolean,
      (v_snapshot ->> 'videoAccess')::boolean,
      false
    ) THEN
      v_allowed := false;
      v_denial := 'VIDEO_NOT_ENTITLED';
    ELSIF p_resource_id IS NULL OR p_resource_id = '' THEN
      v_allowed := true;
    ELSE
      v_rag_ids := COALESCE(
        v_snapshot -> 'rag_allowed_lesson_ids',
        v_snapshot -> 'ragAllowedLessonIds',
        '[]'::jsonb
      );
      v_allowed := v_rag_ids ? p_resource_id;
      IF NOT v_allowed THEN
        v_denial := 'VIDEO_NOT_ENTITLED';
      END IF;
    END IF;
  ELSIF p_resource_type = 'rag' THEN
    v_rag_ids := COALESCE(
      v_snapshot -> 'rag_allowed_lesson_ids',
      v_snapshot -> 'ragAllowedLessonIds',
      '[]'::jsonb
    );
    v_allowed := v_rag_ids ? p_resource_id;
    IF NOT v_allowed THEN
      v_denial := 'RAG_NOT_ENTITLED';
    END IF;
  ELSIF p_resource_type = 'builder' THEN
    v_allowed := COALESCE(
      (v_snapshot ->> 'builder_access')::boolean,
      (v_snapshot ->> 'builderAccess')::boolean,
      false
    );
    IF NOT v_allowed THEN
      v_denial := 'BUILDER_NOT_ENTITLED';
    END IF;
  ELSIF p_resource_type = 'assistant_runtime' THEN
    v_remaining :=
      COALESCE((v_snapshot -> 'assistant_runtime' ->> 'remaining_general')::integer, 0)
      + COALESCE((v_snapshot -> 'assistantRuntime' ->> 'remainingGeneral')::integer, 0)
      + COALESCE((v_snapshot -> 'assistant_runtime' ->> 'remaining_period')::integer, 0)
      + COALESCE((v_snapshot -> 'assistantRuntime' ->> 'remainingPeriod')::integer, 0)
      + COALESCE((v_snapshot ->> 'ai_topup_balance_units')::integer, 0)
      + COALESCE((v_snapshot ->> 'aiTopupBalanceUnits')::integer, 0);
    v_allowed := v_remaining > 0;
    IF NOT v_allowed THEN
      v_denial := 'AI_QUOTA_EXCEEDED';
    END IF;
  ELSE
    v_denial := 'ENTITLEMENT_UNAVAILABLE';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'denial_reason_code', CASE WHEN v_allowed THEN NULL ELSE v_denial END
  );
END;
$$;

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
  v_existing billing.ai_usage_ledger%ROWTYPE;
  v_reservation_id uuid := gen_random_uuid();
  v_snapshot jsonb;
  v_remaining integer := 0;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_units IS NULL OR p_units <= 0 THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_existing
  FROM billing.ai_usage_ledger
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'reservation_id', v_existing.reservation_id,
      'idempotent_replay', true
    );
  END IF;

  v_snapshot := billing.get_entitlement_snapshot(p_user_id);
  v_remaining :=
    COALESCE((v_snapshot -> 'assistant_runtime' ->> 'remaining_general')::integer, 0)
    + COALESCE((v_snapshot -> 'assistantRuntime' ->> 'remainingGeneral')::integer, 0)
    + COALESCE((v_snapshot -> 'assistant_runtime' ->> 'remaining_period')::integer, 0)
    + COALESCE((v_snapshot -> 'assistantRuntime' ->> 'remainingPeriod')::integer, 0)
    + COALESCE((v_snapshot ->> 'ai_topup_balance_units')::integer, 0)
    + COALESCE((v_snapshot ->> 'aiTopupBalanceUnits')::integer, 0);

  IF p_units > v_remaining THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO billing.ai_usage_ledger (
    user_id, usage_category, model_key, lesson_id, request_id, reservation_id,
    input_tokens, output_tokens, provider_cost_micro, billable, status,
    idempotency_key, occurred_at
  ) VALUES (
    p_user_id, p_category, 'pending', p_lesson_id, p_request_id, v_reservation_id,
    0, 0, 0, true, 'reserved', p_idempotency_key, now()
  );

  RETURN jsonb_build_object('reservation_id', v_reservation_id, 'expires_at', now() + interval '5 minutes');
END;
$$;

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
  v_existing billing.ai_usage_ledger%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT * INTO v_existing
    FROM billing.ai_usage_ledger
    WHERE idempotency_key = p_idempotency_key
      AND status = 'committed'
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object('committed', true, 'idempotent_replay', true);
    END IF;
  END IF;

  UPDATE billing.ai_usage_ledger
  SET status = 'committed',
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      occurred_at = now()
  WHERE reservation_id = p_reservation_id
    AND status = 'reserved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('committed', true);
END;
$$;

REVOKE ALL ON FUNCTION billing.evaluate_access(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION billing.evaluate_access(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) TO service_role;
