DROP FUNCTION IF EXISTS public.match_knowledge_chunks(extensions.vector, integer, text, text, text, double precision);

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_count integer DEFAULT 8,
  p_path_id text DEFAULT NULL,
  p_module_id text DEFAULT NULL,
  p_lesson_id text DEFAULT NULL,
  min_similarity double precision DEFAULT 0.0
)
RETURNS TABLE (
  id uuid,
  source_type text,
  source_id text,
  path_id text,
  module_id text,
  lesson_id text,
  title text,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql
STABLE
SET search_path TO 'public, extensions'
AS $$
  select
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.path_id,
    kc.module_id,
    kc.lesson_id,
    kc.title,
    kc.content,
    kc.metadata,
    1 - (kc.embedding OPERATOR(extensions.<=>) query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.embedding is not null
    and (p_path_id is null or kc.path_id = p_path_id)
    and (p_module_id is null or kc.module_id = p_module_id)
    and (p_lesson_id is null or kc.lesson_id = p_lesson_id)
    and (1 - (kc.embedding OPERATOR(extensions.<=>) query_embedding)) >= min_similarity
  order by kc.embedding OPERATOR(extensions.<=>) query_embedding
  limit greatest(match_count, 1)
$$;