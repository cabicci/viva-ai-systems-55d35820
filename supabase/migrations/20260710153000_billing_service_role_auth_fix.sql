-- Billing service-role authorization repair.
-- PostgREST/Supabase expose JWT role via auth.jwt(), not legacy per-claim GUCs.

CREATE OR REPLACE FUNCTION billing.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = billing, public, pg_temp
AS $$
  SELECT coalesce(auth.jwt() ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION billing.is_service_role_caller()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = billing, public, pg_temp
AS $$
  SELECT billing.jwt_role() = 'service_role';
$$;

REVOKE ALL ON FUNCTION billing.jwt_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.is_service_role_caller() FROM PUBLIC;

CREATE OR REPLACE FUNCTION billing.get_entitlement_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_row billing.user_entitlement_snapshots%ROWTYPE;
BEGIN
  IF v_caller IS NULL AND NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'ENTITLEMENT_UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF v_caller IS NOT NULL AND v_caller IS DISTINCT FROM p_user_id
     AND NOT public.has_role(v_caller, 'admin'::app_role) THEN
    RAISE EXCEPTION 'ENTITLEMENT_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row
  FROM billing.user_entitlement_snapshots
  WHERE user_id = p_user_id
  ORDER BY snapshot_version DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'paid_content_entitled', false,
      'denial_reason_code', 'ENTITLEMENT_UNAVAILABLE'
    );
  END IF;

  RETURN v_row.entitlement_json;
END;
$$;

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
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'EVALUATE_ACCESS_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  v_snapshot := billing.get_entitlement_snapshot(p_user_id);

  IF COALESCE((v_snapshot ->> 'paid_content_entitled')::boolean, false) = false THEN
    v_denial := COALESCE(v_snapshot ->> 'denial_reason_code', 'ENTITLEMENT_UNAVAILABLE');
    RETURN jsonb_build_object('allowed', false, 'denial_reason_code', v_denial);
  END IF;

  IF p_resource_type IN ('lesson', 'video', 'rag') THEN
    v_allowed := v_snapshot -> 'lessons' -> 'entitled_lesson_ids' ? p_resource_id;
    IF NOT v_allowed THEN
      v_denial := CASE p_resource_type
        WHEN 'video' THEN 'VIDEO_NOT_ENTITLED'
        WHEN 'rag' THEN 'RAG_NOT_ENTITLED'
        ELSE 'LESSON_NOT_ENTITLED'
      END;
    END IF;
  ELSIF p_resource_type = 'builder' THEN
    v_allowed := COALESCE((v_snapshot ->> 'builder_access')::boolean, false);
    IF NOT v_allowed THEN v_denial := 'BUILDER_NOT_ENTITLED'; END IF;
  ELSIF p_resource_type = 'assistant_runtime' THEN
    v_allowed := true;
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
BEGIN
  IF NOT billing.is_service_role_caller() THEN
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
  IF NOT billing.is_service_role_caller() THEN
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
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  UPDATE billing.ai_usage_ledger
  SET status = 'released', occurred_at = now()
  WHERE reservation_id = p_reservation_id
    AND status = 'reserved';
END;
$$;

CREATE OR REPLACE FUNCTION billing.cancel_at_period_end(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_sub billing.subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_sub
  FROM billing.subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF auth.uid() IS DISTINCT FROM v_sub.user_id
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'SUBSCRIPTION_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  UPDATE billing.subscriptions
  SET cancel_at_period_end = true,
      access_state = 'canceled_at_period_end',
      canceled_at = COALESCE(canceled_at, now()),
      updated_at = now()
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object(
    'subscription_id', p_subscription_id,
    'access_state', 'canceled_at_period_end',
    'current_period_end', v_sub.current_period_end
  );
END;
$$;

CREATE OR REPLACE FUNCTION billing.apply_subscription_event(
  p_subscription_id uuid,
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
  v_existing billing.subscription_events%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EVENT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM billing.subscription_events
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object('idempotent_replay', true, 'event_id', v_existing.id);
  END IF;

  INSERT INTO billing.subscription_events (
    subscription_id, event_type, payload, idempotency_key, occurred_at, source
  ) VALUES (
    p_subscription_id, p_event_type, COALESCE(p_payload, '{}'::jsonb), p_idempotency_key, now(), 'system'
  );

  RETURN jsonb_build_object('accepted', true);
END;
$$;

CREATE OR REPLACE FUNCTION billing.grant_monetary_credit(
  p_user_id uuid,
  p_amount_minor bigint,
  p_currency_code text,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_balance bigint := 0;
  v_existing billing.monetary_credit_ledger%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'CREDIT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing FROM billing.monetary_credit_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('idempotent_replay', true, 'ledger_id', v_existing.id);
  END IF;

  SELECT COALESCE(
    (
      SELECT balance_after_minor
      FROM billing.monetary_credit_ledger
      WHERE user_id = p_user_id AND currency_code = p_currency_code
      ORDER BY occurred_at DESC
      LIMIT 1
    ),
    0
  )
  INTO v_balance;

  INSERT INTO billing.monetary_credit_ledger (
    user_id, entry_type, amount_minor, currency_code, balance_after_minor,
    source_type, source_id, idempotency_key, occurred_at
  ) VALUES (
    p_user_id, 'grant', p_amount_minor, p_currency_code, v_balance + p_amount_minor,
    p_source_type, p_source_id, p_idempotency_key, now()
  )
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object('ledger_id', v_existing.id, 'balance_after_minor', v_balance + p_amount_minor);
END;
$$;

CREATE OR REPLACE FUNCTION billing.grant_ai_credit(
  p_user_id uuid,
  p_credit_units integer,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_balance integer := 0;
  v_existing billing.ai_credit_ledger%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'CREDIT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing FROM billing.ai_credit_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('idempotent_replay', true, 'ledger_id', v_existing.id);
  END IF;

  SELECT COALESCE(
    (
      SELECT balance_after
      FROM billing.ai_credit_ledger
      WHERE user_id = p_user_id
      ORDER BY occurred_at DESC
      LIMIT 1
    ),
    0
  )
  INTO v_balance;

  INSERT INTO billing.ai_credit_ledger (
    user_id, entry_type, credit_units, balance_after, source_type, source_id, idempotency_key, occurred_at
  ) VALUES (
    p_user_id, 'grant', p_credit_units, v_balance + p_credit_units,
    p_source_type, p_source_id, p_idempotency_key, now()
  )
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object('ledger_id', v_existing.id, 'balance_after', v_balance + p_credit_units);
END;
$$;

REVOKE ALL ON FUNCTION billing.get_entitlement_snapshot(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.evaluate_access(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.release_ai_quota(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.cancel_at_period_end(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.apply_subscription_event(uuid, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.grant_monetary_credit(uuid, bigint, text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.grant_ai_credit(uuid, integer, text, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION billing.get_entitlement_snapshot(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.evaluate_access(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.commit_ai_quota(uuid, integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.release_ai_quota(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.cancel_at_period_end(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.apply_subscription_event(uuid, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.grant_monetary_credit(uuid, bigint, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.grant_ai_credit(uuid, integer, text, uuid, text) TO service_role;
