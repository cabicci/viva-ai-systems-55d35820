-- DB-C1b: lock EXECUTE on public.consume_rate_limit to service_role only.
-- Caller identity is enforced in 20260604160000_consume_rate_limit_caller_check.sql.
-- Does not change function body, table grants, RLS policies, or other functions (DB-C2 untouched).

REVOKE ALL ON FUNCTION public.consume_rate_limit(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(UUID, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(UUID, TEXT, INTEGER, INTEGER) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.consume_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO service_role;
