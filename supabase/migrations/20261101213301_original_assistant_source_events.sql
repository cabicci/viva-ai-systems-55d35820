-- Original project 658adce0-747d-4c8e-90e3-d22225070b94 / abyqqeboyrkkwhjpwmtd ONLY.
-- Canonical ordered source-events migration. Already installed reviewed postimage is a catalog no-op.
-- Fresh install uses exact refreshed metadata pin and reviewed per-object ACL normalization.
-- No provider/index work, source backfill, policy enablement or legacy AI audit mutation.
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='60s';
DO $canonical_source_events$
DECLARE snapshot jsonb; normalized jsonb; item record;
BEGIN
 SELECT prerequisite_readback INTO snapshot FROM (
-- ONE read-only request for ROOT. Catalog definitions/ACLs plus queue counts only.
-- No business routine, model, provider, source payload, credentials, or mutation.
WITH wanted(name) AS (VALUES
 ('assistant_auto_policy'),('assistant_auto_jobs'),('assistant_auto_attempts'),
 ('assistant_auto_source_events'),('assistant_auto_source_events_event_id_seq'),('assistant_auto_intake_status'),
 ('kids_content_approvals'),('technical_lesson_content'),('academic_courses'),('academic_lesson_content'),
 ('card_assistant_policy'),('card_assistant_steps'),('card_assistant_chunks'),
 ('academic_assistant_policy'),('academic_rag_chunks'),('rag_current_batches')),
rels AS (
 SELECT w.name,c.oid,c.relkind,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity,c.reloptions
 FROM wanted w LEFT JOIN pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=w.name
), metadata AS (
 SELECT jsonb_build_object(
 'server_version_num',current_setting('server_version_num'),
 'schema_acl',(SELECT nspacl::text FROM pg_namespace WHERE nspname='public'),
 'roles',(SELECT jsonb_agg(jsonb_build_object('name',rolname,'super',rolsuper,'bypassrls',rolbypassrls,'inherit',rolinherit) ORDER BY rolname)
   FROM pg_roles WHERE rolname IN('anon','authenticated','service_role',current_user)),
 'role_membership',(SELECT coalesce(jsonb_agg(jsonb_build_object('member',pg_get_userbyid(member),'role',pg_get_userbyid(roleid),'admin',admin_option) ORDER BY member,roleid),'[]')
   FROM pg_auth_members WHERE member IN(SELECT oid FROM pg_roles WHERE rolname IN('anon','authenticated','service_role',current_user))),
 'default_acls',(SELECT coalesce(jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(defaclrole),'schema',coalesce(n.nspname,'*'),'type',defaclobjtype,'acl',defaclacl::text) ORDER BY defaclrole,defaclnamespace,defaclobjtype),'[]')
   FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
   WHERE d.defaclnamespace=0 OR n.nspname='public'),
 'routines',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'signature',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text,
   'security_definer',p.prosecdef,'config',p.proconfig,'definition',pg_get_functiondef(p.oid),
   'definition_md5',md5(pg_get_functiondef(p.oid)),
   'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
   'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
   'service_execute',has_function_privilege('service_role',p.oid,'EXECUTE')) ORDER BY p.oid::regprocedure::text),'[]')
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prokind='f' AND (left(p.proname,15)='assistant_auto_' OR p.proname='rag_require_service_role')),
 'relations',(SELECT jsonb_agg(jsonb_build_object(
   'name',r.name,'exists',r.oid IS NOT NULL,'kind',r.relkind,'owner',pg_get_userbyid(r.relowner),'acl',r.relacl::text,
   'rls',r.relrowsecurity,'force_rls',r.relforcerowsecurity,'options',r.reloptions,
   'view',CASE WHEN r.relkind IN('v','m') THEN pg_get_viewdef(r.oid,true) END,
   'columns',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum),'[]')
      FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE a.attrelid=r.oid AND a.attnum>0 AND NOT a.attisdropped),
   'constraints',(SELECT coalesce(jsonb_agg(pg_get_constraintdef(c.oid,true) ORDER BY c.conname),'[]') FROM pg_constraint c WHERE c.conrelid=r.oid),
   'indexes',(SELECT coalesce(jsonb_agg(pg_get_indexdef(i.indexrelid) ORDER BY i.indexrelid::regclass::text),'[]') FROM pg_index i WHERE i.indrelid=r.oid),
   'policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',polname,'command',polcmd,'roles',polroles,'permissive',polpermissive,'using',pg_get_expr(polqual,polrelid),'check',pg_get_expr(polwithcheck,polrelid)) ORDER BY polname),'[]') FROM pg_policy WHERE polrelid=r.oid),
   'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true),'function',t.tgfoid::regprocedure::text,'function_definition',pg_get_functiondef(t.tgfoid),'function_owner',pg_get_userbyid(f.proowner),'function_acl',f.proacl::text) ORDER BY t.tgname),'[]')
      FROM pg_trigger t JOIN pg_proc f ON f.oid=t.tgfoid WHERE t.tgrelid=r.oid AND NOT t.tgisinternal)
 ) ORDER BY r.name) FROM rels r)
 ) value
)
SELECT jsonb_build_object(
 'metadata',value,'metadata_md5',md5(value::text),
 'policy',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY singleton),'[]') FROM public.assistant_auto_policy p),
 'jobs',(SELECT count(*) FROM public.assistant_auto_jobs),
 'attempts',(SELECT count(*) FROM public.assistant_auto_attempts)
) AS prerequisite_readback FROM metadata
 ) readback;
 IF to_regclass('public.assistant_auto_source_events') IS NOT NULL
  OR to_regclass('public.assistant_auto_source_events_event_id_seq') IS NOT NULL
  OR to_regclass('public.assistant_auto_intake_status') IS NOT NULL THEN
  normalized:=snapshot->'metadata';
  normalized:=jsonb_set(normalized,'{routines}',
   (SELECT coalesce(jsonb_agg(r ORDER BY r->>'signature'),'[]'::jsonb)
    FROM jsonb_array_elements(normalized->'routines') r
    WHERE r->>'signature' NOT IN('assistant_auto_publish_card(text,uuid,uuid)','assistant_auto_publish_academic(text,uuid,uuid)')));
  IF md5(normalized::text) IS DISTINCT FROM '4f12d7bcd562c082d5b7636b30505f38' THEN
   RAISE EXCEPTION 'AUTOMATION_SOURCE_EVENT_POSTIMAGE_CHANGED'; END IF;
  FOR item IN SELECT p.oid,p.proname,p.proowner,p.proacl,
    md5(pg_get_functiondef(p.oid)) definition_md5
   FROM pg_proc p WHERE p.oid IN('public.assistant_auto_publish_card(text,uuid,uuid)'::regprocedure,
     'public.assistant_auto_publish_academic(text,uuid,uuid)'::regprocedure) LOOP
   IF pg_get_userbyid(item.proowner)<>'postgres'
    OR item.proacl::text IS DISTINCT FROM '{postgres=X/postgres,service_role=X/postgres}'
    OR (item.proname='assistant_auto_publish_card' AND item.definition_md5<>'e576a2650c148b53806ba3e4c543edc7')
    OR (item.proname='assistant_auto_publish_academic' AND item.definition_md5 NOT IN
       ('856759b9d8142c314a482f24ea84f3e3','b03d115e0d40db1460739fc26beec7f9'))
    THEN RAISE EXCEPTION 'AUTOMATION_PUBLICATION_POSTIMAGE_CHANGED'; END IF;
  END LOOP;
  RETURN;
 END IF;
 EXECUTE $reviewed_original_upgrade$
