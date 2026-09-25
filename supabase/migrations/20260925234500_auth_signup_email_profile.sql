-- Only the signed, server-side auth email handler may resolve a signup profile.
CREATE OR REPLACE FUNCTION public.auth_signup_email_profile(p_email text)
RETURNS TABLE(full_name text, preferred_locale text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.raw_user_meta_data ->> 'full_name',
         u.raw_user_meta_data ->> 'preferred_locale'
  FROM auth.users AS u
  WHERE length(p_email) BETWEEN 3 AND 320
    AND lower(u.email) = lower(trim(p_email))
  LIMIT 2;
$$;

REVOKE ALL ON FUNCTION public.auth_signup_email_profile(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_signup_email_profile(text) TO service_role;
