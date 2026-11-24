-- Private store for the customer-support webhooks. Only service_role may call the RPCs; no table grants.
CREATE SCHEMA IF NOT EXISTS support_private;
REVOKE ALL ON SCHEMA support_private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE support_private.events (
  provider text NOT NULL CHECK (provider IN ('twilio_whatsapp','meta_messenger','meta_instagram_dm','meta_page_comment','meta_instagram_comment')),
  event_key text NOT NULL CHECK (length(event_key) BETWEEN 1 AND 200),
  sender_hash text NOT NULL CHECK (sender_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','sending','replied','failed','ambiguous','ignored','handoff','rate_limited')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts BETWEEN 1 AND 10),
  lease_until timestamptz NOT NULL DEFAULT now() + interval '60 seconds',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_key)
);
CREATE INDEX support_events_created ON support_private.events (created_at);
ALTER TABLE support_private.events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON support_private.events FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE support_private.senders (
  sender_hash text PRIMARY KEY CHECK (sender_hash ~ '^[a-f0-9]{64}$'),
  handoff_until timestamptz,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_count integer NOT NULL DEFAULT 0,
  day_start timestamptz NOT NULL DEFAULT now(),
  day_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE support_private.senders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON support_private.senders FROM PUBLIC, anon, authenticated, service_role;

-- Claim one provider event. Duplicate and concurrent deliveries serialize on the event row.
CREATE FUNCTION public.support_claim_event(p_provider text, p_event_key text, p_sender_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE ev support_private.events%ROWTYPE; s support_private.senders%ROWTYPE; recent integer;
BEGIN
  IF p_sender_hash IS NULL OR p_sender_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'SUPPORT_INVALID_SENDER'; END IF;
  INSERT INTO support_private.events (provider, event_key, sender_hash)
  VALUES (p_provider, p_event_key, p_sender_hash)
  ON CONFLICT (provider, event_key) DO NOTHING
  RETURNING * INTO ev;
  IF NOT FOUND THEN
    SELECT * INTO ev FROM support_private.events WHERE provider = p_provider AND event_key = p_event_key FOR UPDATE;
    IF ev.sender_hash <> p_sender_hash THEN RETURN 'duplicate'; END IF;
    -- Only work that provably never reached the provider may be retried.
    IF (ev.status = 'failed' OR (ev.status = 'processing' AND ev.lease_until < now())) AND ev.attempts < 3 THEN
      UPDATE support_private.events SET status = 'processing', attempts = attempts + 1,
        lease_until = now() + interval '60 seconds', updated_at = now()
      WHERE provider = p_provider AND event_key = p_event_key;
    ELSIF ev.status = 'sending' AND ev.lease_until < now() THEN
      UPDATE support_private.events SET status = 'ambiguous', updated_at = now()
      WHERE provider = p_provider AND event_key = p_event_key;
      RETURN 'duplicate';
    ELSE
      RETURN 'duplicate';
    END IF;
  END IF;

  INSERT INTO support_private.senders (sender_hash) VALUES (p_sender_hash) ON CONFLICT DO NOTHING;
  SELECT * INTO s FROM support_private.senders WHERE sender_hash = p_sender_hash FOR UPDATE;
  IF s.handoff_until IS NOT NULL AND s.handoff_until > now() THEN
    UPDATE support_private.events SET status = 'handoff', updated_at = now()
    WHERE provider = p_provider AND event_key = p_event_key;
    RETURN 'handoff';
  END IF;
  IF s.window_start < now() - interval '10 minutes' THEN s.window_start := now(); s.window_count := 0; END IF;
  IF s.day_start < now() - interval '1 day' THEN s.day_start := now(); s.day_count := 0; END IF;
  SELECT count(*) INTO recent FROM support_private.events WHERE created_at > now() - interval '1 minute';
  IF s.window_count >= 6 OR s.day_count >= 30 OR recent > 120 THEN
    UPDATE support_private.events SET status = 'rate_limited', updated_at = now()
    WHERE provider = p_provider AND event_key = p_event_key;
    UPDATE support_private.senders SET window_start = s.window_start, window_count = s.window_count,
      day_start = s.day_start, day_count = s.day_count, updated_at = now() WHERE sender_hash = p_sender_hash;
    RETURN 'rate_limited';
  END IF;
  UPDATE support_private.senders SET window_start = s.window_start, window_count = s.window_count + 1,
    day_start = s.day_start, day_count = s.day_count + 1, updated_at = now() WHERE sender_hash = p_sender_hash;
  -- Bounded retention of delivery bookkeeping.
  DELETE FROM support_private.events WHERE ctid IN (
    SELECT ctid FROM support_private.events WHERE created_at < now() - interval '30 days' LIMIT 50);
  RETURN 'process';
END $$;

CREATE FUNCTION public.support_mark_event(p_provider text, p_event_key text, p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE changed integer;
BEGIN
  IF p_status NOT IN ('sending','replied','failed','ambiguous','ignored','handoff') THEN
    RAISE EXCEPTION 'SUPPORT_INVALID_STATUS';
  END IF;
  UPDATE support_private.events SET status = p_status, updated_at = now(),
    lease_until = CASE WHEN p_status = 'sending' THEN now() + interval '60 seconds' ELSE lease_until END
  WHERE provider = p_provider AND event_key = p_event_key
    AND ((p_status = 'sending' AND status = 'processing')
      OR (p_status IN ('replied','failed','ambiguous') AND status = 'sending')
      OR (p_status IN ('ignored','handoff','failed') AND status = 'processing'));
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END $$;

CREATE FUNCTION public.support_set_handoff(p_sender_hash text, p_hours integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_sender_hash IS NULL OR p_sender_hash !~ '^[a-f0-9]{64}$' OR p_hours NOT BETWEEN 1 AND 72 THEN
    RAISE EXCEPTION 'SUPPORT_INVALID_HANDOFF';
  END IF;
  INSERT INTO support_private.senders (sender_hash, handoff_until) VALUES (p_sender_hash, now() + make_interval(hours => p_hours))
  ON CONFLICT (sender_hash) DO UPDATE SET handoff_until = GREATEST(COALESCE(support_private.senders.handoff_until, now()), EXCLUDED.handoff_until), updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.support_claim_event(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.support_mark_event(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.support_set_handoff(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_claim_event(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.support_mark_event(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.support_set_handoff(text, integer) TO service_role;