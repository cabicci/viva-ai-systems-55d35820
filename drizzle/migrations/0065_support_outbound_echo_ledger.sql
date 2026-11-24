-- PROPOSED, NOT APPLIED. Owner approval required before it is applied with the native migration tool.
-- Correlates the support bot's own outbound DMs with Meta echo webhooks by provider message ID.
-- Stores only SHA-256 hashes (attempt, conversation, message ID); never text, IDs or tokens.
CREATE TABLE support_private.outbound (
  attempt_hash text PRIMARY KEY CHECK (attempt_hash ~ '^[a-f0-9]{64}$'),
  conversation_hash text NOT NULL CHECK (conversation_hash ~ '^[a-f0-9]{64}$'),
  mid_hash text UNIQUE CHECK (mid_hash IS NULL OR mid_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent','rejected','ambiguous')),
  lease_until timestamptz NOT NULL DEFAULT now() + interval '60 seconds',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_outbound_conversation ON support_private.outbound (conversation_hash, status, lease_until);
CREATE INDEX support_outbound_created ON support_private.outbound (created_at);
ALTER TABLE support_private.outbound ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON support_private.outbound FROM PUBLIC, anon, authenticated, service_role;

-- Recorded before the Send API call, so an echo that arrives before the response is seen as pending.
CREATE FUNCTION public.support_begin_outbound(p_attempt_hash text, p_conversation_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_attempt_hash !~ '^[a-f0-9]{64}$' OR p_conversation_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'SUPPORT_INVALID_OUTBOUND';
  END IF;
  INSERT INTO support_private.outbound (attempt_hash, conversation_hash) VALUES (p_attempt_hash, p_conversation_hash)
  ON CONFLICT (attempt_hash) DO UPDATE SET status = 'sending', lease_until = now() + interval '60 seconds', updated_at = now()
    WHERE support_private.outbound.status = 'rejected'
      AND support_private.outbound.conversation_hash = p_conversation_hash;
  DELETE FROM support_private.outbound WHERE ctid IN (
    SELECT ctid FROM support_private.outbound WHERE created_at < now() - interval '7 days' LIMIT 50);
  RETURN true;
END $$;

-- The provider message ID and the final status are recorded in one update.
CREATE FUNCTION public.support_finish_outbound(p_attempt_hash text, p_mid_hash text, p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE changed integer;
BEGIN
  IF p_status NOT IN ('sent','rejected','ambiguous') OR (p_mid_hash IS NOT NULL AND p_mid_hash !~ '^[a-f0-9]{64}$') THEN
    RAISE EXCEPTION 'SUPPORT_INVALID_OUTBOUND';
  END IF;
  UPDATE support_private.outbound SET status = p_status, mid_hash = COALESCE(p_mid_hash, mid_hash), updated_at = now()
  WHERE attempt_hash = p_attempt_hash AND status = 'sending';
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END $$;

-- own: the echo's message ID is one we sent in this conversation.
-- pending: a send to this conversation is in flight, so retry the webhook later.
-- unmatched: not ours.
CREATE FUNCTION public.support_match_echo(p_conversation_hash text, p_mid_hash text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_conversation_hash !~ '^[a-f0-9]{64}$' OR p_mid_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'SUPPORT_INVALID_OUTBOUND';
  END IF;
  IF EXISTS (SELECT 1 FROM support_private.outbound WHERE mid_hash = p_mid_hash AND conversation_hash = p_conversation_hash) THEN
    RETURN 'own';
  END IF;
  IF EXISTS (SELECT 1 FROM support_private.outbound WHERE conversation_hash = p_conversation_hash
             AND status = 'sending' AND lease_until > now()) THEN
    RETURN 'pending';
  END IF;
  RETURN 'unmatched';
END $$;

REVOKE ALL ON FUNCTION public.support_begin_outbound(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.support_finish_outbound(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.support_match_echo(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_begin_outbound(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.support_finish_outbound(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.support_match_echo(text, text) TO service_role;