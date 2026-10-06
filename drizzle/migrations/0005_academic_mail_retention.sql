BEGIN;
-- Recipient data is erased with the learner. Financial event receipts retain
-- the existing 15-day policy; shared educational assets are never user-owned.
CREATE TABLE public.academic_mail_outbox(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 invoice_id text NOT NULL UNIQUE, subscription_id text NOT NULL,
 recipient text NOT NULL, display_name text, locale text, kind text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), first_attempt_at timestamptz,
 lease_until timestamptz, claim_token uuid, provider_email_id text,
 blocked boolean NOT NULL DEFAULT false);
ALTER TABLE public.academic_mail_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_mail_outbox FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER lc09_academic_mail_write BEFORE INSERT OR UPDATE ON public.academic_mail_outbox FOR EACH ROW EXECUTE FUNCTION billing.lc09_block_learner_write();
-- Serialize paid events with account deletion and queue one immutable message
-- per invoice, including retries of both checkout and invoice events.
CREATE FUNCTION billing.academic_queue_paid_mail() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.paid_invoice_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.paid_invoice_id IS DISTINCT FROM OLD.paid_invoice_id)
 AND NEW.status='active' AND NOT NEW.refunded AND billing.commerce_account_allowed(NEW.user_id) THEN
  INSERT INTO public.academic_mail_outbox(user_id,invoice_id,subscription_id,recipient,display_name,locale,kind)
  SELECT NEW.user_id,NEW.paid_invoice_id,NEW.subscription_id,u.email,left(u.raw_user_meta_data->>'full_name',80),u.raw_user_meta_data->>'preferred_locale',
   CASE WHEN TG_OP='INSERT' OR OLD.paid_invoice_id IS NULL THEN 'activated' ELSE 'renewed' END
  FROM auth.users u WHERE u.id=NEW.user_id AND u.email_confirmed_at IS NOT NULL
  ON CONFLICT(invoice_id) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.academic_queue_paid_mail() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER academic_paid_mail AFTER INSERT OR UPDATE ON billing.academic_stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION billing.academic_queue_paid_mail();
CREATE FUNCTION public.academic_mail_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.academic_mail_outbox%ROWTYPE; rows jsonb; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_action='claim' THEN
  WITH candidates AS (
   SELECT o.id FROM public.academic_mail_outbox o JOIN auth.users u ON u.id=o.user_id AND u.email=o.recipient AND u.email_confirmed_at IS NOT NULL
   JOIN billing.academic_stripe_subscriptions s ON s.subscription_id=o.subscription_id AND s.user_id=o.user_id AND s.paid_invoice_id=o.invoice_id AND s.status='active' AND NOT s.refunded AND s.ends_at>now()
   WHERE o.provider_email_id IS NULL AND NOT o.blocked AND coalesce(o.lease_until,'-infinity')<now()
    AND o.created_at>now()-interval '7 days' AND coalesce(o.first_attempt_at,now())>now()-interval '23 hours'
    AND NOT EXISTS(SELECT 1 FROM billing.commerce_mail_preferences p WHERE p.email=lower(o.recipient) AND p.suppressed)
    AND billing.commerce_account_allowed(o.user_id)
   ORDER BY o.created_at FOR UPDATE OF o SKIP LOCKED LIMIT 5
  ), updated AS (UPDATE public.academic_mail_outbox o SET lease_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
   FROM candidates c WHERE o.id=c.id RETURNING o.*)
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'claim_token',claim_token,'recipient',recipient,'name',display_name,'locale',locale,'kind',kind)),'[]') INTO rows FROM updated;
  RETURN rows;
 END IF;
 SELECT * INTO r FROM public.academic_mail_outbox WHERE id=(p_data->>'id')::uuid FOR UPDATE;
 IF NOT FOUND OR r.claim_token IS DISTINCT FROM (p_data->>'claim_token')::uuid OR r.lease_until<=now() OR r.provider_email_id IS NOT NULL OR r.blocked THEN RETURN 'false'; END IF;
 IF p_action='authorize' THEN
  IF NOT billing.commerce_account_allowed(r.user_id) OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=r.user_id AND email=r.recipient AND email_confirmed_at IS NOT NULL)
  OR EXISTS(SELECT 1 FROM billing.commerce_mail_preferences WHERE email=lower(r.recipient) AND suppressed)
  OR NOT EXISTS(SELECT 1 FROM billing.academic_stripe_subscriptions WHERE user_id=r.user_id AND subscription_id=r.subscription_id AND paid_invoice_id=r.invoice_id AND status='active' AND NOT refunded AND ends_at>now()) THEN RETURN 'false'; END IF;
  IF r.first_attempt_at IS NOT NULL AND r.first_attempt_at<=now()-interval '23 hours' THEN RETURN 'false'; END IF;
  UPDATE public.academic_mail_outbox SET first_attempt_at=coalesce(first_attempt_at,now()) WHERE id=r.id;
  RETURN 'true';
 ELSIF p_action='result' THEN
  UPDATE public.academic_mail_outbox SET provider_email_id=p_data->>'provider_id',blocked=coalesce((p_data->>'blocked')::boolean,false),lease_until=NULL,claim_token=NULL WHERE id=r.id;
  RETURN 'true';
 END IF;
 RAISE EXCEPTION 'ACADEMIC_INVALID_ACTION';
