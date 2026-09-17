-- Stripe Test checkout bridge.
-- Server-only RPCs: callers must hold the Supabase service-role JWT.
-- Stripe remains in test mode while STRIPE_SECRET_KEY starts with rk_test_/sk_test_.

CREATE OR REPLACE FUNCTION public.get_stripe_checkout_context(
  p_user_id uuid,
  p_plan_key text,
  p_billing_interval text,
  p_market_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CHECKOUT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_plan_key NOT IN ('pro', 'pro_plus')
     OR p_billing_interval NOT IN ('month', 'year')
     OR p_market_code NOT IN ('EG', 'INTL') THEN
    RAISE EXCEPTION 'INVALID_CHECKOUT_SELECTION' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object(
    'plan_version_id', pv.id,
    'market_price_id', mp.id,
    'plan_key', pc.plan_key,
    'plan_name', CASE WHEN pc.plan_key = 'pro_plus' THEN 'Masaarat Pro Plus' ELSE 'Masaarat Pro' END,
    'billing_interval', pv.billing_interval,
    'market_code', mp.market_code,
    'currency_code', lower(mp.currency_code),
    'amount_minor', mp.amount_minor,
    'tax_behavior', mp.tax_behavior,
    'gateway_price_id', gpm.gateway_price_id,
    'gateway_product_id', gpm.gateway_product_id,
    'gateway_customer_id', gc.gateway_customer_id,
    'subscription_id', s.id,
    'access_state', s.access_state
  )
  INTO v_result
  FROM billing.plan_catalog pc
  JOIN billing.plan_versions pv
    ON pv.plan_id = pc.id
   AND pv.status = 'published'
   AND pv.billing_interval = p_billing_interval
   AND pv.effective_from <= now()
   AND (pv.effective_to IS NULL OR pv.effective_to > now())
  JOIN billing.market_prices mp
    ON mp.plan_version_id = pv.id
   AND mp.status = 'active'
   AND mp.market_code = p_market_code
   AND mp.effective_from <= now()
   AND (mp.effective_to IS NULL OR mp.effective_to > now())
  LEFT JOIN billing.gateway_price_mappings gpm
    ON gpm.market_price_id = mp.id
   AND gpm.gateway_code = 'stripe_us'
   AND gpm.status = 'active'
  LEFT JOIN billing.gateway_customers gc
    ON gc.user_id = p_user_id
   AND gc.gateway_code = 'stripe_us'
   AND gc.status = 'active'
  LEFT JOIN billing.subscriptions s ON s.user_id = p_user_id
  WHERE pc.plan_key = p_plan_key
    AND pc.is_active = true
  ORDER BY pv.version_number DESC, mp.effective_from DESC
  LIMIT 1;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'PRICE_NOT_AVAILABLE' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_stripe_gateway_catalog(
  p_market_price_id uuid,
  p_gateway_price_id text,
  p_gateway_product_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_row billing.gateway_price_mappings%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CATALOG_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;
  IF NULLIF(trim(p_gateway_price_id), '') IS NULL OR NULLIF(trim(p_gateway_product_id), '') IS NULL THEN
    RAISE EXCEPTION 'INVALID_STRIPE_CATALOG_IDS' USING ERRCODE = '22023';
  END IF;

  INSERT INTO billing.gateway_price_mappings (
    market_price_id, gateway_code, gateway_price_id, gateway_product_id,
    capability_flags, status
  )
  VALUES (
    p_market_price_id, 'stripe_us', p_gateway_price_id, p_gateway_product_id,
    jsonb_build_object('mode', 'test', 'checkout_sessions', true, 'subscriptions', true),
    'active'
  )
  ON CONFLICT (market_price_id, gateway_code) DO UPDATE
    SET gateway_price_id = CASE
          WHEN billing.gateway_price_mappings.status = 'active'
            THEN billing.gateway_price_mappings.gateway_price_id
          ELSE EXCLUDED.gateway_price_id
        END,
        gateway_product_id = CASE
          WHEN billing.gateway_price_mappings.status = 'active'
            THEN billing.gateway_price_mappings.gateway_product_id
          ELSE EXCLUDED.gateway_product_id
        END,
        capability_flags = EXCLUDED.capability_flags,
        status = 'active'
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'gateway_price_id', v_row.gateway_price_id,
    'gateway_product_id', v_row.gateway_product_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_stripe_checkout(
  p_user_id uuid,
  p_plan_version_id uuid,
  p_market_price_id uuid,
  p_market_code text,
  p_currency_code text,
  p_billing_interval text,
  p_gateway_customer_id text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.apply_stripe_webhook_event(
  p_gateway_event_id text,
  p_event_type text,
  p_effective_at timestamptz,
  p_transition text,
  p_subscription_id uuid,
  p_user_id uuid,
  p_plan_version_id uuid,
  p_market_price_id uuid,
  p_gateway_customer_id text,
  p_gateway_subscription_id text,
  p_gateway_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_gateway_transaction_id text DEFAULT NULL,
  p_amount_minor bigint DEFAULT NULL,
  p_currency_code text DEFAULT NULL,
  p_payload_minimized jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_stripe_checkout_context(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.register_stripe_gateway_catalog(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_stripe_checkout(uuid, uuid, uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stripe_webhook_event(text, text, timestamptz, text, uuid, uuid, uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, bigint, text, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_stripe_checkout_context(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_stripe_gateway_catalog(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepare_stripe_checkout(uuid, uuid, uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_stripe_webhook_event(text, text, timestamptz, text, uuid, uuid, uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, bigint, text, jsonb) TO service_role;
