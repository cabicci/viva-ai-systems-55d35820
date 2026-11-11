-- Stripe Live campaign time is bound to a confirmed invoice and a single schedule.
CREATE TABLE billing.campaign_stripe_renewals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 window_id uuid NOT NULL REFERENCES billing.free_access_windows(id),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 scope text NOT NULL CHECK(scope IN ('core','academic','technical','kids')),
 internal_id uuid REFERENCES billing.subscriptions(id) ON DELETE CASCADE,
 subscription_id text NOT NULL,
 customer_id text NOT NULL,
 invoice_id text NOT NULL,
 price_id text,
 paid_start timestamptz,
 paid_end timestamptz NOT NULL,
 gift_end timestamptz NOT NULL CHECK(gift_end>paid_end),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','scheduled','blocked')),
 schedule_id text UNIQUE,
 create_started_at timestamptz,
 activated_at timestamptz,
 lease_id uuid,
 lease_until timestamptz,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 failure_code text,
 UNIQUE(window_id,subscription_id),
 CHECK((scope='core')=(internal_id IS NOT NULL)),
 CHECK(state<>'scheduled' OR (schedule_id IS NOT NULL AND price_id IS NOT NULL AND paid_start IS NOT NULL))
);
ALTER TABLE billing.campaign_stripe_renewals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.campaign_stripe_renewals FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX campaign_stripe_renewals_due ON billing.campaign_stripe_renewals(next_attempt_at)
 WHERE state IN ('pending','scheduled') AND activated_at IS NULL;
CREATE INDEX campaign_stripe_renewals_subscription ON billing.campaign_stripe_renewals(subscription_id,gift_end);
CREATE INDEX campaign_stripe_renewals_account ON billing.campaign_stripe_renewals(user_id,gift_end);
CREATE INDEX campaign_stripe_renewals_core ON billing.campaign_stripe_renewals(internal_id,gift_end) WHERE activated_at IS NOT NULL;
--> statement-breakpoint

-- The Stripe reader subsequently proves that the recorded invoice paid for the
-- current period, with the same customer, subscription, price and item.
CREATE VIEW billing.campaign_stripe_paid AS
 SELECT s.user_id,'core'::text AS scope,s.id AS internal_id,
   g.gateway_subscription_id AS subscription_id,g.gateway_customer_id AS customer_id,
   p.gateway_transaction_id AS invoice_id,s.current_period_end AS paid_end
 FROM billing.subscriptions s
 JOIN billing.gateway_subscriptions g ON g.subscription_id=s.id
 JOIN LATERAL (
   SELECT t.gateway_transaction_id FROM billing.payment_transactions t
   WHERE t.subscription_id=s.id AND t.user_id=s.user_id AND t.stripe_environment='live'
     AND t.gateway_code='stripe_us_live' AND t.status='succeeded' AND t.amount_minor>0
     AND t.transaction_type IN ('checkout','renewal') AND t.succeeded_at IS NOT NULL
   ORDER BY t.succeeded_at DESC,t.id DESC LIMIT 1
 ) p ON true
 WHERE s.access_state='paid_active' AND NOT s.cancel_at_period_end AND g.stripe_environment='live'
   AND g.gateway_code='stripe_us_live' AND g.status='active'
 UNION ALL
 SELECT s.user_id,'academic',NULL,s.subscription_id,s.customer_id,s.paid_invoice_id,s.ends_at
 FROM billing.academic_stripe_subscriptions s
 WHERE s.stripe_environment='live' AND s.status='active' AND NOT s.refunded
 UNION ALL
 SELECT s.user_id,'technical',NULL,s.subscription_id,s.customer_id,s.paid_invoice_id,s.ends_at
 FROM billing.technical_stripe_subscriptions s
 WHERE s.stripe_environment='live' AND s.status='active' AND NOT s.refunded
 UNION ALL
 SELECT s.parent_id,'kids',NULL,s.gateway_subscription_id,s.gateway_customer_id,s.latest_paid_invoice_id,s.paid_through
 FROM public.kids_stripe_subscriptions s JOIN public.kids_family_entitlements e ON e.parent_id=s.parent_id
   AND e.entitlement_reference='stripe-live:'||s.gateway_subscription_id AND e.active_until=s.paid_through
 WHERE s.stripe_environment='live' AND s.status='active';