END $$;
REVOKE ALL ON FUNCTION public.academic_mail_command(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.academic_mail_command(text,jsonb) TO service_role;
CREATE FUNCTION public.get_academic_stripe_portal_context(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE r billing.academic_stripe_subscriptions%ROWTYPE; BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commerce_assert_identity(p_user_id);
 SELECT * INTO r FROM billing.academic_stripe_subscriptions WHERE user_id=p_user_id AND status IN ('active','trialing','past_due','unpaid','paused') ORDER BY last_event_at DESC LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACADEMIC_NO_SUBSCRIPTION'; END IF;
 RETURN jsonb_build_object('gateway_customer_id',r.customer_id,'gateway_subscription_id',r.subscription_id);
END $$;
REVOKE ALL ON FUNCTION public.get_academic_stripe_portal_context(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_academic_stripe_portal_context(uuid) TO service_role;
-- Existing worker reconciles ALL subscriptions for the mapped Stripe customer,
-- including academic subscriptions, before advancing the original deletion.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 d:=replace(d,'r:=billing.academic_previous_deletion',
 'IF p_next_stage IN (''provider_reconciled'',''learner_erased'') AND EXISTS(SELECT 1 FROM public.academic_mail_outbox WHERE user_id=p_user_id AND provider_email_id IS NULL AND NOT blocked AND lease_until>now()) THEN RAISE EXCEPTION ''LC09_ACADEMIC_MAIL_PENDING''; END IF; r:=billing.academic_previous_deletion');
 EXECUTE d;
END $$;

DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.commerce_previous_lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 IF position('''academic_progress''' IN d)=0 THEN RAISE EXCEPTION 'ACADEMIC_DELETION_CONTRACT_CHANGED'; END IF;
 EXECUTE replace(d,'''academic_progress''','''academic_progress'',''academic_mail_outbox''');
 d:=pg_get_functiondef('public.commerce_previous_lc09_complete_financial_purge(uuid,uuid,boolean)'::regprocedure);
 IF position('''technical_stripe_events''' IN d)=0 THEN RAISE EXCEPTION 'ACADEMIC_RETENTION_CONTRACT_CHANGED'; END IF;
 EXECUTE replace(d,'''technical_stripe_events''','''technical_stripe_events'',''academic_stripe_subscriptions'',''academic_stripe_events''');
 EXECUTE replace(pg_get_functiondef('public.lc09_complete_financial_purge(uuid,uuid,boolean)'::regprocedure),
 'FUNCTION public.lc09_complete_financial_purge(','FUNCTION billing.academic_previous_financial_purge(');
END $$;
REVOKE ALL ON FUNCTION billing.academic_previous_financial_purge(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.lc09_complete_financial_purge(p_user_id uuid,p_lease_token uuid,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE r jsonb; BEGIN
 r:=billing.academic_previous_financial_purge(p_user_id,p_lease_token,p_release);
 IF NOT p_release THEN
 DELETE FROM billing.academic_stripe_subscriptions WHERE user_id=p_user_id;
 DELETE FROM billing.academic_stripe_events WHERE user_id=p_user_id;
 END IF; RETURN r;
END $$;
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 EXECUTE replace(d,'DELETE FROM public.academic_progress WHERE user_id=p_user_id;',
 'DELETE FROM public.academic_progress WHERE user_id=p_user_id; DELETE FROM public.academic_mail_outbox WHERE user_id=p_user_id;');
END $$;
-- No public purchase, invitation or grant while the written release is disabled.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('billing.commerce_price(text,text,text,uuid)'::regprocedure);
 d:=replace(d,'v_currency:=','IF p_package=''academic'' AND NOT EXISTS(SELECT 1 FROM public.academic_courses WHERE enabled) THEN RAISE EXCEPTION ''ACADEMIC_UNAVAILABLE''; END IF; v_currency:=');
 EXECUTE d;
END $$;
-- Preserve every existing offer catalogue while Academic remains closed.
DO $$ DECLARE d text; marker text:='v_rows:=v_rows||jsonb_build_array(billing.commerce_price(r.p,r.m,r.b)'; BEGIN
 d:=pg_get_functiondef('public.commerce_command(text,jsonb)'::regprocedure);
 IF position(marker IN d)=0 THEN RAISE EXCEPTION 'ACADEMIC_OFFER_CATALOGUE_CHANGED'; END IF;
 EXECUTE replace(d,marker,'IF r.p=''academic'' AND NOT EXISTS(SELECT 1 FROM public.academic_courses WHERE enabled) THEN CONTINUE; END IF; '||marker);
END $$;
COMMIT;