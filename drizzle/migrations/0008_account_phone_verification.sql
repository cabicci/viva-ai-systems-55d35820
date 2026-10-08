-- Additive account phone ownership. No subscription, Auth phone-login or sends enabled.
BEGIN;
CREATE SCHEMA communications_private;
REVOKE ALL ON SCHEMA communications_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA communications_private TO service_role;
CREATE TABLE communications_private.phone_control (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 enabled boolean NOT NULL DEFAULT false,
 test_users uuid[] NOT NULL DEFAULT '{}',
 countries text[] NOT NULL DEFAULT '{EG}',
 budget_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
 day_sends integer NOT NULL DEFAULT 0 CHECK(day_sends>=0),
 daily_cap integer NOT NULL DEFAULT 20 CHECK(daily_cap BETWEEN 1 AND 100)
);
INSERT INTO communications_private.phone_control(singleton) VALUES(true);
CREATE TABLE communications_private.verified_phones (
 actor uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 phone text NOT NULL UNIQUE CHECK(phone ~ '^\+[1-9][0-9]{7,14}$'),
 verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE communications_private.phone_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 phone text NOT NULL CHECK(phone ~ '^\+[1-9][0-9]{7,14}$'),
 service_sid text NOT NULL CHECK(service_sid ~ '^VA[a-fA-F0-9]{32}$'),
 verification_sid text CHECK(verification_sid ~ '^VE[a-fA-F0-9]{32}$'),
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','pending','uncertain','checking','exhausted','verified')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',
 checks integer NOT NULL DEFAULT 0 CHECK(checks BETWEEN 0 AND 5),
 lease uuid,
 lease_until timestamptz NOT NULL DEFAULT now()+interval '30 seconds'
);
CREATE INDEX phone_challenges_actor ON communications_private.phone_challenges(actor,created_at);
CREATE INDEX phone_challenges_number ON communications_private.phone_challenges(phone,created_at);
ALTER TABLE communications_private.phone_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_private.verified_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_private.phone_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA communications_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION communications_private.phone_command(p_actor uuid,p_action text,p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c communications_private.phone_control%ROWTYPE;
 q communications_private.phone_challenges%ROWTYPE;
 v_phone text; v_time timestamptz; v_id uuid; v_lease uuid;
BEGIN
 IF coalesce(auth.jwt()->>'role','')<>'service_role' THEN RAISE EXCEPTION 'PHONE_SERVER_REQUIRED'; END IF;
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor)
   THEN RAISE EXCEPTION 'PHONE_ACCOUNT_UNAVAILABLE'; END IF;
 -- Shares the deletion locks and sees current Auth state at every write boundary.
 IF billing.account_deletion_blocked(p_actor) THEN RAISE EXCEPTION 'PHONE_ACCOUNT_UNAVAILABLE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor AND email_confirmed_at IS NOT NULL)
   THEN RAISE EXCEPTION 'EMAIL_CONFIRMATION_REQUIRED'; END IF;
 SELECT * INTO c FROM communications_private.phone_control WHERE singleton;
 IF p_action='status' THEN
  SELECT phone,verified_at INTO v_phone,v_time FROM communications_private.verified_phones WHERE actor=p_actor;
  RETURN jsonb_build_object('enabled',c.enabled AND p_actor=ANY(c.test_users),'phone',v_phone,'verifiedAt',v_time);
 END IF;
 IF NOT c.enabled OR NOT p_actor=ANY(c.test_users) THEN RAISE EXCEPTION 'PHONE_DISABLED'; END IF;
 IF p_action='reserve' THEN
  -- Serialize global + per-number quotas; reserve before any paid provider call.
  PERFORM pg_advisory_xact_lock(hashtextextended('masaarat-phone-budget',0));
  SELECT * INTO c FROM communications_private.phone_control WHERE singleton FOR UPDATE;
  IF NOT c.enabled OR NOT p_actor=ANY(c.test_users) THEN RAISE EXCEPTION 'PHONE_DISABLED'; END IF;
  v_phone:=p_data->>'phone';
  IF v_phone IS NULL OR v_phone !~ '^\+[1-9][0-9]{7,14}$' THEN RAISE EXCEPTION 'PHONE_INVALID'; END IF;
  IF coalesce(p_data->>'country','')<>ALL(c.countries)
    OR (p_data->>'country'='EG' AND v_phone !~ '^\+20') THEN RAISE EXCEPTION 'PHONE_COUNTRY_UNAVAILABLE'; END IF;
  IF EXISTS(SELECT 1 FROM communications_private.verified_phones WHERE phone=v_phone AND actor<>p_actor)
    THEN RAISE EXCEPTION 'PHONE_INVALID'; END IF;
  IF EXISTS(SELECT 1 FROM communications_private.phone_challenges WHERE actor=p_actor
      AND state IN ('reserved','pending','uncertain','checking') AND expires_at>now())
    THEN RAISE EXCEPTION 'PHONE_COOLDOWN'; END IF;
  IF (SELECT count(*) FROM communications_private.phone_challenges WHERE actor=p_actor AND created_at>now()-interval '1 day')>=3
    OR (SELECT count(*) FROM communications_private.phone_challenges WHERE phone=v_phone AND created_at>now()-interval '1 day')>=3
    THEN RAISE EXCEPTION 'PHONE_LIMIT'; END IF;
  IF c.budget_day<>(now() AT TIME ZONE 'UTC')::date THEN
    UPDATE communications_private.phone_control SET budget_day=(now() AT TIME ZONE 'UTC')::date,day_sends=0 WHERE singleton;
    c.day_sends:=0;
  END IF;
  IF c.day_sends>=c.daily_cap THEN RAISE EXCEPTION 'PHONE_LIMIT'; END IF;
  INSERT INTO communications_private.phone_challenges(actor,phone,service_sid)
    VALUES(p_actor,v_phone,p_data->>'serviceSid') RETURNING * INTO q;
  UPDATE communications_private.phone_control SET day_sends=day_sends+1 WHERE singleton;
  RETURN jsonb_build_object('challengeId',q.id,'expiresAt',q.expires_at);
 END IF;
 v_id:=(p_data->>'challengeId')::uuid;
 SELECT * INTO q FROM communications_private.phone_challenges WHERE id=v_id AND actor=p_actor FOR UPDATE;
 IF NOT FOUND OR q.expires_at<=now() THEN RAISE EXCEPTION 'PHONE_CHALLENGE_EXPIRED'; END IF;
 IF p_action IN ('sent','uncertain') THEN
  IF q.state<>'reserved' OR q.lease_until<=now() THEN RAISE EXCEPTION 'PHONE_CHALLENGE_STATE'; END IF;
  UPDATE communications_private.phone_challenges SET state=CASE WHEN p_action='sent' THEN 'pending' ELSE 'uncertain' END,
   verification_sid=CASE WHEN p_action='sent' THEN p_data->>'verificationSid' ELSE NULL END,lease_until=now() WHERE id=q.id;
  RETURN '{}'::jsonb;
 ELSIF p_action='claim_check' THEN
  IF q.state<>'pending' OR q.verification_sid IS NULL OR q.checks>=5 THEN RAISE EXCEPTION 'PHONE_CHALLENGE_STATE'; END IF;
  v_lease:=gen_random_uuid();
  UPDATE communications_private.phone_challenges SET state='checking',checks=checks+1,lease=v_lease,
    lease_until=now()+interval '30 seconds' WHERE id=q.id;
  RETURN jsonb_build_object('phone',q.phone,'serviceSid',q.service_sid,'verificationSid',q.verification_sid,'lease',v_lease);
 ELSIF p_action IN ('checked','check_failed') THEN
  IF q.state<>'checking' OR q.lease IS DISTINCT FROM (p_data->>'lease')::uuid OR q.lease_until<=now()
    THEN RAISE EXCEPTION 'PHONE_CHALLENGE_STATE'; END IF;
  IF p_action='checked' AND p_data->'approved'='true'::jsonb THEN
   PERFORM pg_advisory_xact_lock(hashtextextended('masaarat-phone-budget',0));
   IF EXISTS(SELECT 1 FROM communications_private.verified_phones WHERE phone=q.phone AND actor<>p_actor)
     THEN RAISE EXCEPTION 'PHONE_INVALID'; END IF;
   INSERT INTO communications_private.verified_phones(actor,phone) VALUES(p_actor,q.phone)
    ON CONFLICT(actor) DO UPDATE SET phone=excluded.phone,verified_at=now();
   UPDATE communications_private.phone_challenges SET state='verified',lease=NULL,lease_until=now() WHERE id=q.id;
   RETURN jsonb_build_object('verified',true);
  END IF;
  UPDATE communications_private.phone_challenges SET state=CASE WHEN checks>=5 THEN 'exhausted' ELSE 'pending' END,
    lease=NULL,lease_until=now() WHERE id=q.id;
  RETURN jsonb_build_object('verified',false);
 END IF;
 RAISE EXCEPTION 'PHONE_ACTION_INVALID';