REVOKE ALL ON billing.campaign_stripe_paid FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE FUNCTION public.claim_campaign_stripe_renewals() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE jobs jsonb;
BEGIN
 PERFORM billing.commercial_require_service();
 IF billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'CAMPAIGN_STRIPE_LIVE_REQUIRED' USING ERRCODE='42501'; END IF;
 IF NOT billing.stripe_live_enabled() OR NOT pg_try_advisory_xact_lock(hashtextextended('campaign-stripe-renewals',0))
 THEN RETURN '[]'::jsonb; END IF;
 INSERT INTO billing.campaign_stripe_renewals(window_id,user_id,scope,internal_id,subscription_id,customer_id,invoice_id,paid_end,gift_end)
 SELECT w.id,p.user_id,p.scope,p.internal_id,p.subscription_id,p.customer_id,p.invoice_id,p.paid_end,
   date_trunc('second',p.paid_end+(w.ends_at-w.starts_at))
 FROM billing.campaign_stripe_paid p
 JOIN LATERAL (
   SELECT win.* FROM billing.free_access_windows win
   WHERE win.enabled AND win.starts_at<=now() AND now()<win.ends_at
     AND win.ends_at-win.starts_at>=interval '1 second'
     AND NOT EXISTS(SELECT 1 FROM billing.campaign_stripe_renewals a WHERE a.window_id=win.id AND a.subscription_id=p.subscription_id)
   ORDER BY win.starts_at,win.id LIMIT 1
 ) w ON true
 WHERE p.paid_end>now()+interval '30 seconds' AND p.invoice_id ~ '^in_[A-Za-z0-9]+$'
   AND billing.commercial_account_allowed(p.user_id)
   AND NOT billing.stripe_live_hold_exists(p.subscription_id,p.user_id)
   AND NOT EXISTS(SELECT 1 FROM billing.campaign_stripe_renewals a
     WHERE a.subscription_id=p.subscription_id AND a.gift_end>now() AND a.state IN ('pending','scheduled'))
 ORDER BY p.paid_end,p.subscription_id LIMIT 6
 ON CONFLICT (window_id,subscription_id) DO NOTHING;

 WITH due AS (
  SELECT a.id FROM billing.campaign_stripe_renewals a
  WHERE a.next_attempt_at<=now() AND (a.lease_until IS NULL OR a.lease_until<=now())
   AND ((a.state='pending' AND a.gift_end>now())
    OR (a.state='scheduled' AND a.activated_at IS NULL AND a.paid_end<=now() AND a.gift_end>now()))
  ORDER BY a.next_attempt_at,a.paid_end,a.id LIMIT 6 FOR UPDATE SKIP LOCKED
 ), claimed AS (
  UPDATE billing.campaign_stripe_renewals a SET lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes'
  FROM due WHERE a.id=due.id RETURNING a.*
 )
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',a.id,'lease',a.lease_id,'userId',a.user_id,'scope',a.scope,'internalId',a.internal_id,'subscriptionId',a.subscription_id,
   'customerId',a.customer_id,'invoiceId',a.invoice_id,'paidEnd',extract(epoch FROM a.paid_end)::bigint,
   'giftEnd',extract(epoch FROM a.gift_end)::bigint,'state',a.state,'scheduleId',a.schedule_id,
   'priceId',a.price_id,'paidStart',extract(epoch FROM a.paid_start)::bigint,
   'createStarted',extract(epoch FROM a.create_started_at)::bigint
  )),'[]'::jsonb) INTO jobs FROM claimed a;
 RETURN jobs;
END $$;
REVOKE ALL ON FUNCTION public.claim_campaign_stripe_renewals() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_campaign_stripe_renewals() TO service_role;
--> statement-breakpoint

