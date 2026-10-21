-- REVIEW ONLY. Ship with the native executor change; no provider or activation calls.
-- Completed historical import sessions and their frozen limits remain untouched.
BEGIN;
CREATE FUNCTION public.rag_reusable_embeddings(p_requests jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 IF p_requests IS NULL OR jsonb_typeof(p_requests)<>'array' THEN
  RAISE EXCEPTION 'INVALID_REUSE_REQUEST';
 END IF;
 IF jsonb_array_length(p_requests)<1 OR jsonb_array_length(p_requests)>64 THEN
  RAISE EXCEPTION 'INVALID_REUSE_REQUEST';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_requests) r WHERE
   jsonb_typeof(r)<>'object' OR
   jsonb_typeof(r->'chunkId') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'pathId') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'lessonId') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'locale') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'checksum') IS DISTINCT FROM 'string' OR
   coalesce(r->>'chunkId','')='' OR length(r->>'chunkId')>500 OR
   coalesce(r->>'pathId','')!~'^[a-z0-9-]{1,80}$' OR
   coalesce(r->>'lessonId','')!~'^[a-z0-9-]{1,160}$' OR
   coalesce(r->>'locale','') NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') OR
   coalesce(r->>'checksum','')!~'^[a-f0-9]{64}$') THEN
  RAISE EXCEPTION 'INVALID_REUSE_REQUEST';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'chunkId',requested->>'chunkId','pathId',kc.path_id,'lessonId',kc.lesson_id,
   'content',kc.content,'chunkChecksum',kc.chunk_checksum,'embedding',kc.embedding::text,
   'locale',kc.locale,'model',v.embedding_model,'dimensions',extensions.vector_dims(kc.embedding),
   'sourceSha',kc.source_sha,'registrySourceSha',v.source_sha,
   'indexState',kc.index_state,'versionStatus',v.status,'indexingFailed',kc.indexing_failed
  )), '[]'::jsonb) INTO result
 FROM jsonb_array_elements(p_requests) requested
 JOIN public.knowledge_chunks kc ON kc.path_id=requested->>'pathId'
  AND kc.lesson_id=requested->>'lessonId' AND kc.locale=requested->>'locale'
  AND kc.chunk_checksum=requested->>'checksum'
 JOIN public.rag_index_versions v ON v.version_key=kc.index_version
 WHERE kc.source_type='locale_lesson' AND kc.index_state='active' AND v.status='active'
  AND kc.indexing_failed=false AND kc.source_sha=v.source_sha
  AND kc.embedding IS NOT NULL AND extensions.vector_dims(kc.embedding)=1536
  AND v.embedding_model='text-embedding-3-small';
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.rag_reusable_embeddings(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rag_reusable_embeddings(jsonb) TO service_role;
COMMIT;
