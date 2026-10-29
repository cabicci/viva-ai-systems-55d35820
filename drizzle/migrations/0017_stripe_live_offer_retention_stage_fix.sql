CREATE OR REPLACE FUNCTION public.stripe_live_offer_account_retention() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.stage='learner_erased' THEN UPDATE public.stripe_live_offer_reservations SET recipient_email='',phone=NULL,expires_at=least(expires_at,now()) WHERE user_id=NEW.user_id; END IF;
 IF NEW.financial_purged_at IS NOT NULL THEN DELETE FROM public.stripe_live_offer_reservations WHERE user_id=NEW.user_id; END IF;
 RETURN NEW;
END $$;