-- PREPARED ONLY. Unbound metadata pin intentionally prevents live execution.
-- No cumulative queue/publication schema replay. No enable, source backfill or index work.
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
LOCK TABLE public.assistant_auto_policy,public.assistant_auto_jobs,public.assistant_auto_attempts,
 public.kids_content_approvals,public.technical_lesson_content,public.academic_courses,public.academic_lesson_content,
 public.card_assistant_policy,public.card_assistant_steps,public.card_assistant_chunks,
 public.academic_assistant_policy,public.academic_rag_chunks,public.rag_current_batches IN SHARE ROW EXCLUSIVE MODE NOWAIT;
DO $guard$
DECLARE observed jsonb; expected text:='382482f9088237556bdf2fdb88076d5b'; signature text;
BEGIN
 IF expected !~ '^[a-f0-9]{32}$' THEN RAISE EXCEPTION 'AUTOMATION_TARGET_PINS_REQUIRED'; END IF;
 SELECT prerequisite_readback INTO observed FROM (
-- ONE read-only request for ROOT. Catalog definitions/ACLs plus queue counts only.
-- No business routine, model, provider, source payload, credentials, or mutation.
WITH wanted(name) AS (VALUES
 ('assistant_auto_policy'),('assistant_auto_jobs'),('assistant_auto_attempts'),
 ('assistant_auto_source_events'),('assistant_auto_source_events_event_id_seq'),('assistant_auto_intake_status'),
 ('kids_content_approvals'),('technical_lesson_content'),('academic_courses'),('academic_lesson_content'),
 ('card_assistant_policy'),('card_assistant_steps'),('card_assistant_chunks'),
 ('academic_assistant_policy'),('academic_rag_chunks'),('rag_current_batches')),
rels AS (
 SELECT w.name,c.oid,c.relkind,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity,c.reloptions
 FROM wanted w LEFT JOIN pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=w.name
), metadata AS (
 SELECT jsonb_build_object(
 'server_version_num',current_setting('server_version_num'),
 'schema_acl',(SELECT nspacl::text FROM pg_namespace WHERE nspname='public'),
 'roles',(SELECT jsonb_agg(jsonb_build_object('name',rolname,'super',rolsuper,'bypassrls',rolbypassrls,'inherit',rolinherit) ORDER BY rolname)
   FROM pg_roles WHERE rolname IN('anon','authenticated','service_role',current_user)),
 'role_membership',(SELECT coalesce(jsonb_agg(jsonb_build_object('member',pg_get_userbyid(member),'role',pg_get_userbyid(roleid),'admin',admin_option) ORDER BY member,roleid),'[]')
   FROM pg_auth_members WHERE member IN(SELECT oid FROM pg_roles WHERE rolname IN('anon','authenticated','service_role',current_user))),
 'default_acls',(SELECT coalesce(jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(defaclrole),'schema',coalesce(n.nspname,'*'),'type',defaclobjtype,'acl',defaclacl::text) ORDER BY defaclrole,defaclnamespace,defaclobjtype),'[]')
   FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
   WHERE d.defaclnamespace=0 OR n.nspname='public'),
 'routines',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'signature',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text,
   'security_definer',p.prosecdef,'config',p.proconfig,'definition',pg_get_functiondef(p.oid),
   'definition_md5',md5(pg_get_functiondef(p.oid)),
   'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
   'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
   'service_execute',has_function_privilege('service_role',p.oid,'EXECUTE')) ORDER BY p.oid::regprocedure::text),'[]')
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prokind='f' AND (left(p.proname,15)='assistant_auto_' OR p.proname='rag_require_service_role')),
 'relations',(SELECT jsonb_agg(jsonb_build_object(
   'name',r.name,'exists',r.oid IS NOT NULL,'kind',r.relkind,'owner',pg_get_userbyid(r.relowner),'acl',r.relacl::text,
   'rls',r.relrowsecurity,'force_rls',r.relforcerowsecurity,'options',r.reloptions,
   'view',CASE WHEN r.relkind IN('v','m') THEN pg_get_viewdef(r.oid,true) END,
   'columns',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum),'[]')
      FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE a.attrelid=r.oid AND a.attnum>0 AND NOT a.attisdropped),
   'constraints',(SELECT coalesce(jsonb_agg(pg_get_constraintdef(c.oid,true) ORDER BY c.conname),'[]') FROM pg_constraint c WHERE c.conrelid=r.oid),
   'indexes',(SELECT coalesce(jsonb_agg(pg_get_indexdef(i.indexrelid) ORDER BY i.indexrelid::regclass::text),'[]') FROM pg_index i WHERE i.indrelid=r.oid),
   'policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',polname,'command',polcmd,'roles',polroles,'permissive',polpermissive,'using',pg_get_expr(polqual,polrelid),'check',pg_get_expr(polwithcheck,polrelid)) ORDER BY polname),'[]') FROM pg_policy WHERE polrelid=r.oid),
   'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true),'function',t.tgfoid::regprocedure::text,'function_definition',pg_get_functiondef(t.tgfoid),'function_owner',pg_get_userbyid(f.proowner),'function_acl',f.proacl::text) ORDER BY t.tgname),'[]')
      FROM pg_trigger t JOIN pg_proc f ON f.oid=t.tgfoid WHERE t.tgrelid=r.oid AND NOT t.tgisinternal)
 ) ORDER BY r.name) FROM rels r)
 ) value
)
SELECT jsonb_build_object(
 'metadata',value,'metadata_md5',md5(value::text),
 'policy',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY singleton),'[]') FROM public.assistant_auto_policy p),
 'jobs',(SELECT count(*) FROM public.assistant_auto_jobs),
 'attempts',(SELECT count(*) FROM public.assistant_auto_attempts)
) AS prerequisite_readback FROM metadata
 ) snapshot;
 IF observed->>'metadata_md5' IS DISTINCT FROM expected THEN RAISE EXCEPTION 'AUTOMATION_TARGET_METADATA_CHANGED'; END IF;
 IF observed->>'jobs' IS DISTINCT FROM '0' OR observed->>'attempts' IS DISTINCT FROM '0'
  OR observed->'policy' IS DISTINCT FROM '[{"singleton":true,"enabled":false,"excluded_cards":[]}]'::jsonb
  THEN RAISE EXCEPTION 'AUTOMATION_TARGET_NOT_QUIESCENT'; END IF;
 IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname IN('assistant_auto_policy','assistant_auto_jobs','assistant_auto_attempts')
     AND c.relkind='r' AND c.relrowsecurity)<>3 THEN RAISE EXCEPTION 'AUTOMATION_BASE_TABLES_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
   AND p.proname IN('assistant_auto_capture_source','assistant_auto_source_revisions','assistant_auto_link_sources','assistant_auto_receipt'))
  OR to_regclass('public.assistant_auto_source_events') IS NOT NULL
  OR to_regclass('public.assistant_auto_source_events_event_id_seq') IS NOT NULL
  OR to_regclass('public.assistant_auto_intake_status') IS NOT NULL
  OR EXISTS(SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname IN('assistant_auto_kids_source','assistant_auto_technical_source','assistant_auto_academic_source','assistant_auto_academic_policy'))
  THEN RAISE EXCEPTION 'AUTOMATION_UPGRADE_ALREADY_OR_PARTLY_PRESENT'; END IF;
 IF md5(pg_get_functiondef('public.assistant_auto_check(text,uuid,uuid)'::regprocedure)) IS DISTINCT FROM 'df24edd7dd27dfe328aec77d800b2e15'
  THEN RAISE EXCEPTION 'AUTOMATION_CHECK_PREIMAGE_CHANGED'; END IF;
 FOREACH signature IN ARRAY ARRAY[
  'public.rag_require_service_role()', 'public.assistant_auto_register(jsonb,jsonb)',
  'public.assistant_auto_check(text,uuid,uuid)', 'public.assistant_auto_claim(jsonb,uuid)',
  'public.assistant_auto_reserve(text,uuid,uuid)', 'public.assistant_auto_finish(text,uuid,uuid,boolean,jsonb)',
  'public.assistant_auto_hold(text,uuid,uuid,text)', 'public.assistant_auto_status()',
  'public.assistant_auto_ai_clear(text)', 'public.assistant_auto_publish_card(text,uuid,uuid)',
  'public.assistant_auto_publish_academic(text,uuid,uuid)'] LOOP
  IF to_regprocedure(signature) IS NULL THEN RAISE EXCEPTION 'AUTOMATION_REQUIRED_ROUTINE_MISSING:%',signature; END IF;
  IF has_function_privilege('anon',to_regprocedure(signature),'EXECUTE')
    OR has_function_privilege('authenticated',to_regprocedure(signature),'EXECUTE')
    OR NOT has_function_privilege('service_role',to_regprocedure(signature),'EXECUTE')
   THEN RAISE EXCEPTION 'AUTOMATION_REQUIRED_ROUTINE_ACL_CHANGED:%',signature; END IF;
 END LOOP;
