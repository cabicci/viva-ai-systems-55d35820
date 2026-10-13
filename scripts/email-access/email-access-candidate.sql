-- REVIEW CANDIDATE ONLY. No production apply/deployment authorized by this PR.
-- Apply through Lovable after approval, against the merged cumulative schema.
BEGIN;
CREATE TABLE billing.email_access_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 recipient_email text NOT NULL CHECK(recipient_email=lower(btrim(recipient_email)) AND length(recipient_email)<=254 AND recipient_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 scope_mode text NOT NULL CHECK(scope_mode IN ('all_published','selected')),
 catalogues text[] NOT NULL DEFAULT '{}',
 duration_days integer CHECK(duration_days BETWEEN 1 AND 36500),
 user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 activated_at timestamptz, ends_at timestamptz, revoked_at timestamptz,
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 request_key uuid NOT NULL UNIQUE, parameters jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((scope_mode='all_published' AND cardinality(catalogues)=0) OR (scope_mode='selected' AND cardinality(catalogues)>0)),
 CHECK((user_id IS NULL AND activated_at IS NULL AND ends_at IS NULL) OR
  (user_id IS NOT NULL AND activated_at IS NOT NULL AND ((duration_days IS NULL AND ends_at IS NULL) OR (duration_days IS NOT NULL AND ends_at IS NOT NULL AND ends_at>activated_at))))
);
CREATE INDEX email_access_pending_email ON billing.email_access_grants(recipient_email) WHERE user_id IS NULL AND revoked_at IS NULL;
CREATE INDEX email_access_owned ON billing.email_access_grants(user_id) WHERE revoked_at IS NULL;
CREATE TABLE billing.email_access_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 grant_id uuid NOT NULL REFERENCES billing.email_access_grants(id) ON DELETE CASCADE,
 actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 action text NOT NULL CHECK(action IN ('created','activated','extended','revoked')),
 request_key uuid UNIQUE, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.email_access_mail (
 id uuid PRIMARY KEY REFERENCES billing.email_access_grants(id) ON DELETE CASCADE,
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','unknown','suppressed')),
 claim_token uuid, lease_until timestamptz, first_attempt_at timestamptz, attempts integer NOT NULL DEFAULT 0,
 provider_id text, created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['email_access_grants','email_access_audit','email_access_mail'] LOOP
  EXECUTE format('ALTER TABLE billing.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON billing.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;

-- Actual published catalogues, not a global Pro Plus shortcut. All mode also
-- covers future publications; release/approval/locale gates still apply.
CREATE FUNCTION billing.email_access_catalogues() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_array(
  jsonb_build_object('id','ai:pro','title','AI Pro — 71 lessons'),
  jsonb_build_object('id','ai:pro_plus','title','AI Pro Plus — 100 lessons'))
 || CASE WHEN EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND lesson_access_enabled AND accepts_child_data)
   AND EXISTS(SELECT 1 FROM public.kids_content_approvals)
 THEN jsonb_build_array(jsonb_build_object('id','kids','title','Kids')) ELSE '[]'::jsonb END
 || CASE WHEN EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled)
   AND EXISTS(SELECT 1 FROM public.technical_lesson_content)
 THEN jsonb_build_array(jsonb_build_object('id','technical:furniture','title','Technical — furniture')) ELSE '[]'::jsonb END
 || coalesce((SELECT jsonb_agg(jsonb_build_object('id','academic:'||c.id,'title',coalesce(c.titles->>'en',c.id),'titles',c.titles) ORDER BY c.id)
 FROM public.academic_courses c WHERE c.enabled AND EXISTS(SELECT 1 FROM public.academic_lesson_content l WHERE l.course_id=c.id AND l.approved)),'[]'::jsonb);
