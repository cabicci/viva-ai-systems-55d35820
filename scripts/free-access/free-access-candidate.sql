-- Review/rehearsal candidate, applied only to disposable test databases here.
-- No automatic trial, per-user grant, plan upgrade, cron or payment mutation.
BEGIN;
CREATE TABLE billing.free_access_windows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 160),
 targets text[] NOT NULL CHECK(cardinality(targets) BETWEEN 1 AND 100 AND array_position(targets,NULL) IS NULL),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 enabled boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX free_access_window_clock ON billing.free_access_windows(starts_at,ends_at) WHERE enabled;
CREATE TABLE billing.free_access_window_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), window_id uuid NOT NULL REFERENCES billing.free_access_windows(id),
 actor uuid REFERENCES auth.users(id) ON DELETE SET NULL, action text NOT NULL,
 details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.free_access_window_requests (
 key uuid PRIMARY KEY, actor uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 parameters jsonb NOT NULL, response jsonb NOT NULL
);
ALTER TABLE billing.free_access_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.free_access_window_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.free_access_window_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.free_access_windows,billing.free_access_window_audit,billing.free_access_window_requests FROM PUBLIC,anon,authenticated;
GRANT ALL ON billing.free_access_windows,billing.free_access_window_audit,billing.free_access_window_requests TO service_role;

-- Discover every current curriculum record, including newly registered drafts.
-- Selecting a draft never publishes it or bypasses its normal release checks.
CREATE FUNCTION billing.free_access_targets() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_array(jsonb_build_object('id','ai','title','Artificial intelligence — all paths','published',true))
 || coalesce((SELECT jsonb_agg(jsonb_build_object('id','ai:'||path_id,'title','AI — '||path_id,'published',true) ORDER BY path_id)
    FROM (SELECT DISTINCT path_id FROM billing.commerce_lesson_catalog) p),'[]'::jsonb)
 || jsonb_build_array(jsonb_build_object('id','technical:furniture','title','Technical — furniture','published',
    EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled) AND EXISTS(SELECT 1 FROM public.technical_lesson_content)),
    jsonb_build_object('id','kids','title','Kids','published',
    EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data AND lesson_access_enabled)))
 || coalesce((SELECT jsonb_agg(jsonb_build_object('id','academic:'||id,'title',coalesce(titles->>'en',id),
    'titles',titles,'published',enabled AND EXISTS(SELECT 1 FROM public.academic_lesson_content l WHERE l.course_id=c.id AND l.approved)) ORDER BY id)
    FROM public.academic_courses c),'[]'::jsonb);
$$;
CREATE FUNCTION billing.free_access_has(p_user uuid,p_target text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_user IS NOT NULL AND billing.commerce_account_allowed(p_user)
 AND EXISTS(SELECT 1 FROM auth.users WHERE id=p_user AND email_confirmed_at IS NOT NULL)
 AND EXISTS(SELECT 1 FROM billing.free_access_windows w
   WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at AND p_target=ANY(w.targets));
$$;
CREATE FUNCTION billing.free_access_ai_lesson(p_user uuid,p_lesson text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog l WHERE l.lesson_id=p_lesson
 AND (billing.free_access_has(p_user,'ai') OR billing.free_access_has(p_user,'ai:'||l.path_id)));
$$;

CREATE FUNCTION public.free_access_window_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); w billing.free_access_windows%ROWTYPE; old jsonb; params jsonb;
 prior billing.free_access_window_requests%ROWTYPE; v_targets text[]; start_time timestamptz; end_time timestamptz;
 request_key uuid; result jsonb;
