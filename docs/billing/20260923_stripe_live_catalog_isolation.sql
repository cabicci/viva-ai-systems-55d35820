-- REVIEW ONLY: additive Live catalog/customer namespace. Do not apply to production
-- until backup freshness, rollback rehearsal and owner approval are recorded.
-- Existing stripe_us functions, rows and TEST checkout remain unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE billing.gateway_price_mappings DROP CONSTRAINT gateway_price_mappings_gateway_check;
ALTER TABLE billing.gateway_price_mappings ADD CONSTRAINT gateway_price_mappings_gateway_check
  CHECK (gateway_code IN ('stripe_us', 'stripe_us_live', 'paymob_eg', 'future'));
ALTER TABLE billing.gateway_customers DROP CONSTRAINT gateway_customers_gateway_check;
ALTER TABLE billing.gateway_customers ADD CONSTRAINT gateway_customers_gateway_check
  CHECK (gateway_code IN ('stripe_us', 'stripe_us_live', 'paymob_eg', 'future'));
ALTER TABLE billing.gateway_subscriptions DROP CONSTRAINT gateway_subscriptions_gateway_check;
ALTER TABLE billing.gateway_subscriptions ADD CONSTRAINT gateway_subscriptions_gateway_check
  CHECK (gateway_code IN ('stripe_us', 'stripe_us_live', 'paymob_eg', 'future'));
CREATE UNIQUE INDEX gateway_live_price_id_unique
  ON billing.gateway_price_mappings (gateway_price_id)
  WHERE gateway_code='stripe_us_live';