$$;
CREATE FUNCTION billing.email_access_has(p_user uuid,p_catalogue text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_user IS NOT NULL AND billing.commerce_account_allowed(p_user)
 AND EXISTS(SELECT 1 FROM billing.email_access_grants g JOIN auth.users u ON u.id=g.user_id
 WHERE g.user_id=p_user AND u.email_confirmed_at IS NOT NULL
 AND lower(btrim(u.email))=g.recipient_email
 AND g.activated_at<=now() AND g.revoked_at IS NULL AND (g.ends_at IS NULL OR g.ends_at>now())
 AND (g.scope_mode='all_published' OR p_catalogue=ANY(g.catalogues)));
$$;
CREATE FUNCTION billing.email_access_activate(p_user uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text; g billing.email_access_grants%ROWTYPE; n integer:=0;
BEGIN
 SELECT lower(btrim(email)) INTO v_email FROM auth.users WHERE id=p_user AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL OR NOT billing.commerce_account_allowed(p_user) THEN RETURN 0; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('email-access:'||v_email,0));
 FOR g IN SELECT * FROM billing.email_access_grants WHERE recipient_email=v_email AND user_id IS NULL AND revoked_at IS NULL ORDER BY id FOR UPDATE LOOP
  UPDATE billing.email_access_grants SET user_id=p_user,activated_at=now(),
   ends_at=CASE WHEN duration_days IS NULL THEN NULL ELSE now()+make_interval(days=>duration_days) END WHERE id=g.id;
  INSERT INTO billing.email_access_audit(grant_id,actor,action) VALUES(g.id,p_user,'activated');
  n:=n+1;
 END LOOP;
 RETURN n;
END $$;
CREATE FUNCTION billing.email_access_verified_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- Auth confirmation and grant activation commit in the SAME transaction.
 -- Registration with an unconfirmed email does nothing; no user is created here.
 IF NEW.email_confirmed_at IS NOT NULL THEN PERFORM billing.email_access_activate(NEW.id); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER email_access_verified AFTER INSERT OR UPDATE OF email,email_confirmed_at ON auth.users
 FOR EACH ROW EXECUTE FUNCTION billing.email_access_verified_trigger();
CREATE FUNCTION public.activate_my_email_access_grants() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commerce_assert_identity(auth.uid());
 RETURN billing.email_access_activate(auth.uid());
END $$;

CREATE FUNCTION public.email_access_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); g billing.email_access_grants%ROWTYPE; v_email text; v_key uuid;
 v_scope text; v_catalogues text[]; v_duration integer; v_params jsonb; v_existing jsonb;
 v_user uuid; v_invite boolean; v_locale text;
