
create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 8,
  p_path_id text default null,
  p_module_id text default null,
  p_lesson_id text default null,
  min_similarity float default 0.0
)
returns table (
  id uuid,
  source_type text,
  source_id text,
  path_id text,
  module_id text,
  lesson_id text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
security invoker
set search_path = public
as $$
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
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.embedding is not null
    and (p_path_id is null or kc.path_id = p_path_id)
    and (p_module_id is null or kc.module_id = p_module_id)
    and (p_lesson_id is null or kc.lesson_id = p_lesson_id)
    and (1 - (kc.embedding <=> query_embedding)) >= min_similarity
  order by kc.embedding <=> query_embedding
  limit greatest(match_count, 1)
$$;

revoke all on function public.match_knowledge_chunks(vector, int, text, text, text, float) from public;
grant execute on function public.match_knowledge_chunks(vector, int, text, text, text, float) to authenticated;
