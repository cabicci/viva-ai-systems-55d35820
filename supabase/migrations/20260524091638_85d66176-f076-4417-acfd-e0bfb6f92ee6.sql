REVOKE EXECUTE ON FUNCTION public.record_user_activity() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_user_activity() FROM anon;
GRANT EXECUTE ON FUNCTION public.record_user_activity() TO authenticated;