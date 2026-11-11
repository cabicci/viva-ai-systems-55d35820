-- Publish only the timing and identity of an active platform-wide offer.
CREATE FUNCTION public.get_free_access_announcement() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('id',w.id,'ends_at',w.ends_at,'server_time',now())
  FROM billing.free_access_windows w
  WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at
    AND 'ai'=ANY(w.targets)
    AND w.targets @> ARRAY(
      SELECT target->>'id' FROM jsonb_array_elements(billing.free_access_targets()) AS target
      WHERE target->'published'='true'::jsonb AND target->>'id' NOT LIKE 'ai:%'
    )
  ORDER BY w.ends_at DESC,w.id
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_free_access_announcement() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_free_access_announcement() TO anon,authenticated;
