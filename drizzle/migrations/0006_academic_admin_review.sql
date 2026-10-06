BEGIN;
ALTER TABLE public.academic_courses ADD COLUMN review_enabled boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.academic_review_allowed(p_course text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND billing.commerce_account_allowed(auth.uid())
 AND public.has_role(auth.uid(),'admin'::public.app_role)
 AND EXISTS(SELECT 1 FROM public.academic_courses WHERE id=p_course AND review_enabled);
$$;
REVOKE ALL ON FUNCTION public.academic_review_allowed(text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.academic_review_allowed(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.academic_catalogue(p_locale text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'ACADEMIC_INVALID_LOCALE'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'title',c.titles->>p_locale,'reviewOnly',public.academic_review_allowed(c.id),'released',c.enabled,
  'lessons',(SELECT jsonb_agg(jsonb_build_object('id',l.lesson_id,'title',l.payload->>'title',
    'moduleId',regexp_replace(l.lesson_id,'-L[0-9]{2}$',''),'position',l.position,'introductory',l.introductory) ORDER BY l.position)
   FROM public.academic_lesson_content l WHERE l.course_id=c.id AND l.locale=p_locale AND (l.approved OR public.academic_review_allowed(c.id)))) ORDER BY c.id)
  FROM public.academic_courses c WHERE (c.enabled OR public.academic_review_allowed(c.id)) AND EXISTS(SELECT 1 FROM public.academic_lesson_content l
   WHERE l.course_id=c.id AND l.locale=p_locale AND (l.approved OR public.academic_review_allowed(c.id)))),'[]'::jsonb);
END $$;

DO $$ BEGIN
 EXECUTE replace(pg_get_functiondef('public.academic_can_access(text,text,text)'::regprocedure),
 'FUNCTION public.academic_can_access(', 'FUNCTION billing.academic_published_can_access(');
END $$;
REVOKE ALL ON FUNCTION billing.academic_published_can_access(text,text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.academic_published_can_access(p_course,p_lesson,p_locale)
 OR (public.academic_review_allowed(p_course) AND EXISTS(
 SELECT 1 FROM public.academic_lesson_content WHERE course_id=p_course AND lesson_id=p_lesson AND locale=p_locale));
$$;
-- Extend the same lesson command; keep grading, output whitelists and progress behavior intact.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.academic_command(text,text,text,text,jsonb)'::regprocedure);
 IF position('WHERE id=p_course AND enabled' IN d)=0
 OR position('AND locale=p_locale AND approved' IN d)=0 THEN RAISE EXCEPTION 'ACADEMIC_REVIEW_COMMAND_CHANGED'; END IF;
 d:=replace(d,'WHERE id=p_course AND enabled','WHERE id=p_course AND (enabled OR public.academic_review_allowed(p_course))');
 d:=replace(d,'AND locale=p_locale AND approved','AND locale=p_locale AND (approved OR public.academic_review_allowed(p_course))');
 d:=replace(d,'''allowed'',true,''lesson'',payload','''allowed'',true,''reviewOnly'',public.academic_review_allowed(p_course),''lesson'',payload');
 EXECUTE d;
END $$;
COMMIT;