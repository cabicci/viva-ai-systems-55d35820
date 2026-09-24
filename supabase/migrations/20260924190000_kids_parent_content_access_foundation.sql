-- Draft-only Kids access foundation. All collection and lesson access are disabled by default.
-- Apply only after privacy, editorial, and deployment reviews.
CREATE TABLE public.kids_release_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  accepts_child_data boolean NOT NULL DEFAULT false,
  lesson_access_enabled boolean NOT NULL DEFAULT false
);
INSERT INTO public.kids_release_control (singleton) VALUES (true);
ALTER TABLE public.kids_release_control ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_release_control FROM PUBLIC, anon, authenticated;

CREATE TABLE public.kids_parent_verifications (
  parent_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL,
  verification_reference text NOT NULL CHECK (char_length(verification_reference) BETWEEN 1 AND 120)
);
ALTER TABLE public.kids_parent_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_parent_verifications FROM PUBLIC, anon, authenticated;

CREATE TABLE public.kids_content_approvals (
  level_id text NOT NULL CHECK (level_id IN ('level-1', 'level-2', 'level-3')),
  lesson_number integer NOT NULL CHECK (lesson_number BETWEEN 1 AND 12),
  locale text NOT NULL CHECK (locale IN ('ar-EG', 'ar-MSA', 'ar-Gulf', 'en')),
  approved_at timestamptz NOT NULL,
  approval_reference text NOT NULL CHECK (char_length(approval_reference) BETWEEN 1 AND 120),
  PRIMARY KEY (level_id, lesson_number, locale)
);
ALTER TABLE public.kids_content_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_content_approvals FROM PUBLIC, anon, authenticated;

CREATE TABLE public.kids_family_entitlements (
  parent_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_from timestamptz NOT NULL,
  active_until timestamptz NOT NULL CHECK (active_until > active_from),
  entitlement_reference text NOT NULL CHECK (char_length(entitlement_reference) BETWEEN 1 AND 120)
);
ALTER TABLE public.kids_family_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_family_entitlements FROM PUBLIC, anon, authenticated;

CREATE TABLE public.kids_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 40),
  level_id text NOT NULL CHECK (level_id IN ('level-1', 'level-2', 'level-3')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, level_id)
);
CREATE INDEX kids_profiles_parent_id_idx ON public.kids_profiles(parent_id);
ALTER TABLE public.kids_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_profiles FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_profiles TO authenticated;

CREATE FUNCTION public.kids_parent_can_manage_profiles()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.kids_release_control WHERE accepts_child_data)
    AND EXISTS (SELECT 1 FROM public.kids_parent_verifications
                WHERE parent_id = (SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.kids_parent_can_manage_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kids_parent_can_manage_profiles() TO authenticated;

CREATE POLICY kids_profiles_parent_read ON public.kids_profiles
  FOR SELECT TO authenticated USING (parent_id = (SELECT auth.uid()));
CREATE POLICY kids_profiles_parent_create ON public.kids_profiles
  FOR INSERT TO authenticated WITH CHECK (
    parent_id = (SELECT auth.uid())
    AND (SELECT public.kids_parent_can_manage_profiles())
  );
CREATE POLICY kids_profiles_parent_update ON public.kids_profiles
  FOR UPDATE TO authenticated USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid())
              AND (SELECT public.kids_parent_can_manage_profiles()));
CREATE POLICY kids_profiles_parent_delete ON public.kids_profiles
  FOR DELETE TO authenticated USING (parent_id = (SELECT auth.uid()));

CREATE TABLE public.kids_lesson_progress (
  profile_id uuid NOT NULL,
  level_id text NOT NULL CHECK (level_id IN ('level-1', 'level-2', 'level-3')),
  lesson_number integer NOT NULL CHECK (lesson_number BETWEEN 1 AND 12),
  locale text NOT NULL CHECK (locale IN ('ar-EG', 'ar-MSA', 'ar-Gulf', 'en')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, level_id, lesson_number, locale),
  FOREIGN KEY (profile_id, level_id)
    REFERENCES public.kids_profiles(id, level_id) ON DELETE CASCADE
);
ALTER TABLE public.kids_lesson_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_lesson_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.kids_lesson_progress TO authenticated;
CREATE POLICY kids_progress_parent_read ON public.kids_lesson_progress
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.kids_profiles
            WHERE id = profile_id AND parent_id = (SELECT auth.uid()))
  );

-- No client role may write verification, approval, entitlement, or progress records.
GRANT ALL ON public.kids_release_control, public.kids_parent_verifications,
  public.kids_content_approvals, public.kids_family_entitlements,
  public.kids_profiles, public.kids_lesson_progress TO service_role;

CREATE FUNCTION public.kids_can_access_lesson(
  requested_profile uuid, requested_level text,
  requested_lesson integer, requested_locale text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.kids_release_control control
      WHERE control.singleton AND control.accepts_child_data
        AND control.lesson_access_enabled
    )
    AND EXISTS (
      SELECT 1 FROM public.kids_parent_verifications verification
      WHERE verification.parent_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.kids_profiles profile
      WHERE profile.id = requested_profile
        AND profile.parent_id = (SELECT auth.uid())
        AND profile.level_id = requested_level
    )
    AND EXISTS (
      SELECT 1 FROM public.kids_content_approvals approval
      WHERE approval.level_id = requested_level
        AND approval.lesson_number = requested_lesson
        AND approval.locale = requested_locale
    )
    AND (
      requested_lesson BETWEEN 1 AND 2
      OR EXISTS (
        SELECT 1 FROM public.kids_family_entitlements entitlement
        WHERE entitlement.parent_id = (SELECT auth.uid())
          AND entitlement.active_from <= now()
          AND entitlement.active_until > now()
      )
    );
$$;
REVOKE ALL ON FUNCTION public.kids_can_access_lesson(uuid, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kids_can_access_lesson(uuid, text, integer, text) TO authenticated, service_role;
