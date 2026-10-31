-- Stripe Live phase 2: every existing billing RPC becomes environment-aware.
-- The environment comes ONLY from the server-side caller: the PostgREST request
-- header x-masaarat-stripe-environment (sent by the Live server module with the
-- service key) or the transaction GUC masaarat.stripe_environment. Absent = test,
-- so every existing Test path behaves exactly as before.

CREATE OR REPLACE FUNCTION billing.explicit_stripe_environment()
RETURNS text LANGUAGE plpgsql STABLE SET search_path = '' AS $$
DECLARE v text; h text;
BEGIN
  v := nullif(current_setting('masaarat.stripe_environment', true), '');
  IF v IS NULL THEN
    h := nullif(current_setting('request.headers', true), '');
    IF h IS NOT NULL THEN v := nullif(h::json->>'x-masaarat-stripe-environment', ''); END IF;
  END IF;
  IF v IS NULL THEN RETURN NULL; END IF;
  IF v NOT IN ('test','live') THEN RAISE EXCEPTION 'STRIPE_ENVIRONMENT_INVALID' USING ERRCODE = '22023'; END IF;
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION billing.current_stripe_environment()
RETURNS text LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT coalesce(billing.explicit_stripe_environment(), 'test')
$$;

CREATE OR REPLACE FUNCTION billing.stripe_gateway_code()
RETURNS text LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT CASE billing.current_stripe_environment() WHEN 'live' THEN 'stripe_us_live' ELSE 'stripe_us' END
$$;

REVOKE ALL ON FUNCTION billing.explicit_stripe_environment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION billing.current_stripe_environment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION billing.stripe_gateway_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION billing.explicit_stripe_environment() TO service_role;
GRANT EXECUTE ON FUNCTION billing.current_stripe_environment() TO service_role;
GRANT EXECUTE ON FUNCTION billing.stripe_gateway_code() TO service_role;

-- Separate core gateway code for Live.
ALTER TABLE billing.gateway_price_mappings DROP CONSTRAINT gateway_price_mappings_gateway_check;
ALTER TABLE billing.gateway_price_mappings ADD CONSTRAINT gateway_price_mappings_gateway_check
  CHECK (gateway_code = ANY (ARRAY['stripe_us','stripe_us_live','paymob_eg','future']));
ALTER TABLE billing.gateway_customers DROP CONSTRAINT gateway_customers_gateway_check;
ALTER TABLE billing.gateway_customers ADD CONSTRAINT gateway_customers_gateway_check
  CHECK (gateway_code = ANY (ARRAY['stripe_us','stripe_us_live','paymob_eg','future']));
ALTER TABLE billing.gateway_subscriptions DROP CONSTRAINT gateway_subscriptions_gateway_check;
ALTER TABLE billing.gateway_subscriptions ADD CONSTRAINT gateway_subscriptions_gateway_check
  CHECK (gateway_code = ANY (ARRAY['stripe_us','stripe_us_live','paymob_eg','future']));

-- Row environment follows the caller; mixing is rejected in both directions.
CREATE OR REPLACE FUNCTION billing.guard_stripe_environment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = billing, public AS $$
DECLARE v_env text := billing.explicit_stripe_environment(); v_code text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stripe_environment IS DISTINCT FROM OLD.stripe_environment THEN
    RAISE EXCEPTION 'STRIPE_ENVIRONMENT_IMMUTABLE' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'INSERT' AND NEW.stripe_environment IS DISTINCT FROM coalesce(v_env, 'test') THEN
    RAISE EXCEPTION 'STRIPE_ENVIRONMENT_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'UPDATE' AND v_env IS NOT NULL AND OLD.stripe_environment <> v_env THEN
    RAISE EXCEPTION 'STRIPE_ENVIRONMENT_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  v_code := to_jsonb(NEW)->>'gateway_code';
  IF (v_code = 'stripe_us' AND NEW.stripe_environment <> 'test')
     OR (v_code = 'stripe_us_live' AND NEW.stripe_environment <> 'live') THEN
    RAISE EXCEPTION 'STRIPE_GATEWAY_ENVIRONMENT_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'billing.gateway_price_mappings','billing.gateway_customers','billing.gateway_subscriptions',
    'billing.webhook_events','billing.payment_transactions','billing.refunds',
    'billing.academic_stripe_prices','billing.academic_stripe_subscriptions','billing.academic_stripe_events',
    'billing.technical_stripe_prices','billing.technical_stripe_subscriptions','billing.technical_stripe_events',
    'public.kids_stripe_prices','public.kids_stripe_subscriptions','public.kids_stripe_events','public.kids_stripe_refunds'
  ] LOOP
    EXECUTE format('ALTER TABLE %s ALTER COLUMN stripe_environment SET DEFAULT billing.current_stripe_environment()', t);
  END LOOP;
END $$;

