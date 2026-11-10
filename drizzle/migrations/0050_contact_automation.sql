-- Review draft only. ROOT assigns migration/journal identity after review.
-- Extend the existing service-only outbox; no new inbox, sender or scheduler.

ALTER TABLE public.contact_acknowledgement_outbox
 ADD COLUMN automation_action text NOT NULL DEFAULT 'acknowledgement'
   CHECK (automation_action IN ('acknowledgement','owner_review')),
 ADD COLUMN automation_parent_id uuid REFERENCES public.contact_acknowledgement_outbox(id) ON DELETE CASCADE,
 ADD COLUMN automation_due_at timestamptz,
 ADD COLUMN automation_processing_consent boolean,
 ADD COLUMN automation_request_kind text CHECK (automation_request_kind = 'unknown'),
 ADD COLUMN automation_owner_subject text CHECK (length(automation_owner_subject) BETWEEN 1 AND 200),
 ADD COLUMN automation_owner_text text CHECK (length(automation_owner_text) BETWEEN 1 AND 60000),
 ADD COLUMN automation_owner_html text CHECK (length(automation_owner_html) BETWEEN 1 AND 200000),
 ADD COLUMN automation_withdrawn_at timestamptz,
 ADD COLUMN automation_withdrawn_by uuid,
 ADD COLUMN automation_send_started_at timestamptz,
 ADD COLUMN intake_state text NOT NULL DEFAULT 'accepted' CHECK(intake_state IN ('reserved','accepted','uncertain','closed_manual')),
 ADD COLUMN intake_recovery_hash text CHECK(intake_recovery_hash ~ '^[0-9a-f]{64}$'),
 ADD COLUMN intake_payload_hash text CHECK(intake_payload_hash ~ '^[0-9a-f]{64}$'),
 ADD COLUMN intake_claim_token uuid,
 ADD COLUMN intake_reserved_at timestamptz,
 ADD COLUMN intake_lease_until timestamptz,
 ADD COLUMN intake_started_at timestamptz,
 ADD COLUMN intake_closed_at timestamptz,
 ADD COLUMN intake_closed_by uuid,
 ADD COLUMN intake_resolution_ref text CHECK(length(intake_resolution_ref) BETWEEN 3 AND 200),
 ADD CONSTRAINT contact_automation_parent_shape CHECK (
   (automation_action='acknowledgement' AND automation_parent_id IS NULL) OR
   (automation_action='owner_review' AND automation_parent_id IS NOT NULL AND automation_parent_id<>id
     AND automation_due_at IS NOT NULL AND automation_processing_consent IS TRUE)),
 ADD CONSTRAINT contact_automation_plan_shape CHECK (
   automation_owner_subject IS NULL OR
   (automation_action='acknowledgement' AND automation_due_at IS NOT NULL
     AND automation_processing_consent IS TRUE AND automation_request_kind='unknown'
     AND automation_owner_text IS NOT NULL AND automation_owner_html IS NOT NULL));
CREATE UNIQUE INDEX contact_automation_one_owner_review
 ON public.contact_acknowledgement_outbox(automation_parent_id,automation_action)
 WHERE automation_parent_id IS NOT NULL;

CREATE FUNCTION billing.contact_automation_business_hours(p_at timestamptz)
RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(extract(isodow FROM p_at AT TIME ZONE 'Africa/Cairo') NOT IN (5,6)
   AND (p_at AT TIME ZONE 'Africa/Cairo')::time >= time '09:00'
   AND (p_at AT TIME ZONE 'Africa/Cairo')::time < time '17:00',false);
$$;
CREATE FUNCTION billing.contact_automation_due_at(p_at timestamptz)
RETURNS timestamptz LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE local_at timestamp := p_at AT TIME ZONE 'Africa/Cairo';
BEGIN
 IF p_at IS NULL THEN RAISE EXCEPTION 'CONTACT_TIMESTAMP_REQUIRED'; END IF;
 IF billing.contact_automation_business_hours(p_at) THEN RETURN p_at; END IF;
 IF local_at::time >= time '17:00' THEN local_at := local_at::date + interval '1 day'; END IF;
 WHILE extract(isodow FROM local_at) IN (5,6) LOOP
   local_at := local_at::date + interval '1 day';
 END LOOP;
 RETURN (local_at::date + time '09:00') AT TIME ZONE 'Africa/Cairo';
END;
$$;

