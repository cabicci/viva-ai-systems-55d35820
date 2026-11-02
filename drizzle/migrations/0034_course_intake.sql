-- Reviewed candidate for the EXISTING project's native Drizzle runner.
-- No content/course import, new project, role, provider call or publication.
CREATE SCHEMA curriculum_private;
--> statement-breakpoint

REVOKE ALL ON SCHEMA curriculum_private FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint


CREATE TABLE curriculum_private.courses (
 area text NOT NULL CHECK(area IN ('ai','academic','technical','kids')),
 id text NOT NULL CHECK(id ~ '^[A-Za-z0-9][A-Za-z0-9-]{0,79}$'),
 titles jsonb NOT NULL, locales text[] NOT NULL, active_version text, candidate_version text,
 PRIMARY KEY(area,id)
);
--> statement-breakpoint

CREATE TABLE curriculum_private.versions (
 area text NOT NULL, course text NOT NULL, version text NOT NULL CHECK(version ~ '^[a-f0-9]{64}$'),
 material text NOT NULL, public_payload jsonb NOT NULL, private_keys jsonb NOT NULL, source jsonb NOT NULL,
 learning_model jsonb NOT NULL, expected_active text, state text NOT NULL CHECK(state IN ('draft','approved','ready')),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), approved_by uuid, approved_at timestamptz,
 PRIMARY KEY(area,course,version), FOREIGN KEY(area,course) REFERENCES curriculum_private.courses
);
--> statement-breakpoint

CREATE TABLE curriculum_private.lessons (
 area text NOT NULL, course text NOT NULL, version text NOT NULL, lesson text NOT NULL, locale text NOT NULL,
 title text NOT NULL, payload jsonb NOT NULL, material text NOT NULL, source_sha text NOT NULL,
 PRIMARY KEY(area,course,version,lesson,locale),
 FOREIGN KEY(area,course,version) REFERENCES curriculum_private.versions
);
--> statement-breakpoint

CREATE TABLE curriculum_private.chunks (
 area text NOT NULL, course text NOT NULL, version text NOT NULL, lesson text NOT NULL, locale text NOT NULL,
 id text NOT NULL, content text NOT NULL, source_sha text NOT NULL, content_sha text NOT NULL,
 embedding extensions.vector(1536) NOT NULL,
 PRIMARY KEY(area,course,version,lesson,locale,id),
 FOREIGN KEY(area,course,version,lesson,locale) REFERENCES curriculum_private.lessons
);
--> statement-breakpoint

CREATE TABLE curriculum_private.index_scopes (
 area text NOT NULL, course text NOT NULL, version text NOT NULL, lesson text NOT NULL, locale text NOT NULL,
 source_sha text NOT NULL, chunk_count integer NOT NULL CHECK(chunk_count>0), asset_proofs jsonb NOT NULL DEFAULT '[]',
 PRIMARY KEY(area,course,version,lesson,locale),
 FOREIGN KEY(area,course,version,lesson,locale) REFERENCES curriculum_private.lessons
);
--> statement-breakpoint

CREATE TABLE curriculum_private.attempts (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
 profile_id uuid REFERENCES public.kids_profiles ON DELETE CASCADE,
 record_id uuid NOT NULL REFERENCES learning_private.courses ON DELETE CASCADE,
 area text NOT NULL, course text NOT NULL, version text NOT NULL, lesson text NOT NULL, locale text NOT NULL, section text NOT NULL,
 started_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days',
 draft jsonb NOT NULL DEFAULT '{}', draft_revision integer NOT NULL DEFAULT 0,
 submission jsonb, result jsonb,
 FOREIGN KEY(area,course,version,lesson,locale) REFERENCES curriculum_private.lessons
);
--> statement-breakpoint

CREATE INDEX curriculum_attempt_owner ON curriculum_private.attempts(account_id,course,lesson);
--> statement-breakpoint

CREATE TABLE curriculum_private.commands (
 account_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE, request_id uuid NOT NULL,
 parameters jsonb NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(account_id,request_id)
);
--> statement-breakpoint

