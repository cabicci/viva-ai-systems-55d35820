-- Owner-approved coupon duration and explicit question-credit scope.
-- No provider objects, customer subscriptions or historical prices are changed.
-- Transaction is owned by the native Drizzle runner across pending migrations.
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint


ALTER TABLE billing.commerce_offers
 ADD COLUMN product_scope text NOT NULL DEFAULT 'subscription' CHECK(product_scope IN ('subscription','question_topup')),
 ADD COLUMN discount_duration text NOT NULL DEFAULT 'once' CHECK(discount_duration IN ('once','repeating','forever')),
 ADD COLUMN discount_duration_months integer,
 ADD CONSTRAINT commerce_discount_months CHECK(
   (discount_duration='repeating' AND discount_duration_months IS NOT NULL AND discount_duration_months BETWEEN 1 AND 1200)
   OR (discount_duration<>'repeating' AND discount_duration_months IS NULL));
--> statement-breakpoint

-- Preserve already reviewed recurring offers rather than relabeling them once.
UPDATE billing.commerce_offers f SET discount_duration=m.duration,discount_duration_months=m.duration_in_months
FROM (SELECT DISTINCT ON (offer_id) offer_id,duration,duration_in_months FROM public.stripe_live_offer_mappings ORDER BY offer_id,enabled DESC,version DESC,created_at DESC) m
WHERE f.id=m.offer_id;
--> statement-breakpoint

ALTER TABLE billing.commerce_offers DROP CONSTRAINT commerce_offers_package_check;
--> statement-breakpoint

ALTER TABLE billing.commerce_offers ADD CONSTRAINT commerce_offers_package_check CHECK(package IN ('pro','pro_plus','kids','technical','academic','question_topup'));
--> statement-breakpoint

ALTER TABLE billing.commerce_offers DROP CONSTRAINT commerce_offers_billing_interval_check;
--> statement-breakpoint

ALTER TABLE billing.commerce_offers ADD CONSTRAINT commerce_offers_billing_interval_check CHECK(billing_interval IN ('month','year','one_time'));
--> statement-breakpoint

ALTER TABLE billing.commerce_offers ADD CONSTRAINT commerce_offer_scope CHECK(
 (product_scope='question_topup' AND package='question_topup' AND billing_interval='one_time' AND currency='EGP' AND discount_duration='once' AND kind IN ('percent','fixed') AND (kind<>'percent' OR value_minor<100))
 OR (product_scope='subscription' AND package<>'question_topup' AND billing_interval IS DISTINCT FROM 'one_time'));
--> statement-breakpoint

ALTER TABLE public.stripe_live_offer_mappings DROP CONSTRAINT stripe_live_offer_mappings_package_check;
--> statement-breakpoint

ALTER TABLE public.stripe_live_offer_mappings ADD CONSTRAINT stripe_live_offer_mappings_package_check CHECK(package IN ('pro','pro_plus','kids','technical','academic','question_topup'));
--> statement-breakpoint

ALTER TABLE public.stripe_live_offer_mappings DROP CONSTRAINT stripe_live_offer_mappings_billing_interval_check;
--> statement-breakpoint

ALTER TABLE public.stripe_live_offer_mappings ADD CONSTRAINT stripe_live_offer_mappings_billing_interval_check CHECK(billing_interval IN ('month','year','one_time'));
--> statement-breakpoint

ALTER TABLE public.stripe_live_offer_mappings ADD CONSTRAINT stripe_live_offer_one_time_scope CHECK(
 (package='question_topup' AND billing_interval='one_time' AND market_code='EG' AND duration='once')
 OR (package<>'question_topup' AND billing_interval<>'one_time'));
--> statement-breakpoint


CREATE TABLE billing.commerce_discount_terms (
 offer_id uuid NOT NULL REFERENCES billing.commerce_offers(id) ON DELETE CASCADE,
 user_id uuid NOT NULL, recipient_email text NOT NULL, phone text,
 starts_at timestamptz NOT NULL, ends_at timestamptz, first_order_id uuid NOT NULL REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
 PRIMARY KEY(offer_id,user_id), CHECK(ends_at IS NULL OR ends_at>starts_at)
);
--> statement-breakpoint

ALTER TABLE billing.commerce_discount_terms ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

REVOKE ALL ON billing.commerce_discount_terms FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT SELECT,INSERT,UPDATE,DELETE ON billing.commerce_discount_terms TO service_role;
--> statement-breakpoint

CREATE POLICY commercial_discount_terms_service ON billing.commerce_discount_terms TO service_role USING(true) WITH CHECK(true);
--> statement-breakpoint

CREATE UNIQUE INDEX commercial_purchase_offer_reservation ON billing.commercial_purchases
 ((parameters->'quote'->'offer'->>'id')) WHERE parameters->'quote'->'offer'->>'id' IS NOT NULL;
--> statement-breakpoint


ALTER FUNCTION billing.commerce_price(text,text,text,uuid) RENAME TO commerce_pre_policy_price;
--> statement-breakpoint

