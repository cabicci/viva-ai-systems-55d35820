BEGIN;
-- Administrator review uses the administrator's own account ID as the scope.
-- It reads authored lessons only; child profiles, consent, and family grants stay unchanged.
DO $$ BEGIN
 EXECUTE replace(pg_get_functiondef('public.kids_can_access_lesson(uuid,text,integer,text)'::regprocedure),
  'FUNCTION public.kids_can_access_lesson(', 'FUNCTION billing.kids_previous_admin_lesson_access(');
END $$;
REVOKE ALL ON FUNCTION billing.kids_previous_admin_lesson_access(uuid,text,integer,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.kids_can_access_lesson(requested_profile uuid,requested_level text,requested_lesson integer,requested_locale text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF requested_profile=auth.uid() AND public.has_role(auth.uid(),'admin'::public.app_role) THEN
  RETURN billing.commerce_account_allowed(auth.uid())
   AND EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL)
   AND EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data AND lesson_access_enabled)
   AND EXISTS(SELECT 1 FROM public.kids_content_approvals WHERE level_id=requested_level AND lesson_number=requested_lesson AND locale=requested_locale);
 END IF;
 RETURN billing.kids_previous_admin_lesson_access(requested_profile,requested_level,requested_lesson,requested_locale);
END $$;
REVOKE ALL ON FUNCTION public.kids_can_access_lesson(uuid,text,integer,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.kids_can_access_lesson(uuid,text,integer,text) TO authenticated;
COMMIT;