CREATE INDEX curriculum_command_rate ON curriculum_private.commands(account_id,created_at DESC);
--> statement-breakpoint

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['courses','versions','lessons','chunks','index_scopes','attempts','commands'] LOOP
  EXECUTE format('ALTER TABLE curriculum_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON curriculum_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;
--> statement-breakpoint


CREATE FUNCTION curriculum_private.pin_event_model() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.origin='curriculum_command' AND EXISTS(SELECT 1 FROM learning_private.courses c JOIN curriculum_private.versions v ON v.area=c.area AND v.course=c.course
  WHERE c.id=NEW.record_id AND v.version=NEW.content_version) THEN NEW.model_version:=NEW.content_version; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

CREATE TRIGGER zz_curriculum_pinned_model BEFORE INSERT ON learning_private.events FOR EACH ROW EXECUTE FUNCTION curriculum_private.pin_event_model();
--> statement-breakpoint


CREATE FUNCTION curriculum_private.require_admin(p_user uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user);
 IF NOT coalesce(billing.commercial_admin(p_user),false) THEN RAISE EXCEPTION 'CURRICULUM_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
END $$;
--> statement-breakpoint


CREATE FUNCTION public.curriculum_admin(p_user uuid,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p jsonb; package jsonb; c curriculum_private.courses; v curriculum_private.versions; item jsonb; step jsonb; lang text;
 a text; course_id text; ver text; expected jsonb; result jsonb;
BEGIN
 PERFORM curriculum_private.require_admin(p_user);
 IF p_action='list' THEN
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('area',x.area,'id',x.id,'titles',x.titles,'activeVersion',x.active_version,'candidateVersion',x.candidate_version,
   'versions',(SELECT coalesce(jsonb_agg(jsonb_build_object('version',y.version,'state',y.state,'createdAt',y.created_at,'approvedAt',y.approved_at) ORDER BY y.created_at DESC),'[]') FROM curriculum_private.versions y WHERE y.area=x.area AND y.course=x.id)) ORDER BY x.area,x.id) FROM curriculum_private.courses x),'[]');
 END IF;
 IF p_action='stage' THEN
  p:=p_data->'prepared'; package:=(p->>'material')::jsonb;
  a:=package->>'area'; course_id:=package->>'id'; ver:=p->>'version';
  IF a NOT IN ('ai','academic','technical','kids') OR course_id !~ '^[A-Za-z0-9][A-Za-z0-9-]{0,79}$'
   OR course_id IN ('ai','kids','furniture','level-1','level-2','level-3','AC-BUS')
   OR package->>'schemaVersion' IS DISTINCT FROM 'masaarat-intake-v1' OR package->>'notesEnabled' IS DISTINCT FROM 'true'
   OR ver IS DISTINCT FROM encode(extensions.digest(convert_to(p->>'material','UTF8'),'sha256'),'hex')
   OR octet_length(p->>'material')>8000000 OR (package-'assessmentKeys'-'source') IS DISTINCT FROM p->'publicCourse'
   OR package->'assessmentKeys' IS DISTINCT FROM p->'keys' OR package->'source' IS DISTINCT FROM p->'source'
   OR jsonb_typeof(p->'lessons') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'lessons') NOT BETWEEN 1 AND 4000
   THEN RAISE EXCEPTION 'CURRICULUM_PACKAGE_INVALID'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('curriculum:'||a||':'||course_id,0));
  IF EXISTS(SELECT 1 FROM public.academic_courses WHERE id=course_id)
   OR EXISTS(SELECT 1 FROM public.card_assistant_policy WHERE card_id=course_id) THEN RAISE EXCEPTION 'CURRICULUM_EXISTING_ID'; END IF;
  INSERT INTO curriculum_private.courses(area,id,titles,locales)
   VALUES(a,course_id,package->'title',ARRAY(SELECT jsonb_array_elements_text(package->'locales'))) ON CONFLICT DO NOTHING;
  SELECT * INTO c FROM curriculum_private.courses WHERE area=a AND id=course_id FOR UPDATE;
  SELECT * INTO v FROM curriculum_private.versions WHERE area=a AND course=course_id AND version=ver;
  IF FOUND THEN RETURN jsonb_build_object('version',ver,'state',v.state,'replay',true); END IF;
  INSERT INTO curriculum_private.versions(area,course,version,material,public_payload,private_keys,source,learning_model,expected_active,state,created_by)
   VALUES(a,course_id,ver,p->>'material',p->'publicCourse',p->'keys',p->'source',p->'model',c.active_version,'draft',p_user);
  FOR item IN SELECT value FROM jsonb_array_elements(p->'lessons') LOOP
   lang:=item->>'locale';
   SELECT s INTO step FROM jsonb_array_elements(package->'stations') station,
    jsonb_array_elements(station->'steps') s WHERE s->>'id'=item->>'lesson';
   expected:=jsonb_build_object('id',step->>'id','title',step->'title'->>lang)||(step->'content'->lang);
   IF step IS NULL OR expected IS DISTINCT FROM item->'payload' OR (item->>'material')::jsonb IS DISTINCT FROM expected
    OR item->>'sha256' IS DISTINCT FROM encode(extensions.digest(convert_to(item->>'material','UTF8'),'sha256'),'hex')
    OR EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog WHERE lesson_id=item->>'lesson')
    OR EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id=item->>'lesson')
    OR EXISTS(SELECT 1 FROM public.academic_lesson_content WHERE lesson_id=item->>'lesson') THEN RAISE EXCEPTION 'CURRICULUM_LESSON_INVALID'; END IF;
   INSERT INTO curriculum_private.lessons VALUES(a,course_id,ver,item->>'lesson',lang,item->>'title',item->'payload',item->>'material',item->>'sha256');
  END LOOP;
  IF (SELECT count(*) FROM curriculum_private.lessons WHERE area=a AND course=course_id AND version=ver)<>
   (SELECT count(*) FROM jsonb_array_elements(package->'stations') station,jsonb_array_elements(station->'steps') s)*jsonb_array_length(package->'locales')
   THEN RAISE EXCEPTION 'CURRICULUM_LOCALE_INCOMPLETE'; END IF;
  RETURN jsonb_build_object('version',ver,'state','draft');
 END IF;
 a:=p_data->>'area'; course_id:=p_data->>'course'; ver:=p_data->>'version';
 PERFORM pg_advisory_xact_lock(hashtextextended('curriculum:'||a||':'||course_id,0));
 SELECT * INTO c FROM curriculum_private.courses WHERE area=a AND id=course_id FOR UPDATE;
 SELECT * INTO v FROM curriculum_private.versions WHERE area=a AND course=course_id AND version=ver;
 IF v.version IS NULL THEN RAISE EXCEPTION 'CURRICULUM_VERSION_REQUIRED'; END IF;
 IF p_action='review' THEN
  RETURN jsonb_build_object('version',v.version,'state',v.state,'expectedActive',v.expected_active,'publicCourse',v.public_payload,'model',v.learning_model,'source',v.source,'assessmentKeys',v.private_keys);
 ELSIF p_action='approve' THEN
  IF p_data->>'reviewed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'CURRICULUM_REVIEW_REQUIRED'; END IF;
  IF v.state IN ('approved','ready') THEN RETURN jsonb_build_object('approved',true,'replay',true,'state',v.state); END IF;
  IF c.active_version IS DISTINCT FROM v.expected_active OR c.active_version IS DISTINCT FROM p_data->>'expectedActive'
   OR (c.candidate_version IS NOT NULL AND c.candidate_version IS DISTINCT FROM ver AND EXISTS(SELECT 1 FROM curriculum_private.versions pending WHERE pending.area=a AND pending.course=course_id AND pending.version=c.candidate_version AND pending.state='approved')) THEN RAISE EXCEPTION 'CURRICULUM_APPROVAL_CONFLICT'; END IF;
  UPDATE curriculum_private.versions SET state='approved',approved_by=p_user,approved_at=now() WHERE area=a AND course=course_id AND version=ver;
  UPDATE curriculum_private.courses SET candidate_version=ver WHERE area=a AND id=course_id;
  IF a<>'ai' THEN INSERT INTO public.assistant_auto_source_events(area,source_key,locale,source_sha,withdrawn) VALUES(a,course_id||':intake','',ver,false); END IF;
  RETURN jsonb_build_object('approved',true,'state','indexing');
 END IF;
 RAISE EXCEPTION 'CURRICULUM_ACTION_INVALID';
END $$;
--> statement-breakpoint


-- Compose with the established billing sources, clocks, invitation pools and
-- lifetime terms. No grants, subscriptions, orders or roles are manufactured.
DO $$ DECLARE d text; signature text; BEGIN
 FOREACH signature IN ARRAY ARRAY['billing.commercial_curricula()','billing.email_access_catalogues()',
  'billing.assistant_source_specs(uuid,text,text,uuid,timestamptz)',
  'billing.assistant_content_allowed(uuid,text,text,text,text,uuid)',
  'billing.assistant_scope_allowed(uuid,text,text,uuid)',
  'learning_private.can_write(learning_private.courses,text,text)','public.learning_command(text,jsonb)',
  'public.assistant_auto_check(text,uuid,uuid)'] LOOP
  d:=pg_get_functiondef(signature::regprocedure);
  IF d IS NULL THEN RAISE EXCEPTION 'CURRICULUM_AUTHORITY_MISSING'; END IF;
  EXECUTE regexp_replace(d,'FUNCTION ([a-z_]+)\.([a-z_]+)\(',E'FUNCTION curriculum_private.previous_\\2(');
 END LOOP;
