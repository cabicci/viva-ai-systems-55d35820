-- Keep prior v1 welcome payload retryable; only future confirmations receive v2.
ALTER TABLE public.account_welcome_outbox ADD COLUMN template_version integer NOT NULL DEFAULT 2;
ALTER TABLE public.account_welcome_outbox ADD COLUMN display_name text;
ALTER TABLE public.account_welcome_outbox ADD COLUMN preferred_locale text;
UPDATE public.account_welcome_outbox SET template_version=1;

CREATE OR REPLACE FUNCTION public.queue_account_welcome_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL AND NEW.email <> ''
     AND (TG_OP = 'INSERT' OR OLD.email_confirmed_at IS NULL) THEN
    INSERT INTO public.account_welcome_outbox(user_id,recipient,template_version,display_name,preferred_locale)
    VALUES (NEW.id,NEW.email,2,LEFT(NEW.raw_user_meta_data->>'full_name',80),NEW.raw_user_meta_data->>'preferred_locale')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Separate RPC keeps the already deployed v1 worker compatible during rollout.
CREATE FUNCTION public.claim_account_welcome_emails_v2()
RETURNS TABLE(user_id uuid,recipient text,claim_token uuid,template_version integer,display_name text,preferred_locale text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT o.user_id FROM public.account_welcome_outbox o
    JOIN auth.users u ON u.id=o.user_id AND u.email=o.recipient AND u.email_confirmed_at IS NOT NULL
    WHERE o.provider_email_id IS NULL AND NOT o.blocked
      AND (o.lease_until IS NULL OR o.lease_until < now())
      AND o.created_at > now()-interval '7 days'
      AND (o.first_attempt_at IS NULL OR o.first_attempt_at > now()-interval '23 hours')
    ORDER BY o.created_at FOR UPDATE OF o SKIP LOCKED LIMIT 5
  ) UPDATE public.account_welcome_outbox o SET
    first_attempt_at=coalesce(o.first_attempt_at,now()),lease_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
    FROM candidates c WHERE o.user_id=c.user_id
    RETURNING o.user_id,o.recipient,o.claim_token,o.template_version,o.display_name,o.preferred_locale;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_account_welcome_emails_v2() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_account_welcome_emails_v2() TO service_role;

-- One receipt per applied gateway payment event. No Checkout attempts, admin grants,
-- unconfirmed email, failed/rejected/stale payments or old-event backfill.
CREATE TABLE public.subscription_mail_outbox (
  event_id uuid PRIMARY KEY REFERENCES billing.subscription_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  recipient text NOT NULL,
  display_name text,
  preferred_locale text,
  plan_key text NOT NULL CHECK(plan_key IN ('pro','pro_plus')),
  kind text NOT NULL CHECK(kind IN ('activated','renewed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  first_attempt_at timestamptz,
  lease_until timestamptz,
  claim_token uuid,
  provider_email_id text,
  blocked boolean NOT NULL DEFAULT false
);
ALTER TABLE public.subscription_mail_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_mail_outbox FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.subscription_mail_outbox TO service_role;

CREATE FUNCTION public.queue_subscription_mail() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.event_type='payment_succeeded' AND NEW.source='gateway_webhook'
     AND NEW.processing_status='applied' AND NEW.to_access_state='paid_active' THEN
    INSERT INTO public.subscription_mail_outbox(event_id,user_id,recipient,display_name,preferred_locale,plan_key,kind)
    SELECT NEW.id,s.user_id,u.email,LEFT(u.raw_user_meta_data->>'full_name',80),
      u.raw_user_meta_data->>'preferred_locale',pc.plan_key,
      CASE WHEN NEW.from_access_state='paid_active' THEN 'renewed' ELSE 'activated' END
    FROM billing.subscriptions s
    JOIN billing.plan_versions pv ON pv.id=s.plan_version_id
    JOIN billing.plan_catalog pc ON pc.id=pv.plan_id AND pc.plan_key IN ('pro','pro_plus')
    JOIN auth.users u ON u.id=s.user_id AND u.email_confirmed_at IS NOT NULL AND u.email IS NOT NULL
    WHERE s.id=NEW.subscription_id AND s.access_state='paid_active'
    ON CONFLICT(event_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_subscription_mail() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER subscription_mail_after_applied_payment AFTER INSERT ON billing.subscription_events
FOR EACH ROW EXECUTE FUNCTION public.queue_subscription_mail();

CREATE FUNCTION public.claim_subscription_mail()
RETURNS TABLE(event_id uuid,recipient text,claim_token uuid,display_name text,preferred_locale text,plan_key text,kind text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT o.event_id FROM public.subscription_mail_outbox o
    JOIN auth.users u ON u.id=o.user_id AND u.email=o.recipient AND u.email_confirmed_at IS NOT NULL
    JOIN billing.subscriptions s ON s.user_id=o.user_id AND s.access_state='paid_active'
    JOIN billing.plan_versions pv ON pv.id=s.plan_version_id
    JOIN billing.plan_catalog pc ON pc.id=pv.plan_id AND pc.plan_key=o.plan_key
    WHERE o.provider_email_id IS NULL AND NOT o.blocked
      AND (o.lease_until IS NULL OR o.lease_until < now())
      AND o.created_at > now()-interval '7 days'
      AND (o.first_attempt_at IS NULL OR o.first_attempt_at > now()-interval '23 hours')
    ORDER BY o.created_at FOR UPDATE OF o SKIP LOCKED LIMIT 5
  ) UPDATE public.subscription_mail_outbox o SET
    first_attempt_at=coalesce(o.first_attempt_at,now()),lease_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
    FROM candidates c WHERE o.event_id=c.event_id
    RETURNING o.event_id,o.recipient,o.claim_token,o.display_name,o.preferred_locale,o.plan_key,o.kind;
END;
$$;
CREATE FUNCTION public.complete_subscription_mail(p_event uuid,p_claim uuid,p_email_id text,p_block boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.subscription_mail_outbox SET provider_email_id=p_email_id,blocked=p_block
  WHERE event_id=p_event AND claim_token=p_claim AND lease_until>now() AND provider_email_id IS NULL;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_subscription_mail() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.complete_subscription_mail(uuid,uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_subscription_mail() TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_subscription_mail(uuid,uuid,text,boolean) TO service_role;
