CREATE TABLE support_private.topic_context (
  context_key text PRIMARY KEY CHECK (context_key ~ '^[a-f0-9]{64}$'),
  topic jsonb NOT NULL CHECK (jsonb_typeof(topic) = 'object' AND pg_column_size(topic) < 512),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes'
);
ALTER TABLE support_private.topic_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON support_private.topic_context FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.support_get_topic(p_key text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT topic FROM support_private.topic_context WHERE context_key = p_key AND expires_at > now()
$$;

CREATE FUNCTION public.support_set_topic(p_key text, p_topic jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE k text; v jsonb;
BEGIN
  IF p_key IS NULL OR p_key !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'SUPPORT_INVALID_CONTEXT'; END IF;
  IF p_topic IS NULL OR jsonb_typeof(p_topic) <> 'object' OR pg_column_size(p_topic) >= 512 THEN RAISE EXCEPTION 'SUPPORT_INVALID_TOPIC'; END IF;
  FOR k, v IN SELECT * FROM jsonb_each(p_topic) LOOP
    IF k NOT IN ('subject','area','program','plan','market','term','lesson')
       OR jsonb_typeof(v) <> 'string' OR (v #>> '{}') !~ '^[a-z0-9][a-z0-9._-]{0,119}$' THEN
      RAISE EXCEPTION 'SUPPORT_INVALID_TOPIC';
    END IF;
  END LOOP;
  INSERT INTO support_private.topic_context (context_key, topic) VALUES (p_key, p_topic)
  ON CONFLICT (context_key) DO UPDATE SET topic = EXCLUDED.topic, expires_at = now() + interval '30 minutes';
  DELETE FROM support_private.topic_context WHERE ctid IN (
    SELECT ctid FROM support_private.topic_context WHERE expires_at < now() LIMIT 50);
END $$;

REVOKE ALL ON FUNCTION public.support_get_topic(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.support_set_topic(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_get_topic(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.support_set_topic(text, jsonb) TO service_role;