END $$;
--> statement-breakpoint


CREATE OR REPLACE FUNCTION billing.commercial_curricula() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT curriculum_private.previous_commercial_curricula()||coalesce((SELECT jsonb_agg(jsonb_build_object('area',area,'course',id,'title',coalesce(titles->>'ar-EG',titles->>'en',id)))
  FROM curriculum_private.courses WHERE active_version IS NOT NULL),'[]');
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION billing.email_access_catalogues() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT curriculum_private.previous_email_access_catalogues()||coalesce((SELECT jsonb_agg(jsonb_build_object('id',area||':'||id,'title',coalesce(titles->>'en',titles->>'ar-EG',id),'titles',titles))
  FROM curriculum_private.courses WHERE active_version IS NOT NULL),'[]');
$$;
--> statement-breakpoint


CREATE OR REPLACE FUNCTION billing.assistant_source_specs(p_user uuid,p_area text,p_course text,p_child uuid,p_at timestamptz)
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units integer,recurring boolean,per_lesson integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; k text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM curriculum_private.courses WHERE area=p_area AND id=p_course) THEN
  RETURN QUERY SELECT * FROM curriculum_private.previous_assistant_source_specs(p_user,p_area,p_course,p_child,p_at); RETURN;
 END IF;
 IF NOT billing.commercial_account_allowed(p_user) OR (p_area='kids' AND NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_child AND parent_id=p_user)) THEN RETURN; END IF;
 RETURN QUERY SELECT * FROM curriculum_private.previous_assistant_source_specs(p_user,p_area,p_course,p_child,p_at) old
  WHERE old.source_key NOT LIKE 'invitation:%' AND old.source_key NOT LIKE 'lifetime:%' AND old.source_key NOT LIKE 'free:%';
 -- Academic manual subscriptions apply to their package's curricula; the old
 -- table's snapshot grants do not automatically acquire a new course row.
 IF p_area='academic' THEN
  FOR r IN SELECT e.* FROM billing.commerce_entitlements e WHERE e.user_id=p_user AND e.package='academic' AND e.revoked_at IS NULL AND e.starts_at<=p_at AND e.ends_at>p_at
   AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled)
   AND NOT EXISTS(SELECT 1 FROM public.academic_content_course_grants g WHERE g.entitlement_id=e.id AND g.course_id=p_course) LOOP
   k:='commerce:'||r.id;
   RETURN QUERY SELECT k||':'||p_course,r.starts_at,r.ends_at,billing.assistant_current_units(k,300,p_at),true,
    (SELECT t.per_lesson_units FROM billing.commercial_legacy_terms t WHERE t.source_key=k AND p_at<t.first_new_period_at);
  END LOOP;
 END IF;
 FOR r IN SELECT g.* FROM billing.email_access_grants g JOIN auth.users u ON u.id=g.user_id
  WHERE g.user_id=p_user AND u.email_confirmed_at IS NOT NULL AND lower(btrim(u.email))=g.recipient_email
  AND g.activated_at<=p_at AND g.revoked_at IS NULL AND (g.ends_at IS NULL OR g.ends_at>p_at)
  AND (g.scope_mode='all_published' OR (p_area||':'||p_course)=ANY(g.catalogues)) LOOP
  RETURN QUERY SELECT 'invitation:'||r.id,r.activated_at,r.ends_at,CASE WHEN r.grant_kind='single_curriculum' THEN 100 ELSE 300 END,true,NULL::integer;
 END LOOP;
 FOR r IN SELECT * FROM billing.commercial_purchases WHERE user_id=p_user AND state='fulfilled' AND kind='lifetime_course'
  AND area=p_area AND course=p_course AND child_id IS NOT DISTINCT FROM p_child AND paid_at<=p_at
  AND p_at<((paid_at AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC' LOOP
  RETURN QUERY SELECT 'lifetime:'||r.id,r.paid_at,((r.paid_at AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC',100,false,NULL::integer;
 END LOOP;
END $$;
--> statement-breakpoint


CREATE FUNCTION curriculum_private.child_allowed(p_user uuid,p_child uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_sub text:=current_setting('request.jwt.claim.sub',true); old_claims text:=current_setting('request.jwt.claims',true); result boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_child AND parent_id=p_user) THEN RETURN false; END IF;
 PERFORM set_config('request.jwt.claim.sub',p_user::text,true);
 PERFORM set_config('request.jwt.claims',(coalesce(nullif(old_claims,''),'{}')::jsonb||jsonb_build_object('sub',p_user))::text,true);
 result:=coalesce(public.kids_parent_can_manage_profiles(),false) AND coalesce(public.kids_profile_has_consent(p_child),false)
  AND EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND lesson_access_enabled AND accepts_child_data);
 PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);
 RETURN result;
END $$;
--> statement-breakpoint


CREATE FUNCTION curriculum_private.access(p_user uuid,p_area text,p_course text,p_lesson text,p_locale text,p_child uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c curriculum_private.courses;
BEGIN
 IF NOT billing.commercial_account_allowed(p_user) OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RETURN false; END IF;
 SELECT * INTO c FROM curriculum_private.courses WHERE area=p_area AND id=p_course;
 IF c.active_version IS NULL OR NOT EXISTS(SELECT 1 FROM curriculum_private.lessons WHERE area=p_area AND course=p_course AND version=c.active_version AND lesson=p_lesson AND locale=p_locale) THEN RETURN false; END IF;
 IF billing.commercial_admin(p_user) AND ((p_area='kids' AND p_child=p_user) OR (p_area<>'kids' AND p_child IS NULL)) THEN RETURN true; END IF;
 IF p_area='technical' AND NOT EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled) THEN RETURN false; END IF;
 IF p_area='kids' THEN
  IF p_child IS NULL OR NOT curriculum_private.child_allowed(p_user,p_child) THEN RETURN false; END IF;
 ELSIF p_child IS NOT NULL THEN RETURN false;
 END IF;
 IF billing.commercial_admin(p_user) THEN RETURN true; END IF;
 RETURN billing.commercial_course_owned(p_user,p_area,p_course,p_child)
  OR EXISTS(SELECT 1 FROM billing.assistant_source_specs(p_user,p_area,p_course,p_child,now()) WHERE source_key NOT LIKE 'lifetime:%');
END $$;
--> statement-breakpoint


-- Existing Kids records use level IDs; admitted Kids courses have their own
-- course IDs and exact invitation/lifetime scopes. Keep both report paths.
DO $$ DECLARE d text; old_text text:=$q$CASE WHEN r.area='kids' THEN 'kids' ELSE r.course END$q$; BEGIN
 d:=pg_get_functiondef('learning_private.report_sources(uuid,timestamptz)'::regprocedure);
 IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'CURRICULUM_REPORT_AUTHORITY_CHANGED'; END IF;
 EXECUTE replace(d,old_text,$q$CASE WHEN r.area='kids' AND NOT EXISTS(SELECT 1 FROM curriculum_private.courses admitted WHERE admitted.area=r.area AND admitted.id=r.course) THEN 'kids' ELSE r.course END$q$);
END $$;
--> statement-breakpoint


CREATE OR REPLACE FUNCTION public.learning_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; BEGIN
 result:=curriculum_private.previous_learning_command(p_action,p_data);
 IF p_action='records' THEN
  SELECT coalesce(jsonb_agg(row||jsonb_build_object('title',coalesce((SELECT coalesce(c.titles->>coalesce(p_data->>'locale','ar-EG'),c.titles->>'en',c.titles->>c.locales[1]) FROM curriculum_private.courses c WHERE c.area=row->>'area' AND c.id=row->>'course'),row->>'title')) ORDER BY n),'[]') INTO result
   FROM jsonb_array_elements(result) WITH ORDINALITY items(row,n);
 ELSIF p_action IN ('detail','export') THEN
  result:=jsonb_set(result,'{events}',coalesce((SELECT jsonb_agg(event||coalesce((SELECT jsonb_build_object('lessonTitle',l.title)
   FROM curriculum_private.lessons l JOIN curriculum_private.courses c ON c.area=l.area AND c.id=l.course
   WHERE l.area=result->'record'->>'area' AND l.course=result->'record'->>'course' AND l.lesson=event->>'lesson'
    AND l.locale=coalesce(event->>'locale',c.locales[1]) AND l.version=coalesce(event->>'content_version',c.active_version) LIMIT 1),'{}') ORDER BY n)
   FROM jsonb_array_elements(result->'events') WITH ORDINALITY items(event,n)),'[]'));
 END IF;
 RETURN result;
END $$;
--> statement-breakpoint


CREATE FUNCTION curriculum_private.teaching_chunks(p_payload jsonb)
RETURNS TABLE(id text,content text,content_sha text) LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT s->>'id'||'-part-'||piece.n,
  substring(source.body FROM (piece.n-1)*2400+1 FOR 2400),
  encode(extensions.digest(convert_to(substring(source.body FROM (piece.n-1)*2400+1 FOR 2400),'UTF8'),'sha256'),'hex')
 FROM jsonb_array_elements(p_payload->'sections') s
 CROSS JOIN LATERAL (SELECT (p_payload->>'title')||E'\n\n'||(s->>'title')||E'\n\n'||array_to_string(ARRAY(SELECT jsonb_array_elements_text(s->'paragraphs')),E'\n\n') body) source
 CROSS JOIN LATERAL generate_series(1,(length(source.body)+2399)/2400) piece(n)
 WHERE s->>'kind' NOT IN ('questions','exam','video','downloads') AND jsonb_array_length(s->'paragraphs')>0;
$$;
--> statement-breakpoint


CREATE OR REPLACE FUNCTION billing.assistant_content_allowed(p_user uuid,p_area text,p_course text,p_lesson text,p_locale text,p_child uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM curriculum_private.courses WHERE area=p_area AND id=p_course) THEN
  RETURN curriculum_private.access(p_user,p_area,p_course,p_lesson,p_locale,p_child);
 END IF;
 RETURN curriculum_private.previous_assistant_content_allowed(p_user,p_area,p_course,p_lesson,p_locale,p_child);
END $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION billing.assistant_scope_allowed(p_user uuid,p_area text,p_course text,p_child uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; BEGIN
 IF EXISTS(SELECT 1 FROM curriculum_private.courses WHERE area=p_area AND id=p_course) THEN
  FOR r IN SELECT l.lesson,l.locale FROM curriculum_private.lessons l JOIN curriculum_private.courses c ON c.area=l.area AND c.id=l.course AND c.active_version=l.version WHERE l.area=p_area AND l.course=p_course LOOP
   IF curriculum_private.access(p_user,p_area,p_course,r.lesson,r.locale,p_child) THEN RETURN true; END IF;
  END LOOP; RETURN false;
 END IF;
 RETURN curriculum_private.previous_assistant_scope_allowed(p_user,p_area,p_course,p_child);
END $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION learning_private.can_write(p_record learning_private.courses,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM curriculum_private.courses WHERE area=p_record.area AND id=p_record.course) THEN
  RETURN curriculum_private.access(p_record.account_id,p_record.area,p_record.course,p_lesson,p_locale,p_record.profile_id);
 END IF;
 RETURN curriculum_private.previous_can_write(p_record,p_lesson,p_locale);
END $$;
--> statement-breakpoint


-- Preserve all settlement logic while binding new AI-course evidence to the
-- actual reserved course. The original AI course still has r.course='ai'.
DO $$ DECLARE d text; old_text text:=$q$billing.assistant_content_allowed(p_user_id,'ai','ai',x->>'lessonId',r.locale,NULL)$q$; BEGIN
 d:=pg_get_functiondef('public.settle_assistant_question(uuid,uuid,text,text,jsonb)'::regprocedure);
 IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'CURRICULUM_SETTLEMENT_AUTHORITY_CHANGED'; END IF;
 EXECUTE replace(d,old_text,$q$billing.assistant_content_allowed(p_user_id,'ai',r.course,x->>'lessonId',r.locale,NULL)$q$);
END $$;
--> statement-breakpoint


CREATE FUNCTION public.curriculum_catalogue(p_area text,p_locale text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'area',c.area,'title',c.titles->>p_locale,'version',c.active_version,
  'stations',(SELECT jsonb_agg(jsonb_build_object('id',s->>'id','title',s->'title'->>p_locale,
   'steps',(SELECT jsonb_agg(jsonb_build_object('id',st->>'id','title',st->'title'->>p_locale) ORDER BY n) FROM jsonb_array_elements(s->'steps') WITH ORDINALITY step(st,n))) ORDER BY n)
   FROM jsonb_array_elements(v.public_payload->'stations') WITH ORDINALITY station(s,n))) ORDER BY c.id),'[]')
 FROM curriculum_private.courses c JOIN curriculum_private.versions v ON v.area=c.area AND v.course=c.id AND v.version=c.active_version
 WHERE c.area=p_area AND p_locale=ANY(c.locales);
$$;
--> statement-breakpoint


CREATE FUNCTION curriculum_private.progress(p_record uuid,p_area text,p_course text,p_version text,p_locale text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('lesson',x.lesson,'required',x.required,'completed',x.completed,'done',x.required>0 AND x.required=x.completed)),'[]')
 FROM (SELECT l.lesson,count(*)::integer required,count(*) FILTER(WHERE EXISTS(SELECT 1 FROM learning_private.events e WHERE e.record_id=p_record AND e.lesson=l.lesson
  AND e.locale=p_locale AND e.content_version=p_version AND e.origin='curriculum_command' AND e.evidence->>'section'=s->>'id' AND e.evidence->>'completed'='true'))::integer completed
  FROM curriculum_private.lessons l CROSS JOIN LATERAL jsonb_array_elements(l.payload->'sections') s
  WHERE l.area=p_area AND l.course=p_course AND l.version=p_version AND l.locale=p_locale AND s->>'required'='true' GROUP BY l.lesson) x;
