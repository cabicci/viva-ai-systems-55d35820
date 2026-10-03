-- Targeted first attempt after accepted intake. Batch retry and completion stay unchanged.
-- Requires the installed LC-09 recipient suppression guard; fail if it is absent.
CREATE FUNCTION public.claim_contact_acknowledgement(p_id uuid)
RETURNS TABLE(id uuid,claim_token uuid,recipient text,subject text,text_body text,html_body text,sender text)
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
  WITH candidate AS (
    SELECT o.id FROM public.contact_acknowledgement_outbox o
    WHERE o.id=p_id AND o.provider_email_id IS NULL AND NOT o.blocked
      AND (o.lease_until IS NULL OR o.lease_until<now())
      AND o.created_at>now()-interval '7 days'
      AND (o.first_attempt_at IS NULL OR o.first_attempt_at>now()-interval '23 hours')
      AND billing.lc09_contact_recipient_active(o.recipient)
    FOR UPDATE SKIP LOCKED
  ) UPDATE public.contact_acknowledgement_outbox o SET
    first_attempt_at=coalesce(o.first_attempt_at,now()),
    lease_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
    FROM candidate c WHERE o.id=c.id
    RETURNING o.id,o.claim_token,o.recipient,o.subject,o.text_body,o.html_body,
      CASE WHEN o.stream='sales' THEN 'sales@mail.masaarat.ai'::text ELSE 'info@mail.masaarat.ai'::text END;
$$;
REVOKE ALL ON FUNCTION public.claim_contact_acknowledgement(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_contact_acknowledgement(uuid) TO service_role;
