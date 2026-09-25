-- Adult-only request and review. This does not enable collection of child data.
-- Apply after the Kids foundation migration. All child gates stay disabled.
CREATE TABLE public.kids_parent_access_requests (
  parent_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_email text NOT NULL,
  request_notice_version text NOT NULL DEFAULT 'kids-review-v1',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  review_reference text CHECK (review_reference IS NULL OR char_length(review_reference) BETWEEN 8 AND 120)
);
ALTER TABLE public.kids_parent_access_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_parent_access_requests FROM PUBLIC, anon;
GRANT SELECT ON public.kids_parent_access_requests TO authenticated;
GRANT ALL ON public.kids_parent_access_requests TO service_role;
CREATE POLICY kids_parent_request_read ON public.kids_parent_access_requests
  FOR SELECT TO authenticated USING (
    parent_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin')
  );

-- Never accept a client-provided user ID, email, status, or verification decision.
CREATE FUNCTION public.kids_parent_request_review(p_acknowledged boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_parent uuid := (SELECT auth.uid());
  v_email text;
  v_status text;
BEGIN
  IF v_parent IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  IF p_acknowledged IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Review notice acknowledgment required' USING ERRCODE = '22023';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_parent AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL OR char_length(v_email) > 320 THEN
    RAISE EXCEPTION 'Verified account email required' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.kids_parent_access_requests (parent_id, parent_email)
  VALUES (v_parent, v_email)
  ON CONFLICT (parent_id) DO NOTHING;
  SELECT status INTO v_status FROM public.kids_parent_access_requests WHERE parent_id = v_parent;
  RETURN v_status;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_parent_request_review(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kids_parent_request_review(boolean) TO authenticated;

-- The review screen may read release readiness, but cannot change it.
CREATE FUNCTION public.kids_admin_parent_review_ready()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'Admin required' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data);
END;
$$;
REVOKE ALL ON FUNCTION public.kids_admin_parent_review_ready() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kids_admin_parent_review_ready() TO authenticated;

-- A human reviewer must have verified the guardian evidence and record its
-- private case reference; the browser cannot create an approval.
CREATE FUNCTION public.kids_admin_review_parent(
  p_parent_id uuid, p_approve boolean, p_reference text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_reviewer uuid := (SELECT auth.uid());
  v_status text;
  v_reference text := btrim(p_reference);
BEGIN
  IF v_reviewer IS NULL OR NOT public.has_role(v_reviewer, 'admin') THEN
    RAISE EXCEPTION 'Admin required' USING ERRCODE = '42501';
  END IF;
  IF p_parent_id IS NULL OR p_approve IS NULL OR v_reference IS NULL
     OR char_length(v_reference) NOT BETWEEN 8 AND 120 THEN
    RAISE EXCEPTION 'Valid review reference required' USING ERRCODE = '22023';
  END IF;
  SELECT status INTO v_status FROM public.kids_parent_access_requests
    WHERE parent_id = p_parent_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Request not found' USING ERRCODE = '22023'; END IF;
  IF v_status = 'rejected' THEN
    RAISE EXCEPTION 'Rejected request needs a new review process' USING ERRCODE = '22023';
  END IF;
  IF p_approve AND NOT EXISTS (
    SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data
  ) THEN
    RAISE EXCEPTION 'Child data release is closed' USING ERRCODE = '42501';
  END IF;
  IF p_approve AND v_status = 'approved' THEN
    RAISE EXCEPTION 'Already approved' USING ERRCODE = '22023';
  END IF;
  UPDATE public.kids_parent_access_requests SET
    status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    reviewed_at = now(), reviewed_by = v_reviewer, review_reference = v_reference
    WHERE parent_id = p_parent_id;
  IF p_approve THEN
    INSERT INTO public.kids_parent_verifications (parent_id, verified_at, verification_reference)
    VALUES (p_parent_id, now(), v_reference)
    ON CONFLICT (parent_id) DO UPDATE SET
      verified_at = EXCLUDED.verified_at,
      verification_reference = EXCLUDED.verification_reference;
  ELSE
    DELETE FROM public.kids_parent_verifications WHERE parent_id = p_parent_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_admin_review_parent(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kids_admin_review_parent(uuid, boolean, text) TO authenticated;