$$;
--> statement-breakpoint


CREATE FUNCTION public.curriculum_command(p_action text,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
<<command>>
DECLARE u uuid:=learning_private.require_owner(); a text:=p_data->>'area'; course_id text:=p_data->>'course';
 lesson_id text:=p_data->>'lesson'; lang text:=p_data->>'locale'; child uuid:=(p_data->>'profileId')::uuid;
 ver text; l curriculum_private.lessons; attempt curriculum_private.attempts; opened curriculum_private.attempts; cmd curriculum_private.commands; section jsonb;
 req uuid:=(p_data->>'requestId')::uuid; rid uuid; k jsonb; q jsonb; answers jsonb; n integer:=0; correct integer:=0; score integer;
 result jsonb; evidence jsonb; kind text; accepted boolean;
BEGIN
 IF p_action NOT IN ('lesson','start','submit','complete','save_draft') OR jsonb_typeof(p_data) IS DISTINCT FROM 'object'
  OR octet_length(p_data::text)>65000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_data) input_keys(field_name) WHERE input_keys.field_name NOT IN
   ('area','course','lesson','locale','profileId','version','section','requestId','attemptId','revision','submission')) THEN RAISE EXCEPTION 'CURRICULUM_COMMAND_INVALID'; END IF;
 IF NOT curriculum_private.access(u,a,course_id,lesson_id,lang,child) THEN RAISE EXCEPTION 'CURRICULUM_ACCESS_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT active_version INTO ver FROM curriculum_private.courses WHERE area=a AND id=course_id;
 SELECT * INTO opened FROM curriculum_private.attempts x WHERE x.account_id=u AND x.profile_id IS NOT DISTINCT FROM child AND x.area=a AND x.course=course_id
  AND x.lesson=lesson_id AND x.locale=lang AND x.result IS NULL AND x.expires_at>now() ORDER BY x.started_at LIMIT 1;
 IF opened.id IS NOT NULL AND p_action IN ('lesson','start') THEN ver:=opened.version; END IF;
 SELECT * INTO l FROM curriculum_private.lessons WHERE area=a AND course=course_id AND version=ver AND lesson=lesson_id AND locale=lang;
 IF a='kids' AND child=u AND billing.commercial_admin(u) THEN
  IF p_action<>'lesson' THEN RAISE EXCEPTION 'CURRICULUM_REVIEW_READ_ONLY'; END IF;
  RETURN jsonb_build_object('version',ver,'recordId',NULL,'lesson',l.payload,'events','[]'::jsonb,'progress','[]'::jsonb,'reviewOnly',true);
 END IF;
 rid:=learning_private.record(u,a,course_id,child);
 IF p_action='lesson' THEN
  IF NOT EXISTS(SELECT 1 FROM learning_private.events visit WHERE visit.record_id=rid AND visit.lesson=lesson_id AND visit.locale=lang AND visit.content_version=ver AND visit.origin='curriculum_command' AND visit.kind='visited') THEN
   INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,content_version,evidence) VALUES(rid,lesson_id,lang,'visited','curriculum_command',ver,'{"status":"opened"}');
  END IF;
  RETURN jsonb_build_object('version',ver,'recordId',rid,'lesson',l.payload,
   'attempts',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',x.id,'section',x.section,'version',x.version,'draft',x.draft,'revision',x.draft_revision,'expiresAt',x.expires_at)),'[]') FROM curriculum_private.attempts x
    WHERE x.account_id=u AND x.profile_id IS NOT DISTINCT FROM child AND x.area=a AND x.course=course_id AND x.version=ver AND x.lesson=lesson_id AND x.locale=lang AND x.result IS NULL AND x.expires_at>now()),
   'progress',curriculum_private.progress(rid,a,course_id,ver,lang),
   'events',(SELECT coalesce(jsonb_agg(jsonb_build_object('section',e.evidence->>'section','completed',e.evidence->'completed','result',e.evidence->'result') ORDER BY e.recorded_at),'[]') FROM learning_private.events e
    WHERE e.record_id=rid AND e.lesson=lesson_id AND e.content_version=ver AND e.locale=lang AND e.origin='curriculum_command'));
 END IF;
 IF req IS NULL THEN RAISE EXCEPTION 'CURRICULUM_REQUEST_REQUIRED'; END IF;
 SELECT * INTO cmd FROM curriculum_private.commands WHERE account_id=u AND request_id=req;
 IF FOUND THEN
  IF cmd.parameters IS DISTINCT FROM jsonb_build_object('action',p_action,'data',p_data) THEN RAISE EXCEPTION 'CURRICULUM_REQUEST_CONFLICT'; END IF;
  RETURN cmd.result;
 END IF;
 IF (SELECT count(*) FROM curriculum_private.commands WHERE account_id=u AND created_at>now()-interval '1 minute')>=240 THEN RAISE EXCEPTION 'CURRICULUM_RATE_LIMITED'; END IF;
 IF p_action IN ('submit','save_draft') THEN
  SELECT * INTO attempt FROM curriculum_private.attempts WHERE id=(p_data->>'attemptId')::uuid AND account_id=u AND profile_id IS NOT DISTINCT FROM child FOR UPDATE;
  IF NOT FOUND OR (attempt.area,attempt.course,attempt.lesson,attempt.locale,attempt.section) IS DISTINCT FROM (a,course_id,lesson_id,lang,p_data->>'section') THEN RAISE EXCEPTION 'CURRICULUM_ATTEMPT_REQUIRED'; END IF;
  IF attempt.result IS NOT NULL THEN
   IF p_action='save_draft' THEN RAISE EXCEPTION 'CURRICULUM_ATTEMPT_FINISHED'; END IF;
   IF attempt.submission IS DISTINCT FROM p_data->'submission' THEN RAISE EXCEPTION 'CURRICULUM_ATTEMPT_CONFLICT'; END IF;
   RETURN attempt.result;
  END IF;
  IF attempt.expires_at<=now() THEN RAISE EXCEPTION 'CURRICULUM_ATTEMPT_EXPIRED'; END IF;
  ver:=attempt.version;
  SELECT * INTO l FROM curriculum_private.lessons WHERE area=a AND course=course_id AND version=ver AND lesson=lesson_id AND locale=lang;
 ELSIF p_data->>'version' IS DISTINCT FROM ver THEN RAISE EXCEPTION 'CURRICULUM_CONTENT_CHANGED';
 END IF;
 SELECT s INTO section FROM jsonb_array_elements(l.payload->'sections') s WHERE s->>'id'=p_data->>'section';
 IF section IS NULL THEN RAISE EXCEPTION 'CURRICULUM_SECTION_REQUIRED'; END IF;
 kind:=section->>'kind'; accepted:=false;
 IF p_action='save_draft' AND kind IN ('questions','exam','mission','practice') THEN
  IF jsonb_typeof(p_data->'submission') IS DISTINCT FROM 'object' OR octet_length((p_data->'submission')::text)>50000 THEN RAISE EXCEPTION 'CURRICULUM_DRAFT_INVALID'; END IF;
  IF p_data->>'revision' IS NULL OR (p_data->>'revision')::integer<>attempt.draft_revision THEN
   RETURN jsonb_build_object('state','draft_conflict','draft',attempt.draft,'revision',attempt.draft_revision);
  END IF;
  UPDATE curriculum_private.attempts SET draft=p_data->'submission',draft_revision=draft_revision+1 WHERE id=attempt.id RETURNING * INTO attempt;
  result:=jsonb_build_object('state','draft_saved','revision',attempt.draft_revision);
 ELSIF p_action='start' AND kind IN ('questions','exam','mission','practice') THEN
  SELECT * INTO attempt FROM curriculum_private.attempts WHERE account_id=u AND profile_id IS NOT DISTINCT FROM child AND area=a AND course=course_id AND version=ver
   AND lesson=lesson_id AND locale=lang AND curriculum_private.attempts.section=command.section->>'id' AND curriculum_private.attempts.result IS NULL AND expires_at>now() ORDER BY started_at LIMIT 1;
  IF attempt.id IS NULL THEN
   INSERT INTO curriculum_private.attempts(id,account_id,profile_id,record_id,area,course,version,lesson,locale,section,expires_at)
    VALUES(req,u,child,rid,a,course_id,ver,lesson_id,lang,section->>'id',CASE WHEN section->>'durationMinutes' IS NOT NULL THEN now()+make_interval(mins=>(section->>'durationMinutes')::integer) ELSE now()+interval '30 days' END) RETURNING * INTO attempt;
  END IF;
  result:=jsonb_build_object('attemptId',attempt.id,'version',ver,'state','started','draft',attempt.draft,'revision',attempt.draft_revision);
 ELSIF p_action='submit' AND kind IN ('questions','exam') AND section->>'completion'='pass' THEN
  answers:=p_data->'submission';
  IF jsonb_typeof(answers) IS DISTINCT FROM 'object' OR octet_length(answers::text)>20000 THEN RAISE EXCEPTION 'CURRICULUM_ANSWERS_INVALID'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(answers))<>jsonb_array_length(section->'questions') THEN RAISE EXCEPTION 'CURRICULUM_ANSWERS_INCOMPLETE'; END IF;
  FOR q IN SELECT value FROM jsonb_array_elements(section->'questions') LOOP
   SELECT item INTO k FROM curriculum_private.versions v,jsonb_array_elements(v.private_keys) scope,jsonb_array_elements(scope->'keys') item
    WHERE v.area=a AND v.course=course_id AND v.version=ver AND scope->>'lessonId'=lesson_id AND scope->>'locale'=lang AND item->>'questionId'=q->>'id';
   IF k IS NULL OR jsonb_typeof(answers->(q->>'id')) IS DISTINCT FROM 'number' OR (answers->>(q->>'id')) !~ '^[0-9]$'
    OR (answers->>(q->>'id'))::integer>=jsonb_array_length(q->'options') THEN RAISE EXCEPTION 'CURRICULUM_ANSWER_INVALID'; END IF;
   n:=n+1; IF (answers->>(q->>'id'))::integer=(k->>'correctIndex')::integer THEN correct:=correct+1; END IF;
  END LOOP;
  score:=100*correct/greatest(n,1); accepted:=score>=(section->>'passPercent')::integer;
  result:=jsonb_build_object('state','graded','score',correct,'total',n,'passed',accepted);
 ELSIF p_action='submit' AND kind IN ('mission','practice','questions','exam') AND section->>'completion' IN ('submit','review') THEN
  IF jsonb_typeof(p_data->'submission') IS DISTINCT FROM 'object' OR octet_length((p_data->'submission')::text)>50000
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(section->'fields') field WHERE nullif(btrim(p_data->'submission'->>(field->>'id')),'') IS NULL
    OR jsonb_typeof(p_data->'submission'->(field->>'id')) IS DISTINCT FROM 'string' OR length(p_data->'submission'->>(field->>'id'))>5000)
   OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_data->'submission') field WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(section->'fields') f WHERE f->>'id'=field)) THEN RAISE EXCEPTION 'CURRICULUM_SUBMISSION_INVALID'; END IF;
  accepted:=section->>'completion'='submit';
  result:=jsonb_build_object('state',CASE WHEN accepted THEN 'submitted' ELSE 'awaiting_review' END,'competenceVerified',false);
 ELSIF p_action='complete' AND section->>'completion' IN ('read','view') THEN
  accepted:=true; result:=jsonb_build_object('state','recorded');
 ELSE RAISE EXCEPTION 'CURRICULUM_ACTION_INVALID';
 END IF;
 IF p_action NOT IN ('start','save_draft') THEN
  IF p_action='submit' THEN UPDATE curriculum_private.attempts SET submission=p_data->'submission',result=command.result WHERE id=attempt.id; END IF;
  evidence:=jsonb_strip_nulls(jsonb_build_object('section',section->>'id','activity',kind,'completed',accepted,'result',result,'submission',p_data->'submission',
   'status',CASE WHEN accepted THEN 'completed' ELSE result->>'state' END,'score',result->'score','outcome',result,
   'read',CASE WHEN section->>'completion' IN ('read','view') THEN accepted END,
   'quiz_passed',CASE WHEN kind IN ('questions','exam') THEN accepted END,
   'practice_submitted',CASE WHEN kind IN ('mission','practice') THEN true END,
   'practice_reviewed',CASE WHEN section->>'completion'='review' THEN false END));
  INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,content_version,evidence)
   VALUES(rid,lesson_id,lang,CASE WHEN kind='exam' THEN 'exam' WHEN kind='questions' THEN 'quiz' WHEN kind IN ('mission','practice') THEN kind ELSE 'read' END,'curriculum_command',ver,evidence);
 END IF;
 INSERT INTO curriculum_private.commands(account_id,request_id,parameters,result) VALUES(u,req,jsonb_build_object('action',p_action,'data',p_data),result);
 RETURN result;
