-- Guarded Production RAG upgrade from the active 3700-chunk version to the
-- fully imported 3701-chunk staging version. Service-role only and atomic.

-- A successful retry must clear the session-level error left by an earlier
-- failed attempt, but only after no failed batch remains.
CREATE OR REPLACE FUNCTION public.rag_clear_session_error_after_batch_success()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NOT EXISTS (
       SELECT 1
       FROM public.rag_import_batches b
       WHERE b.session_id = NEW.session_id
         AND b.status = 'failed'
     ) THEN
    UPDATE public.rag_import_sessions
    SET last_error_code = NULL,
        updated_at = now()
    WHERE id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.rag_clear_session_error_after_batch_success()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS rag_clear_session_error_after_batch_success
  ON public.rag_import_batches;

CREATE TRIGGER rag_clear_session_error_after_batch_success
AFTER UPDATE OF status ON public.rag_import_batches
FOR EACH ROW
EXECUTE FUNCTION public.rag_clear_session_error_after_batch_success();

-- Repair the stale COMMIT_FAILED marker on the exact completed 3701 session.
-- Every immutable import gate is repeated so this cannot bless partial state.
UPDATE public.rag_import_sessions s
SET last_error_code = NULL,
    updated_at = now()
WHERE s.execution_id = 'rag-lovable-cf227e066b9b4550806c40adb1e8bde5'
  AND s.version_key = 'rag-index-v1-3e1ef5aa-930bc16ad0085e44'
  AND s.source_sha = '3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2'
  AND s.status = 'completed'
  AND s.expected_chunk_count = 3701
  AND s.accepted_chunk_count = 3701
  AND s.planned_batch_count = 58
  AND s.provider_attempt_total <= 67
  AND (
    SELECT count(*)
    FROM public.rag_import_batches b
    WHERE b.session_id = s.id AND b.status = 'completed'
  ) = 58
  AND NOT EXISTS (
    SELECT 1
    FROM public.rag_import_batches b
    WHERE b.session_id = s.id AND b.status <> 'completed'
  )
  AND (
    SELECT count(*)
    FROM public.knowledge_chunks kc
    WHERE kc.index_version = s.version_key
      AND kc.source_type = 'locale_lesson'
      AND kc.index_state = 'staging'
      AND kc.indexing_failed = false
  ) = 3701;

