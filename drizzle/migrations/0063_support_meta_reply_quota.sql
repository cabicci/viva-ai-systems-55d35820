-- Meta replies retain the event ledger and human handoff. At the AI quota,
-- reserve the same event for one answer from the public catalogue instead.
CREATE FUNCTION public.support_claim_meta_event(p_provider text, p_event_key text, p_sender_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE decision text;
BEGIN
  IF p_provider NOT IN ('meta_messenger', 'meta_instagram_dm', 'meta_page_comment', 'meta_instagram_comment') THEN
    RAISE EXCEPTION 'SUPPORT_INVALID_META_PROVIDER';
  END IF;
  decision := public.support_claim_event(p_provider, p_event_key, p_sender_hash);
  IF decision = 'rate_limited' THEN
    UPDATE support_private.events SET status = 'processing'
      WHERE provider = p_provider AND event_key = p_event_key AND sender_hash = p_sender_hash AND status = 'rate_limited';
    IF FOUND THEN RETURN 'public_facts'; END IF;
    RETURN 'duplicate';
  END IF;
  RETURN decision;
END $$;
REVOKE ALL ON FUNCTION public.support_claim_meta_event(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_claim_meta_event(text, text, text) TO service_role;
