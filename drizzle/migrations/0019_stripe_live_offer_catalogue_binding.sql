CREATE FUNCTION public.stripe_live_offer_catalogue_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f billing.commerce_offers%ROWTYPE; q jsonb; ok boolean;
BEGIN
 SELECT * INTO f FROM billing.commerce_offers WHERE id=NEW.offer_id;
 IF f.package IS DISTINCT FROM NEW.package OR f.currency IS DISTINCT FROM NEW.currency OR f.kind IS DISTINCT FROM NEW.kind OR f.value_minor IS DISTINCT FROM NEW.value_minor OR (f.billing_interval IS NOT NULL AND f.billing_interval<>NEW.billing_interval) OR NEW.duration='repeating' THEN RAISE EXCEPTION 'LIVE_OFFER_DEFINITION_MISMATCH'; END IF;
 q:=billing.commerce_price(NEW.package,NEW.market_code,NEW.billing_interval);
 IF NEW.package='kids' THEN SELECT EXISTS(SELECT 1 FROM public.kids_stripe_prices WHERE stripe_environment='live' AND NOT discounted AND market_code=NEW.market_code AND billing_interval=NEW.billing_interval AND gateway_price_id=NEW.price_id AND gateway_product_id=NEW.product_id AND amount_minor=(q->>'original_minor')::bigint) INTO ok;
 ELSIF NEW.package='academic' THEN SELECT EXISTS(SELECT 1 FROM billing.academic_stripe_prices WHERE stripe_environment='live' AND NOT includes_assistant AND market_code=NEW.market_code AND billing_interval=NEW.billing_interval AND gateway_price_id=NEW.price_id AND gateway_product_id=NEW.product_id AND amount_minor=(q->>'original_minor')::bigint) INTO ok;
 ELSIF NEW.package='technical' THEN SELECT EXISTS(SELECT 1 FROM billing.technical_stripe_prices WHERE stripe_environment='live' AND market_code=NEW.market_code AND billing_interval=NEW.billing_interval AND gateway_price_id=NEW.price_id AND gateway_product_id=NEW.product_id AND amount_minor=(q->>'original_minor')::bigint) INTO ok;
 ELSE SELECT EXISTS(SELECT 1 FROM billing.gateway_price_mappings g JOIN billing.market_prices mp ON mp.id=g.market_price_id JOIN billing.plan_versions pv ON pv.id=mp.plan_version_id JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE g.stripe_environment='live' AND g.gateway_price_id=NEW.price_id AND g.gateway_product_id=NEW.product_id AND pc.plan_key=NEW.package AND mp.market_code=NEW.market_code AND pv.billing_interval=NEW.billing_interval AND mp.amount_minor=(q->>'original_minor')::bigint) INTO ok;
 END IF;
 IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'LIVE_OFFER_CATALOGUE_MISMATCH'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stripe_live_offer_catalogue_guard() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stripe_live_offer_catalogue_guard BEFORE INSERT OR UPDATE ON public.stripe_live_offer_mappings FOR EACH ROW EXECUTE FUNCTION public.stripe_live_offer_catalogue_guard();
ALTER TABLE public.stripe_live_offer_reservations DROP CONSTRAINT stripe_live_offer_reservations_offer_id_fkey;
ALTER TABLE public.stripe_live_offer_reservations ADD CONSTRAINT stripe_live_offer_reservations_offer_id_fkey FOREIGN KEY(offer_id) REFERENCES billing.commerce_offers(id) ON DELETE CASCADE;
ALTER TABLE public.stripe_live_offer_reservations DROP CONSTRAINT stripe_live_offer_reservations_mapping_id_fkey;
ALTER TABLE public.stripe_live_offer_reservations ADD CONSTRAINT stripe_live_offer_reservations_mapping_id_fkey FOREIGN KEY(mapping_id) REFERENCES public.stripe_live_offer_mappings(id) ON DELETE CASCADE;