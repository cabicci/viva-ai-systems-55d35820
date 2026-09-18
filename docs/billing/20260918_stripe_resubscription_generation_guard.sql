-- FOR REVIEW ONLY. Do not apply before Backup/Restore proof is accepted.
-- Forward migration: Stripe re-subscription generation and atomic webhook guard.
BEGIN;

ALTER TABLE billing.subscriptions
  ADD COLUMN IF NOT EXISTS checkout_generation uuid,
  ADD COLUMN IF NOT EXISTS checkout_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_metadata_effective_at timestamptz;

CREATE OR REPLACE FUNCTION public.prepare_stripe_checkout(
  p_user_id uuid, p_plan_version_id uuid, p_market_price_id uuid,
  p_market_code text, p_currency_code text, p_billing_interval text,
  p_gateway_customer_id text, p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_subscription billing.subscriptions%ROWTYPE;
  v_generation uuid;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CHECKOUT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  -- Serialize initialization as well as existing-row requests.
  PERFORM pg_advisory_xact_lock(hashtextextended('stripe-checkout:' || p_user_id::text, 0));
  SELECT * INTO v_subscription FROM billing.subscriptions
  WHERE user_id = p_user_id FOR UPDATE;

  IF FOUND AND v_subscription.access_state IN ('paid_active', 'past_due', 'canceled_at_period_end') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_ALREADY_MANAGED' USING ERRCODE = 'P0001';
  END IF;
  IF FOUND AND v_subscription.access_state IN ('suspended', 'refund_pending', 'refunded') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_REPURCHASE_BLOCKED' USING ERRCODE = 'P0001';
  END IF;

  IF FOUND AND v_subscription.billing_state = 'checkout_pending'
     AND v_subscription.checkout_generation IS NOT NULL THEN
    v_generation := v_subscription.checkout_generation;
  ELSE
    v_generation := gen_random_uuid();
  END IF;

  IF NOT FOUND THEN
    INSERT INTO billing.subscriptions (
      user_id, plan_version_id, market_price_id, access_state, billing_state,
      market_code, currency_code, billing_interval, idempotency_key,
      checkout_generation, checkout_started_at
    ) VALUES (
      p_user_id, p_plan_version_id, p_market_price_id, 'free_active', 'checkout_pending',
      p_market_code, upper(p_currency_code), p_billing_interval, p_idempotency_key,
      v_generation, now()
    ) RETURNING * INTO v_subscription;
  ELSIF v_subscription.checkout_generation = v_generation THEN
    NULL;
  ELSE
    UPDATE billing.subscriptions SET
      plan_version_id = p_plan_version_id,
      market_price_id = p_market_price_id,
      access_state = CASE WHEN access_state IN ('expired', 'free_expired') THEN 'free_active' ELSE access_state END,
      billing_state = 'checkout_pending', market_code = p_market_code,
      currency_code = upper(p_currency_code), billing_interval = p_billing_interval,
      idempotency_key = p_idempotency_key, checkout_generation = v_generation,
      checkout_started_at = now(), cancel_at_period_end = false,
      current_period_start = NULL, current_period_end = NULL, checkout_session_id = NULL,
      canceled_at = NULL, expired_at = NULL, paid_activation_at = NULL,
      entitlement_active_at = NULL, payment_succeeded_at = NULL, updated_at = now()
    WHERE id = v_subscription.id RETURNING * INTO v_subscription;
  END IF;

  INSERT INTO billing.gateway_customers (user_id, gateway_code, gateway_customer_id, status, metadata)
  VALUES (p_user_id, 'stripe_us', p_gateway_customer_id, 'active', jsonb_build_object('mode', 'test'))
  ON CONFLICT (user_id, gateway_code) DO UPDATE SET
    gateway_customer_id = EXCLUDED.gateway_customer_id, status = 'active',
    metadata = billing.gateway_customers.metadata || EXCLUDED.metadata, updated_at = now();

  RETURN jsonb_build_object(
    'subscription_id', v_subscription.id, 'checkout_generation', v_generation,
    'checkout_session_id', v_subscription.checkout_session_id,
    'selection_matches', v_subscription.plan_version_id = p_plan_version_id
      AND v_subscription.market_price_id = p_market_price_id
      AND v_subscription.market_code = p_market_code
      AND v_subscription.currency_code = upper(p_currency_code)
      AND v_subscription.billing_interval = p_billing_interval);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_stripe_webhook_event(
  p_gateway_event_id text, p_event_type text, p_effective_at timestamptz,
  p_transition text, p_subscription_id uuid, p_user_id uuid,
  p_plan_version_id uuid, p_market_price_id uuid, p_gateway_customer_id text,
  p_gateway_subscription_id text, p_gateway_status text,
  p_period_start timestamptz, p_period_end timestamptz,
  p_cancel_at_period_end boolean, p_gateway_transaction_id text DEFAULT NULL,
  p_amount_minor bigint DEFAULT NULL, p_currency_code text DEFAULT NULL,
  p_payload_minimized jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_inserted_id uuid;
  v_subscription billing.subscriptions%ROWTYPE;
  v_gateway_subscription billing.gateway_subscriptions%ROWTYPE;
  v_transition_result jsonb := '{}'::jsonb;
  v_processing_status text;
  v_generation uuid;
  v_transaction_type text;
  v_paid_plan_event boolean := false;
  v_event_type text;
  v_metadata_event_id uuid;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_WEBHOOK_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  INSERT INTO billing.webhook_events (
    gateway_code, gateway_event_id, event_type, status, payload_minimized,
    signature_valid, received_at, idempotency_key
  ) VALUES (
    'stripe_us', p_gateway_event_id, p_event_type, 'verified',
    COALESCE(p_payload_minimized, '{}'::jsonb), true, now(),
    'stripe:webhook:' || p_gateway_event_id
  ) ON CONFLICT (gateway_code, gateway_event_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    SELECT status INTO v_processing_status FROM billing.webhook_events
    WHERE gateway_code = 'stripe_us' AND gateway_event_id = p_gateway_event_id;
    RETURN jsonb_build_object('duplicate', true, 'processed', v_processing_status = 'processed', 'webhook_status', v_processing_status);
  END IF;

  SELECT * INTO v_subscription FROM billing.subscriptions
  WHERE id = p_subscription_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    UPDATE billing.webhook_events SET status = 'failed', error_code = 'STRIPE_SUBSCRIPTION_OWNERSHIP_MISMATCH'
    WHERE id = v_inserted_id;
    RETURN jsonb_build_object('duplicate', false, 'processed', false, 'reason', 'STRIPE_SUBSCRIPTION_OWNERSHIP_MISMATCH');
  END IF;

  BEGIN
    v_generation := NULLIF(p_payload_minimized ->> 'checkout_generation', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_generation := NULL;
  END;

  SELECT * INTO v_gateway_subscription FROM billing.gateway_subscriptions
  WHERE subscription_id = p_subscription_id AND gateway_code = 'stripe_us';

  IF (v_subscription.checkout_generation IS NOT NULL AND v_generation IS DISTINCT FROM v_subscription.checkout_generation)
     OR (v_subscription.checkout_generation IS NULL
         AND (NOT FOUND OR v_gateway_subscription.gateway_subscription_id IS DISTINCT FROM p_gateway_subscription_id)) THEN
    UPDATE billing.webhook_events SET status = 'failed', error_code = 'CHECKOUT_GENERATION_MISMATCH'
    WHERE id = v_inserted_id;
    RETURN jsonb_build_object('duplicate', false, 'processed', false, 'reason', 'CHECKOUT_GENERATION_MISMATCH');
  END IF;

  IF FOUND AND v_gateway_subscription.gateway_subscription_id IS DISTINCT FROM p_gateway_subscription_id
     AND v_subscription.billing_state IS DISTINCT FROM 'checkout_pending' THEN
    UPDATE billing.webhook_events SET status = 'failed', error_code = 'GATEWAY_SUBSCRIPTION_MISMATCH'
    WHERE id = v_inserted_id;
    RETURN jsonb_build_object('duplicate', false, 'processed', false, 'reason', 'GATEWAY_SUBSCRIPTION_MISMATCH');
  END IF;

  IF p_payload_minimized ->> 'payment_evidence_error' IS NOT NULL THEN
    UPDATE billing.webhook_events SET status = 'failed', error_code = p_payload_minimized ->> 'payment_evidence_error'
    WHERE id = v_inserted_id;
    RETURN jsonb_build_object('duplicate', false, 'processed', false,
      'reason', p_payload_minimized ->> 'payment_evidence_error');
  END IF;

  IF p_transition IS NULL AND v_subscription.access_state IN ('expired', 'suspended', 'refunded', 'refund_pending')
     AND p_gateway_status IN ('active', 'trialing')
     AND (GREATEST(v_subscription.last_applied_effective_at, v_subscription.stripe_metadata_effective_at) IS NULL
       OR p_effective_at > GREATEST(v_subscription.last_applied_effective_at, v_subscription.stripe_metadata_effective_at)) THEN
    UPDATE billing.webhook_events SET status = 'failed', error_code = 'TERMINAL_SUBSCRIPTION_STATE'
    WHERE id = v_inserted_id;
    RETURN jsonb_build_object('duplicate', false, 'processed', false, 'reason', 'TERMINAL_SUBSCRIPTION_STATE');
  END IF;

  IF p_transition IS NULL THEN
    IF p_effective_at IS NULL THEN
      INSERT INTO billing.subscription_events (
        subscription_id, event_type, payload, idempotency_key, occurred_at, source,
        provider, provider_event_id, effective_at, processing_status
      ) VALUES (
        p_subscription_id, 'provider_metadata_updated', COALESCE(p_payload_minimized, '{}'::jsonb),
        'stripe:event:' || p_gateway_event_id, now(), 'gateway_webhook',
        'stripe_us', p_gateway_event_id, NULL, 'rejected'
      ) RETURNING id INTO v_metadata_event_id;
      v_transition_result := jsonb_build_object('event_id', v_metadata_event_id,
        'processing_status', 'rejected', 'reason', 'AMBIGUOUS_ORDERING');
    ELSIF p_effective_at <= GREATEST(v_subscription.last_applied_effective_at, v_subscription.stripe_metadata_effective_at) THEN
      INSERT INTO billing.subscription_events (
        subscription_id, event_type, from_access_state, to_access_state, payload,
        idempotency_key, occurred_at, source, provider, provider_event_id,
        effective_at, processing_status
      ) VALUES (
        p_subscription_id, 'provider_metadata_updated', v_subscription.access_state,
        v_subscription.access_state, COALESCE(p_payload_minimized, '{}'::jsonb),
        'stripe:event:' || p_gateway_event_id, p_effective_at, 'gateway_webhook',
        'stripe_us', p_gateway_event_id, p_effective_at, 'stale'
      ) RETURNING id INTO v_metadata_event_id;
      v_transition_result := jsonb_build_object('event_id', v_metadata_event_id,
        'processing_status', 'stale');
    ELSE
      UPDATE billing.subscriptions SET
        stripe_metadata_effective_at = p_effective_at,
        updated_at = now()
      WHERE id = p_subscription_id;
      INSERT INTO billing.subscription_events (
        subscription_id, event_type, from_access_state, to_access_state, payload,
        idempotency_key, occurred_at, source, provider, provider_event_id,
        effective_at, processing_status
      ) VALUES (
        p_subscription_id, 'provider_metadata_updated', v_subscription.access_state,
        v_subscription.access_state, COALESCE(p_payload_minimized, '{}'::jsonb),
        'stripe:event:' || p_gateway_event_id, p_effective_at, 'gateway_webhook',
        'stripe_us', p_gateway_event_id, p_effective_at, 'applied'
      ) RETURNING id INTO v_metadata_event_id;
      v_transition_result := jsonb_build_object('event_id', v_metadata_event_id,
        'processing_status', 'applied', 'from_access_state', v_subscription.access_state,
        'to_access_state', v_subscription.access_state);
    END IF;
  ELSE
    v_event_type := p_transition;
    v_transition_result := billing.apply_subscription_event(
      p_subscription_id, 'stripe_us', p_gateway_event_id, p_effective_at, NULL,
      v_event_type, COALESCE(p_payload_minimized, '{}'::jsonb), 'stripe:event:' || p_gateway_event_id
    );
  END IF;

  v_processing_status := v_transition_result ->> 'processing_status';
  IF v_processing_status IS DISTINCT FROM 'applied' THEN
    UPDATE billing.webhook_events SET status = 'failed', error_code = CASE v_processing_status
      WHEN 'stale' THEN 'STALE_SUBSCRIPTION_EVENT'
      WHEN 'rejected' THEN COALESCE(v_transition_result ->> 'reason', 'SUBSCRIPTION_TRANSITION_REJECTED')
      ELSE 'SUBSCRIPTION_TRANSITION_NOT_APPLIED' END
    WHERE id = v_inserted_id;
    RETURN jsonb_build_object('duplicate', false, 'processed', false,
      'reason', COALESCE(v_transition_result ->> 'reason', upper(COALESCE(v_processing_status, 'not_applied'))),
      'transition', v_transition_result);
  END IF;

  v_paid_plan_event := p_transition = 'payment_succeeded'
    AND p_event_type IN ('checkout.session.completed', 'invoice.paid')
    AND p_gateway_status = 'active';

  UPDATE billing.subscriptions SET
    plan_version_id = CASE WHEN v_paid_plan_event THEN COALESCE(p_plan_version_id, plan_version_id) ELSE plan_version_id END,
    market_price_id = CASE WHEN v_paid_plan_event THEN COALESCE(p_market_price_id, market_price_id) ELSE market_price_id END,
    billing_state = COALESCE(NULLIF(p_gateway_status, ''), billing_state),
    current_period_start = COALESCE(p_period_start, current_period_start),
    current_period_end = COALESCE(p_period_end, current_period_end),
    cancel_at_period_end = COALESCE(p_cancel_at_period_end, cancel_at_period_end), updated_at = now()
  WHERE id = p_subscription_id;

  INSERT INTO billing.gateway_customers (user_id, gateway_code, gateway_customer_id, status, metadata)
  VALUES (p_user_id, 'stripe_us', p_gateway_customer_id, 'active', jsonb_build_object('mode', 'test'))
  ON CONFLICT (user_id, gateway_code) DO UPDATE SET gateway_customer_id = EXCLUDED.gateway_customer_id,
    status = 'active', updated_at = now();

  INSERT INTO billing.gateway_subscriptions (
    subscription_id, gateway_code, gateway_subscription_id, gateway_customer_id, status, raw_status, metadata
  ) VALUES (
    p_subscription_id, 'stripe_us', p_gateway_subscription_id, p_gateway_customer_id,
    CASE WHEN p_gateway_status IN ('active', 'trialing') THEN 'active' ELSE 'inactive' END,
    p_gateway_status, jsonb_build_object('mode', 'test', 'checkout_generation', v_generation)
  ) ON CONFLICT (subscription_id, gateway_code) DO UPDATE SET
    gateway_subscription_id = EXCLUDED.gateway_subscription_id,
    gateway_customer_id = EXCLUDED.gateway_customer_id, status = EXCLUDED.status,
    raw_status = EXCLUDED.raw_status,
    metadata = billing.gateway_subscriptions.metadata || EXCLUDED.metadata, updated_at = now();

  IF v_paid_plan_event AND p_gateway_transaction_id IS NOT NULL
     AND p_amount_minor IS NOT NULL AND p_currency_code IS NOT NULL AND p_amount_minor >= 0 THEN
    v_transaction_type := CASE WHEN p_event_type = 'checkout.session.completed' THEN 'checkout' ELSE 'renewal' END;
    INSERT INTO billing.payment_transactions (
      subscription_id, user_id, gateway_code, gateway_transaction_id, transaction_type,
      status, amount_minor, currency_code, idempotency_key, initiated_at, succeeded_at, metadata
    ) VALUES (
      p_subscription_id, p_user_id, 'stripe_us', p_gateway_transaction_id, v_transaction_type,
      'succeeded', p_amount_minor, upper(p_currency_code), 'stripe:transaction:' || p_gateway_transaction_id,
      COALESCE(p_effective_at, now()), COALESCE(p_effective_at, now()),
      jsonb_build_object('stripe_event_id', p_gateway_event_id, 'mode', 'test')
    ) ON CONFLICT (gateway_code, gateway_transaction_id) DO NOTHING;
  END IF;

  UPDATE billing.webhook_events SET status = 'processed', processed_at = now(), error_code = NULL
  WHERE id = v_inserted_id;
  RETURN jsonb_build_object('duplicate', false, 'processed', true,
    'plan_updated', v_paid_plan_event, 'transition', v_transition_result);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_stripe_checkout_generation(
  p_user_id uuid,
  p_checkout_generation uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_current boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CHECKOUT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM billing.subscriptions
    WHERE user_id = p_user_id
      AND billing_state = 'checkout_pending'
      AND checkout_generation = p_checkout_generation
  ) INTO v_current;
  RETURN v_current;
END;
$$;

-- Only call close after Stripe has confirmed this exact session is expired.
CREATE OR REPLACE FUNCTION public.close_stripe_checkout_intent(
  p_user_id uuid, p_checkout_generation uuid, p_session_id text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = billing, public, pg_temp AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CHECKOUT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;
  UPDATE billing.subscriptions SET billing_state = 'checkout_expired', updated_at = now()
  WHERE user_id = p_user_id AND checkout_generation = p_checkout_generation
    AND checkout_session_id = p_session_id AND billing_state = 'checkout_pending';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_stripe_checkout_session(
  p_user_id uuid, p_checkout_generation uuid, p_session_id text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = billing, public, pg_temp AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CHECKOUT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;
  IF p_session_id IS NULL OR p_session_id = '' THEN RETURN false; END IF;
  UPDATE billing.subscriptions SET checkout_session_id = p_session_id, updated_at = now()
  WHERE user_id = p_user_id AND checkout_generation = p_checkout_generation
    AND billing_state = 'checkout_pending'
    AND (checkout_session_id IS NULL OR checkout_session_id = p_session_id);
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.close_stripe_checkout_intent(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_stripe_checkout_session(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_stripe_checkout_intent(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_stripe_checkout_session(uuid, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.prepare_stripe_checkout(uuid, uuid, uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_stripe_checkout_generation(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stripe_webhook_event(text, text, timestamptz, text, uuid, uuid, uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, bigint, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_stripe_checkout(uuid, uuid, uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_stripe_checkout_generation(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_stripe_webhook_event(text, text, timestamptz, text, uuid, uuid, uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, bigint, text, jsonb) TO service_role;
COMMIT;
