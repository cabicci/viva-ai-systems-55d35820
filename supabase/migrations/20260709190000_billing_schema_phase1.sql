-- Stage 2A1: billing foundation schema (draft — not applied by this change)
CREATE SCHEMA IF NOT EXISTS billing;

-- ---------------------------------------------------------------------------
-- Catalog and policy
-- ---------------------------------------------------------------------------

CREATE TABLE billing.plan_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL,
  display_name jsonb NOT NULL,
  plan_family text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_catalog_plan_key_check CHECK (plan_key IN ('free', 'pro', 'pro_plus')),
  CONSTRAINT plan_catalog_plan_key_unique UNIQUE (plan_key)
);

CREATE TABLE billing.entitlement_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key text NOT NULL,
  version_number integer NOT NULL,
  status text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  lesson_allowlist_mode text NOT NULL,
  lesson_ids text[],
  lesson_count_cap integer,
  builder_access boolean NOT NULL,
  video_access boolean NOT NULL,
  rag_enabled boolean NOT NULL,
  assistant_runtime_per_lesson_quota integer,
  assistant_runtime_general_monthly_quota integer,
  assistant_runtime_period_quota integer,
  assistant_runtime_period_days integer,
  mission_evaluation_enabled boolean NOT NULL,
  reveal_answer_enabled boolean NOT NULL,
  wow_path_enabled boolean NOT NULL,
  policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT entitlement_policy_versions_status_check CHECK (status IN ('draft', 'published', 'deprecated')),
  CONSTRAINT entitlement_policy_versions_allowlist_mode_check CHECK (lesson_allowlist_mode IN ('explicit_list', 'curriculum_snapshot')),
  CONSTRAINT entitlement_policy_versions_quota_nonneg CHECK (
    COALESCE(assistant_runtime_per_lesson_quota, 0) >= 0
    AND COALESCE(assistant_runtime_general_monthly_quota, 0) >= 0
    AND COALESCE(assistant_runtime_period_quota, 0) >= 0
    AND COALESCE(assistant_runtime_period_days, 0) >= 0
  ),
  CONSTRAINT entitlement_policy_versions_key_version_unique UNIQUE (policy_key, version_number)
);

CREATE TABLE billing.refund_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key text NOT NULL,
  version_number integer NOT NULL,
  status text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  annual_to_monthly_conversion_enabled boolean NOT NULL,
  unused_monetary_credit_auto_refund_days integer NOT NULL DEFAULT 45,
  proration_method text NOT NULL,
  refund_to_original_method_only boolean NOT NULL DEFAULT true,
  rules_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT refund_policy_versions_status_check CHECK (status IN ('draft', 'published', 'deprecated')),
  CONSTRAINT refund_policy_versions_proration_check CHECK (proration_method IN ('daily', 'none')),
  CONSTRAINT refund_policy_versions_key_version_unique UNIQUE (policy_key, version_number)
);

CREATE TABLE billing.plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES billing.plan_catalog (id),
  entitlement_policy_version_id uuid NOT NULL REFERENCES billing.entitlement_policy_versions (id),
  refund_policy_version_id uuid REFERENCES billing.refund_policy_versions (id),
  version_number integer NOT NULL,
  billing_interval text NOT NULL,
  status text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  published_by uuid,
  CONSTRAINT plan_versions_interval_check CHECK (billing_interval IN ('month', 'year', 'none')),
  CONSTRAINT plan_versions_status_check CHECK (status IN ('draft', 'published', 'deprecated')),
  CONSTRAINT plan_versions_plan_version_unique UNIQUE (plan_id, version_number)
);

CREATE TABLE billing.market_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id uuid NOT NULL REFERENCES billing.plan_versions (id),
  market_code text NOT NULL,
  currency_code text NOT NULL,
  amount_minor bigint NOT NULL,
  tax_behavior text NOT NULL,
  status text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT market_prices_tax_behavior_check CHECK (tax_behavior IN ('exclusive', 'inclusive')),
  CONSTRAINT market_prices_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT market_prices_unique UNIQUE (plan_version_id, market_code, currency_code, effective_from)
);

CREATE TABLE billing.gateway_price_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_price_id uuid NOT NULL REFERENCES billing.market_prices (id),
  gateway_code text NOT NULL,
  gateway_price_id text NOT NULL,
  gateway_product_id text,
  capability_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gateway_price_mappings_gateway_check CHECK (gateway_code IN ('stripe_us', 'paymob_eg', 'future')),
  CONSTRAINT gateway_price_mappings_unique UNIQUE (market_price_id, gateway_code)
);

CREATE TABLE billing.tax_config_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_code text NOT NULL,
  version_number integer NOT NULL,
  status text NOT NULL,
  provider_code text NOT NULL,
  default_rate_bps integer NOT NULL,
  rules_json jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tax_config_versions_status_check CHECK (status IN ('draft', 'published', 'deprecated')),
  CONSTRAINT tax_config_versions_unique UNIQUE (market_code, version_number)
);

