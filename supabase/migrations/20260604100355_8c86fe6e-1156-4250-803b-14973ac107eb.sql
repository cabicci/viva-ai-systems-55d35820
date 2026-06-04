
-- Block non-service-role writes to user_roles to prevent privilege escalation.
CREATE POLICY "Deny insert to non-service-role"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Deny update to non-service-role"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny delete to non-service-role"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);