-- Live prices and Kids subscriptions coexist with Test rows (Test rows untouched).
ALTER TABLE public.kids_stripe_prices DROP CONSTRAINT kids_stripe_prices_pkey;
ALTER TABLE public.kids_stripe_prices ADD CONSTRAINT kids_stripe_prices_pkey
  PRIMARY KEY (market_code, billing_interval, discounted, stripe_environment);
ALTER TABLE billing.academic_stripe_prices DROP CONSTRAINT academic_stripe_prices_pkey;
ALTER TABLE billing.academic_stripe_prices ADD CONSTRAINT academic_stripe_prices_pkey
  PRIMARY KEY (market_code, billing_interval, amount_minor, stripe_environment);
ALTER TABLE billing.technical_stripe_prices DROP CONSTRAINT technical_stripe_prices_pkey;
ALTER TABLE billing.technical_stripe_prices ADD CONSTRAINT technical_stripe_prices_pkey
  PRIMARY KEY (market_code, billing_interval, amount_minor, stripe_environment);
ALTER TABLE public.kids_stripe_subscriptions DROP CONSTRAINT kids_stripe_subscriptions_pkey;
ALTER TABLE public.kids_stripe_subscriptions ADD CONSTRAINT kids_stripe_subscriptions_pkey
  PRIMARY KEY (parent_id, stripe_environment);

