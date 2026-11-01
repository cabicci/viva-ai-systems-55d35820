-- Durable Live risk holds reuse the existing LC09-classified financial event ledger.
-- No Test records, settings, or catalogue objects are modified.
ALTER TABLE billing.webhook_events ADD COLUMN live_risk_hold boolean NOT NULL DEFAULT false;
ALTER TABLE billing.webhook_events ADD COLUMN risk_subscription_id text;
ALTER TABLE billing.webhook_events ADD COLUMN risk_customer_id text;
ALTER TABLE billing.webhook_events ADD COLUMN risk_scope text;
ALTER TABLE billing.webhook_events ADD COLUMN risk_internal_subscription_id uuid;
ALTER TABLE billing.webhook_events ADD CONSTRAINT live_risk_hold_evidence_check CHECK (NOT live_risk_hold OR (gateway_code='stripe_us_live' AND stripe_environment='live' AND signature_valid AND retention_user_id IS NOT NULL AND risk_subscription_id IS NOT NULL AND risk_customer_id IS NOT NULL AND risk_scope IN ('core','kids','academic','technical')));
CREATE INDEX stripe_live_risk_lookup ON billing.webhook_events(risk_subscription_id,retention_user_id) WHERE live_risk_hold;
CREATE INDEX stripe_live_risk_internal_lookup ON billing.webhook_events(risk_internal_subscription_id) WHERE live_risk_hold;

