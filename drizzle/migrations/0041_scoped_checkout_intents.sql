-- Existing LC09 ledger is the sole durable owner. Legacy rows are not converted.
ALTER TABLE billing.account_checkout_attempts
  ADD COLUMN checkout_scope text,
  ADD COLUMN checkout_environment text,
  ADD COLUMN selection_parameters text,
  ADD COLUMN session_expires_at timestamptz,
  ADD COLUMN create_started_at timestamptz,
  ADD COLUMN scoped_resolution text,
  ADD COLUMN resolved_at timestamptz,
  ADD CONSTRAINT scoped_checkout_shape CHECK (
    (checkout_scope IS NULL AND checkout_environment IS NULL) OR
    (checkout_scope IS NOT NULL AND checkout_environment IS NOT NULL
      AND checkout_scope IN ('kids','technical','academic') AND checkout_environment='live'
      AND selection_parameters IS NOT NULL AND session_expires_at IS NOT NULL
      AND create_started_at IS NOT NULL)),
  ADD CONSTRAINT scoped_checkout_resolution CHECK (
    (scoped_resolution IS NULL AND resolved_at IS NULL) OR
    (scoped_resolution IS NOT NULL AND scoped_resolution IN ('expired','completed_terminal') AND resolved_at IS NOT NULL));
CREATE UNIQUE INDEX account_checkout_one_scoped_unresolved
  ON billing.account_checkout_attempts(user_id,checkout_environment,checkout_scope)
  WHERE checkout_scope IS NOT NULL AND resolved_at IS NULL;

-- Exact legacy prefix only. Never infer a live scope from an unrelated Test key.
CREATE FUNCTION billing.scoped_checkout_scope(p_user uuid,p_key text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT s FROM unnest(ARRAY['kids','technical','academic']) s
 WHERE starts_with(p_key,s||'-live-checkout-'||p_user::text||'-') LIMIT 1
$$;
REVOKE ALL ON FUNCTION billing.scoped_checkout_scope(uuid,text) FROM PUBLIC,anon,authenticated;

-- Old binaries still call LC09 begin. Serialize those inserts against the same
-- fence too; ON CONFLICT exact-key replay remains available. No change to Test.
CREATE FUNCTION billing.guard_scoped_checkout_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s text; previous billing.account_checkout_attempts%ROWTYPE;
BEGIN
 IF TG_OP='UPDATE' THEN
   IF OLD.checkout_scope IS NOT NULL AND (
     ROW(NEW.id,NEW.user_id,NEW.idempotency_key,NEW.parameters,NEW.checkout_scope,NEW.checkout_environment,
       NEW.selection_parameters,NEW.session_expires_at,NEW.create_started_at)
       IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.idempotency_key,OLD.parameters,OLD.checkout_scope,OLD.checkout_environment,
       OLD.selection_parameters,OLD.session_expires_at,OLD.create_started_at)
     OR (OLD.session_id IS NOT NULL AND NEW.session_id IS DISTINCT FROM OLD.session_id)
     OR (OLD.resolved_at IS NOT NULL AND ROW(NEW.resolved_at,NEW.scoped_resolution)
         IS DISTINCT FROM ROW(OLD.resolved_at,OLD.scoped_resolution)))
   THEN RAISE EXCEPTION 'SCOPED_CHECKOUT_IMMUTABLE'; END IF;
   RETURN NEW;
 END IF;
 s:=coalesce(NEW.checkout_scope,billing.scoped_checkout_scope(NEW.user_id,NEW.idempotency_key));
 IF s IS NULL THEN RETURN NEW; END IF;
 IF billing.account_deletion_blocked(NEW.user_id) THEN RAISE EXCEPTION 'ACCOUNT_DELETION_PENDING'; END IF;
 SELECT * INTO previous FROM billing.account_checkout_attempts a
   WHERE a.idempotency_key=NEW.idempotency_key;
 IF FOUND THEN
   -- A still-running old binary always replays create, even with a known ID.
   -- Never let it reopen a reconciled generation or cross provider retention.
   IF previous.resolved_at IS NOT NULL OR clock_timestamp() >= previous.created_at+interval '23 hours'
     THEN RAISE EXCEPTION 'CHECKOUT_IN_PROGRESS'; END IF;
   RETURN NEW;
 END IF;
 IF EXISTS(SELECT 1 FROM billing.account_checkout_attempts a WHERE a.user_id=NEW.user_id
   AND coalesce(a.checkout_scope,billing.scoped_checkout_scope(a.user_id,a.idempotency_key))=s
   AND a.resolved_at IS NULL) THEN RAISE EXCEPTION 'CHECKOUT_IN_PROGRESS'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.guard_scoped_checkout_insert() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER account_checkout_scoped_insert BEFORE INSERT OR UPDATE ON billing.account_checkout_attempts
 FOR EACH ROW EXECUTE FUNCTION billing.guard_scoped_checkout_insert();