END $$;
--> statement-breakpoint


CREATE FUNCTION public.curriculum_index_metadata() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commercial_require_service();
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('area',c.area,'id',c.id,'version',v.version,
  'sourceRevision',(SELECT coalesce(max(event_id),0)::text FROM public.assistant_auto_source_events WHERE area=c.area AND source_key=c.id||':intake'),
  'scopes',(SELECT jsonb_agg(jsonb_build_object('stepId',l.lesson,'locale',l.locale,'sourceSha',l.source_sha) ORDER BY l.locale,l.lesson) FROM curriculum_private.lessons l WHERE l.area=c.area AND l.course=c.id AND l.version=v.version)))
  FROM curriculum_private.courses c JOIN curriculum_private.versions v ON v.area=c.area AND v.course=c.id AND v.version=c.candidate_version WHERE v.state='approved'),'[]');
END $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.assistant_auto_check(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs; BEGIN
 PERFORM billing.commercial_require_service(); SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job;
 IF j.manifest->>'adapter' IS DISTINCT FROM 'curriculum' THEN RETURN curriculum_private.previous_assistant_auto_check(p_job,p_request,p_lease); END IF;
 RETURN j.state='running' AND j.request_id=p_request AND j.lease_token=p_lease AND j.lease_until>now()
  AND EXISTS(SELECT 1 FROM public.assistant_auto_policy WHERE enabled AND NOT(excluded_cards ? (j.area||':'||j.card_id)))
  AND EXISTS(SELECT 1 FROM curriculum_private.courses c JOIN curriculum_private.versions v ON v.area=c.area AND v.course=c.id AND v.version=c.candidate_version
   WHERE c.area=j.area AND c.id=j.card_id AND v.state IN ('approved','ready') AND v.version=j.manifest->>'curriculumVersion');
END $$;
--> statement-breakpoint


CREATE FUNCTION public.curriculum_index_operation(p_action text,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs; l curriculum_private.lessons; c curriculum_private.courses; v curriculum_private.versions; row jsonb; vector extensions.vector; n integer;
BEGIN
 PERFORM billing.commercial_require_service();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_data->>'p_job' FOR UPDATE;
 IF j.manifest->>'adapter' IS DISTINCT FROM 'curriculum' OR NOT public.assistant_auto_check(j.job_id,(p_data->>'p_request')::uuid,(p_data->>'p_lease')::uuid) THEN RAISE EXCEPTION 'AUTOMATION_LEASE_UNAVAILABLE'; END IF;
 IF p_action='publish' THEN
  SELECT * INTO c FROM curriculum_private.courses WHERE area=j.area AND id=j.card_id FOR UPDATE;
  SELECT * INTO v FROM curriculum_private.versions WHERE area=j.area AND course=j.card_id AND version=c.candidate_version;
  IF j.next_offset<>j.scope_count-1 OR j.scope_count<>(SELECT count(*)+1 FROM curriculum_private.lessons WHERE area=j.area AND course=j.card_id AND version=v.version)
   OR EXISTS(SELECT 1 FROM curriculum_private.lessons source WHERE source.area=j.area AND source.course=j.card_id AND source.version=v.version
    AND NOT EXISTS(SELECT 1 FROM curriculum_private.index_scopes proof WHERE (proof.area,proof.course,proof.version,proof.lesson,proof.locale,proof.source_sha)=(source.area,source.course,source.version,source.lesson,source.locale,source.source_sha)
     AND proof.chunk_count=(SELECT count(*) FROM curriculum_private.chunks chunk WHERE (chunk.area,chunk.course,chunk.version,chunk.lesson,chunk.locale)=(source.area,source.course,source.version,source.lesson,source.locale))))
   THEN RAISE EXCEPTION 'AUTOMATION_CORPUS_INCOMPLETE'; END IF;
  IF c.active_version IS DISTINCT FROM v.expected_active THEN RAISE EXCEPTION 'AUTOMATION_ACTIVE_CHANGED'; END IF;
  UPDATE learning_private.course_models SET is_current=false WHERE area=j.area AND course=j.card_id AND is_current;
  INSERT INTO learning_private.course_models(area,course,version,activities,completion) VALUES(j.area,j.card_id,v.version,ARRAY(SELECT jsonb_array_elements_text(v.learning_model->'activities')),v.learning_model->'completion');
  UPDATE curriculum_private.courses SET active_version=v.version,titles=v.public_payload->'title',locales=ARRAY(SELECT jsonb_array_elements_text(v.public_payload->'locales')) WHERE area=j.area AND id=j.card_id;
  UPDATE curriculum_private.versions SET state='ready' WHERE area=j.area AND course=j.card_id AND version=v.version;
  INSERT INTO learning_private.content_versions(area,course,lesson,locale,version,payload)
   SELECT area,course,lesson,locale,version,payload FROM curriculum_private.lessons WHERE area=j.area AND course=j.card_id AND version=v.version ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('activated',true,'version',v.version);
 END IF;
 row:=j.manifest->'scopes'->j.next_offset;
 SELECT * INTO l FROM curriculum_private.lessons WHERE area=j.area AND course=j.card_id AND version=j.manifest->>'curriculumVersion' AND lesson=row->>'stepId' AND locale=row->>'locale';
 IF l.source_sha IS DISTINCT FROM row->>'sourceSha' THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF p_action='source' THEN
  RETURN jsonb_build_object('payload',l.payload,'sha256',l.source_sha,'existing',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'content',content,'contentSha',content_sha,'embedding',embedding::text)) FROM curriculum_private.chunks WHERE area=l.area AND course=l.course AND lesson=l.lesson AND locale=l.locale),'[]'));
 ELSIF p_action='commit' THEN
  IF jsonb_typeof(p_data->'rows') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'rows') NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'AUTOMATION_CHUNKS_INVALID'; END IF;
  IF jsonb_typeof(coalesce(p_data->'assetProofs','[]')) IS DISTINCT FROM 'array'
   OR jsonb_array_length(coalesce(p_data->'assetProofs','[]'))<>(SELECT count(*) FROM jsonb_array_elements(l.payload->'assets') asset WHERE asset->'storage' IS NOT NULL)
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(l.payload->'assets') asset WHERE asset->'storage' IS NOT NULL
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_data->'assetProofs') proof WHERE proof->>'id'=asset->>'id' AND proof->>'sha256'=asset->>'sha256')) THEN RAISE EXCEPTION 'AUTOMATION_ASSET_PROOF_REQUIRED'; END IF;
  IF jsonb_array_length(p_data->'rows')<>(SELECT count(*) FROM curriculum_private.teaching_chunks(l.payload)) THEN RAISE EXCEPTION 'AUTOMATION_CORPUS_INCOMPLETE'; END IF;
  DELETE FROM curriculum_private.chunks WHERE area=l.area AND course=l.course AND version=l.version AND lesson=l.lesson AND locale=l.locale;
  FOR row IN SELECT value FROM jsonb_array_elements(p_data->'rows') LOOP
   vector:=(row->>'embedding')::extensions.vector;
   IF row->>'id' !~ '^[A-Za-z0-9-]{1,110}$' OR length(row->>'content') NOT BETWEEN 1 AND 4000
    OR NOT EXISTS(SELECT 1 FROM curriculum_private.teaching_chunks(l.payload) approved WHERE approved.id=row->>'id' AND approved.content=row->>'content' AND approved.content_sha=row->>'contentSha')
    OR row->>'contentSha' IS DISTINCT FROM encode(extensions.digest(convert_to(row->>'content','UTF8'),'sha256'),'hex')
    OR extensions.vector_dims(vector)<>1536 OR extensions.vector_norm(vector)<=0 THEN RAISE EXCEPTION 'AUTOMATION_CHUNK_INVALID'; END IF;
   INSERT INTO curriculum_private.chunks VALUES(l.area,l.course,l.version,l.lesson,l.locale,row->>'id',row->>'content',l.source_sha,row->>'contentSha',vector);
  END LOOP;
  INSERT INTO curriculum_private.index_scopes VALUES(l.area,l.course,l.version,l.lesson,l.locale,l.source_sha,jsonb_array_length(p_data->'rows'),coalesce(p_data->'assetProofs','[]'))
   ON CONFLICT(area,course,version,lesson,locale) DO UPDATE SET chunk_count=excluded.chunk_count,source_sha=excluded.source_sha,asset_proofs=excluded.asset_proofs;
  RETURN jsonb_build_object('committed',true,'sourceSha',l.source_sha);
 END IF;
 RAISE EXCEPTION 'AUTOMATION_ACTION_INVALID';
