-- Self-service parent declaration after reading a versioned, published child
-- privacy notice. This records an attestation, not independent identity proof.
-- Release and market flags remain closed until the operational launch decision.
CREATE TABLE public.kids_parent_attestations (
  parent_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id uuid NOT NULL REFERENCES public.kids_consent_policies(id),
  country_code text NOT NULL REFERENCES public.kids_market_release(country_code),
  attested_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kids_parent_attestations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_parent_attestations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.kids_parent_attestations TO service_role;

CREATE FUNCTION public.kids_parent_confirm_privacy(p_policy_id uuid, p_accepted boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_parent uuid := (SELECT auth.uid());
  v_email text;
  v_request public.kids_parent_access_requests%ROWTYPE;
BEGIN
  IF v_parent IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
  END IF;
  IF p_accepted IS DISTINCT FROM true OR p_policy_id IS NULL THEN
    RAISE EXCEPTION 'Explicit parent declaration and policy consent required'
      USING ERRCODE='22023';
  END IF;
  SELECT email INTO v_email FROM auth.users
    WHERE id=v_parent AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Confirmed account email required' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_request FROM public.kids_parent_access_requests
    WHERE parent_id=v_parent FOR UPDATE;
  IF NOT FOUND OR v_request.status='rejected'
     OR NOT v_request.adult_confirmed
     OR v_request.parent_email IS DISTINCT FROM v_email THEN
    RAISE EXCEPTION 'Current adult request required' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.kids_release_control
    WHERE singleton AND accepts_child_data
  ) OR NOT EXISTS (
    SELECT 1 FROM public.kids_market_release
    WHERE country_code=v_request.country_code AND accepts_child_data
  ) THEN
    RAISE EXCEPTION 'Child service is closed for this country' USING ERRCODE='42501';
  END IF;
  PERFORM 1 FROM public.kids_consent_policies
    WHERE id=p_policy_id AND country_code=v_request.country_code AND enabled
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current published privacy notice required' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.kids_parent_attestations(parent_id,policy_id,country_code)
    VALUES(v_parent,p_policy_id,v_request.country_code)
    ON CONFLICT(parent_id) DO UPDATE SET
      policy_id=EXCLUDED.policy_id,
      country_code=EXCLUDED.country_code,
      attested_at=now();
  IF v_request.status='pending' THEN
    UPDATE public.kids_parent_access_requests SET
      status='approved', reviewed_at=now(),
      review_reference='self-attested-privacy-v1'
      WHERE parent_id=v_parent;
  END IF;
  RETURN 'approved';
END;
$$;
REVOKE ALL ON FUNCTION public.kids_parent_confirm_privacy(uuid,boolean)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kids_parent_confirm_privacy(uuid,boolean)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.kids_parent_can_manage_profiles()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS(SELECT 1 FROM public.kids_release_control
      WHERE singleton AND accepts_child_data)
    AND EXISTS(
      SELECT 1 FROM public.kids_parent_access_requests request
      JOIN public.kids_market_release market USING(country_code)
      JOIN auth.users account ON account.id=request.parent_id
      WHERE request.parent_id=(SELECT auth.uid())
        AND request.status='approved' AND request.adult_confirmed
        AND market.accepts_child_data
        AND account.email_confirmed_at IS NOT NULL
        AND account.email=request.parent_email
        AND EXISTS(SELECT 1 FROM public.kids_parent_attestations attestation
            JOIN public.kids_consent_policies policy
              ON policy.id=attestation.policy_id
            WHERE attestation.parent_id=request.parent_id
              AND attestation.country_code=request.country_code
              AND policy.enabled AND policy.country_code=request.country_code)
    );
$$;

CREATE OR REPLACE FUNCTION public.kids_parent_create_consented_profile(
  p_display_name text,p_level_id text,p_policy_id uuid,p_accepted boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  v_parent uuid := (SELECT auth.uid());
  v_profile uuid;
  v_guardian_reference text;
BEGIN
  IF v_parent IS NULL OR NOT public.kids_parent_can_manage_profiles() THEN
    RAISE EXCEPTION 'Approved parent and released country required' USING ERRCODE='42501';
  END IF;
  IF p_accepted IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Explicit child service consent required' USING ERRCODE='22023';
  END IF;
  PERFORM 1 FROM public.kids_consent_policies policy
    JOIN public.kids_parent_access_requests request
      ON request.country_code=policy.country_code
    WHERE policy.id=p_policy_id AND policy.enabled AND request.parent_id=v_parent
    FOR SHARE OF policy;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current country consent policy required' USING ERRCODE='22023';
  END IF;
  SELECT 'self-attestation:' || attestation.policy_id::text
    INTO v_guardian_reference
    FROM public.kids_parent_attestations attestation
    JOIN public.kids_parent_access_requests request
      ON request.parent_id=attestation.parent_id
    WHERE attestation.parent_id=v_parent AND attestation.policy_id=p_policy_id
      AND attestation.country_code=request.country_code;
  IF v_guardian_reference IS NULL THEN
    RAISE EXCEPTION 'Parent declaration required' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
    VALUES(v_parent,btrim(p_display_name),p_level_id) RETURNING id INTO v_profile;
  INSERT INTO public.kids_profile_consents(profile_id,parent_id,policy_id,guardian_reference)
    VALUES(v_profile,v_parent,p_policy_id,v_guardian_reference);
  RETURN v_profile;
END;
$$;

-- Keep historical verification records and function definitions for audit.
-- Revoke access to the obsolete review route; it never grants Kids access.
REVOKE EXECUTE ON FUNCTION public.kids_admin_review_parent(uuid,boolean,text)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.kids_admin_parent_review_ready()
  FROM authenticated;
