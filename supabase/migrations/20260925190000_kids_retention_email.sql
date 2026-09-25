-- Prepared only. Privacy/editorial/deployment gates from the Kids foundation apply.
-- No cron, provider call, deletion or release occurs on migration application.
CREATE TABLE public.kids_retention_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  notices_enabled boolean NOT NULL DEFAULT false,
  deletion_enabled boolean NOT NULL DEFAULT false,
  release_reference text,
  CHECK (NOT (notices_enabled OR deletion_enabled) OR char_length(btrim(release_reference)) >= 8),
  CHECK (NOT (notices_enabled OR deletion_enabled) OR release_reference IS NOT NULL)
);
INSERT INTO public.kids_retention_control(singleton) VALUES (true);

CREATE TABLE public.kids_retention_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expiry timestamptz NOT NULL,
  recipient_email text NOT NULL CHECK (char_length(recipient_email) BETWEEN 3 AND 320),
  profile_ids uuid[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','sending','submitted','delivered','blocked','cancelled','deleted')),
  claim_token uuid,
  lease_until timestamptz,
  first_attempt_at timestamptz,
  provider_email_id text UNIQUE,
  delivered_at timestamptz,
  failure_at timestamptz,
  deleted_at timestamptz,
  deleted_profile_count integer
);
CREATE UNIQUE INDEX kids_retention_one_current_term ON public.kids_retention_notices(parent_id,expiry)
  WHERE state <> 'cancelled';
CREATE TABLE public.kids_retention_delivery_events (
  event_id text PRIMARY KEY CHECK (char_length(event_id) BETWEEN 1 AND 200),
  notice_id uuid NOT NULL REFERENCES public.kids_retention_notices(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kids_retention_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_retention_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_retention_delivery_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kids_retention_control,public.kids_retention_notices,public.kids_retention_delivery_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.kids_retention_control,public.kids_retention_notices,public.kids_retention_delivery_events TO service_role;

-- Renewals, profile inserts and expiry deletion share the same family lock.
CREATE FUNCTION public.kids_lock_entitlement_family()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
    RAISE EXCEPTION 'Kids entitlement owner cannot change' USING ERRCODE='23514';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    (CASE WHEN TG_OP='DELETE' THEN OLD.parent_id ELSE NEW.parent_id END)::text,751603));
  IF TG_OP='DELETE' THEN
    UPDATE public.kids_retention_notices SET state='cancelled',claim_token=NULL,lease_until=NULL
      WHERE parent_id=OLD.parent_id AND state NOT IN ('cancelled','deleted');
    RETURN OLD;
  END IF;
  UPDATE public.kids_retention_notices SET state='cancelled',claim_token=NULL,lease_until=NULL
    WHERE parent_id=NEW.parent_id AND expiry IS DISTINCT FROM NEW.active_until
      AND state NOT IN ('cancelled','deleted');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_lock_entitlement_family() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER kids_entitlement_family_lock BEFORE INSERT OR UPDATE OR DELETE
  ON public.kids_family_entitlements FOR EACH ROW EXECUTE FUNCTION public.kids_lock_entitlement_family();

CREATE FUNCTION public.kids_prepare_retention_notices(p_limit integer DEFAULT 25)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; v_count integer:=0; v_inserted integer; v_expiry timestamptz; v_email text;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.kids_retention_control WHERE notices_enabled) THEN RETURN 0; END IF;
  FOR r IN SELECT e.parent_id FROM public.kids_family_entitlements e
    JOIN auth.users u ON u.id=e.parent_id AND u.email_confirmed_at IS NOT NULL
    WHERE e.active_until + interval '1824 hours' <= now()
    AND EXISTS(SELECT 1 FROM public.kids_profiles p WHERE p.parent_id=e.parent_id)
    AND NOT EXISTS(SELECT 1 FROM public.kids_retention_notices n
      WHERE n.parent_id=e.parent_id AND n.expiry=e.active_until AND n.recipient_email=u.email AND n.state<>'cancelled')
    ORDER BY e.active_until LIMIT greatest(1,least(coalesce(p_limit,25),100))
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(r.parent_id::text,751603));
    SELECT e.active_until,u.email INTO v_expiry,v_email FROM public.kids_family_entitlements e
      JOIN auth.users u ON u.id=e.parent_id AND u.email_confirmed_at IS NOT NULL
      WHERE e.parent_id=r.parent_id AND e.active_until + interval '1824 hours' <= now();
    IF v_expiry IS NULL OR v_email IS NULL THEN CONTINUE; END IF;
    UPDATE public.kids_retention_notices SET state='cancelled',claim_token=NULL,lease_until=NULL
      WHERE parent_id=r.parent_id AND state NOT IN ('deleted','cancelled')
      AND (expiry<>v_expiry OR recipient_email<>v_email);
    INSERT INTO public.kids_retention_notices(parent_id,expiry,recipient_email,profile_ids)
      SELECT r.parent_id,v_expiry,v_email,array_agg(p.id ORDER BY p.id)
      FROM public.kids_profiles p WHERE p.parent_id=r.parent_id
      HAVING count(*)>0 ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_inserted=ROW_COUNT; v_count:=v_count+v_inserted;
  END LOOP;
  RETURN v_count;
