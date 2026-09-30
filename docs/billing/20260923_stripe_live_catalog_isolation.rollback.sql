-- REVIEW ONLY. Roll back only before any Live records exist. Existing TEST rows
-- and functions remain untouched. Stop if Live records exist; do not destroy them.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM billing.gateway_price_mappings WHERE gateway_code='stripe_us_live')
    OR EXISTS (SELECT 1 FROM billing.gateway_customers WHERE gateway_code='stripe_us_live')
    OR EXISTS (SELECT 1 FROM billing.gateway_subscriptions WHERE gateway_code='stripe_us_live')
    OR EXISTS (SELECT 1 FROM billing.webhook_events WHERE gateway_code='stripe_us_live')
    OR EXISTS (SELECT 1 FROM billing.payment_transactions WHERE gateway_code='stripe_us_live')
    OR EXISTS (SELECT 1 FROM billing.refunds WHERE gateway_code='stripe_us_live') THEN
    RAISE EXCEPTION 'LIVE_RECORDS_PRESENT_ROLLBACK_FORBIDDEN';
  END IF;
END $$;
DROP FUNCTION public.get_stripe_checkout_context_live(uuid,text,text,text);
DROP FUNCTION public.register_stripe_gateway_catalog_live(uuid,text,text);
DROP FUNCTION public.resolve_stripe_subscription_plan_live(text);
DROP FUNCTION public.get_stripe_portal_context_live(uuid);
DROP INDEX billing.gateway_live_price_id_unique;
ALTER TABLE billing.gateway_price_mappings DROP CONSTRAINT gateway_price_mappings_gateway_check;
ALTER TABLE billing.gateway_price_mappings ADD CONSTRAINT gateway_price_mappings_gateway_check
  CHECK (gateway_code IN ('stripe_us','paymob_eg','future'));
ALTER TABLE billing.gateway_customers DROP CONSTRAINT gateway_customers_gateway_check;
ALTER TABLE billing.gateway_customers ADD CONSTRAINT gateway_customers_gateway_check
  CHECK (gateway_code IN ('stripe_us','paymob_eg','future'));
ALTER TABLE billing.gateway_subscriptions DROP CONSTRAINT gateway_subscriptions_gateway_check;
ALTER TABLE billing.gateway_subscriptions ADD CONSTRAINT gateway_subscriptions_gateway_check
  CHECK (gateway_code IN ('stripe_us','paymob_eg','future'));
COMMIT;
