-- Wipe all existing knowledge_chunks. They use an old lesson_id naming scheme
-- (e.g. "llm-introduction", "agent", "rag") that no longer matches any
-- lesson_id in the current curriculum (which uses {path}-{module}-{slug}
-- like "builder-m1-what-is-llm"). The seeding script will repopulate fresh
-- chunks for all 95 current lessons with correct lesson_id / path_id / module_id.
DELETE FROM public.knowledge_chunks;

-- Grant DELETE to service_role so future re-seeds can wipe via SUPABASE_DB_URL
-- (sandbox_exec role inherits from service_role).
GRANT DELETE ON public.knowledge_chunks TO service_role;