-- Stage 2A1: entitlement RPC foundation (draft)
CREATE OR REPLACE FUNCTION billing.get_entitlement_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_row billing.user_entitlement_snapshots%ROWTYPE;
BEGIN
  IF v_caller IS NULL AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'ENTITLEMENT_UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF v_caller IS NOT NULL AND v_caller IS DISTINCT FROM p_user_id
     AND NOT public.has_role(v_caller, 'admin'::app_role) THEN
    RAISE EXCEPTION 'ENTITLEMENT_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row
  FROM billing.user_entitlement_snapshots
  WHERE user_id = p_user_id
  ORDER BY snapshot_version DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'paid_content_entitled', false,
      'denial_reason_code', 'ENTITLEMENT_UNAVAILABLE'
    );
  END IF;

  RETURN v_row.entitlement_json;
END;
$$;

CREATE OR REPLACE FUNCTION billing.evaluate_access(
  p_user_id uuid,
  p_resource_type text,
  p_resource_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_snapshot jsonb;
  v_allowed boolean := false;
  v_denial text := 'ENTITLEMENT_UNAVAILABLE';
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'EVALUATE_ACCESS_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  v_snapshot := billing.get_entitlement_snapshot(p_user_id);

  IF COALESCE((v_snapshot ->> 'paid_content_entitled')::boolean, false) = false THEN
    v_denial := COALESCE(v_snapshot ->> 'denial_reason_code', 'ENTITLEMENT_UNAVAILABLE');
    RETURN jsonb_build_object('allowed', false, 'denial_reason_code', v_denial);
  END IF;

  IF p_resource_type IN ('lesson', 'video', 'rag') THEN
    v_allowed := v_snapshot -> 'lessons' -> 'entitled_lesson_ids' ? p_resource_id;
    IF NOT v_allowed THEN
      v_denial := CASE p_resource_type
        WHEN 'video' THEN 'VIDEO_NOT_ENTITLED'
        WHEN 'rag' THEN 'RAG_NOT_ENTITLED'
        ELSE 'LESSON_NOT_ENTITLED'
      END;
    END IF;
  ELSIF p_resource_type = 'builder' THEN
    v_allowed := COALESCE((v_snapshot ->> 'builder_access')::boolean, false);
    IF NOT v_allowed THEN v_denial := 'BUILDER_NOT_ENTITLED'; END IF;
  ELSIF p_resource_type = 'assistant_runtime' THEN
    v_allowed := true;
  ELSE
    v_denial := 'ENTITLEMENT_UNAVAILABLE';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'denial_reason_code', CASE WHEN v_allowed THEN NULL ELSE v_denial END
  );
END;
$$;

REVOKE ALL ON FUNCTION billing.get_entitlement_snapshot(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.evaluate_access(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.get_entitlement_snapshot(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.evaluate_access(uuid, text, text) TO service_role;
