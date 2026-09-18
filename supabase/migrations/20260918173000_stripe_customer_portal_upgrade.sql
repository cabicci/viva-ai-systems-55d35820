-- Stripe Customer Portal upgrade support and authoritative price-to-plan resolution.
-- All functions are service-role only. The browser never receives gateway identifiers.

CREATE OR REPLACE FUNCTION public.get_stripe_portal_context(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_PORTAL_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'subscription_id', s.id,
    'access_state', s.access_state,
    'plan_key', pc.plan_key,
    'gateway_customer_id', gc.gateway_customer_id,
    'gateway_subscription_id', gs.gateway_subscription_id
  )
  INTO v_result
  FROM billing.subscriptions s
  JOIN billing.plan_versions pv ON pv.id = s.plan_version_id
  JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
  JOIN billing.gateway_customers gc
    ON gc.user_id = s.user_id
   AND gc.gateway_code = 'stripe_us'
   AND gc.status = 'active'
  JOIN billing.gateway_subscriptions gs
    ON gs.subscription_id = s.id
   AND gs.gateway_code = 'stripe_us'
  WHERE s.user_id = p_user_id
    AND s.access_state IN ('paid_active', 'past_due', 'canceled_at_period_end')
  LIMIT 1;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'MANAGED_STRIPE_SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_stripe_subscription_plan(p_gateway_price_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_PRICE_RESOLUTION_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'plan_version_id', pv.id,
    'market_price_id', mp.id,
    'plan_key', pc.plan_key,
    'market_code', mp.market_code,
    'billing_interval', pv.billing_interval
  )
  INTO v_result
  FROM billing.gateway_price_mappings gpm
  JOIN billing.market_prices mp ON mp.id = gpm.market_price_id
  JOIN billing.plan_versions pv ON pv.id = mp.plan_version_id
  JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
  WHERE gpm.gateway_code = 'stripe_us'
    AND gpm.gateway_price_id = p_gateway_price_id
    AND gpm.status = 'active'
  ORDER BY mp.effective_from DESC
  LIMIT 1;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_stripe_portal_context(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolve_stripe_subscription_plan(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_stripe_portal_context(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_stripe_subscription_plan(text) TO service_role;
