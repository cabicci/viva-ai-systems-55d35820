-- Apply after Kids review gates. No approved policy, market, or guardian is seeded.
-- This is consent recording, not proof of legal guardianship or legal review.
CREATE TABLE public.kids_consent_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL REFERENCES public.kids_market_release(country_code),
  version text NOT NULL CHECK (char_length(version) BETWEEN 1 AND 80),
  locale text NOT NULL CHECK (locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
  notice_text text NOT NULL CHECK (char_length(btrim(notice_text)) BETWEEN 80 AND 20000),
  consent_text text NOT NULL CHECK (char_length(btrim(consent_text)) BETWEEN 20 AND 2000),
  review_reference text NOT NULL CHECK (char_length(btrim(review_reference)) BETWEEN 8 AND 120),
  published_at timestamptz NOT NULL DEFAULT now(),
  enabled boolean NOT NULL DEFAULT false,
  UNIQUE(country_code,version,locale)
);
CREATE UNIQUE INDEX kids_one_current_consent_policy
  ON public.kids_consent_policies(country_code,locale) WHERE enabled;
ALTER TABLE public.kids_consent_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_consent_policies FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.kids_consent_policies TO authenticated;
GRANT ALL ON public.kids_consent_policies TO service_role;
CREATE POLICY kids_own_market_policy ON public.kids_consent_policies
  FOR SELECT TO authenticated USING (enabled AND EXISTS (
    SELECT 1 FROM public.kids_parent_access_requests request
    WHERE request.parent_id=(SELECT auth.uid()) AND request.country_code=kids_consent_policies.country_code
  ));
CREATE FUNCTION public.kids_consent_policy_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF (to_jsonb(NEW)-'enabled') IS DISTINCT FROM (to_jsonb(OLD)-'enabled') THEN
    RAISE EXCEPTION 'Publish a new consent policy version' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_consent_policy_immutable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER kids_consent_policy_immutable BEFORE UPDATE ON public.kids_consent_policies
  FOR EACH ROW EXECUTE FUNCTION public.kids_consent_policy_immutable();

CREATE TABLE public.kids_profile_consents (
  profile_id uuid PRIMARY KEY REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id uuid NOT NULL REFERENCES public.kids_consent_policies(id),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  guardian_reference text NOT NULL,
  withdrawn_at timestamptz
);
ALTER TABLE public.kids_profile_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_profile_consents FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.kids_profile_consents TO authenticated;
GRANT ALL ON public.kids_profile_consents TO service_role;
CREATE POLICY kids_own_consent_receipt ON public.kids_profile_consents
  FOR SELECT TO authenticated USING (parent_id=(SELECT auth.uid()));

CREATE FUNCTION public.kids_profile_has_consent(p_profile uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kids_profile_consents receipt
    JOIN public.kids_consent_policies policy ON policy.id=receipt.policy_id
    JOIN public.kids_parent_access_requests request ON request.parent_id=receipt.parent_id
    WHERE receipt.profile_id=p_profile AND receipt.parent_id=(SELECT auth.uid())
      AND receipt.withdrawn_at IS NULL AND policy.enabled
      AND policy.country_code=request.country_code
  );
$$;
REVOKE ALL ON FUNCTION public.kids_profile_has_consent(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kids_profile_has_consent(uuid) TO authenticated,service_role;

-- A parent can still inspect the exact accepted policy after retirement.
DROP POLICY kids_own_market_policy ON public.kids_consent_policies;
CREATE POLICY kids_own_market_policy ON public.kids_consent_policies
  FOR SELECT TO authenticated USING ((enabled AND EXISTS (
    SELECT 1 FROM public.kids_parent_access_requests request
    WHERE request.parent_id=(SELECT auth.uid()) AND request.country_code=kids_consent_policies.country_code
  )) OR EXISTS (
    SELECT 1 FROM public.kids_profile_consents receipt
    WHERE receipt.policy_id=kids_consent_policies.id AND receipt.parent_id=(SELECT auth.uid())
  ));

-- Only the atomic consent RPC creates profiles. Old clients cannot bypass it.
REVOKE INSERT ON public.kids_profiles FROM authenticated;
CREATE FUNCTION public.kids_parent_create_consented_profile(
  p_display_name text,p_level_id text,p_policy_id uuid,p_accepted boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  v_parent uuid := (SELECT auth.uid());
  v_profile uuid;
  v_guardian_reference text;
BEGIN
  IF v_parent IS NULL OR NOT public.kids_parent_can_manage_profiles() THEN
    RAISE EXCEPTION 'Verified guardian and released country required' USING ERRCODE='42501';
  END IF;
  IF p_accepted IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Explicit child service consent required' USING ERRCODE='22023';
  END IF;
  -- Lock selected version against simultaneous withdrawal of publication.
  PERFORM 1 FROM public.kids_consent_policies policy
    JOIN public.kids_parent_access_requests request ON request.country_code=policy.country_code
    WHERE policy.id=p_policy_id AND policy.enabled AND request.parent_id=v_parent
    FOR SHARE OF policy;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current country consent policy required' USING ERRCODE='22023';
  END IF;
  SELECT verification_reference INTO v_guardian_reference
    FROM public.kids_parent_verifications WHERE parent_id=v_parent FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verified guardian required' USING ERRCODE='42501'; END IF;
  INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
    VALUES(v_parent,btrim(p_display_name),p_level_id) RETURNING id INTO v_profile;
  INSERT INTO public.kids_profile_consents(profile_id,parent_id,policy_id,guardian_reference)
    VALUES(v_profile,v_parent,p_policy_id,v_guardian_reference);
  RETURN v_profile;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_parent_create_consented_profile(text,text,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kids_parent_create_consented_profile(text,text,uuid,boolean) TO authenticated;

-- Withdrawal remains available even if a country or parent access was closed.
CREATE FUNCTION public.kids_parent_withdraw_consent(p_profile uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  UPDATE public.kids_profile_consents SET withdrawn_at=coalesce(withdrawn_at,now())
    WHERE profile_id=p_profile AND parent_id=(SELECT auth.uid());
  IF NOT FOUND THEN RAISE EXCEPTION 'Consent receipt not found' USING ERRCODE='22023'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_parent_withdraw_consent(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kids_parent_withdraw_consent(uuid) TO authenticated;

DROP POLICY kids_profiles_parent_update ON public.kids_profiles;
CREATE POLICY kids_profiles_parent_update ON public.kids_profiles
  FOR UPDATE TO authenticated USING(parent_id=(SELECT auth.uid()))
  WITH CHECK(parent_id=(SELECT auth.uid()) AND public.kids_parent_can_manage_profiles()
    AND public.kids_profile_has_consent(id));
CREATE OR REPLACE FUNCTION public.kids_can_access_lesson(
  requested_profile uuid,requested_level text,requested_lesson integer,requested_locale text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT public.kids_parent_can_manage_profiles()
    AND public.kids_profile_has_consent(requested_profile)
    AND EXISTS(SELECT 1 FROM public.kids_release_control
      WHERE singleton AND accepts_child_data AND lesson_access_enabled)
    AND EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=requested_profile
      AND parent_id=(SELECT auth.uid()) AND level_id=requested_level)
    AND EXISTS(SELECT 1 FROM public.kids_content_approvals WHERE level_id=requested_level
      AND lesson_number=requested_lesson AND locale=requested_locale)
    AND (requested_lesson BETWEEN 1 AND 2 OR EXISTS(
      SELECT 1 FROM public.kids_family_entitlements WHERE parent_id=(SELECT auth.uid())
      AND active_from<=now() AND active_until>now()));
$$;
