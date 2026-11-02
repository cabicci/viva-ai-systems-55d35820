-- Original project 658adce0-747d-4c8e-90e3-d22225070b94 ONLY.
-- Preserve every validation predicate; materialize descriptor lookup once and bound commit
-- row validation to the existing batch membership predicate. No data/provider/lease writes.
-- A later verified-retirement fence is an accepted immutable downstream postimage.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='60s';
DO $bounded_validation$
DECLARE row_pin text; commit_pin text; item record; prior_oid oid; prior_owner oid; prior_acl aclitem[];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_row_valid(knowledge_chunks,jsonb,text)')
  AND pg_get_userbyid(proowner)='postgres' AND proacl::text='{postgres=X/postgres,service_role=X/postgres}')
 THEN RAISE EXCEPTION 'CURRENT_BOUNDED_IDENTITY_CHANGED:rag_current_row_valid'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)')
  AND pg_get_userbyid(proowner)='postgres' AND proacl::text='{postgres=X/postgres,service_role=X/postgres}')
 THEN RAISE EXCEPTION 'CURRENT_BOUNDED_IDENTITY_CHANGED:rag_current_commit'; END IF;
 SELECT md5(pg_get_functiondef('public.rag_current_row_valid(knowledge_chunks,jsonb,text)'::regprocedure)) INTO row_pin;
 SELECT md5(pg_get_functiondef('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'::regprocedure)) INTO commit_pin;
 IF row_pin='9f61e033e9f0cfc7f6604075b69d9ec1'
  AND commit_pin IN('7281478f1c22cf39c89609cf1c23869e','500beddc2986ceb72c2711e74f202973') THEN RETURN; END IF;
 IF row_pin IS DISTINCT FROM '8ad7d49ac7d8eb01a6b2a2044380f2a1'
  OR commit_pin IS DISTINCT FROM 'ebfe85c84dfbe9037e8a87085b0c82a7'
 THEN RAISE EXCEPTION 'CURRENT_BOUNDED_PREIMAGE_CHANGED'; END IF;
 SELECT oid,proowner,proacl INTO prior_oid,prior_owner,prior_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_row_valid(knowledge_chunks,jsonb,text)');
 EXECUTE $bounded_definition$CREATE OR REPLACE FUNCTION public.rag_current_row_valid(k knowledge_chunks, a jsonb, p_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 WITH expected AS MATERIALIZED (SELECT a->'chunks'->p_id c), pkg AS MATERIALIZED (SELECT c,a->'packages'->(c->>'packageKey') p FROM expected)
 SELECT coalesce(k.source_type='locale_lesson' AND k.source_id=p_id AND NOT k.indexing_failed AND
  k.path_id=p->>'trackId' AND k.module_id=p->>'moduleId' AND k.lesson_id=p->>'lessonId' AND k.locale=p->>'locale' AND
  k.package_path=p->>'packagePath' AND k.package_checksum=p->>'packageChecksum' AND
  k.content_version IS NOT DISTINCT FROM p->>'canonicalVersion' AND k.production_route IS NOT DISTINCT FROM p->>'productionRoute' AND
  k.chunk_checksum=c->>'textChecksum' AND k.title=c->>'sectionHeading' AND
  k.section_index=(c->>'sectionIndex')::integer AND k.section_role=c->>'sectionRole' AND
  k.chunk_position=(c->>'chunkIndex')::integer AND k.content_type=c->>'contentType' AND
  encode(extensions.digest(convert_to(k.content,'UTF8'),'sha256'),'hex')=c->>'textChecksum' AND
  k.embedding IS NOT NULL AND extensions.vector_dims(k.embedding)=1536 AND extensions.vector_norm(k.embedding)>0,false) FROM pkg;
$function$
$bounded_definition$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=prior_oid AND proowner=prior_owner AND proacl IS NOT DISTINCT FROM prior_acl
  AND md5(pg_get_functiondef(oid))='9f61e033e9f0cfc7f6604075b69d9ec1') THEN RAISE EXCEPTION 'CURRENT_BOUNDED_POSTIMAGE_CHANGED:rag_current_row_valid'; END IF;
 SELECT oid,proowner,proacl INTO prior_oid,prior_owner,prior_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)');
 EXECUTE $bounded_definition$CREATE OR REPLACE FUNCTION public.rag_current_commit(p_release_id text, p_execution_id uuid, p_request_id uuid, p_lease_token uuid, p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '60s'
AS $function$
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
 IF EXISTS(WITH batch_rows AS MATERIALIZED (
  SELECT k AS row_data FROM public.knowledge_chunks k WHERE k.index_version=v
   AND k.source_id IN(SELECT jsonb_array_elements_text(b.chunk_ids))
 ) SELECT 1 FROM batch_rows scoped WHERE NOT public.rag_current_row_valid(scoped.row_data,r.approval,(scoped.row_data).source_id)) THEN RAISE EXCEPTION 'CURRENT_STORED_CONTENT_INVALID'; END IF;
 UPDATE public.rag_current_batches SET state='done' WHERE release_id=p_release_id AND ordinal=b.ordinal;
 result:=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows));
 UPDATE public.rag_current_requests SET result=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows),'done',true) WHERE request_id=p_request_id;
 RETURN result;
END $function$
$bounded_definition$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=prior_oid AND proowner=prior_owner AND proacl IS NOT DISTINCT FROM prior_acl
  AND md5(pg_get_functiondef(oid))='7281478f1c22cf39c89609cf1c23869e') THEN RAISE EXCEPTION 'CURRENT_BOUNDED_POSTIMAGE_CHANGED:rag_current_commit'; END IF;
END $bounded_validation$;
COMMIT;