CREATE OR REPLACE FUNCTION public.rag_activate_index_upgrade(
  p_version_key text,
  p_expected_active_version_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_target public.rag_index_versions%ROWTYPE;
  v_active public.rag_index_versions%ROWTYPE;
  v_staging_count integer;
  v_failed_count integer;
  v_active_chunk_count integer;
  v_active_versions integer;
BEGIN
  PERFORM public.rag_require_service_role();

  IF p_version_key IS NULL OR p_expected_active_version_key IS NULL
     OR p_version_key = p_expected_active_version_key THEN
    RAISE EXCEPTION 'INVALID_UPGRADE_VERSIONS';
  END IF;

  SELECT * INTO v_target
  FROM public.rag_index_versions
  WHERE version_key = p_version_key
  FOR UPDATE;

  IF NOT FOUND OR v_target.status <> 'staging' THEN
    RAISE EXCEPTION 'VERSION_NOT_STAGING';
  END IF;

  SELECT * INTO v_active
  FROM public.rag_index_versions
  WHERE status = 'active'
  FOR UPDATE;

  IF NOT FOUND OR v_active.version_key <> p_expected_active_version_key THEN
    RAISE EXCEPTION 'ACTIVE_VERSION_MISMATCH';
  END IF;

  SELECT count(*) INTO v_active_versions
  FROM public.rag_index_versions
  WHERE status = 'active';

  IF v_active_versions <> 1 THEN
    RAISE EXCEPTION 'ACTIVE_VERSION_COUNT_INVALID';
  END IF;

  SELECT count(*) INTO v_staging_count
  FROM public.knowledge_chunks
  WHERE index_version = p_version_key
    AND index_state = 'staging'
    AND source_type = 'locale_lesson'
    AND indexing_failed = false;

  IF v_staging_count <> v_target.chunk_count THEN
    RAISE EXCEPTION 'STAGING_COUNT_MISMATCH';
  END IF;

  SELECT count(*) INTO v_failed_count
  FROM public.knowledge_chunks
  WHERE index_version = p_version_key
    AND source_type = 'locale_lesson'
    AND indexing_failed = true;

  IF v_failed_count <> 0 THEN
    RAISE EXCEPTION 'STAGING_FAILED_UNITS';
  END IF;

  SELECT count(*) INTO v_active_chunk_count
  FROM public.knowledge_chunks
  WHERE index_version = p_expected_active_version_key
    AND index_state = 'active'
    AND source_type = 'locale_lesson'
    AND indexing_failed = false;

  IF v_active_chunk_count <> v_active.chunk_count THEN
    RAISE EXCEPTION 'ACTIVE_VERSION_INCOMPLETE';
  END IF;

  UPDATE public.rag_index_versions
  SET status = 'superseded',
      superseded_at = now()
  WHERE version_key = p_expected_active_version_key
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACTIVE_VERSION_MISMATCH';
  END IF;

  UPDATE public.knowledge_chunks
  SET index_state = 'superseded',
      updated_at = now()
  WHERE index_version = p_expected_active_version_key
    AND index_state = 'active'
    AND source_type = 'locale_lesson';

  UPDATE public.rag_index_versions
  SET status = 'active',
      activated_at = now(),
      superseded_at = NULL,
      failure_reason = NULL
  WHERE version_key = p_version_key
    AND status = 'staging';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VERSION_NOT_STAGING';
  END IF;

  UPDATE public.knowledge_chunks
  SET index_state = 'active',
      updated_at = now()
  WHERE index_version = p_version_key
    AND index_state = 'staging'
    AND source_type = 'locale_lesson';

  RETURN jsonb_build_object(
    'ok', true,
    'versionKey', p_version_key,
    'supersededVersionKey', p_expected_active_version_key,
    'activatedChunks', v_staging_count,
    'activeVersions', 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rag_rollback_index_upgrade(
  p_active_version_key text,
  p_restore_version_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_active public.rag_index_versions%ROWTYPE;
  v_restore public.rag_index_versions%ROWTYPE;
  v_restore_count integer;
  v_active_versions integer;
BEGIN
  PERFORM public.rag_require_service_role();

  IF p_active_version_key IS NULL OR p_restore_version_key IS NULL
     OR p_active_version_key = p_restore_version_key THEN
    RAISE EXCEPTION 'INVALID_ROLLBACK_VERSIONS';
  END IF;

  SELECT * INTO v_active
  FROM public.rag_index_versions
  WHERE version_key = p_active_version_key
  FOR UPDATE;

  IF NOT FOUND OR v_active.status <> 'active' THEN
    RAISE EXCEPTION 'VERSION_NOT_ACTIVE';
  END IF;

  SELECT count(*) INTO v_active_versions
  FROM public.rag_index_versions
  WHERE status = 'active';

  IF v_active_versions <> 1 THEN
    RAISE EXCEPTION 'ACTIVE_VERSION_COUNT_INVALID';
  END IF;

  SELECT * INTO v_restore
  FROM public.rag_index_versions
  WHERE version_key = p_restore_version_key
  FOR UPDATE;

  IF NOT FOUND OR v_restore.status <> 'superseded' THEN
    RAISE EXCEPTION 'RESTORE_VERSION_NOT_SUPERSEDED';
  END IF;

  SELECT count(*) INTO v_restore_count
  FROM public.knowledge_chunks
  WHERE index_version = p_restore_version_key
    AND index_state = 'superseded'
    AND source_type = 'locale_lesson'
    AND indexing_failed = false;

  IF v_restore_count <> v_restore.chunk_count THEN
    RAISE EXCEPTION 'RESTORE_VERSION_INCOMPLETE';
  END IF;

  UPDATE public.rag_index_versions
  SET status = 'superseded',
      superseded_at = now()
  WHERE version_key = p_active_version_key
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VERSION_NOT_ACTIVE';
  END IF;

  UPDATE public.knowledge_chunks
  SET index_state = 'superseded',
      updated_at = now()
  WHERE index_version = p_active_version_key
    AND index_state = 'active'
    AND source_type = 'locale_lesson';

  UPDATE public.rag_index_versions
  SET status = 'active',
      activated_at = now(),
      superseded_at = NULL,
      failure_reason = NULL
  WHERE version_key = p_restore_version_key
    AND status = 'superseded';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESTORE_VERSION_NOT_SUPERSEDED';
  END IF;

  UPDATE public.knowledge_chunks
  SET index_state = 'active',
      updated_at = now()
  WHERE index_version = p_restore_version_key
    AND index_state = 'superseded'
    AND source_type = 'locale_lesson';

  RETURN jsonb_build_object(
    'ok', true,
    'versionKey', p_active_version_key,
    'restoredVersionKey', p_restore_version_key,
    'restoredChunks', v_restore_count,
    'activeVersions', 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rag_activate_index_upgrade(text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rag_rollback_index_upgrade(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_activate_index_upgrade(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rag_rollback_index_upgrade(text, text) TO service_role;