CREATE FUNCTION public.step_campaign_stripe_renewal(
 p_id uuid,p_lease uuid,p_step text,p_schedule text DEFAULT NULL,
 p_price text DEFAULT NULL,p_start bigint DEFAULT NULL,p_code text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a billing.campaign_stripe_renewals%ROWTYPE; owner_id uuid;
BEGIN
 PERFORM billing.commercial_require_service();
 IF billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'CAMPAIGN_STRIPE_LIVE_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT user_id INTO owner_id FROM billing.campaign_stripe_renewals WHERE id=p_id;
 IF owner_id IS NULL THEN RETURN false; END IF;
 PERFORM billing.commercial_lock(owner_id);
 SELECT * INTO a FROM billing.campaign_stripe_renewals WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR p_lease IS NULL OR a.lease_id IS DISTINCT FROM p_lease OR a.lease_until<=now() THEN RETURN false; END IF;

 IF p_step IN ('create','authorize') THEN
  IF a.state<>'pending' OR a.paid_end<=now()+interval '20 seconds' OR NOT billing.stripe_live_enabled()
   OR NOT billing.commercial_account_allowed(owner_id) OR billing.stripe_live_hold_exists(a.subscription_id,owner_id)
   OR NOT EXISTS(SELECT 1 FROM billing.free_access_windows w WHERE w.id=a.window_id AND w.enabled
     AND w.starts_at<=now() AND now()<w.ends_at
     AND date_trunc('second',a.paid_end+(w.ends_at-w.starts_at))=a.gift_end)
   OR NOT EXISTS(SELECT 1 FROM billing.campaign_stripe_paid p WHERE p.subscription_id=a.subscription_id
     AND p.user_id=owner_id AND p.scope=a.scope AND p.customer_id=a.customer_id
     AND p.invoice_id=a.invoice_id AND p.paid_end=a.paid_end) THEN RETURN false; END IF;
  IF p_step='create' THEN
   UPDATE billing.campaign_stripe_renewals SET create_started_at=coalesce(create_started_at,clock_timestamp()) WHERE id=a.id;
  END IF;
 ELSIF p_step='bind' THEN
  IF a.state<>'pending' OR a.create_started_at IS NULL OR p_schedule IS NULL OR p_schedule !~ '^sub_sched_[A-Za-z0-9]+$'
   OR p_price IS NULL OR p_price !~ '^price_[A-Za-z0-9]+$' OR p_start IS NULL OR to_timestamp(p_start)>=a.paid_end
   OR (a.schedule_id IS NOT NULL AND (a.schedule_id,a.price_id,a.paid_start)
     IS DISTINCT FROM (p_schedule,p_price,to_timestamp(p_start))) THEN RETURN false; END IF;
  UPDATE billing.campaign_stripe_renewals SET schedule_id=p_schedule,price_id=p_price,paid_start=to_timestamp(p_start) WHERE id=a.id;
 ELSIF p_step='scheduled' THEN
  IF a.state<>'pending' OR a.schedule_id IS NULL OR a.schedule_id IS DISTINCT FROM p_schedule THEN RETURN false; END IF;
  UPDATE billing.campaign_stripe_renewals SET state='scheduled',lease_id=NULL,lease_until=NULL,
   next_attempt_at=paid_end,failure_code=NULL WHERE id=a.id;
 ELSIF p_step IN ('retry','blocked') THEN
  IF p_code IS NULL OR p_code !~ '^CAMPAIGN_STRIPE_[A-Z_]+$' THEN RETURN false; END IF;
  UPDATE billing.campaign_stripe_renewals SET
   state=CASE WHEN p_step='blocked' THEN 'blocked' ELSE state END,lease_id=NULL,lease_until=NULL,
   next_attempt_at=now()+interval '5 minutes',failure_code=p_code WHERE id=a.id;
 ELSE
  RETURN false;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.step_campaign_stripe_renewal(uuid,uuid,text,text,text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.step_campaign_stripe_renewal(uuid,uuid,text,text,text,bigint,text) TO service_role;
--> statement-breakpoint

-- Read-only proof for the signed zero-invoice path. A known gift invoice is
-- acknowledged separately from positive payment, with no paid-question reset.
CREATE FUNCTION public.get_campaign_stripe_renewal(p_id uuid,p_subscription text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commercial_require_service();
 IF billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'CAMPAIGN_STRIPE_LIVE_REQUIRED' USING ERRCODE='42501'; END IF;
 RETURN (SELECT jsonb_build_object('id',a.id,'userId',a.user_id,'scope',a.scope,'internalId',a.internal_id,'subscriptionId',a.subscription_id,
   'customerId',a.customer_id,'priceId',a.price_id,'scheduleId',a.schedule_id,
   'paidEnd',extract(epoch FROM a.paid_end)::bigint,'giftEnd',extract(epoch FROM a.gift_end)::bigint)
  FROM billing.campaign_stripe_renewals a WHERE a.id=p_id AND a.subscription_id=p_subscription AND a.state='scheduled');
END $$;
REVOKE ALL ON FUNCTION public.get_campaign_stripe_renewal(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_stripe_renewal(uuid,text) TO service_role;
--> statement-breakpoint

-- The account UI passes the existing opaque subscription display key.
CREATE FUNCTION public.get_campaign_stripe_cancellation(p_user uuid,p_source text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commercial_require_service();
 IF billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'CAMPAIGN_STRIPE_LIVE_REQUIRED' USING ERRCODE='42501'; END IF;
 IF NOT billing.commercial_account_allowed(p_user) OR p_source IS NULL OR p_source !~ '^[a-f0-9]{32}$' THEN RETURN NULL; END IF;
 RETURN (SELECT jsonb_build_object('id',a.id,'userId',a.user_id,'scope',a.scope,'internalId',a.internal_id,
   'subscriptionId',a.subscription_id,'customerId',a.customer_id,'priceId',a.price_id,'scheduleId',a.schedule_id,
   'paidEnd',extract(epoch FROM a.paid_end)::bigint,'giftEnd',extract(epoch FROM a.gift_end)::bigint)
  FROM billing.campaign_stripe_renewals a WHERE a.user_id=p_user AND a.state='scheduled'
   AND a.gift_end+interval '1 year 1 day'>now()
   AND md5(a.user_id::text||':'||CASE a.scope
    WHEN 'core' THEN 'ai:'||a.internal_id
    WHEN 'kids' THEN 'kids-stripe:'||a.subscription_id||':live'
    ELSE a.scope||':'||a.subscription_id||':live' END)=p_source
  ORDER BY a.gift_end DESC LIMIT 1);
END $$;
REVOKE ALL ON FUNCTION public.get_campaign_stripe_cancellation(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_stripe_cancellation(uuid,text) TO service_role;
--> statement-breakpoint


-- The worker and signed webhook both call this after reading the exact active
-- trial from Stripe. Hold, ownership and paid-origin checks still apply.
CREATE FUNCTION public.activate_campaign_stripe_renewal(p_id uuid,p_schedule text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a billing.campaign_stripe_renewals%ROWTYPE; owner_id uuid;
BEGIN
 PERFORM billing.commercial_require_service();
 IF billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'CAMPAIGN_STRIPE_LIVE_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT user_id INTO owner_id FROM billing.campaign_stripe_renewals WHERE id=p_id;
 IF owner_id IS NULL THEN RETURN false; END IF;
 PERFORM billing.commercial_lock(owner_id);
 SELECT * INTO a FROM billing.campaign_stripe_renewals WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR a.state<>'scheduled' OR a.schedule_id IS DISTINCT FROM p_schedule
  OR now()<a.paid_end OR now()>=a.gift_end OR NOT billing.stripe_live_enabled()
  OR NOT billing.commercial_account_allowed(owner_id) OR billing.stripe_live_hold_exists(a.subscription_id,owner_id)
 THEN RETURN false; END IF;
 IF a.activated_at IS NOT NULL THEN RETURN true; END IF;
 CASE a.scope
  WHEN 'core' THEN
   UPDATE billing.subscriptions s SET current_period_end=a.gift_end
   WHERE s.id=a.internal_id AND s.user_id=owner_id AND s.access_state IN ('paid_active','canceled_at_period_end')
    AND s.current_period_start=a.paid_start AND s.current_period_end=a.paid_end
    AND EXISTS(SELECT 1 FROM billing.gateway_subscriptions g WHERE g.subscription_id=s.id
     AND g.gateway_code='stripe_us_live' AND g.stripe_environment='live' AND g.gateway_subscription_id=a.subscription_id
     AND g.gateway_customer_id=a.customer_id)
    AND EXISTS(SELECT 1 FROM billing.payment_transactions t WHERE t.subscription_id=s.id AND t.user_id=owner_id
     AND t.gateway_code='stripe_us_live' AND t.stripe_environment='live' AND t.gateway_transaction_id=a.invoice_id
     AND t.status='succeeded' AND t.amount_minor>0);
  WHEN 'academic' THEN
   UPDATE billing.academic_stripe_subscriptions s SET ends_at=a.gift_end
   WHERE s.user_id=owner_id AND s.subscription_id=a.subscription_id AND s.customer_id=a.customer_id
    AND s.price_id=a.price_id AND s.stripe_environment='live' AND s.status IN ('active','trialing') AND NOT s.refunded
    AND s.paid_invoice_id=a.invoice_id AND s.starts_at=a.paid_start AND s.ends_at=a.paid_end;
  WHEN 'technical' THEN
   UPDATE billing.technical_stripe_subscriptions s SET ends_at=a.gift_end
   WHERE s.user_id=owner_id AND s.subscription_id=a.subscription_id AND s.customer_id=a.customer_id
    AND s.price_id=a.price_id AND s.stripe_environment='live' AND s.status IN ('active','trialing') AND NOT s.refunded
    AND s.paid_invoice_id=a.invoice_id AND s.starts_at=a.paid_start AND s.ends_at=a.paid_end;
  WHEN 'kids' THEN
   PERFORM 1 FROM public.kids_stripe_subscriptions s WHERE s.parent_id=owner_id AND s.gateway_subscription_id=a.subscription_id
    AND s.gateway_customer_id=a.customer_id AND s.gateway_price_id=a.price_id AND s.stripe_environment='live'
    AND s.status IN ('active','trialing') AND s.latest_paid_invoice_id=a.invoice_id AND s.paid_through=a.paid_end FOR UPDATE;
   IF NOT FOUND THEN RETURN false; END IF;
   UPDATE public.kids_family_entitlements e SET active_until=a.gift_end
   WHERE e.parent_id=owner_id AND e.entitlement_reference='stripe-live:'||a.subscription_id
    AND e.active_from=a.paid_start AND e.active_until=a.paid_end;
   IF NOT FOUND THEN RETURN false; END IF;
   UPDATE public.kids_stripe_subscriptions SET paid_through=a.gift_end
   WHERE parent_id=owner_id AND stripe_environment='live';
 END CASE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE billing.campaign_stripe_renewals SET activated_at=now(),lease_id=NULL,lease_until=NULL,failure_code=NULL WHERE id=a.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.activate_campaign_stripe_renewal(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.activate_campaign_stripe_renewal(uuid,text) TO service_role;
--> statement-breakpoint

-- An older core update or duplicate positive receipt must not truncate the
-- verified extension. The new paid period or a risk/cancellation still wins.
CREATE FUNCTION billing.keep_active_campaign_stripe_core_end() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.current_period_end<OLD.current_period_end AND NEW.current_period_start=OLD.current_period_start
  AND NEW.access_state='paid_active' AND NOT NEW.cancel_at_period_end
  AND EXISTS(SELECT 1 FROM billing.campaign_stripe_renewals a WHERE a.internal_id=OLD.id
   AND a.activated_at IS NOT NULL AND a.gift_end>now() AND a.gift_end=OLD.current_period_end
   AND a.paid_end=NEW.current_period_end AND a.paid_start=NEW.current_period_start)
 THEN NEW.current_period_end:=OLD.current_period_end; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.keep_active_campaign_stripe_core_end() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER keep_active_campaign_stripe_core_end BEFORE UPDATE OF current_period_end ON billing.subscriptions
 FOR EACH ROW EXECUTE FUNCTION billing.keep_active_campaign_stripe_core_end();
--> statement-breakpoint

-- Keep both paid question clocks and the independently expiring campaign pool.
DO $copy$
DECLARE definition text; prefix text:='CREATE OR REPLACE FUNCTION billing.assistant_source_specs(';
BEGIN
 definition:=pg_get_functiondef('billing.assistant_source_specs(uuid,text,text,uuid,timestamptz)'::regprocedure);
 IF left(definition,length(prefix))<>prefix OR position('billing.campaign_prior_assistant_sources' IN definition)=0
 THEN RAISE EXCEPTION 'CAMPAIGN_STRIPE_QUESTION_BASELINE_CHANGED'; END IF;
 EXECUTE 'CREATE FUNCTION billing.campaign_manual_assistant_sources('||substr(definition,length(prefix)+1);
END $copy$;
REVOKE ALL ON FUNCTION billing.campaign_manual_assistant_sources(uuid,text,text,uuid,timestamptz)
 FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION billing.assistant_source_specs(p_user uuid,p_area text,p_course text,p_child uuid,p_at timestamptz)
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units integer,recurring boolean,per_lesson integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT s.source_key,s.anchor,least(s.valid_until,g.paid_end),s.units,
  CASE WHEN g.paid_end IS NULL THEN s.recurring ELSE g.paid_end-s.anchor>interval '32 days' END,s.per_lesson
 FROM billing.campaign_manual_assistant_sources(p_user,p_area,p_course,p_child,p_at) s
 LEFT JOIN LATERAL (
  SELECT a.paid_end FROM billing.campaign_stripe_renewals a
  WHERE a.user_id=p_user AND a.activated_at IS NOT NULL AND a.gift_end=s.valid_until AND a.paid_start=s.anchor
   AND s.source_key=CASE a.scope
    WHEN 'core' THEN 'ai:'||a.internal_id
    WHEN 'kids' THEN 'kids:'||p_user||':'||p_child
    ELSE a.scope||':'||a.subscription_id||':'||p_course END
  LIMIT 1
 ) g ON true
 WHERE g.paid_end IS NULL OR p_at<g.paid_end
$$;
REVOKE ALL ON FUNCTION billing.assistant_source_specs(uuid,text,text,uuid,timestamptz)
 FROM PUBLIC,anon,authenticated,service_role;
