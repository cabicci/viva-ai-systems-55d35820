-- Stripe Live preparation (phase 1): separate environments, Live stays OFF.
-- Existing rows keep every identifier and timestamp; they are tagged 'test' by default.

CREATE TABLE IF NOT EXISTS billing.stripe_live_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  live_enabled boolean NOT NULL DEFAULT false,
  legal_entity text NOT NULL DEFAULT 'Cabicci LLC',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT ALL ON billing.stripe_live_control TO service_role;
ALTER TABLE billing.stripe_live_control ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE billing.stripe_live_control IS 'Server-side Stripe Live kill switch. Missing row = OFF.';

CREATE OR REPLACE FUNCTION billing.stripe_live_enabled()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = billing, public AS $$
  SELECT coalesce((SELECT live_enabled FROM billing.stripe_live_control WHERE singleton), false)
$$;
REVOKE ALL ON FUNCTION billing.stripe_live_enabled() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION billing.stripe_live_enabled() TO service_role;

CREATE OR REPLACE FUNCTION public.get_stripe_live_enabled()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = billing, public AS $$
  SELECT billing.stripe_live_enabled()
$$;
REVOKE ALL ON FUNCTION public.get_stripe_live_enabled() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_live_enabled() TO service_role;

CREATE OR REPLACE FUNCTION billing.guard_stripe_environment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = billing, public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stripe_environment IS DISTINCT FROM OLD.stripe_environment THEN
    RAISE EXCEPTION 'STRIPE_ENVIRONMENT_IMMUTABLE' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.stripe_environment = 'live' AND NOT billing.stripe_live_enabled() THEN
    RAISE EXCEPTION 'STRIPE_LIVE_DISABLED' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION billing.guard_stripe_subscription_customer_environment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = billing, public AS $$
BEGIN
  IF NEW.gateway_customer_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM billing.gateway_customers c
    WHERE c.gateway_customer_id = NEW.gateway_customer_id
      AND c.stripe_environment <> NEW.stripe_environment
  ) THEN
    RAISE EXCEPTION 'STRIPE_ENVIRONMENT_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'billing.gateway_price_mappings','billing.gateway_customers','billing.gateway_subscriptions',
    'billing.webhook_events','billing.payment_transactions','billing.refunds',
    'billing.academic_stripe_prices','billing.academic_stripe_subscriptions','billing.academic_stripe_events',
    'billing.technical_stripe_prices','billing.technical_stripe_subscriptions','billing.technical_stripe_events',
    'public.kids_stripe_prices','public.kids_stripe_subscriptions','public.kids_stripe_events','public.kids_stripe_refunds'
  ] LOOP
    IF to_regclass(t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS stripe_environment text NOT NULL DEFAULT %L', t, 'test');
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', t, replace(t,'.','_') || '_stripe_env_chk');
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK (stripe_environment IN (%L,%L))', t, replace(t,'.','_') || '_stripe_env_chk', 'test', 'live');
    EXECUTE format('DROP TRIGGER IF EXISTS stripe_environment_guard ON %s', t);
    EXECUTE format('CREATE TRIGGER stripe_environment_guard BEFORE INSERT OR UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION billing.guard_stripe_environment()', t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS stripe_subscription_customer_env_guard ON billing.gateway_subscriptions;
CREATE TRIGGER stripe_subscription_customer_env_guard BEFORE INSERT OR UPDATE ON billing.gateway_subscriptions
  FOR EACH ROW EXECUTE FUNCTION billing.guard_stripe_subscription_customer_environment();
