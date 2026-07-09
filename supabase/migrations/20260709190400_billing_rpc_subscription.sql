-- Stage 2A1: subscription lifecycle RPC foundation (draft)
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
     AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
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
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
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

REVOKE ALL ON FUNCTION billing.cancel_at_period_end(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.apply_subscription_event(uuid, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.cancel_at_period_end(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.apply_subscription_event(uuid, text, jsonb, text) TO service_role;
