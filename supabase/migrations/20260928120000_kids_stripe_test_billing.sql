-- Kids is a separate Stripe TEST subscription. No client can write billing or
-- entitlement rows; signed webhooks are the only route to paid lesson access.
CREATE TABLE public.kids_stripe_prices (
  market_code text NOT NULL CHECK (market_code IN ('EG','INTL')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('month','year')),
  discounted boolean NOT NULL,
  currency_code text NOT NULL CHECK (currency_code IN ('egp','usd')),
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  gateway_product_id text NOT NULL,
  gateway_price_id text NOT NULL UNIQUE,
  PRIMARY KEY (market_code,billing_interval,discounted)
);
CREATE TABLE public.kids_stripe_subscriptions (
  parent_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_subscription_id text NOT NULL UNIQUE,
  gateway_customer_id text NOT NULL,
  gateway_price_id text NOT NULL REFERENCES public.kids_stripe_prices(gateway_price_id),
  status text NOT NULL,
  latest_paid_invoice_id text,
  paid_through timestamptz,
  last_event_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.kids_stripe_events (
  event_id text PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.kids_stripe_refunds (
  refund_id text PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id text NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor>0),
  status text NOT NULL
);
ALTER TABLE public.kids_stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_stripe_refunds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_stripe_prices,public.kids_stripe_subscriptions,public.kids_stripe_events
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.kids_stripe_refunds FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.kids_stripe_prices,public.kids_stripe_subscriptions,public.kids_stripe_events
  TO service_role;
GRANT ALL ON public.kids_stripe_refunds TO service_role;

CREATE FUNCTION public.get_kids_stripe_checkout_context(
  p_user_id uuid,p_market_code text,p_billing_interval text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_country text; v_email text; v_adult boolean; v_base integer;
  v_amount integer; v_currency text; v_customer text; v_price public.kids_stripe_prices%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_market_code NOT IN ('EG','INTL') OR p_billing_interval NOT IN ('month','year') THEN
    RAISE EXCEPTION 'INVALID_KIDS_SELECTION' USING ERRCODE='22023';
  END IF;
  SELECT request.country_code,account.email INTO v_country,v_email
    FROM public.kids_parent_access_requests request
    JOIN public.kids_parent_attestations attestation ON attestation.parent_id=request.parent_id
      AND attestation.country_code=request.country_code
    JOIN public.kids_consent_policies policy ON policy.id=attestation.policy_id
      AND policy.enabled AND policy.country_code=request.country_code
    JOIN public.kids_market_release market ON market.country_code=request.country_code
      AND market.accepts_child_data
    JOIN auth.users account ON account.id=request.parent_id
      AND account.email_confirmed_at IS NOT NULL AND account.email=request.parent_email
    WHERE request.parent_id=p_user_id AND request.status='approved' AND request.adult_confirmed
      AND EXISTS(SELECT 1 FROM public.kids_release_control
        WHERE singleton AND accepts_child_data);
  IF v_country IS NULL THEN RAISE EXCEPTION 'PARENT_CONSENT_REQUIRED' USING ERRCODE='42501'; END IF;
  IF (v_country='EG') IS DISTINCT FROM (p_market_code='EG') THEN
    RAISE EXCEPTION 'KIDS_MARKET_MISMATCH' USING ERRCODE='22023';
  END IF;
  SELECT EXISTS(
    SELECT 1 FROM billing.subscriptions s
    JOIN billing.plan_versions pv ON pv.id=s.plan_version_id
    JOIN billing.plan_catalog pc ON pc.id=pv.plan_id
    WHERE s.user_id=p_user_id AND pc.plan_key IN ('pro','pro_plus')
      AND s.access_state IN ('paid_active','canceled_at_period_end')
      AND s.current_period_end>now()
  ) INTO v_adult;
  v_currency:=CASE WHEN p_market_code='EG' THEN 'egp' ELSE 'usd' END;
  v_base:=CASE WHEN p_market_code='EG' THEN
    CASE WHEN p_billing_interval='month' THEN 19900 ELSE 199000 END
  ELSE CASE WHEN p_billing_interval='month' THEN 799 ELSE 7990 END END;
  v_amount:=CASE WHEN v_adult THEN (v_base*90+50)/100 ELSE v_base END;
  SELECT gateway_customer_id INTO v_customer FROM billing.gateway_customers
    WHERE user_id=p_user_id AND gateway_code='stripe_us' AND status='active';
  SELECT * INTO v_price FROM public.kids_stripe_prices
    WHERE market_code=p_market_code AND billing_interval=p_billing_interval
      AND discounted=v_adult;
  RETURN jsonb_build_object('amount_minor',v_amount,'currency_code',v_currency,
    'market_code',p_market_code,'billing_interval',p_billing_interval,
    'discounted',v_adult,'gateway_customer_id',v_customer,
    'gateway_product_id',v_price.gateway_product_id,'gateway_price_id',v_price.gateway_price_id,
    'email',v_email);
END;
$$;
REVOKE ALL ON FUNCTION public.get_kids_stripe_checkout_context(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_kids_stripe_checkout_context(uuid,text,text) TO service_role;

CREATE FUNCTION public.register_kids_stripe_customer(p_user_id uuid,p_customer_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_customer text;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_customer_id !~ '^cus_[A-Za-z0-9]+$' THEN RAISE EXCEPTION 'INVALID_CUSTOMER' USING ERRCODE='22023'; END IF;
  INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status)
    VALUES(p_user_id,'stripe_us',p_customer_id,'active')
    ON CONFLICT (user_id,gateway_code) DO UPDATE SET status='active'
    RETURNING gateway_customer_id INTO v_customer;
  RETURN v_customer;
END;
$$;
REVOKE ALL ON FUNCTION public.register_kids_stripe_customer(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_kids_stripe_customer(uuid,text) TO service_role;

CREATE FUNCTION public.register_kids_stripe_price(
  p_market_code text,p_billing_interval text,p_discounted boolean,
  p_currency_code text,p_amount_minor integer,p_product_id text,p_price_id text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_price text; v_expected integer;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_market_code NOT IN ('EG','INTL') OR p_billing_interval NOT IN ('month','year')
    OR p_discounted IS NULL OR p_currency_code IS DISTINCT FROM
      (CASE WHEN p_market_code='EG' THEN 'egp' ELSE 'usd' END)
    OR p_product_id !~ '^prod_[A-Za-z0-9]+$' OR p_price_id !~ '^price_[A-Za-z0-9]+$'
  THEN RAISE EXCEPTION 'INVALID_KIDS_PRICE' USING ERRCODE='22023'; END IF;
  v_expected:=CASE WHEN p_market_code='EG' THEN
    CASE WHEN p_billing_interval='month' THEN 19900 ELSE 199000 END
  ELSE CASE WHEN p_billing_interval='month' THEN 799 ELSE 7990 END END;
  IF p_discounted THEN v_expected:=(v_expected*90+50)/100; END IF;
  IF p_amount_minor IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION 'KIDS_PRICE_MISMATCH' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.kids_stripe_prices
    (market_code,billing_interval,discounted,currency_code,amount_minor,gateway_product_id,gateway_price_id)
  VALUES(p_market_code,p_billing_interval,p_discounted,p_currency_code,p_amount_minor,p_product_id,p_price_id)
  ON CONFLICT (market_code,billing_interval,discounted) DO NOTHING;
  SELECT gateway_price_id INTO v_price FROM public.kids_stripe_prices
    WHERE market_code=p_market_code AND billing_interval=p_billing_interval AND discounted=p_discounted;
  RETURN v_price;
END;
$$;
REVOKE ALL ON FUNCTION public.register_kids_stripe_price(text,text,boolean,text,integer,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_kids_stripe_price(text,text,boolean,text,integer,text,text)
  TO service_role;

CREATE FUNCTION public.apply_kids_stripe_event(
  p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,
  p_price_id text,p_status text,p_occurred_at timestamptz,p_paid boolean,
  p_paid_invoice_id text,p_period_start timestamptz,p_period_end timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_row public.kids_stripe_subscriptions%ROWTYPE; v_customer text;
  v_ref text:='stripe-test:'||p_subscription_id;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9_]+$'
    OR p_subscription_id IS NULL OR p_subscription_id !~ '^sub_[A-Za-z0-9_]+$'
    OR p_status NOT IN ('active','trialing','past_due','unpaid','canceled','incomplete','paused')
    OR p_occurred_at IS NULL OR p_occurred_at>now()+interval '5 minutes'
    OR NOT EXISTS(SELECT 1 FROM public.kids_stripe_prices WHERE gateway_price_id=p_price_id)
  THEN RAISE EXCEPTION 'INVALID_KIDS_EVENT' USING ERRCODE='22023'; END IF;
  SELECT gateway_customer_id INTO v_customer FROM billing.gateway_customers
    WHERE user_id=p_parent_id AND gateway_code='stripe_us' AND status='active';
  IF v_customer IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'KIDS_CUSTOMER_MISMATCH' USING ERRCODE='42501'; END IF;
  INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES(p_event_id,p_parent_id)
    ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO v_row FROM public.kids_stripe_subscriptions WHERE parent_id=p_parent_id FOR UPDATE;
  IF v_row.parent_id IS NOT NULL AND v_row.gateway_subscription_id<>p_subscription_id THEN
    IF v_row.status NOT IN ('canceled','unpaid','refunded') OR v_row.paid_through>now() THEN
      RAISE EXCEPTION 'KIDS_SUBSCRIPTION_ALREADY_BOUND' USING ERRCODE='23505'; END IF;
    DELETE FROM public.kids_stripe_subscriptions WHERE parent_id=p_parent_id;
    v_row:=NULL;
  END IF;
  IF v_row.last_event_at IS NOT NULL AND p_occurred_at<v_row.last_event_at THEN RETURN false; END IF;
  -- A refund of this invoice is final, even if a delayed paid event arrives.
  IF p_paid AND v_row.status='refunded' AND v_row.latest_paid_invoice_id=p_paid_invoice_id THEN
    RETURN false;
  END IF;
  IF p_paid AND v_row.paid_through IS NOT NULL AND p_period_end<v_row.paid_through THEN
    RETURN false;
  END IF;
  IF p_paid AND (p_status<>'active' OR p_paid_invoice_id IS NULL
    OR p_paid_invoice_id !~ '^in_[A-Za-z0-9_]+$'
    OR p_period_start IS NULL OR p_period_end IS NULL
    OR p_period_end<=p_period_start OR p_period_end<=now()) THEN
    RAISE EXCEPTION 'INVALID_KIDS_PAYMENT' USING ERRCODE='22023'; END IF;
  INSERT INTO public.kids_stripe_subscriptions(parent_id,gateway_subscription_id,
    gateway_customer_id,gateway_price_id,status,latest_paid_invoice_id,paid_through,last_event_at)
  VALUES(p_parent_id,p_subscription_id,p_customer_id,p_price_id,p_status,
    CASE WHEN p_paid THEN p_paid_invoice_id END,CASE WHEN p_paid THEN p_period_end END,p_occurred_at)
  ON CONFLICT(parent_id) DO UPDATE SET status=EXCLUDED.status,
    gateway_price_id=EXCLUDED.gateway_price_id,last_event_at=EXCLUDED.last_event_at,updated_at=now(),
    latest_paid_invoice_id=coalesce(EXCLUDED.latest_paid_invoice_id,public.kids_stripe_subscriptions.latest_paid_invoice_id),
    paid_through=coalesce(EXCLUDED.paid_through,public.kids_stripe_subscriptions.paid_through);
  IF p_paid THEN
    INSERT INTO public.kids_family_entitlements(parent_id,active_from,active_until,entitlement_reference)
      VALUES(p_parent_id,p_period_start,p_period_end,v_ref)
      ON CONFLICT(parent_id) DO UPDATE SET active_from=EXCLUDED.active_from,
        active_until=EXCLUDED.active_until,entitlement_reference=EXCLUDED.entitlement_reference
      WHERE public.kids_family_entitlements.entitlement_reference LIKE 'stripe-test:%'
        OR public.kids_family_entitlements.active_until<=now();
  ELSIF p_status IN ('canceled','unpaid') THEN
    DELETE FROM public.kids_family_entitlements
      WHERE parent_id=p_parent_id AND entitlement_reference=v_ref;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz)
  TO service_role;

CREATE FUNCTION public.apply_kids_stripe_refund(
  p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,
  p_invoice_id text,p_refund_id text,p_refund_amount integer,p_invoice_amount integer,p_refund_status text,
  p_occurred_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_row public.kids_stripe_subscriptions%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9_]+$'
    OR p_invoice_id IS NULL OR p_refund_id IS NULL OR p_refund_id !~ '^re_[A-Za-z0-9_]+$'
    OR p_refund_status NOT IN ('pending','requires_action','succeeded','failed','canceled')
    OR p_refund_amount<=0 OR p_invoice_amount<=0 OR p_refund_amount>p_invoice_amount
    OR p_occurred_at IS NULL OR p_occurred_at>now()+interval '5 minutes'
  THEN RAISE EXCEPTION 'INVALID_KIDS_REFUND' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_row FROM public.kids_stripe_subscriptions WHERE parent_id=p_parent_id FOR UPDATE;
  IF v_row.parent_id IS NULL OR v_row.gateway_subscription_id IS DISTINCT FROM p_subscription_id
    OR v_row.gateway_customer_id IS DISTINCT FROM p_customer_id
  THEN RAISE EXCEPTION 'KIDS_REFUND_SUBSCRIPTION_MISMATCH' USING ERRCODE='42501'; END IF;
  INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES(p_event_id,p_parent_id)
    ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.kids_stripe_refunds(refund_id,parent_id,invoice_id,amount_minor,status)
    VALUES(p_refund_id,p_parent_id,p_invoice_id,p_refund_amount,p_refund_status)
    ON CONFLICT(refund_id) DO UPDATE SET status=CASE
      WHEN public.kids_stripe_refunds.status='succeeded' THEN 'succeeded'
      ELSE EXCLUDED.status END
      WHERE public.kids_stripe_refunds.parent_id=EXCLUDED.parent_id
        AND public.kids_stripe_refunds.invoice_id=EXCLUDED.invoice_id
        AND public.kids_stripe_refunds.amount_minor=EXCLUDED.amount_minor;
  IF NOT FOUND THEN RAISE EXCEPTION 'KIDS_REFUND_MISMATCH' USING ERRCODE='42501'; END IF;
  IF v_row.latest_paid_invoice_id=p_invoice_id AND (
    SELECT coalesce(sum(amount_minor),0) FROM public.kids_stripe_refunds
    WHERE parent_id=p_parent_id AND invoice_id=p_invoice_id AND status='succeeded'
  )>=p_invoice_amount AND v_row.status<>'refunded' THEN
    UPDATE public.kids_stripe_subscriptions SET status='refunded',last_event_at=p_occurred_at,
      updated_at=now() WHERE parent_id=p_parent_id;
    DELETE FROM public.kids_family_entitlements
      WHERE parent_id=p_parent_id AND entitlement_reference='stripe-test:'||p_subscription_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz)
  TO service_role;

CREATE FUNCTION public.get_my_kids_subscription()
RETURNS TABLE(status text,paid_through timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT s.status,s.paid_through FROM public.kids_stripe_subscriptions s
    WHERE s.parent_id=(SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_my_kids_subscription() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_kids_subscription() TO authenticated;

CREATE FUNCTION public.get_kids_stripe_portal_context(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  SELECT jsonb_build_object('gateway_customer_id',s.gateway_customer_id,
    'gateway_subscription_id',s.gateway_subscription_id)
    INTO v_result FROM public.kids_stripe_subscriptions s
    WHERE s.parent_id=p_user_id AND s.status IN ('active','past_due','unpaid','paused');
  IF v_result IS NULL THEN RAISE EXCEPTION 'KIDS_SUBSCRIPTION_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_kids_stripe_portal_context(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_kids_stripe_portal_context(uuid) TO service_role;
