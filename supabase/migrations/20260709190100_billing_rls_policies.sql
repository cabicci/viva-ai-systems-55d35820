-- Stage 2A1: billing RLS policies (draft — fail closed)
ALTER TABLE billing.plan_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.entitlement_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.refund_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.gateway_price_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.tax_config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.ai_model_config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.ai_topup_package_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.coupon_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.coupon_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.gateway_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.gateway_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.billing_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.user_entitlement_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.entitlement_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.ai_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.monetary_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.monetary_credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.ai_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.ai_topup_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.reconciliation_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.dead_letter_events ENABLE ROW LEVEL SECURITY;

-- Revoke broad client access; service role retains full access via bypassrls.
REVOKE ALL ON ALL TABLES IN SCHEMA billing FROM anon, authenticated;
GRANT USAGE ON SCHEMA billing TO authenticated, service_role;

-- Published catalog reads (sanitized tables only).
GRANT SELECT ON billing.plan_catalog, billing.market_prices, billing.ai_topup_package_versions TO authenticated;

CREATE POLICY billing_plan_catalog_published_read ON billing.plan_catalog
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY billing_market_prices_read ON billing.market_prices
  FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY billing_ai_topup_packages_read ON billing.ai_topup_package_versions
  FOR SELECT TO authenticated
  USING (status = 'published');

-- Safe user-owned reads.
CREATE POLICY billing_subscriptions_own_read ON billing.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_entitlement_snapshots_own_read ON billing.user_entitlement_snapshots
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_entitlement_usage_own_read ON billing.entitlement_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_ai_usage_own_summary_read ON billing.ai_usage_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_monetary_credit_own_read ON billing.monetary_credit_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_monetary_allocations_own_read ON billing.monetary_credit_allocations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_ai_credit_own_read ON billing.ai_credit_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_ai_topup_purchases_own_read ON billing.ai_topup_purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_payment_transactions_own_read ON billing.payment_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY billing_refunds_own_status_read ON billing.refunds
  FOR SELECT TO authenticated
  USING (
    auth.uid() = (
      SELECT pt.user_id FROM billing.payment_transactions pt
      WHERE pt.id = payment_transaction_id
    )
  );

-- Admin read-only visibility (no client writes).
CREATE POLICY billing_admin_read_subscriptions ON billing.subscriptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY billing_admin_read_audit ON billing.billing_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Explicit deny: no INSERT/UPDATE/DELETE policies for authenticated on sensitive tables.
-- anon has no policies and no grants => fail closed.
