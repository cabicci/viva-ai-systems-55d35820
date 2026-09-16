-- Keep the production RAG cutover atomic while allowing the guarded RPCs enough
-- time to update both index versions. PostgREST requests otherwise inherit the
-- authenticator role's 8-second statement timeout.
--
-- This is deliberately function-scoped: it does not relax the timeout for any
-- role, database, or unrelated request.

ALTER FUNCTION public.rag_activate_index_upgrade(text, text)
  SET statement_timeout TO '60s';

ALTER FUNCTION public.rag_rollback_index_upgrade(text, text)
  SET statement_timeout TO '60s';