CREATE TABLE billing.ai_model_config_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key text NOT NULL,
  version_number integer NOT NULL,
  status text NOT NULL,
  provider_code text NOT NULL,
  input_cost_per_1k_micro bigint NOT NULL,
  output_cost_per_1k_micro bigint NOT NULL,
  usage_category text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_model_config_versions_status_check CHECK (status IN ('draft', 'published', 'deprecated')),
  CONSTRAINT ai_model_config_versions_category_check CHECK (
    usage_category IN ('assistant_runtime', 'mission_evaluation', 'reveal_answer', 'wow_path', 'embeddings')
  ),
  CONSTRAINT ai_model_config_versions_unique UNIQUE (model_key, version_number)
);

CREATE TABLE billing.ai_topup_package_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key text NOT NULL,
  version_number integer NOT NULL,
  status text NOT NULL,
  credit_units integer NOT NULL,
  expiry_days integer NOT NULL,
  market_prices jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_topup_package_versions_status_check CHECK (status IN ('draft', 'published', 'deprecated')),
  CONSTRAINT ai_topup_package_versions_units_check CHECK (credit_units > 0 AND expiry_days >= 0),
  CONSTRAINT ai_topup_package_versions_unique UNIQUE (package_key, version_number)
);

CREATE TABLE billing.coupon_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code text NOT NULL,
  campaign_key text NOT NULL,
  discount_type text NOT NULL,
  discount_value bigint NOT NULL,
  applicable_plan_keys text[] NOT NULL,
  max_redemptions integer,
  status text NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupon_definitions_discount_type_check CHECK (discount_type IN ('percent', 'fixed_minor')),
  CONSTRAINT coupon_definitions_status_check CHECK (status IN ('draft', 'active', 'expired', 'disabled')),
  CONSTRAINT coupon_definitions_code_unique UNIQUE (coupon_code)
);

CREATE TABLE billing.coupon_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_definition_id uuid NOT NULL REFERENCES billing.coupon_definitions (id),
  user_id uuid,
  verified_email_hash text,
  verified_phone_hash text,
  status text NOT NULL,
  assigned_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  expires_at timestamptz NOT NULL,
  reactivation_approved_at timestamptz,
  reactivation_approved_by uuid,
  redemption_transaction_id uuid,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupon_assignments_status_check CHECK (
    status IN ('assigned', 'redeemed', 'expired_unused', 'reactivated', 'revoked')
  ),
  CONSTRAINT coupon_assignments_identity_required CHECK (
    verified_email_hash IS NOT NULL OR verified_phone_hash IS NOT NULL
  ),
  CONSTRAINT coupon_assignments_idempotency_unique UNIQUE (idempotency_key)
);

CREATE UNIQUE INDEX coupon_assignments_email_identity_unique
  ON billing.coupon_assignments (verified_email_hash)
  WHERE verified_email_hash IS NOT NULL AND status NOT IN ('revoked');

CREATE UNIQUE INDEX coupon_assignments_phone_identity_unique
  ON billing.coupon_assignments (verified_phone_hash)
  WHERE verified_phone_hash IS NOT NULL AND status NOT IN ('revoked');

-- ---------------------------------------------------------------------------
-- Subscriptions and gateway (provider-neutral core)
-- ---------------------------------------------------------------------------

CREATE TABLE billing.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_version_id uuid REFERENCES billing.plan_versions (id),
  market_price_id uuid REFERENCES billing.market_prices (id),
  access_state text NOT NULL,
  billing_state text NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  paid_activation_at timestamptz,
  entitlement_active_at timestamptz,
  payment_succeeded_at timestamptz,
  scheduled_activation_at timestamptz,
  canceled_at timestamptz,
  expired_at timestamptz,
  suspended_at timestamptz,
  market_code text NOT NULL,
  currency_code text NOT NULL,
  billing_interval text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_access_state_check CHECK (
    access_state IN (
      'free_pending_verification', 'free_active', 'free_expired', 'paid_scheduled', 'paid_active',
      'past_due', 'canceled_at_period_end', 'expired', 'refund_pending', 'refunded', 'suspended'
    )
  ),
  CONSTRAINT subscriptions_billing_interval_check CHECK (billing_interval IN ('month', 'year', 'none'))
);

CREATE TABLE billing.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES billing.subscriptions (id),
  event_type text NOT NULL,
  from_access_state text,
  to_access_state text,
  from_billing_state text,
  to_billing_state text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_events_source_check CHECK (
    source IN ('gateway_webhook', 'admin', 'system', 'user')
  )
);

