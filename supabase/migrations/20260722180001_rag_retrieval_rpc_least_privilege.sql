-- RAG retrieval RPC least privilege: service_role only.
-- Assistant-runtime already invokes these RPCs with the service role key.
-- Ordinary authenticated browser clients must not execute corpus retrieval directly.

REVOKE ALL ON FUNCTION public.match_locale_knowledge_chunks(
  extensions.vector(1536), text, integer, text, text, text, text, double precision, boolean
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.match_locale_knowledge_chunks(
  extensions.vector(1536), text, integer, text, text, text, text, double precision, boolean
) TO service_role;

REVOKE ALL ON FUNCTION public.match_knowledge_chunks(
  extensions.vector(1536), integer, text, text, text, double precision
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(
  extensions.vector(1536), integer, text, text, text, double precision
) TO service_role;
