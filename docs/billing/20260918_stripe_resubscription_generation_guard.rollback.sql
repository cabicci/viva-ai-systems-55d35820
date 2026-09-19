-- FOR REVIEW ONLY. Captured deployed function definitions, 2026-09-18.
-- Restore matching deployed Edge Functions before using this rollback.
-- Nullable generation columns are retained to preserve replay provenance.
BEGIN;

CREATE OR REPLACE FUNCTION public.apply_stripe_webhook_event(p_gateway_event_id text, p_event_type text, p_effective_at timestamp with time zone, p_transition text, p_subscription_id uuid, p_user_id uuid, p_plan_version_id uuid, p_market_price_id uuid, p_gateway_customer_id text, p_gateway_subscription_id text, p_gateway_status text, p_period_start timestamp with time zone, p_period_end timestamp with time zone, p_cancel_at_period_end boolean, p_gateway_transaction_id text DEFAULT NULL::text, p_amount_minor bigint DEFAULT NULL::bigint, p_currency_code text DEFAULT NULL::text, p_payload_minimized jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'public', 'pg_temp'
AS $function$
DECLARE
  v_inserted_id uuid;
  v_transition_result jsonb := '{}'::jsonb;
  v_transaction_type text;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_WEBHOOK_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  INSERT INTO billing.webhook_events (
    gateway_code, gateway_event_id, event_type, status, payload_minimized,
    signature_valid, received_at, idempotency_key
  )
  VALUES (
    'stripe_us', p_gateway_event_id, p_event_type, 'verified',
    COALESCE(p_payload_minimized, '{}'::jsonb), true, now(),
    'stripe:webhook:' || p_gateway_event_id
  )
  ON CONFLICT (gateway_code, gateway_event_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    RETURN jsonb_build_object('duplicate', true, 'processed', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM billing.subscriptions
    WHERE id = p_subscription_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'STRIPE_SUBSCRIPTION_OWNERSHIP_MISMATCH' USING ERRCODE = 'P0002';
  END IF;

  UPDATE billing.subscriptions
     SET plan_version_id = COALESCE(p_plan_version_id, plan_version_id),
         market_price_id = COALESCE(p_market_price_id, market_price_id),
         billing_state = COALESCE(NULLIF(p_gateway_status, ''), billing_state),
         current_period_start = COALESCE(p_period_start, current_period_start),
         current_period_end = COALESCE(p_period_end, current_period_end),
         cancel_at_period_end = COALESCE(p_cancel_at_period_end, cancel_at_period_end),
         updated_at = now()
   WHERE id = p_subscription_id;

  INSERT INTO billing.gateway_customers (
    user_id, gateway_code, gateway_customer_id, status, metadata
  )
  VALUES (
    p_user_id, 'stripe_us', p_gateway_customer_id, 'active',
    jsonb_build_object('mode', 'test')
  )
  ON CONFLICT (user_id, gateway_code) DO UPDATE
    SET gateway_customer_id = EXCLUDED.gateway_customer_id,
        status = 'active',
        updated_at = now();

  INSERT INTO billing.gateway_subscriptions (
    subscription_id, gateway_code, gateway_subscription_id, gateway_customer_id,
    status, raw_status, metadata
  )
  VALUES (
    p_subscription_id, 'stripe_us', p_gateway_subscription_id, p_gateway_customer_id,
    CASE WHEN p_gateway_status IN ('active', 'trialing') THEN 'active' ELSE 'inactive' END,
    p_gateway_status, jsonb_build_object('mode', 'test')
  )
  ON CONFLICT (subscription_id, gateway_code) DO UPDATE
    SET gateway_subscription_id = EXCLUDED.gateway_subscription_id,
        gateway_customer_id = EXCLUDED.gateway_customer_id,
        status = EXCLUDED.status,
        raw_status = EXCLUDED.raw_status,
        updated_at = now();

  IF p_transition IS NOT NULL THEN
    v_transition_result := billing.apply_subscription_event(
      p_subscription_id,
      'stripe_us',
      p_gateway_event_id,
      p_effective_at,
      NULL,
      p_transition,
      COALESCE(p_payload_minimized, '{}'::jsonb),
      'stripe:event:' || p_gateway_event_id
    );
  END IF;

  IF p_gateway_transaction_id IS NOT NULL
     AND p_amount_minor IS NOT NULL
     AND p_currency_code IS NOT NULL
     AND p_amount_minor >= 0 THEN
    v_transaction_type := CASE
      WHEN p_event_type = 'checkout.session.completed' THEN 'checkout'
      ELSE 'renewal'
    END;

    INSERT INTO billing.payment_transactions (
      subscription_id, user_id, gateway_code, gateway_transaction_id,
      transaction_type, status, amount_minor, currency_code,
      idempotency_key, initiated_at, succeeded_at, metadata
    )
    VALUES (
      p_subscription_id, p_user_id, 'stripe_us', p_gateway_transaction_id,
      v_transaction_type, 'succeeded', p_amount_minor, upper(p_currency_code),
      'stripe:transaction:' || p_gateway_transaction_id,
      COALESCE(p_effective_at, now()), COALESCE(p_effective_at, now()),
      jsonb_build_object('stripe_event_id', p_gateway_event_id, 'mode', 'test')
    )
    ON CONFLICT (gateway_code, gateway_transaction_id) DO NOTHING;
  END IF;

  UPDATE billing.webhook_events
     SET status = 'processed', processed_at = now()
   WHERE id = v_inserted_id;

  RETURN jsonb_build_object(
    'duplicate', false,
    'processed', true,
    'transition', v_transition_result
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prepare_stripe_checkout(p_user_id uuid, p_plan_version_id uuid, p_market_price_id uuid, p_market_code text, p_currency_code text, p_billing_interval text, p_gateway_customer_id text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'public', 'pg_temp'
AS $function$
DECLARE
  v_subscription billing.subscriptions%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CHECKOUT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_subscription
  FROM billing.subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF FOUND AND v_subscription.access_state IN ('paid_active', 'past_due', 'canceled_at_period_end') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_ALREADY_MANAGED' USING ERRCODE = 'P0001';
  END IF;

  IF NOT FOUND THEN
    INSERT INTO billing.subscriptions (
      user_id, plan_version_id, market_price_id, access_state, billing_state,
      market_code, currency_code, billing_interval, idempotency_key
    )
    VALUES (
      p_user_id, p_plan_version_id, p_market_price_id, 'free_active', 'checkout_pending',
      p_market_code, upper(p_currency_code), p_billing_interval, p_idempotency_key
    )
    RETURNING * INTO v_subscription;
  ELSE
    UPDATE billing.subscriptions
       SET plan_version_id = p_plan_version_id,
           market_price_id = p_market_price_id,
           billing_state = 'checkout_pending',
           market_code = p_market_code,
           currency_code = upper(p_currency_code),
           billing_interval = p_billing_interval,
           updated_at = now()
     WHERE id = v_subscription.id
     RETURNING * INTO v_subscription;
  END IF;

  INSERT INTO billing.gateway_customers (
    user_id, gateway_code, gateway_customer_id, status, metadata
  )
  VALUES (
    p_user_id, 'stripe_us', p_gateway_customer_id, 'active',
    jsonb_build_object('mode', 'test')
  )
  ON CONFLICT (user_id, gateway_code) DO UPDATE
    SET gateway_customer_id = EXCLUDED.gateway_customer_id,
        status = 'active',
        metadata = billing.gateway_customers.metadata || EXCLUDED.metadata,
        updated_at = now();

  RETURN jsonb_build_object('subscription_id', v_subscription.id);
END;
$function$
;

DROP FUNCTION IF EXISTS public.confirm_stripe_checkout_generation(uuid, uuid);
DROP FUNCTION IF EXISTS public.record_stripe_checkout_session(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.close_stripe_checkout_intent(uuid, uuid, text);
REVOKE ALL ON FUNCTION public.prepare_stripe_checkout(uuid, uuid, uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stripe_webhook_event(text, text, timestamptz, text, uuid, uuid, uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, bigint, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_stripe_checkout(uuid, uuid, uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_stripe_webhook_event(text, text, timestamptz, text, uuid, uuid, uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, bigint, text, jsonb) TO service_role;
COMMIT;