END $guard$;
CREATE TABLE public.assistant_auto_source_events (
 event_id bigserial PRIMARY KEY,
 area text NOT NULL CHECK(area IN ('kids','technical','academic')),
 source_key text NOT NULL, locale text NOT NULL,
 source_sha text, withdrawn boolean NOT NULL,
 job_id text REFERENCES public.assistant_auto_jobs(job_id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assistant_auto_unlinked_source ON public.assistant_auto_source_events(event_id) WHERE job_id IS NULL;
ALTER TABLE public.assistant_auto_source_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assistant_auto_source_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.assistant_auto_source_events TO service_role;
REVOKE ALL ON SEQUENCE public.assistant_auto_source_events_event_id_seq FROM PUBLIC,anon,authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.assistant_auto_source_events_event_id_seq TO service_role;

CREATE FUNCTION public.assistant_auto_capture_source() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous jsonb; nextrow jsonb; rowdata jsonb; a text; k text; loc text; sha text; gone boolean;
BEGIN
 previous:=CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END;
 nextrow:=CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END;
 IF TG_OP='UPDATE' AND previous=nextrow THEN RETURN NEW; END IF;
 -- A moved source emits withdrawal of its old identity and admission of its new
 -- identity. Source approval itself remains with the pre-existing source writer.
 FOR rowdata IN SELECT value FROM jsonb_array_elements(
   CASE WHEN previous IS NULL THEN jsonb_build_array(nextrow)
        WHEN nextrow IS NULL THEN jsonb_build_array(previous)
        ELSE jsonb_build_array(previous,nextrow) END) LOOP
  gone:=nextrow IS NULL OR (previous IS NOT NULL AND rowdata=previous);
  IF TG_TABLE_NAME='kids_content_approvals' THEN
   a:='kids';k:=rowdata->>'level_id'||':'||(rowdata->>'lesson_number');loc:=rowdata->>'locale';sha:=rowdata->>'approved_sha256';
  ELSIF TG_TABLE_NAME='technical_lesson_content' THEN
   a:='technical';k:=rowdata->>'lesson_id';loc:=rowdata->>'locale';sha:=rowdata->>'source_sha256';
  ELSIF TG_TABLE_NAME='academic_lesson_content' THEN
   a:='academic';k:=rowdata->>'course_id'||':'||(rowdata->>'lesson_id');loc:=rowdata->>'locale';sha:=rowdata->>'source_sha256';
   gone:=gone OR (rowdata->>'approved')::boolean IS DISTINCT FROM true;
  ELSIF TG_TABLE_NAME='academic_courses' THEN
   a:='academic';k:=rowdata->>'id';loc:='*';sha:=NULL;
  ELSE RAISE EXCEPTION 'AUTOMATION_SOURCE_TABLE_INVALID'; END IF;
  IF k IS NULL OR loc IS NULL THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_IDENTITY_INVALID'; END IF;
  IF sha IS NOT NULL AND sha !~ '^[a-f0-9]{64}$' THEN gone:=true; END IF;
  INSERT INTO public.assistant_auto_source_events(area,source_key,locale,source_sha,withdrawn)
   VALUES(a,k,loc,CASE WHEN gone THEN NULL ELSE sha END,gone);
  -- Never serve an old index while its source approval/content is changing.
  -- Existing runtime source/access checks remain mandatory as well.
  IF a='academic' THEN
   UPDATE public.academic_assistant_policy SET runtime_enabled=false
    WHERE course_id=split_part(k,':',1);
  ELSE
   UPDATE public.card_assistant_policy p SET runtime_enabled=false
    WHERE p.area=a AND EXISTS(SELECT 1 FROM public.card_assistant_steps s
      WHERE s.area=p.area AND s.card_id=p.card_id AND s.source_key=k);
  END IF;
 END LOOP;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION public.assistant_auto_capture_source() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER assistant_auto_kids_source AFTER INSERT OR UPDATE OR DELETE ON public.kids_content_approvals
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();
CREATE TRIGGER assistant_auto_technical_source AFTER INSERT OR UPDATE OR DELETE ON public.technical_lesson_content
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();
CREATE TRIGGER assistant_auto_academic_source AFTER INSERT OR UPDATE OR DELETE ON public.academic_lesson_content
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();
CREATE TRIGGER assistant_auto_academic_policy AFTER INSERT OR UPDATE OR DELETE ON public.academic_courses
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();

-- A repeated source digest after withdrawal must create a NEW queue identity;
-- otherwise a previously complete job would leave the republished card disabled.
CREATE FUNCTION public.assistant_auto_source_revisions(p_registry jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; card jsonb; n bigint;
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_registry) IS DISTINCT FROM 'array' OR jsonb_array_length(p_registry)>200
  THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_INVALID'; END IF;
 result:='{}';
 FOR card IN SELECT value FROM jsonb_array_elements(p_registry) LOOP
  SELECT coalesce(max(e.event_id),0) INTO n FROM public.assistant_auto_source_events e
   WHERE e.area=card->>'area' AND EXISTS(SELECT 1 FROM jsonb_array_elements(card->'steps') s
    WHERE e.source_key=CASE WHEN e.area='kids' THEN s->'source'->>'levelId'||':'||(s->'source'->>'lessonNumber')
      ELSE s->'source'->>'lessonId' END);
  result:=result||jsonb_build_object((card->>'area')||':'||(card->>'id'),n::text);
 END LOOP;
 SELECT result||coalesce(jsonb_object_agg('academic:'||revisions.course,revisions.n::text),'{}') INTO result
  FROM (SELECT split_part(source_key,':',1) course,max(event_id) n FROM public.assistant_auto_source_events
   WHERE area='academic' GROUP BY 1) revisions;
 RETURN result;
END $$;

-- Same existing lease guard, now also fenced by its own card's source epoch.
-- Changes in an unrelated course never invalidate this lease.
CREATE OR REPLACE FUNCTION public.assistant_auto_check(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs; latest bigint;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job;
 IF NOT FOUND OR j.state<>'running' OR j.request_id IS DISTINCT FROM p_request
  OR j.lease_token IS DISTINCT FROM p_lease OR j.lease_until IS NULL OR j.lease_until<=now()
  OR NOT EXISTS(SELECT 1 FROM public.assistant_auto_policy p WHERE p.enabled AND NOT(p.excluded_cards ? (j.area||':'||j.card_id)))
  THEN RETURN false; END IF;
 SELECT coalesce(max(e.event_id),0) INTO latest FROM public.assistant_auto_source_events e
 WHERE e.area=j.area AND ((e.area='academic' AND split_part(e.source_key,':',1)=j.card_id)
  OR EXISTS(SELECT 1 FROM public.card_assistant_steps s WHERE s.area=j.area AND s.card_id=j.card_id AND s.source_key=e.source_key));
 RETURN latest=0 OR (j.manifest->>'sourceRevision') IS NOT DISTINCT FROM latest::text;
END $$;

CREATE FUNCTION public.assistant_auto_link_sources(p_keys jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_keys) IS DISTINCT FROM 'array' OR jsonb_array_length(p_keys)>200
  THEN RAISE EXCEPTION 'AUTOMATION_SCOPE_LIMIT'; END IF;
 UPDATE public.assistant_auto_source_events e SET job_id=j.job_id
 FROM public.assistant_auto_jobs j
 WHERE e.job_id IS NULL AND j.job_id IN(SELECT jsonb_array_elements_text(p_keys))
  AND j.area=e.area AND j.manifest->>'sourceRevision' ~ '^[0-9]{1,20}$'
  AND e.event_id<=(j.manifest->>'sourceRevision')::numeric
  AND ((e.area='academic' AND split_part(e.source_key,':',1)=j.card_id)
   OR EXISTS(SELECT 1 FROM public.card_assistant_steps s
    WHERE s.area=j.area AND s.card_id=j.card_id AND s.source_key=e.source_key));
 RETURN true;
END $$;

-- Read-only reconciliation after a LOST finish response. Matching exact
-- request, job, offset and JSON receipt is required; an unrelated job or newer
-- lease cannot be mistaken for this operation's completion.
CREATE FUNCTION public.assistant_auto_receipt(p_job text,p_request uuid,p_offset integer,p_receipt jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_receipt) IS DISTINCT FROM 'object' OR octet_length(p_receipt::text)>100000
  THEN RAISE EXCEPTION 'AUTOMATION_RECEIPT_INVALID'; END IF;
 RETURN EXISTS(SELECT 1 FROM public.assistant_auto_attempts a JOIN public.assistant_auto_jobs j USING(job_id)
  WHERE a.job_id=p_job AND a.request_id=p_request AND a.scope_offset=p_offset
   AND a.state='done' AND a.receipt=p_receipt AND j.next_offset>p_offset);
END $$;

CREATE VIEW public.assistant_auto_intake_status WITH(security_invoker=true) AS
 SELECT e.event_id,e.area,e.source_key,e.locale,e.source_sha,e.withdrawn,e.job_id,
  CASE WHEN EXISTS(SELECT 1 FROM public.assistant_auto_source_events newer
   WHERE newer.area=e.area AND newer.source_key=e.source_key AND newer.locale=e.locale AND newer.event_id>e.event_id)
   THEN 'superseded' ELSE CASE j.state WHEN 'running' THEN 'working' WHEN 'complete' THEN 'succeeded'
   WHEN 'held' THEN 'failed' ELSE 'pending' END END AS state,
  j.error_code,j.next_offset,j.scope_count,e.created_at
 FROM public.assistant_auto_source_events e LEFT JOIN public.assistant_auto_jobs j USING(job_id);
REVOKE ALL ON public.assistant_auto_intake_status FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.assistant_auto_intake_status TO service_role;
REVOKE ALL ON FUNCTION public.assistant_auto_source_revisions(jsonb),public.assistant_auto_link_sources(jsonb),
 public.assistant_auto_receipt(text,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_auto_source_revisions(jsonb),public.assistant_auto_link_sources(jsonb),
 public.assistant_auto_receipt(text,uuid,integer,jsonb) TO service_role;
-- Normalize ONLY fresh objects, including grants inherited from live defaults.
-- Preserve owner privileges. No global/default ACL change and no retained sandbox grant.
DO $new_object_acl$
DECLARE object record; grantee record; kind text;
BEGIN
 FOR object IN SELECT c.oid,c.relowner AS owner,c.relacl AS acl,c.relkind AS kind,c.oid::regclass::text AS signature
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
   AND c.relname IN('assistant_auto_source_events','assistant_auto_source_events_event_id_seq','assistant_auto_intake_status') LOOP
  kind:=CASE WHEN object.kind='S' THEN 'SEQUENCE' ELSE 'TABLE' END;
  EXECUTE format('REVOKE ALL ON %s %s FROM PUBLIC',kind,object.signature);
  FOR grantee IN SELECT DISTINCT a.grantee FROM aclexplode(coalesce(object.acl,acldefault(CASE WHEN object.kind='S' THEN 'S'::"char" ELSE 'r'::"char" END,object.owner))) a
    WHERE a.grantee<>0 AND a.grantee<>object.owner LOOP
   EXECUTE format('REVOKE ALL ON %s %s FROM %I',kind,object.signature,pg_get_userbyid(grantee.grantee));
  END LOOP;
 END LOOP;
 FOR object IN SELECT p.oid,p.proowner AS owner,p.proacl AS acl,p.oid::regprocedure::text AS signature
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
   AND p.proname IN('assistant_auto_capture_source','assistant_auto_source_revisions','assistant_auto_link_sources','assistant_auto_receipt') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',object.signature);
  FOR grantee IN SELECT DISTINCT a.grantee FROM aclexplode(coalesce(object.acl,acldefault('f',object.owner))) a
    WHERE a.grantee<>0 AND a.grantee<>object.owner LOOP
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',object.signature,pg_get_userbyid(grantee.grantee));
  END LOOP;
 END LOOP;
END $new_object_acl$;
GRANT SELECT,INSERT,UPDATE ON TABLE public.assistant_auto_source_events TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.assistant_auto_source_events_event_id_seq TO service_role;
GRANT SELECT ON TABLE public.assistant_auto_intake_status TO service_role;
GRANT EXECUTE ON FUNCTION public.assistant_auto_source_revisions(jsonb),public.assistant_auto_link_sources(jsonb),public.assistant_auto_receipt(text,uuid,integer,jsonb) TO service_role;
-- capture_source is trigger-only: owner keeps EXECUTE, no direct caller grant.
-- Recheck epoch AFTER source/publication locks. Retain every other installed byte.
DO $publication_fence$
DECLARE signature text; definition text; marker text:='IN SHARE ROW EXCLUSIVE MODE;';
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.assistant_auto_publish_card(text,uuid,uuid)','public.assistant_auto_publish_academic(text,uuid,uuid)'] LOOP
  definition:=pg_get_functiondef(to_regprocedure(signature));
  IF (length(definition)-length(replace(definition,marker,'')))/length(marker)<>1 THEN
   RAISE EXCEPTION 'AUTOMATION_PUBLICATION_LOCK_PREIMAGE_CHANGED:%',signature;
  END IF;
  EXECUTE replace(definition,marker,marker||E'\n  IF NOT public.assistant_auto_check(p_job,p_request,p_lease) THEN RAISE EXCEPTION ''AUTOMATION_SOURCE_CHANGED''; END IF;');
 END LOOP;
END $publication_fence$;
-- No settings or policy activation. All DDL/ACL/fence changes commit together.
DO $postcondition$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
  AND p.proname IN('assistant_auto_capture_source','assistant_auto_source_revisions','assistant_auto_link_sources','assistant_auto_receipt')
  AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE')))
  OR has_sequence_privilege('anon','public.assistant_auto_source_events_event_id_seq','USAGE')
  OR has_sequence_privilege('authenticated','public.assistant_auto_source_events_event_id_seq','USAGE')
  THEN RAISE EXCEPTION 'AUTOMATION_NEW_OBJECT_ACL_UNSAFE'; END IF;
 IF (SELECT enabled FROM public.assistant_auto_policy) IS DISTINCT FROM false
  OR EXISTS(SELECT 1 FROM public.assistant_auto_jobs) OR EXISTS(SELECT 1 FROM public.assistant_auto_attempts)
  OR EXISTS(SELECT 1 FROM public.assistant_auto_source_events) THEN RAISE EXCEPTION 'AUTOMATION_UPGRADE_STATE_DRIFT'; END IF;
END $postcondition$;

$reviewed_original_upgrade$;
END $canonical_source_events$;
COMMIT;
