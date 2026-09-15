-- Billing paid AI quota alignment.
-- Forward-only: historical migrations, plan versions, prices and public RPC
-- signatures remain unchanged.

DO $do$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_policy_key text;
  v_per_lesson integer;
  v_general integer;
  v_prior billing.entitlement_policy_versions%ROWTYPE;
  v_next_version integer;
  v_current_count integer;
BEGIN
  FOR v_policy_key, v_per_lesson, v_general IN
    SELECT * FROM (VALUES
      ('pro'::text, 3::integer, 50::integer),
      ('pro_plus'::text, 6::integer, 150::integer)
    ) AS approved(policy_key, per_lesson, general_monthly)
  LOOP
    SELECT count(*) INTO v_current_count
    FROM billing.entitlement_policy_versions
    WHERE policy_key = v_policy_key
      AND status = 'published'
      AND effective_from <= v_now
      AND (effective_to IS NULL OR effective_to > v_now);

    IF v_current_count <> 1 THEN
      RAISE EXCEPTION 'PAID_QUOTA_POLICY_SOURCE_NOT_UNIQUE: %', v_policy_key
        USING ERRCODE = '22023';
    END IF;

    -- A scheduled commercial policy needs explicit reconciliation; silently
    -- replacing it could change non-quota entitlements ahead of its start date.
    IF EXISTS (
      SELECT 1 FROM billing.entitlement_policy_versions
      WHERE policy_key = v_policy_key
        AND status = 'published' AND effective_from > v_now
    ) THEN
      RAISE EXCEPTION 'PAID_QUOTA_POLICY_SCHEDULED: %', v_policy_key
        USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_prior
    FROM billing.entitlement_policy_versions
    WHERE policy_key = v_policy_key
      AND status = 'published'
      AND effective_from <= v_now
      AND (effective_to IS NULL OR effective_to > v_now)
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PAID_QUOTA_POLICY_SOURCE_MISSING: %', v_policy_key
        USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM billing.entitlement_policy_versions
    WHERE policy_key = v_policy_key;

    UPDATE billing.entitlement_policy_versions
      SET status = 'deprecated',
          effective_to = CASE
            WHEN effective_to IS NULL OR effective_to > v_now THEN v_now
            ELSE effective_to
          END
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
      v_prior.lesson_allowlist_mode, v_prior.lesson_ids, v_prior.lesson_count_cap,
      v_prior.builder_access, v_prior.video_access, v_prior.rag_enabled,
      v_per_lesson, v_general, NULL, NULL,
      v_prior.mission_evaluation_enabled,
      v_prior.reveal_answer_enabled,
      v_prior.wow_path_enabled,
      v_prior.policy_json || jsonb_build_object(
        'paid_ai_quota_contract', '2026-09-15',
        'per_lesson', v_per_lesson,
        'general_monthly', v_general
      ),
      v_now
    );
  END LOOP;
END
$do$;

