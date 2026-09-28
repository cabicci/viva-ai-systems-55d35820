-- Read only the signed-in parent's original acceptance. The policy id also
-- lets child profiles inherit that one acceptance across interface languages.
CREATE FUNCTION public.kids_parent_privacy_record()
RETURNS TABLE(policy_id uuid, policy_version text, attested_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT attestation.policy_id, policy.version, attestation.attested_at
  FROM public.kids_parent_attestations attestation
  JOIN public.kids_consent_policies policy ON policy.id = attestation.policy_id
  WHERE attestation.parent_id = (SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION public.kids_parent_privacy_record() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kids_parent_privacy_record() TO authenticated;
