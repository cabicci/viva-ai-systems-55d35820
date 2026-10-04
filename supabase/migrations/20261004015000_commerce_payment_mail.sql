BEGIN;
-- Reuse the private commerce outbox, delivery webhook and deletion lease guard.
ALTER TABLE billing.commerce_outbox ALTER COLUMN invitation_id DROP NOT NULL;
ALTER TABLE billing.commerce_outbox ADD COLUMN order_id uuid UNIQUE REFERENCES billing.commerce_orders(id) ON DELETE CASCADE;
ALTER TABLE billing.commerce_outbox ADD COLUMN receipt_id uuid UNIQUE REFERENCES billing.commerce_receipts(id) ON DELETE CASCADE;
ALTER TABLE billing.commerce_outbox ADD COLUMN claim_token uuid;
ALTER TABLE billing.commerce_outbox ADD CONSTRAINT commerce_mail_one_source CHECK (num_nonnulls(invitation_id,order_id,receipt_id)=1);

CREATE FUNCTION billing.queue_commerce_payment_mail(p_order uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; BEGIN
 INSERT INTO billing.commerce_outbox(order_id,recipient,payload)
 SELECT o.id,lower(u.email),jsonb_build_object('name',left(u.raw_user_meta_data->>'full_name',80),
   'locale',u.raw_user_meta_data->>'preferred_locale','package',o.package,'reference',o.reference,
   'amount_minor',o.final_minor,'currency',o.currency,'order_id',o.id)
 FROM billing.commerce_orders o JOIN auth.users u ON u.id=o.user_id
 WHERE o.id=p_order AND o.review_status='confirmed' AND o.confirmed_at IS NOT NULL
   AND EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.order_id=o.id AND e.revoked_at IS NULL AND e.ends_at>now())
   AND u.email_confirmed_at IS NOT NULL AND lower(u.email)=o.recipient_email
   AND NOT billing.account_deletion_blocked(u.id)
 ON CONFLICT(order_id) DO NOTHING;
 SELECT id INTO v_id FROM billing.commerce_outbox WHERE order_id=p_order;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION billing.queue_commerce_payment_mail(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION billing.commerce_payment_mail_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.review_status='confirmed' AND OLD.review_status IS DISTINCT FROM NEW.review_status THEN
   PERFORM billing.queue_commerce_payment_mail(NEW.id);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_payment_mail_trigger() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commerce_payment_mail_confirmed AFTER UPDATE OF review_status ON billing.commerce_orders
 FOR EACH ROW EXECUTE FUNCTION billing.commerce_payment_mail_trigger();

CREATE FUNCTION billing.commerce_payment_access_mail_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.order_id IS NOT NULL THEN PERFORM billing.queue_commerce_payment_mail(NEW.order_id); END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_payment_access_mail_trigger() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commerce_payment_mail_after_acceptance AFTER INSERT ON billing.commerce_entitlements
 FOR EACH ROW EXECUTE FUNCTION billing.commerce_payment_access_mail_trigger();

-- Queue with the durable receipt manifest. Claiming is blocked until the private
-- storage object exists; failed uploads discard both manifest and notification.
CREATE FUNCTION billing.commerce_receipt_review_mail_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 INSERT INTO billing.commerce_outbox(receipt_id,recipient,payload)
 SELECT NEW.id,'sales@masaarat.ai',jsonb_build_object('kind','receipt_review',
   'locale',u.raw_user_meta_data->>'preferred_locale','package',o.package,
   'reference',o.reference,'amount_minor',o.final_minor,'currency',o.currency,'order_id',o.id)
 FROM billing.commerce_orders o JOIN auth.users u ON u.id=o.user_id
 WHERE o.id=NEW.order_id AND NOT billing.account_deletion_blocked(u.id)
 ON CONFLICT(receipt_id) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_receipt_review_mail_trigger() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commerce_receipt_review_mail AFTER INSERT ON billing.commerce_receipts
 FOR EACH ROW EXECUTE FUNCTION billing.commerce_receipt_review_mail_trigger();

-- An existing confirmed order can be queued explicitly by its reviewing admin.
CREATE FUNCTION public.queue_commerce_payment_confirmation(p_order uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_id uuid; BEGIN
 PERFORM billing.commerce_assert_identity(auth.uid());
 IF NOT billing.commerce_is_admin() THEN RAISE EXCEPTION 'COMMERCE_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 v_id:=billing.queue_commerce_payment_mail(p_order);
 RETURN (SELECT jsonb_build_object('id',id,'status',status) FROM billing.commerce_outbox WHERE id=v_id);
END $$;
REVOKE ALL ON FUNCTION public.queue_commerce_payment_confirmation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.queue_commerce_payment_confirmation(uuid) TO authenticated;

-- Delete service-message identity with learner erasure, before financial retention.
CREATE FUNCTION billing.erase_commerce_payment_mail() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.recipient_email='' AND OLD.recipient_email<>'' THEN
   -- Review messages target sales, so the existing recipient-email lease guard
   -- alone cannot protect the buyer's identity while a send is in progress.
   IF EXISTS(SELECT 1 FROM billing.commerce_outbox WHERE
     (order_id=OLD.id OR receipt_id IN (SELECT id FROM billing.commerce_receipts WHERE order_id=OLD.id))
     AND status='sending' AND lease_until>now()) THEN
     RAISE EXCEPTION 'LC09_COMMERCE_MAIL_PENDING';
   END IF;
   DELETE FROM billing.commerce_outbox WHERE order_id=OLD.id OR
     receipt_id IN (SELECT id FROM billing.commerce_receipts WHERE order_id=OLD.id);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.erase_commerce_payment_mail() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commerce_payment_mail_erasure BEFORE UPDATE OF recipient_email ON billing.commerce_orders
 FOR EACH ROW EXECUTE FUNCTION billing.erase_commerce_payment_mail();

CREATE FUNCTION billing.commerce_payment_mail_allowed(p_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM billing.commerce_outbox m
 LEFT JOIN billing.commerce_receipts r ON r.id=m.receipt_id
 JOIN billing.commerce_orders o ON o.id=coalesce(m.order_id,r.order_id)
 JOIN auth.users u ON u.id=o.user_id AND u.email_confirmed_at IS NOT NULL
 WHERE m.id=p_id AND (
   (m.order_id IS NOT NULL AND lower(u.email)=m.recipient AND o.review_status='confirmed'
     AND EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.order_id=o.id AND e.revoked_at IS NULL AND e.ends_at>now()))
   OR (m.receipt_id IS NOT NULL AND m.recipient='sales@masaarat.ai'
     AND EXISTS(SELECT 1 FROM storage.objects s WHERE s.bucket_id='commerce-receipts' AND s.name=r.storage_path)))
   AND NOT billing.account_deletion_blocked(u.id) AND billing.lc09_contact_recipient_active(m.recipient)
   AND NOT EXISTS(SELECT 1 FROM billing.commerce_mail_preferences p WHERE p.email=m.recipient AND p.suppressed)
   AND NOT EXISTS(SELECT 1 FROM public.contact_mail_receipts c JOIN public.contact_acknowledgement_outbox a ON a.id=c.outbox_id WHERE a.recipient=m.recipient AND c.event_type IN ('email.bounced','email.failed','email.complained','email.suppressed')));
$$;
REVOKE ALL ON FUNCTION billing.commerce_payment_mail_allowed(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.commerce_payment_mail(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; v_rows jsonb:='[]'; v_token uuid; v_id uuid; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'COMMERCE_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_action='claim' THEN
   FOR r IN SELECT m.* FROM billing.commerce_outbox m WHERE (m.order_id IS NOT NULL OR m.receipt_id IS NOT NULL)
     AND (m.receipt_id IS NULL OR EXISTS(SELECT 1 FROM billing.commerce_receipts cr JOIN storage.objects so ON so.bucket_id='commerce-receipts' AND so.name=cr.storage_path WHERE cr.id=m.receipt_id))
     AND (p_data->>'receipt_id' IS NULL OR m.receipt_id=(p_data->>'receipt_id')::uuid)
     AND (p_data->>'order_id' IS NULL OR m.order_id=(p_data->>'order_id')::uuid)
     AND m.provider_email_id IS NULL AND m.status IN ('pending','sending')
     AND (m.lease_until IS NULL OR m.lease_until<=now())
     ORDER BY m.created_at FOR UPDATE OF m SKIP LOCKED LIMIT 5
   LOOP
     IF NOT billing.commerce_payment_mail_allowed(r.id) THEN
       UPDATE billing.commerce_outbox SET status='suppressed',delivery='suppressed' WHERE id=r.id; CONTINUE;
     END IF;
     IF r.first_attempt_at IS NOT NULL AND r.first_attempt_at<=now()-interval '23 hours' THEN
       UPDATE billing.commerce_outbox SET status='unknown',lease_until=NULL WHERE id=r.id; CONTINUE;
     END IF;
     v_token:=gen_random_uuid();
     UPDATE billing.commerce_outbox SET status='sending',claim_token=v_token,first_attempt_at=coalesce(first_attempt_at,now()),lease_until=now()+interval '5 minutes',attempts=attempts+1 WHERE id=r.id;
     v_rows:=v_rows||jsonb_build_array(jsonb_build_object('id',r.id,'order_id',r.order_id,'receipt_id',r.receipt_id,'claim_token',v_token,'recipient',r.recipient,'payload',r.payload));
   END LOOP;
   RETURN v_rows;
 ELSIF p_action='authorize_attempt' THEN
   RETURN to_jsonb(EXISTS(SELECT 1 FROM billing.commerce_outbox WHERE id=(p_data->>'id')::uuid
     AND (order_id IS NOT NULL OR receipt_id IS NOT NULL) AND claim_token=(p_data->>'claim_token')::uuid AND status='sending' AND lease_until>now()
     AND billing.commerce_payment_mail_allowed(id)));
 ELSIF p_action='result' THEN
   UPDATE billing.commerce_outbox SET provider_email_id=nullif(p_data->>'provider_id',''),
     status=CASE WHEN nullif(p_data->>'provider_id','') IS NOT NULL THEN 'sent' WHEN coalesce((p_data->>'retryable')::boolean,false) THEN 'pending' ELSE 'failed' END,
     delivery=CASE WHEN nullif(p_data->>'provider_id','') IS NOT NULL THEN 'accepted' ELSE 'not_sent' END,
     lease_until=CASE WHEN nullif(p_data->>'provider_id','') IS NULL AND coalesce((p_data->>'retryable')::boolean,false) THEN now()+interval '1 minute' ELSE NULL END
   WHERE id=(p_data->>'id')::uuid AND (order_id IS NOT NULL OR receipt_id IS NOT NULL) AND claim_token=(p_data->>'claim_token')::uuid
     AND status='sending' AND lease_until>now() AND provider_email_id IS NULL;
   RETURN to_jsonb(FOUND);
 END IF;
 RAISE EXCEPTION 'COMMERCE_UNKNOWN_MAIL_ACTION';
END $$;
REVOKE ALL ON FUNCTION public.commerce_payment_mail(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_payment_mail(text,jsonb) TO service_role;
COMMIT;