CREATE OR REPLACE FUNCTION billing.resolve_ai_assistant_limits(p_user_id uuid)
RETURNS TABLE (
  general_monthly_limit integer,
  per_lesson_limit integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_plan_key text;
  v_pinned_policy_key text;
  v_pinned_general integer;
  v_pinned_period integer;
  v_pinned_per_lesson integer;
  v_policy billing.entitlement_policy_versions%ROWTYPE;
  v_policy_count integer;
  v_state billing.admin_user_grant_state%ROWTYPE;
  v_admin_limit integer;
BEGIN
  SELECT
    pc.plan_key,
    pinned.policy_key,
    pinned.assistant_runtime_general_monthly_quota,
    pinned.assistant_runtime_period_quota,
    pinned.assistant_runtime_per_lesson_quota
  INTO
    v_plan_key,
    v_pinned_policy_key,
    v_pinned_general,
    v_pinned_period,
    v_pinned_per_lesson
  FROM billing.subscriptions s
  JOIN billing.plan_versions pv ON pv.id = s.plan_version_id
  JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
  JOIN billing.entitlement_policy_versions pinned
    ON pinned.id = pv.entitlement_policy_version_id
  WHERE s.user_id = p_user_id
    AND s.access_state IN (
      'paid_active', 'paid_scheduled', 'canceled_at_period_end', 'past_due'
    )
  LIMIT 1;

  IF FOUND THEN
    -- Canonical paid subscriptions resolve the single current policy by stable
    -- plan key, so existing subscriptions pinned to an older plan version pick
    -- up the approved quota contract without changing plan or price identity.
    IF v_pinned_policy_key = v_plan_key
       AND v_plan_key IN ('pro', 'pro_plus') THEN
      SELECT count(*) INTO v_policy_count
      FROM billing.entitlement_policy_versions epv
      WHERE epv.policy_key = v_plan_key
        AND epv.status = 'published'
        AND epv.effective_from <= now()
        AND (epv.effective_to IS NULL OR epv.effective_to > now());

      IF v_policy_count = 0 THEN
        RAISE EXCEPTION 'PAID_QUOTA_POLICY_UNAVAILABLE: %', v_plan_key
          USING ERRCODE = '22023';
      ELSIF v_policy_count > 1 THEN
        RAISE EXCEPTION 'PAID_QUOTA_POLICY_AMBIGUOUS: %', v_plan_key
          USING ERRCODE = '22023';
      END IF;

      SELECT * INTO v_policy
      FROM billing.entitlement_policy_versions epv
      WHERE epv.policy_key = v_plan_key
        AND epv.status = 'published'
        AND epv.effective_from <= now()
        AND (epv.effective_to IS NULL OR epv.effective_to > now())
      LIMIT 1;

      IF GREATEST(
        COALESCE(v_policy.assistant_runtime_period_quota, 0),
        COALESCE(v_policy.assistant_runtime_general_monthly_quota, 0)
      ) > 0 THEN
        RETURN QUERY SELECT GREATEST(
          COALESCE(v_policy.assistant_runtime_period_quota, 0),
          COALESCE(v_policy.assistant_runtime_general_monthly_quota, 0)
        ),
        v_policy.assistant_runtime_per_lesson_quota;
        RETURN;
      END IF;
    ELSE
      -- Preserve explicitly versioned non-canonical/legacy policies. A paid
      -- policy with no AI quota still permits the existing admin-grant fallback.
      IF GREATEST(COALESCE(v_pinned_period, 0), COALESCE(v_pinned_general, 0)) > 0 THEN
        RETURN QUERY SELECT
          GREATEST(COALESCE(v_pinned_period, 0), COALESCE(v_pinned_general, 0)),
          v_pinned_per_lesson;
        RETURN;
      END IF;
    END IF;
  END IF;

  SELECT * INTO v_state
  FROM billing.admin_user_grant_state
  WHERE user_id = p_user_id
    AND expires_at > now();

  IF FOUND THEN
    SELECT ai_assistant_quota_limit INTO v_admin_limit
    FROM billing.admin_grant_policy_versions
    WHERE id = v_state.policy_version_id;

    RETURN QUERY SELECT
      COALESCE(v_admin_limit, billing.admin_grant_ai_assistant_limit()),
      NULL::integer;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM billing.admin_access_grants g
    WHERE g.user_id = p_user_id
      AND g.status = 'active'
      AND g.expires_at > now()
  ) THEN
    RETURN QUERY SELECT
      billing.admin_grant_ai_assistant_limit(),
      NULL::integer;
    RETURN;
  END IF;

  RETURN QUERY SELECT 0, NULL::integer;
END;
$$;

CREATE OR REPLACE FUNCTION billing.resolve_ai_assistant_limit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_limit integer;
BEGIN
  SELECT limits.general_monthly_limit INTO v_limit
  FROM billing.resolve_ai_assistant_limits(p_user_id) AS limits;
  RETURN COALESCE(v_limit, 0);
END;
$$;

