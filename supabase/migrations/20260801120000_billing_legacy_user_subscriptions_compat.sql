-- Legacy subscription compatibility: one-way fail-closed backfill into Billing V3.
-- Authorization: CR-BILLING-RAG-PR15-FAIL-CLOSED-CORRECTION-20260801-02
--
-- AUTHORITATIVE AFTER THIS MIGRATION:
--   billing.subscriptions is authoritative for Billing, entitlement, quota,
--   and paid-access decisions (including assistant-runtime reservation).
--
-- LEGACY SURFACE:
--   public.user_subscriptions is preserved (not dropped, renamed, or rewritten).
--   It is retained only as a frozen legacy compatibility archive. It is not an
--   independent paid-entitlement source of truth after cutover.
--
-- PAID_ACTIVE CONTRACT (strict — fail closed otherwise):
--   tier = 'pro'
--   AND status = 'active'
--   AND exactly one supported provider: Stripe XOR PayPal
--   AND provider_subscription_id present
--   AND current_period_end present AND current_period_end > now()
--   AND no conflicting billing.subscriptions row
--   AND no duplicate provider subscription reference
--
-- Explicitly NEVER map to paid_active:
--   pro + NULL status, pro + trialing, missing/dual provider refs,
--   missing/expired period, unknown tier/status, ambiguous paid states.
-- Do not silently downgrade ambiguous paid rows to free — reject and leave
-- the legacy row unchanged for manual disposition.
--
-- Free rows map only to non-paid free_active (never paid entitlement / AI quota).

CREATE TABLE IF NOT EXISTS billing.legacy_subscription_import_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_user_id uuid NOT NULL UNIQUE,
  legacy_tier text,
  legacy_status text,
  legacy_provider text,
  legacy_provider_subscription_id text,
  legacy_current_period_end timestamptz,
  mapped_access_state text NOT NULL,
  mapped_billing_state text NOT NULL,
  billing_subscription_id uuid REFERENCES billing.subscriptions (id),
  imported_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE billing.legacy_subscription_import_audit FROM PUBLIC;
REVOKE ALL ON TABLE billing.legacy_subscription_import_audit FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE billing.legacy_subscription_import_audit TO service_role;