CREATE TABLE billing.gateway_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gateway_code text NOT NULL,
  gateway_customer_id text NOT NULL,
  status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gateway_customers_gateway_check CHECK (gateway_code IN ('stripe_us', 'paymob_eg', 'future')),
  CONSTRAINT gateway_customers_user_gateway_unique UNIQUE (user_id, gateway_code),
  CONSTRAINT gateway_customers_gateway_customer_unique UNIQUE (gateway_code, gateway_customer_id)
);

CREATE TABLE billing.gateway_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES billing.subscriptions (id),
  gateway_code text NOT NULL,
  gateway_subscription_id text NOT NULL,
  gateway_customer_id text NOT NULL,
  status text NOT NULL,
  raw_status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gateway_subscriptions_gateway_check CHECK (gateway_code IN ('stripe_us', 'paymob_eg', 'future')),
  CONSTRAINT gateway_subscriptions_sub_gateway_unique UNIQUE (subscription_id, gateway_code),
  CONSTRAINT gateway_subscriptions_gateway_sub_unique UNIQUE (gateway_code, gateway_subscription_id)
);

CREATE TABLE billing.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES billing.subscriptions (id),
  user_id uuid NOT NULL,
  gateway_code text NOT NULL,
  gateway_transaction_id text NOT NULL,
  transaction_type text NOT NULL,
  status text NOT NULL,
  amount_minor bigint NOT NULL,
  currency_code text NOT NULL,
  tax_amount_minor bigint NOT NULL DEFAULT 0,
  coupon_assignment_id uuid REFERENCES billing.coupon_assignments (id),
  original_payment_method_ref text,
  idempotency_key text NOT NULL UNIQUE,
  initiated_at timestamptz NOT NULL,
  succeeded_at timestamptz,
  failed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_transactions_type_check CHECK (
    transaction_type IN ('checkout', 'renewal', 'topup', 'credit_purchase')
  ),
  CONSTRAINT payment_transactions_gateway_tx_unique UNIQUE (gateway_code, gateway_transaction_id)
);

CREATE TABLE billing.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid NOT NULL REFERENCES billing.payment_transactions (id),
  refund_policy_version_id uuid REFERENCES billing.refund_policy_versions (id),
  refund_type text NOT NULL,
  status text NOT NULL,
  amount_minor bigint NOT NULL,
  currency_code text NOT NULL,
  reason_code text NOT NULL,
  gateway_code text NOT NULL,
  gateway_refund_id text,
  approved_by uuid,
  idempotency_key text NOT NULL UNIQUE,
  requested_at timestamptz NOT NULL,
  executed_at timestamptz,
  failed_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refunds_type_check CHECK (
    refund_type IN ('subscription', 'monetary_credit_auto', 'manual', 'annual_to_monthly')
  ),
  CONSTRAINT refunds_gateway_refund_unique UNIQUE (gateway_code, gateway_refund_id)
);

CREATE TABLE billing.tax_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid NOT NULL REFERENCES billing.payment_transactions (id),
  tax_config_version_id uuid REFERENCES billing.tax_config_versions (id),
  jurisdiction text NOT NULL,
  tax_amount_minor bigint NOT NULL,
  tax_rate_bps integer NOT NULL,
  provider_evidence_ref text,
  status text NOT NULL,
  calculated_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE billing.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_code text NOT NULL,
  gateway_event_id text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL,
  payload_encrypted bytea,
  payload_minimized jsonb,
  signature_valid boolean NOT NULL,
  received_at timestamptz NOT NULL,
  processed_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  error_code text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_status_check CHECK (
    status IN ('received', 'verified', 'processed', 'failed', 'dead_letter')
  ),
  CONSTRAINT webhook_events_gateway_event_unique UNIQUE (gateway_code, gateway_event_id)
);

CREATE TABLE billing.billing_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL,
  actor_id text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  correlation_id uuid,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_audit_log_actor_type_check CHECK (actor_type IN ('user', 'service', 'system'))
);

-- ---------------------------------------------------------------------------
-- Entitlement, usage, credits
-- ---------------------------------------------------------------------------

CREATE TABLE billing.user_entitlement_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES billing.subscriptions (id),
  entitlement_policy_version_id uuid REFERENCES billing.entitlement_policy_versions (id),
  plan_version_id uuid REFERENCES billing.plan_versions (id),
  snapshot_version integer NOT NULL,
  access_state text NOT NULL,
  entitlement_json jsonb NOT NULL,
  denial_reason_code text,
  generated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  invalidation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_entitlement_snapshots_user_version_unique UNIQUE (user_id, snapshot_version)
);

CREATE TABLE billing.entitlement_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES billing.subscriptions (id),
  usage_category text NOT NULL,
  period_key text NOT NULL,
  lesson_id text,
  used_count integer NOT NULL DEFAULT 0,
  reserved_count integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entitlement_usage_category_check CHECK (
    usage_category IN ('assistant_runtime_general', 'assistant_runtime_per_lesson')
  ),
  CONSTRAINT entitlement_usage_unique UNIQUE (user_id, usage_category, period_key, lesson_id)
);

