-- Service-only acknowledgements, queued only after accepted HubSpot submissions.
CREATE TABLE public.contact_acknowledgement_outbox (
 id uuid PRIMARY KEY,
 recipient text NOT NULL CHECK(length(recipient)<=254),
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 stream text NOT NULL CHECK(stream IN ('support','sales')),
 subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 200),
 text_body text NOT NULL CHECK(length(text_body) BETWEEN 1 AND 60000),
 html_body text NOT NULL CHECK(length(html_body) BETWEEN 1 AND 200000),
 created_at timestamptz NOT NULL DEFAULT now(),
 first_attempt_at timestamptz, lease_until timestamptz, claim_token uuid,
 provider_email_id text, blocked boolean NOT NULL DEFAULT false
);
ALTER TABLE public.contact_acknowledgement_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_acknowledgement_outbox FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.contact_acknowledgement_outbox TO service_role;
CREATE FUNCTION public.queue_contact_acknowledgement(p_id uuid,p_recipient text,p_locale text,p_stream text,p_subject text,p_text text,p_html text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 INSERT INTO public.contact_acknowledgement_outbox(id,recipient,locale,stream,subject,text_body,html_body)
 VALUES(p_id,p_recipient,p_locale,p_stream,p_subject,p_text,p_html) ON CONFLICT(id) DO NOTHING;
$$;
CREATE FUNCTION public.claim_contact_acknowledgements()
RETURNS TABLE(id uuid,claim_token uuid,recipient text,subject text,text_body text,html_body text,sender text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 RETURN QUERY WITH candidates AS (
  SELECT o.id FROM public.contact_acknowledgement_outbox o
  WHERE o.provider_email_id IS NULL AND NOT o.blocked
   AND (o.lease_until IS NULL OR o.lease_until<now())
   AND o.created_at>now()-interval '7 days'
   AND (o.first_attempt_at IS NULL OR o.first_attempt_at>now()-interval '23 hours')
  ORDER BY o.created_at FOR UPDATE SKIP LOCKED LIMIT 5
 ) UPDATE public.contact_acknowledgement_outbox o SET
  first_attempt_at=coalesce(o.first_attempt_at,now()),lease_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
  FROM candidates c WHERE o.id=c.id
  RETURNING o.id,o.claim_token,o.recipient,o.subject,o.text_body,o.html_body,
   CASE WHEN o.stream='sales' THEN 'sales@mail.masaarat.ai'::text ELSE 'info@mail.masaarat.ai'::text END;
END;
$$;
CREATE FUNCTION public.complete_contact_acknowledgement(p_id uuid,p_claim uuid,p_email_id text,p_block boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.contact_acknowledgement_outbox SET provider_email_id=p_email_id,blocked=p_block
 WHERE id=p_id AND claim_token=p_claim AND lease_until>now() AND provider_email_id IS NULL;
 RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_contact_acknowledgement(uuid,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_contact_acknowledgements() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.complete_contact_acknowledgement(uuid,uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_contact_acknowledgement(uuid,text,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_contact_acknowledgements() TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_contact_acknowledgement(uuid,uuid,text,boolean) TO service_role;