END $$;
REVOKE ALL ON FUNCTION communications_private.phone_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION communications_private.phone_command(uuid,text,jsonb) TO service_role;
CREATE FUNCTION public.account_phone_command(p_actor uuid,p_action text,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT communications_private.phone_command(p_actor,p_action,p_data);
$$;
REVOKE ALL ON FUNCTION public.account_phone_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.account_phone_command(uuid,text,jsonb) TO service_role;

-- Wrap, do not replace the installed financial/commerce/journey deletion chain.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 IF position('p_lease_token' IN d)=0 OR position('p_next_stage' IN d)=0
   THEN RAISE EXCEPTION 'PHONE_DELETION_CONTRACT_CHANGED'; END IF;
 EXECUTE replace(d,'FUNCTION public.lc09_advance_deletion(',
   'FUNCTION communications_private.previous_advance_deletion(');
END $$;
REVOKE ALL ON FUNCTION communications_private.previous_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; BEGIN
 -- Same lock order as the existing deletion chain and all verification actions.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,751603));
 PERFORM pg_advisory_xact_lock(hashtextextended('account-lifecycle:'||p_user_id::text,0));
 IF p_next_stage IN ('provider_reconciled','learner_erased') AND EXISTS(
   SELECT 1 FROM communications_private.phone_challenges WHERE actor=p_user_id
    AND state IN ('reserved','checking') AND lease_until>now())
   THEN RAISE EXCEPTION 'LC09_PHONE_ATTEMPT_PENDING'; END IF;
 result:=communications_private.previous_advance_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN
  DELETE FROM communications_private.phone_challenges WHERE actor=p_user_id;
  DELETE FROM communications_private.verified_phones WHERE actor=p_user_id;
  UPDATE communications_private.phone_control SET test_users=array_remove(test_users,p_user_id) WHERE singleton;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) TO service_role;
COMMIT;
