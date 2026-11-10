-- Stop new provider work while existing attempts settle. Local delivery preparation.
CREATE TABLE billing.communications_maintenance (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 starts_paused boolean NOT NULL DEFAULT false
);
INSERT INTO billing.communications_maintenance(singleton) VALUES(true);
ALTER TABLE billing.communications_maintenance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE billing.communications_maintenance FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION billing.communications_starts_open()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE paused boolean;
BEGIN
 SELECT starts_paused INTO STRICT paused FROM billing.communications_maintenance WHERE singleton FOR SHARE;
 RETURN NOT paused;
END;
$$;
REVOKE ALL ON FUNCTION billing.communications_starts_open() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION billing.communications_starts_open() TO service_role;

CREATE FUNCTION public.set_communications_starts_paused(p_actor uuid,p_paused boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF coalesce(auth.jwt()->>'role','')<>'service_role' OR p_actor IS NULL OR p_paused IS NULL
   OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor)
   OR public.has_role(p_actor,'admin') IS DISTINCT FROM true THEN
   RAISE EXCEPTION 'COMMUNICATIONS_ADMIN_REQUIRED';
 END IF;
 -- Use the same gate-before-account order as provider-starting operations.
 PERFORM 1 FROM billing.communications_maintenance WHERE singleton FOR UPDATE;
 IF billing.account_deletion_blocked(p_actor) THEN RAISE EXCEPTION 'COMMUNICATIONS_ADMIN_REQUIRED'; END IF;
 UPDATE billing.communications_maintenance SET starts_paused=p_paused WHERE singleton;
 RETURN jsonb_build_object('startsPaused',p_paused);
