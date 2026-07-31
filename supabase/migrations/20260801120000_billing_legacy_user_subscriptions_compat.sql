-- Legacy subscription compatibility: one-way fail-closed backfill into Billing V3.
-- Authorization: CR-BILLING-RAG-NATIVE-REHEARSAL-CORRECTION-20260801-01
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
-- BEHAVIOR:
--   * Zero legacy rows → success; no synthetic paid subscription is created.
--   * Mappable free/pro rows → deterministic insert into billing.subscriptions.
--   * Unmappable or conflicting rows → RAISE (transaction aborts; fail closed).
--   * Never silently grants paid entitlement for unknown/contradictory state.
--   * Does not expose the private billing schema through PostgREST.

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

CREATE OR REPLACE FUNCTION billing.map_legacy_user_subscription_row(
  p_user_id uuid,
  p_tier text,
  p_status text,
  p_current_period_end timestamptz
)
RETURNS TABLE (
  access_state text,
  billing_state text,
  billing_interval text,
  plan_key text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_status text := lower(nullif(btrim(COALESCE(p_status, '')), ''));
  v_tier text := lower(nullif(btrim(COALESCE(p_tier, '')), ''));
  v_period_active boolean := (p_current_period_end IS NULL OR p_current_period_end > now());
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
    -- Free never becomes paid, regardless of legacy status text.
    access_state := 'free_active';
    billing_state := 'none';
    billing_interval := 'none';
    plan_key := 'free';
    RETURN NEXT;
    RETURN;
  END IF;

  -- tier = pro
  IF v_status IS NOT NULL AND v_status NOT IN (
    'active', 'trialing', 'past_due', 'canceled', 'cancelled', 'expired', 'inactive'
  ) THEN
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: unknown status %', p_status
      USING ERRCODE = '22023';
  END IF;

  IF v_status IN ('expired', 'inactive') OR NOT v_period_active THEN
    access_state := 'expired';
    billing_state := 'inactive';
    billing_interval := 'month';
    plan_key := 'pro';
  ELSIF v_status IN ('canceled', 'cancelled') THEN
    access_state := 'canceled_at_period_end';
    billing_state := 'cancel_at_period_end';
    billing_interval := 'month';
    plan_key := 'pro';
  ELSIF v_status = 'past_due' THEN
    access_state := 'past_due';
    billing_state := 'past_due';
    billing_interval := 'month';
    plan_key := 'pro';
  ELSIF v_status IS NULL OR v_status IN ('active', 'trialing') THEN
    access_state := 'paid_active';
    billing_state := 'active';
    billing_interval := 'month';
    plan_key := 'pro';
  ELSE
    RAISE EXCEPTION 'LEGACY_SUB_UNMAPPABLE: contradictory paid/free state (tier=%, status=%)',
      p_tier, p_status
      USING ERRCODE = '22023';
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION billing.map_legacy_user_subscription_row(uuid, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.map_legacy_user_subscription_row(uuid, text, text, timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION billing.map_legacy_user_subscription_row(uuid, text, text, timestamptz) TO service_role;

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

  -- Duplicate user rows cannot exist (PK), but guard anyway.
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
      r.user_id, r.tier, r.status, r.current_period_end
    );

    SELECT * INTO v_prior
    FROM billing.legacy_subscription_import_audit
    WHERE legacy_user_id = r.user_id;

    IF FOUND THEN
      IF v_prior.mapped_access_state IS DISTINCT FROM v_map.access_state
         OR v_prior.legacy_tier IS DISTINCT FROM r.tier
         OR v_prior.legacy_status IS DISTINCT FROM r.status
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
      IF v_existing.access_state IS DISTINCT FROM v_map.access_state THEN
        RAISE EXCEPTION
          'LEGACY_SUB_CONFLICT: billing.subscriptions already authoritative for user % (%, legacy maps to %)',
          r.user_id, v_existing.access_state, v_map.access_state
          USING ERRCODE = '23505';
      END IF;
      -- Same access state already present — record audit only.
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
      (v_map.access_state = 'canceled_at_period_end'),
      r.current_period_end,
      'INTL',
      'USD',
      v_map.billing_interval,
      'legacy-user-sub:' || r.user_id::text,
      CASE
        WHEN v_map.access_state IN ('paid_active', 'canceled_at_period_end', 'past_due')
          THEN COALESCE(r.current_period_end - interval '30 days', now())
        ELSE NULL
      END,
      CASE
        WHEN v_map.access_state IN ('paid_active', 'canceled_at_period_end', 'past_due')
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
-- Does not expose billing schema via PostgREST profiles; public RPC only.
CREATE OR REPLACE FUNCTION public.get_my_billing_access_tier()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_access text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT s.access_state INTO v_access
  FROM billing.subscriptions s
  WHERE s.user_id = v_uid;

  IF NOT FOUND THEN
    RETURN 'free';
  END IF;

  IF v_access IN ('paid_active', 'canceled_at_period_end')
     AND EXISTS (
       SELECT 1 FROM billing.subscriptions s2
       WHERE s2.user_id = v_uid
         AND s2.access_state IN ('paid_active', 'canceled_at_period_end')
         AND (s2.current_period_end IS NULL OR s2.current_period_end > now())
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
-- Replaces the public wipe body with Billing-aware cleanup while retaining the
-- legacy public.user_subscriptions delete (table preserved until row removal).
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

  -- Best-effort wipe of known user-owned public relations when present.
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