END;
$$;

CREATE FUNCTION public.kids_claim_retention_notices(p_limit integer DEFAULT 25)
RETURNS TABLE(notice_id uuid,claim_token uuid,recipient_email text,expiry timestamptz,first_attempt_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.kids_retention_control WHERE notices_enabled) THEN RETURN; END IF;
  RETURN QUERY WITH candidates AS (
    SELECT n.id FROM public.kids_retention_notices n
    JOIN public.kids_family_entitlements e ON e.parent_id=n.parent_id AND e.active_until=n.expiry
    JOIN auth.users u ON u.id=n.parent_id AND u.email=n.recipient_email AND u.email_confirmed_at IS NOT NULL
    WHERE n.state IN ('queued','sending') AND (n.lease_until IS NULL OR n.lease_until<=now())
      AND (n.first_attempt_at IS NULL OR n.first_attempt_at>now()-interval '23 hours')
      AND n.expiry+interval '1824 hours'<=now()
    ORDER BY n.created_at LIMIT greatest(1,least(coalesce(p_limit,25),100))
    FOR UPDATE OF n SKIP LOCKED
  ) UPDATE public.kids_retention_notices n SET state='sending',claim_token=gen_random_uuid(),
      lease_until=now()+interval '10 minutes',first_attempt_at=coalesce(n.first_attempt_at,now())
    FROM candidates c WHERE n.id=c.id
    RETURNING n.id,n.claim_token,n.recipient_email,n.expiry,n.first_attempt_at;
END;
$$;

