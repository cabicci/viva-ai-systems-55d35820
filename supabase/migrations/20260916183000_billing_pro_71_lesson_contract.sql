-- Canonical paid lesson contract:
--   Pro      = all 71 non-Builder lessons; Builder is excluded
--   Pro Plus = all 100 lessons
-- Forward-only; quota, price, tax and refund contracts are preserved.

DO $do$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_policy_key text;
  v_lesson_cap integer;
  v_prior billing.entitlement_policy_versions%ROWTYPE;
  v_new_policy_id uuid;
  v_next_version integer;
  v_current_count integer;
BEGIN
  FOR v_policy_key, v_lesson_cap IN
    SELECT * FROM (VALUES
      ('pro'::text, 71::integer),
      ('pro_plus'::text, 100::integer)
    ) AS approved(policy_key, lesson_cap)
  LOOP
    SELECT count(*) INTO v_current_count
    FROM billing.entitlement_policy_versions
    WHERE policy_key = v_policy_key
      AND status = 'published'
      AND effective_from <= v_now
      AND (effective_to IS NULL OR effective_to > v_now);

    IF v_current_count <> 1 THEN
      RAISE EXCEPTION 'PAID_LESSON_POLICY_SOURCE_NOT_UNIQUE: %', v_policy_key
        USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1 FROM billing.entitlement_policy_versions
      WHERE policy_key = v_policy_key
        AND status = 'published'
        AND effective_from > v_now
    ) THEN
      RAISE EXCEPTION 'PAID_LESSON_POLICY_SCHEDULED: %', v_policy_key
        USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_prior
    FROM billing.entitlement_policy_versions
    WHERE policy_key = v_policy_key
      AND status = 'published'
      AND effective_from <= v_now
      AND (effective_to IS NULL OR effective_to > v_now)
    LIMIT 1;

    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM billing.entitlement_policy_versions
    WHERE policy_key = v_policy_key;

    UPDATE billing.entitlement_policy_versions
    SET status = 'deprecated',
        effective_to = v_now
    WHERE id = v_prior.id;

    INSERT INTO billing.entitlement_policy_versions (
      policy_key, version_number, status, effective_from, effective_to,
      lesson_allowlist_mode, lesson_ids, lesson_count_cap,
      builder_access, video_access, rag_enabled,
      assistant_runtime_per_lesson_quota,
      assistant_runtime_general_monthly_quota,
      assistant_runtime_period_quota, assistant_runtime_period_days,
      mission_evaluation_enabled, reveal_answer_enabled, wow_path_enabled,
      policy_json, published_at
    ) VALUES (
      v_policy_key, v_next_version, 'published', v_now, NULL,
      v_prior.lesson_allowlist_mode, v_prior.lesson_ids, v_lesson_cap,
      CASE WHEN v_policy_key = 'pro' THEN false ELSE v_prior.builder_access END,
      v_prior.video_access, v_prior.rag_enabled,
      v_prior.assistant_runtime_per_lesson_quota,
      v_prior.assistant_runtime_general_monthly_quota,
      v_prior.assistant_runtime_period_quota,
      v_prior.assistant_runtime_period_days,
      v_prior.mission_evaluation_enabled,
      v_prior.reveal_answer_enabled,
      v_prior.wow_path_enabled,
      v_prior.policy_json || jsonb_build_object(
        'paid_lesson_contract', '2026-09-16',
        'lesson_count', v_lesson_cap,
        'pro_builder_lesson_count', CASE WHEN v_policy_key = 'pro' THEN 0 ELSE 29 END
      ),
      v_now
    )
    RETURNING id INTO v_new_policy_id;

    -- No commercial history exists at launch. Refuse to repoint versioned
    -- catalogue rows if a future environment already has billing history.
    IF EXISTS (
      SELECT 1
      FROM billing.plan_versions pv
      JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
      WHERE pc.plan_key = v_policy_key
        AND (
          EXISTS (SELECT 1 FROM billing.subscriptions s WHERE s.plan_version_id = pv.id)
          OR EXISTS (
            SELECT 1 FROM billing.payment_transactions pt
            WHERE pt.plan_version_id = pv.id
          )
        )
    ) THEN
      RAISE EXCEPTION 'PAID_LESSON_PLAN_VERSION_ALREADY_REFERENCED: %', v_policy_key
        USING ERRCODE = '22023';
    END IF;

    UPDATE billing.plan_versions pv
    SET entitlement_policy_version_id = v_new_policy_id
    FROM billing.plan_catalog pc
    WHERE pc.id = pv.plan_id
      AND pc.plan_key = v_policy_key
      AND pv.status = 'published';
  END LOOP;
END
$do$;

-- Preserve the exact paid plan identity for client-side lesson gating.
CREATE OR REPLACE FUNCTION public.get_my_billing_access_tier()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan_key text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT pc.plan_key INTO v_plan_key
  FROM billing.subscriptions s
  JOIN billing.plan_versions pv ON pv.id = s.plan_version_id
  JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
  WHERE s.user_id = v_uid
    AND pc.plan_key IN ('pro', 'pro_plus')
    AND s.access_state IN ('paid_active', 'canceled_at_period_end')
    AND s.current_period_end IS NOT NULL
    AND s.current_period_end > now()
  LIMIT 1;

  RETURN COALESCE(v_plan_key, 'free');
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_billing_access_tier() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_billing_access_tier() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_billing_access_tier() TO authenticated, service_role;
