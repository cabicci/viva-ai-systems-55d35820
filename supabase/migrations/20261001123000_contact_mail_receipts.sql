ALTER TABLE public.contact_acknowledgement_outbox ADD COLUMN receipt_type text,
 ADD COLUMN receipt_at timestamptz;
CREATE UNIQUE INDEX contact_mail_provider_id_unique ON public.contact_acknowledgement_outbox(provider_email_id) WHERE provider_email_id IS NOT NULL;
CREATE TABLE public.contact_mail_receipts (
 event_id text PRIMARY KEY CHECK(length(event_id) BETWEEN 1 AND 200),
 outbox_id uuid NOT NULL REFERENCES public.contact_acknowledgement_outbox(id) ON DELETE CASCADE,
 event_type text NOT NULL CHECK(event_type IN ('email.delivered','email.delivery_delayed','email.bounced','email.failed','email.complained','email.suppressed')),
 occurred_at timestamptz NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_mail_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_mail_receipts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.contact_mail_receipts TO service_role;
CREATE FUNCTION public.record_contact_mail_receipt(p_event text,p_email_id text,p_recipient text,p_type text,p_at timestamptz)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target_id uuid;
BEGIN
 IF p_type NOT IN ('email.delivered','email.delivery_delayed','email.bounced','email.failed','email.complained','email.suppressed') OR p_at IS NULL THEN RETURN 'ignored'; END IF;
 SELECT o.id INTO target_id FROM public.contact_acknowledgement_outbox o
 WHERE o.provider_email_id=p_email_id AND o.recipient=p_recipient FOR UPDATE;
 IF target_id IS NULL THEN
  IF EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox o WHERE o.recipient=p_recipient AND o.provider_email_id IS NULL AND o.first_attempt_at IS NOT NULL AND NOT o.blocked) THEN RETURN 'pending'; END IF;
  RETURN 'ignored';
 END IF;
 INSERT INTO public.contact_mail_receipts(event_id,outbox_id,event_type,occurred_at)
 VALUES(p_event,target_id,p_type,p_at) ON CONFLICT(event_id) DO NOTHING;
 IF NOT FOUND THEN RETURN 'recorded'; END IF;
 IF p_type IN ('email.bounced','email.failed','email.complained','email.suppressed') THEN
  UPDATE public.contact_acknowledgement_outbox SET blocked=true WHERE id=target_id;
 END IF;
 UPDATE public.contact_acknowledgement_outbox SET
  receipt_type=p_type,receipt_at=p_at
 WHERE id=target_id AND (receipt_at IS NULL OR receipt_at<=p_at);
 RETURN 'recorded';
END;
$$;
REVOKE ALL ON FUNCTION public.record_contact_mail_receipt(text,text,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_contact_mail_receipt(text,text,text,text,timestamptz) TO service_role;
