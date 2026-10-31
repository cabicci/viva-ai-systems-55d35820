-- REVIEW CANDIDATE ONLY. ONE atomic DO, not an automatic migration.
-- ROOT confirms the isolated target, genuine operator authority and quiescence.
-- No data, lease, source, price, role, provider or timeout policy is changed.
DO $validation_apply$
DECLARE metadata_before jsonb; metadata_after jsonb;
BEGIN
 PERFORM set_config('lock_timeout','3s',true);
 LOCK TABLE public.rag_index_versions,public.rag_current_releases IN EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM public.rag_current_batches WHERE state='inflight') OR
    EXISTS(SELECT 1 FROM public.assistant_auto_jobs WHERE state='running')
 THEN RAISE EXCEPTION 'CURRENT_VALIDATION_NOT_QUIESCENT'; END IF;
 IF EXISTS(SELECT 1 FROM (VALUES (to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'),'31738b367781e90282c12de020a4a59d'),(to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)'),'cefbcca05f7f656ad8c1704ef88dc1d3'),(to_regprocedure('public.rag_current_rollback(text,uuid,uuid,text)'),'32df532e1b1f719375902ed7f4fe57fb')) expected(oid,hash)
  LEFT JOIN pg_proc p ON p.oid=expected.oid
  WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\r\n',E'\n')) IS DISTINCT FROM expected.hash
   OR NOT p.prosecdef OR p.proconfig IS DISTINCT FROM ARRAY['search_path=""','statement_timeout=60s'])
 OR NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_row_valid(public.knowledge_chunks,jsonb,text)')
  AND md5(replace(prosrc,E'\r\n',E'\n'))='2d63818c1eba8aaa68dc6385bde5f527')
 THEN RAISE EXCEPTION 'CURRENT_VALIDATION_DEFINITION_CHANGED'; END IF;
 SELECT jsonb_agg(to_jsonb(p)-'prosrc' ORDER BY p.oid) INTO metadata_before FROM pg_proc p
 WHERE p.oid IN(to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'),to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)'),to_regprocedure('public.rag_current_rollback(text,uuid,uuid,text)'));
 EXECUTE $function_definition$CREATE OR REPLACE FUNCTION public.rag_current_commit(p_release_id text,p_execution_id uuid,p_request_id uuid,p_lease_token uuid,p_rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='60s' AS $$
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
 IF EXISTS(WITH ids AS MATERIALIZED (SELECT jsonb_array_elements_text(b.chunk_ids) AS id),
   selected AS MATERIALIZED (
    SELECT k.* FROM public.knowledge_chunks k JOIN ids ON ids.id=k.source_id WHERE k.index_version=v
   ), chunks AS MATERIALIZED (
    SELECT j.key AS id,j.value AS c FROM jsonb_each(
     CASE WHEN jsonb_typeof(r.approval->'chunks')='object' THEN r.approval->'chunks' ELSE '{}'::jsonb END) j JOIN ids ON ids.id=j.key
   ), packages AS MATERIALIZED (
    SELECT j.key AS package_key,j.value AS p FROM jsonb_each(
     CASE WHEN jsonb_typeof(r.approval->'packages')='object' THEN r.approval->'packages' ELSE '{}'::jsonb END) j
   ), expected AS MATERIALIZED (
    SELECT c.id,c.c,p.p FROM chunks c LEFT JOIN packages p ON p.package_key=c.c->>'packageKey'
   )
   SELECT 1 FROM selected k LEFT JOIN expected e ON e.id=k.source_id
   WHERE NOT coalesce(k.source_type='locale_lesson' AND k.source_id=e.id AND NOT k.indexing_failed AND
  k.path_id=e.p->>'trackId' AND k.module_id=e.p->>'moduleId' AND k.lesson_id=e.p->>'lessonId' AND k.locale=e.p->>'locale' AND
  k.package_path=e.p->>'packagePath' AND k.package_checksum=e.p->>'packageChecksum' AND
  k.content_version IS NOT DISTINCT FROM e.p->>'canonicalVersion' AND k.production_route IS NOT DISTINCT FROM e.p->>'productionRoute' AND
  k.chunk_checksum=e.c->>'textChecksum' AND k.title=e.c->>'sectionHeading' AND
  k.section_index=(e.c->>'sectionIndex')::integer AND k.section_role=e.c->>'sectionRole' AND
  k.chunk_position=(e.c->>'chunkIndex')::integer AND k.content_type=e.c->>'contentType' AND
  encode(extensions.digest(convert_to(k.content,'UTF8'),'sha256'),'hex')=e.c->>'textChecksum' AND
  k.embedding IS NOT NULL AND extensions.vector_dims(k.embedding)=1536 AND extensions.vector_norm(k.embedding)>0,false)) THEN RAISE EXCEPTION 'CURRENT_STORED_CONTENT_INVALID'; END IF;
 UPDATE public.rag_current_batches SET state='done' WHERE release_id=p_release_id AND ordinal=b.ordinal;
 result:=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows));
 UPDATE public.rag_current_requests SET result=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows),'done',true) WHERE request_id=p_request_id;
 RETURN result;
