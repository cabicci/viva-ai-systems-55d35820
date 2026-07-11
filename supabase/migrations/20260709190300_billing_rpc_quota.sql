-- Stage 2A1: AI quota RPC foundation (draft)
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
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
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
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
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

CREATE OR REPLACE FUNCTION billing.release_ai_quota(
  p_reservation_id uuid,
  p_idempotency_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  UPDATE billing.ai_usage_ledger
  SET status = 'released', occurred_at = now()
  WHERE reservation_id = p_reservation_id
    AND status = 'reserved';
END;
$$;

REVOKE ALL ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.release_ai_quota(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.release_ai_quota(uuid, text) TO service_role;
