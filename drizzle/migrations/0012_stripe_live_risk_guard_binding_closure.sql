-- Close direct binding changes; preserve revoke-only cancellation/refund writes.
CREATE OR REPLACE FUNCTION billing.guard_live_risk_write() RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE o jsonb; v jsonb:=to_jsonb(NEW); u uuid; sub text; held boolean:=false;
BEGIN
 IF TG_OP='UPDATE' THEN o:=to_jsonb(OLD); END IF;
 IF TG_TABLE_NAME='subscriptions' THEN
  held:=EXISTS(SELECT 1 FROM billing.webhook_events WHERE live_risk_hold AND risk_internal_subscription_id=NEW.id);
  IF held AND (NEW.access_state IN ('paid_active','paid_scheduled','past_due','canceled_at_period_end') OR (TG_OP='UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.current_period_end>OLD.current_period_end OR NEW.plan_version_id IS DISTINCT FROM OLD.plan_version_id OR NEW.market_price_id IS DISTINCT FROM OLD.market_price_id))) THEN RAISE EXCEPTION 'LIVE_RISK_HOLD_ACTIVE'; END IF;
 ELSIF TG_TABLE_NAME='kids_family_entitlements' THEN
  IF NEW.entitlement_reference LIKE 'stripe-live:%' THEN
   PERFORM pg_advisory_xact_lock(hashtextextended('live-risk-user:'||NEW.parent_id::text,0));
   IF billing.stripe_live_hold_exists(substr(NEW.entitlement_reference,13),NEW.parent_id) THEN RAISE EXCEPTION 'LIVE_RISK_HOLD_ACTIVE'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='gateway_customers' THEN
  IF TG_OP='UPDATE' AND OLD.stripe_environment='live' AND EXISTS(SELECT 1 FROM billing.webhook_events WHERE live_risk_hold AND retention_user_id=OLD.user_id AND risk_customer_id=OLD.gateway_customer_id)
   AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.gateway_customer_id IS DISTINCT FROM OLD.gateway_customer_id OR NEW.gateway_code IS DISTINCT FROM OLD.gateway_code) THEN RAISE EXCEPTION 'LIVE_RISK_BINDING_IMMUTABLE'; END IF;
 ELSIF TG_TABLE_NAME='gateway_subscriptions' THEN
  IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM billing.webhook_events WHERE live_risk_hold AND (risk_internal_subscription_id=OLD.subscription_id OR risk_subscription_id=OLD.gateway_subscription_id))
   AND (NEW.gateway_subscription_id IS DISTINCT FROM OLD.gateway_subscription_id OR NEW.gateway_customer_id IS DISTINCT FROM OLD.gateway_customer_id OR NEW.subscription_id IS DISTINCT FROM OLD.subscription_id OR NEW.gateway_code IS DISTINCT FROM OLD.gateway_code) THEN RAISE EXCEPTION 'LIVE_RISK_BINDING_IMMUTABLE'; END IF;
 ELSIF v->>'stripe_environment'='live' THEN
  sub:=coalesce(v->>'gateway_subscription_id',v->>'subscription_id'); u:=coalesce(v->>'parent_id',v->>'user_id')::uuid;
  held:=billing.stripe_live_hold_exists(sub,u) OR (TG_OP='UPDATE' AND billing.stripe_live_hold_exists(coalesce(o->>'gateway_subscription_id',o->>'subscription_id'),coalesce(o->>'parent_id',o->>'user_id')::uuid));
  IF held AND ((v->>'status') NOT IN ('paused','unpaid','canceled','refunded') OR (TG_OP='UPDATE' AND ((v->>'paid_through')::timestamptz>(o->>'paid_through')::timestamptz OR (v->>'ends_at')::timestamptz>(o->>'ends_at')::timestamptz OR v->>'parent_id' IS DISTINCT FROM o->>'parent_id' OR v->>'user_id' IS DISTINCT FROM o->>'user_id' OR v->>'gateway_subscription_id' IS DISTINCT FROM o->>'gateway_subscription_id' OR v->>'subscription_id' IS DISTINCT FROM o->>'subscription_id' OR v->>'customer_id' IS DISTINCT FROM o->>'customer_id' OR v->>'gateway_customer_id' IS DISTINCT FROM o->>'gateway_customer_id'))) THEN RAISE EXCEPTION 'LIVE_RISK_HOLD_ACTIVE'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zz_live_risk_guard BEFORE UPDATE ON billing.gateway_customers FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_write();
CREATE FUNCTION billing.guard_live_risk_evidence() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.live_risk_hold AND (NOT NEW.live_risk_hold OR NEW.gateway_code IS DISTINCT FROM OLD.gateway_code OR NEW.stripe_environment IS DISTINCT FROM OLD.stripe_environment OR NEW.risk_subscription_id IS DISTINCT FROM OLD.risk_subscription_id OR NEW.risk_customer_id IS DISTINCT FROM OLD.risk_customer_id OR NEW.risk_scope IS DISTINCT FROM OLD.risk_scope OR NEW.risk_internal_subscription_id IS DISTINCT FROM OLD.risk_internal_subscription_id OR NEW.retention_user_id IS DISTINCT FROM OLD.retention_user_id) THEN RAISE EXCEPTION 'LIVE_RISK_EVIDENCE_IMMUTABLE'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.guard_live_risk_evidence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_live_risk_evidence_guard BEFORE UPDATE ON billing.webhook_events FOR EACH ROW EXECUTE FUNCTION billing.guard_live_risk_evidence();