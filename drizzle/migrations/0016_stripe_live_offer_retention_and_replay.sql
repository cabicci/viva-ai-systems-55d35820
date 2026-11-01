CREATE FUNCTION public.stripe_live_offer_retention() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  DELETE FROM public.stripe_live_offer_reservations WHERE user_id=OLD.user_id;
  RETURN OLD;
 END IF;
 IF NEW.recipient_email='' AND OLD.recipient_email<>'' THEN
  UPDATE public.stripe_live_offer_reservations SET recipient_email='',phone=NULL,expires_at=least(expires_at,now()) WHERE user_id=OLD.user_id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stripe_live_offer_retention() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stripe_live_offer_retention BEFORE UPDATE OF recipient_email OR DELETE ON billing.commerce_orders FOR EACH ROW EXECUTE FUNCTION public.stripe_live_offer_retention();
-- Reservation-only accounts must be cleaned even if they have no manual order.
CREATE FUNCTION public.stripe_live_offer_account_retention() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.stage='learner_erased' THEN UPDATE public.stripe_live_offer_reservations SET recipient_email='',phone=NULL,expires_at=least(expires_at,now()) WHERE user_id=NEW.user_id; END IF;
 IF NEW.stage IN ('financial_erased','completed') THEN DELETE FROM public.stripe_live_offer_reservations WHERE user_id=NEW.user_id; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stripe_live_offer_account_retention() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stripe_live_offer_account_retention AFTER UPDATE ON billing.account_deletion_lifecycle FOR EACH ROW EXECUTE FUNCTION public.stripe_live_offer_account_retention();
-- Mapping metadata is nonpersonal and must never block deletion of a targeted offer.
ALTER TABLE public.stripe_live_offer_mappings DROP CONSTRAINT stripe_live_offer_mappings_offer_id_fkey;
ALTER TABLE public.stripe_live_offer_mappings ADD CONSTRAINT stripe_live_offer_mappings_offer_id_fkey FOREIGN KEY(offer_id) REFERENCES billing.commerce_offers(id) ON DELETE CASCADE;
CREATE FUNCTION public.stripe_live_offer_retry_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.consumed_at IS NOT NULL AND (NEW.consumed_at IS DISTINCT FROM OLD.consumed_at OR NEW.consumed_invoice_id IS DISTINCT FROM OLD.consumed_invoice_id OR NEW.subscription_id IS DISTINCT FROM OLD.subscription_id) THEN RAISE EXCEPTION 'LIVE_OFFER_CONSUMPTION_IMMUTABLE'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stripe_live_offer_retry_guard() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stripe_live_offer_retry_guard BEFORE UPDATE ON public.stripe_live_offer_reservations FOR EACH ROW EXECUTE FUNCTION public.stripe_live_offer_retry_guard();