-- Reuse the durable welcome outbox for an immediate, verified-account attempt.
-- No new queue, trigger, secret, schedule or backfill. The batch retry remains.
CREATE FUNCTION public.claim_account_welcome_email(p_user uuid)
RETURNS TABLE(user_id uuid,recipient text,claim_token uuid,template_version integer,display_name text,preferred_locale text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Follow the existing deletion lock order: account/family before outbox.
  IF p_user IS NULL OR billing.account_deletion_blocked(p_user) THEN RETURN; END IF;
  RETURN QUERY
  WITH candidates AS (
    SELECT o.user_id FROM public.account_welcome_outbox o
    JOIN auth.users u ON u.id=o.user_id AND u.email=o.recipient AND u.email_confirmed_at IS NOT NULL
    WHERE o.user_id=p_user AND o.provider_email_id IS NULL AND NOT o.blocked
      AND (o.lease_until IS NULL OR o.lease_until < now())
      AND o.created_at > now()-interval '7 days'
      AND (o.first_attempt_at IS NULL OR o.first_attempt_at > now()-interval '23 hours')
    FOR UPDATE OF o SKIP LOCKED LIMIT 1
  ) UPDATE public.account_welcome_outbox o SET
    first_attempt_at=coalesce(o.first_attempt_at,now()),lease_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
    FROM candidates c WHERE o.user_id=c.user_id
    RETURNING o.user_id,o.recipient,o.claim_token,o.template_version,o.display_name,o.preferred_locale;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_account_welcome_email(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_account_welcome_email(uuid) TO service_role;
