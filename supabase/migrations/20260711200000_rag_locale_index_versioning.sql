-- RAG locale-aware index versioning (staging / active / rollback).
-- Minimum schema for 300-package corpus indexing. Service-role writes only.

-- ---------------------------------------------------------------------------
-- Index version registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rag_index_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_key text NOT NULL UNIQUE,
  source_sha text NOT NULL,
  status text NOT NULL CHECK (status IN ('staging', 'active', 'superseded', 'failed')),
  package_count integer NOT NULL DEFAULT 0 CHECK (package_count >= 0),
  chunk_count integer NOT NULL DEFAULT 0 CHECK (chunk_count >= 0),
  chunk_manifest_checksum text NOT NULL,
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  superseded_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS rag_index_versions_one_active
  ON public.rag_index_versions ((status))
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS rag_index_versions_status_idx
  ON public.rag_index_versions (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Locale-aware chunk metadata on knowledge_chunks (nullable for legacy rows)
-- ---------------------------------------------------------------------------
ALTER TABLE public.knowledge_chunks
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS package_path text,
  ADD COLUMN IF NOT EXISTS source_sha text,
  ADD COLUMN IF NOT EXISTS package_checksum text,
  ADD COLUMN IF NOT EXISTS chunk_checksum text,
  ADD COLUMN IF NOT EXISTS content_version text,
  ADD COLUMN IF NOT EXISTS index_version text,
  ADD COLUMN IF NOT EXISTS index_state text,
  ADD COLUMN IF NOT EXISTS section_index integer,
  ADD COLUMN IF NOT EXISTS section_role text,
  ADD COLUMN IF NOT EXISTS chunk_position integer,
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS production_route text,
  ADD COLUMN IF NOT EXISTS indexing_failed boolean NOT NULL DEFAULT false;

ALTER TABLE public.knowledge_chunks
  DROP CONSTRAINT IF EXISTS knowledge_chunks_index_state_check;

ALTER TABLE public.knowledge_chunks
  ADD CONSTRAINT knowledge_chunks_index_state_check
  CHECK (index_state IS NULL OR index_state IN ('staging', 'active', 'superseded', 'failed'));

CREATE INDEX IF NOT EXISTS knowledge_chunks_locale_active_idx
  ON public.knowledge_chunks (locale, lesson_id, index_state)
  WHERE source_type = 'locale_lesson' AND index_state = 'active';

CREATE INDEX IF NOT EXISTS knowledge_chunks_index_version_state_idx
  ON public.knowledge_chunks (index_version, index_state)
  WHERE source_type = 'locale_lesson';

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_chunks_locale_version_identity
  ON public.knowledge_chunks (index_version, source_id)
  WHERE source_type = 'locale_lesson' AND index_version IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Locale-filtered retrieval (active index only)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.match_locale_knowledge_chunks(
  extensions.vector(1536), text, integer, text, text, text, text, double precision, boolean
);

CREATE OR REPLACE FUNCTION public.match_locale_knowledge_chunks(
  query_embedding extensions.vector(1536),
  p_locale text,
  match_count integer DEFAULT 8,
  p_lesson_id text DEFAULT NULL,
  p_module_id text DEFAULT NULL,
  p_path_id text DEFAULT NULL,
  p_content_version text DEFAULT NULL,
  min_similarity double precision DEFAULT 0.0,
  p_allow_module_fallback boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  source_type text,
  source_id text,
  locale text,
  path_id text,
  module_id text,
  lesson_id text,
  title text,
  content text,
  metadata jsonb,
  package_path text,
  source_sha text,
  package_checksum text,
  chunk_checksum text,
  content_version text,
  index_version text,
  section_index integer,
  section_role text,
  chunk_position integer,
  content_type text,
  production_route text,
  similarity double precision,
  same_lesson_rank integer
)
LANGUAGE sql
STABLE
SET search_path TO 'public, extensions'
AS $$
  SELECT
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.locale,
    kc.path_id,
    kc.module_id,
    kc.lesson_id,
    kc.title,
    kc.content,
    kc.metadata,
    kc.package_path,
    kc.source_sha,
    kc.package_checksum,
    kc.chunk_checksum,
    kc.content_version,
    kc.index_version,
    kc.section_index,
    kc.section_role,
    kc.chunk_position,
    kc.content_type,
    kc.production_route,
    1 - (kc.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity,
    CASE
      WHEN p_lesson_id IS NOT NULL AND kc.lesson_id = p_lesson_id THEN 0
      ELSE 1
    END AS same_lesson_rank
  FROM public.knowledge_chunks kc
  WHERE kc.source_type = 'locale_lesson'
    AND kc.index_state = 'active'
    AND kc.indexing_failed = false
    AND kc.embedding IS NOT NULL
    AND kc.locale = p_locale
    AND (p_lesson_id IS NULL OR kc.lesson_id = p_lesson_id OR p_allow_module_fallback)
    AND (
      p_lesson_id IS NULL
      OR kc.lesson_id = p_lesson_id
      OR (
        p_allow_module_fallback
        AND p_module_id IS NOT NULL
        AND kc.module_id = p_module_id
        AND kc.lesson_id IS DISTINCT FROM p_lesson_id
      )
    )
    AND (p_module_id IS NULL OR kc.module_id = p_module_id OR p_lesson_id IS NOT NULL)
    AND (p_path_id IS NULL OR kc.path_id = p_path_id OR p_lesson_id IS NOT NULL)
    AND (p_content_version IS NULL OR kc.content_version = p_content_version)
    AND (1 - (kc.embedding OPERATOR(extensions.<=>) query_embedding)) >= min_similarity
  ORDER BY
    same_lesson_rank,
    kc.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT GREATEST(match_count, 1)
$$;

REVOKE ALL ON FUNCTION public.match_locale_knowledge_chunks(
  extensions.vector(1536), text, integer, text, text, text, text, double precision, boolean
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.match_locale_knowledge_chunks(
  extensions.vector(1536), text, integer, text, text, text, text, double precision, boolean
) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Activation / rollback (service_role only, transactional)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_rag_index_version(p_version_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_version public.rag_index_versions%ROWTYPE;
  v_staging_count integer;
  v_failed_count integer;
BEGIN
  IF COALESCE(auth.role(), current_setting('role', true)) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Forbidden: service_role required';
  END IF;

  SELECT * INTO v_version
  FROM public.rag_index_versions
  WHERE version_key = p_version_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Index version not found: %', p_version_key;
  END IF;

  IF v_version.status <> 'staging' THEN
    RAISE EXCEPTION 'Only staging versions can be activated (current: %)', v_version.status;
  END IF;

  SELECT count(*) INTO v_staging_count
  FROM public.knowledge_chunks
  WHERE index_version = p_version_key
    AND index_state = 'staging'
    AND source_type = 'locale_lesson'
    AND indexing_failed = false;

  IF v_staging_count <> v_version.chunk_count THEN
    RAISE EXCEPTION 'Incomplete staging index: expected %, found %', v_version.chunk_count, v_staging_count;
  END IF;

  SELECT count(*) INTO v_failed_count
  FROM public.knowledge_chunks
  WHERE index_version = p_version_key
    AND source_type = 'locale_lesson'
    AND indexing_failed = true;

  IF v_failed_count > 0 THEN
    RAISE EXCEPTION 'Staging version has % failed units; resolve or retry before activation', v_failed_count;
  END IF;

  UPDATE public.rag_index_versions
  SET status = 'superseded', superseded_at = now()
  WHERE status = 'active';

  UPDATE public.knowledge_chunks
  SET index_state = 'superseded', updated_at = now()
  WHERE index_state = 'active' AND source_type = 'locale_lesson';

  UPDATE public.rag_index_versions
  SET status = 'active', activated_at = now()
  WHERE version_key = p_version_key;

  UPDATE public.knowledge_chunks
  SET index_state = 'active', updated_at = now()
  WHERE index_version = p_version_key
    AND index_state = 'staging'
    AND source_type = 'locale_lesson';

  RETURN jsonb_build_object(
    'ok', true,
    'version_key', p_version_key,
    'activated_chunks', v_staging_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_rag_index_version(p_version_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_target public.rag_index_versions%ROWTYPE;
  v_count integer;
BEGIN
  IF COALESCE(auth.role(), current_setting('role', true)) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Forbidden: service_role required';
  END IF;

  SELECT * INTO v_target
  FROM public.rag_index_versions
  WHERE version_key = p_version_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Index version not found: %', p_version_key;
  END IF;

  IF v_target.status <> 'superseded' THEN
    RAISE EXCEPTION 'Only superseded versions can be rolled back (current: %)', v_target.status;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.knowledge_chunks
  WHERE index_version = p_version_key
    AND source_type = 'locale_lesson'
    AND indexing_failed = false;

  IF v_count <> v_target.chunk_count THEN
    RAISE EXCEPTION 'Rollback target incomplete: expected %, found %', v_target.chunk_count, v_count;
  END IF;

  UPDATE public.rag_index_versions
  SET status = 'superseded', superseded_at = now()
  WHERE status = 'active';

  UPDATE public.knowledge_chunks
  SET index_state = 'superseded', updated_at = now()
  WHERE index_state = 'active' AND source_type = 'locale_lesson';

  UPDATE public.rag_index_versions
  SET status = 'active', activated_at = now(), superseded_at = NULL
  WHERE version_key = p_version_key;

  UPDATE public.knowledge_chunks
  SET index_state = 'active', updated_at = now()
  WHERE index_version = p_version_key
    AND source_type = 'locale_lesson'
    AND index_state = 'superseded';

  RETURN jsonb_build_object(
    'ok', true,
    'version_key', p_version_key,
    'restored_chunks', v_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_rag_index_version(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rollback_rag_index_version(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_rag_index_version(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rollback_rag_index_version(text) TO service_role;

-- ---------------------------------------------------------------------------
-- RLS on rag_index_versions (read-only for authenticated; writes via service)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rag_index_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rag_index_versions_select_authenticated ON public.rag_index_versions;
CREATE POLICY rag_index_versions_select_authenticated
  ON public.rag_index_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated.

REVOKE INSERT, UPDATE, DELETE ON public.rag_index_versions FROM anon, authenticated;
GRANT SELECT ON public.rag_index_versions TO authenticated;
GRANT ALL ON public.rag_index_versions TO service_role;

-- Preserve knowledge_chunks read policy; deny direct locale chunk mutation.
REVOKE INSERT, UPDATE, DELETE ON public.knowledge_chunks FROM anon, authenticated;
