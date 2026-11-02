-- Custom SQL migration file, put your code below! --
-- Owner-approved commercial policy. Drizzle is the sole migration runner.
-- Existing source/access/payment controls remain authoritative. No provider calls.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE billing.commercial_policy_release (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 activated_at timestamptz NOT NULL DEFAULT now(), version text NOT NULL DEFAULT '2026-11-02'
);
INSERT INTO billing.commercial_policy_release(singleton) VALUES(true);
CREATE TABLE billing.commercial_legacy_terms (
 source_key text PRIMARY KEY, user_id uuid NOT NULL,
 first_new_period_at timestamptz NOT NULL, monthly_units integer NOT NULL,
 per_lesson_units integer, price_reference jsonb NOT NULL DEFAULT '{}'
);
-- Freeze the installed policy before any later catalogue publication. Never
-- rewrite subscription prices or reset a subscriber's existing allowance.
INSERT INTO billing.commercial_legacy_terms
SELECT 'ai:'||s.id,s.user_id,s.current_period_end,coalesce(l.assistant_runtime_general_monthly_quota,0),l.assistant_runtime_per_lesson_quota,
 jsonb_build_object('plan_version_id',s.plan_version_id,'market_price_id',s.market_price_id)
FROM billing.subscriptions s JOIN billing.plan_versions v ON v.id=s.plan_version_id JOIN billing.plan_catalog c ON c.id=v.plan_id
JOIN billing.entitlement_policy_versions l ON l.policy_key=c.plan_key AND l.status='published' AND l.effective_from<=now() AND (l.effective_to IS NULL OR l.effective_to>now())
WHERE s.access_state IN ('paid_active','canceled_at_period_end') AND s.current_period_end>now();
INSERT INTO billing.commercial_legacy_terms
SELECT 'academic:'||s.subscription_id,s.user_id,s.ends_at,
 CASE WHEN p.includes_assistant THEN coalesce(q.assistant_runtime_general_monthly_quota,0) ELSE 0 END,
 CASE WHEN p.includes_assistant THEN q.assistant_runtime_per_lesson_quota ELSE NULL END,jsonb_build_object('price_id',s.price_id)
FROM billing.academic_stripe_subscriptions s JOIN billing.academic_stripe_prices p ON p.gateway_price_id=s.price_id
CROSS JOIN LATERAL (SELECT assistant_runtime_general_monthly_quota,assistant_runtime_per_lesson_quota
 FROM billing.entitlement_policy_versions WHERE policy_key='pro_plus' AND status='published'
 AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now())) q
WHERE s.ends_at>now() AND NOT s.refunded
UNION ALL SELECT 'technical:'||subscription_id,user_id,ends_at,2147483647,NULL,jsonb_build_object('price_id',price_id)
FROM billing.technical_stripe_subscriptions WHERE ends_at>now() AND NOT refunded
UNION ALL SELECT 'kids:'||parent_id,parent_id,active_until,2147483647,NULL,'{}'::jsonb
FROM public.kids_family_entitlements WHERE active_until>now();
INSERT INTO billing.commercial_legacy_terms
SELECT 'commerce:'||e.id,e.user_id,e.ends_at,
 CASE WHEN e.package IN ('kids','technical') THEN 2147483647
 WHEN e.package='academic' AND NOT EXISTS(SELECT 1 FROM public.academic_assistant_course_grants WHERE entitlement_id=e.id) THEN 0
 ELSE coalesce((SELECT p.assistant_runtime_general_monthly_quota FROM billing.entitlement_policy_versions p WHERE p.policy_key=CASE WHEN e.package='academic' THEN 'pro_plus' ELSE e.package END
  AND p.status='published' AND p.effective_from<=now() AND (p.effective_to IS NULL OR p.effective_to>now())),0) END,
 (SELECT p.assistant_runtime_per_lesson_quota FROM billing.entitlement_policy_versions p WHERE p.policy_key=CASE WHEN e.package='academic' THEN 'pro_plus' ELSE e.package END
  AND p.status='published' AND p.effective_from<=now() AND (p.effective_to IS NULL OR p.effective_to>now())),
 jsonb_build_object('package',e.package)
FROM billing.commerce_entitlements e WHERE e.revoked_at IS NULL AND e.starts_at<=now() AND e.ends_at>now();

CREATE TABLE billing.commercial_purchases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('lifetime_course','question_topup')),
 area text, course text, child_id uuid, wallet_scope text NOT NULL CHECK(wallet_scope IN ('account','family')),
 amount_minor integer NOT NULL CHECK(amount_minor>=0), currency text NOT NULL CHECK(currency='EGP'),
 quantity integer NOT NULL DEFAULT 100 CHECK(quantity=100),
 request_id uuid NOT NULL, parameters jsonb NOT NULL,
 session_id text UNIQUE, customer_id text, price_id text, product_id text,
 payment_id text UNIQUE, provider_event_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','fulfilled','held','expired')),
 held_at timestamptz, hold_reason text,
 UNIQUE(user_id,request_id),
 CHECK(state='held' OR (kind='lifetime_course' AND area IN ('ai','academic','technical','kids') AND course IS NOT NULL
   AND ((area='kids' AND child_id IS NOT NULL AND wallet_scope='family') OR (area<>'kids' AND child_id IS NULL AND wallet_scope='account')))
 OR (kind='question_topup' AND area IS NULL AND course IS NULL AND child_id IS NULL))
);
CREATE TABLE billing.commercial_catalogue (
 kind text PRIMARY KEY, amount_minor integer NOT NULL, currency text NOT NULL,
 price_id text NOT NULL UNIQUE, product_id text NOT NULL UNIQUE
);
INSERT INTO billing.commercial_catalogue VALUES
 ('lifetime_course',7500,'EGP','price_1UXJ6GJUat05km9WKXP9ATsJ','prod_masaarat_lifetime_curriculum_v1'),
 ('question_topup',5000,'EGP','price_1UXJ6JJUat05km9WDjixVjfG','prod_masaarat_question_topup_100_v1');
CREATE INDEX commercial_purchase_owner ON billing.commercial_purchases(user_id,state);
CREATE UNIQUE INDEX commercial_lifetime_once ON billing.commercial_purchases(user_id,area,course,coalesce(child_id,'00000000-0000-0000-0000-000000000000'::uuid))
 WHERE kind='lifetime_course' AND state IN ('pending','fulfilled');