-- Normalize provider to exactly one of: stripe | paypal | NULL (unmappable).
CREATE OR REPLACE FUNCTION billing.normalize_legacy_provider(p_provider text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v text := lower(nullif(btrim(COALESCE(p_provider, '')), ''));
BEGIN
  IF v IS NULL THEN
    RETURN NULL;
  END IF;

  -- Dual / composite references are never accepted.
  IF (v LIKE '%stripe%' AND v LIKE '%paypal%')
     OR v IN ('stripe,paypal', 'paypal,stripe', 'stripe+paypal', 'paypal+stripe',
              'stripe/paypal', 'paypal/stripe', 'both') THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: both Stripe and PayPal subscription references'
      USING ERRCODE = '22023';
  END IF;

  IF v IN ('stripe', 'stripe_us', 'stripe.com') THEN
    RETURN 'stripe';
  END IF;

  IF v IN ('paypal', 'paypal_us', 'paypal.com') THEN
    RETURN 'paypal';
  END IF;

  RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: unsupported provider %', p_provider
    USING ERRCODE = '22023';
END;
$$;

REVOKE ALL ON FUNCTION billing.normalize_legacy_provider(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.normalize_legacy_provider(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION billing.normalize_legacy_provider(text) TO service_role;

CREATE OR REPLACE FUNCTION billing.map_legacy_user_subscription_row(
  p_user_id uuid,
  p_tier text,
  p_status text,
  p_current_period_end timestamptz,
  p_provider text DEFAULT NULL,
  p_provider_subscription_id text DEFAULT NULL
)
RETURNS TABLE (
  access_state text,
  billing_state text,
  billing_interval text,
  plan_key text,
  provider_code text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_status text := lower(nullif(btrim(COALESCE(p_status, '')), ''));
  v_tier text := lower(nullif(btrim(COALESCE(p_tier, '')), ''));
  v_provider text;
  v_prov_sub text := nullif(btrim(COALESCE(p_provider_subscription_id, '')), '');
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: missing user identity'
      USING ERRCODE = '22023';
  END IF;

  IF v_tier IS NULL OR v_tier NOT IN ('free', 'pro') THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: unknown plan/tier %', p_tier
      USING ERRCODE = '22023';
  END IF;

  IF v_tier = 'free' THEN
    -- Free never becomes paid, regardless of legacy status / provider text.
    access_state := 'free_active';
    billing_state := 'none';
    billing_interval := 'none';
    plan_key := 'free';
    provider_code := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  -- tier = pro: only the strict paid_active contract is accepted.
  -- Ambiguous paid states (NULL status, trialing, etc.) fail closed — never
  -- silently downgrade to free.
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: pro with NULL status is not proven paid'
      USING ERRCODE = '22023';
  END IF;

  IF v_status = 'trialing' THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: pro trialing is not paid (V3 abolished automatic trial)'
      USING ERRCODE = '22023';
  END IF;

  IF v_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: unknown or unsupported status %', p_status
      USING ERRCODE = '22023';
  END IF;

  IF p_current_period_end IS NULL THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: active pro requires current_period_end'
      USING ERRCODE = '22023';
  END IF;

  IF p_current_period_end <= now() THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: active pro current_period_end is not in the future'
      USING ERRCODE = '22023';
  END IF;

  IF v_prov_sub IS NULL THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: active pro requires a provider subscription reference'
      USING ERRCODE = '22023';
  END IF;

  v_provider := billing.normalize_legacy_provider(p_provider);
  IF v_provider IS NULL THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: active pro requires Stripe XOR PayPal provider'
      USING ERRCODE = '22023';
  END IF;

  access_state := 'paid_active';
  billing_state := 'active';
  billing_interval := 'month';
  plan_key := 'pro';
  provider_code := v_provider;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION billing.map_legacy_user_subscription_row(uuid, text, text, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.map_legacy_user_subscription_row(uuid, text, text, timestamptz, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION billing.map_legacy_user_subscription_row(uuid, text, text, timestamptz, text, text) TO service_role;

-- Drop prior 4-arg overload from the first PR15 revision if present.
DROP FUNCTION IF EXISTS billing.map_legacy_user_subscription_row(uuid, text, text, timestamptz);

CREATE OR REPLACE FUNCTION billing.import_legacy_user_subscriptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  r record;
  v_map record;
  v_plan_version_id uuid;
  v_sub_id uuid;
  v_imported int := 0;
  v_skipped_idempotent int := 0;
  v_dup text;
  v_existing billing.subscriptions%ROWTYPE;
  v_prior billing.legacy_subscription_import_audit%ROWTYPE;
BEGIN
  -- Duplicate provider subscription references across distinct users → fail closed.
  SELECT us.provider_subscription_id INTO v_dup
  FROM public.user_subscriptions us
  WHERE us.provider_subscription_id IS NOT NULL
    AND btrim(us.provider_subscription_id) <> ''
  GROUP BY us.provider_subscription_id
  HAVING COUNT(DISTINCT us.user_id) > 1
  LIMIT 1;

  IF v_dup IS NOT NULL THEN
    RAISE EXCEPTION 'LEGACY_SUB_CONFLICT: duplicate provider subscription reference %', v_dup
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_subscriptions GROUP BY user_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'LEGACY_SUB_CONFLICT: conflicting duplicate user'
      USING ERRCODE = '23505';
  END IF;

  FOR r IN
    SELECT
      user_id,
      tier,
      status,
      current_period_end,
      provider,
      provider_subscription_id
    FROM public.user_subscriptions
    ORDER BY user_id
  LOOP
    SELECT * INTO v_map
    FROM billing.map_legacy_user_subscription_row(
      r.user_id,
      r.tier,
      r.status,
      r.current_period_end,
      r.provider,
      r.provider_subscription_id
    );

    SELECT * INTO v_prior
    FROM billing.legacy_subscription_import_audit
    WHERE legacy_user_id = r.user_id;

    IF FOUND THEN
      IF v_prior.mapped_access_state IS DISTINCT FROM v_map.access_state
         OR v_prior.legacy_tier IS DISTINCT FROM r.tier
         OR v_prior.legacy_status IS DISTINCT FROM r.status
         OR v_prior.legacy_provider IS DISTINCT FROM r.provider
         OR v_prior.legacy_provider_subscription_id IS DISTINCT FROM r.provider_subscription_id
         OR v_prior.legacy_current_period_end IS DISTINCT FROM r.current_period_end THEN
        RAISE EXCEPTION
          'LEGACY_SUB_CONFLICT: contradictory re-import for user % (prior %, new %)',
          r.user_id, v_prior.mapped_access_state, v_map.access_state
          USING ERRCODE = '23505';
      END IF;
      v_skipped_idempotent := v_skipped_idempotent + 1;
      CONTINUE;
    END IF;

    SELECT * INTO v_existing
    FROM billing.subscriptions
    WHERE user_id = r.user_id;

    IF FOUND THEN
      -- Any pre-existing authoritative row with a legacy candidate is a conflict
      -- unless it already matches this exact fail-closed mapping (idempotent).
      IF v_existing.access_state IS DISTINCT FROM v_map.access_state THEN
        RAISE EXCEPTION
          'LEGACY_SUB_CONFLICT: billing.subscriptions already authoritative for user % (%, legacy maps to %)',
          r.user_id, v_existing.access_state, v_map.access_state
          USING ERRCODE = '23505';
      END IF;
      INSERT INTO billing.legacy_subscription_import_audit (
        legacy_user_id, legacy_tier, legacy_status, legacy_provider,
        legacy_provider_subscription_id, legacy_current_period_end,
        mapped_access_state, mapped_billing_state, billing_subscription_id
      ) VALUES (
        r.user_id, r.tier, r.status, r.provider,
        r.provider_subscription_id, r.current_period_end,
        v_map.access_state, v_map.billing_state, v_existing.id
      );
      v_skipped_idempotent := v_skipped_idempotent + 1;
      CONTINUE;
    END IF;

    SELECT pv.id INTO v_plan_version_id
    FROM billing.plan_versions pv
    JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
    WHERE pc.plan_key = v_map.plan_key
      AND pv.billing_interval = v_map.billing_interval
      AND pv.status = 'published'
    ORDER BY pv.version_number
    LIMIT 1;

    IF v_plan_version_id IS NULL THEN
      RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: missing published plan_version for plan_key=% interval=%',
        v_map.plan_key, v_map.billing_interval
        USING ERRCODE = '22023';
    END IF;

    INSERT INTO billing.subscriptions (
      user_id,
      plan_version_id,
      access_state,
      billing_state,
      cancel_at_period_end,
      current_period_end,
      market_code,
      currency_code,
      billing_interval,
      idempotency_key,
      entitlement_active_at,
      paid_activation_at
    ) VALUES (
      r.user_id,
      v_plan_version_id,
      v_map.access_state,
      v_map.billing_state,
      false,
      r.current_period_end,
      'INTL',
      'USD',
      v_map.billing_interval,
      'legacy-user-sub:' || r.user_id::text,
      CASE
        WHEN v_map.access_state = 'paid_active'
          THEN COALESCE(r.current_period_end - interval '30 days', now())
        ELSE NULL
      END,
      CASE
        WHEN v_map.access_state = 'paid_active'
          THEN COALESCE(r.current_period_end - interval '30 days', now())
        ELSE NULL
      END
    )
    RETURNING id INTO v_sub_id;

    INSERT INTO billing.legacy_subscription_import_audit (
      legacy_user_id, legacy_tier, legacy_status, legacy_provider,
      legacy_provider_subscription_id, legacy_current_period_end,
      mapped_access_state, mapped_billing_state, billing_subscription_id
    ) VALUES (
      r.user_id, r.tier, r.status, r.provider,
      r.provider_subscription_id, r.current_period_end,
      v_map.access_state, v_map.billing_state, v_sub_id
    );

    v_imported := v_imported + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'authoritative_source', 'billing.subscriptions',
    'legacy_surface', 'public.user_subscriptions',
    'imported', v_imported,
    'skipped_idempotent', v_skipped_idempotent,
    'legacy_row_count', (SELECT COUNT(*)::int FROM public.user_subscriptions),
    'authoritative_row_count', (SELECT COUNT(*)::int FROM billing.subscriptions)
  );
END;
$$;

REVOKE ALL ON FUNCTION billing.import_legacy_user_subscriptions() FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.import_legacy_user_subscriptions() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION billing.import_legacy_user_subscriptions() TO service_role;

-- Run once at migration time (transactional with this file).
DO $cutover$
DECLARE
  v_result jsonb;
BEGIN
  v_result := billing.import_legacy_user_subscriptions();
  RAISE NOTICE 'legacy subscription cutover: %', v_result;
END;
$cutover$;

-- Client-readable own-tier helper over the authoritative Billing table.
CREATE OR REPLACE FUNCTION public.get_my_billing_access_tier()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM billing.subscriptions s
    WHERE s.user_id = v_uid
      AND s.access_state = 'paid_active'
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end > now()
  ) THEN
    RETURN 'pro';
  END IF;

  RETURN 'free';
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_billing_access_tier() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_billing_access_tier() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_billing_access_tier() TO authenticated, service_role;

-- Account wipe must clear the authoritative Billing subscription when present.
CREATE OR REPLACE FUNCTION public.delete_my_account_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_rel text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM billing.legacy_subscription_import_audit WHERE legacy_user_id = v_user;
  DELETE FROM billing.subscriptions WHERE user_id = v_user;
  DELETE FROM public.user_subscriptions WHERE user_id = v_user;

  FOREACH v_rel IN ARRAY ARRAY[
    'lesson_progress',
    'user_lesson_status',
    'user_mission_state',
    'mission_submissions',
    'lesson_notes',
    'lesson_quiz_attempts',
    'build_logs',
    'user_streaks',
    'user_activity_time',
    'user_active_device',
    'learner_events',
    'learner_triage',
    'lesson_feedback',
    'lesson_review_schedule',
    'rate_limit_buckets',
    'shadow_watchlist',
    'user_shadow_events',
    'user_validation_sessions',
    'client_error_logs',
    'user_roles'
  ]
  LOOP
    IF to_regclass('public.' || v_rel) IS NOT NULL THEN
      EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', v_rel) USING v_user;
    END IF;
  END LOOP;

  IF to_regclass('public.v9_apply_decisions') IS NOT NULL THEN
    DELETE FROM public.v9_apply_decisions WHERE decided_by = v_user;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account_data() TO authenticated;