CREATE FUNCTION public.queue_contact_automation(
 p_id uuid,p_recipient text,p_locale text,p_stream text,p_subject text,p_text text,p_html text,
 p_processing_consent boolean,p_owner_subject text,p_owner_text text,p_owner_html text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE existing public.contact_acknowledgement_outbox%ROWTYPE;
BEGIN
 IF p_processing_consent IS DISTINCT FROM true OR p_id IS NULL OR
    nullif(btrim(p_recipient),'') IS NULL OR p_owner_subject IS NULL OR
    p_owner_text IS NULL OR p_owner_html IS NULL THEN
   RAISE EXCEPTION 'CONTACT_AUTOMATION_INTAKE_INVALID';
 END IF;
 -- Installed lifecycle guard locks the source identity before inserting mail.
 IF NOT billing.lc09_contact_recipient_active(p_recipient) THEN
   RAISE EXCEPTION 'ACCOUNT_DELETION_BLOCKED';
 END IF;
 INSERT INTO public.contact_acknowledgement_outbox(
   id,recipient,locale,stream,subject,text_body,html_body,automation_due_at,
   automation_processing_consent,automation_request_kind,
   automation_owner_subject,automation_owner_text,automation_owner_html)
 VALUES(p_id,lower(btrim(p_recipient)),p_locale,p_stream,p_subject,p_text,p_html,
   billing.contact_automation_due_at(clock_timestamp()),true,'unknown',p_owner_subject,p_owner_text,p_owner_html)
 ON CONFLICT(id) DO NOTHING;
 SELECT * INTO existing FROM public.contact_acknowledgement_outbox WHERE id=p_id FOR UPDATE;
 IF existing.recipient<>lower(btrim(p_recipient)) OR existing.automation_action<>'acknowledgement'
   OR existing.automation_owner_subject IS NULL THEN
   RAISE EXCEPTION 'CONTACT_AUTOMATION_RECEIPT_CONFLICT';
 END IF;
 -- Never thaw content, revive withdrawn consent or enqueue a second owner action.
 RETURN true;
END;
$$;

-- Acquire every affected account lifecycle in UUID order before outbox rows.
CREATE FUNCTION billing.lock_contact_accounts(p_recipients text[],p_actor uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE account_id uuid;
BEGIN
 FOR account_id IN SELECT u.id FROM auth.users u
   WHERE u.id=p_actor OR lower(u.email)=ANY(p_recipients) ORDER BY u.id
 LOOP PERFORM billing.account_deletion_blocked(account_id); END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION billing.lock_contact_accounts(text[],uuid) FROM PUBLIC,anon,authenticated,service_role;

-- Resolve the full request family before acquiring any lifecycle lock.
CREATE FUNCTION billing.lock_contact_requests(p_ids uuid[],p_actor uuid DEFAULT NULL,p_extra_emails text[] DEFAULT ARRAY[]::text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE roots uuid[]; root_id uuid;
BEGIN
 SELECT array_agg(DISTINCT coalesce(o.automation_parent_id,o.id)) INTO roots
 FROM public.contact_acknowledgement_outbox o WHERE o.id=ANY(p_ids);
 -- Every child insertion takes this family lock before lifecycle locks.
 -- Reentering the helper cannot discover a concurrently inserted recipient.
 FOR root_id IN SELECT unnest(roots) ORDER BY 1 LOOP
   PERFORM pg_advisory_xact_lock(hashtextextended('contact-family:'||root_id::text,0));
 END LOOP;
 PERFORM billing.lock_contact_accounts(ARRAY(
   SELECT lower(o.recipient) FROM public.contact_acknowledgement_outbox o
     WHERE o.id=ANY(roots) OR o.automation_parent_id=ANY(roots)
   UNION SELECT lower(unnest(p_extra_emails))
 ),p_actor);
END;
$$;
REVOKE ALL ON FUNCTION billing.lock_contact_requests(uuid[],uuid,text[]) FROM PUBLIC,anon,authenticated,service_role;

-- Nonlocking discovery only. All mutating callers acquire the bounded family
-- locks before rechecking this condition and locking outbox rows.
CREATE FUNCTION billing.contact_recipients_active(p_emails text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT EXISTS(SELECT 1 FROM billing.account_deletion_lifecycle l
 WHERE l.user_id IN (SELECT id FROM auth.users WHERE lower(email)=ANY(p_emails))
 OR (l.contact_recipient=ANY(p_emails) AND l.stage<>'complete'));
$$;
REVOKE ALL ON FUNCTION billing.contact_recipients_active(text[]) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.prepare_contact_automation(p_owner text,p_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; scheduled integer:=0; awaiting_owner integer:=0; candidates uuid[];
BEGIN
 IF p_owner IS NOT NULL AND (length(p_owner)>254 OR p_owner !~ '^[^[:space:]<>@,;]+@[^[:space:]<>@,;]+\.[^[:space:]<>@,;]+$') THEN
   RAISE EXCEPTION 'CONTACT_AUTOMATION_OWNER_INVALID';
 END IF;
 IF p_owner IS NULL THEN
   SELECT count(*) INTO awaiting_owner FROM public.contact_acknowledgement_outbox o
   WHERE (p_id IS NULL OR o.id=p_id) AND o.automation_owner_subject IS NOT NULL AND o.intake_state='accepted'
     AND o.automation_withdrawn_at IS NULL AND NOT o.blocked AND o.created_at>clock_timestamp()-interval '7 days'
     AND NOT EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox c WHERE c.automation_parent_id=o.id);
   RETURN jsonb_build_object('scheduled',0,'awaiting_owner',awaiting_owner);
 END IF;
 SELECT array_agg(c.id) INTO candidates FROM (
   SELECT o.id FROM public.contact_acknowledgement_outbox o
   WHERE (p_id IS NULL OR o.id=p_id) AND o.automation_action='acknowledgement'
     AND o.automation_owner_subject IS NOT NULL AND o.intake_state='accepted'
     AND o.automation_processing_consent IS TRUE AND o.automation_withdrawn_at IS NULL
     AND NOT o.blocked AND o.created_at>clock_timestamp()-interval '7 days'
     AND billing.contact_recipients_active(ARRAY[lower(o.recipient),lower(p_owner)])
     AND NOT EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox child WHERE child.automation_parent_id=o.id)
   ORDER BY o.created_at,o.id LIMIT 20
 ) c;
 PERFORM billing.lock_contact_requests(candidates,NULL,ARRAY[lower(p_owner)]);
 FOR r IN SELECT o.* FROM public.contact_acknowledgement_outbox o
   WHERE o.id=ANY(candidates) AND o.automation_action='acknowledgement'
     AND o.automation_owner_subject IS NOT NULL AND o.intake_state='accepted' AND o.automation_processing_consent IS TRUE
     AND o.automation_withdrawn_at IS NULL AND NOT o.blocked AND o.created_at>clock_timestamp()-interval '7 days'
     AND billing.lc09_contact_recipient_active(o.recipient)
     AND billing.lc09_contact_recipient_active(p_owner)
     AND NOT EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox c WHERE c.automation_parent_id=o.id)
   ORDER BY o.created_at,o.id FOR UPDATE SKIP LOCKED LIMIT 20
 LOOP
   INSERT INTO public.contact_acknowledgement_outbox(
     id,recipient,locale,stream,subject,text_body,html_body,automation_action,automation_parent_id,
     automation_due_at,automation_processing_consent,automation_request_kind)
   VALUES(gen_random_uuid(),lower(p_owner),r.locale,r.stream,r.automation_owner_subject,
     r.automation_owner_text,r.automation_owner_html,'owner_review',r.id,r.automation_due_at,true,'unknown')
   ON CONFLICT DO NOTHING;
   IF FOUND THEN scheduled:=scheduled+1; END IF;
 END LOOP;
 RETURN jsonb_build_object('scheduled',scheduled,'awaiting_owner',0);
END;
$$;

-- Use the same lifecycle/suppression policy for source and destination. The
-- owner copy contains customer text and must stop when that customer withdraws.
CREATE FUNCTION billing.contact_automation_eligible(p_id uuid,p_owner text,p_at timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE;
        parent public.contact_acknowledgement_outbox%ROWTYPE;
BEGIN
 SELECT * INTO o FROM public.contact_acknowledgement_outbox WHERE id=p_id;
 IF NOT FOUND OR o.intake_state<>'accepted' OR o.blocked OR o.automation_withdrawn_at IS NOT NULL THEN RETURN false; END IF;
 SELECT * INTO parent FROM public.contact_acknowledgement_outbox
 WHERE id=coalesce(o.automation_parent_id,o.id);
 IF NOT FOUND THEN RETURN false; END IF;
 IF NOT billing.contact_recipients_active(ARRAY[lower(parent.recipient),lower(o.recipient)]) THEN RETURN false; END IF;
 IF o.automation_action='owner_review' THEN
   IF NOT FOUND OR parent.blocked OR parent.automation_processing_consent IS DISTINCT FROM true
     OR parent.automation_withdrawn_at IS NOT NULL OR parent.automation_action<>'acknowledgement' THEN RETURN false; END IF;
 END IF;

 IF EXISTS(SELECT 1 FROM public.contact_mail_receipts r
   JOIN public.contact_acknowledgement_outbox m ON m.id=r.outbox_id
   WHERE lower(m.recipient)=lower(o.recipient) AND r.event_type IN
     ('email.bounced','email.failed','email.complained','email.suppressed')) THEN RETURN false; END IF;
 IF o.automation_action='acknowledgement' THEN RETURN true; END IF;
 IF p_owner IS NULL OR lower(p_owner)<>o.recipient OR o.automation_due_at>p_at OR
    NOT billing.contact_automation_business_hours(p_at) THEN RETURN false; END IF;
 RETURN NOT EXISTS(SELECT 1 FROM public.contact_mail_receipts r
   JOIN public.contact_acknowledgement_outbox m ON m.id=r.outbox_id
   WHERE lower(m.recipient)=lower(parent.recipient) AND r.event_type IN
     ('email.bounced','email.failed','email.complained','email.suppressed'));
END;
$$;

CREATE FUNCTION public.claim_contact_automation(p_owner text,p_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid,claim_token uuid,recipient text,subject text,text_body text,html_body text,sender text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidates uuid[];
BEGIN
 SELECT array_agg(c.id) INTO candidates FROM (
   SELECT o.id FROM public.contact_acknowledgement_outbox o
   WHERE (p_id IS NULL OR o.id=p_id) AND o.provider_email_id IS NULL AND NOT o.blocked
     AND (o.lease_until IS NULL OR o.lease_until<clock_timestamp())
     AND o.created_at>clock_timestamp()-interval '7 days'
     AND (o.first_attempt_at IS NULL OR o.first_attempt_at>clock_timestamp()-interval '23 hours')
     AND billing.contact_automation_eligible(o.id,p_owner,clock_timestamp())
   ORDER BY o.created_at,o.id LIMIT 5
 ) c;
 PERFORM billing.lock_contact_requests(candidates);
 -- Parent row locks follow all lifecycle locks and precede child row locks.
 PERFORM 1 FROM public.contact_acknowledgement_outbox parent
 WHERE parent.id IN (SELECT child.automation_parent_id FROM public.contact_acknowledgement_outbox child WHERE child.id=ANY(candidates))
 ORDER BY parent.id FOR KEY SHARE;
 RETURN QUERY WITH locked AS (
   SELECT o.id FROM public.contact_acknowledgement_outbox o
   WHERE o.id=ANY(candidates) AND o.provider_email_id IS NULL AND NOT o.blocked
     AND (o.lease_until IS NULL OR o.lease_until<clock_timestamp())
     AND o.created_at>clock_timestamp()-interval '7 days'
     AND (o.first_attempt_at IS NULL OR o.first_attempt_at>clock_timestamp()-interval '23 hours')
     AND billing.contact_automation_eligible(o.id,p_owner,clock_timestamp())
   ORDER BY o.created_at,o.id FOR UPDATE SKIP LOCKED
 ) UPDATE public.contact_acknowledgement_outbox o SET
   first_attempt_at=coalesce(o.first_attempt_at,clock_timestamp()),lease_until=clock_timestamp()+interval '5 minutes',
   claim_token=gen_random_uuid(),automation_send_started_at=NULL
   FROM locked c WHERE o.id=c.id
   RETURNING o.id,o.claim_token,o.recipient,o.subject,o.text_body,o.html_body,
     CASE WHEN o.stream='sales' THEN 'sales@mail.masaarat.ai'::text ELSE 'info@mail.masaarat.ai'::text END;
END;
$$;
-- Legacy callers still claim only acknowledgements. Only the configured worker
-- can pass an owner destination to the new claim, never a public/user RPC.
CREATE OR REPLACE FUNCTION public.claim_contact_acknowledgements()
RETURNS TABLE(id uuid,claim_token uuid,recipient text,subject text,text_body text,html_body text,sender text)
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT * FROM public.claim_contact_automation(NULL,NULL);
$$;
CREATE OR REPLACE FUNCTION public.claim_contact_acknowledgement(p_id uuid)
RETURNS TABLE(id uuid,claim_token uuid,recipient text,subject text,text_body text,html_body text,sender text)
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT * FROM public.claim_contact_automation(NULL,p_id);
$$;

CREATE FUNCTION public.withdraw_contact_automation(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.lock_contact_requests(ARRAY[p_id]);
 PERFORM 1 FROM public.contact_acknowledgement_outbox
 WHERE id=p_id AND automation_action='acknowledgement' FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.contact_acknowledgement_outbox SET automation_withdrawn_at=coalesce(automation_withdrawn_at,clock_timestamp()),blocked=true
 WHERE id=p_id OR automation_parent_id=p_id;
 RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION public.complete_contact_acknowledgement(p_id uuid,p_claim uuid,p_email_id text,p_block boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.contact_acknowledgement_outbox SET provider_email_id=p_email_id,blocked=blocked OR coalesce(p_block,false),automation_send_started_at=NULL
 WHERE id=p_id AND claim_token=p_claim AND lease_until>clock_timestamp() AND provider_email_id IS NULL;
 RETURN FOUND;
END;
$$;

-- The existing account purge deletes the source recipient's ACK. Cascade erases
-- the owner's stored copy too; wait for a live child send lease before erasure.
CREATE FUNCTION billing.contact_automation_delete_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (OLD.intake_started_at IS NOT NULL AND OLD.intake_lease_until>clock_timestamp()) OR EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox c
   WHERE c.automation_parent_id=OLD.id AND c.provider_email_id IS NULL AND c.lease_until>clock_timestamp()) THEN
   RAISE EXCEPTION 'LC09_CONTACT_SEND_PENDING';
 END IF;
 RETURN OLD;
END;
$$;
CREATE TRIGGER contact_automation_delete_guard BEFORE DELETE ON public.contact_acknowledgement_outbox
 FOR EACH ROW EXECUTE FUNCTION billing.contact_automation_delete_guard();

REVOKE ALL ON FUNCTION billing.contact_automation_business_hours(timestamptz),
 billing.contact_automation_due_at(timestamptz),billing.contact_automation_eligible(uuid,text,timestamptz),
 billing.contact_automation_delete_guard() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.queue_contact_automation(uuid,text,text,text,text,text,text,boolean,text,text,text),
 public.prepare_contact_automation(text,uuid),public.claim_contact_automation(text,uuid),
 public.withdraw_contact_automation(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_contact_automation(uuid,text,text,text,text,text,text,boolean,text,text,text),
 public.prepare_contact_automation(text,uuid),public.claim_contact_automation(text,uuid),
 public.withdraw_contact_automation(uuid) TO service_role;
-- CREATE OR REPLACE keeps the installed grants for the three legacy functions.

CREATE FUNCTION public.reserve_contact_intake(
 p_id uuid,p_recipient text,p_locale text,p_stream text,p_subject text,p_text text,p_html text,
 p_processing_consent boolean,p_owner_subject text,p_owner_text text,p_owner_html text,p_payload_hash text,p_recovery_hash text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE; token uuid;
BEGIN
 IF p_recovery_hash IS NOT NULL AND p_recovery_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'CONTACT_RECOVERY_INVALID'; END IF;
 IF p_payload_hash IS NULL OR p_payload_hash !~ '^[0-9a-f]{64}$' OR p_processing_consent IS DISTINCT FROM true THEN
   RAISE EXCEPTION 'CONTACT_INTAKE_INVALID'; END IF;
 IF NOT billing.lc09_contact_recipient_active(p_recipient) THEN RAISE EXCEPTION 'ACCOUNT_DELETION_BLOCKED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('contact-intake:'||p_id::text,0));
 SELECT * INTO o FROM public.contact_acknowledgement_outbox WHERE id=p_id FOR UPDATE;
 IF FOUND THEN
   IF o.intake_payload_hash IS DISTINCT FROM p_payload_hash OR o.intake_recovery_hash IS DISTINCT FROM p_recovery_hash OR o.recipient<>lower(btrim(p_recipient)) THEN
     RAISE EXCEPTION 'CONTACT_ATTEMPT_PAYLOAD_CONFLICT'; END IF;
   IF o.automation_withdrawn_at IS NOT NULL THEN RETURN jsonb_build_object('state','withdrawn'); END IF;
   IF o.intake_state='closed_manual' THEN RETURN jsonb_build_object('state','closed_manual'); END IF;
   IF o.blocked THEN RETURN jsonb_build_object('state','reconciliation_required'); END IF;
   RETURN jsonb_build_object('state',CASE WHEN o.intake_state='accepted' THEN 'accepted' ELSE 'reconciliation_required' END);
 END IF;
 PERFORM public.queue_contact_automation(p_id,p_recipient,p_locale,p_stream,p_subject,p_text,p_html,
   p_processing_consent,p_owner_subject,p_owner_text,p_owner_html);
 token:=gen_random_uuid();
 UPDATE public.contact_acknowledgement_outbox SET intake_state='reserved',intake_payload_hash=p_payload_hash,intake_recovery_hash=p_recovery_hash,
   intake_claim_token=token,intake_reserved_at=clock_timestamp(),intake_lease_until=clock_timestamp()+interval '5 minutes' WHERE id=p_id;
 RETURN jsonb_build_object('state','dispatch','claim',token);
END;
$$;
CREATE FUNCTION public.begin_contact_intake(p_id uuid,p_claim uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE; instant timestamptz;
BEGIN
 SELECT * INTO o FROM public.contact_acknowledgement_outbox WHERE id=p_id;
 IF NOT FOUND OR NOT billing.lc09_contact_recipient_active(o.recipient) THEN RETURN false; END IF;
 SELECT * INTO o FROM public.contact_acknowledgement_outbox WHERE id=p_id FOR UPDATE;
 instant:=clock_timestamp();
 IF NOT FOUND OR o.intake_state<>'reserved' OR o.intake_claim_token IS DISTINCT FROM p_claim
   OR o.intake_lease_until IS NULL OR o.intake_lease_until<=instant OR o.intake_started_at IS NOT NULL
   OR o.automation_processing_consent IS DISTINCT FROM true OR o.blocked OR o.automation_withdrawn_at IS NOT NULL
   OR NOT billing.lc09_contact_recipient_active(o.recipient) THEN RETURN false; END IF;
 UPDATE public.contact_acknowledgement_outbox SET intake_started_at=instant WHERE id=p_id;
 RETURN true;
END;
$$;
CREATE FUNCTION public.complete_contact_intake(p_id uuid,p_claim uuid,p_accepted boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE;
BEGIN
 SELECT * INTO o FROM public.contact_acknowledgement_outbox WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR o.intake_state<>'reserved' OR o.intake_claim_token IS DISTINCT FROM p_claim
   OR o.intake_started_at IS NULL THEN RETURN false; END IF;
 -- Recording a late result never revives withdrawn or administratively closed processing.
 UPDATE public.contact_acknowledgement_outbox SET intake_state=CASE
   WHEN p_accepted IS TRUE AND NOT blocked AND automation_withdrawn_at IS NULL THEN 'accepted' ELSE 'uncertain' END,
   intake_lease_until=NULL WHERE id=p_id;
 RETURN NOT o.blocked AND o.automation_withdrawn_at IS NULL;
END;
$$;

-- A claim reserves capacity; this fresh check is the start of an in-flight send.
-- Any withdrawal after this commit may not recall the provider request already starting.
CREATE FUNCTION public.begin_contact_mail_send(p_id uuid,p_claim uuid,p_owner text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE;
        source public.contact_acknowledgement_outbox%ROWTYPE; instant timestamptz;
BEGIN
 SELECT * INTO o FROM public.contact_acknowledgement_outbox WHERE id=p_id;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim OR o.lease_until<=clock_timestamp() OR o.provider_email_id IS NOT NULL THEN RETURN false; END IF;
 SELECT * INTO source FROM public.contact_acknowledgement_outbox WHERE id=coalesce(o.automation_parent_id,o.id);
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM billing.lock_contact_requests(ARRAY[p_id]);
 IF NOT billing.lc09_contact_recipient_active(source.recipient) THEN
   PERFORM public.withdraw_contact_automation(source.id);
   RETURN false;
 END IF;
 IF NOT billing.contact_automation_eligible(p_id,p_owner,clock_timestamp()) THEN RETURN false; END IF;
 -- Lock the parent after every lifecycle and before the child.
 PERFORM 1 FROM public.contact_acknowledgement_outbox WHERE id=source.id FOR KEY SHARE;
 SELECT * INTO o FROM public.contact_acknowledgement_outbox WHERE id=p_id FOR UPDATE;
 instant:=clock_timestamp();
 IF NOT billing.contact_automation_eligible(p_id,p_owner,instant) OR
   o.first_attempt_at<=instant-interval '23 hours' OR o.created_at<=instant-interval '7 days' THEN
   UPDATE public.contact_acknowledgement_outbox SET lease_until=NULL,claim_token=NULL
   WHERE id=p_id AND claim_token=p_claim AND automation_send_started_at IS NULL;
   RETURN false;
 END IF;
 UPDATE public.contact_acknowledgement_outbox SET automation_send_started_at=clock_timestamp()
 WHERE id=p_id AND claim_token=p_claim AND lease_until>clock_timestamp() AND NOT blocked
   AND automation_withdrawn_at IS NULL AND provider_email_id IS NULL AND automation_send_started_at IS NULL;
 RETURN FOUND;
END;
$$;

CREATE FUNCTION billing.contact_automation_row_state(o public.contact_acknowledgement_outbox,p_owner text,p_at timestamptz)
RETURNS text LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT CASE
   WHEN o.intake_state='closed_manual' THEN 'closed_manual'
   WHEN o.automation_withdrawn_at IS NOT NULL THEN 'withdrawn'
   WHEN o.intake_state='uncertain' OR (o.intake_state='reserved' AND o.intake_lease_until<=p_at) THEN 'intake_reconciliation_required'
   WHEN o.intake_state='reserved' AND o.intake_started_at IS NOT NULL THEN 'intake_in_flight'
   WHEN o.intake_state='reserved' THEN 'intake_reserved'
   WHEN o.provider_email_id IS NOT NULL THEN 'accepted'
   WHEN o.blocked THEN 'blocked'
   WHEN o.first_attempt_at<=p_at-interval '23 hours' THEN 'retry_window_expired'
   WHEN o.created_at<=p_at-interval '7 days' THEN 'message_window_expired'
   WHEN o.automation_action='owner_review' AND (p_owner IS NULL OR o.recipient<>lower(p_owner)) THEN 'owner_reconciliation_required'
   WHEN o.automation_send_started_at IS NOT NULL AND o.lease_until>p_at THEN 'send_in_flight'
   ELSE 'pending' END;
$$;
CREATE FUNCTION public.contact_automation_status(p_owner text,p_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 WITH states AS (
   SELECT o.*,billing.contact_automation_row_state(o,p_owner,clock_timestamp()) AS state
   FROM public.contact_acknowledgement_outbox o
   WHERE p_id IS NULL OR o.id=p_id OR o.automation_parent_id=p_id
 ) SELECT jsonb_build_object(
   'awaitingOwner',(SELECT count(*) FROM states s WHERE s.automation_owner_subject IS NOT NULL AND s.intake_state='accepted'
     AND NOT s.blocked AND s.automation_withdrawn_at IS NULL AND s.created_at>clock_timestamp()-interval '7 days'
     AND NOT EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox c WHERE c.automation_parent_id=s.id)),
   'ownerReconciliation',(SELECT count(*) FROM states WHERE state='owner_reconciliation_required'),
   'retryWindowExpired',(SELECT count(*) FROM states WHERE state='retry_window_expired'),
   'messageWindowExpired',(SELECT count(*) FROM states s WHERE state='message_window_expired' OR (s.automation_owner_subject IS NOT NULL AND s.intake_state='accepted' AND NOT s.blocked AND s.automation_withdrawn_at IS NULL AND s.created_at<=clock_timestamp()-interval '7 days' AND NOT EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox c WHERE c.automation_parent_id=s.id))),
   'intakeReconciliation',(SELECT count(*) FROM states WHERE state='intake_reconciliation_required'),
   'inFlight',(SELECT count(*) FROM states WHERE (automation_send_started_at IS NOT NULL AND lease_until>clock_timestamp()) OR (intake_started_at IS NOT NULL AND intake_lease_until>clock_timestamp())),
   'withdrawn',(SELECT count(*) FROM states WHERE automation_action='acknowledgement' AND automation_withdrawn_at IS NOT NULL));
$$;

CREATE FUNCTION public.admin_contact_automation_command(p_actor uuid,p_action text,p_id uuid,p_owner text,p_reference text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE recent jsonb; total bigint;
BEGIN
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor) OR
   public.has_role(p_actor,'admin') IS DISTINCT FROM true THEN RAISE EXCEPTION 'CONTACT_ADMIN_REQUIRED'; END IF;
 IF p_action='status' THEN
   PERFORM billing.lock_contact_accounts(ARRAY[]::text[],p_actor);
 ELSE
   PERFORM billing.lock_contact_requests(ARRAY[p_id],p_actor);
 END IF;
 IF billing.account_deletion_blocked(p_actor) THEN RAISE EXCEPTION 'CONTACT_ADMIN_UNAVAILABLE'; END IF;
 IF p_action NOT IN ('status','withdraw','close_manual') THEN RAISE EXCEPTION 'CONTACT_ADMIN_ACTION_INVALID'; END IF;
 IF p_action='close_manual' THEN
   IF p_id IS NULL OR p_reference IS NULL OR length(p_reference) NOT BETWEEN 3 AND 200
     OR p_reference !~ '^[A-Za-z0-9:/_.-]+$' THEN RAISE EXCEPTION 'CONTACT_REVIEW_REFERENCE_REQUIRED'; END IF;
   PERFORM 1 FROM public.contact_acknowledgement_outbox WHERE id=p_id AND intake_state IN ('reserved','uncertain') FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'CONTACT_INTAKE_NOT_REVIEWABLE'; END IF;
   IF EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox WHERE id=p_id AND intake_started_at IS NOT NULL AND intake_lease_until>clock_timestamp()) THEN
     RAISE EXCEPTION 'CONTACT_INTAKE_IN_FLIGHT'; END IF;
   UPDATE public.contact_acknowledgement_outbox SET intake_state='closed_manual',intake_closed_at=clock_timestamp(),
     intake_closed_by=p_actor,intake_resolution_ref=p_reference,blocked=true,intake_lease_until=NULL
   WHERE id=p_id;
   UPDATE public.contact_acknowledgement_outbox SET blocked=true WHERE automation_parent_id=p_id;
 END IF;
 IF p_action='withdraw' THEN
   IF p_id IS NULL OR NOT public.withdraw_contact_automation(p_id) THEN RAISE EXCEPTION 'CONTACT_REQUEST_NOT_FOUND'; END IF;
   UPDATE public.contact_acknowledgement_outbox SET automation_withdrawn_by=coalesce(automation_withdrawn_by,p_actor)
   WHERE id=p_id OR automation_parent_id=p_id;
 END IF;
 SELECT count(*) INTO total FROM public.contact_acknowledgement_outbox o
 WHERE o.automation_owner_subject IS NOT NULL AND (p_id IS NULL OR o.id=p_id);
 SELECT coalesce(jsonb_agg(x.item ORDER BY x.created_at DESC,x.id),'[]'::jsonb) INTO recent FROM (
   SELECT o.id,o.created_at,jsonb_build_object(
     'id',o.id,'recipientMasked','***@'||split_part(o.recipient,'@',2),'locale',o.locale,'stream',o.stream,
     'createdAt',o.created_at,'dueAt',o.automation_due_at,'withdrawnAt',o.automation_withdrawn_at,
     'closedAt',o.intake_closed_at,'resolutionReference',o.intake_resolution_ref,
     'ackState',billing.contact_automation_row_state(o,p_owner,clock_timestamp()),
     'followupState',CASE
       WHEN o.intake_state='closed_manual' THEN 'closed_manual'
   WHEN o.automation_withdrawn_at IS NOT NULL THEN 'withdrawn'
       WHEN o.intake_state<>'accepted' THEN billing.contact_automation_row_state(o,p_owner,clock_timestamp())
       WHEN c.id IS NOT NULL THEN billing.contact_automation_row_state(c,p_owner,clock_timestamp())
       WHEN o.created_at<=clock_timestamp()-interval '7 days' THEN 'message_window_expired'
       WHEN p_owner IS NULL THEN 'owner_configuration_required'
       ELSE 'awaiting_preparation' END,
     'inFlight',coalesce(o.intake_started_at IS NOT NULL AND o.intake_lease_until>clock_timestamp(),false) OR coalesce(o.automation_send_started_at IS NOT NULL AND o.lease_until>clock_timestamp(),false)
       OR coalesce(c.automation_send_started_at IS NOT NULL AND c.lease_until>clock_timestamp(),false)) AS item
   FROM public.contact_acknowledgement_outbox o
   LEFT JOIN public.contact_acknowledgement_outbox c ON c.automation_parent_id=o.id
   WHERE o.automation_owner_subject IS NOT NULL AND (p_id IS NULL OR o.id=p_id)
   ORDER BY o.created_at DESC,o.id LIMIT 100
 ) x;
 RETURN jsonb_build_object('ownerConfigured',p_owner IS NOT NULL,'counts',public.contact_automation_status(p_owner,p_id),
   'total',total,'recent',recent);
END;
$$;
REVOKE ALL ON FUNCTION billing.contact_automation_row_state(public.contact_acknowledgement_outbox,text,timestamptz)
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.reserve_contact_intake(uuid,text,text,text,text,text,text,boolean,text,text,text,text,text),
 public.begin_contact_intake(uuid,uuid),public.complete_contact_intake(uuid,uuid,boolean),public.begin_contact_mail_send(uuid,uuid,text),
 public.contact_automation_status(text,uuid),public.admin_contact_automation_command(uuid,text,uuid,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_contact_intake(uuid,text,text,text,text,text,text,boolean,text,text,text,text,text),
 public.begin_contact_intake(uuid,uuid),public.complete_contact_intake(uuid,uuid,boolean),public.begin_contact_mail_send(uuid,uuid,text),
 public.contact_automation_status(text,uuid),public.admin_contact_automation_command(uuid,text,uuid,text,text)
 TO service_role;
CREATE FUNCTION public.read_contact_intake_state(p_id uuid,p_recovery_hash text)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT CASE
   WHEN o.automation_withdrawn_at IS NOT NULL THEN 'withdrawn'
   WHEN o.intake_state='closed_manual' THEN 'closed_manual'
   WHEN o.intake_state='accepted' THEN 'accepted' ELSE 'pending' END
 FROM public.contact_acknowledgement_outbox o
 WHERE o.id=p_id AND o.automation_action='acknowledgement'
 AND p_recovery_hash ~ '^[0-9a-f]{64}$' AND o.intake_recovery_hash=p_recovery_hash), 'unknown');
$$;
REVOKE ALL ON FUNCTION public.read_contact_intake_state(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_contact_intake_state(uuid,text) TO service_role;