CREATE TABLE billing.commercial_payment_holds (
 event_id text PRIMARY KEY, session_id text, payment_id text, reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(session_id IS NOT NULL OR payment_id IS NOT NULL)
);
CREATE TABLE billing.assistant_allowance_periods (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 source_key text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 unit_limit integer NOT NULL CHECK(unit_limit>=0), used integer NOT NULL DEFAULT 0 CHECK(used>=0),
 reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0),
 UNIQUE(user_id,source_key,starts_at), CHECK(ends_at>starts_at)
);
CREATE TABLE billing.assistant_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,request_id uuid NOT NULL,
 fingerprint text NOT NULL CHECK(fingerprint ~ '^[a-f0-9]{64}$'),
 area text NOT NULL,course text NOT NULL,lesson text NOT NULL,locale text NOT NULL,child_id uuid,
 wallet_scope text NOT NULL, allowance_id uuid REFERENCES billing.assistant_allowance_periods(id),
 funding text NOT NULL CHECK(funding IN ('monthly','purchased','review','unfunded')),
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','settled')),
 outcome text CHECK(outcome IN ('answered','insufficient','out_of_scope','system_failure')),
 charged_units integer CHECK(charged_units IN (0,1)), response jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),settled_at timestamptz,
 lease_until timestamptz NOT NULL DEFAULT now()+interval '5 minutes',
 UNIQUE(user_id,request_id)
);
CREATE INDEX assistant_requests_pending ON billing.assistant_requests(user_id,wallet_scope) WHERE state='reserved';
CREATE INDEX assistant_requests_rate ON billing.assistant_requests(user_id,area,course,created_at DESC);
CREATE INDEX assistant_requests_response_expiry ON billing.assistant_requests(settled_at) WHERE response IS NOT NULL;
CREATE TABLE billing.assistant_outside_days (
 user_id uuid NOT NULL,day date NOT NULL,attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),PRIMARY KEY(user_id,day)
);
CREATE TABLE billing.assistant_provider_attempts (
 request_id uuid NOT NULL REFERENCES billing.assistant_requests(id) ON DELETE CASCADE,
 attempt_id uuid NOT NULL,model text NOT NULL,status text NOT NULL CHECK(status IN ('started','succeeded','failed')),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(request_id,attempt_id)
);
CREATE TABLE billing.assistant_legacy_usage (
 user_id uuid PRIMARY KEY, units integer NOT NULL, source_key text,
 expires_at timestamptz NOT NULL
);
INSERT INTO billing.assistant_legacy_usage(user_id,units,expires_at)
SELECT user_id,sum(used_count+reserved_count)::integer,max(period_end)
FROM billing.entitlement_usage WHERE usage_category='ai_assistant' AND period_start<=now() AND period_end>now()
GROUP BY user_id;
ALTER TABLE billing.ai_topup_purchases ALTER COLUMN expires_at DROP NOT NULL;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['commercial_catalogue','commercial_policy_release','commercial_legacy_terms','commercial_purchases','commercial_payment_holds',
 'assistant_allowance_periods','assistant_requests','assistant_outside_days','assistant_provider_attempts','assistant_legacy_usage'] LOOP
  EXECUTE format('ALTER TABLE billing.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON billing.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;

CREATE FUNCTION billing.commercial_require_service() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'COMMERCIAL_SERVICE_ONLY' USING ERRCODE='42501'; END IF; END $$;
CREATE FUNCTION billing.commercial_lock(p_user uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- Same lifecycle/checkout lock as established Live writers, then one account
 -- lock for all wallets, children, daily limits and fulfillment transactions.
 PERFORM pg_advisory_xact_lock(hashtextextended('account-lifecycle:'||p_user::text,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('stripe-checkout:'||p_user::text,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('live-risk-user:'||p_user::text,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('commercial-account:'||p_user::text,0));
END $$;
CREATE FUNCTION billing.commercial_account_allowed(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_user IS NOT NULL AND billing.commerce_account_allowed(p_user)
 AND EXISTS(SELECT 1 FROM auth.users WHERE id=p_user AND email_confirmed_at IS NOT NULL);
$$;
CREATE FUNCTION billing.commercial_curricula() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog) THEN
 jsonb_build_array(jsonb_build_object('area','ai','course','ai','title','AI')) ELSE '[]'::jsonb END
 || CASE WHEN EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND lesson_access_enabled AND accepts_child_data)
 AND EXISTS(SELECT 1 FROM public.kids_content_approvals) THEN jsonb_build_array(jsonb_build_object('area','kids','course','kids','title','Kids')) ELSE '[]'::jsonb END
 || CASE WHEN EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled)
 AND EXISTS(SELECT 1 FROM public.technical_lesson_content) THEN jsonb_build_array(jsonb_build_object('area','technical','course','furniture','title','Technical — furniture')) ELSE '[]'::jsonb END
 || coalesce((SELECT jsonb_agg(jsonb_build_object('area','academic','course',id,'title',coalesce(titles->>'ar-EG',titles->>'en',id)) ORDER BY id)
 FROM public.academic_courses c WHERE enabled AND EXISTS(SELECT 1 FROM public.academic_lesson_content l WHERE l.course_id=c.id AND l.approved)),'[]'::jsonb);
$$;
CREATE FUNCTION public.list_commercial_purchase_options(p_user_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commercial_require_service();
 IF NOT billing.commercial_account_allowed(p_user_id) THEN RAISE EXCEPTION 'COMMERCIAL_ACCOUNT_DENIED'; END IF;
 RETURN jsonb_build_object('curricula',billing.commercial_curricula(),'children',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',coalesce(to_jsonb(p)->>'display_name',to_jsonb(p)->>'nickname',to_jsonb(p)->>'name','Child')) ORDER BY id)
 FROM public.kids_profiles p WHERE parent_id=p_user_id),'[]'::jsonb));
END $$;
CREATE FUNCTION billing.commercial_selection_valid(p_user uuid,p_area text,p_course text,p_child uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(billing.commercial_curricula()) c WHERE c->>'area'=p_area AND c->>'course'=p_course)
 AND CASE WHEN p_area='kids' THEN p_child IS NOT NULL AND EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_child AND parent_id=p_user)
 ELSE p_child IS NULL END;
$$;
CREATE FUNCTION billing.commercial_purchase_quote(p_user_id uuid,p_kind text,p_offer jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_offer IS NOT NULL THEN RAISE EXCEPTION 'COMMERCIAL_OFFER_UNAVAILABLE'; END IF;
 RETURN (SELECT jsonb_build_object('original_minor',amount_minor,'amount_minor',amount_minor,'currency',currency)
 FROM billing.commercial_catalogue WHERE kind=p_kind);
END $$;
CREATE FUNCTION public.prepare_commercial_purchase(p_user_id uuid,p_kind text,p_area text,p_course text,p_child_id uuid,p_request_id uuid,p_wallet_scope text DEFAULT 'account',p_offer jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.commercial_purchases%ROWTYPE; params jsonb; quote jsonb; cat billing.commercial_catalogue%ROWTYPE; customer text;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 IF NOT billing.commercial_account_allowed(p_user_id) THEN RAISE EXCEPTION 'COMMERCIAL_ACCOUNT_DENIED'; END IF;
 IF p_request_id IS NULL OR p_kind IS NULL OR p_kind NOT IN ('lifetime_course','question_topup')
 OR p_wallet_scope IS NULL OR p_wallet_scope NOT IN ('account','family')
 OR (p_kind='lifetime_course' AND (NOT billing.commercial_selection_valid(p_user_id,p_area,p_course,p_child_id)
  OR p_wallet_scope<>CASE WHEN p_area='kids' THEN 'family' ELSE 'account' END))
 OR (p_kind='question_topup' AND (p_area IS NOT NULL OR p_course IS NOT NULL OR p_child_id IS NOT NULL))
 OR (p_wallet_scope='family' AND NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE parent_id=p_user_id))
 THEN RAISE EXCEPTION 'COMMERCIAL_INVALID_SELECTION'; END IF;
 params:=jsonb_build_object('kind',p_kind,'area',p_area,'course',p_course,'child_id',p_child_id,'wallet_scope',p_wallet_scope,'offer',p_offer);
 SELECT * INTO r FROM billing.commercial_purchases WHERE user_id=p_user_id AND request_id=p_request_id;
 IF FOUND THEN
  IF r.parameters-'quote'<>params THEN RAISE EXCEPTION 'COMMERCIAL_REQUEST_CONFLICT'; END IF;
  IF r.state='expired' THEN RAISE EXCEPTION 'COMMERCIAL_REQUEST_EXPIRED'; END IF;
 ELSE
  IF p_kind='lifetime_course' THEN
   SELECT * INTO r FROM billing.commercial_purchases WHERE user_id=p_user_id AND kind=p_kind AND area=p_area AND course=p_course
    AND child_id IS NOT DISTINCT FROM p_child_id AND state IN ('pending','fulfilled');
   IF FOUND THEN
    IF r.state='fulfilled' THEN RAISE EXCEPTION 'COMMERCIAL_CURRICULUM_ALREADY_OWNED'; END IF;
    IF r.parameters-'quote'<>params THEN RAISE EXCEPTION 'COMMERCIAL_PENDING_PURCHASE_CONFLICT'; END IF;
    RETURN to_jsonb(r);
   END IF;
  END IF;
  SELECT * INTO STRICT cat FROM billing.commercial_catalogue WHERE kind=p_kind;
  quote:=billing.commercial_purchase_quote(p_user_id,p_kind,p_offer);
  SELECT gateway_customer_id INTO customer FROM billing.gateway_customers WHERE user_id=p_user_id AND stripe_environment='live' AND gateway_code=billing.stripe_gateway_code() LIMIT 1;
  INSERT INTO billing.commercial_purchases(user_id,kind,area,course,child_id,wallet_scope,amount_minor,currency,request_id,parameters,price_id,product_id,customer_id)
  VALUES(p_user_id,p_kind,p_area,p_course,p_child_id,p_wallet_scope,(quote->>'amount_minor')::integer,cat.currency,p_request_id,params||jsonb_build_object('quote',quote),cat.price_id,cat.product_id,customer) RETURNING * INTO r;
 END IF;
 RETURN to_jsonb(r);
END $$;
CREATE FUNCTION public.bind_commercial_purchase_session(p_purchase_id uuid,p_session_id text,p_customer_id text,p_price_id text,p_product_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.commercial_purchases%ROWTYPE;
BEGIN
 PERFORM billing.commercial_require_service(); SELECT * INTO r FROM billing.commercial_purchases WHERE id=p_purchase_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'COMMERCIAL_PURCHASE_NOT_FOUND'; END IF;
 PERFORM billing.commercial_lock(r.user_id); SELECT * INTO r FROM billing.commercial_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF p_session_id !~ '^cs_(live_|test_)?[A-Za-z0-9]+$' OR p_customer_id !~ '^cus_[A-Za-z0-9]+$'
 OR p_price_id !~ '^price_[A-Za-z0-9]+$' OR p_product_id !~ '^prod_[A-Za-z0-9_]+$'
 OR p_session_id IS NULL OR p_customer_id IS NULL OR p_price_id IS NULL OR p_product_id IS NULL
 THEN RAISE EXCEPTION 'COMMERCIAL_BINDING_INVALID'; END IF;
 IF r.price_id IS DISTINCT FROM p_price_id OR r.product_id IS DISTINCT FROM p_product_id
 OR (r.customer_id IS NOT NULL AND r.customer_id<>p_customer_id) THEN RAISE EXCEPTION 'COMMERCIAL_CATALOGUE_MISMATCH'; END IF;
 IF r.session_id IS NOT NULL AND (r.session_id,r.customer_id,r.price_id,r.product_id) IS DISTINCT FROM (p_session_id,p_customer_id,p_price_id,p_product_id)
 THEN RAISE EXCEPTION 'COMMERCIAL_BINDING_CONFLICT'; END IF;
 IF r.state IN ('held','expired') OR NOT billing.commercial_account_allowed(r.user_id) THEN RAISE EXCEPTION 'COMMERCIAL_ACCOUNT_DENIED'; END IF;
 UPDATE billing.commercial_purchases SET session_id=p_session_id,customer_id=p_customer_id,price_id=p_price_id,product_id=p_product_id WHERE id=r.id RETURNING * INTO r;
 RETURN to_jsonb(r);
END $$;
CREATE FUNCTION public.get_commercial_purchase_by_session(p_session_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM billing.commercial_require_service(); RETURN (SELECT to_jsonb(r) FROM billing.commercial_purchases r WHERE session_id=p_session_id); END $$;
CREATE FUNCTION public.get_commercial_purchase_by_payment(p_payment_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM billing.commercial_require_service(); RETURN (SELECT to_jsonb(r) FROM billing.commercial_purchases r WHERE payment_id=p_payment_id); END $$;
CREATE FUNCTION public.close_commercial_purchase_session(p_purchase_id uuid,p_session_id text,p_customer_id text,p_status text,p_payment_status text,p_payment_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.commercial_purchases%ROWTYPE;
BEGIN
 PERFORM billing.commercial_require_service(); SELECT * INTO r FROM billing.commercial_purchases WHERE id=p_purchase_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'COMMERCIAL_PURCHASE_NOT_FOUND'; END IF;
 PERFORM billing.commercial_lock(r.user_id); SELECT * INTO r FROM billing.commercial_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF r.session_id IS NULL OR r.session_id IS DISTINCT FROM p_session_id OR r.customer_id IS DISTINCT FROM p_customer_id
 OR p_status IS DISTINCT FROM 'expired' OR p_payment_status IS DISTINCT FROM 'unpaid' OR p_payment_id IS NOT NULL
 OR r.payment_id IS NOT NULL OR r.state NOT IN ('pending','expired') THEN RAISE EXCEPTION 'COMMERCIAL_CLOSE_EVIDENCE_MISMATCH'; END IF;
 UPDATE billing.commercial_purchases SET state='expired' WHERE id=r.id;
 RETURN jsonb_build_object('closed',true);
END $$;

CREATE FUNCTION billing.assistant_wallet_units(p_user uuid,p_scope text) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(sum(credit_units),0)::integer FROM billing.ai_credit_ledger
 WHERE user_id=p_user AND coalesce(metadata->>'wallet_scope','account')=p_scope
 AND (expires_at IS NULL OR expires_at>now());
$$;
CREATE FUNCTION public.fulfill_commercial_purchase(p_purchase_id uuid,p_provider_event_id text,p_payment_id text,p_amount_minor integer,p_currency text,p_paid_at timestamptz,
 p_session_id text,p_customer_id text,p_price_id text,p_product_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.commercial_purchases%ROWTYPE; balance integer;
BEGIN
 PERFORM billing.commercial_require_service(); SELECT * INTO r FROM billing.commercial_purchases WHERE id=p_purchase_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'COMMERCIAL_PURCHASE_NOT_FOUND'; END IF;
 PERFORM billing.commercial_lock(r.user_id); SELECT * INTO r FROM billing.commercial_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF p_provider_event_id IS NULL OR p_provider_event_id !~ '^evt_[A-Za-z0-9]+$' OR p_payment_id IS NULL OR p_payment_id !~ '^pi_[A-Za-z0-9]+$'
 OR p_amount_minor IS DISTINCT FROM r.amount_minor OR upper(p_currency) IS DISTINCT FROM r.currency
 OR p_paid_at IS NULL OR p_paid_at>now()+interval '5 minutes' OR p_paid_at<r.created_at-interval '5 minutes'
 OR r.session_id IS NULL OR (r.session_id,r.customer_id,r.price_id,r.product_id) IS DISTINCT FROM (p_session_id,p_customer_id,p_price_id,p_product_id)
 THEN RAISE EXCEPTION 'COMMERCIAL_PAYMENT_MISMATCH'; END IF;
 IF r.payment_id IS NOT NULL AND r.payment_id<>p_payment_id THEN RAISE EXCEPTION 'COMMERCIAL_PAYMENT_CONFLICT'; END IF;
 IF r.state IN ('held','expired') OR EXISTS(SELECT 1 FROM billing.commercial_payment_holds WHERE session_id=p_session_id OR payment_id=p_payment_id)
 OR NOT billing.commercial_account_allowed(r.user_id) THEN RAISE EXCEPTION 'COMMERCIAL_PAYMENT_HELD'; END IF;
 IF r.state='fulfilled' THEN RETURN jsonb_build_object('id',r.id,'state',r.state,'replay',true); END IF;
 IF r.kind='lifetime_course' AND NOT billing.commercial_selection_valid(r.user_id,r.area,r.course,r.child_id) THEN RAISE EXCEPTION 'COMMERCIAL_SELECTION_CHANGED'; END IF;
 UPDATE billing.commercial_purchases SET state='fulfilled',paid_at=p_paid_at,payment_id=p_payment_id,provider_event_id=p_provider_event_id WHERE id=r.id;
 IF r.kind='question_topup' THEN
  balance:=billing.assistant_wallet_units(r.user_id,r.wallet_scope)+r.quantity;
  INSERT INTO billing.ai_credit_ledger(user_id,entry_type,credit_units,balance_after,source_type,source_id,expires_at,idempotency_key,occurred_at,metadata)
  VALUES(r.user_id,'grant',r.quantity,balance,'commercial_purchase',r.id,NULL,'commercial:purchase:'||r.id,now(),jsonb_build_object('wallet_scope',r.wallet_scope));
 END IF;
 RETURN jsonb_build_object('id',r.id,'state','fulfilled','replay',false);
END $$;
CREATE FUNCTION public.apply_commercial_purchase_risk_hold(p_provider_event_id text,p_session_id text,p_payment_id text,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.commercial_purchases%ROWTYPE; existing billing.commercial_payment_holds%ROWTYPE;
BEGIN
 PERFORM billing.commercial_require_service();
 IF p_provider_event_id IS NULL OR (p_session_id IS NULL AND p_payment_id IS NULL) OR nullif(btrim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'COMMERCIAL_HOLD_INVALID'; END IF;
 SELECT * INTO existing FROM billing.commercial_payment_holds WHERE event_id=p_provider_event_id;
 IF FOUND AND (existing.session_id,existing.payment_id,existing.reason) IS DISTINCT FROM (p_session_id,p_payment_id,p_reason) THEN RAISE EXCEPTION 'COMMERCIAL_HOLD_CONFLICT'; END IF;
 INSERT INTO billing.commercial_payment_holds(event_id,session_id,payment_id,reason) VALUES(p_provider_event_id,p_session_id,p_payment_id,p_reason) ON CONFLICT DO NOTHING;
 FOR r IN SELECT * FROM billing.commercial_purchases WHERE session_id=p_session_id OR payment_id=p_payment_id ORDER BY user_id,id LOOP
  PERFORM billing.commercial_lock(r.user_id); SELECT * INTO r FROM billing.commercial_purchases WHERE id=r.id FOR UPDATE;
  IF r.state<>'held' THEN
   IF r.state='fulfilled' AND r.kind='question_topup' THEN
    INSERT INTO billing.ai_credit_ledger(user_id,entry_type,credit_units,balance_after,source_type,source_id,idempotency_key,occurred_at,metadata)
    VALUES(r.user_id,'refund',-r.quantity,billing.assistant_wallet_units(r.user_id,r.wallet_scope)-r.quantity,'commercial_purchase_hold',r.id,
      'commercial:hold:'||r.id,now(),jsonb_build_object('wallet_scope',r.wallet_scope));
   END IF;
   UPDATE billing.commercial_purchases SET state='held',held_at=now(),hold_reason=left(p_reason,200) WHERE id=r.id;
  END IF;
 END LOOP;
 RETURN jsonb_build_object('held',true);
END $$;

CREATE FUNCTION billing.commercial_course_owned(p_user uuid,p_area text,p_course text,p_child uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.commercial_account_allowed(p_user) AND EXISTS(SELECT 1 FROM billing.commercial_purchases
 WHERE user_id=p_user AND kind='lifetime_course' AND state='fulfilled' AND paid_at<=now()
 AND area=p_area AND course=p_course AND child_id IS NOT DISTINCT FROM p_child)
 AND (p_child IS NULL OR EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_child AND parent_id=p_user));
$$;
CREATE FUNCTION public.get_my_commercial_access() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); ai boolean; rights jsonb;
BEGIN
 PERFORM billing.commerce_assert_identity(u);
 ai:=billing.commercial_course_owned(u,'ai','ai');
 SELECT coalesce(jsonb_agg(DISTINCT jsonb_build_object('area',p.area,'course',p.course,'child_id',p.child_id)),'[]'::jsonb) INTO rights
 FROM billing.commercial_purchases p WHERE p.user_id=u AND p.kind='lifetime_course' AND p.state='fulfilled'
 AND p.paid_at<=now() AND billing.commercial_selection_valid(u,p.area,p.course,p.child_id)
 AND billing.commercial_account_allowed(u);
 RETURN jsonb_build_object('ai_lifetime_access',ai,'ai_lesson_ids',CASE WHEN ai THEN
   (SELECT coalesce(jsonb_agg(lesson_id ORDER BY lesson_id),'[]'::jsonb) FROM billing.commerce_lesson_catalog) ELSE '[]'::jsonb END,
   'curricula',rights,'server_time',now(),'check_at',now()+interval '30 seconds');
END $$;

-- Compose lifetime content with current source, locale, guardian and release
-- checks. Do not alter roles or pretend a curriculum purchase is Pro Plus.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('billing.evaluate_access(uuid,text,text)'::regprocedure);
 EXECUTE replace(d,'FUNCTION billing.evaluate_access(','FUNCTION billing.commercial_previous_evaluate_access(');
 d:=pg_get_functiondef('public.academic_can_access(text,text,text)'::regprocedure);
 EXECUTE replace(d,'FUNCTION public.academic_can_access(','FUNCTION billing.commercial_previous_academic_access(');
 d:=pg_get_functiondef('public.technical_can_access(text)'::regprocedure);
 EXECUTE replace(d,'FUNCTION public.technical_can_access(','FUNCTION billing.commercial_previous_technical_access(');
 d:=pg_get_functiondef('public.kids_can_access_lesson(uuid,text,integer,text)'::regprocedure);
 EXECUTE replace(d,'FUNCTION public.kids_can_access_lesson(','FUNCTION billing.commercial_previous_kids_access(');
END $$;
CREATE OR REPLACE FUNCTION billing.evaluate_access(p_user_id uuid,p_resource_type text,p_resource_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE prior jsonb; BEGIN
 prior:=billing.commercial_previous_evaluate_access(p_user_id,p_resource_type,p_resource_id);
 IF coalesce((prior->>'allowed')::boolean,false) THEN RETURN prior; END IF;
 IF p_resource_type='lesson' AND billing.commercial_account_allowed(p_user_id) AND billing.assistant_free_lesson(p_resource_id)
 THEN RETURN jsonb_build_object('allowed',true,'denial_reason_code',NULL,'source','free_curriculum'); END IF;
 IF p_resource_type IN ('lesson','video') AND billing.commercial_course_owned(p_user_id,'ai','ai')
 AND EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog WHERE lesson_id=p_resource_id)
 THEN RETURN jsonb_build_object('allowed',true,'denial_reason_code',NULL,'source','lifetime_curriculum'); END IF;
 RETURN prior;
END $$;
CREATE OR REPLACE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.commercial_previous_academic_access(p_course,p_lesson,p_locale)
 OR (billing.commercial_course_owned(auth.uid(),'academic',p_course) AND EXISTS(
 SELECT 1 FROM public.academic_courses c JOIN public.academic_lesson_content l ON l.course_id=c.id
 WHERE c.id=p_course AND c.enabled AND l.lesson_id=p_lesson AND l.locale=p_locale AND l.approved));
$$;
CREATE OR REPLACE FUNCTION public.technical_can_access(p_lesson text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.commercial_previous_technical_access(p_lesson)
 OR (billing.commercial_course_owned(auth.uid(),'technical','furniture')
 AND EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled)
 AND EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id=p_lesson));
$$;
CREATE OR REPLACE FUNCTION public.kids_can_access_lesson(requested_profile uuid,requested_level text,requested_lesson integer,requested_locale text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.commercial_previous_kids_access(requested_profile,requested_level,requested_lesson,requested_locale)
 OR (billing.commercial_course_owned(auth.uid(),'kids','kids',requested_profile)
 AND public.kids_parent_can_manage_profiles() AND public.kids_profile_has_consent(requested_profile)
 AND EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=requested_profile AND parent_id=auth.uid() AND level_id=requested_level)
 AND EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data AND lesson_access_enabled)
 AND EXISTS(SELECT 1 FROM public.kids_content_approvals WHERE level_id=requested_level AND lesson_number=requested_lesson AND locale=requested_locale));
$$;
CREATE OR REPLACE FUNCTION public.academic_assistant_access(p_course text,p_lesson text,p_locale text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN NOT coalesce(public.academic_can_access(p_course,p_lesson,p_locale),false)
 OR NOT EXISTS(SELECT 1 FROM public.academic_lesson_content WHERE course_id=p_course AND lesson_id=p_lesson AND locale=p_locale AND approved) THEN 'none'
 WHEN EXISTS(SELECT 1 FROM public.academic_courses WHERE id=p_course AND assistant_review_enabled AND public.academic_review_allowed(p_course)) THEN 'admin'
 WHEN EXISTS(SELECT 1 FROM public.academic_courses c JOIN public.academic_assistant_policy p ON p.course_id=c.id
 WHERE c.id=p_course AND c.enabled AND c.assistant_enabled AND p.runtime_enabled) THEN 'learner'
 ELSE 'none' END;
$$;
CREATE OR REPLACE FUNCTION public.academic_assistant_allowed(p_course text,p_lesson text,p_locale text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.academic_assistant_access(p_course,p_lesson,p_locale)<>'none';
$$;
CREATE OR REPLACE FUNCTION billing.academic_checkout_quote(p_package text,p_market text,p_interval text,p_code text,p_email text,p_renewal boolean,p_assistant boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 RETURN billing.commerce_quote(p_package,p_market,p_interval,p_code,p_email,p_renewal)
  || CASE WHEN p_package='academic' THEN jsonb_build_object('academic_assistant',true,'assistant_surcharge_minor',0) ELSE '{}'::jsonb END;
END $$;
CREATE OR REPLACE FUNCTION billing.academic_record_addon_purchase() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- Historical add-on receipts stay intact. New Academic purchases include
 -- assistant access in the ordinary course price, including old-client input.
 RETURN NEW;
END $$;
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.assistant_card_content_access(uuid,text)'::regprocedure);
 EXECUTE replace(d,'FUNCTION public.assistant_card_content_access(','FUNCTION billing.commercial_previous_card_content_access(');
END $$;
CREATE OR REPLACE FUNCTION public.assistant_card_content_access(p_user_id uuid,p_card_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; lessons jsonb;
BEGIN
 PERFORM billing.commercial_require_service();
 result:=billing.commercial_previous_card_content_access(p_user_id,p_card_id);
 IF billing.commercial_course_owned(p_user_id,'ai','ai') THEN
  RETURN jsonb_set(result,'{lessons}',jsonb_build_object('entitled_lesson_ids',
    (SELECT coalesce(jsonb_agg(lesson_id ORDER BY lesson_id),'[]'::jsonb) FROM billing.commerce_lesson_catalog)));
 END IF;
 IF billing.commercial_account_allowed(p_user_id) THEN
  SELECT coalesce(jsonb_agg(lesson_id ORDER BY lesson_id),'[]'::jsonb) INTO lessons FROM (
   SELECT jsonb_array_elements_text(coalesce(result->'lessons'->'entitled_lesson_ids','[]'::jsonb)) AS lesson_id
   UNION SELECT lesson_id FROM billing.commerce_lesson_catalog WHERE billing.assistant_free_lesson(lesson_id)
  ) eligible;
  result:=jsonb_set(result,'{lessons}',jsonb_build_object('entitled_lesson_ids',lessons));
 END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.card_assistant_access(p_area text,p_card text,p_step text,p_locale text,p_profile uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.card_assistant_steps%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.card_assistant_policy WHERE area=p_area AND card_id=p_card AND runtime_enabled) THEN RETURN false; END IF;
 SELECT * INTO s FROM public.card_assistant_steps WHERE area=p_area AND card_id=p_card AND step_id=p_step;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_area='kids' THEN
  RETURN p_profile IS NOT NULL AND public.kids_can_access_lesson(p_profile,s.kids_level,s.kids_lesson,p_locale);
 ELSIF p_area='technical' THEN
  RETURN p_profile IS NULL AND public.technical_can_access(s.technical_lesson)
   AND EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id=s.technical_lesson AND locale=p_locale);
 END IF;
 RETURN false;
END $$;

CREATE FUNCTION billing.assistant_month_window(p_anchor timestamptz,p_at timestamptz)
RETURNS TABLE(starts_at timestamptz,ends_at timestamptz) LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE a timestamp:=p_anchor AT TIME ZONE 'UTC'; n integer;
BEGIN
 IF p_anchor IS NULL OR p_at<p_anchor THEN RETURN; END IF;
 n:=(extract(year FROM p_at AT TIME ZONE 'UTC')::integer-extract(year FROM a)::integer)*12
   +extract(month FROM p_at AT TIME ZONE 'UTC')::integer-extract(month FROM a)::integer;
 IF (a+make_interval(months=>n)) AT TIME ZONE 'UTC'>p_at THEN n:=n-1; END IF;
 RETURN QUERY SELECT (a+make_interval(months=>n)) AT TIME ZONE 'UTC',(a+make_interval(months=>n+1)) AT TIME ZONE 'UTC';
END $$;
CREATE FUNCTION billing.assistant_cairo_day(p_at timestamptz) RETURNS date LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT (p_at AT TIME ZONE 'Africa/Cairo')::date;
$$;
CREATE FUNCTION billing.assistant_period_start(p_anchor timestamptz,p_recurring boolean,p_at timestamptz)
RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN p_recurring THEN (SELECT starts_at FROM billing.assistant_month_window(p_anchor,p_at)) ELSE p_anchor END;
$$;
CREATE FUNCTION billing.assistant_current_units(p_key text,p_new integer,p_at timestamptz)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT monthly_units FROM billing.commercial_legacy_terms WHERE source_key=p_key AND p_at<first_new_period_at),p_new);
$$;
CREATE FUNCTION billing.assistant_source_specs(p_user uuid,p_area text,p_course text,p_child uuid,p_at timestamptz)
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units integer,recurring boolean,per_lesson integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; key text; catalogue text; free_start timestamptz;
BEGIN
 IF NOT billing.commercial_account_allowed(p_user) THEN RETURN; END IF;
 IF p_area='kids' AND NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_child AND parent_id=p_user) THEN RETURN; END IF;
 catalogue:=CASE p_area WHEN 'ai' THEN 'ai:pro_plus' WHEN 'academic' THEN 'academic:'||p_course WHEN 'technical' THEN 'technical:furniture' ELSE 'kids' END;
 IF p_area='ai' THEN
  FOR r IN SELECT s.*,pc.plan_key FROM billing.subscriptions s JOIN billing.plan_versions v ON v.id=s.plan_version_id
    JOIN billing.plan_catalog pc ON pc.id=v.plan_id WHERE s.user_id=p_user AND s.access_state IN ('paid_active','canceled_at_period_end')
    AND pc.plan_key IN ('pro','pro_plus') AND s.current_period_start<=p_at AND s.current_period_end>p_at LOOP
   key:='ai:'||r.id;
   RETURN QUERY SELECT key,r.current_period_start,r.current_period_end,
    billing.assistant_current_units(key,CASE WHEN r.plan_key='pro' THEN 150 ELSE 300 END,p_at),r.current_period_end-r.current_period_start>interval '32 days',
    (SELECT t.per_lesson_units FROM billing.commercial_legacy_terms t WHERE t.source_key=key AND p_at<t.first_new_period_at);
  END LOOP;
 ELSIF p_area IN ('academic','technical') THEN
  FOR r IN SELECT 'academic' AS area,s.subscription_id,s.user_id,s.starts_at,s.ends_at FROM billing.academic_stripe_subscriptions s
    JOIN billing.academic_stripe_prices ap ON ap.gateway_price_id=s.price_id AND ap.course_id=p_course
    WHERE p_area='academic' AND s.user_id=p_user AND s.status IN ('active','trialing') AND NOT s.refunded AND s.starts_at<=p_at AND s.ends_at>p_at
    UNION ALL SELECT 'technical',s.subscription_id,s.user_id,s.starts_at,s.ends_at FROM billing.technical_stripe_subscriptions s
    WHERE p_area='technical' AND s.user_id=p_user AND s.status IN ('active','trialing') AND NOT s.refunded AND s.starts_at<=p_at AND s.ends_at>p_at LOOP
   key:=r.area||':'||r.subscription_id;
   RETURN QUERY SELECT key||':'||p_course,r.starts_at,r.ends_at,billing.assistant_current_units(key,300,p_at),r.ends_at-r.starts_at>interval '32 days',
    (SELECT t.per_lesson_units FROM billing.commercial_legacy_terms t WHERE t.source_key=key AND p_at<t.first_new_period_at);
  END LOOP;
 ELSIF p_area='kids' THEN
  FOR r IN SELECT * FROM public.kids_family_entitlements WHERE parent_id=p_user AND active_from<=p_at AND active_until>p_at LOOP
   key:='kids:'||p_user;
   RETURN QUERY SELECT key||':'||p_child,r.active_from,r.active_until,billing.assistant_current_units(key,100,p_at),r.active_until-r.active_from>interval '32 days',NULL::integer;
  END LOOP;
 END IF;
 -- Independently purchased/manual paid periods remain distinct from invitations.
 FOR r IN SELECT * FROM billing.commerce_entitlements e WHERE e.user_id=p_user AND e.revoked_at IS NULL AND e.starts_at<=p_at AND e.ends_at>p_at
 AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled)
 AND ((p_area='ai' AND e.package IN ('pro','pro_plus')) OR e.package=p_area)
 AND (p_area<>'academic' OR EXISTS(SELECT 1 FROM public.academic_content_course_grants g WHERE g.entitlement_id=e.id AND g.course_id=p_course)) LOOP
  key:='commerce:'||r.id;
  RETURN QUERY SELECT key||CASE WHEN p_area='kids' THEN ':'||p_child WHEN p_area IN ('academic','technical') THEN ':'||p_course ELSE '' END,
   r.starts_at,r.ends_at,billing.assistant_current_units(key,CASE WHEN r.package='pro' THEN 150 WHEN r.package='kids' THEN 100 ELSE 300 END,p_at),true,
   (SELECT t.per_lesson_units FROM billing.commercial_legacy_terms t WHERE t.source_key=key AND p_at<t.first_new_period_at);
 END LOOP;
 -- One shared 300 pool per invitation, not one pool per granted curriculum.
 FOR r IN SELECT * FROM billing.email_access_grants g WHERE g.user_id=p_user AND g.activated_at<=p_at
 AND g.revoked_at IS NULL AND (g.ends_at IS NULL OR g.ends_at>p_at)
 AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=p_user AND lower(btrim(u.email))=g.recipient_email AND u.email_confirmed_at IS NOT NULL)
 AND (g.scope_mode='all_published' OR catalogue=ANY(g.catalogues) OR (p_area='ai' AND 'ai:pro'=ANY(g.catalogues))) LOOP
  RETURN QUERY SELECT 'invitation:'||r.id,r.activated_at,r.ends_at,300,true,NULL::integer;
 END LOOP;
 FOR r IN SELECT * FROM billing.commercial_purchases WHERE user_id=p_user AND state='fulfilled' AND kind='lifetime_course'
 AND area=p_area AND course=p_course AND child_id IS NOT DISTINCT FROM p_child
 AND paid_at<=p_at AND p_at<((paid_at AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC' LOOP
  RETURN QUERY SELECT 'lifetime:'||r.id,r.paid_at,((r.paid_at AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC',100,false,NULL::integer;
 END LOOP;
 IF p_area='ai' AND NOT EXISTS(SELECT 1 FROM billing.subscriptions WHERE user_id=p_user
 AND access_state IN ('paid_active','canceled_at_period_end') AND current_period_start<=p_at AND current_period_end>p_at)
 AND NOT EXISTS(SELECT 1 FROM billing.commerce_entitlements WHERE user_id=p_user AND package IN ('pro','pro_plus') AND revoked_at IS NULL AND starts_at<=p_at AND ends_at>p_at)
 AND NOT billing.commercial_course_owned(p_user,'ai','ai')
 AND NOT EXISTS(SELECT 1 FROM billing.email_access_grants g WHERE g.user_id=p_user AND g.activated_at<=p_at AND g.revoked_at IS NULL
  AND (g.ends_at IS NULL OR g.ends_at>p_at) AND (g.scope_mode='all_published' OR g.catalogues&&ARRAY['ai:pro','ai:pro_plus'])) THEN
  SELECT coalesce(email_confirmed_at,created_at) INTO free_start FROM auth.users WHERE id=p_user;
  RETURN QUERY SELECT 'free:'||p_user,free_start,NULL::timestamptz,10,true,NULL::integer;
 END IF;
END $$;

-- The service checks an exact published lesson under the actual learner's
-- identity; temporary subject settings are transaction-local and restored.
CREATE FUNCTION billing.assistant_content_allowed(p_user uuid,p_area text,p_course text,p_lesson text,p_locale text,p_child uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_sub text:=current_setting('request.jwt.claim.sub',true); old_claims text:=current_setting('request.jwt.claims',true);
 result boolean:=false; s record;
BEGIN
 IF NOT billing.commercial_account_allowed(p_user) OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RETURN false; END IF;
 IF p_area<>'kids' AND p_child IS NOT NULL THEN RETURN false; END IF;
 PERFORM set_config('request.jwt.claim.sub',p_user::text,true);
 PERFORM set_config('request.jwt.claims',(coalesce(nullif(old_claims,''),'{}')::jsonb||jsonb_build_object('sub',p_user))::text,true);
 IF p_area='ai' AND p_course='ai' THEN
  result:=EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog c WHERE (p_lesson IS NULL OR p_lesson='__course__' OR c.lesson_id=p_lesson)
   AND (public.has_role(p_user,'admin'::public.app_role) OR coalesce((billing.evaluate_access(p_user,'lesson',c.lesson_id)->>'allowed')::boolean,false)));
 ELSIF p_area='academic' THEN result:=public.academic_can_access(p_course,p_lesson,p_locale);
 ELSIF p_area='technical' AND p_course='furniture' THEN
  result:=public.technical_can_access(p_lesson) AND EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id=p_lesson AND locale=p_locale);
 ELSIF p_area='kids' AND p_course='kids' THEN
  SELECT * INTO s FROM public.card_assistant_steps WHERE area='kids' AND (source_key=p_lesson OR
   (step_id=p_lesson AND kids_level=(SELECT level_id FROM public.kids_profiles WHERE id=p_child AND parent_id=p_user))) LIMIT 1;
  result:=FOUND AND public.kids_can_access_lesson(p_child,s.kids_level,s.kids_lesson,p_locale);
 END IF;
 PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);
 RETURN coalesce(result,false);
END $$;
CREATE FUNCTION billing.assistant_scope_allowed(p_user uuid,p_area text,p_course text,p_child uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record;
BEGIN
 IF p_area='kids' AND p_child=p_user AND public.has_role(p_user,'admin'::public.app_role)
 AND billing.commercial_account_allowed(p_user) THEN RETURN true; END IF;
 IF NOT billing.commercial_selection_valid(p_user,p_area,p_course,p_child) OR NOT billing.commercial_account_allowed(p_user) THEN RETURN false; END IF;
 IF p_area='ai' THEN
  FOR r IN SELECT lesson_id FROM billing.commerce_lesson_catalog ORDER BY lesson_id LOOP
   IF billing.assistant_content_allowed(p_user,p_area,p_course,r.lesson_id,'ar-EG',p_child) THEN RETURN true; END IF;
  END LOOP;
 ELSIF p_area='academic' THEN
  FOR r IN SELECT lesson_id,locale FROM public.academic_lesson_content WHERE course_id=p_course AND approved LOOP
   IF billing.assistant_content_allowed(p_user,p_area,p_course,r.lesson_id,r.locale,p_child) THEN RETURN true; END IF;
  END LOOP;
 ELSIF p_area='technical' THEN
  FOR r IN SELECT lesson_id,locale FROM public.technical_lesson_content LOOP
   IF billing.assistant_content_allowed(p_user,p_area,p_course,r.lesson_id,r.locale,p_child) THEN RETURN true; END IF;
  END LOOP;
 ELSIF p_area='kids' THEN
  FOR r IN SELECT s.step_id,a.locale FROM public.card_assistant_steps s JOIN public.kids_content_approvals a ON a.level_id=s.kids_level AND a.lesson_number=s.kids_lesson WHERE s.area='kids' LOOP
   IF billing.assistant_content_allowed(p_user,p_area,p_course,r.step_id,r.locale,p_child) THEN RETURN true; END IF;
  END LOOP;
 END IF;
 RETURN false;
END $$;
CREATE FUNCTION billing.assistant_sync_periods(p_user uuid,p_area text,p_course text,p_child uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s record; w record; imported integer; inserted uuid;
BEGIN
 FOR s IN SELECT * FROM billing.assistant_source_specs(p_user,p_area,p_course,p_child,now()) LOOP
  IF s.recurring THEN SELECT * INTO w FROM billing.assistant_month_window(s.anchor,now());
  ELSE SELECT s.anchor AS starts_at,s.valid_until AS ends_at INTO w; END IF;
  IF w.starts_at IS NULL THEN CONTINUE; END IF;
  INSERT INTO billing.assistant_allowance_periods(user_id,source_key,starts_at,ends_at,unit_limit)
  VALUES(p_user,s.source_key,w.starts_at,least(w.ends_at,s.valid_until),s.units)
  ON CONFLICT(user_id,source_key,starts_at) DO NOTHING RETURNING id INTO inserted;
  IF inserted IS NOT NULL AND s.source_key LIKE 'academic:%' THEN
   SELECT count(*) INTO imported FROM public.academic_assistant_questions WHERE user_id=p_user AND course_id=p_course
    AND created_at>=greatest(w.starts_at,(SELECT date_trunc('month',activated_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' FROM billing.commercial_policy_release WHERE singleton))
    AND created_at<(SELECT activated_at FROM billing.commercial_policy_release WHERE singleton);
   UPDATE billing.assistant_allowance_periods SET used=imported WHERE id=inserted;
  END IF;
  -- The first migrated AI source absorbs the recorded old-period debit once.
  IF s.source_key LIKE 'ai:%' THEN
   UPDATE billing.assistant_legacy_usage SET source_key=s.source_key WHERE user_id=p_user AND source_key IS NULL RETURNING units INTO imported;
   IF FOUND THEN UPDATE billing.assistant_allowance_periods SET used=used+imported WHERE user_id=p_user AND source_key=s.source_key AND starts_at=w.starts_at; END IF;
  END IF;
 END LOOP;
END $$;
CREATE FUNCTION billing.assistant_balance(p_user uuid,p_area text,p_course text,p_child uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE monthly bigint; purchased integer; scope text:=CASE WHEN p_area='kids' THEN 'family' ELSE 'account' END; access_ok boolean;
BEGIN
 access_ok:=billing.assistant_scope_allowed(p_user,p_area,p_course,p_child);
 IF NOT access_ok THEN RETURN jsonb_build_object('access_allowed',false,'admin_review',false,'monthly_remaining',0,'purchased_remaining',0); END IF;
 PERFORM billing.assistant_sync_periods(p_user,p_area,p_course,p_child);
 SELECT coalesce(sum(greatest(0,p.unit_limit-p.used-p.reserved)),0) INTO monthly FROM billing.assistant_allowance_periods p
 JOIN billing.assistant_source_specs(p_user,p_area,p_course,p_child,now()) s USING(source_key)
 WHERE p.user_id=p_user AND p.starts_at=billing.assistant_period_start(s.anchor,s.recurring,now()) AND p.starts_at<=now() AND p.ends_at>now();
 SELECT greatest(0,billing.assistant_wallet_units(p_user,scope)-count(*)) INTO purchased FROM billing.assistant_requests
 WHERE user_id=p_user AND wallet_scope=scope AND funding='purchased' AND state='reserved';
 RETURN jsonb_build_object('access_allowed',true,'admin_review',public.has_role(p_user,'admin'::public.app_role),'monthly_remaining',monthly,'purchased_remaining',purchased);
END $$;
CREATE FUNCTION public.assistant_question_balance(p_user_id uuid,p_area text,p_course text,p_child_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 PERFORM billing.assistant_expire_requests(p_user_id);
 RETURN billing.assistant_balance(p_user_id,p_area,p_course,p_child_id); END $$;

CREATE FUNCTION billing.assistant_free_lesson(p_lesson text) RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog WHERE lesson_id=p_lesson
 AND (path_id='intro' OR lesson_id LIKE path_id||'-m1-l1-%'));
$$;
CREATE FUNCTION billing.assistant_source_permits(p_key text,p_lesson text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE is_builder boolean; g billing.email_access_grants%ROWTYPE;
BEGIN
 IF p_key LIKE 'free:%' THEN RETURN p_lesson IS NULL OR p_lesson='__course__' OR billing.assistant_free_lesson(p_lesson); END IF;
 SELECT path_id='builder' INTO is_builder FROM billing.commerce_lesson_catalog WHERE lesson_id=p_lesson;
 IF NOT coalesce(is_builder,false) THEN RETURN true; END IF;
 IF p_key LIKE 'invitation:%' THEN
  SELECT * INTO g FROM billing.email_access_grants WHERE id=substr(p_key,12)::uuid;
  RETURN g.scope_mode='all_published' OR 'ai:pro_plus'=ANY(g.catalogues);
 ELSIF p_key LIKE 'ai:%' THEN
  RETURN EXISTS(SELECT 1 FROM billing.subscriptions s JOIN billing.plan_versions v ON v.id=s.plan_version_id JOIN billing.plan_catalog c ON c.id=v.plan_id
  WHERE s.id=substr(p_key,4)::uuid AND c.plan_key='pro_plus');
 ELSIF p_key LIKE 'commerce:%' THEN
  RETURN EXISTS(SELECT 1 FROM billing.commerce_entitlements WHERE id=substr(p_key,10)::uuid AND package='pro_plus');
 END IF;
 RETURN true;
END $$;
CREATE FUNCTION billing.assistant_expire_requests(p_user uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; BEGIN
 FOR r IN SELECT * FROM billing.assistant_requests WHERE user_id=p_user AND state='reserved' AND lease_until<=now() FOR UPDATE LOOP
  IF r.allowance_id IS NOT NULL THEN UPDATE billing.assistant_allowance_periods SET reserved=greatest(0,reserved-1) WHERE id=r.allowance_id; END IF;
  UPDATE billing.assistant_requests SET state='settled',outcome='system_failure',charged_units=0,settled_at=now(),
    response=jsonb_build_object('status',503,'body',jsonb_build_object('error','ASSISTANT_REQUEST_EXPIRED')) WHERE id=r.id;
 END LOOP;
 -- Keep identity/debit receipts, but never retain answer text indefinitely.
 UPDATE billing.assistant_requests SET response=NULL WHERE user_id=p_user AND settled_at<now()-interval '24 hours' AND response IS NOT NULL;
END $$;
CREATE FUNCTION public.prune_assistant_response_cache(p_limit integer DEFAULT 1000) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n integer;
BEGIN
 PERFORM billing.commercial_require_service();
 WITH expired AS (SELECT id FROM billing.assistant_requests WHERE response IS NOT NULL AND settled_at<now()-interval '24 hours'
  ORDER BY settled_at LIMIT greatest(1,least(coalesce(p_limit,1000),10000)) FOR UPDATE SKIP LOCKED)
 UPDATE billing.assistant_requests r SET response=NULL FROM expired e WHERE r.id=e.id;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN jsonb_build_object('pruned',n);
END $$;
CREATE FUNCTION public.reserve_assistant_question(p_user_id uuid,p_area text,p_course text,p_lesson text,p_locale text,p_child_id uuid,p_request_id uuid,p_fingerprint text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.assistant_requests%ROWTYPE; period billing.assistant_allowance_periods%ROWTYPE;
 spec record; v_funding text; scope text:=CASE WHEN p_area='kids' THEN 'family' ELSE 'account' END;
 available integer; outside_count integer; pending_free integer; hourly integer:=20; existing_lesson integer;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 IF p_request_id IS NULL OR p_fingerprint IS NULL OR p_fingerprint !~ '^[a-f0-9]{64}$'
 OR p_area IS NULL OR p_area NOT IN ('ai','academic','technical','kids') OR nullif(p_course,'') IS NULL
 OR (p_area<>'ai' AND nullif(p_lesson,'') IS NULL) OR p_lesson=''
 OR p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'ASSISTANT_INVALID_REQUEST'; END IF;
 IF NOT billing.assistant_content_allowed(p_user_id,p_area,p_course,p_lesson,p_locale,p_child_id) THEN RAISE EXCEPTION 'ASSISTANT_ACCESS_DENIED'; END IF;
 PERFORM billing.assistant_expire_requests(p_user_id);
 SELECT * INTO r FROM billing.assistant_requests WHERE user_id=p_user_id AND request_id=p_request_id;
 IF FOUND THEN
  IF r.fingerprint<>p_fingerprint OR (r.area,r.course,r.lesson,r.locale,r.child_id) IS DISTINCT FROM (p_area,p_course,coalesce(p_lesson,'__course__'),p_locale,p_child_id)
   THEN RAISE EXCEPTION 'ASSISTANT_REQUEST_CONFLICT'; END IF;
  RETURN jsonb_build_object('reservation_id',r.id,'allowed',false,'replay',r.state='settled',
   'status',CASE WHEN r.state='reserved' THEN 'in_progress' WHEN r.response IS NULL THEN 'replay_expired' ELSE 'replay' END,
   'response',r.response,'balance',billing.assistant_balance(p_user_id,p_area,p_course,p_child_id));
 END IF;
 IF p_area='ai' THEN hourly:=50;
 ELSIF p_area IN ('kids','technical') THEN
  SELECT coalesce(max(p.questions_per_hour),20) INTO hourly FROM public.card_assistant_policy p JOIN public.card_assistant_steps s USING(area,card_id)
  WHERE p.area=p_area AND (s.step_id=p_lesson OR s.source_key=p_lesson OR s.technical_lesson=p_lesson);
 END IF;
 IF (SELECT count(*) FROM billing.assistant_requests WHERE user_id=p_user_id AND area=p_area AND course=p_course AND created_at>now()-interval '1 hour')>=hourly
 THEN RETURN jsonb_build_object('allowed',false,'replay',false,'status','rate_limited'); END IF;
 PERFORM billing.assistant_sync_periods(p_user_id,p_area,p_course,p_child_id);
 IF public.has_role(p_user_id,'admin'::public.app_role) THEN v_funding:='review';
 ELSE
  FOR spec IN SELECT p.*,s.per_lesson FROM billing.assistant_allowance_periods p
   JOIN billing.assistant_source_specs(p_user_id,p_area,p_course,p_child_id,now()) s USING(source_key)
   WHERE p.user_id=p_user_id AND p.starts_at<=now() AND p.ends_at>now() AND p.used+p.reserved<p.unit_limit
   AND p.starts_at=billing.assistant_period_start(s.anchor,s.recurring,now())
   AND billing.assistant_source_permits(s.source_key,p_lesson)
   ORDER BY p.ends_at,p.source_key FOR UPDATE OF p LOOP
   IF spec.per_lesson IS NOT NULL THEN
    SELECT count(*) INTO existing_lesson FROM billing.assistant_requests WHERE allowance_id=spec.id AND lesson=p_lesson AND (state='reserved' OR charged_units=1);
    SELECT existing_lesson+coalesce(sum(used_count+reserved_count),0) INTO existing_lesson FROM billing.entitlement_usage
      WHERE user_id=p_user_id AND usage_category='assistant_runtime_per_lesson' AND lesson_id=p_lesson AND period_end>now();
    IF p_area='academic' THEN
     SELECT existing_lesson+count(*) INTO existing_lesson FROM public.academic_assistant_questions
     WHERE user_id=p_user_id AND course_id=p_course AND lesson_id=p_lesson
       AND created_at>=greatest(spec.starts_at,(SELECT date_trunc('month',activated_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' FROM billing.commercial_policy_release WHERE singleton))
       AND created_at<(SELECT activated_at FROM billing.commercial_policy_release WHERE singleton);
    END IF;
    IF existing_lesson>=spec.per_lesson THEN CONTINUE; END IF;
   END IF;
   SELECT * INTO period FROM billing.assistant_allowance_periods WHERE id=spec.id; v_funding:='monthly'; EXIT;
  END LOOP;
  IF v_funding IS NULL THEN
   SELECT billing.assistant_wallet_units(p_user_id,scope)-count(*) INTO available FROM billing.assistant_requests
   WHERE user_id=p_user_id AND wallet_scope=scope AND state='reserved' AND funding='purchased';
   IF available>0 THEN v_funding:='purchased'; END IF;
  END IF;
  IF v_funding IS NULL THEN
   SELECT coalesce(max(attempts),0) INTO outside_count FROM billing.assistant_outside_days WHERE user_id=p_user_id AND day=billing.assistant_cairo_day(now());
   SELECT count(*) INTO pending_free FROM billing.assistant_requests WHERE user_id=p_user_id AND funding='unfunded' AND state='reserved';
   IF outside_count+pending_free<2 THEN v_funding:='unfunded';
   ELSE RETURN jsonb_build_object('allowed',false,'replay',false,'status','quota_exceeded','balance',billing.assistant_balance(p_user_id,p_area,p_course,p_child_id)); END IF;
  END IF;
 END IF;
 IF v_funding='monthly' THEN UPDATE billing.assistant_allowance_periods SET reserved=reserved+1 WHERE id=period.id; END IF;
 INSERT INTO billing.assistant_requests(user_id,request_id,fingerprint,area,course,lesson,locale,child_id,wallet_scope,allowance_id,funding)
 VALUES(p_user_id,p_request_id,p_fingerprint,p_area,p_course,coalesce(p_lesson,'__course__'),p_locale,p_child_id,scope,period.id,v_funding) RETURNING * INTO r;
 RETURN jsonb_build_object('reservation_id',r.id,'allowed',true,'replay',false,'status','reserved','balance',billing.assistant_balance(p_user_id,p_area,p_course,p_child_id));
END $$;
CREATE FUNCTION public.assistant_question_provider_attempt(p_user_id uuid,p_request_id uuid,p_fingerprint text,p_model text,p_attempt_id uuid,p_status text DEFAULT 'started')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.assistant_requests%ROWTYPE; prior billing.assistant_provider_attempts%ROWTYPE;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 SELECT * INTO r FROM billing.assistant_requests WHERE user_id=p_user_id AND request_id=p_request_id;
 IF NOT FOUND OR r.fingerprint IS DISTINCT FROM p_fingerprint OR r.state<>'reserved' OR r.lease_until<=now()
 OR NOT billing.commercial_account_allowed(p_user_id) THEN RAISE EXCEPTION 'ASSISTANT_REQUEST_UNAVAILABLE'; END IF;
 IF p_model IS NULL OR length(p_model)>100 OR p_attempt_id IS NULL OR p_status NOT IN ('started','succeeded','failed') THEN RAISE EXCEPTION 'ASSISTANT_ATTEMPT_INVALID'; END IF;
 SELECT * INTO prior FROM billing.assistant_provider_attempts WHERE request_id=r.id AND attempt_id=p_attempt_id;
 IF FOUND THEN
  IF prior.model<>p_model OR (prior.status<>'started' AND prior.status<>p_status) THEN RAISE EXCEPTION 'ASSISTANT_ATTEMPT_CONFLICT'; END IF;
  UPDATE billing.assistant_provider_attempts SET status=p_status WHERE request_id=r.id AND attempt_id=p_attempt_id;
 ELSE
  IF p_status<>'started' THEN RAISE EXCEPTION 'ASSISTANT_ATTEMPT_NOT_STARTED'; END IF;
  IF (SELECT count(*) FROM billing.assistant_provider_attempts WHERE request_id=r.id)>=3 THEN RAISE EXCEPTION 'ASSISTANT_ATTEMPT_LIMIT'; END IF;
  INSERT INTO billing.assistant_provider_attempts VALUES(r.id,p_attempt_id,p_model,p_status,now());
 END IF;
 RETURN jsonb_build_object('ok',true);
END $$;
CREATE FUNCTION public.settle_assistant_question(p_user_id uuid,p_request_id uuid,p_fingerprint text,p_outcome text,p_response jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.assistant_requests%ROWTYPE; charge integer:=0; outside_count integer; wallet integer; source text; replacement uuid; proof jsonb;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 SELECT * INTO r FROM billing.assistant_requests WHERE user_id=p_user_id AND request_id=p_request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ASSISTANT_REQUEST_NOT_FOUND'; END IF;
 IF r.fingerprint IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'ASSISTANT_REQUEST_CONFLICT'; END IF;
 IF r.state='settled' THEN
  RETURN jsonb_build_object('status','settled','charged_units',r.charged_units,'response',r.response,'replay',true,
   'balance',billing.assistant_balance(p_user_id,r.area,r.course,r.child_id));
 END IF;
 IF p_outcome IS NULL OR p_outcome NOT IN ('answered','insufficient','out_of_scope','system_failure')
 OR p_response IS NULL OR jsonb_typeof(p_response)<>'object' OR octet_length(p_response::text)>131072 THEN RAISE EXCEPTION 'ASSISTANT_SETTLEMENT_INVALID'; END IF;
 IF r.lease_until<=now() THEN RAISE EXCEPTION 'ASSISTANT_REQUEST_EXPIRED'; END IF;
 IF r.funding='review' AND p_outcome<>'system_failure' AND NOT public.has_role(p_user_id,'admin'::public.app_role)
 THEN RAISE EXCEPTION 'ASSISTANT_REVIEW_ACCESS_CHANGED'; END IF;
 IF p_outcome<>'system_failure' AND NOT billing.assistant_content_allowed(p_user_id,r.area,r.course,r.lesson,r.locale,r.child_id) THEN RAISE EXCEPTION 'ASSISTANT_ACCESS_DENIED'; END IF;
 IF r.area='ai' AND p_outcome='answered' THEN
  proof:=p_response->'proof';
  IF proof IS NULL OR jsonb_typeof(proof)<>'array' OR jsonb_array_length(proof)=0 THEN RAISE EXCEPTION 'ASSISTANT_PROOF_REQUIRED'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(proof) x WHERE nullif(x->>'lessonId','') IS NULL OR
   NOT billing.assistant_content_allowed(p_user_id,'ai','ai',x->>'lessonId',r.locale,NULL)) THEN RAISE EXCEPTION 'ASSISTANT_PROOF_ACCESS_DENIED'; END IF;
 ELSE proof:=jsonb_build_array(jsonb_build_object('lessonId',r.lesson));
 END IF;
  IF r.funding='monthly' AND p_outcome='answered' THEN
   SELECT source_key INTO source FROM billing.assistant_allowance_periods WHERE id=r.allowance_id;
   IF NOT EXISTS(SELECT 1 FROM billing.assistant_source_specs(p_user_id,r.area,r.course,r.child_id,now()) s WHERE s.source_key=source)
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(proof) x WHERE NOT billing.assistant_source_permits(source,x->>'lessonId')) THEN
    -- A course-wide request can retrieve a lesson outside a narrower paid pool.
    -- Move its hold only to a pool covering every actually used source.
    SELECT p.id INTO replacement FROM billing.assistant_allowance_periods p
     JOIN billing.assistant_source_specs(p_user_id,r.area,r.course,r.child_id,now()) s USING(source_key)
     WHERE p.user_id=p_user_id AND p.starts_at<=now() AND p.ends_at>now() AND p.used+p.reserved<p.unit_limit
     AND p.starts_at=billing.assistant_period_start(s.anchor,s.recurring,now())
     AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(proof) x WHERE NOT billing.assistant_source_permits(p.source_key,x->>'lessonId'))
     ORDER BY p.ends_at,p.source_key LIMIT 1 FOR UPDATE OF p;
    IF replacement IS NOT NULL THEN
     UPDATE billing.assistant_allowance_periods SET reserved=reserved-1 WHERE id=r.allowance_id;
     UPDATE billing.assistant_allowance_periods SET reserved=reserved+1 WHERE id=replacement;
     r.allowance_id:=replacement;
     UPDATE billing.assistant_requests SET allowance_id=replacement WHERE id=r.id;
    ELSE
     SELECT billing.assistant_wallet_units(p_user_id,r.wallet_scope)-count(*) INTO wallet FROM billing.assistant_requests
      WHERE user_id=p_user_id AND funding='purchased' AND state='reserved' AND wallet_scope=r.wallet_scope;
     IF wallet<1 THEN RAISE EXCEPTION 'ASSISTANT_QUOTA_SCOPE_EXCEEDED'; END IF;
     UPDATE billing.assistant_allowance_periods SET reserved=reserved-1 WHERE id=r.allowance_id;
     r.allowance_id:=NULL; r.funding:='purchased';
     UPDATE billing.assistant_requests SET allowance_id=NULL,funding='purchased' WHERE id=r.id;
    END IF;
   END IF;
  END IF;
 IF p_outcome='answered' THEN charge:=1;
 ELSIF p_outcome='out_of_scope' THEN
  INSERT INTO billing.assistant_outside_days(user_id,day,attempts) VALUES(p_user_id,billing.assistant_cairo_day(r.created_at),1)
  ON CONFLICT(user_id,day) DO UPDATE SET attempts=billing.assistant_outside_days.attempts+1 RETURNING attempts INTO outside_count;
  charge:=CASE WHEN outside_count>2 THEN 1 ELSE 0 END;
 END IF;
 IF r.funding='review' THEN charge:=0; END IF;
 IF charge=1 AND r.funding='unfunded' THEN RAISE EXCEPTION 'ASSISTANT_QUOTA_EXCEEDED'; END IF;
 IF charge=1 AND r.funding='monthly' AND NOT EXISTS(SELECT 1 FROM billing.assistant_source_specs(p_user_id,r.area,r.course,r.child_id,now()) s
   JOIN billing.assistant_allowance_periods p USING(source_key) WHERE p.id=r.allowance_id) THEN RAISE EXCEPTION 'ASSISTANT_QUOTA_SOURCE_EXPIRED'; END IF;
 IF r.funding='monthly' THEN
  UPDATE billing.assistant_allowance_periods SET reserved=greatest(0,reserved-1),used=used+charge WHERE id=r.allowance_id;
 ELSIF r.funding='purchased' AND charge=1 THEN
  wallet:=billing.assistant_wallet_units(p_user_id,r.wallet_scope);
  IF wallet<1 THEN RAISE EXCEPTION 'ASSISTANT_QUOTA_EXCEEDED'; END IF;
  INSERT INTO billing.ai_credit_ledger(user_id,entry_type,credit_units,balance_after,source_type,source_id,idempotency_key,occurred_at,metadata)
  VALUES(p_user_id,'consume',-1,wallet-1,'assistant_question',r.id,'assistant:question:'||r.id,now(),jsonb_build_object('wallet_scope',r.wallet_scope));
 END IF;
 UPDATE billing.assistant_requests SET state='settled',outcome=p_outcome,charged_units=charge,response=p_response,settled_at=now() WHERE id=r.id;
 RETURN jsonb_build_object('status','settled','charged_units',charge,'response',p_response,'replay',false,
 'balance',billing.assistant_balance(p_user_id,r.area,r.course,r.child_id));
END $$;

-- New invitations begin only on the recipient's explicit acceptance. Already
-- activated grants and legacy pending behavior are not rewritten.
ALTER TABLE billing.email_access_grants ADD COLUMN acceptance_required boolean NOT NULL DEFAULT false;
ALTER TABLE billing.email_access_grants ALTER COLUMN acceptance_required SET DEFAULT true;
DO $$ DECLARE d text; needle text:='WHERE recipient_email=v_email AND user_id IS NULL AND revoked_at IS NULL ORDER BY id FOR UPDATE'; BEGIN
 d:=pg_get_functiondef('billing.email_access_activate(uuid)'::regprocedure);
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'COMMERCIAL_INVITATION_BASELINE_CHANGED'; END IF;
 EXECUTE replace(d,needle,'WHERE recipient_email=v_email AND user_id IS NULL AND revoked_at IS NULL AND NOT acceptance_required ORDER BY id FOR UPDATE');
END $$;
CREATE FUNCTION public.get_my_commercial_invitations() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE email text;
BEGIN
 email:=billing.commerce_assert_identity(auth.uid());
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',g.id,'scope_mode',g.scope_mode,'catalogues',g.catalogues,
 'duration_days',g.duration_days,'accepted_at',g.activated_at,'ends_at',g.ends_at,
 'catalogue_details',(SELECT coalesce(jsonb_agg(c),'[]'::jsonb) FROM jsonb_array_elements(billing.email_access_catalogues()) c
   WHERE g.scope_mode='all_published' OR (c->>'id')=ANY(g.catalogues))) ORDER BY g.created_at)
 FROM billing.email_access_grants g WHERE g.recipient_email=lower(btrim(email)) AND g.revoked_at IS NULL
 AND (g.user_id IS NULL OR g.user_id=auth.uid()) AND (g.ends_at IS NULL OR g.ends_at>now())),'[]'::jsonb);
END $$;
CREATE FUNCTION public.accept_commercial_invitation(p_grant_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE email text; g billing.email_access_grants%ROWTYPE; u uuid:=auth.uid();
BEGIN
 email:=billing.commerce_assert_identity(u); PERFORM billing.commercial_lock(u);
 SELECT * INTO g FROM billing.email_access_grants WHERE id=p_grant_id FOR UPDATE;
 IF NOT FOUND OR g.recipient_email<>lower(btrim(email)) OR g.revoked_at IS NOT NULL
 OR (g.user_id IS NOT NULL AND g.user_id<>u) THEN RAISE EXCEPTION 'COMMERCIAL_INVITATION_DENIED'; END IF;
 IF g.activated_at IS NULL THEN
  UPDATE billing.email_access_grants SET user_id=u,activated_at=now(),ends_at=CASE WHEN duration_days IS NULL THEN NULL ELSE now()+make_interval(days=>duration_days) END WHERE id=g.id RETURNING * INTO g;
  INSERT INTO billing.email_access_audit(grant_id,actor,action) VALUES(g.id,u,'activated');
 END IF;
 RETURN jsonb_build_object('id',g.id,'accepted_at',g.activated_at,'ends_at',g.ends_at);
END $$;

-- This migration switches all new runtime callers to one settlement mechanism.
-- Legacy requests may still settle during deployment; no new legacy reservations
-- are accepted after the new runtime goes live.
CREATE OR REPLACE FUNCTION public.card_assistant_take_question(p_area text,p_card text,p_step text,p_locale text,p_profile uuid,p_request uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'ASSISTANT_UNIFIED_METER_REQUIRED'; END $$;
CREATE OR REPLACE FUNCTION public.academic_assistant_take_question(p_course text,p_lesson text,p_locale text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'ASSISTANT_UNIFIED_METER_REQUIRED'; END $$;

-- Explicit deletion inventory: answer caches and usage are learner data; payment
-- evidence follows the existing financial retention deadline and lock checks.
DO $$ DECLARE r record; d text; needle text:='ARRAY[''account_deletion_requests'',''account_deletion_lifecycle'''; BEGIN
 FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prosrc LIKE '%LC09_UNCLASSIFIED_FINANCIAL_TABLE%' LOOP
  d:=pg_get_functiondef(r.oid);
  IF position(needle IN d)=0 THEN RAISE EXCEPTION 'COMMERCIAL_DELETION_BASELINE_CHANGED'; END IF;
  EXECUTE replace(d,needle,needle||',''commercial_purchases'',''commercial_legacy_terms'',''assistant_allowance_periods'',''assistant_requests'',''assistant_outside_days'',''assistant_legacy_usage''');
 END LOOP;
 EXECUTE replace(pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure),
 'FUNCTION public.lc09_advance_deletion(','FUNCTION billing.commercial_previous_advance_deletion(');
 EXECUTE replace(pg_get_functiondef('public.lc09_complete_financial_purge(uuid,uuid,boolean)'::regprocedure),
 'FUNCTION public.lc09_complete_financial_purge(','FUNCTION billing.commercial_previous_financial_purge(');
END $$;
CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 IF p_next_stage IN ('provider_reconciled','learner_erased') AND EXISTS(SELECT 1 FROM billing.assistant_requests WHERE user_id=p_user_id AND state='reserved' AND lease_until>now())
 THEN RAISE EXCEPTION 'LC09_ASSISTANT_SETTLEMENT_PENDING'; END IF;
 result:=billing.commercial_previous_advance_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN
  DELETE FROM billing.assistant_requests WHERE user_id=p_user_id;
  DELETE FROM billing.assistant_allowance_periods WHERE user_id=p_user_id;
  DELETE FROM billing.assistant_outside_days WHERE user_id=p_user_id;
  DELETE FROM billing.assistant_legacy_usage WHERE user_id=p_user_id;
  UPDATE billing.commercial_purchases SET state='held',held_at=coalesce(held_at,now()),hold_reason='account_deletion',child_id=NULL,parameters='{}' WHERE user_id=p_user_id;
 END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.lc09_complete_financial_purge(p_user_id uuid,p_lease_token uuid,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 result:=billing.commercial_previous_financial_purge(p_user_id,p_lease_token,p_release);
 IF NOT p_release THEN
  DELETE FROM billing.commercial_payment_holds h USING billing.commercial_purchases p WHERE p.user_id=p_user_id AND (h.session_id=p.session_id OR h.payment_id=p.payment_id);
  DELETE FROM billing.commercial_purchases WHERE user_id=p_user_id;
  DELETE FROM billing.commercial_legacy_terms WHERE user_id=p_user_id;
 END IF;
 RETURN result;
END $$;

DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='billing' AND (p.proname LIKE 'commercial_%' OR p.proname LIKE 'assistant_%') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',r.signature);
 END LOOP;
 FOR r IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('list_commercial_purchase_options','prepare_commercial_purchase','bind_commercial_purchase_session',
 'get_commercial_purchase_by_session','get_commercial_purchase_by_payment','close_commercial_purchase_session','fulfill_commercial_purchase','apply_commercial_purchase_risk_hold',
 'assistant_question_balance','reserve_assistant_question','settle_assistant_question','assistant_question_provider_attempt','prune_assistant_response_cache') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',r.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',r.signature);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.get_my_commercial_invitations(),public.accept_commercial_invitation(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_my_commercial_invitations(),public.accept_commercial_invitation(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_my_commercial_access() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_my_commercial_access() TO authenticated;
REVOKE ALL ON FUNCTION public.academic_assistant_access(text,text,text),public.academic_assistant_allowed(text,text,text),
 public.academic_assistant_take_question(text,text,text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.academic_assistant_access(text,text,text),public.academic_assistant_allowed(text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.card_assistant_access(text,text,text,text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.card_assistant_access(text,text,text,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION billing.academic_checkout_quote(text,text,text,text,text,boolean,boolean),billing.academic_record_addon_purchase() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
