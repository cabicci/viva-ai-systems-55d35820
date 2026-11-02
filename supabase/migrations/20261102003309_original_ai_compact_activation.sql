-- Original project 658adce0-747d-4c8e-90e3-d22225070b94 ONLY.
-- Reuse the same pinned row validator with equivalent compact descriptor/package maps.
-- Only the full validation EXISTS changes; locks, checks, atomic state UPDATEs and receipt stay exact.
-- A later verified-retirement fence is a recognized immutable downstream postimage.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='60s';
DO $compact_activation$
DECLARE observed text; commit_pin text; prior_oid oid; prior_owner oid; prior_acl aclitem[];
BEGIN
 IF md5(pg_get_functiondef('public.rag_current_row_valid(public.knowledge_chunks,jsonb,text)'::regprocedure))
  IS DISTINCT FROM '9f61e033e9f0cfc7f6604075b69d9ec1' THEN RAISE EXCEPTION 'CURRENT_COMPACT_ROW_VALIDATOR_CHANGED'; END IF;
 SELECT oid,proowner,proacl,md5(pg_get_functiondef(oid)) INTO prior_oid,prior_owner,prior_acl,observed
 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)');
 IF prior_oid IS NULL OR pg_get_userbyid(prior_owner)<>'postgres'
  OR prior_acl::text IS DISTINCT FROM '{postgres=X/postgres,service_role=X/postgres}'
 THEN RAISE EXCEPTION 'CURRENT_COMPACT_ACTIVATION_IDENTITY_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'::regprocedure)) INTO commit_pin;
 IF (observed='f12eec86886cefd4b9cea5a141def579' AND commit_pin='7281478f1c22cf39c89609cf1c23869e')
  OR (observed='4279a0e0466966bde12c16e0b488ab69' AND commit_pin='500beddc2986ceb72c2711e74f202973') THEN RETURN; END IF;
 IF observed IS DISTINCT FROM 'e6ed37c096ce632aa769ae3c88f7802c'
  OR commit_pin IS DISTINCT FROM '7281478f1c22cf39c89609cf1c23869e'
 THEN RAISE EXCEPTION 'CURRENT_COMPACT_ACTIVATION_PREIMAGE_CHANGED'; END IF;
 EXECUTE $compact_activation_definition$CREATE OR REPLACE FUNCTION public.rag_current_activate(p_release_id text, p_execution_id uuid, p_request_id uuid, p_expected_active text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '60s'
AS $function$
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
  EXISTS(WITH descriptors AS MATERIALIZED (
   SELECT d.key AS id,d.value AS chunk FROM jsonb_each(CASE WHEN jsonb_typeof(r.approval->'chunks')='object' THEN r.approval->'chunks' ELSE '{}'::jsonb END) d
  ), packages AS MATERIALIZED (
   SELECT p.key AS id,p.value AS package FROM jsonb_each(CASE WHEN jsonb_typeof(r.approval->'packages')='object' THEN r.approval->'packages' ELSE '{}'::jsonb END) p
  ) SELECT 1 FROM public.knowledge_chunks k
  LEFT JOIN descriptors d ON d.id=k.source_id
  LEFT JOIN packages p ON p.id=d.chunk->>'packageKey'
  WHERE k.index_version=v AND
   (k.source_sha IS DISTINCT FROM p_release_id OR k.index_state IS DISTINCT FROM target.status OR NOT
    CASE WHEN d.id IS NULL OR p.id IS NULL OR d.chunk->>'packageKey' IS NULL THEN false ELSE
     public.rag_current_row_valid(k,jsonb_build_object('chunks',jsonb_build_object(k.source_id,d.chunk),
      'packages',jsonb_build_object(d.chunk->>'packageKey',p.package)),k.source_id) END))
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_INCOMPLETE'; END IF;
 UPDATE public.rag_current_releases SET previous_version=active WHERE release_id=p_release_id;
 UPDATE public.rag_index_versions SET status='superseded',superseded_at=now() WHERE version_key=active;
 UPDATE public.knowledge_chunks SET index_state='superseded' WHERE index_version=active AND source_type='locale_lesson';
 UPDATE public.rag_index_versions SET status='active',activated_at=now() WHERE version_key=v;
 UPDATE public.knowledge_chunks SET index_state='active' WHERE index_version=v AND source_type='locale_lesson';
 result:=jsonb_build_object('activated',true,'version',v,'previousVersion',active);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'activate',result);
 RETURN result;
END $function$
$compact_activation_definition$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=prior_oid AND proowner=prior_owner AND proacl IS NOT DISTINCT FROM prior_acl
  AND md5(pg_get_functiondef(oid))='f12eec86886cefd4b9cea5a141def579')
 THEN RAISE EXCEPTION 'CURRENT_COMPACT_ACTIVATION_POSTIMAGE_CHANGED'; END IF;
END $compact_activation$;
COMMIT;
