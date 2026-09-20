-- Roll back only the repeated-failure self-transition; preserve data and ACLs.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $guard$
BEGIN
  IF (SELECT prosrc FROM pg_proc WHERE oid = 'billing.subscription_next_access_state(text,text)'::regprocedure)
     IS DISTINCT FROM $expected$
  SELECT CASE
    WHEN p_event_type = 'payment_succeeded'
      AND p_from IN ('free_pending_verification', 'free_active', 'free_expired', 'paid_scheduled', 'past_due', 'paid_active')
      THEN 'paid_active'
    WHEN p_event_type = 'activation_scheduled'
      AND p_from IN ('free_pending_verification', 'free_active', 'free_expired')
      THEN 'paid_scheduled'
    WHEN p_event_type = 'activated'
      AND p_from IN ('paid_scheduled')
      THEN 'paid_active'
    WHEN p_event_type = 'payment_failed'
      AND p_from IN ('paid_active', 'paid_scheduled', 'past_due')
      THEN 'past_due'
    WHEN p_event_type = 'cancel_at_period_end'
      AND p_from IN ('paid_active', 'past_due')
      THEN 'canceled_at_period_end'
    WHEN p_event_type = 'canceled'
      AND p_from IN ('paid_active', 'paid_scheduled', 'past_due', 'canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'period_ended'
      AND p_from IN ('canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'period_ended'
      AND p_from IN ('paid_active')
      THEN 'paid_active'
    WHEN p_event_type = 'expired'
      AND p_from IN ('paid_active', 'paid_scheduled', 'past_due', 'canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'suspended'
      AND p_from IN ('paid_active', 'past_due')
      THEN 'suspended'
    WHEN p_event_type = 'resumed'
      AND p_from IN ('suspended')
      THEN 'paid_active'
    WHEN p_event_type = 'refund_pending'
      AND p_from IN ('paid_active', 'past_due', 'canceled_at_period_end', 'suspended')
      THEN 'refund_pending'
    WHEN p_event_type = 'refunded'
      AND p_from IN ('refund_pending', 'paid_active', 'past_due', 'canceled_at_period_end', 'suspended')
      THEN 'refunded'
    ELSE NULL
  END;
$expected$ THEN
    RAISE EXCEPTION 'SUBSCRIPTION_TRANSITION_BASELINE_CHANGED';
  END IF;
END;
$guard$;

CREATE OR REPLACE FUNCTION billing.subscription_next_access_state(p_from text, p_event_type text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'billing', 'public', 'pg_temp'
AS $function$
  SELECT CASE
    WHEN p_event_type = 'payment_succeeded'
      AND p_from IN ('free_pending_verification', 'free_active', 'free_expired', 'paid_scheduled', 'past_due', 'paid_active')
      THEN 'paid_active'
    WHEN p_event_type = 'activation_scheduled'
      AND p_from IN ('free_pending_verification', 'free_active', 'free_expired')
      THEN 'paid_scheduled'
    WHEN p_event_type = 'activated'
      AND p_from IN ('paid_scheduled')
      THEN 'paid_active'
    WHEN p_event_type = 'payment_failed'
      AND p_from IN ('paid_active', 'paid_scheduled')
      THEN 'past_due'
    WHEN p_event_type = 'cancel_at_period_end'
      AND p_from IN ('paid_active', 'past_due')
      THEN 'canceled_at_period_end'
    WHEN p_event_type = 'canceled'
      AND p_from IN ('paid_active', 'paid_scheduled', 'past_due', 'canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'period_ended'
      AND p_from IN ('canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'period_ended'
      AND p_from IN ('paid_active')
      THEN 'paid_active'
    WHEN p_event_type = 'expired'
      AND p_from IN ('paid_active', 'paid_scheduled', 'past_due', 'canceled_at_period_end')
      THEN 'expired'
    WHEN p_event_type = 'suspended'
      AND p_from IN ('paid_active', 'past_due')
      THEN 'suspended'
    WHEN p_event_type = 'resumed'
      AND p_from IN ('suspended')
      THEN 'paid_active'
    WHEN p_event_type = 'refund_pending'
      AND p_from IN ('paid_active', 'past_due', 'canceled_at_period_end', 'suspended')
      THEN 'refund_pending'
    WHEN p_event_type = 'refunded'
      AND p_from IN ('refund_pending', 'paid_active', 'past_due', 'canceled_at_period_end', 'suspended')
      THEN 'refunded'
    ELSE NULL
  END;
$function$;

COMMIT;
