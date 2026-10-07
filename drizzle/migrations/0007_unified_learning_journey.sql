-- Resume bookmarks only. Completion remains in the existing product tables.
CREATE TABLE public.journey_visits (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 line text NOT NULL CHECK (line IN ('ai','technical','academic','kids')),
 course_id text NOT NULL CHECK (length(course_id) BETWEEN 1 AND 80),
 subject_id uuid NOT NULL,
 profile_id uuid REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
 lesson_id text NOT NULL CHECK (length(lesson_id) BETWEEN 1 AND 160),
 locale text NOT NULL CHECK (locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 visited_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,line,course_id,subject_id),
 CHECK ((line='kids' AND profile_id IS NOT NULL AND subject_id=profile_id)
  OR (line<>'kids' AND profile_id IS NULL AND subject_id=user_id))
);
ALTER TABLE public.journey_visits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.journey_visits FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.journey_visits TO authenticated;
GRANT ALL ON public.journey_visits TO service_role;
CREATE POLICY lc09_active_account ON public.journey_visits AS RESTRICTIVE FOR ALL TO authenticated
 USING (public.lc09_account_active()) WITH CHECK (public.lc09_account_active());
CREATE TRIGGER lc09_journey_write BEFORE INSERT OR UPDATE ON public.journey_visits
 FOR EACH ROW EXECUTE FUNCTION billing.lc09_block_learner_write();
-- Join the existing explicit erasure inventory. Its user-scoped deletion loop
-- removes bookmarks before auth deletion; unknown future tables still fail closed.
DO $$ DECLARE d text; marker text:='''academic_progress'''; BEGIN
 d:=pg_get_functiondef('public.commerce_previous_lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 IF position(marker IN d)=0 THEN RAISE EXCEPTION 'JOURNEY_DELETION_CONTRACT_CHANGED'; END IF;
 EXECUTE replace(d,marker,marker||',''journey_visits''');
END $$;
CREATE POLICY journey_owner_read ON public.journey_visits FOR SELECT TO authenticated
 USING (user_id=(SELECT auth.uid()) AND (profile_id IS NULL OR
 (public.kids_parent_can_manage_profiles() AND EXISTS(SELECT 1 FROM public.kids_profiles p WHERE p.id=profile_id AND p.parent_id=(SELECT auth.uid())))));
CREATE POLICY journey_owner_insert ON public.journey_visits FOR INSERT TO authenticated
 WITH CHECK (user_id=(SELECT auth.uid()) AND (profile_id IS NULL OR
 (public.kids_parent_can_manage_profiles() AND EXISTS(SELECT 1 FROM public.kids_profiles p WHERE p.id=profile_id AND p.parent_id=(SELECT auth.uid()) AND p.level_id=course_id))));
CREATE POLICY journey_owner_update ON public.journey_visits FOR UPDATE TO authenticated
 USING (user_id=(SELECT auth.uid()))
 WITH CHECK (user_id=(SELECT auth.uid()) AND (profile_id IS NULL OR
 (public.kids_parent_can_manage_profiles() AND EXISTS(SELECT 1 FROM public.kids_profiles p WHERE p.id=profile_id AND p.parent_id=(SELECT auth.uid()) AND p.level_id=course_id))));
CREATE SCHEMA IF NOT EXISTS learning_private;
REVOKE ALL ON SCHEMA learning_private FROM PUBLIC;
GRANT USAGE ON SCHEMA learning_private TO authenticated;
CREATE FUNCTION learning_private.stamp_visit() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$ BEGIN NEW.visited_at:=clock_timestamp(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION learning_private.stamp_visit() FROM PUBLIC;
CREATE TRIGGER journey_visit_time BEFORE INSERT OR UPDATE ON public.journey_visits
 FOR EACH ROW EXECUTE FUNCTION learning_private.stamp_visit();

-- An explicit learner/guardian completion mark, not a quiz/mastery result.
-- Admin preview must never create a child or write a child's completion.
CREATE FUNCTION learning_private.complete_kids_step(p_profile uuid,p_level text,p_lesson integer,p_locale text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.kids_profiles p
  WHERE p.id=p_profile AND p.parent_id=auth.uid() AND p.level_id=p_level)
  OR NOT coalesce(public.kids_can_access_lesson(p_profile,p_level,p_lesson,p_locale),false)
 THEN RAISE EXCEPTION 'KIDS_ACCESS_REQUIRED'; END IF;
 INSERT INTO public.kids_lesson_progress(profile_id,level_id,lesson_number,locale)
 VALUES(p_profile,p_level,p_lesson,p_locale) ON CONFLICT DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION learning_private.complete_kids_step(uuid,text,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION learning_private.complete_kids_step(uuid,text,integer,text) TO authenticated;
CREATE FUNCTION public.complete_kids_step(p_profile uuid,p_level text,p_lesson integer,p_locale text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT learning_private.complete_kids_step(p_profile,p_level,p_lesson,p_locale);
$$;
REVOKE ALL ON FUNCTION public.complete_kids_step(uuid,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_kids_step(uuid,text,integer,text) TO authenticated;
CREATE FUNCTION learning_private.kids_journey(p_profile uuid,p_locale text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_level text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.kids_parent_can_manage_profiles() THEN RAISE EXCEPTION 'KIDS_ACCESS_REQUIRED'; END IF;
 SELECT level_id INTO v_level FROM public.kids_profiles WHERE id=p_profile AND parent_id=auth.uid();
 IF v_level IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') OR p_locale IS NULL THEN RAISE EXCEPTION 'KIDS_ACCESS_REQUIRED'; END IF;
 RETURN jsonb_build_object('allowed',coalesce((SELECT jsonb_agg(n ORDER BY n) FROM generate_series(1,12) n WHERE public.kids_can_access_lesson(p_profile,v_level,n,p_locale)),'[]'::jsonb),
 'completed',coalesce((SELECT jsonb_agg(lesson_number ORDER BY lesson_number) FROM public.kids_lesson_progress WHERE profile_id=p_profile AND level_id=v_level AND locale=p_locale),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION learning_private.kids_journey(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION learning_private.kids_journey(uuid,text) TO authenticated;
CREATE FUNCTION public.kids_journey(p_profile uuid,p_locale text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT learning_private.kids_journey(p_profile,p_locale); $$;
REVOKE ALL ON FUNCTION public.kids_journey(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kids_journey(uuid,text) TO authenticated;