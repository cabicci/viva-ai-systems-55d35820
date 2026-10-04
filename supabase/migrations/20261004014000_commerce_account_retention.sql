BEGIN;
-- Explicitly classify new owned finance; retain it for the EXISTING 15-day
-- deadline. Shared group payments survive another recipient's erasure.
DO $$ DECLARE r record; v_def text; BEGIN
 FOR r IN SELECT * FROM (VALUES
  ('lc09_advance_deletion','uuid,uuid,text'),('lc09_claim_financial_purge','uuid'),
  ('lc09_complete_financial_purge','uuid,uuid,boolean')) x(n,args)
 LOOP
  v_def:=pg_get_functiondef(to_regprocedure('public.'||r.n||'('||r.args||')'));
  IF r.n='lc09_complete_financial_purge' THEN
   v_def:=replace(v_def,$needle$ARRAY['account_deletion_requests','account_deletion_lifecycle']$needle$,
     $replacement$ARRAY['account_deletion_requests','account_deletion_lifecycle','commerce_orders','commerce_payments','commerce_receipts','commerce_grants','commerce_entitlements','commerce_audit']$replacement$);
  END IF;
  EXECUTE replace(v_def,'FUNCTION public.'||r.n||'(','FUNCTION public.commerce_previous_'||r.n||'(');
  EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC,anon,authenticated,service_role','commerce_previous_'||r.n,r.args);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_result jsonb; v_email text; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY'; END IF;
 PERFORM billing.account_deletion_blocked(p_user_id);
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=p_user_id;
 IF p_next_stage IN ('provider_reconciled','learner_erased') AND EXISTS(SELECT 1 FROM billing.commerce_outbox WHERE recipient=v_email AND status='sending' AND lease_until>now()) THEN RAISE EXCEPTION 'LC09_COMMERCE_MAIL_PENDING'; END IF;
 v_result:=public.commerce_previous_lc09_advance_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN
  UPDATE billing.commerce_audit SET user_id=p_user_id,details='{}' WHERE details->>'user_id'=p_user_id::text OR details->>'email'=v_email
    OR target_id IN (SELECT id FROM billing.commerce_grants WHERE user_id=p_user_id)
    OR target_id IN (SELECT id FROM billing.commerce_entitlements WHERE user_id=p_user_id)
    OR target_id IN (SELECT id FROM billing.commerce_invitations WHERE email=v_email OR accepted_by=p_user_id);
  DELETE FROM billing.commerce_entitlements WHERE user_id=p_user_id;
  DELETE FROM billing.commerce_grants WHERE user_id=p_user_id;
  DELETE FROM billing.commerce_invitations WHERE email=v_email OR accepted_by=p_user_id;
  DELETE FROM billing.commerce_mail_preferences WHERE email=v_email;
  UPDATE billing.commerce_orders SET review_status=CASE WHEN confirmed_at IS NULL THEN 'cancelled' ELSE review_status END,
    recipient_email='',parameters='{}',user_id=p_user_id WHERE user_id=p_user_id OR recipient_email=v_email;
  UPDATE billing.commerce_groups SET created_by=NULL WHERE created_by=p_user_id;
  UPDATE billing.commerce_offers SET created_by=NULL WHERE created_by=p_user_id;
  DELETE FROM billing.commerce_offers WHERE email=v_email AND NOT EXISTS(SELECT 1 FROM billing.commerce_orders WHERE offer_id=billing.commerce_offers.id);
  UPDATE billing.commerce_offers SET email=NULL,enabled=false WHERE email=v_email;
  UPDATE billing.commerce_grants SET created_by=NULL WHERE created_by=p_user_id;
  UPDATE billing.commerce_invitations SET created_by=NULL WHERE created_by=p_user_id;
  UPDATE billing.commerce_audit SET actor=NULL WHERE actor=p_user_id AND user_id IS DISTINCT FROM p_user_id;
 END IF;
 RETURN v_result;
END $$;
CREATE OR REPLACE FUNCTION public.lc09_claim_financial_purge(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_result jsonb; BEGIN
 v_result:=public.commerce_previous_lc09_claim_financial_purge(p_user_id);
 IF v_result->>'stage'='financial_due' THEN
  RETURN v_result||jsonb_build_object('storage_objects',coalesce((SELECT jsonb_agg(jsonb_build_object('bucket','commerce-receipts','name',r.storage_path))
    FROM billing.commerce_receipts r JOIN billing.commerce_orders o ON o.id=r.order_id WHERE o.user_id=p_user_id),'[]'));
 END IF;
 RETURN v_result;
END $$;
CREATE OR REPLACE FUNCTION public.lc09_complete_financial_purge(p_user_id uuid,p_lease_token uuid,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_result jsonb; v_ids uuid[]; v_payment_ids uuid[]; BEGIN
 v_result:=public.commerce_previous_lc09_complete_financial_purge(p_user_id,p_lease_token,p_release);
 IF p_release THEN RETURN v_result; END IF;
 SELECT coalesce(array_agg(id),'{}') INTO v_ids FROM billing.commerce_orders WHERE user_id=p_user_id;
 IF to_regclass('storage.objects') IS NOT NULL THEN
   IF EXISTS(SELECT 1 FROM storage.objects s JOIN billing.commerce_receipts r ON s.bucket_id='commerce-receipts' AND s.name=r.storage_path WHERE r.order_id=ANY(v_ids)) THEN RAISE EXCEPTION 'LC09_COMMERCE_RECEIPTS_REMAIN'; END IF;
 END IF;
 SELECT coalesce(array_agg(DISTINCT payment_id),'{}') INTO v_payment_ids FROM billing.commerce_allocations WHERE order_id=ANY(v_ids);
 DELETE FROM billing.commerce_audit WHERE user_id=p_user_id OR target_id=ANY(v_ids)
   OR target_id IN (SELECT id FROM billing.commerce_receipts WHERE order_id=ANY(v_ids));
 -- Remove allocations and refunds of this member only. ON DELETE CASCADE
 -- applies to order-owned children, never to a group's other orders.
 UPDATE billing.commerce_audit SET details=details||jsonb_build_object('allocations',coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements(details->'allocations') x WHERE NOT ((x->>'order_id')::uuid=ANY(v_ids))),'[]'))
   WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(details->'allocations') x WHERE (x->>'order_id')::uuid=ANY(v_ids));
 DELETE FROM billing.commerce_orders WHERE user_id=p_user_id;
 DELETE FROM billing.commerce_payments WHERE (user_id=p_user_id OR id=ANY(v_payment_ids)) AND NOT EXISTS(SELECT 1 FROM billing.commerce_allocations WHERE payment_id=billing.commerce_payments.id);
 -- Shared payment parameters originally include allocation IDs. Strip target
 -- entries while preserving the recorded gross sum and remaining allocations.
 UPDATE billing.commerce_payments SET parameters=parameters||jsonb_build_object('allocations',coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements(parameters->'allocations') x WHERE NOT ((x->>'order_id')::uuid=ANY(v_ids))),'[]'))
   WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(parameters->'allocations') x WHERE (x->>'order_id')::uuid=ANY(v_ids));
 UPDATE billing.commerce_payments SET confirmed_by=NULL WHERE confirmed_by=p_user_id;
 UPDATE billing.commerce_receipts SET attached_by=NULL WHERE attached_by=p_user_id;
 UPDATE billing.commerce_refunds SET recorded_by=NULL WHERE recorded_by=p_user_id;
 RETURN v_result;
END $$;

COMMIT;
