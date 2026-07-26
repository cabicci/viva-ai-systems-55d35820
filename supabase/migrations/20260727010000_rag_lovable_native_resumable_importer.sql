-- Lovable-native resumable RAG inactive importer lifecycle.
-- Authorization: CR-RAG-LOVABLE-NATIVE-RESUMABLE-IMPORTER-20260727-01
-- Staging/inactive only. No activation. Service-role RPCs only.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Session + batch tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rag_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id text NOT NULL UNIQUE,
  version_key text NOT NULL UNIQUE,
  source_sha text NOT NULL,
  index_version text NOT NULL,
  package_manifest_sha256 text NOT NULL,
  chunk_manifest_sha256 text NOT NULL,
  chunks_sha256 text NOT NULL,
  authoritative_lookup_sha256 text NOT NULL,
  expected_package_count integer NOT NULL CHECK (expected_package_count = 400),
  expected_chunk_count integer NOT NULL CHECK (expected_chunk_count = 3700),
  embedding_model text NOT NULL CHECK (embedding_model = 'text-embedding-3-small'),
  embedding_dimensions integer NOT NULL CHECK (embedding_dimensions = 1536),
  status text NOT NULL CHECK (
    status IN ('initialized', 'running', 'completed', 'failed', 'cancelled')
  ),
  provider_attempt_total integer NOT NULL DEFAULT 0
    CHECK (provider_attempt_total >= 0 AND provider_attempt_total <= 67),
  planned_batch_count integer NOT NULL DEFAULT 58 CHECK (planned_batch_count = 58),
  accepted_chunk_count integer NOT NULL DEFAULT 0 CHECK (accepted_chunk_count >= 0),
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rag_import_sessions_one_open_provenance
  ON public.rag_import_sessions (
    source_sha,
    index_version,
    package_manifest_sha256,
    chunk_manifest_sha256,
    chunks_sha256,
    authoritative_lookup_sha256
  )
  WHERE status IN ('initialized', 'running');

CREATE TABLE IF NOT EXISTS public.rag_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.rag_import_sessions(id) ON DELETE CASCADE,
  batch_ordinal integer NOT NULL CHECK (batch_ordinal >= 0 AND batch_ordinal < 58),
  chunk_offset integer NOT NULL CHECK (chunk_offset >= 0),
  chunk_count integer NOT NULL CHECK (chunk_count > 0 AND chunk_count <= 64),
  status text NOT NULL CHECK (
    status IN ('pending', 'leased', 'completed', 'failed')
  ),
  lease_token uuid,
  lease_expires_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  accepted_row_count integer NOT NULL DEFAULT 0 CHECK (accepted_row_count >= 0),
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, batch_ordinal)
);

CREATE INDEX IF NOT EXISTS rag_import_batches_session_status_idx
  ON public.rag_import_batches (session_id, status, batch_ordinal);

ALTER TABLE public.rag_import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_import_batches ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.rag_import_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.rag_import_batches FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_require_service_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
BEGIN
  IF COALESCE(auth.role(), current_setting('role', true)) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Forbidden: service_role required';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rag_require_service_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_require_service_role() TO service_role;

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
    '0ca5afee1c9e7ade676553cc51e3a0dd55515508a54f046dde098826b5fb510e'::text,
    '3bfb0d1a04053adc6da5580283dd14d54ade85e079dcac12ceddf5ed1ef1faca'::text,
    '24a7ae7af60db811fab63b52604d79bc18fb5d82dd14e99e687e90a6dea216ca'::text,
    '6f3bad994c0d0bb8b2a92fcc3d1e729cd98bab685d68e882dab7d69c7c910f8b'::text,
    400,
    3700,
    'text-embedding-3-small'::text,
    1536,
    67,
    58,
    64;
$$;

REVOKE ALL ON FUNCTION public.rag_locked_provenance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_locked_provenance() TO service_role;

