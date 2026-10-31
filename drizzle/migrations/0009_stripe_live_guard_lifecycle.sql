-- Live kill switch must not block Live lifecycle rows (price registration,
-- webhooks, refunds, existing subscriptions). It only gates new server-side
-- checkout creation (enforced in application code). Environment stays immutable.
CREATE OR REPLACE FUNCTION billing.guard_stripe_environment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = billing, public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stripe_environment IS DISTINCT FROM OLD.stripe_environment THEN
    RAISE EXCEPTION 'STRIPE_ENVIRONMENT_IMMUTABLE' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

COMMENT ON FUNCTION billing.guard_stripe_environment() IS
  'Keeps stripe_environment immutable. Live kill switch gates new checkout only, in server code.';

-- Subscriptions must reference a customer of the same environment (both directions).
CREATE OR REPLACE FUNCTION billing.guard_stripe_customer_subscription_environment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = billing, public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM billing.gateway_subscriptions s
    WHERE s.gateway_customer_id = NEW.gateway_customer_id
      AND s.stripe_environment <> NEW.stripe_environment
  ) THEN
    RAISE EXCEPTION 'STRIPE_ENVIRONMENT_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS stripe_customer_subscription_env_guard ON billing.gateway_customers;
CREATE TRIGGER stripe_customer_subscription_env_guard BEFORE INSERT OR UPDATE ON billing.gateway_customers
  FOR EACH ROW EXECUTE FUNCTION billing.guard_stripe_customer_subscription_environment();
