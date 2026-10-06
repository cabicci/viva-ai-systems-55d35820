BEGIN;
CREATE TABLE billing.academic_stripe_prices(
 market_code text NOT NULL CHECK(market_code IN ('EG','INTL')), billing_interval text NOT NULL CHECK(billing_interval IN ('month','year')),
 amount_minor bigint NOT NULL CHECK(amount_minor>0), currency_code text NOT NULL CHECK(currency_code IN ('egp','usd')),
 gateway_product_id text NOT NULL, gateway_price_id text NOT NULL UNIQUE,
 PRIMARY KEY(market_code,billing_interval,amount_minor));
CREATE TABLE billing.academic_stripe_subscriptions(
 user_id uuid NOT NULL, subscription_id text PRIMARY KEY, customer_id text NOT NULL, price_id text NOT NULL,
 status text NOT NULL, last_event_at timestamptz NOT NULL, paid_invoice_id text,
 starts_at timestamptz, ends_at timestamptz, refunded boolean NOT NULL DEFAULT false);
CREATE TABLE billing.academic_stripe_events(event_id text PRIMARY KEY,user_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),details jsonb NOT NULL DEFAULT '{}');
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['academic_stripe_prices','academic_stripe_subscriptions','academic_stripe_events'] LOOP
  EXECUTE format('ALTER TABLE billing.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON billing.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;


-- Existing after-expiry grants also consider a paid academic Stripe period.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('billing.commerce_next_start(uuid,text,timestamptz)'::regprocedure);
 IF position('SELECT greatest(p_start,' in d)=0 THEN RAISE EXCEPTION 'ACADEMIC_START_CONTRACT_CHANGED'; END IF;
 EXECUTE replace(d,'SELECT greatest(p_start,','SELECT greatest(p_start, coalesce((SELECT max(ends_at) FROM billing.academic_stripe_subscriptions WHERE user_id=p_user AND p_package=''academic'' AND status IN (''active'',''trialing'') AND NOT refunded),p_start),');
END $$;
CREATE FUNCTION public.get_academic_stripe_checkout_context(p_user_id uuid,p_market_code text,p_billing_interval text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e text; p jsonb; c text; r billing.academic_stripe_prices%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 e:=billing.commerce_assert_identity(p_user_id);
 IF NOT EXISTS(SELECT 1 FROM public.academic_courses WHERE enabled) THEN RAISE EXCEPTION 'ACADEMIC_UNAVAILABLE'; END IF;
 p:=billing.commerce_price('academic',p_market_code,p_billing_interval);
 SELECT gateway_customer_id INTO c FROM billing.gateway_customers WHERE user_id=p_user_id AND gateway_code='stripe_us' AND status='active';
 SELECT * INTO r FROM billing.academic_stripe_prices WHERE market_code=p_market_code AND billing_interval=p_billing_interval AND amount_minor=(p->>'original_minor')::bigint;
 RETURN jsonb_build_object('email',e,'market_code',p_market_code,'billing_interval',p_billing_interval,'amount_minor',(p->>'original_minor')::bigint,
  'currency_code',lower(p->>'currency'),'discounted',false,'gateway_customer_id',c,'gateway_price_id',r.gateway_price_id,'gateway_product_id',r.gateway_product_id);
END $$;
CREATE FUNCTION public.register_academic_stripe_price(p_market_code text,p_billing_interval text,p_discounted boolean,p_currency_code text,p_amount_minor integer,p_product_id text,p_price_id text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q jsonb; r text; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 q:=billing.commerce_price('academic',p_market_code,p_billing_interval);
 IF p_discounted IS DISTINCT FROM false OR p_amount_minor IS DISTINCT FROM (q->>'original_minor')::integer
  OR p_currency_code IS DISTINCT FROM lower(q->>'currency') OR p_product_id !~ '^prod_[A-Za-z0-9]+$' OR p_price_id !~ '^price_[A-Za-z0-9]+$' THEN RAISE EXCEPTION 'ACADEMIC_PRICE_MISMATCH'; END IF;
 INSERT INTO billing.academic_stripe_prices VALUES(p_market_code,p_billing_interval,p_amount_minor,p_currency_code,p_product_id,p_price_id)
 ON CONFLICT(market_code,billing_interval,amount_minor) DO UPDATE SET gateway_product_id=billing.academic_stripe_prices.gateway_product_id RETURNING gateway_price_id INTO r;
 RETURN r;
END $$;
CREATE FUNCTION public.apply_academic_stripe_event(p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,p_price_id text,p_status text,p_occurred_at timestamptz,p_paid boolean,p_paid_invoice_id text,p_period_start timestamptz,p_period_end timestamptz) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.academic_stripe_subscriptions%ROWTYPE; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF billing.lc09_financial_expired(p_parent_id) THEN RETURN false; END IF;
 PERFORM billing.account_deletion_blocked(p_parent_id);
 IF p_event_id IS NULL OR p_parent_id IS NULL OR p_subscription_id IS NULL OR p_paid IS NULL OR p_status IS NULL OR p_occurred_at IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9]+$' OR p_subscription_id !~ '^sub_[A-Za-z0-9]+$'
  OR NOT EXISTS(SELECT 1 FROM billing.gateway_customers WHERE user_id=p_parent_id AND gateway_code='stripe_us' AND gateway_customer_id=p_customer_id)
  OR NOT EXISTS(SELECT 1 FROM billing.academic_stripe_prices WHERE gateway_price_id=p_price_id)
  OR p_status NOT IN ('active','trialing','past_due','unpaid','paused','incomplete','incomplete_expired','canceled') THEN RAISE EXCEPTION 'ACADEMIC_SUBSCRIPTION_MISMATCH'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('academic-stripe:'||p_subscription_id,0));
 SELECT * INTO r FROM billing.academic_stripe_subscriptions WHERE subscription_id=p_subscription_id FOR UPDATE;
 IF FOUND AND (r.user_id<>p_parent_id OR r.customer_id<>p_customer_id) THEN RAISE EXCEPTION 'ACADEMIC_OWNER_MISMATCH'; END IF;
 IF EXISTS(SELECT 1 FROM billing.academic_stripe_events WHERE event_id=p_event_id) THEN RETURN false; END IF;
 IF p_paid AND (p_paid_invoice_id IS NULL OR p_paid_invoice_id !~ '^in_[A-Za-z0-9]+$' OR p_period_start IS NULL OR p_period_end IS NULL OR p_period_end<=p_period_start) THEN RAISE EXCEPTION 'ACADEMIC_PAYMENT_EVIDENCE_REQUIRED'; END IF;
 INSERT INTO billing.academic_stripe_events(event_id,user_id,details) VALUES(p_event_id,p_parent_id,jsonb_build_object('type','subscription','subscription',p_subscription_id,'invoice',p_paid_invoice_id,'price',p_price_id,'status',p_status,'paid',p_paid,'occurred_at',p_occurred_at));
 IF NOT billing.commerce_account_allowed(p_parent_id) THEN RETURN false; END IF;
 IF r.last_event_at>p_occurred_at OR (p_paid AND r.ends_at>p_period_end) OR (r.refunded AND r.paid_invoice_id=p_paid_invoice_id) THEN RETURN false; END IF;
 INSERT INTO billing.academic_stripe_subscriptions(user_id,subscription_id,customer_id,price_id,status,last_event_at,paid_invoice_id,starts_at,ends_at)
 VALUES(p_parent_id,p_subscription_id,p_customer_id,p_price_id,p_status,p_occurred_at,CASE WHEN p_paid THEN p_paid_invoice_id END,CASE WHEN p_paid THEN p_period_start END,CASE WHEN p_paid THEN p_period_end END)
 ON CONFLICT(subscription_id) DO UPDATE SET price_id=EXCLUDED.price_id,status=EXCLUDED.status,last_event_at=EXCLUDED.last_event_at,
  paid_invoice_id=CASE WHEN p_paid THEN EXCLUDED.paid_invoice_id ELSE billing.academic_stripe_subscriptions.paid_invoice_id END,
  starts_at=CASE WHEN p_paid THEN EXCLUDED.starts_at ELSE billing.academic_stripe_subscriptions.starts_at END,
  ends_at=CASE WHEN p_paid THEN EXCLUDED.ends_at ELSE billing.academic_stripe_subscriptions.ends_at END,
  refunded=CASE WHEN p_paid THEN false ELSE billing.academic_stripe_subscriptions.refunded END;
 RETURN true;
END $$;
CREATE FUNCTION public.apply_academic_stripe_refund(p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,p_invoice_id text,p_refund_id text,p_refund_amount integer,p_invoice_amount integer,p_refund_status text,p_occurred_at timestamptz) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE r billing.academic_stripe_subscriptions%ROWTYPE; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('academic-stripe:'||p_subscription_id,0));
 SELECT * INTO r FROM billing.academic_stripe_subscriptions WHERE subscription_id=p_subscription_id FOR UPDATE;
 IF NOT FOUND OR r.user_id<>p_parent_id OR r.customer_id<>p_customer_id THEN RAISE EXCEPTION 'ACADEMIC_OWNER_MISMATCH'; END IF;
 INSERT INTO billing.academic_stripe_events(event_id,user_id,details) VALUES(p_event_id,p_parent_id,jsonb_build_object('type','refund','subscription',p_subscription_id,'invoice',p_invoice_id,'refund',p_refund_id,'refund_amount',p_refund_amount,'invoice_amount',p_invoice_amount,'status',p_refund_status,'occurred_at',p_occurred_at)) ON CONFLICT DO NOTHING;
 IF p_refund_status='succeeded' AND p_invoice_amount>0 AND p_refund_amount>=p_invoice_amount AND p_invoice_id=r.paid_invoice_id THEN
  UPDATE billing.academic_stripe_subscriptions SET refunded=true,status='canceled' WHERE subscription_id=p_subscription_id;
  RETURN true;
 END IF;
 RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.get_academic_stripe_checkout_context(uuid,text,text),public.register_academic_stripe_price(text,text,boolean,text,integer,text,text),
 public.apply_academic_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz),
 public.apply_academic_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_academic_stripe_checkout_context(uuid,text,text),public.register_academic_stripe_price(text,text,boolean,text,integer,text,text),
 public.apply_academic_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz),
 public.apply_academic_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz) TO service_role;