CREATE FUNCTION public.kids_record_retention_submission(p_notice uuid,p_claim uuid,p_email_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF p_email_id IS NULL OR char_length(p_email_id) NOT BETWEEN 1 AND 200 THEN RETURN false; END IF;
  UPDATE public.kids_retention_notices SET state='submitted',provider_email_id=p_email_id,lease_until=NULL
    WHERE id=p_notice AND claim_token=p_claim AND state='sending';
  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.kids_block_retention_notice(p_notice uuid,p_claim uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  UPDATE public.kids_retention_notices SET state='blocked',failure_at=now(),lease_until=NULL
    WHERE id=p_notice AND claim_token=p_claim AND state='sending';
  RETURN FOUND;
END;
$$;

-- Called only after provider signature validation. Browser roles have no grants.
CREATE FUNCTION public.kids_record_retention_delivery(
  p_event_id text,p_email_id text,p_recipient text,p_kind text,p_occurred_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n public.kids_retention_notices%ROWTYPE;
BEGIN
  IF p_kind NOT IN ('email.delivered','email.bounced','email.complained','email.failed','email.suppressed') THEN RETURN true; END IF;
  SELECT * INTO n FROM public.kids_retention_notices WHERE provider_email_id=p_email_id FOR UPDATE;
  IF n.id IS NULL THEN
    -- Ignore unrelated mail, but retry a race with this recipient's in-flight send.
    RETURN NOT EXISTS(SELECT 1 FROM public.kids_retention_notices
      WHERE state='sending' AND recipient_email=p_recipient AND lease_until>now());
  END IF;
  IF p_recipient IS DISTINCT FROM n.recipient_email OR p_occurred_at IS NULL
    OR p_occurred_at>now()+interval '5 minutes' OR p_occurred_at<n.first_attempt_at-interval '5 minutes'
    OR p_occurred_at<n.expiry THEN RETURN false; END IF;
  INSERT INTO public.kids_retention_delivery_events(event_id,notice_id,event_type,occurred_at)
    VALUES(p_event_id,n.id,p_kind,p_occurred_at) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN EXISTS(SELECT 1 FROM public.kids_retention_delivery_events
    WHERE event_id=p_event_id AND notice_id=n.id AND event_type=p_kind AND occurred_at=p_occurred_at); END IF;
  IF n.state IN ('cancelled','deleted') THEN RETURN true; END IF;
  IF p_kind='email.delivered' AND n.failure_at IS NULL THEN
    UPDATE public.kids_retention_notices SET state='delivered',delivered_at=coalesce(delivered_at,p_occurred_at)
      WHERE id=n.id;
  ELSIF p_kind<>'email.delivered' THEN
    UPDATE public.kids_retention_notices SET state='blocked',failure_at=coalesce(failure_at,p_occurred_at)
      WHERE id=n.id;
  END IF;
  RETURN true;
END;
$$;

CREATE FUNCTION public.kids_retention_deletion_candidates(p_limit integer DEFAULT 25)
RETURNS TABLE(notice_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT id FROM public.kids_retention_notices
  WHERE EXISTS(SELECT 1 FROM public.kids_retention_control WHERE deletion_enabled)
    AND state='delivered' AND failure_at IS NULL AND delivered_at+interval '336 hours'<=now()
    AND expiry+interval '2160 hours'<=now()
  ORDER BY delivered_at LIMIT greatest(1,least(coalesce(p_limit,25),100));
$$;

CREATE FUNCTION public.kids_delete_expired_profiles(p_notice uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n public.kids_retention_notices%ROWTYPE; v_parent uuid; v_expiry timestamptz; v_count integer;
BEGIN
  IF pg_catalog.current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'Kids retention requires read committed isolation' USING ERRCODE='25001';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.kids_retention_control WHERE deletion_enabled) THEN RETURN 0; END IF;
  SELECT parent_id INTO v_parent FROM public.kids_retention_notices WHERE id=p_notice;
  IF v_parent IS NULL THEN RETURN 0; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_parent::text,751603));
  SELECT * INTO n FROM public.kids_retention_notices WHERE id=p_notice FOR UPDATE;
  SELECT active_until INTO v_expiry FROM public.kids_family_entitlements WHERE parent_id=v_parent;
  IF n.state<>'delivered' OR n.failure_at IS NOT NULL OR n.delivered_at IS NULL
    OR n.delivered_at+interval '336 hours'>now() OR n.expiry+interval '2160 hours'>now() THEN RETURN 0; END IF;
  IF v_expiry IS DISTINCT FROM n.expiry OR NOT EXISTS(
    SELECT 1 FROM auth.users WHERE id=v_parent AND email=n.recipient_email AND email_confirmed_at IS NOT NULL
  ) THEN
    UPDATE public.kids_retention_notices SET state='cancelled' WHERE id=p_notice;
    RETURN 0;
  END IF;
  -- Snapshot scope excludes any profile created after the notice was prepared.
  DELETE FROM public.kids_profiles WHERE parent_id=v_parent AND id=ANY(n.profile_ids) AND created_at<=n.created_at;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  UPDATE public.kids_retention_notices SET state='deleted',deleted_at=now(),deleted_profile_count=v_count WHERE id=p_notice;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.kids_prepare_retention_notices(integer),public.kids_claim_retention_notices(integer),
  public.kids_block_retention_notice(uuid,uuid),
  public.kids_record_retention_submission(uuid,uuid,text),public.kids_record_retention_delivery(text,text,text,text,timestamptz),
  public.kids_retention_deletion_candidates(integer),public.kids_delete_expired_profiles(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kids_prepare_retention_notices(integer),public.kids_claim_retention_notices(integer),
  public.kids_block_retention_notice(uuid,uuid),
  public.kids_record_retention_submission(uuid,uuid,text),public.kids_record_retention_delivery(text,text,text,text,timestamptz),
  public.kids_retention_deletion_candidates(integer),public.kids_delete_expired_profiles(uuid) TO service_role;