BEGIN
 PERFORM billing.commerce_assert_identity(actor);
 IF NOT public.has_role(actor,'admin'::public.app_role) THEN RAISE EXCEPTION 'EMAIL_ACCESS_ADMIN_REQUIRED'; END IF;
 IF p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>16384 THEN RAISE EXCEPTION 'EMAIL_ACCESS_INVALID_INPUT'; END IF;
 IF p_action='list' THEN
  RETURN jsonb_build_object('catalogues',billing.email_access_catalogues(),'grants',coalesce(
   (SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (
    SELECT listed.id,listed.recipient_email,listed.scope_mode,listed.catalogues,listed.duration_days,listed.user_id,listed.activated_at,listed.ends_at,listed.revoked_at,listed.created_at,
    CASE WHEN listed.revoked_at IS NOT NULL THEN 'revoked' WHEN listed.user_id IS NULL THEN 'pending_registration'
     WHEN listed.ends_at<=now() THEN 'expired' ELSE 'active' END AS status,
    (SELECT m.status FROM billing.email_access_mail m WHERE m.id=listed.id) AS invitation_status,
    coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'actor',a.actor,'action',a.action,'details',a.details,'created_at',a.created_at) ORDER BY a.created_at,a.id)
     FROM billing.email_access_audit a WHERE a.grant_id=listed.id),'[]'::jsonb) AS audit
    FROM billing.email_access_grants listed) x),'[]'::jsonb));
 END IF;
 v_key:=(p_data->>'key')::uuid;
 IF v_key IS NULL THEN RAISE EXCEPTION 'EMAIL_ACCESS_KEY_REQUIRED'; END IF;
 -- Request locks serialize retries; email locks serialize creation/activation.
 PERFORM pg_advisory_xact_lock(hashtextextended('email-access-request:'||v_key::text,0));
 IF p_action='create' THEN
  v_email:=lower(btrim(p_data->>'email')); v_scope:=p_data->>'scope_mode';
  v_duration:=(p_data->>'duration_days')::integer; v_invite:=coalesce((p_data->>'invitation')::boolean,false);
  v_locale:=coalesce(p_data->>'locale','ar-EG');
  IF v_email IS NULL OR length(v_email)>254 OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   OR v_scope IS NULL OR v_scope NOT IN ('all_published','selected')
   OR (v_duration IS NOT NULL AND v_duration NOT BETWEEN 1 AND 36500)
   OR v_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en')
   OR jsonb_typeof(coalesce(p_data->'catalogues','[]'))<>'array'
   THEN RAISE EXCEPTION 'EMAIL_ACCESS_INVALID_INPUT'; END IF;
  SELECT coalesce(array_agg(DISTINCT x ORDER BY x),'{}') INTO v_catalogues FROM jsonb_array_elements_text(coalesce(p_data->'catalogues','[]')) x;
  IF (v_scope='all_published' AND cardinality(v_catalogues)<>0) OR (v_scope='selected' AND cardinality(v_catalogues)=0)
   OR EXISTS(SELECT 1 FROM unnest(v_catalogues) c WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(billing.email_access_catalogues()) p WHERE p->>'id'=c))
   THEN RAISE EXCEPTION 'EMAIL_ACCESS_INVALID_SCOPE'; END IF;
  v_params:=jsonb_build_object('email',v_email,'scope_mode',v_scope,'catalogues',v_catalogues,'duration_days',v_duration,'invitation',v_invite,'locale',v_locale);
  SELECT * INTO g FROM billing.email_access_grants WHERE request_key=v_key;
  IF FOUND THEN
   IF g.parameters<>v_params THEN RAISE EXCEPTION 'EMAIL_ACCESS_KEY_CONFLICT'; END IF;
   RETURN jsonb_build_object('id',g.id);
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('email-access:'||v_email,0));
  INSERT INTO billing.email_access_grants(recipient_email,scope_mode,catalogues,duration_days,created_by,request_key,parameters)
  VALUES(v_email,v_scope,v_catalogues,v_duration,actor,v_key,v_params) RETURNING * INTO g;
  INSERT INTO billing.email_access_audit(grant_id,actor,action,request_key) VALUES(g.id,actor,'created',v_key);
  IF v_invite THEN INSERT INTO billing.email_access_mail(id,locale) VALUES(g.id,v_locale); END IF;
  -- Do not lock the Auth row: verification already holds it before its trigger.
  SELECT id INTO v_user FROM auth.users WHERE lower(btrim(email))=v_email AND email_confirmed_at IS NOT NULL;
  IF v_user IS NOT NULL THEN PERFORM billing.email_access_activate(v_user); END IF;
  RETURN jsonb_build_object('id',g.id);
 ELSIF p_action IN ('revoke','extend') THEN
  v_params:=jsonb_build_object('id',p_data->>'id','action',p_action,'duration_days',p_data->'duration_days');
  SELECT details INTO v_existing FROM billing.email_access_audit WHERE request_key=v_key;
  IF FOUND THEN
   IF v_existing<>v_params THEN RAISE EXCEPTION 'EMAIL_ACCESS_KEY_CONFLICT'; END IF;
   RETURN jsonb_build_object('id',p_data->>'id');
  END IF;
  SELECT * INTO g FROM billing.email_access_grants WHERE id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EMAIL_ACCESS_NOT_FOUND'; END IF;
  IF p_action='revoke' THEN
   IF g.revoked_at IS NULL THEN
    UPDATE billing.email_access_grants SET revoked_at=now() WHERE id=g.id;
    UPDATE billing.email_access_mail SET status='suppressed' WHERE id=g.id AND status='pending';
   END IF;
  ELSE
   v_duration:=(p_data->>'duration_days')::integer;
   IF g.user_id IS NULL OR g.revoked_at IS NOT NULL OR g.ends_at IS NULL OR v_duration IS NULL OR v_duration NOT BETWEEN 1 AND 36500
    THEN RAISE EXCEPTION 'EMAIL_ACCESS_NOT_EXTENDABLE'; END IF;
   UPDATE billing.email_access_grants SET ends_at=greatest(ends_at,now())+make_interval(days=>v_duration) WHERE id=g.id;
  END IF;
  INSERT INTO billing.email_access_audit(grant_id,actor,action,request_key,details) VALUES(g.id,actor,CASE p_action WHEN 'revoke' THEN 'revoked' ELSE 'extended' END,v_key,v_params);
  RETURN jsonb_build_object('id',g.id);
 END IF;
 RAISE EXCEPTION 'EMAIL_ACCESS_UNKNOWN_ACTION';
END $$;

-- Compose with each existing access authority; never write subscription/roles.
DO $$ BEGIN
 EXECUTE replace(pg_get_functiondef('billing.commerce_external_package(uuid)'::regprocedure),
  'FUNCTION billing.commerce_external_package(', 'FUNCTION billing.email_previous_external_package(');
 EXECUTE replace(pg_get_functiondef('billing.get_entitlement_snapshot(uuid)'::regprocedure),
  'FUNCTION billing.get_entitlement_snapshot(', 'FUNCTION billing.email_previous_snapshot(');
 EXECUTE replace(pg_get_functiondef('public.get_my_kids_access_status()'::regprocedure),
  'FUNCTION public.get_my_kids_access_status(', 'FUNCTION billing.email_previous_kids_status(');
 EXECUTE replace(pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure),
  'FUNCTION public.lc09_advance_deletion(', 'FUNCTION billing.email_previous_deletion(');
