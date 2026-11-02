-- PREPARED SOURCE candidate for ORIGINAL project 658adce0-747d-4c8e-90e3-d22225070b94.
-- Backend abyqqeboyrkkwhjpwmtd. Read-only promotion audit: no application authorized in this pass.
-- Records reviewed publication post-lock epoch checks and disabled-course preparation.
-- Existing functions only; no table data, flags, roles, grants, owner or schema changes.
-- Requires the existing automatic-indexing/source-event prerequisites. Refuses unknown definitions.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
DO $canonical_publication$
DECLARE
 signature text; target oid; observed text; final_md5 text; allowed text[];
 final_definition text; prior_owner oid; prior_acl aclitem[];
BEGIN
 -- Existing source-events installation must be independently validated before promotion.
 IF to_regclass('public.assistant_auto_source_events') IS NULL
  OR to_regclass('public.assistant_auto_intake_status') IS NULL
  OR to_regprocedure('public.assistant_auto_source_revisions(jsonb)') IS NULL
  OR to_regprocedure('public.assistant_auto_link_sources(jsonb)') IS NULL
  OR to_regprocedure('public.assistant_auto_receipt(text,uuid,integer,jsonb)') IS NULL
  OR to_regprocedure('public.assistant_auto_check(text,uuid,uuid)') IS NULL THEN
  RAISE EXCEPTION 'AUTOMATION_SOURCE_EVENT_PREREQUISITES_REQUIRED';
 END IF;
 IF position('sourceRevision' IN pg_get_functiondef('public.assistant_auto_check(text,uuid,uuid)'::regprocedure))=0 THEN
  RAISE EXCEPTION 'AUTOMATION_SOURCE_EPOCH_CHECK_REQUIRED';
 END IF;
 FOREACH signature IN ARRAY ARRAY[
  'public.assistant_auto_publish_card(text,uuid,uuid)',
  'public.assistant_auto_publish_academic(text,uuid,uuid)'
 ] LOOP
  target:=to_regprocedure(signature);
  IF target IS NULL THEN RAISE EXCEPTION 'AUTOMATION_PUBLICATION_PREREQUISITE_MISSING:%',signature; END IF;
  IF signature='public.assistant_auto_publish_card(text,uuid,uuid)' THEN
   allowed:=ARRAY['b48bf68e48856d7301885995a5453065','e576a2650c148b53806ba3e4c543edc7'];
   final_md5:='e576a2650c148b53806ba3e4c543edc7';
   final_definition:=$card_definition$CREATE OR REPLACE FUNCTION public.assistant_auto_publish_card(p_job text, p_request uuid, p_lease uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '60s'
 SET lock_timeout TO '3s'
AS $function$
DECLARE j public.assistant_auto_jobs; expected_count integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) OR j.area NOT IN('kids','technical') OR j.next_offset<>j.scope_count-1
  OR jsonb_array_length(j.manifest->'scopes')<>j.next_offset THEN RAISE EXCEPTION 'AUTOMATION_NOT_READY'; END IF;
 LOCK TABLE public.card_assistant_policy,public.card_assistant_steps,public.card_assistant_chunks,
  public.kids_content_approvals,public.technical_lesson_content IN SHARE ROW EXCLUSIVE MODE;
  IF NOT public.assistant_auto_check(p_job,p_request,p_lease) THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(j.manifest->'scopes') WITH ORDINALITY s(scope,ordinal)
  LEFT JOIN public.assistant_auto_attempts a ON a.job_id=j.job_id AND a.scope_offset=s.ordinal-1 AND a.state='done'
  LEFT JOIN public.card_assistant_steps st ON st.area=j.area AND st.card_id=j.card_id AND st.step_id=s.scope->>'stepId'
  WHERE a.request_id IS NULL OR jsonb_array_length(a.receipt->'proofs') IS DISTINCT FROM 1
   OR a.receipt->'proofs'->0->>'stepId' IS DISTINCT FROM s.scope->>'stepId'
   OR a.receipt->'proofs'->0->>'locale' IS DISTINCT FROM s.scope->>'locale'
   OR a.receipt->'proofs'->0->>'sourceSha' IS DISTINCT FROM s.scope->>'sourceSha'
   OR jsonb_array_length(a.receipt->'proofs'->0->'chunks') NOT BETWEEN 1 AND 80 OR st.step_id IS NULL
   OR NOT ((j.area='kids' AND EXISTS(SELECT 1 FROM public.kids_content_approvals k WHERE k.level_id=st.kids_level
    AND k.lesson_number=st.kids_lesson AND k.locale=s.scope->>'locale' AND k.approved_sha256=s.scope->>'sourceSha'))
    OR (j.area='technical' AND EXISTS(SELECT 1 FROM public.technical_lesson_content t WHERE t.lesson_id=st.technical_lesson
     AND t.locale=s.scope->>'locale' AND t.source_sha256=s.scope->>'sourceSha')))) THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF (SELECT count(*)*4 FROM public.card_assistant_steps WHERE area=j.area AND card_id=j.card_id)<>j.next_offset
  OR (SELECT count(DISTINCT (s->>'stepId',s->>'locale')) FROM jsonb_array_elements(j.manifest->'scopes') s)<>j.next_offset
  THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_CHANGED'; END IF;
 WITH expected AS (
  SELECT a.receipt->'proofs'->0 p,c FROM public.assistant_auto_attempts a
   CROSS JOIN LATERAL jsonb_array_elements(a.receipt->'proofs'->0->'chunks') c
  WHERE a.job_id=j.job_id AND a.scope_offset<j.next_offset AND a.state='done'
 ) SELECT count(*) INTO expected_count FROM expected;
 IF expected_count<>(SELECT count(DISTINCT(a.receipt->'proofs'->0->>'stepId',a.receipt->'proofs'->0->>'locale',c->>'id'))
  FROM public.assistant_auto_attempts a CROSS JOIN LATERAL jsonb_array_elements(a.receipt->'proofs'->0->'chunks') c
  WHERE a.job_id=j.job_id AND a.scope_offset<j.next_offset AND a.state='done') THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 IF expected_count<1 OR (SELECT count(*) FROM public.card_assistant_chunks WHERE area=j.area AND card_id=j.card_id)<>expected_count
  THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 IF EXISTS(WITH expected AS (
  SELECT a.receipt->'proofs'->0 p,c FROM public.assistant_auto_attempts a
   CROSS JOIN LATERAL jsonb_array_elements(a.receipt->'proofs'->0->'chunks') c
  WHERE a.job_id=j.job_id AND a.scope_offset<j.next_offset AND a.state='done'
 ) SELECT 1 FROM expected e LEFT JOIN public.card_assistant_chunks c ON c.area=j.area AND c.card_id=j.card_id
  AND c.step_id=e.p->>'stepId' AND c.locale=e.p->>'locale' AND c.chunk_id=e.c->>'id'
 WHERE c.chunk_id IS NULL OR c.source_sha256 IS DISTINCT FROM e.p->>'sourceSha' OR c.payload_sha256 IS DISTINCT FROM e.c->>'payloadSha'
  OR c.content_sha256 IS DISTINCT FROM e.c->>'contentSha' OR c.content_sha256 IS DISTINCT FROM encode(extensions.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')
  OR c.embedding_model IS DISTINCT FROM 'text-embedding-3-small' OR c.embedding_dimensions IS DISTINCT FROM 1536
  OR c.embedding IS NULL OR extensions.vector_dims(c.embedding) IS DISTINCT FROM 1536
  OR (extensions.vector_norm(c.embedding) BETWEEN 0.00000000000000000001 AND 10000000000) IS DISTINCT FROM true)
 THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 UPDATE public.card_assistant_policy SET runtime_enabled=true WHERE area=j.area AND card_id=j.card_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_POLICY_MISSING'; END IF;
 RETURN true;
END $function$
$card_definition$;
  ELSE
   allowed:=ARRAY['2960de586eecd289ba4f0cdb9941c670','856759b9d8142c314a482f24ea84f3e3','b03d115e0d40db1460739fc26beec7f9'];
   final_md5:='b03d115e0d40db1460739fc26beec7f9';
   final_definition:=$academic_definition$CREATE OR REPLACE FUNCTION public.assistant_auto_publish_academic(p_job text, p_request uuid, p_lease uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '60s'
 SET lock_timeout TO '3s'
AS $function$
DECLARE j public.assistant_auto_jobs; expected_count integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) OR j.area<>'academic' OR j.next_offset<>j.scope_count-1
  OR jsonb_array_length(j.manifest->'scopes')<>j.next_offset THEN RAISE EXCEPTION 'AUTOMATION_NOT_READY'; END IF;
 LOCK TABLE public.academic_courses,public.academic_lesson_content,public.academic_rag_chunks,public.academic_assistant_policy IN SHARE ROW EXCLUSIVE MODE;
  IF NOT public.assistant_auto_check(p_job,p_request,p_lease) THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.academic_courses WHERE id=j.card_id AND
   (CASE WHEN coalesce((j.manifest->>'preparationOnly')::boolean,false)
    THEN NOT ((enabled AND assistant_enabled) OR assistant_review_enabled)
    ELSE ((enabled AND assistant_enabled) OR assistant_review_enabled) END))
  OR (SELECT count(*) FROM public.academic_lesson_content WHERE course_id=j.card_id)<>j.next_offset
  OR (SELECT count(DISTINCT (s->>'stepId',s->>'locale')) FROM jsonb_array_elements(j.manifest->'scopes') s)<>j.next_offset
  THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(j.manifest->'scopes') WITH ORDINALITY s(scope,ordinal)
  LEFT JOIN public.assistant_auto_attempts a ON a.job_id=j.job_id AND a.scope_offset=s.ordinal-1 AND a.state='done'
  LEFT JOIN public.academic_lesson_content l ON l.course_id=j.card_id AND l.lesson_id=s.scope->>'stepId' AND l.locale=s.scope->>'locale'
  WHERE a.request_id IS NULL OR NOT coalesce(l.approved,false) OR l.source_sha256 IS DISTINCT FROM s.scope->>'sourceSha'
   OR jsonb_array_length(a.receipt->'proofs') IS DISTINCT FROM 1
   OR a.receipt->'proofs'->0->>'stepId' IS DISTINCT FROM l.lesson_id OR a.receipt->'proofs'->0->>'locale' IS DISTINCT FROM l.locale
   OR a.receipt->'proofs'->0->>'sourceSha' IS DISTINCT FROM l.source_sha256
   OR jsonb_array_length(l.payload->'sections') IS DISTINCT FROM jsonb_array_length(a.receipt->'proofs'->0->'chunks'))
  THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.academic_lesson_content l CROSS JOIN (VALUES('ar-EG'),('ar-MSA'),('ar-Gulf'),('en')) lang(locale)
  WHERE l.course_id=j.card_id AND NOT EXISTS(SELECT 1 FROM public.academic_lesson_content other WHERE other.course_id=l.course_id
   AND other.lesson_id=l.lesson_id AND other.locale=lang.locale AND other.approved)) THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_UNAPPROVED'; END IF;
 SELECT sum(jsonb_array_length(payload->'sections')) INTO expected_count FROM public.academic_lesson_content WHERE course_id=j.card_id AND approved;
 IF expected_count<1 OR (SELECT count(*) FROM public.academic_rag_chunks WHERE course_id=j.card_id)<>expected_count
  THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 IF EXISTS(SELECT 1 FROM public.academic_lesson_content l CROSS JOIN LATERAL jsonb_array_elements(l.payload->'sections') s
  LEFT JOIN public.academic_rag_chunks r ON r.course_id=l.course_id AND r.lesson_id=l.lesson_id AND r.locale=l.locale AND r.section_id=s->>'id'
  WHERE l.course_id=j.card_id AND (r.section_id IS NULL OR r.source_sha256 IS DISTINCT FROM l.source_sha256
   OR r.content_version IS DISTINCT FROM coalesce(l.payload->>'version','1.0.0-pilot') OR r.content IS DISTINCT FROM (s->>'title')||E'\n'||(s->>'text')
   OR r.content_sha256 IS DISTINCT FROM encode(extensions.digest(convert_to(r.content,'UTF8'),'sha256'),'hex')
   OR r.embedding_model IS DISTINCT FROM 'text-embedding-3-small' OR r.embedding_dimensions IS DISTINCT FROM 1536
   OR r.embedding IS NULL OR extensions.vector_dims(r.embedding) IS DISTINCT FROM 1536
   OR (extensions.vector_norm(r.embedding) BETWEEN 0.00000000000000000001 AND 10000000000) IS DISTINCT FROM true))
  THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.academic_assistant_policy WHERE course_id=j.card_id)
  THEN RAISE EXCEPTION 'AUTOMATION_POLICY_MISSING'; END IF;
 -- A disabled registered course may have a ready index without granting runtime/access.
 IF coalesce((j.manifest->>'preparationOnly')::boolean,false) THEN RETURN true; END IF;
 UPDATE public.academic_assistant_policy SET runtime_enabled=true WHERE course_id=j.card_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_POLICY_MISSING'; END IF;
 RETURN true;
END $function$
$academic_definition$;
  END IF;
  observed:=md5(pg_get_functiondef(target));
  IF observed=final_md5 THEN CONTINUE; END IF; -- Exact installed final definition: genuine catalog no-op.
  IF observed IS NULL OR NOT (observed=ANY(allowed)) THEN
   RAISE EXCEPTION 'AUTOMATION_PUBLICATION_UNKNOWN_PREIMAGE:%',signature;
  END IF;
  SELECT proowner,proacl INTO prior_owner,prior_acl FROM pg_proc WHERE oid=target;
  EXECUTE final_definition;
  IF to_regprocedure(signature) IS DISTINCT FROM target
   OR md5(pg_get_functiondef(target)) IS DISTINCT FROM final_md5
   OR EXISTS(SELECT 1 FROM pg_proc WHERE oid=target AND
       (proowner IS DISTINCT FROM prior_owner OR proacl IS DISTINCT FROM prior_acl)) THEN
   RAISE EXCEPTION 'AUTOMATION_PUBLICATION_POSTIMAGE_OR_PRIVILEGES_CHANGED:%',signature;
  END IF;
 END LOOP;
END $canonical_publication$;
COMMIT;
