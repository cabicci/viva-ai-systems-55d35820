-- Refresh the locked multilingual RAG corpus contract from 3700 to 3701 chunks.
--
-- Historical completed 3700-row sessions remain valid records. New importer
-- sessions are locked by rag_locked_provenance() to the refreshed 3701-row
-- artifacts and cannot resume or mutate the historical session because all
-- four artifact digests differ.

ALTER TABLE public.rag_import_sessions
  DROP CONSTRAINT IF EXISTS rag_import_sessions_expected_chunk_count_check;

ALTER TABLE public.rag_import_sessions
  ADD CONSTRAINT rag_import_sessions_expected_chunk_count_check
  CHECK (expected_chunk_count IN (3700, 3701));

CREATE OR REPLACE FUNCTION public.rag_locked_provenance()
RETURNS TABLE (
  source_sha text,
  index_version text,
  package_manifest_sha256 text,
  chunk_manifest_sha256 text,
  chunks_sha256 text,
  authoritative_lookup_sha256 text,
  expected_package_count integer,
  expected_chunk_count integer,
  embedding_model text,
  embedding_dimensions integer,
  max_provider_attempts integer,
  planned_batch_count integer,
  batch_size integer
)
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
  SELECT
    '3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2'::text,
    'rag-index-v1'::text,
    'e80b2be260e4895154af76215eeb6ade62be27f63b0c145fd8e77c0ca6cebe11'::text,
    '7dc02406995711193baa6dbf83d1f180f7b840555bf4a8b066e97442064e0660'::text,
    '5f66296aca20c4ddf6960bf343a3b563e9dba1eb0375c2eb1efc80d26f6c4be0'::text,
    '103a0d5c27c1020d4eeecdf72cfb1fbba63aea1787f25886f8049167b67819f4'::text,
    400,
    3701,
    'text-embedding-3-small'::text,
    1536,
    67,
    58,
    64;
$$;

REVOKE ALL ON FUNCTION public.rag_locked_provenance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_locked_provenance() TO service_role;

CREATE OR REPLACE FUNCTION public.rag_validate_staging_import()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  p record;
  v_session public.rag_import_sessions%ROWTYPE;
  v_errors text[] := ARRAY[]::text[];
  v_staging integer;
  v_active_from_importer integer;
  v_failed_index integer;
  v_completed_batches integer;
  v_legacy integer;
  v_active_versions integer;
  v_locale_eg integer;
  v_locale_msa integer;
  v_locale_gulf integer;
  v_locale_en integer;
  v_dim_bad integer;
BEGIN
  PERFORM public.rag_require_service_role();
  SELECT * INTO p FROM public.rag_locked_provenance();

  SELECT s.* INTO v_session
  FROM public.rag_import_sessions s
  WHERE s.source_sha = p.source_sha
    AND s.package_manifest_sha256 = p.package_manifest_sha256
    AND s.chunk_manifest_sha256 = p.chunk_manifest_sha256
    AND s.chunks_sha256 = p.chunks_sha256
    AND s.authoritative_lookup_sha256 = p.authoritative_lookup_sha256
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'errors', jsonb_build_array('NO_SESSION'));
  END IF;

  SELECT count(*) INTO v_completed_batches
  FROM public.rag_import_batches
  WHERE session_id = v_session.id AND status = 'completed';

  IF v_completed_batches <> p.planned_batch_count THEN
    v_errors := array_append(v_errors, 'INCOMPLETE_BATCHES');
  END IF;

  IF v_session.accepted_chunk_count <> p.expected_chunk_count THEN
    v_errors := array_append(v_errors, 'ACCEPTED_COUNT_MISMATCH');
  END IF;

  IF v_session.provider_attempt_total > p.max_provider_attempts THEN
    v_errors := array_append(v_errors, 'PROVIDER_ATTEMPTS_EXCEEDED');
  END IF;

  SELECT count(*) INTO v_staging
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson'
    AND index_version = v_session.version_key
    AND index_state = 'staging';

  IF v_staging <> p.expected_chunk_count THEN
    v_errors := array_append(v_errors, 'STAGING_COUNT_MISMATCH');
  END IF;

  SELECT count(*) INTO v_active_from_importer
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson'
    AND index_version = v_session.version_key
    AND index_state = 'active';

  IF v_active_from_importer <> 0 THEN
    v_errors := array_append(v_errors, 'IMPORTER_CREATED_ACTIVE');
  END IF;

  SELECT count(*) INTO v_failed_index
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson'
    AND index_version = v_session.version_key
    AND indexing_failed = true;

  IF v_failed_index <> 0 THEN
    v_errors := array_append(v_errors, 'INDEXING_FAILED_ROWS');
  END IF;

  SELECT
    count(*) FILTER (WHERE locale = 'ar-EG'),
    count(*) FILTER (WHERE locale = 'ar-MSA'),
    count(*) FILTER (WHERE locale = 'ar-Gulf'),
    count(*) FILTER (WHERE locale = 'en')
  INTO v_locale_eg, v_locale_msa, v_locale_gulf, v_locale_en
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson'
    AND index_version = v_session.version_key
    AND index_state = 'staging';

  IF v_locale_eg <> 1008 OR v_locale_msa <> 866 OR v_locale_gulf <> 862 OR v_locale_en <> 965 THEN
    v_errors := array_append(v_errors, 'LOCALE_TOTAL_MISMATCH');
  END IF;

  SELECT count(*) INTO v_dim_bad
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson'
    AND index_version = v_session.version_key
    AND (embedding IS NULL OR extensions.vector_dims(embedding) <> p.embedding_dimensions);

  IF v_dim_bad <> 0 THEN
    v_errors := array_append(v_errors, 'MISSING_OR_WRONG_DIMENSIONS');
  END IF;

  SELECT count(*) INTO v_legacy FROM public.knowledge_chunks WHERE source_type = 'lesson';
  SELECT count(*) INTO v_active_versions FROM public.rag_index_versions WHERE status = 'active';

  RETURN jsonb_build_object(
    'ok', coalesce(array_length(v_errors, 1), 0) = 0,
    'errors', to_jsonb(v_errors),
    'executionId', v_session.execution_id,
    'versionKey', v_session.version_key,
    'stagingChunkCount', v_staging,
    'localeChunkCounts', jsonb_build_object(
      'ar-EG', v_locale_eg,
      'ar-MSA', v_locale_msa,
      'ar-Gulf', v_locale_gulf,
      'en', v_locale_en
    ),
    'completedBatches', v_completed_batches,
    'providerAttemptTotal', v_session.provider_attempt_total,
    'legacyLessonCount', v_legacy,
    'activeVersionCount', v_active_versions,
    'sourceSha', v_session.source_sha,
    'indexVersion', v_session.index_version
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rag_validate_staging_import() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_validate_staging_import() TO service_role;
