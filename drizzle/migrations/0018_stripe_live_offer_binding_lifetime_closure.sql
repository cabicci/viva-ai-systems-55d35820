CREATE OR REPLACE FUNCTION public.bind_stripe_live_offer(p_reservation_id uuid,p_user_id uuid,p_customer_id text,p_session_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.stripe_live_offer_reservations%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'SERVICE_LIVE_ONLY'; END IF;
 IF p_customer_id IS NULL OR p_customer_id NOT LIKE 'cus_%' OR p_session_id IS NULL OR p_session_id NOT LIKE 'cs_%' THEN RAISE EXCEPTION 'LIVE_OFFER_BINDING_CONFLICT'; END IF;
 SELECT * INTO r FROM public.stripe_live_offer_reservations WHERE id=p_reservation_id AND user_id=p_user_id FOR UPDATE;
 IF r.id IS NULL OR (r.session_id IS NOT NULL AND r.session_id<>p_session_id) OR (r.customer_id IS NOT NULL AND r.customer_id<>p_customer_id) THEN RAISE EXCEPTION 'LIVE_OFFER_BINDING_CONFLICT'; END IF;
 IF r.session_id IS NULL AND r.expires_at<=now() THEN RAISE EXCEPTION 'LIVE_OFFER_RESERVATION_EXPIRED'; END IF;
 UPDATE public.stripe_live_offer_reservations SET customer_id=p_customer_id,session_id=p_session_id WHERE id=r.id;
 RETURN true;
END $$;
COMMENT ON COLUMN public.stripe_live_offer_reservations.expires_at IS 'Unbound/open-checkout reservation deadline. Bound unresolved payments continue reserving capacity; asynchronous payment release needs reconciled Stripe evidence.';
CREATE FUNCTION public.stripe_live_offer_pending_expiry_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.session_id IS NOT NULL AND NEW.consumed_at IS NULL AND NEW.recipient_email<>'' THEN NEW.expires_at:='infinity'::timestamptz; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stripe_live_offer_pending_expiry_guard() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stripe_live_offer_pending_expiry_guard BEFORE UPDATE ON public.stripe_live_offer_reservations FOR EACH ROW EXECUTE FUNCTION public.stripe_live_offer_pending_expiry_guard();