END $$;
--> statement-breakpoint


CREATE FUNCTION public.curriculum_assistant_source(p_user uuid,p_area text,p_course text,p_lesson text,p_locale text,p_child uuid,p_embedding text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ver text; matches jsonb;
BEGIN
 PERFORM billing.commercial_require_service();
 IF NOT curriculum_private.access(p_user,p_area,p_course,p_lesson,p_locale,p_child) THEN RAISE EXCEPTION 'ASSISTANT_ACCESS_DENIED'; END IF;
 SELECT active_version INTO ver FROM curriculum_private.courses WHERE area=p_area AND id=p_course;
 IF p_embedding IS NULL THEN
  RETURN jsonb_build_object('version',ver,'source',(SELECT payload FROM curriculum_private.lessons WHERE area=p_area AND course=p_course AND version=ver AND lesson=p_lesson AND locale=p_locale));
 END IF;
 SELECT jsonb_agg(jsonb_build_object('id',q.id,'lesson',q.lesson,'title',(SELECT l.title FROM curriculum_private.lessons l WHERE (l.area,l.course,l.version,l.lesson,l.locale)=(q.area,q.course,q.version,q.lesson,q.locale)),
  'content',q.content,'contentSha',q.content_sha,'sourceSha',q.source_sha)) INTO matches
 FROM (SELECT * FROM curriculum_private.chunks WHERE area=p_area AND course=p_course AND version=ver AND locale=p_locale
  ORDER BY embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector LIMIT 6) q;
 RETURN jsonb_build_object('version',ver,'chunks',coalesce(matches,'[]'));
END $$;
--> statement-breakpoint


CREATE FUNCTION public.curriculum_asset_source(p_user uuid,p_area text,p_course text,p_lesson text,p_locale text,p_child uuid,p_asset text,p_version text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ver text; asset jsonb;
BEGIN
 PERFORM billing.commercial_require_service();
 SELECT active_version INTO ver FROM curriculum_private.courses WHERE area=p_area AND id=p_course;
 IF p_version IS NOT NULL AND p_version IS DISTINCT FROM ver THEN
  PERFORM curriculum_private.require_admin(p_user); ver:=p_version;
 ELSIF NOT curriculum_private.access(p_user,p_area,p_course,p_lesson,p_locale,p_child) THEN RAISE EXCEPTION 'CURRICULUM_ACCESS_REQUIRED'; END IF;
 SELECT x INTO asset FROM curriculum_private.lessons l,jsonb_array_elements(l.payload->'assets') x
  WHERE l.area=p_area AND l.course=p_course AND l.version=ver AND l.lesson=p_lesson AND l.locale=p_locale AND x->>'id'=p_asset;
 IF asset IS NULL OR asset->'storage' IS NULL OR asset->'storage'->>'bucket' NOT IN ('academic-downloads','technical-downloads')
  OR left(asset->'storage'->>'path',length(p_area||'/'||p_course||'/'))<>p_area||'/'||p_course||'/' THEN RAISE EXCEPTION 'CURRICULUM_ASSET_REQUIRED'; END IF;
 RETURN asset;
END $$;
--> statement-breakpoint


-- No new direct table access. Every public callable has a deliberately narrow
-- role; copied historical authorities remain inaccessible outside this schema.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='curriculum_private' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 END LOOP;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.curriculum_admin(uuid,text,jsonb),public.curriculum_index_metadata(),public.curriculum_index_operation(text,jsonb),public.curriculum_assistant_source(uuid,text,text,text,text,uuid,text),public.curriculum_asset_source(uuid,text,text,text,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.curriculum_admin(uuid,text,jsonb),public.curriculum_index_metadata(),public.curriculum_index_operation(text,jsonb),public.curriculum_assistant_source(uuid,text,text,text,text,uuid,text),public.curriculum_asset_source(uuid,text,text,text,text,uuid,text,text) TO service_role;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.curriculum_command(text,jsonb) FROM PUBLIC,anon;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.curriculum_command(text,jsonb) TO authenticated;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.curriculum_catalogue(text,text) FROM PUBLIC;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.curriculum_catalogue(text,text) TO anon,authenticated;
