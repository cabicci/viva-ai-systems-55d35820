CREATE TABLE public.stripe_live_offer_reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mapping_id uuid NOT NULL REFERENCES public.stripe_live_offer_mappings(id),
 offer_id uuid NOT NULL REFERENCES billing.commerce_offers(id), user_id uuid NOT NULL,
 recipient_email text NOT NULL, phone text, request_key uuid NOT NULL,
 expires_at timestamptz NOT NULL, original_minor bigint NOT NULL CHECK(original_minor>0), final_minor bigint NOT NULL CHECK(final_minor>0 AND final_minor<original_minor),
 customer_id text, session_id text UNIQUE, subscription_id text UNIQUE, consumed_invoice_id text UNIQUE, consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,request_key)
);
REVOKE ALL ON public.stripe_live_offer_reservations FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.stripe_live_offer_reservations TO service_role;
ALTER TABLE public.stripe_live_offer_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY stripe_live_offer_reservation_service ON public.stripe_live_offer_reservations TO service_role USING(true) WITH CHECK(true);
CREATE FUNCTION public.reserve_stripe_live_offer(p_user_id uuid,p_code text,p_package text,p_market text,p_interval text,p_phone text,p_key uuid,p_renewal boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE; m public.stripe_live_offer_mappings%ROWTYPE; r public.stripe_live_offer_reservations%ROWTYPE; e text; q jsonb; used bigint;
BEGIN
 IF NOT billing.is_service_role_caller() OR billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'SERVICE_LIVE_ONLY'; END IF;
 IF billing.account_deletion_blocked(p_user_id) THEN RAISE EXCEPTION 'ACCOUNT_DELETION_PENDING'; END IF;
 e:=billing.commerce_assert_identity(p_user_id);
 IF NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled) THEN RAISE EXCEPTION 'COMMERCE_DISABLED'; END IF;
 SELECT * INTO f FROM billing.commerce_offers WHERE code=upper(btrim(p_code)) FOR UPDATE;
 IF f.id IS NULL THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE user_id=p_user_id AND request_key=p_key;
 IF FOUND THEN
  SELECT * INTO m FROM public.stripe_live_offer_mappings WHERE id=r.mapping_id;
  IF r.offer_id<>f.id OR m.package<>p_package OR m.market_code<>p_market OR m.billing_interval<>p_interval OR r.phone IS DISTINCT FROM p_phone OR r.expires_at<=now() OR r.consumed_at IS NOT NULL THEN RAISE EXCEPTION 'LIVE_OFFER_REPLAY_CONFLICT'; END IF;
  RETURN to_jsonb(r)||jsonb_build_object('mapping',to_jsonb(m));
 END IF;
 q:=billing.commerce_quote(p_package,p_market,p_interval,p_code,e,p_renewal);
 IF (q->>'final_minor')::bigint<=0 OR q->>'offer_kind'='complimentary' THEN RAISE EXCEPTION 'LIVE_OFFER_FREE_USE_EXISTING_PATH'; END IF;
 IF f.require_phone THEN PERFORM billing.commerce_assert_offer_phone(f.id,p_phone,e,p_user_id); END IF;
 IF EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations x WHERE x.offer_id=f.id AND (x.user_id=p_user_id OR x.recipient_email=e OR (p_phone IS NOT NULL AND x.phone=p_phone)) AND (x.consumed_at IS NOT NULL OR x.expires_at>now())) THEN RAISE EXCEPTION 'COMMERCE_OFFER_ALREADY_USED'; END IF;
 SELECT * INTO m FROM public.stripe_live_offer_mappings WHERE offer_id=f.id AND package=p_package AND market_code=p_market AND billing_interval=p_interval AND currency=f.currency AND kind=f.kind AND value_minor=f.value_minor AND enabled AND reviewed_at IS NOT NULL ORDER BY version DESC LIMIT 1;
 IF m.id IS NULL THEN RAISE EXCEPTION 'LIVE_OFFER_NOT_MAPPED'; END IF;
 -- Repeating discounts need a separately verified temporal invoice policy; never guess.
 IF m.duration='repeating' THEN RAISE EXCEPTION 'LIVE_OFFER_DURATION_NOT_SUPPORTED'; END IF;
 INSERT INTO public.stripe_live_offer_reservations(mapping_id,offer_id,user_id,recipient_email,phone,request_key,expires_at,original_minor,final_minor)
 VALUES(m.id,f.id,p_user_id,e,p_phone,p_key,least(now()+interval '30 minutes',coalesce(f.valid_until,'infinity'::timestamptz)),(q->>'original_minor')::bigint,(q->>'final_minor')::bigint) RETURNING * INTO r;
 RETURN to_jsonb(r)||jsonb_build_object('mapping',to_jsonb(m));