CREATE TABLE billing.ai_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_category text NOT NULL,
  model_key text NOT NULL,
  lesson_id text,
  request_id uuid NOT NULL,
  reservation_id uuid,
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  provider_cost_micro bigint NOT NULL,
  billable boolean NOT NULL,
  status text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_usage_ledger_category_check CHECK (
    usage_category IN ('assistant_runtime', 'mission_evaluation', 'reveal_answer', 'wow_path', 'embeddings')
  ),
  CONSTRAINT ai_usage_ledger_status_check CHECK (
    status IN ('reserved', 'committed', 'released', 'failed')
  ),
  CONSTRAINT ai_usage_ledger_request_category_unique UNIQUE (request_id, usage_category)
);

CREATE TABLE billing.monetary_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_type text NOT NULL,
  amount_minor bigint NOT NULL,
  currency_code text NOT NULL,
  balance_after_minor bigint NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  expires_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monetary_credit_ledger_entry_type_check CHECK (
    entry_type IN ('grant', 'consume', 'refund', 'expire', 'adjustment')
  )
);

CREATE TABLE billing.monetary_credit_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_payment_transaction_id uuid NOT NULL REFERENCES billing.payment_transactions (id),
  allocated_minor bigint NOT NULL,
  remaining_minor bigint NOT NULL,
  currency_code text NOT NULL,
  status text NOT NULL,
  auto_refund_eligible_at timestamptz,
  refund_id uuid REFERENCES billing.refunds (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monetary_credit_allocations_status_check CHECK (
    status IN ('active', 'consumed', 'refund_pending', 'refunded', 'expired')
  )
);

CREATE TABLE billing.ai_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_type text NOT NULL,
  credit_units integer NOT NULL,
  balance_after integer NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  expires_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_credit_ledger_entry_type_check CHECK (
    entry_type IN ('grant', 'consume', 'expire', 'refund', 'adjustment')
  )
);

CREATE TABLE billing.ai_topup_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ai_topup_package_version_id uuid NOT NULL REFERENCES billing.ai_topup_package_versions (id),
  payment_transaction_id uuid NOT NULL REFERENCES billing.payment_transactions (id),
  credit_units_granted integer NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_topup_purchases_status_check CHECK (
    status IN ('pending', 'active', 'expired', 'refunded')
  )
);

-- ---------------------------------------------------------------------------
-- Async / reliability
-- ---------------------------------------------------------------------------

CREATE TABLE billing.outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz,
  CONSTRAINT outbox_events_status_check CHECK (
    status IN ('pending', 'processing', 'published', 'failed')
  )
);

CREATE TABLE billing.job_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL,
  input jsonb NOT NULL,
  output jsonb,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_executions_status_check CHECK (
    status IN ('running', 'succeeded', 'failed', 'dead_letter')
  ),
  CONSTRAINT job_executions_type_key_unique UNIQUE (job_type, idempotency_key)
);

CREATE TABLE billing.reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL,
  gateway_code text,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  records_scanned integer,
  findings_count integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE billing.reconciliation_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_run_id uuid NOT NULL REFERENCES billing.reconciliation_runs (id),
  finding_type text NOT NULL,
  severity text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  expected_state jsonb,
  actual_state jsonb,
  status text NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reconciliation_findings_status_check CHECK (status IN ('open', 'resolved', 'ignored'))
);

CREATE TABLE billing.dead_letter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  error_code text NOT NULL,
  failed_at timestamptz NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dead_letter_events_source_check CHECK (source_type IN ('outbox', 'webhook', 'job')),
  CONSTRAINT dead_letter_events_status_check CHECK (status IN ('open', 'replayed', 'discarded'))
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_subscriptions_access_state ON billing.subscriptions (access_state);
CREATE INDEX idx_subscriptions_entitlement_active_at ON billing.subscriptions (entitlement_active_at);
CREATE INDEX idx_subscription_events_subscription_id ON billing.subscription_events (subscription_id);
CREATE INDEX idx_payment_transactions_user_id ON billing.payment_transactions (user_id);
CREATE INDEX idx_refunds_status ON billing.refunds (status);
CREATE INDEX idx_user_entitlement_snapshots_user_id ON billing.user_entitlement_snapshots (user_id);
CREATE INDEX idx_entitlement_usage_user_period ON billing.entitlement_usage (user_id, period_key);
CREATE INDEX idx_outbox_events_pending ON billing.outbox_events (status, next_attempt_at);
CREATE INDEX idx_webhook_events_status ON billing.webhook_events (status);
CREATE INDEX idx_monetary_credit_allocations_auto_refund ON billing.monetary_credit_allocations (status, auto_refund_eligible_at);
