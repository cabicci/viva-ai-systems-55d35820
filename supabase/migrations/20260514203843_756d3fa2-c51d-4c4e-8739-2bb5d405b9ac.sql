-- Revoke from public/anon, keep only authenticated (needed for RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;