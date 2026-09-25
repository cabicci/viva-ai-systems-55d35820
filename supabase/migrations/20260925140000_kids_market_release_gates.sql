-- KIDS-03 implementation preparation. Apply only after the foundation's reviews.
-- Market scope is the owner's decision. Every child-data market stays closed.
CREATE TABLE public.kids_market_release (
  country_code text PRIMARY KEY CHECK (country_code IN (
    'DZ','BH','KM','DJ','EG','IQ','JO','KW','LB','LY','MR',
    'MA','OM','PS','QA','SA','SO','SD','SY','TN','AE','YE'
  )),
  accepts_child_data boolean NOT NULL DEFAULT false,
  reviewed_at timestamptz,
  review_reference text,
  CHECK (NOT accepts_child_data OR (
    reviewed_at IS NOT NULL AND review_reference IS NOT NULL
    AND char_length(btrim(review_reference)) BETWEEN 8 AND 120
  ))
);
INSERT INTO public.kids_market_release(country_code)
  SELECT unnest(ARRAY['DZ','BH','KM','DJ','EG','IQ','JO','KW','LB','LY','MR',
                     'MA','OM','PS','QA','SA','SO','SD','SY','TN','AE','YE']);
ALTER TABLE public.kids_market_release ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_market_release FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.kids_market_release TO authenticated;
CREATE POLICY kids_market_readiness_read ON public.kids_market_release
  FOR SELECT TO authenticated USING (true);
GRANT ALL ON public.kids_market_release TO service_role;

ALTER TABLE public.kids_parent_access_requests
  ADD COLUMN country_code text REFERENCES public.kids_market_release(country_code),
  ADD COLUMN adult_confirmed boolean NOT NULL DEFAULT false;

-- Stale clients must not create country-less requests through the old overload.
CREATE OR REPLACE FUNCTION public.kids_parent_request_review(p_acknowledged boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'Use the current parent review form' USING ERRCODE = '22023';
END;
$$;

CREATE FUNCTION public.kids_parent_request_review(
  p_acknowledged boolean, p_country_code text, p_adult_confirmed boolean
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_parent uuid := (SELECT auth.uid());
  v_email text;
  v_request public.kids_parent_access_requests%ROWTYPE;
BEGIN
  IF v_parent IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  IF p_acknowledged IS DISTINCT FROM true OR p_adult_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Adult confirmation and review notice required' USING ERRCODE = '22023';
  END IF;
  IF p_country_code IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.kids_market_release WHERE country_code = p_country_code
  ) THEN RAISE EXCEPTION 'Valid country of residence required' USING ERRCODE = '22023'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_parent AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL OR char_length(v_email) > 320 THEN
    RAISE EXCEPTION 'Verified account email required' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.kids_parent_access_requests
    (parent_id, parent_email, country_code, adult_confirmed, request_notice_version)
    VALUES (v_parent, v_email, p_country_code, true, 'kids-review-v2')
    ON CONFLICT (parent_id) DO NOTHING;
  SELECT * INTO v_request FROM public.kids_parent_access_requests
    WHERE parent_id = v_parent FOR UPDATE;
  -- Existing requests cannot silently switch country or restore revoked approval.
  IF v_request.country_code IS DISTINCT FROM p_country_code OR NOT v_request.adult_confirmed THEN
    RAISE EXCEPTION 'Residence changes require a new reviewed request' USING ERRCODE = '22023';
  END IF;
  RETURN v_request.status;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_parent_request_review(boolean,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kids_parent_request_review(boolean,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.kids_parent_can_manage_profiles()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data)
    AND EXISTS (
      SELECT 1 FROM public.kids_parent_access_requests request
      JOIN public.kids_market_release market USING (country_code)
      JOIN public.kids_parent_verifications verification ON verification.parent_id = request.parent_id
      WHERE request.parent_id = (SELECT auth.uid()) AND request.status = 'approved'
        AND request.adult_confirmed AND market.accepts_child_data
    );
$$;

-- Apply the country decision to content and playback too, including free lessons.
CREATE OR REPLACE FUNCTION public.kids_can_access_lesson(
  requested_profile uuid, requested_level text, requested_lesson integer, requested_locale text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.kids_parent_can_manage_profiles()
    AND EXISTS (SELECT 1 FROM public.kids_release_control
                WHERE singleton AND accepts_child_data AND lesson_access_enabled)
    AND EXISTS (SELECT 1 FROM public.kids_profiles
                WHERE id = requested_profile AND parent_id = (SELECT auth.uid())
                  AND level_id = requested_level)
    AND EXISTS (SELECT 1 FROM public.kids_content_approvals
                WHERE level_id = requested_level AND lesson_number = requested_lesson
                  AND locale = requested_locale)
    AND (requested_lesson BETWEEN 1 AND 2 OR EXISTS (
      SELECT 1 FROM public.kids_family_entitlements
      WHERE parent_id = (SELECT auth.uid()) AND active_from <= now() AND active_until > now()
    ));
$$;

-- Enforce readiness at the write boundary, including the existing admin RPC.
CREATE FUNCTION public.kids_require_market_before_parent_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'approved' AND NOT EXISTS (
    SELECT 1 FROM public.kids_market_release
    WHERE country_code = NEW.country_code AND accepts_child_data AND NEW.adult_confirmed
  ) THEN RAISE EXCEPTION 'Child data release for this country is closed' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_require_market_before_parent_approval() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER kids_parent_market_approval
  BEFORE INSERT OR UPDATE ON public.kids_parent_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.kids_require_market_before_parent_approval();
