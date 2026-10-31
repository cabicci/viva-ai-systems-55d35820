CREATE TABLE public.stripe_live_offer_admin_audit(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid NOT NULL,action text NOT NULL CHECK(action IN ('provision','enable','disable','release')),target_id uuid NOT NULL,request_key uuid NOT NULL UNIQUE,parameters jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.stripe_live_offer_admin_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.stripe_live_offer_admin_audit TO service_role;
ALTER TABLE public.stripe_live_offer_admin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY stripe_live_offer_admin_audit_service ON public.stripe_live_offer_admin_audit TO service_role USING(true) WITH CHECK(true);
CREATE FUNCTION public.stripe_live_offer_admin(p_actor uuid,p_action text,p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE; m public.stripe_live_offer_mappings%ROWTYPE; r public.stripe_live_offer_reservations%ROWTYPE; a public.stripe_live_offer_admin_audit%ROWTYPE; q jsonb; v integer; k uuid;
BEGIN
 IF NOT billing.is_service_role_caller() OR NOT public.has_role(p_actor,'admin') THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 IF p_action='list' THEN RETURN jsonb_build_object('offers',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'package',package,'kind',kind,'value_minor',value_minor,'currency',currency,'billing_interval',billing_interval,'enabled',enabled)),'[]'::jsonb) FROM billing.commerce_offers WHERE kind IN ('percent','fixed')),'mappings',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) FROM (SELECT id,offer_id,version,package,market_code,currency,billing_interval,duration,enabled,reviewed_at FROM public.stripe_live_offer_mappings ORDER BY created_at DESC LIMIT 200) x),'reservations',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) FROM (SELECT id,mapping_id,created_at,CASE WHEN consumed_at IS NOT NULL THEN 'consumed' WHEN EXISTS(SELECT 1 FROM public.stripe_live_offer_admin_audit a WHERE a.action='release' AND a.target_id=r.id) THEN 'released' WHEN session_id IS NOT NULL THEN 'bound' ELSE 'unbound' END AS state FROM public.stripe_live_offer_reservations r ORDER BY created_at DESC LIMIT 200) x)); END IF;
 k:=(p_data->>'key')::uuid;
 IF k IS NULL THEN RAISE EXCEPTION 'REQUEST_KEY_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('live-offer-admin:'||k::text,0));
 SELECT * INTO a FROM public.stripe_live_offer_admin_audit WHERE request_key=k;
 IF FOUND THEN IF a.actor_id<>p_actor OR a.action<>p_action OR a.parameters<>p_data THEN RAISE EXCEPTION 'ADMIN_REPLAY_CONFLICT'; END IF; RETURN jsonb_build_object('id',a.target_id,'replayed',true); END IF;
 IF p_action='provision' THEN
  SELECT * INTO f FROM billing.commerce_offers WHERE id=(p_data->>'offer_id')::uuid FOR UPDATE;
  IF f.id IS NULL OR f.kind NOT IN ('percent','fixed') OR f.value_minor<=0 OR (f.kind='percent' AND f.value_minor>=100) OR coalesce(p_data->>'duration','') NOT IN ('once','forever') OR coalesce((p_data->>'reviewed')::boolean,false) IS NOT TRUE OR length(coalesce(p_data->>'review_reference',''))<3 THEN RAISE EXCEPTION 'LIVE_OFFER_REVIEW_REQUIRED'; END IF;
  IF coalesce(p_data->>'market','') NOT IN ('EG','INTL') OR coalesce(p_data->>'interval','') NOT IN ('month','year') OR f.currency IS DISTINCT FROM (CASE WHEN p_data->>'market'='EG' THEN 'EGP' ELSE 'USD' END) OR (f.billing_interval IS NOT NULL AND f.billing_interval<>p_data->>'interval') THEN RAISE EXCEPTION 'LIVE_OFFER_DEFINITION_MISMATCH'; END IF;
  IF length(coalesce(p_data->>'coupon_id','')) NOT BETWEEN 1 AND 255 OR coalesce(p_data->>'promotion_code_id','') NOT LIKE 'promo_%' THEN RAISE EXCEPTION 'LIVE_OFFER_PROVIDER_IDS_REQUIRED'; END IF;
  q:=billing.commerce_price(f.package,p_data->>'market',p_data->>'interval');
  IF (q->>'original_minor')::bigint - (CASE WHEN f.kind='percent' THEN floor((q->>'original_minor')::numeric*f.value_minor/100)::bigint ELSE f.value_minor END) <=0 THEN RAISE EXCEPTION 'LIVE_OFFER_FREE_USE_EXISTING_PATH'; END IF;
  SELECT coalesce(max(version),0)+1 INTO v FROM public.stripe_live_offer_mappings WHERE offer_id=f.id AND market_code=p_data->>'market' AND billing_interval=p_data->>'interval';
  INSERT INTO public.stripe_live_offer_mappings(offer_id,version,package,market_code,currency,billing_interval,price_id,product_id,coupon_id,promotion_code_id,kind,value_minor,duration,reviewed_at,enabled) VALUES(f.id,v,f.package,p_data->>'market',f.currency,p_data->>'interval',p_data->>'price_id',p_data->>'product_id',p_data->>'coupon_id',p_data->>'promotion_code_id',f.kind,f.value_minor,p_data->>'duration',now(),false) RETURNING * INTO m;
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
REVOKE ALL ON FUNCTION public.stripe_live_offer_admin(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.stripe_live_offer_admin(uuid,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.stripe_live_offer_pending_expiry_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.session_id IS NOT NULL AND NEW.consumed_at IS NULL AND NEW.recipient_email<>'' AND NOT EXISTS(SELECT 1 FROM public.stripe_live_offer_admin_audit WHERE action='release' AND target_id=NEW.id) THEN NEW.expires_at:='infinity'::timestamptz; END IF;
 IF NEW.consumed_at IS DISTINCT FROM OLD.consumed_at AND EXISTS(SELECT 1 FROM public.stripe_live_offer_admin_audit WHERE action='release' AND target_id=NEW.id) THEN RAISE EXCEPTION 'LIVE_OFFER_RELEASED'; END IF;
 RETURN NEW;
END $$;
COMMENT ON TABLE public.stripe_live_offer_admin_audit IS 'Service-only immutable mapping review and terminal Session release evidence. Does not create Stripe objects or alter access or global Live gates.';