END;
$$;
REVOKE ALL ON FUNCTION public.set_communications_starts_paused(uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_communications_starts_paused(uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION communications_private.phone_command(p_actor uuid,p_action text,p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c communications_private.phone_control%ROWTYPE;
 q communications_private.phone_challenges%ROWTYPE;
 v_phone text; v_time timestamptz; v_id uuid; v_lease uuid; v_starts_open boolean:=true;
BEGIN
 IF coalesce(auth.jwt()->>'role','')<>'service_role' THEN RAISE EXCEPTION 'PHONE_SERVER_REQUIRED'; END IF;
 IF p_action IN ('status','reserve','claim_check') THEN
  v_starts_open:=billing.communications_starts_open();
  IF NOT v_starts_open AND p_action<>'status' THEN RAISE EXCEPTION 'COMMUNICATIONS_STARTS_PAUSED'; END IF;
 END IF;
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor)
   THEN RAISE EXCEPTION 'PHONE_ACCOUNT_UNAVAILABLE'; END IF;
 -- Shares the deletion locks and sees current Auth state at every write boundary.
 IF billing.account_deletion_blocked(p_actor) THEN RAISE EXCEPTION 'PHONE_ACCOUNT_UNAVAILABLE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor AND email_confirmed_at IS NOT NULL)
   THEN RAISE EXCEPTION 'EMAIL_CONFIRMATION_REQUIRED'; END IF;
 SELECT * INTO STRICT c FROM communications_private.phone_control WHERE singleton;
 IF p_action='status' THEN
  SELECT phone,verified_at INTO v_phone,v_time FROM communications_private.verified_phones WHERE actor=p_actor;
  RETURN jsonb_build_object('enabled',c.enabled AND v_starts_open AND p_actor=ANY(c.test_users),'channels',to_jsonb(c.channels),'phone',v_phone,'verifiedAt',v_time);
 END IF;
 IF NOT c.enabled OR NOT p_actor=ANY(c.test_users) THEN RAISE EXCEPTION 'PHONE_DISABLED'; END IF;
 IF p_action='reserve' THEN
  -- Serialize global + per-number quotas; reserve before any paid provider call.
  PERFORM pg_advisory_xact_lock(hashtextextended('masaarat-phone-budget',0));
  SELECT * INTO STRICT c FROM communications_private.phone_control WHERE singleton FOR UPDATE;
  IF NOT c.enabled OR NOT p_actor=ANY(c.test_users) THEN RAISE EXCEPTION 'PHONE_DISABLED'; END IF;
  IF coalesce(p_data->>'channel','')<>ALL(c.channels) THEN RAISE EXCEPTION 'PHONE_CHANNEL_UNAVAILABLE'; END IF;
  v_phone:=p_data->>'phone';
  IF v_phone IS NULL OR v_phone !~ '^\+[1-9][0-9]{7,14}$' THEN RAISE EXCEPTION 'PHONE_INVALID'; END IF;
  IF coalesce(p_data->>'country','')<>ALL(c.countries)
    OR (p_data->>'country'='EG' AND v_phone !~ '^\+20') THEN RAISE EXCEPTION 'PHONE_COUNTRY_UNAVAILABLE'; END IF;
  IF EXISTS(SELECT 1 FROM communications_private.verified_phones WHERE phone=v_phone AND actor<>p_actor)
    THEN RAISE EXCEPTION 'PHONE_INVALID'; END IF;
  IF EXISTS(SELECT 1 FROM communications_private.phone_challenges WHERE actor=p_actor
      AND state IN ('reserved','pending','uncertain','checking') AND expires_at>now())
    THEN RAISE EXCEPTION 'PHONE_COOLDOWN'; END IF;
  IF (SELECT count(*) FROM communications_private.phone_challenges WHERE actor=p_actor AND created_at>now()-interval '1 day')>=3
    OR (SELECT count(*) FROM communications_private.phone_challenges WHERE phone=v_phone AND created_at>now()-interval '1 day')>=3
    THEN RAISE EXCEPTION 'PHONE_LIMIT'; END IF;
  IF c.budget_day<>(now() AT TIME ZONE 'UTC')::date THEN
    UPDATE communications_private.phone_control SET budget_day=(now() AT TIME ZONE 'UTC')::date,day_sends=0 WHERE singleton;
    c.day_sends:=0;
  END IF;
  IF c.day_sends>=c.daily_cap THEN RAISE EXCEPTION 'PHONE_LIMIT'; END IF;
  INSERT INTO communications_private.phone_challenges(actor,phone,service_sid,channel)
    VALUES(p_actor,v_phone,p_data->>'serviceSid',p_data->>'channel') RETURNING * INTO q;
  UPDATE communications_private.phone_control SET day_sends=day_sends+1 WHERE singleton;
  RETURN jsonb_build_object('challengeId',q.id,'expiresAt',q.expires_at);
 END IF;
 v_id:=(p_data->>'challengeId')::uuid;
 SELECT * INTO q FROM communications_private.phone_challenges WHERE id=v_id AND actor=p_actor FOR UPDATE;
 IF NOT FOUND OR q.expires_at<=now() THEN RAISE EXCEPTION 'PHONE_CHALLENGE_EXPIRED'; END IF;
 IF p_action IN ('sent','uncertain') THEN
  IF q.state<>'reserved' OR q.lease_until<=now() THEN RAISE EXCEPTION 'PHONE_CHALLENGE_STATE'; END IF;
  UPDATE communications_private.phone_challenges SET state=CASE WHEN p_action='sent' THEN 'pending' ELSE 'uncertain' END,
   verification_sid=CASE WHEN p_action='sent' THEN p_data->>'verificationSid' ELSE NULL END,lease_until=now() WHERE id=q.id;
  RETURN '{}'::jsonb;
 ELSIF p_action='claim_check' THEN
  IF q.state<>'pending' OR q.verification_sid IS NULL OR q.checks>=5 THEN RAISE EXCEPTION 'PHONE_CHALLENGE_STATE'; END IF;
  v_lease:=gen_random_uuid();
  UPDATE communications_private.phone_challenges SET state='checking',checks=checks+1,lease=v_lease,
    lease_until=now()+interval '30 seconds' WHERE id=q.id;
  RETURN jsonb_build_object('phone',q.phone,'serviceSid',q.service_sid,'verificationSid',q.verification_sid,'lease',v_lease);
 ELSIF p_action IN ('checked','check_failed') THEN
  IF q.state<>'checking' OR q.lease IS DISTINCT FROM (p_data->>'lease')::uuid OR q.lease_until<=now()
    THEN RAISE EXCEPTION 'PHONE_CHALLENGE_STATE'; END IF;
  IF p_action='checked' AND p_data->'approved'='true'::jsonb THEN
   PERFORM pg_advisory_xact_lock(hashtextextended('masaarat-phone-budget',0));
   IF EXISTS(SELECT 1 FROM communications_private.verified_phones WHERE phone=q.phone AND actor<>p_actor)
     THEN RAISE EXCEPTION 'PHONE_INVALID'; END IF;
   INSERT INTO communications_private.verified_phones(actor,phone) VALUES(p_actor,q.phone)
    ON CONFLICT(actor) DO UPDATE SET phone=excluded.phone,verified_at=now();
   UPDATE communications_private.phone_challenges SET state='verified',lease=NULL,lease_until=now() WHERE id=q.id;
   RETURN jsonb_build_object('verified',true);
  END IF;
  UPDATE communications_private.phone_challenges SET state=CASE WHEN checks>=5 THEN 'exhausted' ELSE 'pending' END,
    lease=NULL,lease_until=now() WHERE id=q.id;
  RETURN jsonb_build_object('verified',false);
 END IF;
 RAISE EXCEPTION 'PHONE_ACTION_INVALID';
END $$;
CREATE OR REPLACE FUNCTION public.reserve_contact_intake(
 p_id uuid,p_recipient text,p_locale text,p_stream text,p_subject text,p_text text,p_html text,
 p_processing_consent boolean,p_owner_subject text,p_owner_text text,p_owner_html text,p_payload_hash text,p_recovery_hash text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE; token uuid; v_starts_open boolean;
BEGIN
 v_starts_open:=billing.communications_starts_open();
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
   IF v_starts_open AND o.intake_state='reserved' AND o.intake_started_at IS NULL
     AND (o.intake_lease_until IS NULL OR o.intake_lease_until<=clock_timestamp()) THEN
     token:=gen_random_uuid();
     UPDATE public.contact_acknowledgement_outbox SET intake_claim_token=token,
       intake_reserved_at=clock_timestamp(),intake_lease_until=clock_timestamp()+interval '5 minutes' WHERE id=p_id;
     RETURN jsonb_build_object('state','dispatch','claim',token);
   END IF;
   RETURN jsonb_build_object('state',CASE WHEN o.intake_state='accepted' THEN 'accepted' ELSE 'reconciliation_required' END);
 END IF;
 IF NOT billing.communications_starts_open() THEN RAISE EXCEPTION 'COMMUNICATIONS_STARTS_PAUSED'; END IF;
 PERFORM public.queue_contact_automation(p_id,p_recipient,p_locale,p_stream,p_subject,p_text,p_html,
   p_processing_consent,p_owner_subject,p_owner_text,p_owner_html);
 token:=gen_random_uuid();
 UPDATE public.contact_acknowledgement_outbox SET intake_state='reserved',intake_payload_hash=p_payload_hash,intake_recovery_hash=p_recovery_hash,
   intake_claim_token=token,intake_reserved_at=clock_timestamp(),intake_lease_until=clock_timestamp()+interval '5 minutes' WHERE id=p_id;
 RETURN jsonb_build_object('state','dispatch','claim',token);
END;
$$;

CREATE OR REPLACE FUNCTION public.begin_contact_intake(p_id uuid,p_claim uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE; instant timestamptz;
BEGIN
 IF NOT billing.communications_starts_open() THEN
   UPDATE public.contact_acknowledgement_outbox SET intake_claim_token=NULL,intake_lease_until=NULL
   WHERE id=p_id AND intake_claim_token=p_claim AND intake_state='reserved' AND intake_started_at IS NULL;
   RETURN false;
 END IF;
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

CREATE OR REPLACE FUNCTION public.claim_contact_automation(p_owner text,p_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid,claim_token uuid,recipient text,subject text,text_body text,html_body text,sender text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidates uuid[];
BEGIN
 IF NOT billing.communications_starts_open() THEN RETURN; END IF;
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

CREATE OR REPLACE FUNCTION public.begin_contact_mail_send(p_id uuid,p_claim uuid,p_owner text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.contact_acknowledgement_outbox%ROWTYPE;
        source public.contact_acknowledgement_outbox%ROWTYPE; instant timestamptz;
BEGIN
 IF NOT billing.communications_starts_open() THEN RETURN false; END IF;
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
