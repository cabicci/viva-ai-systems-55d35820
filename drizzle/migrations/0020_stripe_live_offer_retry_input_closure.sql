ALTER TABLE public.stripe_live_offer_reservations ADD COLUMN renewal boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.stripe_live_offer_reservation_input_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (to_jsonb(NEW)-ARRAY['recipient_email','phone','expires_at','customer_id','session_id','subscription_id','consumed_invoice_id','consumed_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['recipient_email','phone','expires_at','customer_id','session_id','subscription_id','consumed_invoice_id','consumed_at']) THEN RAISE EXCEPTION 'LIVE_OFFER_INPUT_IMMUTABLE'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stripe_live_offer_reservation_input_guard() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stripe_live_offer_reservation_input_guard BEFORE UPDATE ON public.stripe_live_offer_reservations FOR EACH ROW EXECUTE FUNCTION public.stripe_live_offer_reservation_input_guard();
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.reserve_stripe_live_offer(uuid,text,text,text,text,text,uuid,boolean)'::regprocedure);
 d:=replace(d,'r.offer_id<>f.id OR','r.renewal IS DISTINCT FROM p_renewal OR NOT f.enabled OR f.valid_until<=now() OR r.offer_id<>f.id OR');
 d:=replace(d,'IF FOUND THEN','IF FOUND THEN');
 d:=replace(d,'SELECT * INTO m FROM public.stripe_live_offer_mappings WHERE id=r.mapping_id;','SELECT * INTO m FROM public.stripe_live_offer_mappings WHERE id=r.mapping_id; IF NOT m.enabled THEN RAISE EXCEPTION ''LIVE_OFFER_NOT_MAPPED''; END IF;');
 d:=replace(d,'original_minor,final_minor)','original_minor,final_minor,renewal)');
 d:=replace(d,'(q->>''final_minor'')::bigint) RETURNING','(q->>''final_minor'')::bigint,p_renewal) RETURNING');
 EXECUTE d;
 d:=pg_get_functiondef('public.consume_stripe_live_offer(uuid,uuid,text,text,text)'::regprocedure);
 d:=replace(d,'IF r.id IS NULL OR','IF p_invoice_id IS NULL OR p_invoice_id NOT LIKE ''in_%'' OR p_subscription_id IS NULL OR p_subscription_id NOT LIKE ''sub_%'' OR r.id IS NULL OR');
 EXECUTE d;
END $$;