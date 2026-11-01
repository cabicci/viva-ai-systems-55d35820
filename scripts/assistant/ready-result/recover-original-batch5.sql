-- PREPARED ONLY: exact optimized definitions reviewed; await migration/recovery test reports before use.
-- Owner-authorized one-time recovery of an expired DB-only ready-vector transfer.
-- No provider was reserved/called. Original request stays unchanged. No legacy mutation.
-- RUN ONCE only after the private checkpoint records new request b9e60db6... as recoveryPending.
-- Any missing/unknown result: read the exact new request; never blindly repeat this transaction.
BEGIN;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';
SET LOCAL timezone='UTC';
SET LOCAL ROLE service_role;
DO $recover$
DECLARE
 target constant text := '0c0f31b61c596fd6b8687bb156911f8d28613581af0fcf5f7ac4063dce3c1b85';
 legacy constant text := '11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5';
 execution constant uuid := '6773665d-76b3-49cc-977b-26418f78cad3';
 prior_request constant uuid := 'f6214b00-99f5-4cbf-a3b9-08354984ec4e';
 next_request constant uuid := 'b9e60db6-0f0f-4cca-a445-275b6a551209';
 release_row public.rag_current_releases;
 batch_row public.rag_current_batches;
 request_row public.rag_current_requests;
 legacy_before text; legacy_after text; next_result jsonb; proof jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 IF md5(pg_get_functiondef('public.rag_current_claim(text,uuid,uuid)'::regprocedure))
   IS DISTINCT FROM 'ecad9402e2d0f0111b9a96277349ce49'
 OR md5(pg_get_functiondef('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'::regprocedure))
   IS DISTINCT FROM '7281478f1c22cf39c89609cf1c23869e'
 OR md5(pg_get_functiondef('public.rag_current_row_valid(public.knowledge_chunks,jsonb,text)'::regprocedure))
   IS DISTINCT FROM '9f61e033e9f0cfc7f6604075b69d9ec1'
 THEN RAISE EXCEPTION 'READY_RECOVERY_ROUTINE_CHANGED'; END IF;
 SELECT * INTO release_row FROM public.rag_current_releases WHERE release_id=target FOR UPDATE;
 IF NOT FOUND OR release_row.execution_id IS DISTINCT FROM execution OR release_row.provider_attempts IS DISTINCT FROM 0
   OR encode(extensions.digest(convert_to(release_row.material,'UTF8'),'sha256'),'hex') IS DISTINCT FROM target
   OR release_row.approval IS DISTINCT FROM release_row.material::jsonb
 THEN RAISE EXCEPTION 'READY_RECOVERY_RELEASE_CHANGED'; END IF;
 SELECT * INTO batch_row FROM public.rag_current_batches WHERE release_id=target AND ordinal=5 FOR UPDATE;
 IF NOT FOUND OR batch_row.state IS DISTINCT FROM 'inflight' OR batch_row.provider_reserved IS DISTINCT FROM false
   OR batch_row.request_id IS DISTINCT FROM prior_request
   OR md5(batch_row.lease_token::text) IS DISTINCT FROM 'edf29b03c6a18b4ee00d880799ac4973'
   OR batch_row.lease_until IS NULL OR batch_row.lease_until>=clock_timestamp() OR batch_row.lease_until>=transaction_timestamp()
   OR jsonb_array_length(batch_row.chunk_ids) IS DISTINCT FROM 64
 THEN RAISE EXCEPTION 'READY_RECOVERY_BATCH_CHANGED'; END IF;
 SELECT * INTO request_row FROM public.rag_current_requests WHERE request_id=prior_request FOR UPDATE;
 IF NOT FOUND OR request_row.release_id IS DISTINCT FROM target OR request_row.operation IS DISTINCT FROM 'batch'
   OR md5(to_jsonb(request_row)::text) IS DISTINCT FROM 'c2db3d4ccaa8524fb5bc5ead138cc0db'
   OR request_row.result ? 'committed' OR request_row.result ? 'done'
   OR request_row.result->'chunkIds' IS DISTINCT FROM batch_row.chunk_ids
   OR request_row.result->>'leaseToken' IS DISTINCT FROM batch_row.lease_token::text
   OR request_row.result->>'ordinal' IS DISTINCT FROM '5'
 THEN RAISE EXCEPTION 'READY_RECOVERY_REQUEST_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.rag_current_requests WHERE request_id=next_request)
   OR NOT EXISTS(SELECT 1 FROM public.rag_index_versions WHERE version_key='rag-current-v1-'||target AND status='staging')
   OR (SELECT version_key FROM public.rag_index_versions WHERE status='active') IS DISTINCT FROM 'rag-index-v1-3e1ef5aa-930bc16ad0085e44'
   OR (SELECT count(*) FROM public.rag_current_batches WHERE release_id=target)<>61
   OR (SELECT count(*) FROM public.rag_current_batches WHERE release_id=target AND state='done' AND ordinal<5)<>5
   OR (SELECT count(*) FROM public.rag_current_batches WHERE release_id=target AND state='pending' AND ordinal>5)<>55
   OR EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=target AND provider_reserved)
   OR (SELECT count(*) FROM public.knowledge_chunks WHERE index_version='rag-current-v1-'||target)<>320
   OR EXISTS(SELECT 1 FROM public.knowledge_chunks WHERE index_version='rag-current-v1-'||target
       AND source_id IN(SELECT jsonb_array_elements_text(batch_row.chunk_ids)))
 THEN RAISE EXCEPTION 'READY_RECOVERY_STATE_CHANGED'; END IF;
 SELECT md5(jsonb_build_object(
  'release',(SELECT to_jsonb(r) FROM public.rag_current_releases r WHERE release_id=legacy),
  'batches',(SELECT jsonb_agg(to_jsonb(b) ORDER BY ordinal) FROM public.rag_current_batches b WHERE release_id=legacy),
  'requests',(SELECT jsonb_agg(to_jsonb(q) ORDER BY request_id) FROM public.rag_current_requests q WHERE release_id=legacy))::text) INTO legacy_before;
 IF legacy_before IS DISTINCT FROM '1cd729044620ec9c1fd475fb36271085' THEN RAISE EXCEPTION 'READY_RECOVERY_LEGACY_CHANGED'; END IF;
 -- Parent lock is held: an earlier commit has completed/rolled back before our reads.
 -- Replacement lease and receipt are committed together, fencing all late old requests.
 next_result := public.rag_current_claim(target,execution,next_request);
 IF next_result->>'ordinal' IS DISTINCT FROM '5'
   OR next_result->'chunkIds' IS DISTINCT FROM batch_row.chunk_ids
   OR next_result->>'leaseToken' IS NULL
   OR next_result->>'leaseToken'=batch_row.lease_token::text
 THEN RAISE EXCEPTION 'READY_RECOVERY_REPLACEMENT_INVALID'; END IF;
 proof := jsonb_build_object(
  'schemaVersion','ready-result-expired-nonprovider-recovery-v1',
  'priorRequestId',prior_request,'nextRequestId',next_request,'executionId',execution,'ordinal',5,
  'priorLeaseMd5','edf29b03c6a18b4ee00d880799ac4973',
  'priorRequestMd5','c2db3d4ccaa8524fb5bc5ead138cc0db',
  'priorCheckpointSha256','491e6408326b2b56aff760b9f5fad5a03f9b66689eb56ef18ced4fd1a8d46daf',
  'priorStoredRows',0,'providerAttempts',0,'providerReserved',false,
  'legacyAuditMd5',legacy_before,'fenced',true,'observedAt',clock_timestamp());
 UPDATE public.rag_current_requests SET result=result||jsonb_build_object('recovery',proof)
  WHERE request_id=next_request AND release_id=target AND operation='batch';
 IF (SELECT md5(to_jsonb(q)::text) FROM public.rag_current_requests q WHERE request_id=prior_request)
    IS DISTINCT FROM 'c2db3d4ccaa8524fb5bc5ead138cc0db'
 THEN RAISE EXCEPTION 'READY_RECOVERY_PRIOR_REQUEST_MODIFIED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=target AND ordinal=5
     AND request_id=next_request AND lease_token::text=next_result->>'leaseToken'
     AND state='inflight' AND NOT provider_reserved)
 THEN RAISE EXCEPTION 'READY_RECOVERY_FENCE_MISSING'; END IF;
 SELECT md5(jsonb_build_object(
  'release',(SELECT to_jsonb(r) FROM public.rag_current_releases r WHERE release_id=legacy),
  'batches',(SELECT jsonb_agg(to_jsonb(b) ORDER BY ordinal) FROM public.rag_current_batches b WHERE release_id=legacy),
  'requests',(SELECT jsonb_agg(to_jsonb(q) ORDER BY request_id) FROM public.rag_current_requests q WHERE release_id=legacy))::text) INTO legacy_after;
 IF legacy_after IS DISTINCT FROM legacy_before THEN RAISE EXCEPTION 'READY_RECOVERY_LEGACY_MODIFIED'; END IF;
END $recover$;
COMMIT;
SELECT q.request_id,q.result->'recovery' AS recovery,b.ordinal,b.state,b.provider_reserved,b.lease_until,
 md5(b.lease_token::text) AS lease_md5
FROM public.rag_current_requests q JOIN public.rag_current_batches b ON b.request_id=q.request_id
WHERE q.request_id='b9e60db6-0f0f-4cca-a445-275b6a551209';