CREATE FUNCTION billing.stripe_live_hold_exists(p_subscription_id text,p_user_id uuid) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM billing.webhook_events WHERE live_risk_hold AND risk_subscription_id=p_subscription_id AND retention_user_id=p_user_id AND gateway_code='stripe_us_live' AND stripe_environment='live');
$$;
REVOKE ALL ON FUNCTION billing.stripe_live_hold_exists(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION billing.stripe_live_hold_exists(text,uuid) TO service_role;

CREATE FUNCTION public.get_stripe_live_risk_hold(p_subscription_id text,p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT billing.is_service_role_caller() OR billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'LIVE_RISK_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_subscription_id IS NULL OR p_subscription_id !~ '^sub_[A-Za-z0-9_]+$' OR p_user_id IS NULL THEN RAISE EXCEPTION 'LIVE_RISK_INVALID_INPUT'; END IF;
 RETURN billing.stripe_live_hold_exists(p_subscription_id,p_user_id);
END $$;
REVOKE ALL ON FUNCTION public.get_stripe_live_risk_hold(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_live_risk_hold(text,uuid) TO service_role;

CREATE FUNCTION public.apply_stripe_live_risk_hold(p_event_id text,p_user_id uuid,p_subscription_id text,p_customer_id text,p_scope text,p_price_id text,p_invoice_id text,p_charge_id text,p_reason text,p_occurred_at timestamptz) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE owner_id uuid; internal_id uuid; receipt billing.webhook_events%ROWTYPE; inserted_id uuid;
BEGIN
 IF NOT billing.is_service_role_caller() OR billing.current_stripe_environment()<>'live' THEN RAISE EXCEPTION 'LIVE_RISK_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9_]+$' OR p_user_id IS NULL OR p_subscription_id IS NULL OR p_subscription_id !~ '^sub_[A-Za-z0-9_]+$'
 OR p_customer_id IS NULL OR p_customer_id !~ '^cus_[A-Za-z0-9_]+$' OR p_price_id IS NULL OR p_price_id !~ '^price_[A-Za-z0-9_]+$'
 OR p_invoice_id IS NULL OR p_invoice_id !~ '^in_[A-Za-z0-9_]+$' OR p_charge_id IS NULL OR p_charge_id !~ '^ch_[A-Za-z0-9_]+$'
 OR p_scope IS NULL OR p_scope NOT IN ('core','kids','academic','technical') OR p_reason IS NULL OR p_reason NOT IN ('charge.dispute.created','charge.refunded','radar.early_fraud_warning.created','refund.succeeded')
 OR p_occurred_at IS NULL OR p_occurred_at>now()+interval '5 minutes' THEN RAISE EXCEPTION 'LIVE_RISK_INVALID_INPUT'; END IF;
 -- Same lifecycle lock order as other account operations, before billing rows.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,751603));
 PERFORM pg_advisory_xact_lock(hashtextextended('account-lifecycle:'||p_user_id::text,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('live-risk-user:'||p_user_id::text,0));
 IF billing.lc09_financial_expired(p_user_id) THEN RAISE EXCEPTION 'LIVE_RISK_FINANCIAL_ERASED'; END IF;
 SELECT * INTO receipt FROM billing.webhook_events WHERE gateway_code='stripe_us_live' AND gateway_event_id=p_event_id FOR UPDATE;
 IF FOUND THEN
  IF NOT receipt.live_risk_hold OR receipt.retention_user_id IS DISTINCT FROM p_user_id OR receipt.risk_subscription_id IS DISTINCT FROM p_subscription_id
   OR receipt.risk_customer_id IS DISTINCT FROM p_customer_id OR receipt.risk_scope IS DISTINCT FROM p_scope OR receipt.event_type IS DISTINCT FROM p_reason
   OR receipt.payload_minimized->>'invoice_id' IS DISTINCT FROM p_invoice_id OR receipt.payload_minimized->>'charge_id' IS DISTINCT FROM p_charge_id
   OR receipt.payload_minimized->>'price_id' IS DISTINCT FROM p_price_id OR receipt.payload_minimized->>'occurred_at' IS DISTINCT FROM p_occurred_at::text
   THEN RAISE EXCEPTION 'LIVE_RISK_EVENT_COLLISION'; END IF;
  RETURN jsonb_build_object('processed',true,'held',true,'duplicate',true);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM billing.gateway_customers WHERE user_id=p_user_id AND gateway_code='stripe_us_live' AND stripe_environment='live' AND gateway_customer_id=p_customer_id) THEN RAISE EXCEPTION 'LIVE_RISK_CUSTOMER_MISMATCH'; END IF;
 IF p_scope='core' THEN
  SELECT s.user_id,s.id INTO owner_id,internal_id FROM billing.subscriptions s JOIN billing.gateway_subscriptions g ON g.subscription_id=s.id
   WHERE g.gateway_code='stripe_us_live' AND g.stripe_environment='live' AND g.gateway_subscription_id=p_subscription_id AND g.gateway_customer_id=p_customer_id FOR UPDATE OF s;
  IF NOT EXISTS(SELECT 1 FROM billing.gateway_price_mappings m JOIN billing.subscriptions s ON s.market_price_id=m.market_price_id
   WHERE s.id=internal_id AND m.gateway_code='stripe_us_live' AND m.stripe_environment='live' AND m.gateway_price_id=p_price_id)
   THEN RAISE EXCEPTION 'LIVE_RISK_PRICE_MISMATCH'; END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.payment_transactions WHERE subscription_id=internal_id AND user_id=p_user_id AND gateway_code='stripe_us_live' AND stripe_environment='live' AND gateway_transaction_id=p_invoice_id AND status='succeeded') THEN RAISE EXCEPTION 'LIVE_RISK_PAYMENT_NOT_READY'; END IF;
 ELSIF p_scope='kids' THEN
  SELECT parent_id INTO owner_id FROM public.kids_stripe_subscriptions WHERE stripe_environment='live' AND gateway_subscription_id=p_subscription_id AND gateway_customer_id=p_customer_id AND gateway_price_id=p_price_id FOR UPDATE;
 ELSIF p_scope='academic' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('academic-stripe:'||p_subscription_id,0));
  SELECT user_id INTO owner_id FROM billing.academic_stripe_subscriptions WHERE stripe_environment='live' AND subscription_id=p_subscription_id AND customer_id=p_customer_id AND price_id=p_price_id FOR UPDATE;
 ELSIF p_scope='technical' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('technical-stripe:'||p_subscription_id,0));
  SELECT user_id INTO owner_id FROM billing.technical_stripe_subscriptions WHERE stripe_environment='live' AND subscription_id=p_subscription_id AND customer_id=p_customer_id AND price_id=p_price_id FOR UPDATE;
 END IF;
 IF owner_id IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION 'LIVE_RISK_OWNER_MISMATCH'; END IF;
 INSERT INTO billing.webhook_events(gateway_code,gateway_event_id,event_type,status,signature_valid,received_at,processed_at,idempotency_key,stripe_environment,retention_user_id,live_risk_hold,risk_subscription_id,risk_customer_id,risk_scope,risk_internal_subscription_id,payload_minimized)
 VALUES('stripe_us_live',p_event_id,p_reason,'processed',true,now(),now(),'stripe:live-risk:'||p_event_id,'live',p_user_id,true,p_subscription_id,p_customer_id,p_scope,internal_id,
 jsonb_build_object('invoice_id',p_invoice_id,'charge_id',p_charge_id,'price_id',p_price_id,'occurred_at',p_occurred_at::text,'livemode',true)) RETURNING id INTO inserted_id;
 IF p_scope='core' THEN
  UPDATE billing.subscriptions SET access_state='suspended',suspended_at=coalesce(suspended_at,now()),updated_at=now() WHERE id=internal_id;
 ELSIF p_scope='kids' THEN
  UPDATE public.kids_stripe_subscriptions SET status='unpaid',updated_at=now() WHERE stripe_environment='live' AND gateway_subscription_id=p_subscription_id;
  DELETE FROM public.kids_family_entitlements WHERE parent_id=p_user_id AND entitlement_reference='stripe-live:'||p_subscription_id;
 ELSIF p_scope='academic' THEN
  UPDATE billing.academic_stripe_subscriptions SET status='paused' WHERE stripe_environment='live' AND subscription_id=p_subscription_id;
 ELSE
  UPDATE billing.technical_stripe_subscriptions SET status='paused' WHERE stripe_environment='live' AND subscription_id=p_subscription_id;
 END IF;
 RETURN jsonb_build_object('processed',true,'held',true,'duplicate',false);