CREATE OR REPLACE FUNCTION public.get_stripe_checkout_context_live(
  p_user_id uuid, p_plan_key text, p_billing_interval text, p_market_code text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = billing, public, pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CHECKOUT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;
  IF p_plan_key NOT IN ('pro', 'pro_plus') OR p_billing_interval NOT IN ('month', 'year')
    OR p_market_code NOT IN ('EG', 'INTL') THEN
    RAISE EXCEPTION 'INVALID_CHECKOUT_SELECTION' USING ERRCODE = '22023';
  END IF;
  SELECT jsonb_build_object(
    'plan_version_id', pv.id, 'market_price_id', mp.id,
    'plan_key', pc.plan_key,
    'plan_name', CASE WHEN pc.plan_key='pro_plus' THEN 'Masaarat Pro Plus' ELSE 'Masaarat Pro' END,
    'billing_interval', pv.billing_interval, 'market_code', mp.market_code,
    'currency_code', lower(mp.currency_code), 'amount_minor', mp.amount_minor,
    'tax_behavior', mp.tax_behavior,
    'gateway_price_id', gpm.gateway_price_id,
    'gateway_product_id', gpm.gateway_product_id,
    'gateway_customer_id', gc.gateway_customer_id,
    'subscription_id', s.id, 'access_state', s.access_state,
    'gateway_code', 'stripe_us_live', 'mode', 'live') INTO v_result
  FROM billing.plan_catalog pc
  JOIN billing.plan_versions pv ON pv.plan_id=pc.id AND pv.status='published'
    AND pv.billing_interval=p_billing_interval AND pv.effective_from<=now()
    AND (pv.effective_to IS NULL OR pv.effective_to>now())
  JOIN billing.market_prices mp ON mp.plan_version_id=pv.id AND mp.status='active'
    AND mp.market_code=p_market_code AND mp.effective_from<=now()
    AND (mp.effective_to IS NULL OR mp.effective_to>now())
  LEFT JOIN billing.gateway_price_mappings gpm ON gpm.market_price_id=mp.id
    AND gpm.gateway_code='stripe_us_live' AND gpm.status='active'
  LEFT JOIN billing.gateway_customers gc ON gc.user_id=p_user_id
    AND gc.gateway_code='stripe_us_live' AND gc.status='active'
  LEFT JOIN billing.gateway_subscriptions gs ON gs.gateway_code='stripe_us_live'
    AND gs.gateway_customer_id=gc.gateway_customer_id
  LEFT JOIN billing.subscriptions s ON s.id=gs.subscription_id AND s.user_id=p_user_id
  WHERE pc.plan_key=p_plan_key AND pc.is_active=true
  ORDER BY pv.version_number DESC, mp.effective_from DESC LIMIT 1;
  IF v_result IS NULL THEN RAISE EXCEPTION 'PRICE_NOT_AVAILABLE' USING ERRCODE='P0002'; END IF;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.register_stripe_gateway_catalog_live(
  p_market_price_id uuid, p_gateway_price_id text, p_gateway_product_id text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = billing, public, pg_temp AS $$
DECLARE v_row billing.gateway_price_mappings%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_CATALOG_SERVICE_ONLY' USING ERRCODE='42501';
  END IF;
  IF p_gateway_price_id IS NULL OR p_gateway_product_id IS NULL
    OR p_gateway_price_id !~ '^price_[A-Za-z0-9_]+$'
    OR p_gateway_product_id !~ '^prod_[A-Za-z0-9_]+$'
    OR NOT EXISTS (SELECT 1 FROM billing.market_prices WHERE id=p_market_price_id AND status='active') THEN
    RAISE EXCEPTION 'INVALID_LIVE_CATALOG_IDS' USING ERRCODE='22023';
  END IF;
  INSERT INTO billing.gateway_price_mappings (
    market_price_id,gateway_code,gateway_price_id,gateway_product_id,capability_flags,status
  ) VALUES (
    p_market_price_id,'stripe_us_live',p_gateway_price_id,p_gateway_product_id,
    jsonb_build_object('mode','live','checkout_sessions',true,'subscriptions',true),'active'
  ) ON CONFLICT (market_price_id,gateway_code) DO UPDATE SET
    status='active'
  WHERE billing.gateway_price_mappings.gateway_price_id=EXCLUDED.gateway_price_id
    AND billing.gateway_price_mappings.gateway_product_id=EXCLUDED.gateway_product_id
  RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'LIVE_CATALOG_MAPPING_CONFLICT' USING ERRCODE='23505';
  END IF;
  RETURN jsonb_build_object('gateway_price_id',v_row.gateway_price_id,
    'gateway_product_id',v_row.gateway_product_id);
END; $$;

CREATE OR REPLACE FUNCTION public.resolve_stripe_subscription_plan_live(p_gateway_price_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = billing, public, pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_PRICE_RESOLUTION_SERVICE_ONLY' USING ERRCODE='42501';
  END IF;
  SELECT jsonb_build_object('plan_version_id',pv.id,'market_price_id',mp.id,
    'plan_key',pc.plan_key,'market_code',mp.market_code,
    'billing_interval',pv.billing_interval,'gateway_code','stripe_us_live') INTO v_result
  FROM billing.gateway_price_mappings gpm
  JOIN billing.market_prices mp ON mp.id=gpm.market_price_id
  JOIN billing.plan_versions pv ON pv.id=mp.plan_version_id
  JOIN billing.plan_catalog pc ON pc.id=pv.plan_id
  WHERE gpm.gateway_code='stripe_us_live' AND gpm.gateway_price_id=p_gateway_price_id
    AND gpm.status='active' ORDER BY mp.effective_from DESC LIMIT 1;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_stripe_portal_context_live(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = billing, public, pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_PORTAL_SERVICE_ONLY' USING ERRCODE='42501';
  END IF;
  SELECT jsonb_build_object('subscription_id',s.id,'access_state',s.access_state,
    'plan_key',pc.plan_key,'gateway_customer_id',gc.gateway_customer_id,
    'gateway_subscription_id',gs.gateway_subscription_id,'gateway_code','stripe_us_live')
    INTO v_result
  FROM billing.subscriptions s
  JOIN billing.plan_versions pv ON pv.id=s.plan_version_id
  JOIN billing.plan_catalog pc ON pc.id=pv.plan_id
  JOIN billing.gateway_customers gc ON gc.user_id=s.user_id
    AND gc.gateway_code='stripe_us_live' AND gc.status='active'
  JOIN billing.gateway_subscriptions gs ON gs.subscription_id=s.id
    AND gs.gateway_code='stripe_us_live'
    AND gs.gateway_customer_id=gc.gateway_customer_id
  WHERE s.user_id=p_user_id
    AND s.access_state IN ('paid_active','past_due','canceled_at_period_end') LIMIT 1;
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'MANAGED_STRIPE_LIVE_SUBSCRIPTION_NOT_FOUND' USING ERRCODE='P0002';
  END IF;
  RETURN v_result;
END; $$;

REVOKE ALL ON FUNCTION public.get_stripe_checkout_context_live(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.register_stripe_gateway_catalog_live(uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.resolve_stripe_subscription_plan_live(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.get_stripe_portal_context_live(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_checkout_context_live(uuid,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_stripe_gateway_catalog_live(uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_stripe_subscription_plan_live(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_stripe_portal_context_live(uuid) TO service_role;
COMMIT;
