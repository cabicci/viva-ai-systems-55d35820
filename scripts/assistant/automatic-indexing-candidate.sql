-- Reviewed installation candidate. Disabled until explicit owner activation.
-- No provider calls, content imports, subscription grants or learner writes.
BEGIN;
CREATE TABLE public.assistant_auto_policy (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), enabled boolean NOT NULL DEFAULT false,
 excluded_cards jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(excluded_cards)='array'));
INSERT INTO public.assistant_auto_policy(singleton) VALUES(true);
CREATE TABLE public.assistant_auto_jobs (
 job_id text PRIMARY KEY CHECK(job_id ~ '^[a-f0-9]{64}$'), area text NOT NULL CHECK(area IN ('ai','kids','technical','academic')),
 card_id text NOT NULL, material text NOT NULL, manifest jsonb NOT NULL,
 scope_count integer NOT NULL CHECK(scope_count BETWEEN 1 AND 20001), next_offset integer NOT NULL DEFAULT 0,
 state text NOT NULL CHECK(state IN ('queued','running','complete','held')),
 request_id uuid,lease_token uuid,lease_until timestamptz, provider_calls integer NOT NULL DEFAULT 0,
 error_code text,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.assistant_auto_attempts (
 request_id uuid PRIMARY KEY,job_id text NOT NULL REFERENCES public.assistant_auto_jobs,
 scope_offset integer NOT NULL, state text NOT NULL CHECK(state IN ('running','done','held')),
 provider_reserved boolean NOT NULL DEFAULT false,receipt jsonb,
 created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX assistant_auto_done_scope ON public.assistant_auto_attempts(job_id,scope_offset) WHERE state='done';
CREATE INDEX assistant_auto_pending ON public.assistant_auto_jobs(created_at,job_id) WHERE state='queued';
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['assistant_auto_policy','assistant_auto_jobs','assistant_auto_attempts'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;

CREATE FUNCTION public.assistant_auto_register(p_jobs jsonb,p_registry jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item jsonb; card jsonb; step jsonb; m jsonb; s public.card_assistant_steps;
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_jobs) IS DISTINCT FROM 'array' OR jsonb_array_length(p_jobs)>200
  OR jsonb_typeof(p_registry) IS DISTINCT FROM 'array' OR jsonb_array_length(p_registry)>200 THEN
  RAISE EXCEPTION 'AUTOMATION_SCOPE_LIMIT'; END IF;
 -- Registration is derived from deployed source code, never request-body cards.
 FOR card IN SELECT value FROM jsonb_array_elements(p_registry) LOOP
  IF card->>'area' NOT IN ('kids','technical') OR card->>'id' !~ '^[a-z0-9-]{1,80}$'
   OR jsonb_typeof(card->'steps') IS DISTINCT FROM 'array' OR jsonb_array_length(card->'steps') NOT BETWEEN 1 AND 1000
   THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_INVALID'; END IF;
  INSERT INTO public.card_assistant_policy(area,card_id) VALUES(card->>'area',card->>'id') ON CONFLICT DO NOTHING;
  FOR step IN SELECT value FROM jsonb_array_elements(card->'steps') LOOP
   INSERT INTO public.card_assistant_steps(area,card_id,step_id,station_id,source_key,preview,kids_level,kids_lesson,technical_lesson)
   VALUES(card->>'area',card->>'id',step->>'id',step->>'stationId',
    CASE WHEN card->>'area'='kids' THEN step->'source'->>'levelId'||':'||(step->'source'->>'lessonNumber') ELSE step->'source'->>'lessonId' END,
    (step->>'preview')::boolean,step->'source'->>'levelId',(step->'source'->>'lessonNumber')::integer,step->'source'->>'lessonId')
   ON CONFLICT(area,card_id,step_id) DO NOTHING;
   SELECT * INTO s FROM public.card_assistant_steps WHERE area=card->>'area' AND card_id=card->>'id' AND step_id=step->>'id';
   IF s.station_id IS DISTINCT FROM step->>'stationId' OR s.preview IS DISTINCT FROM (step->>'preview')::boolean
    OR s.kids_level IS DISTINCT FROM step->'source'->>'levelId' OR s.kids_lesson IS DISTINCT FROM (step->'source'->>'lessonNumber')::integer
    OR s.technical_lesson IS DISTINCT FROM step->'source'->>'lessonId' THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_CHANGED'; END IF;
  END LOOP;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
  IF octet_length(item->>'material')>3000000 OR encode(extensions.digest(convert_to(item->>'material','UTF8'),'sha256'),'hex') IS DISTINCT FROM item->>'key'
   THEN RAISE EXCEPTION 'AUTOMATION_MANIFEST_INVALID'; END IF;
  m:=(item->>'material')::jsonb;
  IF m->>'schemaVersion' IS DISTINCT FROM 'assistant-auto-v1' OR m->>'area' NOT IN ('ai','kids','technical','academic')
   OR m->>'cardId' !~ '^[A-Za-z0-9-]{1,80}$' OR (m->>'scopeCount')::integer NOT BETWEEN 1 AND 20001
   OR jsonb_typeof(m->'scopes') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'AUTOMATION_MANIFEST_INVALID'; END IF;
  INSERT INTO public.assistant_auto_jobs(job_id,area,card_id,material,manifest,scope_count,state,error_code)
  VALUES(item->>'key',m->>'area',m->>'cardId',item->>'material',m,(m->>'scopeCount')::integer,
   CASE WHEN m->>'issue' IS NULL THEN 'queued' ELSE 'held' END,m->>'issue') ON CONFLICT DO NOTHING;
 END LOOP;
 RETURN jsonb_build_object('registered',jsonb_array_length(p_jobs));
END $$;

CREATE FUNCTION public.assistant_auto_check(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 RETURN EXISTS(SELECT 1 FROM public.assistant_auto_jobs j CROSS JOIN public.assistant_auto_policy p WHERE p.enabled
  AND NOT(p.excluded_cards ? (j.area||':'||j.card_id)) AND j.job_id=p_job AND j.state='running'
  AND j.request_id=p_request AND j.lease_token=p_lease AND j.lease_until>now());
END $$;

CREATE FUNCTION public.assistant_auto_claim(p_keys jsonb,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs; old public.assistant_auto_attempts;
BEGIN
 PERFORM public.rag_require_service_role();
 IF p_request IS NULL OR jsonb_typeof(p_keys) IS DISTINCT FROM 'array' OR jsonb_array_length(p_keys)>200 THEN RAISE EXCEPTION 'AUTOMATION_REQUEST_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('assistant-auto-one-worker',0));
 IF NOT EXISTS(SELECT 1 FROM public.assistant_auto_policy WHERE enabled) THEN RETURN jsonb_build_object('disabled',true); END IF;
 SELECT * INTO old FROM public.assistant_auto_attempts WHERE request_id=p_request;
 IF FOUND THEN RETURN jsonb_build_object('replayed',true,'state',old.state); END IF;
 -- Never replay expired/uncertain paid attempts. A later scheduled run holds them.
 UPDATE public.assistant_auto_attempts a SET state='held' FROM public.assistant_auto_jobs queued
  WHERE a.request_id=queued.request_id AND queued.state='running' AND queued.lease_until<=now();
 UPDATE public.assistant_auto_jobs SET state='held',error_code='AUTOMATION_UNCERTAIN_REQUEST' WHERE state='running' AND lease_until<=now();
 -- A source/build revision must not evade an uncertain paid request on this
 -- card. Preserve that hold across manifest revisions until operator review.
 UPDATE public.assistant_auto_jobs candidate SET state='held',error_code='AUTOMATION_PRIOR_REQUEST_NEEDS_REVIEW'
  WHERE candidate.state='queued' AND candidate.job_id IN(SELECT jsonb_array_elements_text(p_keys))
  AND EXISTS(SELECT 1 FROM public.assistant_auto_jobs prior JOIN public.assistant_auto_attempts a ON a.request_id=prior.request_id
   WHERE prior.area=candidate.area AND prior.card_id=candidate.card_id AND prior.state='held' AND a.provider_reserved);
 IF EXISTS(SELECT 1 FROM public.assistant_auto_jobs queued LEFT JOIN public.assistant_auto_attempts a ON a.request_id=queued.request_id
  WHERE queued.lease_until>now() AND (queued.state='running' OR (queued.state='held' AND a.provider_reserved)))
  OR EXISTS(SELECT 1 FROM public.rag_current_batches WHERE state='inflight' AND lease_until>now())
  THEN RETURN jsonb_build_object('busy',true); END IF;
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE state='queued' AND job_id IN(SELECT jsonb_array_elements_text(p_keys))
  AND NOT EXISTS(SELECT 1 FROM public.assistant_auto_policy p WHERE p.excluded_cards ? (area||':'||card_id)) ORDER BY created_at,job_id LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('done',true,'held',(SELECT count(*) FROM public.assistant_auto_jobs WHERE state='held' AND job_id IN(SELECT jsonb_array_elements_text(p_keys)))); END IF;
 UPDATE public.assistant_auto_jobs SET state='running',request_id=p_request,lease_token=gen_random_uuid(),lease_until=now()+interval '15 minutes'
  WHERE job_id=j.job_id RETURNING * INTO j;
 INSERT INTO public.assistant_auto_attempts(request_id,job_id,scope_offset,state) VALUES(p_request,j.job_id,j.next_offset,'running');
 RETURN jsonb_build_object('claimed',true,'jobId',j.job_id,'requestId',p_request,'leaseToken',j.lease_token,'offset',j.next_offset,'manifest',j.manifest);
END $$;

CREATE FUNCTION public.assistant_auto_reserve(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM 1 FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) THEN RAISE EXCEPTION 'AUTOMATION_LEASE_UNAVAILABLE'; END IF;
 IF EXISTS(SELECT 1 FROM public.assistant_auto_jobs WHERE job_id=p_job AND provider_calls>=scope_count) THEN RAISE EXCEPTION 'AUTOMATION_PROVIDER_BUDGET'; END IF;
 UPDATE public.assistant_auto_attempts SET provider_reserved=true WHERE request_id=p_request AND job_id=p_job AND state='running' AND NOT provider_reserved;
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_PROVIDER_ALREADY_RESERVED'; END IF;
 UPDATE public.assistant_auto_jobs SET provider_calls=provider_calls+1 WHERE job_id=p_job;
 RETURN true;
END $$;

CREATE FUNCTION public.assistant_auto_finish(p_job text,p_request uuid,p_lease uuid,p_done boolean,p_receipt jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) OR p_done IS DISTINCT FROM (j.next_offset+1=j.scope_count)
  OR jsonb_typeof(p_receipt) IS DISTINCT FROM 'object' OR octet_length(p_receipt::text)>100000 THEN RAISE EXCEPTION 'AUTOMATION_RECEIPT_INVALID'; END IF;
 UPDATE public.assistant_auto_attempts SET state='done',receipt=p_receipt WHERE request_id=p_request AND job_id=p_job AND state='running';
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_REQUEST_INVALID'; END IF;
 UPDATE public.assistant_auto_jobs SET next_offset=next_offset+1,state=CASE WHEN p_done THEN 'complete' ELSE 'queued' END,lease_until=NULL WHERE job_id=p_job;
 RETURN true;
END $$;

CREATE FUNCTION public.assistant_auto_hold(p_job text,p_request uuid,p_lease uuid,p_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 UPDATE public.assistant_auto_jobs SET state='held',error_code=CASE WHEN p_code ~ '^AUTOMATION_[A-Z0-9_]{1,64}$' THEN p_code ELSE 'AUTOMATION_OPERATION_UNAVAILABLE' END
  WHERE job_id=p_job AND request_id=p_request AND lease_token=p_lease AND state='running';
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.assistant_auto_attempts SET state='held' WHERE request_id=p_request AND job_id=p_job AND state='running';
 RETURN true;
END $$;

CREATE FUNCTION public.assistant_auto_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 RETURN jsonb_build_object('schemaVersion','assistant-auto-v1','enabled',(SELECT enabled FROM public.assistant_auto_policy));
END $$;

CREATE FUNCTION public.assistant_auto_ai_clear(p_release text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 RETURN NOT EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=p_release AND state<>'done'
  AND (state='inflight' OR provider_reserved));
END $$;

DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname LIKE 'assistant_auto_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
COMMIT;
