-- Security Batch B: revoke default PUBLIC/anon EXECUTE on authenticated-only RPCs.
-- Function bodies already enforce auth.uid() / has_role; this closes direct anon calls.

REVOKE EXECUTE ON FUNCTION public.submit_mission_for_evaluation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.skip_mission_for_user(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_roadmap_done(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_mission_for_evaluation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skip_mission_for_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_roadmap_done(uuid) TO authenticated;
