-- Candidate only: apply with the matching server/runtime release after review.
-- Historical import sessions, locked snapshots, and previous vectors are retained.
BEGIN;
CREATE TABLE public.rag_current_releases (
 release_id text PRIMARY KEY CHECK(release_id ~ '^[a-f0-9]{64}$'),
 execution_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 material text NOT NULL, approval jsonb NOT NULL, previous_version text,
 provider_attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.rag_current_batches (
 release_id text NOT NULL REFERENCES public.rag_current_releases, ordinal integer NOT NULL,
 chunk_ids jsonb NOT NULL, state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','inflight','done')),
 lease_token uuid, lease_until timestamptz, request_id uuid, provider_reserved boolean NOT NULL DEFAULT false,
 PRIMARY KEY(release_id,ordinal)
);
CREATE TABLE public.rag_current_requests (
 request_id uuid PRIMARY KEY, release_id text NOT NULL REFERENCES public.rag_current_releases,
 operation text NOT NULL, result jsonb NOT NULL
);
ALTER TABLE public.rag_current_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_current_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_current_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rag_current_releases, public.rag_current_batches, public.rag_current_requests FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.rag_current_releases, public.rag_current_batches, public.rag_current_requests TO service_role;

CREATE FUNCTION public.rag_current_status(p_release_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; v text; active text; completed integer; total integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id;
 SELECT version_key INTO active FROM public.rag_index_versions WHERE status='active';
 SELECT count(*),count(*) FILTER(WHERE state='done') INTO total,completed FROM public.rag_current_batches WHERE release_id=p_release_id;
 SELECT status INTO v FROM public.rag_index_versions WHERE version_key='rag-current-v1-'||p_release_id;
 RETURN jsonb_build_object('releaseId',p_release_id,'executionId',r.execution_id,'state',v,
  'completedBatches',completed,'totalBatches',total,'providerAttempts',r.provider_attempts,
  'currentActiveVersion',active,'previousVersion',r.previous_version);
END $$;

CREATE FUNCTION public.rag_current_initialize(p_release_id text,p_material text,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a jsonb; result jsonb; n integer;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM pg_advisory_xact_lock(hashtextextended('rag-current-register',0));
 IF p_request_id IS NULL OR p_release_id IS NULL OR p_material IS NULL OR octet_length(p_material)>30000000 OR
  encode(extensions.digest(convert_to(p_material,'UTF8'),'sha256'),'hex') IS DISTINCT FROM p_release_id THEN
  RAISE EXCEPTION 'CURRENT_RELEASE_DIGEST_MISMATCH'; END IF;
 a:=p_material::jsonb;
 IF a->>'schemaVersion' IS DISTINCT FROM 'current-ai-corpus-v1' OR a->>'embeddingModel' IS DISTINCT FROM 'text-embedding-3-small' OR
  a->>'embeddingDimensions' IS DISTINCT FROM '1536' OR jsonb_typeof(a->'packages') IS DISTINCT FROM 'object' OR
  jsonb_typeof(a->'chunks') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CURRENT_RELEASE_INVALID'; END IF;
 SELECT count(*) INTO n FROM jsonb_object_keys(a->'chunks');
 IF n<1 OR n>100000 OR EXISTS(SELECT 1 FROM jsonb_each(a->'chunks') c WHERE
  c.key !~ '^[!-~]+$' OR a->'packages'->(c.value->>'packageKey') IS NULL OR c.value->>'textChecksum' !~ '^[a-f0-9]{64}$')
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_INVALID'; END IF;
 IF EXISTS(SELECT 1 FROM public.rag_current_releases WHERE release_id=p_release_id AND material<>p_material)
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.rag_current_requests WHERE request_id=p_request_id AND (release_id<>p_release_id OR operation<>'initialize'))
  THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rag_current_releases WHERE release_id=p_release_id) THEN
  INSERT INTO public.rag_index_versions(version_key,source_sha,status,package_count,chunk_count,chunk_manifest_checksum,embedding_model)
   VALUES('rag-current-v1-'||p_release_id,p_release_id,'staging',
    (SELECT count(*) FROM jsonb_object_keys(a->'packages')),n,p_release_id,'text-embedding-3-small');
  INSERT INTO public.rag_current_releases(release_id,material,approval) VALUES(p_release_id,p_material,a);
  INSERT INTO public.rag_current_batches(release_id,ordinal,chunk_ids)
   SELECT p_release_id,((i-1)/64)::integer,jsonb_agg(key ORDER BY key COLLATE "C") FROM
    (SELECT key,row_number() OVER(ORDER BY key COLLATE "C") i FROM jsonb_object_keys(a->'chunks') key) x GROUP BY (i-1)/64;
 END IF;
 result:=public.rag_current_status(p_release_id);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'initialize',result) ON CONFLICT DO NOTHING;
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_claim(p_release_id text,p_execution_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; b public.rag_current_batches; old public.rag_current_requests; result jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF p_request_id IS NULL OR r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL
  THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO old FROM public.rag_current_requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF old.release_id<>p_release_id OR old.operation<>'batch' THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
  RETURN old.result||jsonb_build_object('replayed',true);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rag_index_versions WHERE version_key='rag-current-v1-'||p_release_id AND status='staging')
  THEN RAISE EXCEPTION 'CURRENT_NOT_STAGING'; END IF;
 -- Never skip an unexpired lease: one writer/provider request at a time per release.
 IF EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=p_release_id AND state='inflight' AND lease_until>now())
  THEN RAISE EXCEPTION 'CURRENT_BATCH_BUSY'; END IF;
 SELECT * INTO b FROM public.rag_current_batches WHERE release_id=p_release_id AND state<>'done' ORDER BY ordinal LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('done',true); END IF;
 UPDATE public.rag_current_batches SET state='inflight',lease_token=gen_random_uuid(),lease_until=now()+interval '15 minutes',
  request_id=p_request_id,provider_reserved=false WHERE release_id=p_release_id AND ordinal=b.ordinal RETURNING * INTO b;
 result:=jsonb_build_object('leaseToken',b.lease_token,'chunkIds',b.chunk_ids,'ordinal',b.ordinal);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'batch',result);
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_reserve_provider(p_release_id text,p_execution_id uuid,p_request_id uuid,p_lease_token uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; b public.rag_current_batches; budget integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO b FROM public.rag_current_batches WHERE release_id=p_release_id AND lease_token=p_lease_token AND request_id=p_request_id FOR UPDATE;
 IF b.state IS DISTINCT FROM 'inflight' OR b.lease_until<=now() OR b.provider_reserved
  THEN RAISE EXCEPTION 'CURRENT_LEASE_INVALID'; END IF;
 SELECT count(*)+8 INTO budget FROM public.rag_current_batches WHERE release_id=p_release_id;
 IF r.provider_attempts>=budget THEN RAISE EXCEPTION 'CURRENT_PROVIDER_BUDGET'; END IF;
 UPDATE public.rag_current_releases SET provider_attempts=provider_attempts+1 WHERE release_id=p_release_id;
 UPDATE public.rag_current_batches SET provider_reserved=true WHERE release_id=p_release_id AND ordinal=b.ordinal;
 RETURN jsonb_build_object('reserved',true);
END $$;

-- Check the actual stored row, including content bytes and server-owned provenance.
CREATE FUNCTION public.rag_current_row_valid(k public.knowledge_chunks,a jsonb,p_id text) RETURNS boolean
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH expected AS(SELECT a->'chunks'->p_id c), pkg AS(SELECT c,a->'packages'->(c->>'packageKey') p FROM expected)
 SELECT coalesce(k.source_type='locale_lesson' AND k.source_id=p_id AND NOT k.indexing_failed AND
  k.path_id=p->>'trackId' AND k.module_id=p->>'moduleId' AND k.lesson_id=p->>'lessonId' AND k.locale=p->>'locale' AND
  k.package_path=p->>'packagePath' AND k.package_checksum=p->>'packageChecksum' AND
  k.content_version IS NOT DISTINCT FROM p->>'canonicalVersion' AND k.production_route IS NOT DISTINCT FROM p->>'productionRoute' AND
  k.chunk_checksum=c->>'textChecksum' AND k.title=c->>'sectionHeading' AND
  k.section_index=(c->>'sectionIndex')::integer AND k.section_role=c->>'sectionRole' AND
  k.chunk_position=(c->>'chunkIndex')::integer AND k.content_type=c->>'contentType' AND
  encode(extensions.digest(convert_to(k.content,'UTF8'),'sha256'),'hex')=c->>'textChecksum' AND
  k.embedding IS NOT NULL AND extensions.vector_dims(k.embedding)=1536 AND extensions.vector_norm(k.embedding)>0,false) FROM pkg;
$$;

CREATE FUNCTION public.rag_current_commit(p_release_id text,p_execution_id uuid,p_request_id uuid,p_lease_token uuid,p_rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; b public.rag_current_batches; item jsonb; c jsonb; p jsonb; result jsonb; v text;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO b FROM public.rag_current_batches WHERE release_id=p_release_id AND lease_token=p_lease_token AND request_id=p_request_id FOR UPDATE;
 IF b.state='done' THEN RETURN jsonb_build_object('done',true,'replayed',true); END IF;
 IF b.state IS DISTINCT FROM 'inflight' OR b.lease_until<=now() OR NOT EXISTS(SELECT 1 FROM public.rag_index_versions
  WHERE version_key='rag-current-v1-'||p_release_id AND status='staging') THEN RAISE EXCEPTION 'CURRENT_LEASE_INVALID'; END IF;
 IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rows)<>jsonb_array_length(b.chunk_ids) OR
  (SELECT jsonb_agg(x->>'chunkId' ORDER BY x->>'chunkId' COLLATE "C") FROM jsonb_array_elements(p_rows) x) IS DISTINCT FROM b.chunk_ids
  THEN RAISE EXCEPTION 'CURRENT_BATCH_CONTENT_MISMATCH'; END IF;
 v:='rag-current-v1-'||p_release_id;
 FOR item IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  c:=r.approval->'chunks'->(item->>'chunkId'); p:=r.approval->'packages'->(c->>'packageKey');
  INSERT INTO public.knowledge_chunks(source_type,source_id,path_id,module_id,lesson_id,title,content,metadata,embedding,
   locale,package_path,source_sha,package_checksum,chunk_checksum,content_version,index_version,index_state,
   section_index,section_role,chunk_position,content_type,production_route,indexing_failed)
  VALUES('locale_lesson',item->>'chunkId',p->>'trackId',p->>'moduleId',p->>'lessonId',c->>'sectionHeading',item->>'content',
   jsonb_build_object('currentReleaseId',p_release_id),(item->'embedding')::text::extensions.vector,
   p->>'locale',p->>'packagePath',p_release_id,p->>'packageChecksum',c->>'textChecksum',p->>'canonicalVersion',v,'staging',
   (c->>'sectionIndex')::integer,c->>'sectionRole',(c->>'chunkIndex')::integer,c->>'contentType',p->>'productionRoute',false);
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.knowledge_chunks k WHERE k.index_version=v AND k.source_id IN(SELECT jsonb_array_elements_text(b.chunk_ids))
  AND NOT public.rag_current_row_valid(k,r.approval,k.source_id)) THEN RAISE EXCEPTION 'CURRENT_STORED_CONTENT_INVALID'; END IF;
 UPDATE public.rag_current_batches SET state='done' WHERE release_id=p_release_id AND ordinal=b.ordinal;
 result:=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows));
 UPDATE public.rag_current_requests SET result=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows),'done',true) WHERE request_id=p_request_id;
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_fail(p_release_id text,p_execution_id uuid,p_request_id uuid,p_lease_token uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM 1 FROM public.rag_current_releases WHERE release_id=p_release_id AND execution_id=p_execution_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 UPDATE public.rag_current_batches SET state='pending',lease_until=NULL WHERE release_id=p_release_id AND request_id=p_request_id
  AND lease_token=p_lease_token AND state='inflight';
 -- Keep the request permanently consumed even if the provider response was lost.
 RETURN jsonb_build_object('recorded',true);
END $$;

CREATE FUNCTION public.rag_current_activate(p_release_id text,p_execution_id uuid,p_request_id uuid,p_expected_active text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; v text; active text; target public.rag_index_versions; result jsonb; old public.rag_current_requests;
BEGIN
 PERFORM public.rag_require_service_role();
 -- Share a table lock with all historical activation/rollback implementations.
 LOCK TABLE public.rag_index_versions IN EXCLUSIVE MODE;
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF p_request_id IS NULL OR r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO old FROM public.rag_current_requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF old.release_id<>p_release_id OR old.operation<>'activate' THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
  RETURN old.result||jsonb_build_object('replayed',true);
 END IF;
 SELECT version_key INTO active FROM public.rag_index_versions WHERE status='active';
 IF active IS DISTINCT FROM p_expected_active THEN RAISE EXCEPTION 'CURRENT_ACTIVE_CHANGED'; END IF;
 v:='rag-current-v1-'||p_release_id;
 SELECT * INTO target FROM public.rag_index_versions WHERE version_key=v;
 IF target.status NOT IN('staging','superseded') OR target.status IS NULL OR active=v OR target.source_sha<>p_release_id OR
  target.chunk_manifest_checksum<>p_release_id OR target.embedding_model<>'text-embedding-3-small' OR
  target.package_count<>(SELECT count(*) FROM jsonb_object_keys(r.approval->'packages')) OR
  target.chunk_count<>(SELECT count(*) FROM jsonb_object_keys(r.approval->'chunks')) OR
  EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=p_release_id AND state<>'done') OR
  (SELECT count(*) FROM public.knowledge_chunks WHERE index_version=v)<>target.chunk_count OR
  EXISTS(SELECT 1 FROM public.knowledge_chunks k WHERE k.index_version=v AND
   (k.source_sha IS DISTINCT FROM p_release_id OR k.index_state IS DISTINCT FROM target.status OR NOT public.rag_current_row_valid(k,r.approval,k.source_id)))
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_INCOMPLETE'; END IF;
 UPDATE public.rag_current_releases SET previous_version=active WHERE release_id=p_release_id;
 UPDATE public.rag_index_versions SET status='superseded',superseded_at=now() WHERE version_key=active;
 UPDATE public.knowledge_chunks SET index_state='superseded' WHERE index_version=active AND source_type='locale_lesson';
 UPDATE public.rag_index_versions SET status='active',activated_at=now() WHERE version_key=v;
 UPDATE public.knowledge_chunks SET index_state='active' WHERE index_version=v AND source_type='locale_lesson';
 result:=jsonb_build_object('activated',true,'version',v,'previousVersion',active);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'activate',result);
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_rollback(p_release_id text,p_execution_id uuid,p_request_id uuid,p_expected_active text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; active text; prior public.rag_index_versions; result jsonb; old public.rag_current_requests;
BEGIN
 PERFORM public.rag_require_service_role();
 LOCK TABLE public.rag_index_versions IN EXCLUSIVE MODE;
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF p_request_id IS NULL OR r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO old FROM public.rag_current_requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF old.release_id<>p_release_id OR old.operation<>'rollback' THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
  RETURN old.result||jsonb_build_object('replayed',true);
 END IF;
 SELECT version_key INTO active FROM public.rag_index_versions WHERE status='active';
 IF active IS DISTINCT FROM p_expected_active OR active IS DISTINCT FROM 'rag-current-v1-'||p_release_id THEN RAISE EXCEPTION 'CURRENT_ACTIVE_CHANGED'; END IF;
 SELECT * INTO prior FROM public.rag_index_versions WHERE version_key=r.previous_version;
 IF prior.status IS DISTINCT FROM 'superseded' OR prior.chunk_count<1 OR prior.embedding_model IS DISTINCT FROM 'text-embedding-3-small' OR
  (SELECT count(*) FROM public.knowledge_chunks WHERE index_version=prior.version_key AND source_type='locale_lesson')<>prior.chunk_count OR
  EXISTS(SELECT 1 FROM public.knowledge_chunks k WHERE k.index_version=prior.version_key AND
   (k.index_state IS DISTINCT FROM 'superseded' OR k.source_sha IS DISTINCT FROM prior.source_sha OR k.indexing_failed OR
    k.embedding IS NULL OR extensions.vector_dims(k.embedding)<>1536 OR extensions.vector_norm(k.embedding)<=0))
  THEN RAISE EXCEPTION 'CURRENT_ROLLBACK_UNAVAILABLE'; END IF;
 UPDATE public.rag_index_versions SET status='superseded',superseded_at=now() WHERE version_key=active;
 UPDATE public.knowledge_chunks SET index_state='superseded' WHERE index_version=active AND source_type='locale_lesson';
 UPDATE public.rag_index_versions SET status='active',activated_at=now() WHERE version_key=prior.version_key;
 UPDATE public.knowledge_chunks SET index_state='active' WHERE index_version=prior.version_key AND source_type='locale_lesson';
 result:=jsonb_build_object('rolledBack',true,'version',prior.version_key);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'rollback',result);
 RETURN result;
END $$;

-- Bounded owner operations can exceed the API role's default 8 seconds while
-- writing vectors or atomically validating/swapping complete index versions.
-- Keep the exception on these service-only functions; do not change role or
-- database timeouts, provider budgets, leases, or content/provenance checks.
ALTER FUNCTION public.rag_current_commit(text,uuid,uuid,uuid,jsonb) SET statement_timeout TO '60s';
ALTER FUNCTION public.rag_current_activate(text,uuid,uuid,text) SET statement_timeout TO '60s';
ALTER FUNCTION public.rag_current_rollback(text,uuid,uuid,text) SET statement_timeout TO '60s';

DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname LIKE 'rag_current_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
COMMIT;