CREATE OR REPLACE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND billing.commerce_account_allowed(auth.uid())
 AND EXISTS(SELECT 1 FROM public.academic_courses c JOIN public.academic_lesson_content l ON l.course_id=c.id
 WHERE c.id=p_course AND c.enabled AND l.lesson_id=p_lesson AND l.locale=p_locale AND l.approved
 AND (l.introductory OR public.has_role(auth.uid(),'admin'::public.app_role)
 OR EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.user_id=auth.uid() AND e.package='academic'
 AND e.revoked_at IS NULL AND e.starts_at<=now() AND e.ends_at>now()
 AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled))
 OR EXISTS(SELECT 1 FROM billing.academic_stripe_subscriptions s WHERE s.user_id=auth.uid()
 AND s.status IN ('active','trialing') AND NOT s.refunded AND s.starts_at<=now() AND s.ends_at>now())));
$$;

DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.academic_command(text,text,text,text,jsonb)'::regprocedure);
 EXECUTE replace(d,'''progress'',coalesce(','''stripe'',EXISTS(SELECT 1 FROM billing.academic_stripe_subscriptions WHERE user_id=u AND status IN (''active'',''trialing'',''past_due'',''unpaid'',''paused'')),''progress'',coalesce(');
END $$;
COMMIT;
