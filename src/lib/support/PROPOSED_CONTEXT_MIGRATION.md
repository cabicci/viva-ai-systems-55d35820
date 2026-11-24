# Proposed (NOT applied): durable support topic context

Follow-up context currently lives in a bounded per-isolate memory map (`context.ts`), so a
follow-up may land on an isolate without it; the reply policy then asks a short clarifier.
To make follow-ups durable, the owner may review and apply this migration later. It stores
only opaque topic ids (no message text), keyed by a hash of channel + thread + visibility,
with a 30-minute expiry, and is reachable only through service-role RPCs.

```sql
CREATE TABLE support_private.topic_context (
  context_key text PRIMARY KEY CHECK (context_key ~ '^[a-f0-9]{64}$'),
  topic jsonb NOT NULL CHECK (jsonb_typeof(topic) = 'object' AND pg_column_size(topic) < 1024),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes'
);
ALTER TABLE support_private.topic_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON support_private.topic_context FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.support_get_topic(p_key text) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT topic FROM support_private.topic_context WHERE context_key = p_key AND expires_at > now()
$$;
CREATE FUNCTION public.support_set_topic(p_key text, p_topic jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_key !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'SUPPORT_INVALID_CONTEXT'; END IF;
  INSERT INTO support_private.topic_context (context_key, topic) VALUES (p_key, p_topic)
  ON CONFLICT (context_key) DO UPDATE SET topic = EXCLUDED.topic, expires_at = now() + interval '30 minutes';
  DELETE FROM support_private.topic_context WHERE ctid IN (
    SELECT ctid FROM support_private.topic_context WHERE expires_at < now() LIMIT 50);
END $$;
REVOKE ALL ON FUNCTION public.support_get_topic(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.support_set_topic(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_get_topic(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.support_set_topic(text, jsonb) TO service_role;
```
