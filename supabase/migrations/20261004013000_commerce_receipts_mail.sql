BEGIN;
DO $commerce_storage_policy_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies policy
    WHERE policy.schemaname = 'storage'
      AND policy.tablename = 'objects'
      AND policy.permissive = 'PERMISSIVE'
      AND policy.roles && ARRAY['public', 'anon', 'authenticated']::name[]
      AND (
        (
          policy.cmd IN ('ALL', 'SELECT', 'UPDATE', 'DELETE')
          AND (
            COALESCE(policy.qual, '') !~ '^[[:space:]()]*bucket_id[[:space:]]*=[[:space:]]*''[^'']+'''
            OR substring(policy.qual FROM 'bucket_id[[:space:]]*=[[:space:]]*''([^'']+)''') = 'commerce-receipts'
            OR COALESCE(policy.qual, '') ~* '\mOR\M'
          )
        )
        OR (
          policy.cmd IN ('ALL', 'INSERT', 'UPDATE')
          AND (
            COALESCE(policy.with_check, policy.qual, '') !~ '^[[:space:]()]*bucket_id[[:space:]]*=[[:space:]]*''[^'']+'''
            OR substring(COALESCE(policy.with_check, policy.qual) FROM 'bucket_id[[:space:]]*=[[:space:]]*''([^'']+)''') = 'commerce-receipts'
            OR COALESCE(policy.with_check, policy.qual, '') ~* '\mOR\M'
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'Commerce receipt storage requires bucket-scoped Storage policies';
  END IF;
END
$commerce_storage_policy_guard$;

CREATE FUNCTION public.commerce_receipt(p_actor uuid,p_action text,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE o billing.commerce_orders%ROWTYPE; v_admin boolean; v_id uuid; v_reuse boolean; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'COMMERCE_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commerce_assert_identity(p_actor);
 IF p_action<>'read' AND NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled) THEN RAISE EXCEPTION 'COMMERCE_DISABLED'; END IF;
 v_admin:=public.has_role(p_actor,'admin'::app_role);
 IF p_action='read' THEN
   SELECT * INTO o FROM billing.commerce_orders WHERE id=(SELECT order_id FROM billing.commerce_receipts WHERE id=(p_data->>'id')::uuid);
 ELSE SELECT * INTO o FROM billing.commerce_orders WHERE id=(p_data->>'order_id')::uuid FOR UPDATE; END IF;
 IF o.id IS NULL OR NOT (v_admin OR o.user_id=p_actor) THEN RAISE EXCEPTION 'COMMERCE_RECEIPT_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF p_action='read' THEN RETURN (SELECT to_jsonb(x) FROM billing.commerce_receipts x WHERE id=(p_data->>'id')::uuid);
 ELSIF p_action='discard' THEN
   DELETE FROM billing.commerce_receipts WHERE id=(p_data->>'id')::uuid AND order_id=o.id;
   RETURN jsonb_build_object('ok',true);
 ELSIF p_action='authorize' THEN
   IF NOT (v_admin AND o.review_status IN ('confirmed','refunded')) AND (o.review_status NOT IN ('awaiting_receipt','pending','more_info','rejected') OR o.expires_at<=now()) THEN RAISE EXCEPTION 'COMMERCE_RECEIPT_ORDER_CLOSED'; END IF;
   RETURN to_jsonb(o);
 ELSIF p_action='attach' THEN
   IF NOT (v_admin AND o.review_status IN ('confirmed','refunded')) AND (o.review_status NOT IN ('awaiting_receipt','pending','more_info','rejected') OR o.expires_at<=now()) THEN RAISE EXCEPTION 'COMMERCE_RECEIPT_ORDER_CLOSED'; END IF;
   v_id:=(p_data->>'id')::uuid;
   IF p_data->>'storage_path' IS DISTINCT FROM o.id::text||'/'||v_id::text THEN RAISE EXCEPTION 'COMMERCE_RECEIPT_PATH_MISMATCH'; END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('commerce-receipt:'||(p_data->>'digest'),0));
   SELECT EXISTS(SELECT 1 FROM billing.commerce_receipts WHERE digest=p_data->>'digest' AND order_id<>o.id) INTO v_reuse;
   INSERT INTO billing.commerce_receipts(id,order_id,user_id,storage_path,mime,size_bytes,digest,suspected_reuse,attached_by)
     VALUES(v_id,o.id,o.user_id,p_data->>'storage_path',p_data->>'mime',(p_data->>'size_bytes')::integer,p_data->>'digest',v_reuse,p_actor);
   IF v_reuse THEN UPDATE billing.commerce_receipts SET suspected_reuse=true WHERE digest=p_data->>'digest'; END IF;
   UPDATE billing.commerce_orders SET review_status='pending',review_reason=NULL WHERE id=o.id AND review_status NOT IN ('confirmed','refunded');
   INSERT INTO billing.commerce_audit(actor,user_id,action,target_id) VALUES(p_actor,o.user_id,'attach_receipt',v_id);
   RETURN jsonb_build_object('id',v_id,'suspected_reuse',v_reuse);
 END IF;
 RAISE EXCEPTION 'COMMERCE_UNKNOWN_RECEIPT_ACTION';
END $$;
REVOKE ALL ON FUNCTION public.commerce_receipt(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_receipt(uuid,text,jsonb) TO service_role;

-- Private receipt bucket. Every read/upload is authorized in the server before
-- using the existing service client; there are deliberately NO public policies.
DO $$ BEGIN
 IF to_regclass('storage.buckets') IS NOT NULL THEN
  INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    VALUES('commerce-receipts','commerce-receipts',false,5242880,ARRAY['image/png','image/jpeg','application/pdf']);
 END IF;
END $$;

CREATE FUNCTION public.commerce_mail(p_action text,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_actor uuid; r record; v_rows jsonb:='[]'; v_id uuid; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'COMMERCE_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_action='claim' THEN
   v_actor:=(p_data->>'actor')::uuid;
   PERFORM billing.commerce_assert_identity(v_actor);
   IF NOT public.has_role(v_actor,'admin'::app_role) THEN RAISE EXCEPTION 'COMMERCE_ADMIN_REQUIRED'; END IF;
   IF NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled AND invitations_enabled) THEN RETURN '[]'; END IF;
   FOR r IN SELECT o.*,i.group_id FROM billing.commerce_outbox o JOIN billing.commerce_invitations i ON i.id=o.invitation_id
     JOIN billing.commerce_groups g ON g.id=i.group_id
     WHERE i.group_id=(p_data->>'group_id')::uuid AND g.send_state='ready'
       AND i.revoked_at IS NULL AND i.accepted_at IS NULL AND i.deadline>now()
       AND o.provider_email_id IS NULL AND o.status IN ('pending','sending') AND (o.lease_until IS NULL OR o.lease_until<=now())
     ORDER BY o.created_at FOR UPDATE OF o SKIP LOCKED LIMIT 25
   LOOP
     IF NOT billing.lc09_contact_recipient_active(r.recipient) OR EXISTS(SELECT 1 FROM billing.commerce_mail_preferences WHERE email=r.recipient AND (marketing_opt_out OR suppressed))
       OR EXISTS(SELECT 1 FROM public.contact_mail_receipts c JOIN public.contact_acknowledgement_outbox a ON a.id=c.outbox_id WHERE a.recipient=r.recipient AND c.event_type IN ('email.bounced','email.complained','email.suppressed')) THEN
       UPDATE billing.commerce_outbox SET status='suppressed',delivery='suppressed' WHERE id=r.id; CONTINUE;
     END IF;
     -- Provider idempotency is bounded. Unknown outcomes become manual review
     -- before that window ends, rather than silently resending after it.
     IF r.first_attempt_at IS NOT NULL AND r.first_attempt_at<=now()-interval '23 hours' THEN
       UPDATE billing.commerce_outbox SET status='unknown',lease_until=NULL WHERE id=r.id; CONTINUE;
     END IF;
     UPDATE billing.commerce_outbox SET status='sending',first_attempt_at=coalesce(first_attempt_at,now()),lease_until=now()+interval '10 minutes',attempts=attempts+1 WHERE id=r.id;
     v_rows:=v_rows||jsonb_build_array(jsonb_build_object('id',r.id,'invitation_id',r.invitation_id,'recipient',r.recipient,'payload',r.payload));
   END LOOP;
   RETURN v_rows;
 ELSIF p_action='authorize_attempt' THEN
   v_id:=(p_data->>'id')::uuid;
   IF NOT EXISTS(SELECT 1 FROM billing.commerce_outbox o JOIN billing.commerce_invitations i ON i.id=o.invitation_id JOIN billing.commerce_groups g ON g.id=i.group_id
     WHERE o.id=v_id AND o.status='sending' AND o.lease_until>now() AND g.send_state='ready' AND i.revoked_at IS NULL AND i.accepted_at IS NULL AND i.deadline>now()
     AND billing.lc09_contact_recipient_active(o.recipient) AND NOT EXISTS(SELECT 1 FROM billing.commerce_mail_preferences WHERE email=o.recipient AND (marketing_opt_out OR suppressed)))
     OR NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled AND invitations_enabled) THEN
     UPDATE billing.commerce_outbox SET status='pending',lease_until=NULL WHERE id=v_id AND status='sending'; RETURN 'false'; END IF;
   RETURN 'true';
 ELSIF p_action='result' THEN
   v_id:=(p_data->>'id')::uuid;
   UPDATE billing.commerce_outbox SET provider_email_id=nullif(p_data->>'provider_id',''),
     status=CASE WHEN nullif(p_data->>'provider_id','') IS NOT NULL THEN 'sent'
       WHEN coalesce((p_data->>'retryable')::boolean,false) THEN 'pending' ELSE 'failed' END,
     delivery=CASE WHEN nullif(p_data->>'provider_id','') IS NOT NULL THEN 'accepted' ELSE 'not_sent' END,lease_until=NULL
     WHERE id=v_id AND status='sending' AND provider_email_id IS NULL;
   RETURN jsonb_build_object('ok',true);
 END IF;
 RAISE EXCEPTION 'COMMERCE_UNKNOWN_MAIL_ACTION';
END $$;
REVOKE ALL ON FUNCTION public.commerce_mail(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_mail(text,jsonb) TO service_role;

CREATE TABLE billing.commerce_mail_receipts(
 event_id text PRIMARY KEY CHECK(length(event_id) BETWEEN 1 AND 200),
 outbox_id uuid NOT NULL REFERENCES billing.commerce_outbox(id) ON DELETE CASCADE,
 event_type text NOT NULL,occurred_at timestamptz NOT NULL,received_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE billing.commerce_mail_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.commerce_mail_receipts FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE billing.commerce_outbox ADD COLUMN delivery_at timestamptz;

-- Reuse the existing verified Resend receipt endpoint and signing configuration.
DO $$ BEGIN
 EXECUTE replace(pg_get_functiondef('public.record_contact_mail_receipt(text,text,text,text,timestamptz)'::regprocedure),
   'FUNCTION public.record_contact_mail_receipt(','FUNCTION public.commerce_previous_record_contact_mail_receipt(');
END $$;
REVOKE ALL ON FUNCTION public.commerce_previous_record_contact_mail_receipt(text,text,text,text,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.record_contact_mail_receipt(p_event text,p_email_id text,p_recipient text,p_type text,p_at timestamptz) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_id uuid; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'COMMERCE_SERVICE_ONLY'; END IF;
 SELECT id INTO v_id FROM billing.commerce_outbox WHERE provider_email_id=p_email_id AND recipient=lower(p_recipient) FOR UPDATE;
 IF v_id IS NULL THEN
  IF EXISTS(SELECT 1 FROM billing.commerce_outbox WHERE recipient=lower(p_recipient) AND provider_email_id IS NULL AND first_attempt_at IS NOT NULL AND status IN ('sending','pending')) THEN RETURN 'pending'; END IF;
  RETURN public.commerce_previous_record_contact_mail_receipt(p_event,p_email_id,p_recipient,p_type,p_at); END IF;
 IF p_type NOT IN ('email.delivered','email.delivery_delayed','email.bounced','email.failed','email.complained','email.suppressed') OR p_at IS NULL THEN RETURN 'ignored'; END IF;
 INSERT INTO billing.commerce_mail_receipts(event_id,outbox_id,event_type,occurred_at) VALUES(p_event,v_id,p_type,p_at) ON CONFLICT(event_id) DO NOTHING;
 IF NOT FOUND THEN RETURN 'recorded'; END IF;
 UPDATE billing.commerce_outbox SET delivery_at=greatest(delivery_at,p_at),delivery=CASE WHEN delivery IN ('email.bounced','email.complained','email.suppressed') THEN delivery ELSE p_type END WHERE id=v_id AND (delivery_at IS NULL OR delivery_at<=p_at OR p_type IN ('email.bounced','email.complained','email.suppressed'));
 IF p_type IN ('email.bounced','email.complained','email.suppressed') THEN
   INSERT INTO billing.commerce_mail_preferences(email,suppressed) VALUES(lower(p_recipient),true)
     ON CONFLICT(email) DO UPDATE SET suppressed=true,updated_at=now();
 END IF;
 RETURN 'recorded';
END $$;

COMMIT;