-- ---------------------------------------------------------------------------
-- 1. initialize / resume
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_initialize_or_resume_import()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  p record;
  v_session public.rag_import_sessions%ROWTYPE;
  v_exec text;
  v_material text;
  v_digest16 text;
  v_version_key text;
  v_i integer;
  v_offset integer;
  v_count integer;
BEGIN
  PERFORM public.rag_require_service_role();
  PERFORM pg_advisory_xact_lock(hashtext('rag_lovable_native_import'));

  SELECT * INTO p FROM public.rag_locked_provenance();

  SELECT s.* INTO v_session
  FROM public.rag_import_sessions s
  WHERE s.status IN ('initialized', 'running')
    AND s.source_sha = p.source_sha
    AND s.index_version = p.index_version
    AND s.package_manifest_sha256 = p.package_manifest_sha256
    AND s.chunk_manifest_sha256 = p.chunk_manifest_sha256
    AND s.chunks_sha256 = p.chunks_sha256
    AND s.authoritative_lookup_sha256 = p.authoritative_lookup_sha256
  ORDER BY s.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'resumed', true,
      'executionId', v_session.execution_id,
      'versionKey', v_session.version_key,
      'status', v_session.status,
      'providerAttemptTotal', v_session.provider_attempt_total,
      'acceptedChunkCount', v_session.accepted_chunk_count,
      'plannedBatchCount', v_session.planned_batch_count
    );
  END IF;

  v_exec := 'rag-lovable-' || replace(gen_random_uuid()::text, '-', '');
  v_material := p.index_version || '|' || p.source_sha || '|' ||
    p.package_manifest_sha256 || '|' || p.chunk_manifest_sha256 || '|' || v_exec;
  v_digest16 := substr(encode(extensions.digest(convert_to(v_material, 'UTF8'), 'sha256'), 'hex'), 1, 16);
  v_version_key := p.index_version || '-' || substr(p.source_sha, 1, 8) || '-' || v_digest16;

  INSERT INTO public.rag_index_versions (
    version_key, source_sha, status, package_count, chunk_count,
    chunk_manifest_checksum, embedding_model
  ) VALUES (
    v_version_key, p.source_sha, 'staging', p.expected_package_count, p.expected_chunk_count,
    p.chunk_manifest_sha256, p.embedding_model
  );

  INSERT INTO public.rag_import_sessions (
    execution_id, version_key, source_sha, index_version,
    package_manifest_sha256, chunk_manifest_sha256, chunks_sha256, authoritative_lookup_sha256,
    expected_package_count, expected_chunk_count, embedding_model, embedding_dimensions,
    status, planned_batch_count
  ) VALUES (
    v_exec, v_version_key, p.source_sha, p.index_version,
    p.package_manifest_sha256, p.chunk_manifest_sha256, p.chunks_sha256, p.authoritative_lookup_sha256,
    p.expected_package_count, p.expected_chunk_count, p.embedding_model, p.embedding_dimensions,
    'initialized', p.planned_batch_count
  )
  RETURNING * INTO v_session;

  FOR v_i IN 0..(p.planned_batch_count - 1) LOOP
    v_offset := v_i * p.batch_size;
    IF v_i < p.planned_batch_count - 1 THEN
      v_count := p.batch_size;
    ELSE
      v_count := p.expected_chunk_count - v_offset;
    END IF;
    INSERT INTO public.rag_import_batches (
      session_id, batch_ordinal, chunk_offset, chunk_count, status
    ) VALUES (
      v_session.id, v_i, v_offset, v_count, 'pending'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'resumed', false,
    'executionId', v_session.execution_id,
    'versionKey', v_session.version_key,
    'status', v_session.status,
    'providerAttemptTotal', 0,
    'acceptedChunkCount', 0,
    'plannedBatchCount', p.planned_batch_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rag_initialize_or_resume_import() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_initialize_or_resume_import() TO service_role;

-- ---------------------------------------------------------------------------
-- 2. status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_get_import_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  p record;
  v_session public.rag_import_sessions%ROWTYPE;
  v_completed integer;
  v_pending integer;
  v_failed integer;
  v_next integer;
  v_active text;
  v_legacy integer;
  v_locale integer;
BEGIN
  PERFORM public.rag_require_service_role();
  SELECT * INTO p from public.rag_locked_provenance();

  SELECT s.* INTO v_session
  FROM public.rag_import_sessions s
  WHERE s.source_sha = p.source_sha
    AND s.index_version = p.index_version
    AND s.package_manifest_sha256 = p.package_manifest_sha256
    AND s.chunk_manifest_sha256 = p.chunk_manifest_sha256
    AND s.chunks_sha256 = p.chunks_sha256
    AND s.authoritative_lookup_sha256 = p.authoritative_lookup_sha256
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'session', null);
  END IF;

  SELECT
    count(*) FILTER (WHERE status = 'completed'),
    count(*) FILTER (WHERE status IN ('pending', 'leased', 'failed')),
    count(*) FILTER (WHERE status = 'failed')
  INTO v_completed, v_pending, v_failed
  FROM public.rag_import_batches
  WHERE session_id = v_session.id;

  SELECT min(batch_ordinal) INTO v_next
  FROM public.rag_import_batches
  WHERE session_id = v_session.id
    AND status IN ('pending', 'failed', 'leased')
    AND (status <> 'leased' OR lease_expires_at IS NULL OR lease_expires_at < now());

  SELECT version_key INTO v_active
  FROM public.rag_index_versions
  WHERE status = 'active'
  LIMIT 1;

  SELECT count(*) INTO v_legacy
  FROM public.knowledge_chunks
  WHERE source_type = 'lesson';

  SELECT count(*) INTO v_locale
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson';

  RETURN jsonb_build_object(
    'ok', true,
    'executionId', v_session.execution_id,
    'stagingVersionKey', v_session.version_key,
    'sessionState', v_session.status,
    'completedBatchCount', coalesce(v_completed, 0),
    'pendingBatchCount', coalesce(v_pending, 0),
    'failedBatchCount', coalesce(v_failed, 0),
    'acceptedChunkCount', v_session.accepted_chunk_count,
    'providerAttemptCount', v_session.provider_attempt_total,
    'nextBatchOrdinal', v_next,
    'currentActiveVersionKey', v_active,
    'legacyLessonCount', coalesce(v_legacy, 0),
    'localeLessonCount', coalesce(v_locale, 0),
    'lastErrorCode', v_session.last_error_code,
    'plannedBatchCount', v_session.planned_batch_count,
    'maxProviderAttempts', p.max_provider_attempts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rag_get_import_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_get_import_status() TO service_role;

-- ---------------------------------------------------------------------------
-- 3. claim next batch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_claim_next_import_batch()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  p record;
  v_session public.rag_import_sessions%ROWTYPE;
  v_batch public.rag_import_batches%ROWTYPE;
  v_token uuid;
BEGIN
  PERFORM public.rag_require_service_role();
  PERFORM pg_advisory_xact_lock(hashtext('rag_lovable_native_import_claim'));
  SELECT * INTO p from public.rag_locked_provenance();

  SELECT s.* INTO v_session
  FROM public.rag_import_sessions s
  WHERE s.status IN ('initialized', 'running')
    AND s.source_sha = p.source_sha
    AND s.index_version = p.index_version
    AND s.package_manifest_sha256 = p.package_manifest_sha256
    AND s.chunk_manifest_sha256 = p.chunk_manifest_sha256
    AND s.chunks_sha256 = p.chunks_sha256
    AND s.authoritative_lookup_sha256 = p.authoritative_lookup_sha256
  ORDER BY s.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_SESSION';
  END IF;

  IF v_session.provider_attempt_total >= p.max_provider_attempts THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_CEILING';
  END IF;

  SELECT b.* INTO v_batch
  FROM public.rag_import_batches b
  WHERE b.session_id = v_session.id
    AND (
      b.status IN ('pending', 'failed')
      OR (b.status = 'leased' AND (b.lease_expires_at IS NULL OR b.lease_expires_at < now()))
    )
  ORDER BY b.batch_ordinal
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'done', true, 'executionId', v_session.execution_id, 'versionKey', v_session.version_key);
  END IF;

  UPDATE public.rag_import_sessions
  SET provider_attempt_total = provider_attempt_total + 1,
      status = 'running',
      updated_at = now()
  WHERE id = v_session.id
    AND provider_attempt_total < p.max_provider_attempts
  RETURNING * INTO v_session;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROVIDER_ATTEMPT_CEILING';
  END IF;

  v_token := gen_random_uuid();
  UPDATE public.rag_import_batches
  SET status = 'leased',
      lease_token = v_token,
      lease_expires_at = now() + interval '15 minutes',
      attempt_count = attempt_count + 1,
      updated_at = now()
  WHERE id = v_batch.id
  RETURNING * INTO v_batch;

  RETURN jsonb_build_object(
    'ok', true,
    'done', false,
    'executionId', v_session.execution_id,
    'versionKey', v_session.version_key,
    'batchOrdinal', v_batch.batch_ordinal,
    'chunkOffset', v_batch.chunk_offset,
    'chunkCount', v_batch.chunk_count,
    'leaseToken', v_token,
    'providerAttemptTotal', v_session.provider_attempt_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rag_claim_next_import_batch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_claim_next_import_batch() TO service_role;

-- ---------------------------------------------------------------------------
-- 4. commit batch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_commit_import_batch(
  p_lease_token uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  p record;
  v_batch public.rag_import_batches%ROWTYPE;
  v_session public.rag_import_sessions%ROWTYPE;
  v_row jsonb;
  v_idx integer := 0;
  v_emb extensions.vector(1536);
  v_locale text;
  v_source_id text;
BEGIN
  PERFORM public.rag_require_service_role();
  SELECT * INTO p from public.rag_locked_provenance();

  IF p_lease_token IS NULL THEN
    RAISE EXCEPTION 'MISSING_LEASE';
  END IF;

  SELECT b.* INTO v_batch
  FROM public.rag_import_batches b
  WHERE b.lease_token = p_lease_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_LEASE';
  END IF;

  IF v_batch.status = 'completed' THEN
    SELECT * INTO v_session FROM public.rag_import_sessions WHERE id = v_batch.session_id;
    RETURN jsonb_build_object(
      'ok', true,
      'alreadyCompleted', true,
      'batchOrdinal', v_batch.batch_ordinal,
      'acceptedRowCount', v_batch.accepted_row_count,
      'executionId', v_session.execution_id,
      'versionKey', v_session.version_key
    );
  END IF;

  IF v_batch.status <> 'leased' OR v_batch.lease_expires_at < now() THEN
    RAISE EXCEPTION 'LEASE_EXPIRED';
  END IF;

  SELECT * INTO v_session
  FROM public.rag_import_sessions
  WHERE id = v_batch.session_id
  FOR UPDATE;

  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) <> v_batch.chunk_count THEN
    RAISE EXCEPTION 'ROW_COUNT_MISMATCH';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_source_id := v_row->>'sourceId';
    v_locale := v_row->>'locale';

    IF coalesce(v_row->>'sourceType', '') <> 'locale_lesson' THEN
      RAISE EXCEPTION 'INVALID_SOURCE_TYPE';
    END IF;
    IF coalesce(v_row->>'indexState', '') <> 'staging' THEN
      RAISE EXCEPTION 'INVALID_INDEX_STATE';
    END IF;
    IF coalesce(v_row->>'indexVersion', '') <> v_session.version_key THEN
      RAISE EXCEPTION 'WRONG_VERSION';
    END IF;
    IF coalesce(v_row->>'sourceSha', '') <> p.source_sha THEN
      RAISE EXCEPTION 'WRONG_SOURCE_SHA';
    END IF;
    IF v_locale NOT IN ('ar-EG', 'ar-MSA', 'ar-Gulf', 'en') THEN
      RAISE EXCEPTION 'UNEXPECTED_LOCALE';
    END IF;
    IF jsonb_typeof(v_row->'embedding') <> 'array'
       OR jsonb_array_length(v_row->'embedding') <> 1536 THEN
      RAISE EXCEPTION 'WRONG_DIMENSIONS';
    END IF;

    SELECT ARRAY(
      SELECT (elem)::double precision
      FROM jsonb_array_elements_text(v_row->'embedding') AS elem
    )::extensions.vector(1536)
    INTO v_emb;

    INSERT INTO public.knowledge_chunks (
      source_type, source_id, path_id, module_id, lesson_id, title, content,
      embedding, locale, package_path, source_sha, package_checksum, chunk_checksum,
      content_version, index_version, index_state, section_index, section_role,
      chunk_position, content_type, production_route, indexing_failed
    ) VALUES (
      'locale_lesson',
      v_source_id,
      v_row->>'pathId',
      v_row->>'moduleId',
      v_row->>'lessonId',
      left(coalesce(v_row->>'title', ''), 500),
      coalesce(v_row->>'content', ''),
      v_emb,
      v_locale,
      v_row->>'packagePath',
      p.source_sha,
      v_row->>'packageChecksum',
      v_row->>'chunkChecksum',
      nullif(v_row->>'contentVersion', ''),
      v_session.version_key,
      'staging',
      NULLIF(v_row->>'sectionIndex', '')::integer,
      v_row->>'sectionRole',
      NULLIF(v_row->>'chunkPosition', '')::integer,
      v_row->>'contentType',
      nullif(v_row->>'productionRoute', ''),
      false
    )
    ON CONFLICT (index_version, source_id)
      WHERE source_type = 'locale_lesson' AND index_version IS NOT NULL
      DO NOTHING;

    v_idx := v_idx + 1;
  END LOOP;

  UPDATE public.rag_import_batches
  SET status = 'completed',
      accepted_row_count = v_batch.chunk_count,
      lease_token = NULL,
      lease_expires_at = NULL,
      last_error_code = NULL,
      updated_at = now()
  WHERE id = v_batch.id;

  UPDATE public.rag_import_sessions
  SET accepted_chunk_count = accepted_chunk_count + v_batch.chunk_count,
      updated_at = now(),
      status = CASE
        WHEN (
          SELECT count(*) FROM public.rag_import_batches
          WHERE session_id = v_session.id AND status = 'completed'
        ) = v_session.planned_batch_count THEN 'completed'
        ELSE 'running'
      END
  WHERE id = v_session.id
  RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'ok', true,
    'alreadyCompleted', false,
    'batchOrdinal', v_batch.batch_ordinal,
    'acceptedRowCount', v_batch.chunk_count,
    'executionId', v_session.execution_id,
    'versionKey', v_session.version_key,
    'sessionAcceptedChunkCount', v_session.accepted_chunk_count,
    'sessionStatus', v_session.status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rag_commit_import_batch(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_commit_import_batch(uuid, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. fail batch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_fail_import_batch(
  p_lease_token uuid,
  p_error_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_batch public.rag_import_batches%ROWTYPE;
  v_code text;
BEGIN
  PERFORM public.rag_require_service_role();
  v_code := left(coalesce(nullif(trim(p_error_code), ''), 'PROVIDER_FAILED'), 64);

  SELECT b.* INTO v_batch
  FROM public.rag_import_batches b
  WHERE b.lease_token = p_lease_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_LEASE';
  END IF;

  IF v_batch.status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'alreadyCompleted', true, 'batchOrdinal', v_batch.batch_ordinal);
  END IF;

  UPDATE public.rag_import_batches
  SET status = 'failed',
      lease_token = NULL,
      lease_expires_at = NULL,
      last_error_code = v_code,
      updated_at = now()
  WHERE id = v_batch.id;

  UPDATE public.rag_import_sessions
  SET last_error_code = v_code,
      updated_at = now()
  WHERE id = v_batch.session_id;

  RETURN jsonb_build_object('ok', true, 'alreadyCompleted', false, 'batchOrdinal', v_batch.batch_ordinal, 'errorCode', v_code);
END;
$$;

REVOKE ALL ON FUNCTION public.rag_fail_import_batch(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_fail_import_batch(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. validate staging
-- ---------------------------------------------------------------------------
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
  SELECT * INTO p from public.rag_locked_provenance();

  SELECT s.* INTO v_session
  FROM public.rag_import_sessions s
  WHERE s.source_sha = p.source_sha
    AND s.package_manifest_sha256 = p.package_manifest_sha256
    AND s.chunk_manifest_sha256 = p.chunk_manifest_sha256
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'errors', jsonb_build_array('NO_SESSION'));
  END IF;

  SELECT count(*) INTO v_completed_batches
  FROM public.rag_import_batches
  WHERE session_id = v_session.id AND status = 'completed';

  IF v_completed_batches <> 58 THEN
    v_errors := array_append(v_errors, 'INCOMPLETE_BATCHES');
  END IF;

  IF v_session.accepted_chunk_count <> 3700 THEN
    v_errors := array_append(v_errors, 'ACCEPTED_COUNT_MISMATCH');
  END IF;

  IF v_session.provider_attempt_total > 67 THEN
    v_errors := array_append(v_errors, 'PROVIDER_ATTEMPTS_EXCEEDED');
  END IF;

  SELECT count(*) INTO v_staging
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson'
    AND index_version = v_session.version_key
    AND index_state = 'staging';

  IF v_staging <> 3700 THEN
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

  IF v_locale_eg <> 1008 OR v_locale_msa <> 866 OR v_locale_gulf <> 862 OR v_locale_en <> 964 THEN
    v_errors := array_append(v_errors, 'LOCALE_TOTAL_MISMATCH');
  END IF;

  SELECT count(*) INTO v_dim_bad
  FROM public.knowledge_chunks
  WHERE source_type = 'locale_lesson'
    AND index_version = v_session.version_key
    AND (embedding IS NULL OR extensions.vector_dims(embedding) <> 1536);

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

-- ---------------------------------------------------------------------------
-- 7. evidence
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_get_import_evidence()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_status jsonb;
  v_validation jsonb;
BEGIN
  PERFORM public.rag_require_service_role();
  v_status := public.rag_get_import_status();
  BEGIN
    v_validation := public.rag_validate_staging_import();
  EXCEPTION WHEN OTHERS THEN
    v_validation := jsonb_build_object('ok', false, 'errors', jsonb_build_array('VALIDATION_UNAVAILABLE'));
  END;
  RETURN jsonb_build_object(
    'ok', true,
    'status', v_status,
    'validation', v_validation,
    'activationEnabled', false,
    'rollbackEnabled', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rag_get_import_evidence() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_get_import_evidence() TO service_role;

-- ---------------------------------------------------------------------------
-- 8. optional first-activation reversal (service_role; not invoked in this PR)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rag_deactivate_first_active_version(p_version_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_active public.rag_index_versions%ROWTYPE;
  v_superseded integer;
BEGIN
  PERFORM public.rag_require_service_role();

  SELECT count(*) INTO v_superseded
  FROM public.rag_index_versions
  WHERE status = 'superseded';

  IF v_superseded <> 0 THEN
    RAISE EXCEPTION 'PRIOR_SUPERSEDED_EXISTS';
  END IF;

  SELECT * INTO v_active
  FROM public.rag_index_versions
  WHERE version_key = p_version_key AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VERSION_NOT_ACTIVE';
  END IF;

  UPDATE public.knowledge_chunks
  SET index_state = 'failed'
  WHERE index_version = p_version_key
    AND source_type = 'locale_lesson'
    AND index_state = 'active';

  UPDATE public.rag_index_versions
  SET status = 'failed',
      failure_reason = 'first_activation_reversed',
      superseded_at = now()
  WHERE version_key = p_version_key;

  RETURN jsonb_build_object('ok', true, 'versionKey', p_version_key, 'activeVersions', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.rag_deactivate_first_active_version(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rag_deactivate_first_active_version(text) TO service_role;
