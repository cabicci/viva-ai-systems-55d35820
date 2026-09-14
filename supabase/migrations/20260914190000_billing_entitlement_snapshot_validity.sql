-- Fail closed when the newest entitlement snapshot is expired or invalidated.
-- This is additive: historical billing migrations remain immutable.
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
  IF v_caller IS NULL AND NOT billing.is_service_role_caller() THEN
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

  IF v_row.expires_at <= now() OR v_row.invalidation_reason IS NOT NULL THEN
    RETURN jsonb_build_object(
      'paid_content_entitled', false,
      'denial_reason_code', 'ENTITLEMENT_UNAVAILABLE'
    );
  END IF;

  RETURN v_row.entitlement_json;
END;
$$;

REVOKE ALL ON FUNCTION billing.get_entitlement_snapshot(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.get_entitlement_snapshot(uuid) TO authenticated, service_role;