-- Mechanical, asserted rewrite of existing RPC bodies. In Test context every
-- substituted expression evaluates to the previous literal.
DO $$
DECLARE
  r record; v_oid oid; v_def text; v_new text; v_hits int;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    -- core + shared customers: gateway code
    ('public','apply_academic_stripe_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','apply_kids_stripe_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','apply_kids_stripe_refund', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','apply_stripe_refund_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','apply_stripe_refund_event', $p$'mode',\s*'test'$p$, $p$'mode',billing.current_stripe_environment()$p$, true),
    ('public','apply_stripe_refund_event', $p$IS DISTINCT FROM 'test'$p$, 'IS DISTINCT FROM billing.current_stripe_environment()', true),
    ('public','apply_stripe_refund_event', $p$'livemode',false$p$, $p$'livemode',(billing.current_stripe_environment()='live')$p$, true),
    ('public','apply_stripe_webhook_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','apply_technical_stripe_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','get_academic_stripe_checkout_context', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','get_technical_stripe_checkout_context', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_previous_apply_kids_stripe_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_previous_apply_stripe_webhook_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_previous_apply_stripe_webhook_event', $p$'mode',\s*'test'$p$, $p$'mode',billing.current_stripe_environment()$p$, true),
    ('public','lc09_previous_get_kids_stripe_checkout_context', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_previous_get_stripe_checkout_context', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_previous_get_stripe_portal_context', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_previous_prepare_stripe_checkout', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_previous_prepare_stripe_checkout', $p$'mode',\s*'test'$p$, $p$'mode',billing.current_stripe_environment()$p$, true),
    ('public','lc09_previous_register_kids_stripe_customer', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_retained_apply_kids_stripe_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_retained_apply_stripe_webhook_event', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','lc09_retained_apply_stripe_webhook_event', $p$'mode','test'$p$, $p$'mode',billing.current_stripe_environment()$p$, true),
    ('public','register_stripe_gateway_catalog', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    ('public','register_stripe_gateway_catalog', $p$'mode',\s*'test'$p$, $p$'mode',billing.current_stripe_environment()$p$, true),
    ('public','resolve_stripe_subscription_plan', $p$'stripe_us'$p$, 'billing.stripe_gateway_code()', true),
    -- separate price rows per environment
    ('public','register_kids_stripe_price', $p$FROM public\.kids_stripe_prices(\s+)WHERE $p$, 'FROM public.kids_stripe_prices\1WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','register_kids_stripe_price', $p$ON CONFLICT \(market_code,billing_interval,discounted\)$p$, 'ON CONFLICT (market_code,billing_interval,discounted,stripe_environment)', true),
    ('public','register_academic_stripe_price', $p$ON CONFLICT\(market_code,billing_interval,amount_minor\)$p$, 'ON CONFLICT(market_code,billing_interval,amount_minor,stripe_environment)', true),
    ('public','register_technical_stripe_price', $p$ON CONFLICT\(market_code,billing_interval,amount_minor\)$p$, 'ON CONFLICT(market_code,billing_interval,amount_minor,stripe_environment)', true),
    ('public','register_academic_assistant_stripe_price', $p$FROM billing\.academic_stripe_prices WHERE $p$, 'FROM billing.academic_stripe_prices WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','get_academic_stripe_checkout_context', $p$FROM billing\.academic_stripe_prices WHERE $p$, 'FROM billing.academic_stripe_prices WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','get_academic_assistant_stripe_checkout_context', $p$FROM billing\.academic_stripe_prices(\s+)WHERE $p$, 'FROM billing.academic_stripe_prices\1WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','get_technical_stripe_checkout_context', $p$FROM billing\.technical_stripe_prices WHERE $p$, 'FROM billing.technical_stripe_prices WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','lc09_previous_get_kids_stripe_checkout_context', $p$FROM public\.kids_stripe_prices(\s+)WHERE $p$, 'FROM public.kids_stripe_prices\1WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','lc09_previous_apply_kids_stripe_event', $p$FROM public\.kids_stripe_prices WHERE $p$, 'FROM public.kids_stripe_prices WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','apply_academic_stripe_event', $p$FROM billing\.academic_stripe_prices WHERE $p$, 'FROM billing.academic_stripe_prices WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    ('public','apply_technical_stripe_event', $p$FROM billing\.technical_stripe_prices WHERE $p$, 'FROM billing.technical_stripe_prices WHERE stripe_environment=billing.current_stripe_environment() AND ', true),
    -- Kids subscription rows per environment
    ('public','lc09_previous_apply_kids_stripe_event', $p$(FROM public\.kids_stripe_subscriptions WHERE parent_id=p_parent_id)$p$, '\1 AND stripe_environment=billing.current_stripe_environment()', true),
    ('public','lc09_previous_apply_kids_stripe_event', $p$ON CONFLICT\(parent_id\) DO UPDATE SET status=EXCLUDED\.status$p$, 'ON CONFLICT(parent_id,stripe_environment) DO UPDATE SET status=EXCLUDED.status', true),
    ('public','lc09_previous_apply_kids_stripe_event', $p$LIKE 'stripe-test:%'$p$, $p$LIKE 'stripe-%'$p$, true),
    ('public','lc09_previous_apply_kids_stripe_event', $p$'stripe-test:'$p$, $p$('stripe-'||billing.current_stripe_environment()||':')$p$, true),
    ('public','lc09_previous_apply_kids_stripe_refund', $p$(FROM public\.kids_stripe_subscriptions WHERE parent_id=p_parent_id)$p$, '\1 AND stripe_environment=billing.current_stripe_environment()', true),
    ('public','lc09_previous_apply_kids_stripe_refund', $p$(UPDATE public\.kids_stripe_subscriptions SET [^;]*WHERE parent_id=p_parent_id)$p$, '\1 AND stripe_environment=billing.current_stripe_environment()', true),
    ('public','lc09_previous_apply_kids_stripe_refund', $p$'stripe-test:'$p$, $p$('stripe-'||billing.current_stripe_environment()||':')$p$, true),
    ('public','lc09_previous_get_kids_stripe_portal_context', $p$(FROM public\.kids_stripe_subscriptions s\s+WHERE s\.parent_id=p_user_id)$p$, '\1 AND s.stripe_environment=billing.current_stripe_environment()', true),
    ('public','get_academic_stripe_portal_context', $p$FROM billing\.academic_stripe_subscriptions WHERE user_id=p_user_id$p$, 'FROM billing.academic_stripe_subscriptions WHERE stripe_environment=billing.current_stripe_environment() AND user_id=p_user_id', true),
    ('public','get_technical_stripe_portal_context', $p$FROM billing\.technical_stripe_subscriptions WHERE user_id=p_user_id$p$, 'FROM billing.technical_stripe_subscriptions WHERE stripe_environment=billing.current_stripe_environment() AND user_id=p_user_id', true)
  ) AS x(schema_name, fn, pattern, replacement, required)
  LOOP
    SELECT p.oid INTO STRICT v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = r.schema_name AND p.proname = r.fn;
    v_def := pg_get_functiondef(v_oid);
    SELECT count(*) INTO v_hits FROM regexp_matches(v_def, r.pattern, 'g');
    IF v_hits = 0 AND r.required THEN
      RAISE EXCEPTION 'LIVE_REWRITE_PATTERN_MISSING %.%: %', r.schema_name, r.fn, r.pattern;
    END IF;
    v_new := regexp_replace(v_def, r.pattern, r.replacement, 'g');
    EXECUTE v_new;
  END LOOP;
END $$;

-- Readers: prefer the Live row when both exist; label Live access.
CREATE OR REPLACE FUNCTION public.lc09_previous_get_my_kids_subscription()
 RETURNS TABLE(status text, paid_through timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT s.status,s.paid_through FROM public.kids_stripe_subscriptions s
    WHERE s.parent_id=(SELECT auth.uid())
    ORDER BY (s.stripe_environment='live') DESC LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.lc09_previous_get_my_kids_access_status()
 RETURNS TABLE(access_source text, active_until timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT CASE WHEN e.entitlement_reference LIKE 'stripe-test:%' THEN 'stripe_test'
      WHEN e.entitlement_reference LIKE 'stripe-live:%' THEN 'stripe_live'
      ELSE 'test_grant' END,e.active_until
  FROM public.kids_family_entitlements e
  WHERE e.parent_id=(SELECT auth.uid()) AND e.active_from<=now() AND e.active_until>now();
$function$;