CREATE FUNCTION public.prepare_scoped_checkout_intent(
 p_user_id uuid,p_scope text,p_parameters text,p_offer boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; attempt uuid; expiry bigint; full_parameters text; now_at timestamptz;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_scope IS NULL OR p_scope NOT IN ('kids','technical','academic') OR p_offer IS NULL
   OR p_parameters IS NULL OR length(p_parameters) NOT BETWEEN 1 AND 7000
   OR EXISTS(SELECT 1 FROM unnest(string_to_array(p_parameters,'&')) x
      WHERE split_part(x,'=',1) IN ('expires_at','metadata%5Bcheckout_generation%5D','subscription_data%5Bmetadata%5D%5Bcheckout_generation%5D'))
   OR EXISTS(SELECT 1 FROM unnest(string_to_array(p_parameters,'&')) x
      GROUP BY split_part(x,'=',1) HAVING count(*)>1)
   OR strpos('&'||p_parameters||'&','&mode=subscription&')=0
   OR strpos('&'||p_parameters||'&','&client_reference_id='||p_user_id::text||'&')=0
   OR strpos('&'||p_parameters||'&','&metadata%5Buser_id%5D='||p_user_id::text||'&')=0
   OR strpos('&'||p_parameters||'&','&metadata%5Benvironment%5D=live&')=0
   OR strpos('&'||p_parameters||'&','&metadata%5Bproduct_scope%5D='||p_scope||'&')=0
   OR p_offer IS DISTINCT FROM (strpos('&'||p_parameters,'&metadata%5Boffer_reservation_id%5D=')>0)
 THEN RAISE EXCEPTION 'SCOPED_CHECKOUT_INVALID'; END IF;
 IF billing.account_deletion_blocked(p_user_id) THEN RAISE EXCEPTION 'ACCOUNT_DELETION_PENDING'; END IF;
 -- All relevant rows, including legacy state=reconciled without scoped proof.
 PERFORM 1 FROM billing.account_checkout_attempts a WHERE a.user_id=p_user_id
   AND coalesce(a.checkout_scope,billing.scoped_checkout_scope(a.user_id,a.idempotency_key))=p_scope
   AND a.resolved_at IS NULL ORDER BY a.id FOR UPDATE;
 SELECT jsonb_agg(jsonb_build_object(
   'checkout_generation',a.id,'checkout_session_id',a.session_id,
   'selection_matches',a.selection_parameters=p_parameters,
   'idempotency_key',a.idempotency_key,'parameters',a.parameters,
   'selection_parameters',a.selection_parameters,'session_expires_at',a.session_expires_at,
   'create_started_at',a.create_started_at,'legacy',a.checkout_scope IS NULL) ORDER BY a.id)
 INTO result FROM billing.account_checkout_attempts a WHERE a.user_id=p_user_id
   AND coalesce(a.checkout_scope,billing.scoped_checkout_scope(a.user_id,a.idempotency_key))=p_scope
   AND a.resolved_at IS NULL;
 IF result IS NOT NULL THEN RETURN result; END IF;
 attempt:=gen_random_uuid(); now_at:=clock_timestamp();
 -- Stripe needs at least 30 minutes remaining when it receives the create request.
 -- Leave one minute for transport and rounding. The offer reservation is separate.
 expiry:=floor(extract(epoch FROM now_at))::bigint+CASE WHEN p_offer THEN 1860 ELSE 86400 END;
 full_parameters:=p_parameters||'&expires_at='||expiry::text||
   '&metadata%5Bcheckout_generation%5D='||attempt::text||
   '&subscription_data%5Bmetadata%5D%5Bcheckout_generation%5D='||attempt::text;
 INSERT INTO billing.account_checkout_attempts(id,user_id,idempotency_key,parameters,
   checkout_scope,checkout_environment,selection_parameters,session_expires_at,create_started_at)
 VALUES(attempt,p_user_id,'scoped-'||p_scope||'-live-'||attempt::text,full_parameters,
   p_scope,'live',p_parameters,to_timestamp(expiry),now_at);
 RETURN jsonb_build_array(jsonb_build_object('checkout_generation',attempt,'checkout_session_id',NULL,
   'selection_matches',true,'idempotency_key','scoped-'||p_scope||'-live-'||attempt::text,
   'parameters',full_parameters,'selection_parameters',p_parameters,
   'session_expires_at',to_timestamp(expiry),'create_started_at',now_at,'legacy',false));
END $$;

CREATE FUNCTION public.attach_scoped_checkout_intent(
 p_user_id uuid,p_scope text,p_generation uuid,p_key text,p_session text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE blocked boolean; r billing.account_checkout_attempts%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 blocked:=billing.account_deletion_blocked(p_user_id);
 SELECT * INTO r FROM billing.account_checkout_attempts WHERE id=p_generation AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR p_scope IS NULL OR p_scope NOT IN ('kids','technical','academic')
   OR coalesce(r.checkout_scope,billing.scoped_checkout_scope(r.user_id,r.idempotency_key)) IS DISTINCT FROM p_scope
   OR r.idempotency_key IS DISTINCT FROM p_key OR p_session IS NULL OR p_session !~ '^cs_[A-Za-z0-9_]+$'
   OR (r.session_id IS NOT NULL AND r.session_id<>p_session)
 THEN RAISE EXCEPTION 'LC09_CHECKOUT_ATTEMPT_MISMATCH'; END IF;
 -- Record before refusal. Returning false commits; raising here would lose it.
 UPDATE billing.account_checkout_attempts SET session_id=p_session,
   state=CASE WHEN state='reconciled' THEN state ELSE 'recorded' END WHERE id=r.id;
 RETURN NOT blocked AND r.resolved_at IS NULL;
END $$;

CREATE FUNCTION public.close_scoped_checkout_intent(
 p_user_id uuid,p_scope text,p_generation uuid,p_key text,p_session text,
 p_disposition text,p_subscription text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.account_checkout_attempts%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 -- Acquire the same locks even during deletion; terminal evidence must survive.
 PERFORM billing.account_deletion_blocked(p_user_id);
 IF p_scope IS NULL OR p_scope NOT IN ('kids','technical','academic')
   OR p_disposition IS NULL OR p_disposition NOT IN ('expired','completed_terminal')
   OR (p_disposition='completed_terminal' AND (p_subscription IS NULL OR p_subscription !~ '^sub_[A-Za-z0-9_]+$'))
 THEN RAISE EXCEPTION 'SCOPED_CHECKOUT_INVALID'; END IF;
 SELECT * INTO r FROM billing.account_checkout_attempts WHERE id=p_generation AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR r.idempotency_key IS DISTINCT FROM p_key OR r.session_id IS DISTINCT FROM p_session OR p_session IS NULL
   OR coalesce(r.checkout_scope,billing.scoped_checkout_scope(r.user_id,r.idempotency_key)) IS DISTINCT FROM p_scope
 THEN RETURN false; END IF;
 IF r.resolved_at IS NOT NULL THEN RETURN r.scoped_resolution=p_disposition; END IF;
 UPDATE billing.account_checkout_attempts SET scoped_resolution=p_disposition,resolved_at=clock_timestamp(),state='reconciled'
 WHERE id=r.id;
 RETURN true;
END $$;

CREATE FUNCTION public.confirm_scoped_checkout_intent(
 p_user_id uuid,p_scope text,p_generation uuid,p_key text,p_session text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.account_checkout_attempts%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF billing.account_deletion_blocked(p_user_id) THEN RETURN false; END IF;
 SELECT * INTO r FROM billing.account_checkout_attempts WHERE id=p_generation AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR p_scope IS NULL OR p_scope NOT IN ('kids','technical','academic')
   OR r.idempotency_key IS DISTINCT FROM p_key OR r.session_id IS DISTINCT FROM p_session OR p_session IS NULL
   OR r.resolved_at IS NOT NULL
   OR coalesce(r.checkout_scope,billing.scoped_checkout_scope(r.user_id,r.idempotency_key)) IS DISTINCT FROM p_scope
 THEN RETURN false; END IF;
 RETURN NOT EXISTS(SELECT 1 FROM billing.account_checkout_attempts a WHERE a.user_id=p_user_id
   AND a.id<>r.id AND a.resolved_at IS NULL
   AND coalesce(a.checkout_scope,billing.scoped_checkout_scope(a.user_id,a.idempotency_key))=p_scope);
END $$;

REVOKE ALL ON FUNCTION public.prepare_scoped_checkout_intent(uuid,text,text,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.attach_scoped_checkout_intent(uuid,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.close_scoped_checkout_intent(uuid,text,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.confirm_scoped_checkout_intent(uuid,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_scoped_checkout_intent(uuid,text,text,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_scoped_checkout_intent(uuid,text,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.close_scoped_checkout_intent(uuid,text,uuid,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_scoped_checkout_intent(uuid,text,uuid,text,text) TO service_role;
