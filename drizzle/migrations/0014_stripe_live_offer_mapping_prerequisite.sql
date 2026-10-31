CREATE TABLE public.stripe_live_offer_mappings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 offer_id uuid NOT NULL REFERENCES billing.commerce_offers(id),
 version integer NOT NULL CHECK(version>0),
 package text NOT NULL CHECK(package IN ('pro','pro_plus','kids','academic','technical')),
 market_code text NOT NULL CHECK(market_code IN ('EG','INTL')),
 currency text NOT NULL CHECK(currency IN ('EGP','USD')),
 billing_interval text NOT NULL CHECK(billing_interval IN ('month','year')),
 price_id text NOT NULL CHECK(price_id LIKE 'price_%'),
 product_id text NOT NULL CHECK(product_id LIKE 'prod_%'),
 coupon_id text NOT NULL CHECK(length(coupon_id) BETWEEN 1 AND 255),
 promotion_code_id text NOT NULL CHECK(promotion_code_id LIKE 'promo_%'),
 kind text NOT NULL CHECK(kind IN ('percent','fixed')),
 value_minor bigint NOT NULL CHECK(value_minor>0),
 duration text NOT NULL CHECK(duration IN ('once','repeating','forever')),
 duration_in_months integer,
 reviewed_at timestamptz,
 enabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(offer_id,market_code,billing_interval,version),
 CHECK((market_code='EG' AND currency='EGP') OR (market_code='INTL' AND currency='USD')),
 CHECK(kind<>'percent' OR value_minor<100),
 CHECK((duration='repeating' AND duration_in_months>0) OR (duration<>'repeating' AND duration_in_months IS NULL)),
 CHECK(NOT enabled OR reviewed_at IS NOT NULL)
);
REVOKE ALL ON public.stripe_live_offer_mappings FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.stripe_live_offer_mappings TO service_role;
ALTER TABLE public.stripe_live_offer_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY stripe_live_offer_mapping_service ON public.stripe_live_offer_mappings TO service_role USING(true) WITH CHECK(true);
CREATE FUNCTION public.stripe_live_offer_mapping_immutable() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (to_jsonb(NEW)-'enabled') IS DISTINCT FROM (to_jsonb(OLD)-'enabled') THEN RAISE EXCEPTION 'LIVE_OFFER_MAPPING_IMMUTABLE'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stripe_live_offer_mapping_immutable() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stripe_live_offer_mapping_immutable BEFORE UPDATE ON public.stripe_live_offer_mappings FOR EACH ROW EXECUTE FUNCTION public.stripe_live_offer_mapping_immutable();
COMMENT ON TABLE public.stripe_live_offer_mappings IS 'Reviewed immutable Live coupon definitions only. No checkout adapter is enabled by this prerequisite. No customer codes or identities stored here.';