CREATE FUNCTION billing.commerce_price(p_package text,p_market text,p_interval text,p_user uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_package='question_topup' THEN
  IF p_market IS DISTINCT FROM 'EG' OR p_interval IS DISTINCT FROM 'one_time' THEN RAISE EXCEPTION 'COMMERCE_INVALID_SELECTION'; END IF;
  RETURN (SELECT jsonb_build_object('original_minor',amount_minor,'currency',currency,'package',p_package,'billing_interval',p_interval)
    FROM billing.commercial_catalogue WHERE kind='question_topup');
 END IF;
 RETURN billing.commerce_pre_policy_price(p_package,p_market,p_interval,p_user);
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commerce_price(text,text,text,uuid),billing.commerce_pre_policy_price(text,text,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint


-- The paid term belongs to the verified account and its original phone. An
-- unconfirmed order never starts a term or extends the discount window.
CREATE FUNCTION billing.commercial_manual_term(p_offer uuid,p_user uuid,p_email text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM billing.commerce_discount_terms t JOIN billing.commerce_offers f ON f.id=t.offer_id
 JOIN billing.commerce_orders o ON o.id=t.first_order_id
 WHERE t.offer_id=p_offer AND t.user_id=p_user AND t.recipient_email=p_email AND f.enabled
 AND f.product_scope='subscription' AND f.discount_duration IN ('repeating','forever')
 AND o.offer_id=f.id AND o.user_id=p_user AND o.recipient_email=p_email AND o.offer_consumed
 AND o.review_status='confirmed' AND o.confirmed_at IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM billing.commerce_refunds r WHERE r.order_id=o.id)
 -- Normal expiry must not end a repeating/forever coupon. Refund or explicit
 -- revocation of its original access must: the original purchase is its basis.
 AND EXISTS(SELECT 1 FROM billing.commerce_entitlements e LEFT JOIN billing.commerce_grants g ON g.id=e.grant_id
   WHERE e.user_id=p_user AND e.package=o.package AND e.revoked_at IS NULL
   AND (e.order_id=o.id OR (g.offer_order_id=o.id AND g.user_id=p_user AND g.revoked_at IS NULL)))
 AND (t.ends_at IS NULL OR billing.commerce_next_start(p_user,f.package,now())<t.ends_at));
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commercial_manual_term(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint


ALTER FUNCTION billing.commerce_quote(text,text,text,text,text,boolean) RENAME TO commerce_pre_policy_quote;
--> statement-breakpoint

CREATE FUNCTION billing.commerce_quote(p_package text,p_market text,p_interval text,p_code text,p_email text,p_renewal boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q jsonb; automatic jsonb; f billing.commerce_offers%ROWTYPE; u uuid; price jsonb; final bigint;
BEGIN
 SELECT id INTO u FROM auth.users WHERE lower(email)=p_email AND email_confirmed_at IS NOT NULL;
 IF nullif(btrim(p_code),'') IS NOT NULL THEN
  SELECT * INTO f FROM billing.commerce_offers WHERE code=upper(btrim(p_code)) FOR UPDATE;
 END IF;
 IF f.id IS NOT NULL AND billing.commercial_manual_term(f.id,u,p_email) THEN
  price:=billing.commerce_price(p_package,p_market,p_interval);
  IF f.package IS DISTINCT FROM p_package OR f.billing_interval IS DISTINCT FROM p_interval OR f.currency IS DISTINCT FROM price->>'currency'
   OR (f.audience_emails IS NOT NULL AND NOT p_email=ANY(f.audience_emails)) OR f.delivery_mode='invitation'
   OR EXISTS(SELECT 1 FROM billing.commerce_orders WHERE offer_id=f.id AND user_id=u AND NOT offer_consumed AND expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected'))
   OR EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations WHERE offer_id=f.id AND user_id=u AND (consumed_at IS NOT NULL OR expires_at>now()))
  THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
  final:=CASE f.kind WHEN 'complimentary' THEN 0 WHEN 'percent' THEN (price->>'original_minor')::bigint-floor((price->>'original_minor')::numeric*f.value_minor/100)::bigint ELSE greatest(0,(price->>'original_minor')::bigint-f.value_minor) END;
  q:=price||jsonb_build_object('final_minor',final,'offer_id',f.id,'offer_kind',CASE WHEN final=0 THEN 'complimentary' ELSE f.kind END,'offer_duration_days',f.duration_days,'phone_required',f.require_phone,'term_renewal',true);
 ELSE
  q:=billing.commerce_pre_policy_quote(p_package,p_market,p_interval,p_code,p_email,p_renewal);
 END IF;
 IF p_package='kids' AND nullif(btrim(p_code),'') IS NOT NULL THEN
  automatic:=billing.commerce_pre_policy_quote(p_package,p_market,p_interval,NULL,p_email,p_renewal);
  IF (automatic->>'final_minor')::bigint<=(q->>'final_minor')::bigint THEN RETURN automatic||jsonb_build_object('automatic_discount',true,'phone_required',false); END IF;
 END IF;
 RETURN q;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commerce_quote(text,text,text,text,text,boolean),billing.commerce_pre_policy_quote(text,text,text,text,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint


CREATE FUNCTION public.select_commercial_discount(p_user_id uuid,p_package text,p_market text,p_interval text,p_code text,p_renewal boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q jsonb; email text;
BEGIN
 PERFORM billing.commercial_require_service();
 email:=billing.commerce_assert_identity(p_user_id);
 q:=billing.commerce_quote(p_package,p_market,p_interval,p_code,email,p_renewal);
 RETURN jsonb_build_object('use_offer',q->>'offer_id' IS NOT NULL,'quote',q);
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.select_commercial_discount(uuid,text,text,text,text,boolean) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.select_commercial_discount(uuid,text,text,text,text,boolean) TO service_role;
--> statement-breakpoint


-- Preserve every existing identity/guardian/payment wrapper; only the new
-- administration inputs are handled at this outer boundary.
ALTER FUNCTION public.commerce_command(text,jsonb) RENAME TO commerce_pre_commercial_policy_command;
--> statement-breakpoint

ALTER FUNCTION public.commerce_pre_commercial_policy_command(text,jsonb) SET SCHEMA billing;
--> statement-breakpoint

CREATE FUNCTION public.commerce_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); email text; result jsonb; f billing.commerce_offers%ROWTYPE; price jsonb;
 scope text:=coalesce(p_data->>'product_scope','subscription'); duration text:=coalesce(p_data->>'discount_duration','once'); months integer;
 audience text; recipients text[]; expires timestamptz; cap integer; group_id uuid; pct integer; key text;
BEGIN
 IF p_action NOT IN ('offer_catalogue','simple_offer') THEN
  IF p_action IN ('create_order','quote','import','preview_import') AND p_data->>'package'='question_topup' THEN RAISE EXCEPTION 'COMMERCE_TOPUP_REQUIRES_VERIFIED_CHECKOUT'; END IF;
  RETURN billing.commerce_pre_commercial_policy_command(p_action,p_data);
 END IF;
 email:=billing.commerce_assert_identity(u);
 IF NOT billing.commerce_is_admin() THEN RAISE EXCEPTION 'COMMERCE_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled) THEN RAISE EXCEPTION 'COMMERCE_DISABLED'; END IF;
 IF p_action='offer_catalogue' THEN
  RETURN billing.commerce_pre_commercial_policy_command(p_action,p_data)||jsonb_build_array(billing.commerce_price('question_topup','EG','one_time')||jsonb_build_object('market','EG'));
 END IF;
 months:=(p_data->>'discount_duration_months')::integer;
 IF scope NOT IN ('subscription','question_topup') OR duration NOT IN ('once','repeating','forever')
 OR (duration='repeating' AND (months IS NULL OR months NOT BETWEEN 1 AND 1200)) OR (duration<>'repeating' AND months IS NOT NULL)
 THEN RAISE EXCEPTION 'COMMERCE_INVALID_DISCOUNT_DURATION'; END IF;
 IF scope='subscription' THEN
  IF p_data->>'package'='question_topup' OR p_data->>'billing_interval'='one_time' THEN RAISE EXCEPTION 'COMMERCE_INVALID_SELECTION'; END IF;
  result:=billing.commerce_pre_commercial_policy_command(p_action,p_data);
  UPDATE billing.commerce_offers SET discount_duration=duration,discount_duration_months=months WHERE id=(result->>'id')::uuid RETURNING * INTO f;
  RETURN to_jsonb(f);
 END IF;
 pct:=(p_data->>'percent')::integer; audience:=p_data->>'audience'; key:=p_data->>'key';
 IF p_data->>'package' IS DISTINCT FROM 'question_topup' OR p_data->>'market' IS DISTINCT FROM 'EG'
 OR p_data->>'billing_interval' IS DISTINCT FROM 'one_time' OR duration<>'once' OR p_data->>'delivery' IS DISTINCT FROM 'coupon'
 OR pct IS NULL OR pct NOT BETWEEN 1 AND 99 OR key IS NULL OR length(key) NOT BETWEEN 8 AND 100
 OR coalesce(p_data->>'code','')!~'^[A-Z0-9_-]{3,64}$' OR coalesce(p_data->>'locale','') NOT IN ('en','ar-EG','ar-MSA','ar-Gulf')
 OR audience IS NULL OR audience NOT IN ('individual','group','public') THEN RAISE EXCEPTION 'COMMERCE_INVALID_OFFER'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('simple-offer:'||key,0));
 SELECT * INTO f FROM billing.commerce_offers WHERE request_key=key;
 IF FOUND THEN
  IF f.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
  RETURN to_jsonb(f);
 END IF;
 price:=billing.commerce_price('question_topup','EG','one_time');
 IF (p_data->>'expected_price_minor')::bigint IS DISTINCT FROM (price->>'original_minor')::bigint THEN RAISE EXCEPTION 'COMMERCE_PRICE_CHANGED'; END IF;
 SELECT coalesce(array_agg(DISTINCT lower(btrim(value))),'{}') INTO recipients FROM jsonb_array_elements_text(coalesce(p_data->'emails','[]'));
 IF (audience='individual' AND cardinality(recipients)<>1) OR (audience='group' AND cardinality(recipients) NOT BETWEEN 1 AND 1000)
 OR (audience='public' AND cardinality(recipients)<>0) OR EXISTS(SELECT 1 FROM unnest(recipients) e WHERE length(e)>120 OR e!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'COMMERCE_INVALID_EMAIL'; END IF;
 IF audience='public' THEN
  IF p_data->>'limit_mode'='time' THEN
   expires:=(p_data->>'valid_until')::timestamptz;
   IF expires IS NULL OR expires<=now() OR p_data->>'max_redemptions' IS NOT NULL THEN RAISE EXCEPTION 'COMMERCE_INVALID_EXPIRY'; END IF;
  ELSIF p_data->>'limit_mode'='count' THEN
   cap:=(p_data->>'max_redemptions')::integer;
   IF cap IS NULL OR cap NOT BETWEEN 1 AND 100000 OR p_data->>'valid_until' IS NOT NULL THEN RAISE EXCEPTION 'COMMERCE_INVALID_LIMIT'; END IF;
  ELSE RAISE EXCEPTION 'COMMERCE_INVALID_LIMIT'; END IF;
 ELSE
  expires:=now()+interval '15 days'; cap:=cardinality(recipients);
  INSERT INTO billing.commerce_groups(name,created_by) VALUES(coalesce(nullif(btrim(p_data->>'group_name'),''),CASE WHEN audience='individual' THEN recipients[1] ELSE 'Question credit offer' END),u) RETURNING id INTO group_id;
 END IF;
 INSERT INTO billing.commerce_offers(code,campaign,package,kind,value_minor,currency,duration_days,renewals,valid_from,valid_until,max_redemptions,per_email_limit,audience_emails,billing_interval,require_phone,request_key,parameters,group_id,delivery_mode,created_by,product_scope,discount_duration)
 VALUES(p_data->>'code',coalesce(nullif(btrim(p_data->>'group_name'),''),p_data->>'code'),'question_topup','percent',pct,'EGP',30,true,now(),expires,cap,1,CASE WHEN audience='public' THEN NULL ELSE recipients END,'one_time',true,key,p_data,group_id,'coupon',u,'question_topup','once') RETURNING * INTO f;
 INSERT INTO billing.commerce_audit(actor,action,target_id,details) VALUES(u,'simple_offer',f.id,jsonb_build_object('audience',audience,'delivery','coupon','percent',pct,'product_scope','question_topup'));
 RETURN to_jsonb(f);
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commerce_pre_commercial_policy_command(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.commerce_command(text,jsonb) FROM PUBLIC,anon,service_role;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.commerce_command(text,jsonb) TO authenticated;
--> statement-breakpoint


ALTER TABLE billing.commerce_orders ADD COLUMN discount_term_renewal boolean NOT NULL DEFAULT false;
--> statement-breakpoint

CREATE FUNCTION billing.commercial_order_term_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.offer_id IS NOT NULL AND billing.commercial_manual_term(NEW.offer_id,NEW.user_id,NEW.recipient_email) THEN
  NEW.discount_term_renewal:=true;
  NEW.start_rule:='after_expiry';
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commercial_order_term_guard() FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE TRIGGER commercial_order_term_guard BEFORE INSERT ON billing.commerce_orders FOR EACH ROW EXECUTE FUNCTION billing.commercial_order_term_guard();
--> statement-breakpoint

CREATE FUNCTION billing.commercial_discount_phone_binding() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.redemption_phone IS NOT NULL THEN
  UPDATE billing.commerce_discount_terms SET phone=NEW.redemption_phone WHERE first_order_id=NEW.id AND phone IS NULL;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commercial_discount_phone_binding() FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE TRIGGER commercial_discount_phone_binding AFTER UPDATE OF redemption_phone ON billing.commerce_orders FOR EACH ROW EXECUTE FUNCTION billing.commercial_discount_phone_binding();
--> statement-breakpoint

-- Legacy 100% coupons create a grant directly rather than calling activate().
-- Continue a repeating coupon after the paid/granted period, never overlap it.
CREATE FUNCTION billing.commercial_coupon_grant_period() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o billing.commerce_orders%ROWTYPE;
BEGIN
 IF NEW.grant_id IS NOT NULL THEN
  SELECT orders.* INTO o FROM billing.commerce_orders orders JOIN billing.commerce_grants g ON g.offer_order_id=orders.id WHERE g.id=NEW.grant_id;
  IF o.discount_term_renewal AND o.start_rule='after_expiry' THEN
   NEW.starts_at:=billing.commerce_next_start(NEW.user_id,NEW.package,NEW.starts_at);
   NEW.ends_at:=NEW.starts_at+CASE WHEN o.billing_interval='year' THEN interval '1 year' ELSE interval '1 month' END;
  END IF;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commercial_coupon_grant_period() FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE TRIGGER commercial_coupon_grant_period BEFORE INSERT ON billing.commerce_entitlements FOR EACH ROW EXECUTE FUNCTION billing.commercial_coupon_grant_period();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION billing.commerce_count_consumption() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE;
BEGIN
 IF NEW.offer_consumed AND NOT OLD.offer_consumed AND NEW.offer_id IS NOT NULL THEN
  SELECT * INTO f FROM billing.commerce_offers WHERE id=NEW.offer_id FOR UPDATE;
  IF NEW.discount_term_renewal THEN
   IF NOT billing.commercial_manual_term(f.id,NEW.user_id,NEW.recipient_email) THEN RAISE EXCEPTION 'COMMERCE_DISCOUNT_TERM_EXPIRED'; END IF;
  ELSE
   UPDATE billing.commerce_offers SET consumed_count=consumed_count+1 WHERE id=f.id;
   IF NEW.user_id IS NOT NULL AND f.product_scope='subscription' AND f.discount_duration IN ('repeating','forever') THEN
    INSERT INTO billing.commerce_discount_terms(offer_id,user_id,recipient_email,phone,starts_at,ends_at,first_order_id)
    VALUES(f.id,NEW.user_id,NEW.recipient_email,NEW.redemption_phone,coalesce(NEW.confirmed_at,now()),
      CASE WHEN f.discount_duration='repeating' THEN coalesce(NEW.confirmed_at,now())+make_interval(months=>f.discount_duration_months) ELSE NULL END,NEW.id)
    ON CONFLICT(offer_id,user_id) DO NOTHING;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

-- A paid order can activate later than confirmation (for example, an existing
-- period must finish first). Anchor the discount window to that actual start.
CREATE FUNCTION billing.commercial_discount_activation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE billing.commerce_discount_terms t SET starts_at=NEW.starts_at,
  ends_at=CASE WHEN f.discount_duration='repeating' THEN NEW.starts_at+make_interval(months=>f.discount_duration_months) ELSE NULL END
 FROM billing.commerce_offers f WHERE t.offer_id=f.id
 AND t.first_order_id=coalesce(NEW.order_id,(SELECT offer_order_id FROM billing.commerce_grants WHERE id=NEW.grant_id));
 RETURN NEW;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commercial_discount_activation() FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE TRIGGER commercial_discount_activation AFTER INSERT ON billing.commerce_entitlements FOR EACH ROW EXECUTE FUNCTION billing.commercial_discount_activation();
--> statement-breakpoint

-- Each renewal still has its own immutable order, payment, receipt and proof.
-- It continues the already consumed offer rather than taking a new campaign slot.
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT oid FROM pg_proc WHERE pronamespace='billing'::regnamespace AND proname IN ('commerce_pre_policy_quote','commerce_previous_simple_quote') LOOP
  d:=pg_get_functiondef(r.oid);
  d:=replace(d,'WHERE offer_id=f.id AND NOT offer_consumed','WHERE offer_id=f.id AND NOT discount_term_renewal AND NOT offer_consumed');
  d:=replace(d,'WHERE offer_id=v_offer.id AND'||chr(10)||'    NOT offer_consumed','WHERE offer_id=v_offer.id AND NOT discount_term_renewal AND'||chr(10)||'    NOT offer_consumed');
  EXECUTE d;
 END LOOP;
END $$;
--> statement-breakpoint


ALTER FUNCTION billing.commerce_assert_offer_phone(uuid,text,text,uuid,uuid,uuid) RENAME TO commerce_pre_policy_phone;
--> statement-breakpoint

CREATE FUNCTION billing.commerce_assert_offer_phone(p_offer uuid,p_phone text,p_email text,p_user uuid,p_order uuid DEFAULT NULL,p_invitation uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE t billing.commerce_discount_terms%ROWTYPE;
BEGIN
 PERFORM 1 FROM billing.commerce_offers WHERE id=p_offer FOR UPDATE;
 IF billing.commercial_manual_term(p_offer,p_user,p_email) THEN
  SELECT * INTO t FROM billing.commerce_discount_terms WHERE offer_id=p_offer AND user_id=p_user;
  IF p_phone IS NULL OR p_phone!~'^\+[1-9][0-9]{7,14}$' OR p_phone IS DISTINCT FROM t.phone
   OR EXISTS(SELECT 1 FROM billing.commerce_orders WHERE offer_id=p_offer AND user_id=p_user AND id IS DISTINCT FROM p_order AND NOT offer_consumed AND expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected'))
  THEN RAISE EXCEPTION 'COMMERCE_OFFER_ALREADY_USED'; END IF;
  RETURN;
 END IF;
 PERFORM billing.commerce_pre_policy_phone(p_offer,p_phone,p_email,p_user,p_order,p_invitation);
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commerce_assert_offer_phone(uuid,text,text,uuid,uuid,uuid),billing.commerce_pre_policy_phone(uuid,text,text,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint


CREATE OR REPLACE FUNCTION billing.commercial_purchase_quote(p_user_id uuid,p_kind text,p_offer jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE reservation jsonb; cat billing.commercial_catalogue%ROWTYPE;
BEGIN
 SELECT * INTO STRICT cat FROM billing.commercial_catalogue WHERE kind=p_kind;
 IF p_offer IS NULL THEN RETURN jsonb_build_object('original_minor',cat.amount_minor,'amount_minor',cat.amount_minor,'currency',cat.currency,'offer',NULL); END IF;
 IF p_kind<>'question_topup' OR coalesce(p_offer->>'code','')='' OR p_offer->>'key' IS NULL THEN RAISE EXCEPTION 'COMMERCIAL_OFFER_UNAVAILABLE'; END IF;
 reservation:=public.reserve_stripe_live_offer(p_user_id,p_offer->>'code','question_topup','EG','one_time',p_offer->>'phone',(p_offer->>'key')::uuid,false);
 IF reservation->'mapping'->>'price_id' IS DISTINCT FROM cat.price_id OR reservation->'mapping'->>'product_id' IS DISTINCT FROM cat.product_id THEN RAISE EXCEPTION 'COMMERCIAL_OFFER_CATALOGUE_MISMATCH'; END IF;
 RETURN jsonb_build_object('original_minor',cat.amount_minor,'amount_minor',(reservation->>'final_minor')::integer,'currency',cat.currency,'offer',reservation);
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commercial_purchase_quote(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint


-- Bind and consume in the same transaction as the purchase. One-time payments
-- never masquerade as Stripe subscription/invoice identifiers.
CREATE FUNCTION billing.commercial_purchase_offer_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE reservation_id uuid; r public.stripe_live_offer_reservations%ROWTYPE; m public.stripe_live_offer_mappings%ROWTYPE;
BEGIN
 reservation_id:=nullif(NEW.parameters->'quote'->'offer'->>'id','')::uuid;
 IF reservation_id IS NULL THEN RETURN NEW; END IF;
 PERFORM billing.commercial_lock(NEW.user_id);
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=reservation_id;
 PERFORM 1 FROM billing.commerce_offers WHERE id=r.offer_id FOR UPDATE;
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=reservation_id FOR UPDATE;
 SELECT * INTO m FROM public.stripe_live_offer_mappings WHERE id=r.mapping_id;
 IF r.user_id IS DISTINCT FROM NEW.user_id OR m.package IS DISTINCT FROM 'question_topup' OR m.billing_interval IS DISTINCT FROM 'one_time'
 OR NEW.kind<>'question_topup' OR r.final_minor<>NEW.amount_minor OR m.price_id IS DISTINCT FROM NEW.price_id OR m.product_id IS DISTINCT FROM NEW.product_id
 THEN RAISE EXCEPTION 'COMMERCIAL_OFFER_BINDING_CONFLICT'; END IF;
 IF NEW.session_id IS NOT NULL AND OLD.session_id IS NULL THEN
  PERFORM public.bind_stripe_live_offer(reservation_id,NEW.user_id,NEW.customer_id,NEW.session_id);
 END IF;
 IF NEW.state='fulfilled' AND OLD.state IS DISTINCT FROM 'fulfilled' THEN
  SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=reservation_id FOR UPDATE;
  IF r.session_id IS DISTINCT FROM NEW.session_id OR r.customer_id IS DISTINCT FROM NEW.customer_id OR r.consumed_at IS NOT NULL
   OR NEW.payment_id IS NULL OR NEW.provider_event_id IS NULL THEN RAISE EXCEPTION 'COMMERCIAL_OFFER_CONSUMPTION_CONFLICT'; END IF;
  UPDATE public.stripe_live_offer_reservations SET consumed_at=now() WHERE id=reservation_id;
  UPDATE billing.commerce_offers SET consumed_count=consumed_count+1 WHERE id=r.offer_id;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.commercial_purchase_offer_guard() FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE TRIGGER commercial_purchase_offer_guard AFTER UPDATE ON billing.commercial_purchases FOR EACH ROW EXECUTE FUNCTION billing.commercial_purchase_offer_guard();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION public.stripe_live_offer_catalogue_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE; q jsonb; ok boolean;
BEGIN
 SELECT * INTO f FROM billing.commerce_offers WHERE id=NEW.offer_id;
 IF f.package IS DISTINCT FROM NEW.package OR f.currency IS DISTINCT FROM NEW.currency OR f.kind IS DISTINCT FROM NEW.kind OR f.value_minor IS DISTINCT FROM NEW.value_minor OR (f.billing_interval IS NOT NULL AND f.billing_interval<>NEW.billing_interval) OR NEW.duration IS DISTINCT FROM f.discount_duration OR NEW.duration_in_months IS DISTINCT FROM f.discount_duration_months THEN RAISE EXCEPTION 'LIVE_OFFER_DEFINITION_MISMATCH'; END IF;
 q:=billing.commerce_price(NEW.package,NEW.market_code,NEW.billing_interval);
 IF NEW.package='question_topup' THEN SELECT EXISTS(SELECT 1 FROM billing.commercial_catalogue WHERE kind='question_topup' AND NEW.billing_interval='one_time' AND NEW.market_code='EG' AND price_id=NEW.price_id AND product_id=NEW.product_id AND amount_minor=(q->>'original_minor')::bigint) INTO ok;
 ELSIF NEW.package='kids' THEN SELECT EXISTS(SELECT 1 FROM public.kids_stripe_prices WHERE stripe_environment='live' AND NOT discounted AND market_code=NEW.market_code AND billing_interval=NEW.billing_interval AND gateway_price_id=NEW.price_id AND gateway_product_id=NEW.product_id AND amount_minor=(q->>'original_minor')::bigint) INTO ok;
 ELSIF NEW.package='academic' THEN SELECT EXISTS(SELECT 1 FROM billing.academic_stripe_prices WHERE stripe_environment='live' AND NOT includes_assistant AND market_code=NEW.market_code AND billing_interval=NEW.billing_interval AND gateway_price_id=NEW.price_id AND gateway_product_id=NEW.product_id AND amount_minor=(q->>'original_minor')::bigint) INTO ok;
 ELSIF NEW.package='technical' THEN SELECT EXISTS(SELECT 1 FROM billing.technical_stripe_prices WHERE stripe_environment='live' AND market_code=NEW.market_code AND billing_interval=NEW.billing_interval AND gateway_price_id=NEW.price_id AND gateway_product_id=NEW.product_id AND amount_minor=(q->>'original_minor')::bigint) INTO ok;
 ELSE SELECT EXISTS(SELECT 1 FROM billing.gateway_price_mappings g JOIN billing.market_prices mp ON mp.id=g.market_price_id JOIN billing.plan_versions pv ON pv.id=mp.plan_version_id JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE g.stripe_environment='live' AND g.gateway_price_id=NEW.price_id AND g.gateway_product_id=NEW.product_id AND pc.plan_key=NEW.package AND mp.market_code=NEW.market_code AND pv.billing_interval=NEW.billing_interval AND mp.amount_minor=(q->>'original_minor')::bigint) INTO ok;
 END IF;
 IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'LIVE_OFFER_CATALOGUE_MISMATCH'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint


CREATE OR REPLACE FUNCTION public.stripe_live_offer_admin(p_actor uuid,p_action text,p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE; m public.stripe_live_offer_mappings%ROWTYPE; r public.stripe_live_offer_reservations%ROWTYPE; a public.stripe_live_offer_admin_audit%ROWTYPE; q jsonb; v integer; k uuid;
BEGIN
 IF NOT billing.is_service_role_caller() OR NOT public.has_role(p_actor,'admin') THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 IF p_action='list' THEN RETURN jsonb_build_object('offers',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'package',package,'kind',kind,'value_minor',value_minor,'currency',currency,'billing_interval',billing_interval,'enabled',enabled)),'[]'::jsonb) FROM billing.commerce_offers WHERE kind IN ('percent','fixed')),'mappings',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) FROM (SELECT id,offer_id,version,package,market_code,currency,billing_interval,duration,duration_in_months,enabled,reviewed_at FROM public.stripe_live_offer_mappings ORDER BY created_at DESC LIMIT 200) x),'reservations',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) FROM (SELECT id,mapping_id,created_at,CASE WHEN consumed_at IS NOT NULL THEN 'consumed' WHEN EXISTS(SELECT 1 FROM public.stripe_live_offer_admin_audit audit_row WHERE audit_row.action='release' AND audit_row.target_id=reservation_row.id) THEN 'released' WHEN session_id IS NOT NULL THEN 'bound' ELSE 'unbound' END AS state FROM public.stripe_live_offer_reservations reservation_row ORDER BY created_at DESC LIMIT 200) x)); END IF;
 k:=(p_data->>'key')::uuid;
 IF k IS NULL THEN RAISE EXCEPTION 'REQUEST_KEY_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('live-offer-admin:'||k::text,0));
 SELECT * INTO a FROM public.stripe_live_offer_admin_audit WHERE request_key=k;
 IF FOUND THEN IF a.actor_id<>p_actor OR a.action<>p_action OR a.parameters<>p_data THEN RAISE EXCEPTION 'ADMIN_REPLAY_CONFLICT'; END IF; RETURN jsonb_build_object('id',a.target_id,'replayed',true); END IF;
 IF p_action='provision' THEN
  SELECT * INTO f FROM billing.commerce_offers WHERE id=(p_data->>'offer_id')::uuid FOR UPDATE;
  IF f.id IS NULL OR f.kind NOT IN ('percent','fixed') OR f.value_minor<=0 OR (f.kind='percent' AND f.value_minor>=100) OR coalesce(p_data->>'duration','') NOT IN ('once','repeating','forever') OR coalesce((p_data->>'reviewed')::boolean,false) IS NOT TRUE OR length(coalesce(p_data->>'review_reference',''))<3 THEN RAISE EXCEPTION 'LIVE_OFFER_REVIEW_REQUIRED'; END IF;
  IF coalesce(p_data->>'market','') NOT IN ('EG','INTL') OR coalesce(p_data->>'interval','') NOT IN ('month','year','one_time') OR f.currency IS DISTINCT FROM (CASE WHEN p_data->>'market'='EG' THEN 'EGP' ELSE 'USD' END) OR (f.billing_interval IS NOT NULL AND f.billing_interval<>p_data->>'interval') THEN RAISE EXCEPTION 'LIVE_OFFER_DEFINITION_MISMATCH'; END IF;
  IF p_data->>'duration' IS DISTINCT FROM f.discount_duration OR (p_data->>'duration_in_months')::integer IS DISTINCT FROM f.discount_duration_months THEN RAISE EXCEPTION 'LIVE_OFFER_DEFINITION_MISMATCH'; END IF;
  IF length(coalesce(p_data->>'coupon_id','')) NOT BETWEEN 1 AND 255 OR coalesce(p_data->>'promotion_code_id','') NOT LIKE 'promo_%' THEN RAISE EXCEPTION 'LIVE_OFFER_PROVIDER_IDS_REQUIRED'; END IF;
  q:=billing.commerce_price(f.package,p_data->>'market',p_data->>'interval');
  IF (q->>'original_minor')::bigint - (CASE WHEN f.kind='percent' THEN floor((q->>'original_minor')::numeric*f.value_minor/100)::bigint ELSE f.value_minor END) <=0 THEN RAISE EXCEPTION 'LIVE_OFFER_FREE_USE_EXISTING_PATH'; END IF;
  SELECT coalesce(max(version),0)+1 INTO v FROM public.stripe_live_offer_mappings WHERE offer_id=f.id AND market_code=p_data->>'market' AND billing_interval=p_data->>'interval';
  INSERT INTO public.stripe_live_offer_mappings(offer_id,version,package,market_code,currency,billing_interval,price_id,product_id,coupon_id,promotion_code_id,kind,value_minor,duration,duration_in_months,reviewed_at,enabled) VALUES(f.id,v,f.package,p_data->>'market',f.currency,p_data->>'interval',p_data->>'price_id',p_data->>'product_id',p_data->>'coupon_id',p_data->>'promotion_code_id',f.kind,f.value_minor,p_data->>'duration',(p_data->>'duration_in_months')::integer,now(),false) RETURNING * INTO m;
  INSERT INTO public.stripe_live_offer_admin_audit(actor_id,action,target_id,request_key,parameters) VALUES(p_actor,p_action,m.id,k,p_data);
  RETURN jsonb_build_object('id',m.id,'version',v,'enabled',false,'status','reviewed_pending_provider_proof');
 ELSIF p_action IN ('enable','disable') THEN
  SELECT * INTO m FROM public.stripe_live_offer_mappings WHERE id=(p_data->>'id')::uuid;
  PERFORM 1 FROM billing.commerce_offers WHERE id=m.offer_id FOR UPDATE;
  SELECT * INTO m FROM public.stripe_live_offer_mappings WHERE id=m.id FOR UPDATE;
  IF m.id IS NULL OR (p_action='enable' AND (coalesce((p_data->>'reviewed')::boolean,false) IS NOT TRUE OR length(coalesce(p_data->>'review_reference',''))<3)) THEN RAISE EXCEPTION 'LIVE_OFFER_REVIEW_REQUIRED'; END IF;
  IF p_action='enable' THEN UPDATE public.stripe_live_offer_mappings SET enabled=false WHERE offer_id=m.offer_id AND market_code=m.market_code AND billing_interval=m.billing_interval AND enabled; END IF;
  UPDATE public.stripe_live_offer_mappings SET enabled=(p_action='enable') WHERE id=m.id;
  INSERT INTO public.stripe_live_offer_admin_audit(actor_id,action,target_id,request_key,parameters) VALUES(p_actor,p_action,m.id,k,p_data);
  RETURN jsonb_build_object('id',m.id,'enabled',p_action='enable');
 ELSIF p_action='release' THEN
  IF billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'SERVICE_LIVE_ONLY'; END IF;
  SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=(p_data->>'id')::uuid;
  PERFORM 1 FROM billing.commerce_offers WHERE id=r.offer_id FOR UPDATE;
  SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=r.id FOR UPDATE;
  IF r.id IS NULL OR r.consumed_at IS NOT NULL OR r.subscription_id IS NOT NULL OR r.session_id IS NULL OR r.customer_id IS NULL OR r.session_id IS DISTINCT FROM p_data->>'session_id' OR r.customer_id IS DISTINCT FROM p_data->>'customer_id' OR p_data->>'status' IS DISTINCT FROM 'expired' OR p_data->>'payment_status' IS DISTINCT FROM 'unpaid' OR coalesce((p_data->>'terminal_verified')::boolean,false) IS NOT TRUE THEN RAISE EXCEPTION 'LIVE_OFFER_RELEASE_UNPROVEN'; END IF;
  INSERT INTO public.stripe_live_offer_admin_audit(actor_id,action,target_id,request_key,parameters) VALUES(p_actor,p_action,r.id,k,p_data);
  UPDATE public.stripe_live_offer_reservations SET expires_at=now() WHERE id=r.id;
  RETURN jsonb_build_object('id',r.id,'state','released');
 END IF;
 RAISE EXCEPTION 'INVALID_ADMIN_ACTION';
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.stripe_live_offer_admin(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.stripe_live_offer_admin(uuid,text,jsonb) TO service_role;
--> statement-breakpoint


-- Keep the established service gate, identity/phone checks, row locks,
-- cross-rail limits and retry fingerprint while permitting verified durations.
DO $$ DECLARE d text; old_guard text:=$guard$IF m.duration='repeating' THEN RAISE EXCEPTION 'LIVE_OFFER_DURATION_NOT_SUPPORTED'; END IF;$guard$;
BEGIN
 d:=pg_get_functiondef('public.reserve_stripe_live_offer(uuid,text,text,text,text,text,uuid,boolean)'::regprocedure);
 IF position(old_guard IN d)=0 THEN RAISE EXCEPTION 'COMMERCIAL_OFFER_RESERVE_SOURCE_CHANGED'; END IF;
 d:=replace(d,old_guard,$guard$IF m.duration IS DISTINCT FROM f.discount_duration OR m.duration_in_months IS DISTINCT FROM f.discount_duration_months THEN RAISE EXCEPTION 'LIVE_OFFER_DEFINITION_MISMATCH'; END IF;$guard$);
 d:=replace(d,'-- Repeating discounts need a separately verified temporal invoice policy; never guess.','-- Provider invoice proof verifies the configured duration independently.');
 d:=replace(d,$guard$IF (q->>'final_minor')::bigint<=0$guard$,$guard$IF q->>'offer_id' IS NULL THEN RAISE EXCEPTION 'LIVE_OFFER_AUTOMATIC_BETTER'; END IF;
 IF coalesce((q->>'term_renewal')::boolean,false) THEN RAISE EXCEPTION 'LIVE_OFFER_MANUAL_TERM_RENEWAL'; END IF;
 IF (q->>'final_minor')::bigint<=0$guard$);
 EXECUTE d;
END $$;
--> statement-breakpoint


-- Retain required financial records, but erase the newly added contact fields
-- at the same learner-erasure boundary as existing commerce records.
ALTER FUNCTION public.lc09_advance_deletion(uuid,uuid,text) RENAME TO lc09_pre_commercial_discount_deletion;
--> statement-breakpoint

ALTER FUNCTION public.lc09_pre_commercial_discount_deletion(uuid,uuid,text) SET SCHEMA billing;
--> statement-breakpoint

CREATE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 result:=billing.lc09_pre_commercial_discount_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN UPDATE billing.commerce_discount_terms SET recipient_email='',phone=NULL WHERE user_id=p_user_id; END IF;
 RETURN result;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION billing.lc09_pre_commercial_discount_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) TO service_role;