END $$;
CREATE OR REPLACE FUNCTION billing.commerce_external_package(p_user uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE old_package text;
BEGIN
 old_package:=billing.email_previous_external_package(p_user);
 IF old_package='pro_plus' OR billing.email_access_has(p_user,'ai:pro_plus') THEN RETURN 'pro_plus'; END IF;
 IF old_package='pro' OR billing.email_access_has(p_user,'ai:pro') THEN RETURN 'pro'; END IF;
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION billing.get_entitlement_snapshot(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; deadline timestamptz;
BEGIN
 result:=billing.email_previous_snapshot(p_user_id);
 -- Clamp cached snapshots at the nearest finite grant deadline; paid sources
 -- may refresh early but remain independently valid after expiry/revocation.
 SELECT min(ends_at) INTO deadline FROM billing.email_access_grants WHERE user_id=p_user_id
 AND activated_at<=now() AND revoked_at IS NULL AND ends_at>now();
 IF deadline IS NOT NULL AND result ? 'expires_at' THEN
  result:=jsonb_set(result,'{expires_at}',to_jsonb(least((result->>'expires_at')::timestamptz,deadline)));
 END IF;
 RETURN result;
END $$;
DO $$ DECLARE d text; target regprocedure; needle text;
BEGIN
 target:=coalesce(to_regprocedure('billing.kids_previous_admin_lesson_access(uuid,text,integer,text)'),to_regprocedure('public.kids_can_access_lesson(uuid,text,integer,text)'));
 d:=pg_get_functiondef(target);
 needle:='requested_lesson BETWEEN 1 AND 2 OR EXISTS';
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'EMAIL_ACCESS_KIDS_DEFINITION_CHANGED'; END IF;
 EXECUTE replace(d,needle,'requested_lesson BETWEEN 1 AND 2 OR billing.email_access_has(auth.uid(),''kids'') OR EXISTS');
 d:=pg_get_functiondef('public.technical_can_access(text)'::regprocedure);
 needle:='p_lesson=''M01-L01'' OR public.has_role';
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'EMAIL_ACCESS_TECHNICAL_DEFINITION_CHANGED'; END IF;
 EXECUTE replace(d,needle,'p_lesson=''M01-L01'' OR billing.email_access_has(auth.uid(),''technical:furniture'') OR public.has_role');
 EXECUTE replace(pg_get_functiondef('public.academic_can_access(text,text,text)'::regprocedure),
  'FUNCTION public.academic_can_access(', 'FUNCTION billing.email_previous_academic_access(');
END $$;
CREATE OR REPLACE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.email_previous_academic_access(p_course,p_lesson,p_locale)
 OR (billing.email_access_has(auth.uid(),'academic:'||p_course) AND EXISTS(
 SELECT 1 FROM public.academic_courses c JOIN public.academic_lesson_content l ON l.course_id=c.id
 WHERE c.id=p_course AND c.enabled AND l.lesson_id=p_lesson AND l.locale=p_locale AND l.approved));
$$;
CREATE OR REPLACE FUNCTION public.get_my_kids_access_status() RETURNS TABLE(access_source text,active_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT billing.commerce_account_allowed(auth.uid()) THEN RETURN; END IF;
 RETURN QUERY SELECT s.access_source,s.active_until FROM (
 SELECT * FROM billing.email_previous_kids_status()
 UNION ALL SELECT 'complimentary_email'::text,max(coalesce(g.ends_at,'9999-12-31'::timestamptz))
 FROM billing.email_access_grants g WHERE g.user_id=auth.uid() AND billing.email_access_has(auth.uid(),'kids')
 AND (g.scope_mode='all_published' OR 'kids'=ANY(g.catalogues)) AND g.revoked_at IS NULL AND g.activated_at<=now() AND (g.ends_at IS NULL OR g.ends_at>now())
 HAVING count(*)>0) s ORDER BY s.active_until DESC LIMIT 1;
 -- Year 9999 is only the existing finite timestamp UI adapter for permanent.
END $$;

-- Extend the existing scheduler/Resend stream, with durable opt-in mail only.
CREATE FUNCTION public.email_access_mail(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m billing.email_access_mail%ROWTYPE; result jsonb:='[]'; g billing.email_access_grants%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'EMAIL_ACCESS_MAIL_SERVICE_ONLY'; END IF;
 IF p_action='claim' THEN
  UPDATE billing.email_access_mail SET status='unknown',lease_until=NULL WHERE status='sending' AND lease_until<=now();
  FOR m IN SELECT mm.* FROM billing.email_access_mail mm JOIN billing.email_access_grants gg ON gg.id=mm.id
   WHERE mm.status='pending' AND (p_data->>'id' IS NULL OR mm.id=(p_data->>'id')::uuid)
   ORDER BY mm.created_at LIMIT 25 FOR UPDATE OF mm SKIP LOCKED LOOP
   SELECT * INTO g FROM billing.email_access_grants WHERE id=m.id;
   IF g.revoked_at IS NOT NULL OR g.ends_at<=now() OR m.attempts>=3 OR m.first_attempt_at<now()-interval '23 hours'
    OR EXISTS(SELECT 1 FROM auth.users u WHERE lower(btrim(u.email))=g.recipient_email AND NOT billing.commerce_account_allowed(u.id))
    THEN UPDATE billing.email_access_mail SET status='suppressed' WHERE id=m.id; CONTINUE; END IF;
   UPDATE billing.email_access_mail SET status='sending',claim_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',
    first_attempt_at=coalesce(first_attempt_at,now()),attempts=attempts+1 WHERE id=m.id RETURNING * INTO m;
   result:=result||jsonb_build_array(jsonb_build_object('id',m.id,'claim_token',m.claim_token,'recipient',g.recipient_email,
    'payload',jsonb_build_object('locale',m.locale,'scope_mode',g.scope_mode,'catalogues',g.catalogues,'duration_days',g.duration_days)));
  END LOOP;
  RETURN result;
 END IF;
 SELECT * INTO m FROM billing.email_access_mail WHERE id=(p_data->>'id')::uuid AND claim_token=(p_data->>'claim_token')::uuid AND status='sending' AND lease_until>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN 'false'; END IF;
 SELECT * INTO g FROM billing.email_access_grants WHERE id=m.id;
 IF p_action='authorize_attempt' THEN
  IF g.revoked_at IS NOT NULL OR g.ends_at<=now() OR EXISTS(SELECT 1 FROM auth.users u WHERE lower(btrim(u.email))=g.recipient_email AND NOT billing.commerce_account_allowed(u.id)) THEN
   UPDATE billing.email_access_mail SET status='suppressed',lease_until=NULL WHERE id=m.id; RETURN 'false';
  END IF;
  RETURN 'true';
 ELSIF p_action='result' THEN
  UPDATE billing.email_access_mail SET provider_id=p_data->>'provider_id',lease_until=NULL,
   status=CASE WHEN nullif(p_data->>'provider_id','') IS NOT NULL THEN 'sent'
    WHEN coalesce((p_data->>'retryable')::boolean,false) AND attempts<3 THEN 'pending' ELSE 'failed' END WHERE id=m.id;
  RETURN 'true';
 END IF;
 RAISE EXCEPTION 'EMAIL_ACCESS_UNKNOWN_MAIL_ACTION';
END $$;
CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; v_email text;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY'; END IF;
 SELECT lower(btrim(email)) INTO v_email FROM auth.users WHERE id=p_user_id;
 IF p_next_stage IN ('provider_reconciled','learner_erased') AND EXISTS(
 SELECT 1 FROM billing.email_access_mail m JOIN billing.email_access_grants g ON g.id=m.id
 WHERE (g.user_id=p_user_id OR g.recipient_email=v_email) AND m.status='sending' AND m.lease_until>now())
 THEN RAISE EXCEPTION 'LC09_EMAIL_ACCESS_MAIL_PENDING'; END IF;
 result:=billing.email_previous_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN
  DELETE FROM billing.email_access_grants WHERE user_id=p_user_id OR recipient_email=v_email;
 END IF;
 RETURN result;
END $$;
-- Nonfinancial grants are erased at learner_erased, before the 15-day purge.
-- Classify the owned table in the existing fail-closed inventory, retaining
-- its checks that no owned records remain and every other table is classified.
DO $$ DECLARE d text; needle text:='''account_deletion_requests'',''account_deletion_lifecycle'''; BEGIN
 d:=pg_get_functiondef('public.commerce_previous_lc09_complete_financial_purge(uuid,uuid,boolean)'::regprocedure);
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'EMAIL_ACCESS_ERASURE_INVENTORY_CHANGED'; END IF;
 EXECUTE replace(d,needle,needle||',''email_access_grants''');
END $$;
-- Every new private helper has explicit ACLs, including cloned functions.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='billing'::regnamespace
 AND (proname LIKE 'email_access_%' OR proname LIKE 'email_previous_%') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',r.signature);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.email_access_command(text,jsonb),public.activate_my_email_access_grants(),public.email_access_mail(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.email_access_command(text,jsonb),public.activate_my_email_access_grants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.email_access_mail(text,jsonb) TO service_role;
COMMIT;

