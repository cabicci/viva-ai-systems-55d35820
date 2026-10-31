-- Additive, nonproduction installation candidate. Install AFTER the existing
-- automatic indexing/publication candidates. No worker/policy is enabled here.
-- This is a metadata outbox into the EXISTING queue, not another index engine.
BEGIN;
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
COMMIT;