BEGIN
 PERFORM billing.commerce_assert_identity(actor);
 IF NOT coalesce(public.has_role(actor,'admin'::public.app_role),false) THEN RAISE EXCEPTION 'FREE_ACCESS_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>65536 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 IF p_action='list' THEN
  IF p_data<>'{}' THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  RETURN jsonb_build_object('server_time',now(),'targets',billing.free_access_targets(),
   'windows',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.starts_at DESC,v.id) FROM (
    SELECT x.id,x.title,x.targets,x.starts_at,x.ends_at,x.enabled,x.version,
      CASE WHEN NOT x.enabled THEN 'paused' WHEN now()<x.starts_at THEN 'scheduled'
        WHEN now()>=x.ends_at THEN 'expired' ELSE 'active' END AS status
    FROM billing.free_access_windows x) v),'[]'::jsonb),
   'audit',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC) FROM (
      SELECT window_id,action,created_at FROM billing.free_access_window_audit ORDER BY created_at DESC LIMIT 200) a),'[]'::jsonb));
 END IF;
 IF p_action NOT IN ('create','update') OR p_data-ARRAY['id','expected_version','title','targets','starts_at','ends_at','enabled','key']<>'{}'
 OR jsonb_typeof(p_data->'title') IS DISTINCT FROM 'string'
 OR length(btrim(p_data->>'title')) NOT BETWEEN 1 AND 160
 OR jsonb_typeof(p_data->'targets') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_data->'enabled') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_data->'starts_at') IS DISTINCT FROM 'string' OR jsonb_typeof(p_data->'ends_at') IS DISTINCT FROM 'string'
 OR (p_data->>'starts_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' OR (p_data->>'ends_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$'
 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 SELECT array_agg(x ORDER BY x) INTO v_targets FROM jsonb_array_elements_text(p_data->'targets') x;
 IF coalesce(cardinality(v_targets),0) NOT BETWEEN 1 AND 100
 OR cardinality(v_targets)<>(SELECT count(DISTINCT x) FROM unnest(v_targets) x)
 OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE t IS NULL OR NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(billing.free_access_targets()) c WHERE c->>'id'=t))
 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_TARGET'; END IF;
 BEGIN
  start_time:=(p_data->>'starts_at')::timestamptz;end_time:=(p_data->>'ends_at')::timestamptz;
  request_key:=(p_data->>'key')::uuid;
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END;
 IF request_key IS NULL OR start_time IS NULL OR end_time IS NULL OR NOT isfinite(start_time) OR NOT isfinite(end_time) OR start_time>=end_time THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 params:=jsonb_build_object('action',p_action,'data',p_data);
 PERFORM pg_advisory_xact_lock(hashtextextended(request_key::text,837));
 SELECT * INTO prior FROM billing.free_access_window_requests WHERE key=request_key;
 IF FOUND THEN
  IF prior.actor<>actor OR prior.parameters<>params THEN RAISE EXCEPTION 'FREE_ACCESS_RETRY_MISMATCH'; END IF;
  RETURN prior.response;
 END IF;
 IF p_action='create' THEN
  IF p_data ?| ARRAY['id','expected_version'] THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  INSERT INTO billing.free_access_windows(title,targets,starts_at,ends_at,enabled,created_by)
    VALUES(btrim(p_data->>'title'),v_targets,start_time,end_time,(p_data->>'enabled')::boolean,actor) RETURNING * INTO w;
 ELSE
  IF jsonb_typeof(p_data->'expected_version') IS DISTINCT FROM 'number'
    OR (p_data->>'expected_version') !~ '^[1-9][0-9]{0,8}$' THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  SELECT * INTO w FROM billing.free_access_windows WHERE id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR w.version<>(p_data->>'expected_version')::integer THEN RAISE EXCEPTION 'FREE_ACCESS_CONFLICT'; END IF;
  old:=to_jsonb(w)-'created_by';
  UPDATE billing.free_access_windows x SET title=btrim(p_data->>'title'),targets=v_targets,starts_at=start_time,ends_at=end_time,
    enabled=(p_data->>'enabled')::boolean,version=x.version+1,updated_at=now() WHERE x.id=w.id RETURNING x.* INTO w;
 END IF;
 result:=jsonb_build_object('id',w.id,'version',w.version);
 INSERT INTO billing.free_access_window_audit(window_id,actor,action,details)
 VALUES(w.id,actor,p_action,jsonb_build_object('before',old,'after',to_jsonb(w)-'created_by'));
 INSERT INTO billing.free_access_window_requests VALUES(request_key,actor,params,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.free_access_window_command(text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.free_access_window_command(text,jsonb) TO authenticated;

CREATE FUNCTION public.get_my_free_access() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); active_targets text[]:='{}'; lesson_ids text[]:='{}'; deadline timestamptz;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'FREE_ACCESS_AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
 IF billing.commerce_account_allowed(u) AND EXISTS(SELECT 1 FROM auth.users WHERE id=u AND email_confirmed_at IS NOT NULL) THEN
  SELECT coalesce(array_agg(DISTINCT t ORDER BY t),'{}') INTO active_targets
  FROM billing.free_access_windows w CROSS JOIN LATERAL unnest(w.targets) t WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at;
  SELECT coalesce(array_agg(lesson_id ORDER BY lesson_id),'{}') INTO lesson_ids FROM billing.commerce_lesson_catalog
    WHERE 'ai'=ANY(active_targets) OR ('ai:'||path_id)=ANY(active_targets);
 END IF;
 SELECT least(now()+interval '30 seconds',min(boundary)) INTO deadline FROM (
   SELECT starts_at AS boundary FROM billing.free_access_windows WHERE enabled AND starts_at>now()
   UNION ALL SELECT ends_at FROM billing.free_access_windows WHERE enabled AND ends_at>now()) b;
 RETURN jsonb_build_object('server_time',now(),'valid_until',coalesce(deadline,now()+interval '30 seconds'),
   'targets',to_jsonb(active_targets),'lesson_ids',to_jsonb(lesson_ids));
END $$;
REVOKE ALL ON FUNCTION public.get_my_free_access() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_my_free_access() TO authenticated;

-- Preserve every installed identity/release/consent gate: extend only the commercial alternatives.
DO $$ DECLARE d text; needle text; target regprocedure; BEGIN
 target:=coalesce(to_regprocedure('billing.kids_previous_admin_lesson_access(uuid,text,integer,text)'),to_regprocedure('public.kids_can_access_lesson(uuid,text,integer,text)'));
 d:=pg_get_functiondef(target);needle:='requested_lesson BETWEEN 1 AND 2 OR';
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'FREE_ACCESS_KIDS_DEFINITION_CHANGED'; END IF;
 EXECUTE replace(d,needle,needle||' billing.free_access_has(auth.uid(),''kids'') OR');
 d:=pg_get_functiondef('public.technical_can_access(text)'::regprocedure);needle:='p_lesson=''M01-L01'' OR';
 EXECUTE replace(d,'FUNCTION public.technical_can_access(', 'FUNCTION billing.free_window_previous_technical_access(');
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'FREE_ACCESS_TECHNICAL_DEFINITION_CHANGED'; END IF;
 EXECUTE replace(d,needle,needle||' billing.free_access_has(auth.uid(),''technical:furniture'') OR');
 EXECUTE replace(pg_get_functiondef('public.academic_can_access(text,text,text)'::regprocedure),
   'FUNCTION public.academic_can_access(', 'FUNCTION billing.free_window_previous_academic_access(');
 EXECUTE replace(pg_get_functiondef('billing.evaluate_access(uuid,text,text)'::regprocedure),
   'FUNCTION billing.evaluate_access(', 'FUNCTION billing.free_window_previous_evaluate_access(');
 EXECUTE replace(pg_get_functiondef('public.academic_command(text,text,text,text,jsonb)'::regprocedure),
   'FUNCTION public.academic_command(', 'FUNCTION billing.free_window_previous_academic_command(');
 EXECUTE replace(pg_get_functiondef('public.technical_command(text,text,text,jsonb)'::regprocedure),
   'FUNCTION public.technical_command(', 'FUNCTION billing.free_window_previous_technical_command(');
 EXECUTE replace(pg_get_functiondef('public.get_my_kids_access_status()'::regprocedure),
   'FUNCTION public.get_my_kids_access_status(', 'FUNCTION billing.free_window_previous_kids_status(');
END $$;
CREATE OR REPLACE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.free_window_previous_academic_access(p_course,p_lesson,p_locale)
 OR (billing.free_access_has(auth.uid(),'academic:'||p_course) AND EXISTS(
   SELECT 1 FROM public.academic_courses c JOIN public.academic_lesson_content l ON l.course_id=c.id
   WHERE c.id=p_course AND c.enabled AND l.lesson_id=p_lesson AND l.locale=p_locale AND l.approved));
$$;
CREATE OR REPLACE FUNCTION billing.evaluate_access(p_user_id uuid,p_resource_type text,p_resource_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE prior jsonb;BEGIN
 -- Call the existing service/subject authorization first, even for an active window.
 prior:=billing.free_window_previous_evaluate_access(p_user_id,p_resource_type,p_resource_id);
 IF coalesce((prior->>'allowed')::boolean,false) THEN RETURN prior; END IF;
 IF p_resource_type IN ('lesson','video') AND billing.free_access_ai_lesson(p_user_id,p_resource_id) THEN
   RETURN jsonb_build_object('allowed',true,'denial_reason_code',NULL,'source','scheduled_free_access');
 END IF;
 RETURN prior;
END $$;
-- Deliberately no snapshot/tier/paid flag/AI quota override. A path window is not Pro/ProPlus.
CREATE FUNCTION billing.free_window_tag_delivery(p_result jsonb,p_target text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE deadline timestamptz;BEGIN
 IF NOT coalesce((p_result->>'allowed')::boolean,false) THEN RETURN p_result; END IF;
 SELECT max(ends_at) INTO deadline FROM billing.free_access_windows
   WHERE enabled AND starts_at<=now() AND now()<ends_at AND p_target=ANY(targets);
 RETURN CASE WHEN deadline IS NULL THEN p_result ELSE p_result||jsonb_build_object(
   'free_access_server_time',now(),'free_access_check_at',least(deadline,now()+interval '30 seconds')) END;
END $$;
CREATE OR REPLACE FUNCTION public.academic_command(p_action text,p_course text DEFAULT NULL,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;BEGIN
 result:=billing.free_window_previous_academic_command(p_action,p_course,p_lesson,p_locale,p_data);
 IF p_action='lesson' AND NOT billing.free_window_previous_academic_access(p_course,p_lesson,p_locale) THEN
   RETURN billing.free_window_tag_delivery(result,'academic:'||p_course);
 END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.technical_command(p_action text,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;BEGIN
 result:=billing.free_window_previous_technical_command(p_action,p_lesson,p_locale,p_data);
 IF p_action='lesson' AND NOT billing.free_window_previous_technical_access(p_lesson) THEN
   RETURN billing.free_window_tag_delivery(result,'technical:furniture'); END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.get_my_kids_access_status() RETURNS TABLE(access_source text,active_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 RETURN QUERY SELECT s.access_source,s.active_until FROM (
   SELECT * FROM billing.free_window_previous_kids_status()
   UNION ALL SELECT 'scheduled_free_access'::text,max(w.ends_at) FROM billing.free_access_windows w
     WHERE billing.free_access_has(auth.uid(),'kids') AND w.enabled AND 'kids'=ANY(w.targets)
       AND w.starts_at<=now() AND now()<w.ends_at HAVING count(*)>0) s ORDER BY s.active_until DESC LIMIT 1;
END $$;
REVOKE ALL ON FUNCTION billing.free_access_targets(),billing.free_access_has(uuid,text),billing.free_access_ai_lesson(uuid,text),
 billing.free_window_previous_academic_access(text,text,text),billing.free_window_previous_evaluate_access(uuid,text,text),
 billing.free_window_previous_technical_access(text),
 billing.free_window_previous_academic_command(text,text,text,text,jsonb),billing.free_window_previous_technical_command(text,text,text,jsonb),
 billing.free_window_previous_kids_status(),billing.free_window_tag_delivery(jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