END $$;$function_definition$;
 EXECUTE $function_definition$CREATE OR REPLACE FUNCTION public.rag_current_activate(p_release_id text,p_execution_id uuid,p_request_id uuid,p_expected_active text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='60s' AS $$
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
  EXISTS(WITH selected AS MATERIALIZED (
    SELECT k.* FROM public.knowledge_chunks k WHERE k.index_version=v
   ), chunks AS MATERIALIZED (
    SELECT j.key AS id,j.value AS c FROM jsonb_each(
     CASE WHEN jsonb_typeof(r.approval->'chunks')='object' THEN r.approval->'chunks' ELSE '{}'::jsonb END) j
   ), packages AS MATERIALIZED (
    SELECT j.key AS package_key,j.value AS p FROM jsonb_each(
     CASE WHEN jsonb_typeof(r.approval->'packages')='object' THEN r.approval->'packages' ELSE '{}'::jsonb END) j
   ), expected AS MATERIALIZED (
    SELECT c.id,c.c,p.p FROM chunks c LEFT JOIN packages p ON p.package_key=c.c->>'packageKey'
   )
   SELECT 1 FROM selected k LEFT JOIN expected e ON e.id=k.source_id
   WHERE (k.source_sha IS DISTINCT FROM p_release_id OR k.index_state IS DISTINCT FROM target.status OR NOT coalesce(k.source_type='locale_lesson' AND k.source_id=e.id AND NOT k.indexing_failed AND
  k.path_id=e.p->>'trackId' AND k.module_id=e.p->>'moduleId' AND k.lesson_id=e.p->>'lessonId' AND k.locale=e.p->>'locale' AND
  k.package_path=e.p->>'packagePath' AND k.package_checksum=e.p->>'packageChecksum' AND
  k.content_version IS NOT DISTINCT FROM e.p->>'canonicalVersion' AND k.production_route IS NOT DISTINCT FROM e.p->>'productionRoute' AND
  k.chunk_checksum=e.c->>'textChecksum' AND k.title=e.c->>'sectionHeading' AND
  k.section_index=(e.c->>'sectionIndex')::integer AND k.section_role=e.c->>'sectionRole' AND
  k.chunk_position=(e.c->>'chunkIndex')::integer AND k.content_type=e.c->>'contentType' AND
  encode(extensions.digest(convert_to(k.content,'UTF8'),'sha256'),'hex')=e.c->>'textChecksum' AND
  k.embedding IS NOT NULL AND extensions.vector_dims(k.embedding)=1536 AND extensions.vector_norm(k.embedding)>0,false)))
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_INCOMPLETE'; END IF;
 UPDATE public.rag_current_releases SET previous_version=active WHERE release_id=p_release_id;
 UPDATE public.rag_index_versions SET status='superseded',superseded_at=now() WHERE version_key=active;
 UPDATE public.knowledge_chunks SET index_state='superseded' WHERE index_version=active AND source_type='locale_lesson';
 UPDATE public.rag_index_versions SET status='active',activated_at=now() WHERE version_key=v;
 UPDATE public.knowledge_chunks SET index_state='active' WHERE index_version=v AND source_type='locale_lesson';
 result:=jsonb_build_object('activated',true,'version',v,'previousVersion',active);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'activate',result);
 RETURN result;
END $$;$function_definition$;
 EXECUTE $function_definition$CREATE OR REPLACE FUNCTION public.rag_current_rollback(p_release_id text,p_execution_id uuid,p_request_id uuid,p_expected_active text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='60s' AS $$
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
  EXISTS(WITH selected AS MATERIALIZED (
    SELECT k.* FROM public.knowledge_chunks k WHERE k.index_version=prior.version_key
   ) SELECT 1 FROM selected k WHERE
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
END $$;$function_definition$;
 SELECT jsonb_agg(to_jsonb(p)-'prosrc' ORDER BY p.oid) INTO metadata_after FROM pg_proc p
 WHERE p.oid IN(to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'),to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)'),to_regprocedure('public.rag_current_rollback(text,uuid,uuid,text)'));
 IF metadata_after IS DISTINCT FROM metadata_before OR
 EXISTS(SELECT 1 FROM (VALUES (to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'),'cb5933695906a221ed06a9c24a5ec866'),(to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)'),'b3e4d06782326c5582ae9d125b356452'),(to_regprocedure('public.rag_current_rollback(text,uuid,uuid,text)'),'72e42d25189d3ef129834baa72f6d6a6')) expected(oid,hash) LEFT JOIN pg_proc p ON p.oid=expected.oid
  WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\r\n',E'\n')) IS DISTINCT FROM expected.hash)
 THEN RAISE EXCEPTION 'CURRENT_VALIDATION_POSTCHECK_FAILED'; END IF;
END $validation_apply$;
