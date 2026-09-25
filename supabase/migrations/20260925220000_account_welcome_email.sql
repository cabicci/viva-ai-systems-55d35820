-- Transactional account mail only. No backfill, marketing, or child-profile trigger.
CREATE TABLE public.account_welcome_outbox (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  first_attempt_at timestamptz,
  lease_until timestamptz,
  claim_token uuid,
  provider_email_id text,
  blocked boolean NOT NULL DEFAULT false
);
ALTER TABLE public.account_welcome_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_welcome_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.account_welcome_outbox TO service_role;

CREATE FUNCTION public.queue_account_welcome_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL AND NEW.email <> ''
     AND (TG_OP = 'INSERT' OR OLD.email_confirmed_at IS NULL) THEN
    INSERT INTO public.account_welcome_outbox(user_id, recipient)
    VALUES (NEW.id, NEW.email) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_account_welcome_email() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER account_welcome_after_confirmation AFTER INSERT OR UPDATE OF email_confirmed_at
ON auth.users FOR EACH ROW EXECUTE FUNCTION public.queue_account_welcome_email();

CREATE FUNCTION public.claim_account_welcome_emails()
RETURNS TABLE(user_id uuid, recipient text, claim_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT o.user_id FROM public.account_welcome_outbox o
    JOIN auth.users u ON u.id=o.user_id AND u.email=o.recipient AND u.email_confirmed_at IS NOT NULL
    WHERE o.provider_email_id IS NULL AND NOT o.blocked
      AND (o.lease_until IS NULL OR o.lease_until < now())
      AND o.created_at > now() - interval '7 days'
      -- Never retry after the provider idempotency window can expire.
      AND (o.first_attempt_at IS NULL OR o.first_attempt_at > now() - interval '23 hours')
    ORDER BY o.created_at FOR UPDATE OF o SKIP LOCKED LIMIT 5
  ) UPDATE public.account_welcome_outbox o SET
    first_attempt_at=coalesce(o.first_attempt_at,now()), lease_until=now()+interval '5 minutes', claim_token=gen_random_uuid()
    FROM candidates c WHERE o.user_id=c.user_id
    RETURNING o.user_id,o.recipient,o.claim_token;
END;
$$;
CREATE FUNCTION public.complete_account_welcome_email(p_user uuid, p_claim uuid, p_email_id text, p_block boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.account_welcome_outbox SET provider_email_id=p_email_id, blocked=p_block
  WHERE user_id=p_user AND claim_token=p_claim AND lease_until > now() AND provider_email_id IS NULL;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_account_welcome_emails() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_account_welcome_email(uuid,uuid,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_account_welcome_emails() TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_account_welcome_email(uuid,uuid,text,boolean) TO service_role;