END $$;
REVOKE ALL ON FUNCTION public.reserve_stripe_live_offer(uuid,text,text,text,text,text,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_stripe_live_offer(uuid,text,text,text,text,text,uuid,boolean) TO service_role;
-- Cross-channel checks run under the same commerce offer row lock as manual quotes.
ALTER FUNCTION billing.commerce_quote(text,text,text,text,text,boolean) RENAME TO commerce_pre_live_offer_quote;
CREATE FUNCTION billing.commerce_quote(p_package text,p_market text,p_interval text,p_code text,p_email text,p_renewal boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE; q jsonb; pending bigint; manual bigint;
BEGIN
 SELECT * INTO f FROM billing.commerce_offers WHERE code=upper(btrim(p_code)) FOR UPDATE;
 q:=billing.commerce_pre_live_offer_quote(p_package,p_market,p_interval,p_code,p_email,p_renewal);
 IF f.id IS NOT NULL THEN
  SELECT count(*) INTO pending FROM public.stripe_live_offer_reservations WHERE offer_id=f.id AND consumed_at IS NULL AND expires_at>now();
  SELECT count(*) INTO manual FROM billing.commerce_orders WHERE offer_id=f.id AND NOT offer_consumed AND expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected');
  IF f.max_redemptions IS NOT NULL AND f.consumed_count+pending+manual>=f.max_redemptions THEN RAISE EXCEPTION 'COMMERCE_OFFER_LIMIT'; END IF;
  IF EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations WHERE offer_id=f.id AND recipient_email=p_email AND (consumed_at IS NOT NULL OR expires_at>now())) THEN RAISE EXCEPTION 'COMMERCE_OFFER_ALREADY_USED'; END IF;
 END IF;
 RETURN q;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_quote(text,text,text,text,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.bind_stripe_live_offer(p_reservation_id uuid,p_user_id uuid,p_customer_id text,p_session_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.stripe_live_offer_reservations%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'SERVICE_LIVE_ONLY'; END IF;
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=p_reservation_id AND user_id=p_user_id FOR UPDATE;
 IF r.id IS NULL OR (r.session_id IS NOT NULL AND r.session_id<>p_session_id) OR (r.customer_id IS NOT NULL AND r.customer_id<>p_customer_id) THEN RAISE EXCEPTION 'LIVE_OFFER_BINDING_CONFLICT'; END IF;
 UPDATE public.stripe_live_offer_reservations SET customer_id=p_customer_id,session_id=p_session_id WHERE id=r.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.bind_stripe_live_offer(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bind_stripe_live_offer(uuid,uuid,text,text) TO service_role;
CREATE FUNCTION public.get_stripe_live_offer_evidence(p_reservation_id uuid,p_user_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.stripe_live_offer_reservations%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'SERVICE_LIVE_ONLY'; END IF;
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=p_reservation_id AND user_id=p_user_id;
 IF r.id IS NULL THEN RAISE EXCEPTION 'LIVE_OFFER_EVIDENCE_MISSING'; END IF;
 RETURN to_jsonb(r)||jsonb_build_object('mapping',(SELECT to_jsonb(m) FROM public.stripe_live_offer_mappings m WHERE id=r.mapping_id));
END $$;
REVOKE ALL ON FUNCTION public.get_stripe_live_offer_evidence(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_live_offer_evidence(uuid,uuid) TO service_role;
CREATE FUNCTION public.consume_stripe_live_offer(p_reservation_id uuid,p_user_id uuid,p_subscription_id text,p_invoice_id text,p_customer_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.stripe_live_offer_reservations%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'SERVICE_LIVE_ONLY'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,751603));
 PERFORM pg_advisory_xact_lock(hashtextextended('account-lifecycle:'||p_user_id::text,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('live-risk-user:'||p_user_id::text,0));
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=p_reservation_id AND user_id=p_user_id;
 PERFORM 1 FROM billing.commerce_offers WHERE id=r.offer_id FOR UPDATE;
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=r.id FOR UPDATE;
 IF r.id IS NULL OR r.customer_id IS DISTINCT FROM p_customer_id OR r.session_id IS NULL OR (r.subscription_id IS NOT NULL AND r.subscription_id<>p_subscription_id) THEN RAISE EXCEPTION 'LIVE_OFFER_BINDING_CONFLICT'; END IF;
 IF public.get_stripe_live_risk_hold(p_subscription_id,p_user_id) THEN RAISE EXCEPTION 'PAYMENT_RISK_HOLD'; END IF;
 IF r.consumed_at IS NULL THEN
  UPDATE public.stripe_live_offer_reservations SET subscription_id=p_subscription_id,consumed_invoice_id=p_invoice_id,consumed_at=now() WHERE id=r.id;
  UPDATE billing.commerce_offers SET consumed_count=consumed_count+1 WHERE id=r.offer_id;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.consume_stripe_live_offer(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_stripe_live_offer(uuid,uuid,text,text,text) TO service_role;
COMMENT ON TABLE public.stripe_live_offer_reservations IS 'Private service-only Live discount reservations; no standalone access grants. Checkout remains gated and mappings empty.';