CREATE OR REPLACE FUNCTION billing.reserve_ai_quota(
  p_user_id uuid,
  p_category text,
  p_lesson_id text,
  p_request_id uuid,
  p_units integer,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_bucket text;
  v_existing billing.ai_usage_ledger%ROWTYPE;
  v_general billing.entitlement_usage%ROWTYPE;
  v_lesson billing.entitlement_usage%ROWTYPE;
  v_reservation_id uuid := gen_random_uuid();
  v_period_key text;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_general_limit integer;
  v_lesson_limit integer;
  v_general_projected integer;
  v_lesson_projected integer;
  v_track_lesson boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_units IS NULL OR p_units <= 0 THEN
    RAISE EXCEPTION 'QUOTA_INVALID_UNITS' USING ERRCODE = '22023';
  END IF;

  IF p_lesson_id IS NOT NULL AND btrim(p_lesson_id) = '' THEN
    RAISE EXCEPTION 'QUOTA_INVALID_LESSON_ID' USING ERRCODE = '22023';
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(p_category);

  -- Concurrent delivery of the same request must replay after the first
  -- transaction finishes, including when it reserved the final quota unit.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    'billing.ai_reservation:' || p_idempotency_key, 0
  ));

  SELECT * INTO v_existing
  FROM billing.ai_usage_ledger
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'reservation_id', v_existing.reservation_id,
      'request_id', v_existing.request_id,
      'bucket', v_bucket,
      'status', v_existing.status,
      'idempotent_replay', true
    );
  END IF;

  v_period_key := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
  v_period_start :=
    (date_trunc('month', now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC';
  v_period_end :=
    ((date_trunc('month', now() AT TIME ZONE 'UTC')) + interval '1 month')
      AT TIME ZONE 'UTC';

  SELECT limits.general_monthly_limit, limits.per_lesson_limit
    INTO v_general_limit, v_lesson_limit
  FROM billing.resolve_ai_assistant_limits(p_user_id) AS limits;

  v_general_limit := COALESCE(v_general_limit, 0);
  v_track_lesson := p_lesson_id IS NOT NULL AND v_lesson_limit IS NOT NULL;

  -- Lock order is always general first, then lesson, preventing cross-scope
  -- deadlocks while serializing the monthly cap across different lessons.
  SELECT * INTO v_general
  FROM billing.entitlement_usage
  WHERE user_id = p_user_id
    AND usage_category = v_bucket
    AND period_key = v_period_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO billing.entitlement_usage (
      user_id, usage_category, period_key, lesson_id,
      used_count, reserved_count, quota_limit, period_start, period_end
    ) VALUES (
      p_user_id, v_bucket, v_period_key, NULL,
      0, 0, v_general_limit, v_period_start, v_period_end
    )
    ON CONFLICT (user_id, usage_category, period_key)
      WHERE usage_category = 'ai_assistant'
    DO NOTHING;

    SELECT * INTO v_general
    FROM billing.entitlement_usage
    WHERE user_id = p_user_id
      AND usage_category = v_bucket
      AND period_key = v_period_key
    FOR UPDATE;
  END IF;

  IF COALESCE(v_general.quota_limit, -1) IS DISTINCT FROM v_general_limit THEN
    UPDATE billing.entitlement_usage
      SET quota_limit = v_general_limit, updated_at = now()
      WHERE id = v_general.id;
    v_general.quota_limit := v_general_limit;
  END IF;

  v_general_projected :=
    v_general.used_count + v_general.reserved_count + p_units;
  IF v_general_projected > COALESCE(v_general.quota_limit, 0) THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED_GENERAL' USING ERRCODE = '22023';
  END IF;

  IF v_track_lesson THEN
    SELECT * INTO v_lesson
    FROM billing.entitlement_usage
    WHERE user_id = p_user_id
      AND usage_category = 'assistant_runtime_per_lesson'
      AND period_key = v_period_key
      AND lesson_id = p_lesson_id
    FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO billing.entitlement_usage (
        user_id, usage_category, period_key, lesson_id,
        used_count, reserved_count, quota_limit, period_start, period_end
      ) VALUES (
        p_user_id, 'assistant_runtime_per_lesson', v_period_key, p_lesson_id,
        0, 0, v_lesson_limit, v_period_start, v_period_end
      )
      ON CONFLICT ON CONSTRAINT entitlement_usage_unique DO NOTHING;

      SELECT * INTO v_lesson
      FROM billing.entitlement_usage
      WHERE user_id = p_user_id
        AND usage_category = 'assistant_runtime_per_lesson'
        AND period_key = v_period_key
        AND lesson_id = p_lesson_id
      FOR UPDATE;
    END IF;

    IF COALESCE(v_lesson.quota_limit, -1) IS DISTINCT FROM v_lesson_limit THEN
      UPDATE billing.entitlement_usage
        SET quota_limit = v_lesson_limit, updated_at = now()
        WHERE id = v_lesson.id;
      v_lesson.quota_limit := v_lesson_limit;
    END IF;

    v_lesson_projected :=
      v_lesson.used_count + v_lesson.reserved_count + p_units;
    IF v_lesson_projected > COALESCE(v_lesson.quota_limit, 0) THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED_LESSON' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE billing.entitlement_usage
    SET reserved_count = reserved_count + p_units, updated_at = now()
    WHERE id = v_general.id;

  IF v_track_lesson THEN
    UPDATE billing.entitlement_usage
      SET reserved_count = reserved_count + p_units, updated_at = now()
      WHERE id = v_lesson.id;
  END IF;

  INSERT INTO billing.ai_usage_ledger (
    user_id, usage_category, model_key, lesson_id, request_id, reservation_id,
    input_tokens, output_tokens, provider_cost_micro, billable, status,
    attempt_index, reserved_units, reservation_expires_at,
    idempotency_key, occurred_at, metadata
  ) VALUES (
    p_user_id, p_category, 'pending', p_lesson_id, p_request_id,
    v_reservation_id, 0, 0, 0, true, 'reserved',
    0, p_units, now() + interval '5 minutes',
    p_idempotency_key, now(),
    jsonb_build_object('lesson_quota_reserved', v_track_lesson)
  );

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'request_id', p_request_id,
    'bucket', v_bucket,
    'remaining', GREATEST(v_general_limit - v_general_projected, 0),
    'remaining_general', GREATEST(v_general_limit - v_general_projected, 0),
    'remaining_lesson', CASE
      WHEN v_track_lesson
        THEN GREATEST(v_lesson_limit - v_lesson_projected, 0)
      ELSE NULL
    END,
    'idempotent_replay', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION billing.register_provider_attempt(
  p_reservation_id uuid,
  p_provider text,
  p_provider_request_id text,
  p_attempt_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_root billing.ai_usage_ledger%ROWTYPE;
  v_existing billing.ai_usage_ledger%ROWTYPE;
  v_bucket text;
  v_period_key text;
  v_first_start boolean;
  v_next_index integer;
  v_attempt_idem text;
  v_new_id uuid;
  v_rows integer;
  v_track_lesson boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  IF p_provider IS NULL OR btrim(p_provider) = '' THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_root
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id
    AND attempt_index = 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_root.status IN ('released', 'stale_reconciled') THEN
    RAISE EXCEPTION 'RESERVATION_NOT_ACTIVE' USING ERRCODE = '22023';
  END IF;

  IF p_attempt_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM billing.ai_usage_ledger
    WHERE attempt_idempotency_key = p_attempt_idempotency_key;

    IF FOUND THEN
      IF v_existing.reservation_id IS DISTINCT FROM p_reservation_id
         OR v_existing.provider IS DISTINCT FROM p_provider
         OR v_existing.provider_request_id IS DISTINCT FROM p_provider_request_id THEN
        RAISE EXCEPTION 'PROVIDER_ATTEMPT_CONFLICT' USING ERRCODE = '22023';
      END IF;
      RETURN jsonb_build_object(
        'reservation_id', p_reservation_id,
        'attempt_index', v_existing.attempt_index,
        'attempt_status', v_existing.attempt_status,
        'provider_started_at', v_existing.provider_started_at,
        'quota_committed', false,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  IF p_provider_request_id IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM billing.ai_usage_ledger
    WHERE reservation_id = p_reservation_id
      AND provider = p_provider
      AND provider_request_id = p_provider_request_id
      AND attempt_index >= 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'reservation_id', p_reservation_id,
        'attempt_index', v_existing.attempt_index,
        'attempt_status', v_existing.attempt_status,
        'provider_started_at', v_existing.provider_started_at,
        'quota_committed', false,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_root.usage_category);
  v_period_key := to_char((v_root.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');
  v_track_lesson :=
    COALESCE((v_root.metadata ->> 'lesson_quota_reserved')::boolean, false);
  v_first_start := (
    v_root.status = 'reserved'
    AND v_root.provider_started_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM billing.ai_usage_ledger
      WHERE reservation_id = p_reservation_id
        AND provider_started_at IS NOT NULL
    )
  );

  SELECT COALESCE(MAX(attempt_index), 0) + 1 INTO v_next_index
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id
    AND attempt_index >= 1;

  v_attempt_idem := COALESCE(
    p_attempt_idempotency_key,
    p_reservation_id::text || ':provider_attempt:' || v_next_index::text
  );

  INSERT INTO billing.ai_usage_ledger (
    user_id, usage_category, model_key, lesson_id, request_id, reservation_id,
    input_tokens, output_tokens, provider_cost_micro, billable, status,
    attempt_index, reserved_units, reservation_expires_at,
    provider, provider_request_id, provider_started_at,
    attempt_status, attempt_idempotency_key,
    idempotency_key, occurred_at
  ) VALUES (
    v_root.user_id, v_root.usage_category, v_root.model_key, v_root.lesson_id,
    v_root.request_id, p_reservation_id,
    0, 0, 0, v_root.billable, 'committed',
    v_next_index, v_root.reserved_units, v_root.reservation_expires_at,
    p_provider, p_provider_request_id, now(),
    'registered', v_attempt_idem,
    v_attempt_idem, now()
  )
  RETURNING id INTO v_new_id;

  IF v_first_start THEN
    UPDATE billing.ai_usage_ledger
      SET status = 'committed',
          provider_started_at = now(),
          metadata = metadata || jsonb_build_object(
            'first_attempt_index', v_next_index
          )
      WHERE reservation_id = p_reservation_id
        AND attempt_index = 0;

    UPDATE billing.entitlement_usage
      SET used_count = used_count + v_root.reserved_units,
          reserved_count = GREATEST(
            reserved_count - v_root.reserved_units, 0
          ),
          updated_at = now()
      WHERE user_id = v_root.user_id
        AND usage_category = v_bucket
        AND period_key = v_period_key;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'QUOTA_GENERAL_COUNTER_MISSING' USING ERRCODE = 'P0002';
    END IF;

    IF v_track_lesson THEN
      UPDATE billing.entitlement_usage
        SET used_count = used_count + v_root.reserved_units,
            reserved_count = GREATEST(
              reserved_count - v_root.reserved_units, 0
            ),
            updated_at = now()
        WHERE user_id = v_root.user_id
          AND usage_category = 'assistant_runtime_per_lesson'
          AND period_key = v_period_key
          AND lesson_id = v_root.lesson_id;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN
        RAISE EXCEPTION 'QUOTA_LESSON_COUNTER_MISSING'
          USING ERRCODE = 'P0002';
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'reservation_id', p_reservation_id,
    'attempt_index', v_next_index,
    'attempt_status', 'registered',
    'provider_started_at', now(),
    'quota_committed', v_first_start,
    'idempotent_replay', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION billing.release_ai_quota(
  p_reservation_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_root billing.ai_usage_ledger%ROWTYPE;
  v_bucket text;
  v_period_key text;
  v_any_started boolean;
  v_rows integer;
  v_track_lesson boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_root
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id
    AND attempt_index = 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_root.status = 'released' THEN
    RETURN jsonb_build_object('released', true, 'idempotent_replay', true);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM billing.ai_usage_ledger
    WHERE reservation_id = p_reservation_id
      AND provider_started_at IS NOT NULL
  ) INTO v_any_started;

  IF v_root.status = 'committed'
     OR v_root.provider_started_at IS NOT NULL
     OR v_any_started THEN
    RAISE EXCEPTION 'CANNOT_RELEASE_STARTED' USING ERRCODE = '22023';
  END IF;

  IF v_root.status <> 'reserved' THEN
    RAISE EXCEPTION 'RESERVATION_NOT_RELEASABLE' USING ERRCODE = '22023';
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_root.usage_category);
  v_period_key := to_char((v_root.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');
  v_track_lesson :=
    COALESCE((v_root.metadata ->> 'lesson_quota_reserved')::boolean, false);

  UPDATE billing.ai_usage_ledger
    SET status = 'released', occurred_at = occurred_at
    WHERE reservation_id = p_reservation_id
      AND attempt_index = 0;

  UPDATE billing.entitlement_usage
    SET reserved_count = GREATEST(
          reserved_count - v_root.reserved_units, 0
        ),
        updated_at = now()
    WHERE user_id = v_root.user_id
      AND usage_category = v_bucket
      AND period_key = v_period_key;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'QUOTA_GENERAL_COUNTER_MISSING' USING ERRCODE = 'P0002';
  END IF;

  IF v_track_lesson THEN
    UPDATE billing.entitlement_usage
      SET reserved_count = GREATEST(
            reserved_count - v_root.reserved_units, 0
          ),
          updated_at = now()
      WHERE user_id = v_root.user_id
        AND usage_category = 'assistant_runtime_per_lesson'
        AND period_key = v_period_key
        AND lesson_id = v_root.lesson_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'QUOTA_LESSON_COUNTER_MISSING' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  RETURN jsonb_build_object('released', true, 'idempotent_replay', false);
END;
$$;

CREATE OR REPLACE FUNCTION billing.reconcile_stale_ai_reservation(
  p_reservation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_root billing.ai_usage_ledger%ROWTYPE;
  v_bucket text;
  v_period_key text;
  v_action text;
  v_any_started boolean;
  v_rows integer;
  v_track_lesson boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_root
  FROM billing.ai_usage_ledger
  WHERE reservation_id = p_reservation_id
    AND attempt_index = 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_root.status <> 'reserved' THEN
    RETURN jsonb_build_object(
      'reservation_id', p_reservation_id,
      'action', 'noop',
      'status', v_root.status
    );
  END IF;

  v_bucket := billing.map_ledger_category_to_quota_bucket(v_root.usage_category);
  v_period_key := to_char((v_root.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM');
  v_track_lesson :=
    COALESCE((v_root.metadata ->> 'lesson_quota_reserved')::boolean, false);
  SELECT EXISTS (
    SELECT 1
    FROM billing.ai_usage_ledger
    WHERE reservation_id = p_reservation_id
      AND provider_started_at IS NOT NULL
  ) INTO v_any_started;

  IF v_any_started THEN
    UPDATE billing.ai_usage_ledger
      SET status = 'committed',
          provider_started_at = COALESCE(provider_started_at, now())
      WHERE reservation_id = p_reservation_id
        AND attempt_index = 0;

    UPDATE billing.entitlement_usage
      SET used_count = used_count + v_root.reserved_units,
          reserved_count = GREATEST(
            reserved_count - v_root.reserved_units, 0
          ),
          updated_at = now()
      WHERE user_id = v_root.user_id
        AND usage_category = v_bucket
        AND period_key = v_period_key;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'QUOTA_GENERAL_COUNTER_MISSING' USING ERRCODE = 'P0002';
    END IF;

    IF v_track_lesson THEN
      UPDATE billing.entitlement_usage
        SET used_count = used_count + v_root.reserved_units,
            reserved_count = GREATEST(
              reserved_count - v_root.reserved_units, 0
            ),
            updated_at = now()
        WHERE user_id = v_root.user_id
          AND usage_category = 'assistant_runtime_per_lesson'
          AND period_key = v_period_key
          AND lesson_id = v_root.lesson_id;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN
        RAISE EXCEPTION 'QUOTA_LESSON_COUNTER_MISSING'
          USING ERRCODE = 'P0002';
      END IF;
    END IF;
    v_action := 'committed';
  ELSIF v_root.reservation_expires_at IS NOT NULL
        AND v_root.reservation_expires_at < now() THEN
    UPDATE billing.ai_usage_ledger
      SET status = 'stale_reconciled'
      WHERE reservation_id = p_reservation_id
        AND attempt_index = 0;

    UPDATE billing.entitlement_usage
      SET reserved_count = GREATEST(
            reserved_count - v_root.reserved_units, 0
          ),
          updated_at = now()
      WHERE user_id = v_root.user_id
        AND usage_category = v_bucket
        AND period_key = v_period_key;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'QUOTA_GENERAL_COUNTER_MISSING' USING ERRCODE = 'P0002';
    END IF;

    IF v_track_lesson THEN
      UPDATE billing.entitlement_usage
        SET reserved_count = GREATEST(
              reserved_count - v_root.reserved_units, 0
            ),
            updated_at = now()
        WHERE user_id = v_root.user_id
          AND usage_category = 'assistant_runtime_per_lesson'
          AND period_key = v_period_key
          AND lesson_id = v_root.lesson_id;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN
        RAISE EXCEPTION 'QUOTA_LESSON_COUNTER_MISSING'
          USING ERRCODE = 'P0002';
      END IF;
    END IF;
    v_action := 'stale_reconciled';
  ELSE
    v_action := 'noop';
  END IF;

  RETURN jsonb_build_object(
    'reservation_id', p_reservation_id,
    'action', v_action
  );
END;
$$;

REVOKE ALL ON FUNCTION billing.resolve_ai_assistant_limits(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.resolve_ai_assistant_limit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.register_provider_attempt(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.release_ai_quota(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.reconcile_stale_ai_reservation(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION billing.resolve_ai_assistant_limits(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION billing.resolve_ai_assistant_limit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reserve_ai_quota(uuid, text, text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.register_provider_attempt(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.release_ai_quota(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.reconcile_stale_ai_reservation(uuid) TO service_role;
