CREATE OR REPLACE FUNCTION billing.commerce_quote(p_package text,p_market text,p_interval text,p_code text,p_email text,p_renewal boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE; q jsonb; pending bigint; manual bigint; customer_manual bigint; customer_live bigint;
BEGIN
 SELECT * INTO f FROM billing.commerce_offers WHERE code=upper(btrim(p_code)) FOR UPDATE;
 q:=billing.commerce_pre_live_offer_quote(p_package,p_market,p_interval,p_code,p_email,p_renewal);
 IF f.id IS NOT NULL THEN
  SELECT count(*) INTO pending FROM public.stripe_live_offer_reservations WHERE offer_id=f.id AND consumed_at IS NULL AND expires_at>now();
  SELECT count(*) INTO manual FROM billing.commerce_orders WHERE offer_id=f.id AND NOT offer_consumed AND expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected');
  IF f.max_redemptions IS NOT NULL AND f.consumed_count+pending+manual>=f.max_redemptions THEN RAISE EXCEPTION 'COMMERCE_OFFER_LIMIT'; END IF;
  SELECT count(*) INTO customer_manual FROM billing.commerce_orders WHERE offer_id=f.id AND recipient_email=p_email AND (offer_consumed OR (expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected')));
  SELECT count(*) INTO customer_live FROM public.stripe_live_offer_reservations WHERE offer_id=f.id AND recipient_email=p_email AND (consumed_at IS NOT NULL OR expires_at>now());
  IF customer_manual+customer_live>=f.per_email_limit THEN RAISE EXCEPTION 'COMMERCE_OFFER_LIMIT'; END IF;
  IF EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations r JOIN public.stripe_live_offer_mappings m ON m.id=r.mapping_id WHERE r.recipient_email=p_email AND r.consumed_at IS NOT NULL AND (f.eligibility='new_customer' OR (NOT f.renewals AND m.package=p_package))) THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
 END IF;
 RETURN q;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_quote(text,text,text,text,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
-- The shared quote enforces the configured per-email count; phone-required
-- offers retain their existing stronger one-identity/phone deduplication.
DO $$ DECLARE d text; needle text:=$n$IF EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations x WHERE x.offer_id=f.id AND (x.user_id=p_user_id OR x.recipient_email=e OR (p_phone IS NOT NULL AND x.phone=p_phone)) AND (x.consumed_at IS NOT NULL OR x.expires_at>now())) THEN RAISE EXCEPTION 'COMMERCE_OFFER_ALREADY_USED'; END IF;$n$;
BEGIN
 d:=pg_get_functiondef('public.reserve_stripe_live_offer(uuid,text,text,text,text,text,uuid,boolean)'::regprocedure);
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'LIVE_OFFER_SHARED_GUARD_SOURCE_CHANGED'; END IF;
 EXECUTE replace(d,needle,'');
END $$;
CREATE FUNCTION billing.commerce_cross_rail_attempt_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid; k text;
BEGIN
 u:=NEW.user_id;
 IF u IS NULL THEN RETURN NEW; END IF;
 IF TG_TABLE_SCHEMA='public' THEN k:=NEW.request_key::text;
 ELSE
  IF left(NEW.request_key,length(u::text)+1)<>u::text||':' THEN RETURN NEW; END IF;
  k:=substr(NEW.request_key,length(u::text)+2);
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('commerce-rail-attempt:'||u::text||':'||k,0));
 IF TG_TABLE_SCHEMA='public' THEN
  IF EXISTS(SELECT 1 FROM billing.commerce_orders WHERE request_key=u::text||':'||k) THEN RAISE EXCEPTION 'LIVE_OFFER_REPLAY_CONFLICT'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations WHERE user_id=u AND request_key::text=k) THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_cross_rail_attempt_guard() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commerce_cross_rail_attempt_guard BEFORE INSERT ON billing.commerce_orders FOR EACH ROW EXECUTE FUNCTION billing.commerce_cross_rail_attempt_guard();
CREATE TRIGGER commerce_cross_rail_attempt_guard BEFORE INSERT ON public.stripe_live_offer_reservations FOR EACH ROW EXECUTE FUNCTION billing.commerce_cross_rail_attempt_guard();
COMMENT ON FUNCTION billing.commerce_cross_rail_attempt_guard() IS 'One parameter-bound attempt belongs to one payment rail; changing rail requires a new attempt after appropriate cancellation/reconciliation. Never changes historical orders, subscriptions or grants.';