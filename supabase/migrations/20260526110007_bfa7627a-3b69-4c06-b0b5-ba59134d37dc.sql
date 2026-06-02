
-- Lock down SECURITY DEFINER functions: only authenticated users can call them.
REVOKE EXECUTE ON FUNCTION public.delete_my_account_data() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_user_activity_time(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_user_activity() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_active_device(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.delete_my_account_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_activity_time(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_user_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_active_device(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
