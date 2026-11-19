CREATE TABLE support_private.reconcile (
  source text PRIMARY KEY CHECK (source IN ('fb_comments','ig_comments','ig_dm')),
  mode text NOT NULL DEFAULT 'pilot' CHECK (mode IN ('off','dry_run','pilot')),
  started_at timestamptz NOT NULL DEFAULT now(),
  cursor_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  paused_reason text CHECK (paused_reason IS NULL OR paused_reason ~ '^[A-Za-z0-9_:.-]{1,64}$'),
  last_run_at timestamptz,
  last_counts jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE support_private.reconcile ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON support_private.reconcile FROM PUBLIC, anon, authenticated, service_role;
INSERT INTO support_private.reconcile (source) VALUES ('fb_comments'),('ig_comments'),('ig_dm');

-- Single-flight lease per source; returns null when off, paused or already running.
CREATE FUNCTION public.support_reconcile_begin(p_source text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r support_private.reconcile%ROWTYPE;
BEGIN
  SELECT * INTO r FROM support_private.reconcile WHERE source = p_source FOR UPDATE;
  IF NOT FOUND OR r.mode = 'off' OR r.paused_reason IS NOT NULL
     OR (r.lease_until IS NOT NULL AND r.lease_until > now()) THEN RETURN NULL; END IF;
  UPDATE support_private.reconcile SET lease_until = now() + interval '4 minutes', updated_at = now() WHERE source = p_source;
  RETURN jsonb_build_object('mode', r.mode, 'started_at', r.started_at, 'cursor_at', r.cursor_at);
END $$;

-- Releases the lease, advances the cursor monotonically and optionally pauses with a sanitized code.
CREATE FUNCTION public.support_reconcile_finish(p_source text, p_cursor timestamptz, p_paused_reason text, p_counts jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE support_private.reconcile SET
    cursor_at = GREATEST(cursor_at, COALESCE(LEAST(p_cursor, now()), cursor_at)),
    paused_reason = COALESCE(p_paused_reason, paused_reason),
    lease_until = NULL, last_run_at = now(), last_counts = p_counts, updated_at = now()
  WHERE source = p_source;
END $$;

REVOKE ALL ON FUNCTION public.support_reconcile_begin(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.support_reconcile_finish(text, timestamptz, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_reconcile_begin(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.support_reconcile_finish(text, timestamptz, text, jsonb) TO service_role;