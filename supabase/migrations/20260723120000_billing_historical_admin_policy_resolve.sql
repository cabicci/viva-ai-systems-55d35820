-- Billing V3 — restore historical admin-grant policy resolution.
-- Additive forward migration only. Does not alter prior migration files.
--
-- Defect: resolve_admin_grant_policy filtered status = 'published' only, so a
-- timestamp inside a legitimately closed (deprecated) publication interval
-- raised ADMIN_GRANT_POLICY_UNAVAILABLE.
--
-- Contract:
--   eligible when effective_from <= p_as_of
--     AND (effective_to IS NULL OR p_as_of < effective_to)
--   AND either:
--     (a) status = 'published'  — current / open publication window; or
--     (b) status = 'deprecated'
--         AND published_at IS NOT NULL  — produced by publication lifecycle
--         AND effective_to IS NOT NULL  — closed historical interval
--   Never resolve draft / never-published / arbitrary deprecated rows.
-- Fail closed: 0 → UNAVAILABLE, >1 → AMBIGUOUS.

CREATE OR REPLACE FUNCTION billing.resolve_admin_grant_policy(p_as_of timestamptz DEFAULT now())
RETURNS billing.admin_grant_policy_versions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_row billing.admin_grant_policy_versions%ROWTYPE;
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM billing.admin_grant_policy_versions
  WHERE policy_key = 'admin_learner_grant'
    AND effective_from <= p_as_of
    AND (effective_to IS NULL OR p_as_of < effective_to)
    AND (
      status = 'published'
      OR (
        status = 'deprecated'
        AND published_at IS NOT NULL
        AND effective_to IS NOT NULL
      )
    );

  IF v_count = 0 THEN
    RAISE EXCEPTION 'ADMIN_GRANT_POLICY_UNAVAILABLE' USING ERRCODE = '22023';
  ELSIF v_count > 1 THEN
    RAISE EXCEPTION 'ADMIN_GRANT_POLICY_AMBIGUOUS' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM billing.admin_grant_policy_versions
  WHERE policy_key = 'admin_learner_grant'
    AND effective_from <= p_as_of
    AND (effective_to IS NULL OR p_as_of < effective_to)
    AND (
      status = 'published'
      OR (
        status = 'deprecated'
        AND published_at IS NOT NULL
        AND effective_to IS NOT NULL
      )
    )
  LIMIT 1;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION billing.resolve_admin_grant_policy(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.resolve_admin_grant_policy(timestamptz) TO service_role;
