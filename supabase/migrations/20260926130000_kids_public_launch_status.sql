-- Public readiness signal only. The private release tables remain inaccessible to clients.
CREATE FUNCTION public.kids_public_launch_open()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kids_release_control control
    WHERE control.singleton AND control.accepts_child_data AND control.lesson_access_enabled
      AND EXISTS (
        SELECT 1 FROM public.kids_market_release market
        WHERE market.accepts_child_data
          AND EXISTS (
            SELECT 1 FROM public.kids_consent_policies policy
            WHERE policy.country_code = market.country_code AND policy.enabled
          )
      )
  );
$$;
REVOKE ALL ON FUNCTION public.kids_public_launch_open() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kids_public_launch_open() TO anon, authenticated;