END $$;
REVOKE ALL ON FUNCTION public.apply_stripe_live_risk_hold(text,uuid,text,text,text,text,text,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_live_risk_hold(text,uuid,text,text,text,text,text,text,text,timestamptz) TO service_role;

-- Serializes relevant Live RPCs before any original writer's row/advisory locks.
-- Preserve every installed wrapper and its LC09 handling, adding only a Live lock.
DO $$ DECLARE r record; d text; needle text; replacement text; BEGIN
 FOR r IN SELECT n.nspname,p.proname,p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE (n.nspname='public' AND (p.proname IN ('apply_stripe_webhook_event','lc09_retained_apply_stripe_webhook_event','lc09_previous_apply_stripe_webhook_event','apply_kids_stripe_event','lc09_retained_apply_kids_stripe_event','lc09_previous_apply_kids_stripe_event','apply_academic_stripe_event','apply_technical_stripe_event','apply_kids_stripe_refund','lc09_retained_apply_kids_stripe_refund','lc09_previous_apply_kids_stripe_refund','apply_academic_stripe_refund','apply_technical_stripe_refund','register_kids_stripe_customer','lc09_previous_register_kids_stripe_customer','prepare_stripe_checkout','lc09_previous_prepare_stripe_checkout','apply_stripe_refund_event')))
 LOOP
  d:=pg_get_functiondef(r.oid);
  needle:=CASE WHEN d LIKE '%p_parent_id uuid%' THEN 'p_parent_id' ELSE 'p_user_id' END;
  IF d NOT LIKE '%'||needle||' uuid%' THEN CONTINUE; END IF;
  replacement:=E'BEGIN\n IF billing.current_stripe_environment()=''live'' THEN\n PERFORM pg_advisory_xact_lock(hashtextextended('||needle||E'::text,751603));\n PERFORM pg_advisory_xact_lock(hashtextextended(''account-lifecycle:''||'||needle||E'::text,0));\n PERFORM pg_advisory_xact_lock(hashtextextended(''live-risk-user:''||'||needle||E'::text,0));\n END IF;\n';
  IF d !~* '\mBEGIN\M' THEN RAISE EXCEPTION 'LIVE_RISK_WRAPPER_PATTERN_MISSING %',r.proname; END IF;
  d:=regexp_replace(d,'\mBEGIN\M',replacement,'i');
  EXECUTE d;
 END LOOP;
END $$;

-- Defense in depth for direct/future writers. Held rows cannot become active,
-- extend a paid period or change ownership/binding to evade the hold.
CREATE FUNCTION billing.guard_live_risk_write() RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE o jsonb; v jsonb:=to_jsonb(NEW); u uuid; sub text; held boolean:=false;
BEGIN
 IF TG_OP='UPDATE' THEN o:=to_jsonb(OLD); END IF;
 IF TG_TABLE_NAME='subscriptions' THEN
  held:=EXISTS(SELECT 1 FROM billing.webhook_events WHERE live_risk_hold AND risk_internal_subscription_id=NEW.id);
  IF held AND (NEW.access_state<>'suspended' OR (TG_OP='UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end OR NEW.plan_version_id IS DISTINCT FROM OLD.plan_version_id OR NEW.market_price_id IS DISTINCT FROM OLD.market_price_id))) THEN RAISE EXCEPTION 'LIVE_RISK_HOLD_ACTIVE'; END IF;
 ELSIF TG_TABLE_NAME='kids_family_entitlements' THEN
  IF NEW.entitlement_reference LIKE 'stripe-live:%' AND billing.stripe_live_hold_exists(substr(NEW.entitlement_reference,13),NEW.parent_id) THEN RAISE EXCEPTION 'LIVE_RISK_HOLD_ACTIVE'; END IF;
 ELSIF TG_TABLE_NAME='gateway_subscriptions' THEN
  IF EXISTS(SELECT 1 FROM billing.webhook_events WHERE live_risk_hold AND risk_internal_subscription_id=NEW.subscription_id) AND TG_OP='UPDATE'
   AND (NEW.gateway_subscription_id IS DISTINCT FROM OLD.gateway_subscription_id OR NEW.gateway_customer_id IS DISTINCT FROM OLD.gateway_customer_id OR NEW.subscription_id IS DISTINCT FROM OLD.subscription_id) THEN RAISE EXCEPTION 'LIVE_RISK_BINDING_IMMUTABLE'; END IF;
 ELSIF v->>'stripe_environment'='live' THEN
  sub:=coalesce(v->>'gateway_subscription_id',v->>'subscription_id'); u:=coalesce(v->>'parent_id',v->>'user_id')::uuid;
  held:=billing.stripe_live_hold_exists(sub,u) OR (TG_OP='UPDATE' AND billing.stripe_live_hold_exists(coalesce(o->>'gateway_subscription_id',o->>'subscription_id'),coalesce(o->>'parent_id',o->>'user_id')::uuid));
  IF held AND ((v->>'status') NOT IN ('paused','unpaid','canceled','refunded') OR (TG_OP='UPDATE' AND (v->>'paid_through' IS DISTINCT FROM o->>'paid_through' OR v->>'ends_at' IS DISTINCT FROM o->>'ends_at' OR v->>'parent_id' IS DISTINCT FROM o->>'parent_id' OR v->>'user_id' IS DISTINCT FROM o->>'user_id' OR v->>'gateway_subscription_id' IS DISTINCT FROM o->>'gateway_subscription_id' OR v->>'subscription_id' IS DISTINCT FROM o->>'subscription_id' OR v->>'customer_id' IS DISTINCT FROM o->>'customer_id' OR v->>'gateway_customer_id' IS DISTINCT FROM o->>'gateway_customer_id'))) THEN RAISE EXCEPTION 'LIVE_RISK_HOLD_ACTIVE'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.guard_live_risk_write() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_live_risk_guard BEFORE INSERT OR UPDATE ON billing.subscriptions FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_write();
CREATE TRIGGER zz_live_risk_guard BEFORE INSERT OR UPDATE ON billing.gateway_subscriptions FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_write();
CREATE TRIGGER zz_live_risk_guard BEFORE INSERT OR UPDATE ON public.kids_stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_write();
CREATE TRIGGER zz_live_risk_guard BEFORE INSERT OR UPDATE ON public.kids_family_entitlements FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_write();
CREATE TRIGGER zz_live_risk_guard BEFORE INSERT OR UPDATE ON billing.academic_stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_write();
CREATE TRIGGER zz_live_risk_guard BEFORE INSERT OR UPDATE ON billing.technical_stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_write();

-- Holds also deny scoped access readers during any unexpected writer race.
DO $$ DECLARE d text; BEGIN
 SELECT pg_get_functiondef('billing.commerce_account_allowed(uuid)'::regprocedure) INTO d;
 IF d NOT LIKE '%billing.account_deletion_blocked(p_user)%' THEN RAISE EXCEPTION 'LIVE_RISK_ACCESS_PATTERN_MISSING'; END IF;
 d:=replace(d,'billing.account_deletion_blocked(p_user)','(billing.account_deletion_blocked(p_user) OR EXISTS(SELECT 1 FROM billing.webhook_events WHERE live_risk_hold AND retention_user_id=p_user))');
 EXECUTE d;
END $$;
