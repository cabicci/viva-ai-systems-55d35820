-- Security Phase 1A: close direct PostgREST INSERT on client_error_logs.
-- Application writes stay on service_role only (logClientError via supabaseAdmin).
-- SELECT policies and admin read logic are unchanged.

DROP POLICY IF EXISTS "anon can insert anonymous error logs" ON public.client_error_logs;
DROP POLICY IF EXISTS "authenticated can insert own error logs" ON public.client_error_logs;
DROP POLICY IF EXISTS "anyone can insert error logs" ON public.client_error_logs;

REVOKE INSERT ON public.client_error_logs FROM anon, authenticated;
