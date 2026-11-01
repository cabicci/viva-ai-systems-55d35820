-- Original project 658adce0-747d-4c8e-90e3-d22225070b94 ONLY.
-- Add immutable operational retirement; historical provider outcome remains UNKNOWN.
-- Installs code and fences only. Actual retirement requires explicit, freshly pinned owner call
-- after complete original 0c0f ready transport/activation. No provider, row clearing or automatic retry.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='60s'; SET LOCAL search_path=public,extensions;
DO $retirement_migration$
DECLARE observed text; mode text; snapshot jsonb; routine record; before_owner oid; before_acl aclitem[]; before_oid oid;
BEGIN
 IF md5(pg_get_functiondef('public.rag_current_row_valid(public.knowledge_chunks,jsonb,text)'::regprocedure)) IS DISTINCT FROM '9f61e033e9f0cfc7f6604075b69d9ec1' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_ROW_VALIDATOR_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef(to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)'))) INTO observed;
 IF observed='e6ed37c096ce632aa769ae3c88f7802c' THEN
  IF mode='post' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='pre';
 ELSIF observed='60b81e35d2c54cabfee03f48880d6061' THEN
  IF mode='pre' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='post';
 ELSE RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_PREIMAGE_CHANGED:rag_current_activate'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)') AND pg_get_userbyid(proowner)='postgres'
  AND proacl::text='{postgres=X/postgres,service_role=X/postgres}') THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_ACL_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef(to_regprocedure('public.rag_current_claim(text,uuid,uuid)'))) INTO observed;
 IF observed='ecad9402e2d0f0111b9a96277349ce49' THEN
  IF mode='post' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='pre';
 ELSIF observed='1028f8e41ffa8db6c330490b2a7497d5' THEN
  IF mode='pre' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='post';
 ELSE RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_PREIMAGE_CHANGED:rag_current_claim'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_claim(text,uuid,uuid)') AND pg_get_userbyid(proowner)='postgres'
  AND proacl::text='{postgres=X/postgres,service_role=X/postgres}') THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_ACL_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef(to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'))) INTO observed;
 IF observed='7281478f1c22cf39c89609cf1c23869e' THEN
  IF mode='post' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='pre';
 ELSIF observed='500beddc2986ceb72c2711e74f202973' THEN
  IF mode='pre' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='post';
 ELSE RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_PREIMAGE_CHANGED:rag_current_commit'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)') AND pg_get_userbyid(proowner)='postgres'
  AND proacl::text='{postgres=X/postgres,service_role=X/postgres}') THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_ACL_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef(to_regprocedure('public.rag_current_fail(text,uuid,uuid,uuid)'))) INTO observed;
 IF observed='ef50e7141f17a8019caa362d9aa1096d' THEN
  IF mode='post' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='pre';
 ELSIF observed='f5bf5fb681f6bb0fe5dc96701cf2be3e' THEN
  IF mode='pre' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='post';
 ELSE RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_PREIMAGE_CHANGED:rag_current_fail'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_fail(text,uuid,uuid,uuid)') AND pg_get_userbyid(proowner)='postgres'
  AND proacl::text='{postgres=X/postgres,service_role=X/postgres}') THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_ACL_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef(to_regprocedure('public.rag_current_initialize(text,text,uuid)'))) INTO observed;
 IF observed='37d054c15ccd4fba49ceb381b5ea7e0d' THEN
  IF mode='post' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='pre';
 ELSIF observed='24b7753ce323c84027f725f1bedb4b42' THEN
  IF mode='pre' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='post';
 ELSE RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_PREIMAGE_CHANGED:rag_current_initialize'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_initialize(text,text,uuid)') AND pg_get_userbyid(proowner)='postgres'
  AND proacl::text='{postgres=X/postgres,service_role=X/postgres}') THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_ACL_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef(to_regprocedure('public.rag_current_reserve_provider(text,uuid,uuid,uuid)'))) INTO observed;
 IF observed='3fdf58da4aea1cac1ef18bc043b88327' THEN
  IF mode='post' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='pre';
 ELSIF observed='b2b1de1412d9c653e60dfc8773f2d22d' THEN
  IF mode='pre' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='post';
 ELSE RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_PREIMAGE_CHANGED:rag_current_reserve_provider'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_reserve_provider(text,uuid,uuid,uuid)') AND pg_get_userbyid(proowner)='postgres'
  AND proacl::text='{postgres=X/postgres,service_role=X/postgres}') THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_ACL_CHANGED'; END IF;
 SELECT md5(pg_get_functiondef(to_regprocedure('public.rag_current_rollback(text,uuid,uuid,text)'))) INTO observed;
 IF observed='39c14b873857c2d2f8bb4a754fe96188' THEN
  IF mode='post' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='pre';
 ELSIF observed='59afffd3540f542ac2a9e19a7a64da0a' THEN
  IF mode='pre' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_PARTIAL_INSTALL'; END IF; mode:='post';
 ELSE RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_PREIMAGE_CHANGED:rag_current_rollback'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_rollback(text,uuid,uuid,text)') AND pg_get_userbyid(proowner)='postgres'
  AND proacl::text='{postgres=X/postgres,service_role=X/postgres}') THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_ACL_CHANGED'; END IF;
 SELECT (SELECT jsonb_build_object(
 'routines',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'definition',md5(pg_get_functiondef(p.oid)),
  'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text) ORDER BY p.oid::regprocedure::text) FROM pg_proc p
  WHERE p.pronamespace='public'::regnamespace AND p.proname IN('rag_current_retirement_immutable','rag_current_legacy_audit',
   'rag_current_retirement_coverage','rag_current_retirement_valid','rag_current_prior_ai_clear','rag_current_retire_verified','rag_current_require_unretired')),
 'relation',(SELECT jsonb_build_object('kind',c.relkind,'owner',pg_get_userbyid(c.relowner),'acl',c.relacl::text,'rls',c.relrowsecurity,'force',c.relforcerowsecurity)
  FROM pg_class c WHERE c.oid=to_regclass('public.rag_current_retirements')),
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
  FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass('public.rag_current_retirements') AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT jsonb_agg(pg_get_constraintdef(oid) ORDER BY conname) FROM pg_constraint WHERE conrelid=to_regclass('public.rag_current_retirements') AND contype<>'n'),
 'triggers',(SELECT jsonb_agg(jsonb_build_object('definition',pg_get_triggerdef(oid),'enabled',tgenabled) ORDER BY tgname) FROM pg_trigger WHERE tgrelid=to_regclass('public.rag_current_retirements') AND NOT tgisinternal),
 'policies',(SELECT jsonb_agg(jsonb_build_object('name',polname,'roles',polroles::text,'command',polcmd,'using',pg_get_expr(polqual,polrelid),'check',pg_get_expr(polwithcheck,polrelid)) ORDER BY polname) FROM pg_policy WHERE polrelid=to_regclass('public.rag_current_retirements')))) INTO snapshot;
 IF mode='post' THEN
  IF md5(snapshot::text) IS DISTINCT FROM '6ba1c22153baebc1d2fb2b627a1a7110' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_CATALOG_POSTIMAGE_CHANGED'; END IF;
  RETURN;
 END IF;
 IF snapshot->'routines'<>'null'::jsonb OR snapshot->'relation'<>'null'::jsonb THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_OBJECT_COLLISION'; END IF;
 EXECUTE $new_retirement_objects$
-- New service-only operational retirement. Historical provider outcome stays UNKNOWN.
CREATE TABLE public.rag_current_retirements (
 release_id text PRIMARY KEY REFERENCES public.rag_current_releases,
 execution_id uuid NOT NULL, unknown_request_id uuid NOT NULL, batch_ordinal integer NOT NULL CHECK(batch_ordinal=19),
 legacy_audit_md5 text NOT NULL CHECK(legacy_audit_md5 ~ '^[a-f0-9]{32}$'),
 legacy_audit_sha256 text NOT NULL CHECK(legacy_audit_sha256 ~ '^[a-f0-9]{64}$'),
 successor_release_id text NOT NULL REFERENCES public.rag_current_releases,
 successor_execution_id uuid NOT NULL, successor_version text NOT NULL,
 coverage_sha256 text NOT NULL CHECK(coverage_sha256 ~ '^[a-f0-9]{64}$'), chunk_ids jsonb NOT NULL,
 provider_outcome text NOT NULL DEFAULT 'UNKNOWN' CHECK(provider_outcome='UNKNOWN'),
 reason text NOT NULL DEFAULT 'obsolete_release_covered_without_replay' CHECK(reason='obsolete_release_covered_without_replay'),
 retired_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rag_current_retirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rag_current_retirements FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.rag_current_retirements TO service_role;

CREATE FUNCTION public.rag_current_retirement_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'CURRENT_RETIREMENT_IMMUTABLE'; END $$;
CREATE TRIGGER rag_current_retirement_immutable BEFORE UPDATE OR DELETE ON public.rag_current_retirements
 FOR EACH ROW EXECUTE FUNCTION public.rag_current_retirement_immutable();
CREATE TRIGGER rag_current_retirement_no_truncate BEFORE TRUNCATE ON public.rag_current_retirements
 FOR EACH STATEMENT EXECUTE FUNCTION public.rag_current_retirement_immutable();
REVOKE ALL ON FUNCTION public.rag_current_retirement_immutable() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.rag_current_legacy_audit(p_release_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE body jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT jsonb_build_object('release',(SELECT to_jsonb(r) FROM public.rag_current_releases r WHERE release_id=p_release_id),
  'batches',(SELECT coalesce(jsonb_agg(to_jsonb(b) ORDER BY ordinal),'[]'::jsonb) FROM public.rag_current_batches b WHERE release_id=p_release_id),
  'requests',(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY request_id),'[]'::jsonb) FROM public.rag_current_requests q WHERE release_id=p_release_id)) INTO body;
 IF body->'release'='null'::jsonb THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_RELEASE_MISSING'; END IF;
 RETURN jsonb_build_object('md5',md5(body::text),'sha256',encode(extensions.digest(convert_to(body::text,'UTF8'),'sha256'),'hex'));
END $$;

-- A snapshot is source-coverage evidence, never evidence of the old provider's outcome.
CREATE FUNCTION public.rag_current_retirement_coverage(p_release_id text,p_successor text,p_unknown_request uuid,p_full boolean)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' SET statement_timeout='60s' AS $$
DECLARE r public.rag_current_releases; s public.rag_current_releases; b public.rag_current_batches;
 v public.rag_index_versions; old_request public.rag_current_requests; coverage jsonb; total integer;
BEGIN
 PERFORM public.rag_require_service_role();
 IF p_release_id IS DISTINCT FROM '11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5'
  OR p_successor IS DISTINCT FROM '0c0f31b61c596fd6b8687bb156911f8d28613581af0fcf5f7ac4063dce3c1b85'
  OR p_unknown_request IS DISTINCT FROM '2dd51551-39b9-4abb-a965-b03f91733192'::uuid THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_SCOPE_INVALID'; END IF;
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id;
 SELECT * INTO s FROM public.rag_current_releases WHERE release_id=p_successor;
 SELECT * INTO b FROM public.rag_current_batches WHERE release_id=p_release_id AND ordinal=19;
 SELECT * INTO old_request FROM public.rag_current_requests WHERE request_id=p_unknown_request;
 SELECT * INTO v FROM public.rag_index_versions WHERE version_key='rag-current-v1-'||p_successor;
 IF r.execution_id IS DISTINCT FROM 'cd259987-11c0-4f0d-941f-5011a54a55f8'::uuid OR s.execution_id IS NULL
  OR r.approval IS DISTINCT FROM r.material::jsonb OR s.approval IS DISTINCT FROM s.material::jsonb
  OR encode(extensions.digest(convert_to(r.material,'UTF8'),'sha256'),'hex') IS DISTINCT FROM p_release_id
  OR encode(extensions.digest(convert_to(s.material,'UTF8'),'sha256'),'hex') IS DISTINCT FROM p_successor
  OR r.approval->>'embeddingModel' IS DISTINCT FROM 'text-embedding-3-small' OR r.approval->>'embeddingDimensions' IS DISTINCT FROM '1536'
  OR s.approval->>'embeddingModel' IS DISTINCT FROM 'text-embedding-3-small' OR s.approval->>'embeddingDimensions' IS DISTINCT FROM '1536'
  OR b.request_id IS DISTINCT FROM p_unknown_request OR b.state IS DISTINCT FROM 'inflight' OR b.provider_reserved IS DISTINCT FROM true
  OR b.lease_until IS NULL OR b.lease_until>=now() OR jsonb_array_length(b.chunk_ids) IS DISTINCT FROM 64
  OR old_request.release_id IS DISTINCT FROM p_release_id OR old_request.operation IS DISTINCT FROM 'batch'
  OR old_request.result->>'committed'='true' OR old_request.result->>'leaseToken' IS DISTINCT FROM b.lease_token::text
  OR old_request.result->'chunkIds' IS DISTINCT FROM b.chunk_ids OR old_request.result->>'ordinal' IS DISTINCT FROM '19'
  OR (SELECT count(*) FROM public.rag_current_batches WHERE release_id=p_release_id AND state<>'done' AND (state='inflight' OR provider_reserved))<>1
  OR v.status NOT IN('active','superseded') OR v.status IS NULL OR (p_full AND v.status<>'active')
  OR v.source_sha IS DISTINCT FROM p_successor OR v.chunk_manifest_checksum IS DISTINCT FROM p_successor
  OR v.embedding_model IS DISTINCT FROM 'text-embedding-3-small' OR v.chunk_count IS DISTINCT FROM 3851 OR v.package_count IS DISTINCT FROM 400
  OR s.provider_attempts IS DISTINCT FROM 0
  OR (SELECT count(*) FROM public.rag_current_batches WHERE release_id=p_successor)<>61
  OR EXISTS(SELECT 1 FROM public.rag_current_batches sb LEFT JOIN public.rag_current_requests q ON q.request_id=sb.request_id
   WHERE sb.release_id=p_successor AND (sb.state<>'done' OR sb.provider_reserved OR q.release_id IS DISTINCT FROM p_successor
    OR q.operation IS DISTINCT FROM 'batch' OR q.result->>'committed' IS DISTINCT FROM 'true' OR q.result->>'done' IS DISTINCT FROM 'true'
    OR q.result->>'ordinal' IS DISTINCT FROM sb.ordinal::text OR (q.result->>'acceptedRows')::integer IS DISTINCT FROM jsonb_array_length(sb.chunk_ids)))
  OR NOT EXISTS(SELECT 1 FROM public.rag_current_requests WHERE release_id=p_successor AND operation='activate'
   AND result->>'activated'='true' AND result->>'version'=v.version_key)
  OR (SELECT count(*) FROM public.knowledge_chunks WHERE index_version=v.version_key)<>3851 THEN
   RAISE EXCEPTION 'CURRENT_RETIREMENT_SOURCE_NOT_PROVEN'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(b.chunk_ids) id
  WHERE r.approval->'chunks'->id IS NULL OR r.approval->'chunks'->id IS DISTINCT FROM s.approval->'chunks'->id
   OR r.approval->'packages'->(r.approval->'chunks'->id->>'packageKey') IS DISTINCT FROM s.approval->'packages'->(s.approval->'chunks'->id->>'packageKey'))
  OR (SELECT count(*) FROM public.knowledge_chunks WHERE index_version=v.version_key AND source_id IN(SELECT jsonb_array_elements_text(b.chunk_ids)))<>64
  OR EXISTS(SELECT 1 FROM public.knowledge_chunks k WHERE k.index_version=v.version_key
   AND (p_full OR k.source_id IN(SELECT jsonb_array_elements_text(b.chunk_ids)))
   AND (k.source_sha IS DISTINCT FROM p_successor OR k.index_state IS DISTINCT FROM v.status OR
    k.metadata->>'currentReleaseId' IS DISTINCT FROM p_successor OR NOT public.rag_current_row_valid(k,s.approval,k.source_id))) THEN
   RAISE EXCEPTION 'CURRENT_RETIREMENT_COVERAGE_INVALID'; END IF;
 SELECT jsonb_agg(jsonb_build_array(k.source_id,k.chunk_checksum,k.content,k.embedding::text) ORDER BY k.source_id COLLATE "C") INTO coverage
  FROM public.knowledge_chunks k WHERE k.index_version=v.version_key AND k.source_id IN(SELECT jsonb_array_elements_text(b.chunk_ids));
 RETURN jsonb_build_object('chunkIds',b.chunk_ids,'successorExecutionId',s.execution_id,'successorVersion',v.version_key,
  'coverageSha256',encode(extensions.digest(convert_to(coverage::text,'UTF8'),'sha256'),'hex'));
END $$;

CREATE FUNCTION public.rag_current_retirement_valid(p_release_id text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE receipt public.rag_current_retirements; audit jsonb; coverage jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO receipt FROM public.rag_current_retirements WHERE release_id=p_release_id;
 IF NOT FOUND THEN RETURN false; END IF;
 audit:=public.rag_current_legacy_audit(p_release_id);
 IF receipt.provider_outcome<>'UNKNOWN' OR receipt.reason<>'obsolete_release_covered_without_replay'
  OR receipt.execution_id IS DISTINCT FROM 'cd259987-11c0-4f0d-941f-5011a54a55f8'::uuid OR receipt.batch_ordinal<>19
  OR audit->>'md5' IS DISTINCT FROM receipt.legacy_audit_md5 OR audit->>'sha256' IS DISTINCT FROM receipt.legacy_audit_sha256 THEN RETURN false; END IF;
 coverage:=public.rag_current_retirement_coverage(p_release_id,receipt.successor_release_id,receipt.unknown_request_id,false);
 RETURN receipt.coverage_sha256=coverage->>'coverageSha256' AND receipt.chunk_ids=coverage->'chunkIds'
  AND receipt.successor_execution_id::text=coverage->>'successorExecutionId' AND receipt.successor_version=coverage->>'successorVersion';
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE FUNCTION public.rag_current_prior_ai_clear(p_release_id text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 IF p_release_id IS NULL OR p_release_id !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
 RETURN NOT EXISTS(SELECT 1 FROM public.rag_current_batches b WHERE b.release_id<>p_release_id AND b.state<>'done'
  AND (b.state='inflight' OR b.provider_reserved) AND NOT public.rag_current_retirement_valid(b.release_id));
END $$;

CREATE FUNCTION public.rag_current_retire_verified(p_release_id text,p_execution_id uuid,p_unknown_request uuid,
 p_expected_audit_sha256 text,p_successor_execution uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='60s' SET lock_timeout='3s' AS $$
DECLARE audit jsonb; coverage jsonb; receipt public.rag_current_retirements;
 successor constant text:='0c0f31b61c596fd6b8687bb156911f8d28613581af0fcf5f7ac4063dce3c1b85';
BEGIN
 PERFORM public.rag_require_service_role();
 IF p_release_id IS DISTINCT FROM '11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5'
  OR p_execution_id IS DISTINCT FROM 'cd259987-11c0-4f0d-941f-5011a54a55f8'::uuid
  OR p_unknown_request IS DISTINCT FROM '2dd51551-39b9-4abb-a965-b03f91733192'::uuid
  OR p_expected_audit_sha256 IS NULL OR p_expected_audit_sha256 !~ '^[a-f0-9]{64}$' OR p_successor_execution IS NULL THEN
  RAISE EXCEPTION 'CURRENT_RETIREMENT_SCOPE_INVALID'; END IF;
 -- Same existing parent-row locks as every fenced mutator; acquisition order is deterministic.
 PERFORM 1 FROM public.rag_current_releases WHERE release_id IN(p_release_id,successor) ORDER BY release_id FOR UPDATE;
 LOCK TABLE public.rag_index_versions IN EXCLUSIVE MODE;
 audit:=public.rag_current_legacy_audit(p_release_id);
 IF audit->>'md5' IS DISTINCT FROM '1cd729044620ec9c1fd475fb36271085' OR audit->>'sha256' IS DISTINCT FROM p_expected_audit_sha256 THEN
  RAISE EXCEPTION 'CURRENT_RETIREMENT_AUDIT_CHANGED'; END IF;
 SELECT * INTO receipt FROM public.rag_current_retirements WHERE release_id=p_release_id;
 IF FOUND THEN
  IF receipt.execution_id<>p_execution_id OR receipt.unknown_request_id<>p_unknown_request OR receipt.successor_execution_id<>p_successor_execution
   OR NOT public.rag_current_retirement_valid(p_release_id) THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_POSTIMAGE_CHANGED'; END IF;
  RETURN jsonb_build_object('retired',true,'replayed',true,'providerOutcome','UNKNOWN','legacyAuditUnchanged',true);
 END IF;
 coverage:=public.rag_current_retirement_coverage(p_release_id,successor,p_unknown_request,true);
 IF coverage->>'successorExecutionId' IS DISTINCT FROM p_successor_execution::text THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_SUCCESSOR_CHANGED'; END IF;
 INSERT INTO public.rag_current_retirements(release_id,execution_id,unknown_request_id,batch_ordinal,legacy_audit_md5,legacy_audit_sha256,
  successor_release_id,successor_execution_id,successor_version,coverage_sha256,chunk_ids)
 VALUES(p_release_id,p_execution_id,p_unknown_request,19,audit->>'md5',audit->>'sha256',successor,p_successor_execution,
  coverage->>'successorVersion',coverage->>'coverageSha256',coverage->'chunkIds');
 RETURN jsonb_build_object('retired',true,'providerOutcome','UNKNOWN','legacyAuditUnchanged',true,'coveredChunks',64);
END $$;

CREATE FUNCTION public.rag_current_require_unretired(p_release_id text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM 1 FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.rag_current_retirements WHERE release_id=p_release_id) THEN
  RAISE EXCEPTION 'CURRENT_RELEASE_RETIRED_NO_REPLAY'; END IF;
END $$;

-- Remove per-object inherited ACLs, including unexpected non-public defaults.
DO $$ DECLARE f regprocedure; grant_row record; BEGIN
 FOR grant_row IN SELECT DISTINCT x.grantee FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner)))x
  WHERE c.oid='public.rag_current_retirements'::regclass AND x.grantee<>c.relowner LOOP
  EXECUTE format('REVOKE ALL ON public.rag_current_retirements FROM %s',CASE WHEN grant_row.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(grant_row.grantee)) END);
 END LOOP;
 GRANT SELECT ON public.rag_current_retirements TO service_role;
 FOR grant_row IN SELECT DISTINCT p.oid::regprocedure signature,x.grantee FROM pg_proc p
  CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner)))x
  WHERE p.proname IN('rag_current_retirement_immutable','rag_current_legacy_audit','rag_current_retirement_coverage',
   'rag_current_retirement_valid','rag_current_prior_ai_clear','rag_current_retire_verified','rag_current_require_unretired')
   AND p.pronamespace='public'::regnamespace AND x.grantee<>p.proowner LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %s',grant_row.signature,CASE WHEN grant_row.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(grant_row.grantee)) END);
 END LOOP;
 FOREACH f IN ARRAY ARRAY['public.rag_current_legacy_audit(text)'::regprocedure,
  'public.rag_current_retirement_coverage(text,text,uuid,boolean)'::regprocedure,'public.rag_current_retirement_valid(text)'::regprocedure,
  'public.rag_current_prior_ai_clear(text)'::regprocedure,'public.rag_current_retire_verified(text,uuid,uuid,text,uuid)'::regprocedure,
  'public.rag_current_require_unretired(text)'::regprocedure] LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f);
 END LOOP;
END $$;

$new_retirement_objects$;
 SELECT oid,proowner,proacl INTO before_oid,before_owner,before_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_activate(text,uuid,uuid,text)');
 EXECUTE $fenced_mutator$CREATE OR REPLACE FUNCTION public.rag_current_activate(p_release_id text, p_execution_id uuid, p_request_id uuid, p_expected_active text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '60s'
AS $function$
DECLARE r public.rag_current_releases; v text; active text; target public.rag_index_versions; result jsonb; old public.rag_current_requests;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM public.rag_current_require_unretired(p_release_id);
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
END $function$
$fenced_mutator$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=before_oid AND proowner=before_owner AND proacl IS NOT DISTINCT FROM before_acl)
  THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_IDENTITY_CHANGED'; END IF;
 SELECT oid,proowner,proacl INTO before_oid,before_owner,before_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_claim(text,uuid,uuid)');
 EXECUTE $fenced_mutator$CREATE OR REPLACE FUNCTION public.rag_current_claim(p_release_id text, p_execution_id uuid, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.rag_current_releases; b public.rag_current_batches; old public.rag_current_requests; result jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM public.rag_current_require_unretired(p_release_id);
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
END $function$
$fenced_mutator$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=before_oid AND proowner=before_owner AND proacl IS NOT DISTINCT FROM before_acl)
  THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_IDENTITY_CHANGED'; END IF;
 SELECT oid,proowner,proacl INTO before_oid,before_owner,before_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)');
 EXECUTE $fenced_mutator$CREATE OR REPLACE FUNCTION public.rag_current_commit(p_release_id text, p_execution_id uuid, p_request_id uuid, p_lease_token uuid, p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '60s'
AS $function$
DECLARE r public.rag_current_releases; b public.rag_current_batches; item jsonb; c jsonb; p jsonb; result jsonb; v text;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM public.rag_current_require_unretired(p_release_id);
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
$fenced_mutator$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=before_oid AND proowner=before_owner AND proacl IS NOT DISTINCT FROM before_acl)
  THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_IDENTITY_CHANGED'; END IF;
 SELECT oid,proowner,proacl INTO before_oid,before_owner,before_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_fail(text,uuid,uuid,uuid)');
 EXECUTE $fenced_mutator$CREATE OR REPLACE FUNCTION public.rag_current_fail(p_release_id text, p_execution_id uuid, p_request_id uuid, p_lease_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM public.rag_current_require_unretired(p_release_id);
 PERFORM 1 FROM public.rag_current_releases WHERE release_id=p_release_id AND execution_id=p_execution_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 UPDATE public.rag_current_batches SET state='pending',lease_until=NULL WHERE release_id=p_release_id AND request_id=p_request_id
  AND lease_token=p_lease_token AND state='inflight';
 -- Keep the request permanently consumed even if the provider response was lost.
 RETURN jsonb_build_object('recorded',true);
END $function$
$fenced_mutator$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=before_oid AND proowner=before_owner AND proacl IS NOT DISTINCT FROM before_acl)
  THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_IDENTITY_CHANGED'; END IF;
 SELECT oid,proowner,proacl INTO before_oid,before_owner,before_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_initialize(text,text,uuid)');
 EXECUTE $fenced_mutator$CREATE OR REPLACE FUNCTION public.rag_current_initialize(p_release_id text, p_material text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE a jsonb; result jsonb; n integer;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM public.rag_current_require_unretired(p_release_id);
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
END $function$
$fenced_mutator$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=before_oid AND proowner=before_owner AND proacl IS NOT DISTINCT FROM before_acl)
  THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_IDENTITY_CHANGED'; END IF;
 SELECT oid,proowner,proacl INTO before_oid,before_owner,before_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_reserve_provider(text,uuid,uuid,uuid)');
 EXECUTE $fenced_mutator$CREATE OR REPLACE FUNCTION public.rag_current_reserve_provider(p_release_id text, p_execution_id uuid, p_request_id uuid, p_lease_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.rag_current_releases; b public.rag_current_batches; budget integer;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM public.rag_current_require_unretired(p_release_id);
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
END $function$
$fenced_mutator$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=before_oid AND proowner=before_owner AND proacl IS NOT DISTINCT FROM before_acl)
  THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_IDENTITY_CHANGED'; END IF;
 SELECT oid,proowner,proacl INTO before_oid,before_owner,before_acl FROM pg_proc WHERE oid=to_regprocedure('public.rag_current_rollback(text,uuid,uuid,text)');
 EXECUTE $fenced_mutator$CREATE OR REPLACE FUNCTION public.rag_current_rollback(p_release_id text, p_execution_id uuid, p_request_id uuid, p_expected_active text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '60s'
AS $function$
DECLARE r public.rag_current_releases; active text; prior public.rag_index_versions; result jsonb; old public.rag_current_requests;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM public.rag_current_require_unretired(p_release_id);
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
END $function$
$fenced_mutator$;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=before_oid AND proowner=before_owner AND proacl IS NOT DISTINCT FROM before_acl)
  THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_MUTATOR_IDENTITY_CHANGED'; END IF;
 SELECT (SELECT jsonb_build_object(
 'routines',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'definition',md5(pg_get_functiondef(p.oid)),
  'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text) ORDER BY p.oid::regprocedure::text) FROM pg_proc p
  WHERE p.pronamespace='public'::regnamespace AND p.proname IN('rag_current_retirement_immutable','rag_current_legacy_audit',
   'rag_current_retirement_coverage','rag_current_retirement_valid','rag_current_prior_ai_clear','rag_current_retire_verified','rag_current_require_unretired')),
 'relation',(SELECT jsonb_build_object('kind',c.relkind,'owner',pg_get_userbyid(c.relowner),'acl',c.relacl::text,'rls',c.relrowsecurity,'force',c.relforcerowsecurity)
  FROM pg_class c WHERE c.oid=to_regclass('public.rag_current_retirements')),
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
  FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass('public.rag_current_retirements') AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT jsonb_agg(pg_get_constraintdef(oid) ORDER BY conname) FROM pg_constraint WHERE conrelid=to_regclass('public.rag_current_retirements') AND contype<>'n'),
 'triggers',(SELECT jsonb_agg(jsonb_build_object('definition',pg_get_triggerdef(oid),'enabled',tgenabled) ORDER BY tgname) FROM pg_trigger WHERE tgrelid=to_regclass('public.rag_current_retirements') AND NOT tgisinternal),
 'policies',(SELECT jsonb_agg(jsonb_build_object('name',polname,'roles',polroles::text,'command',polcmd,'using',pg_get_expr(polqual,polrelid),'check',pg_get_expr(polwithcheck,polrelid)) ORDER BY polname) FROM pg_policy WHERE polrelid=to_regclass('public.rag_current_retirements')))) INTO snapshot;
 IF md5(snapshot::text) IS DISTINCT FROM '6ba1c22153baebc1d2fb2b627a1a7110' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FRESH_POSTIMAGE_CHANGED'; END IF;
 IF md5(pg_get_functiondef('public.rag_current_activate(text,uuid,uuid,text)'::regprocedure)) IS DISTINCT FROM '60b81e35d2c54cabfee03f48880d6061' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FENCE_POSTIMAGE_CHANGED'; END IF;
 IF md5(pg_get_functiondef('public.rag_current_claim(text,uuid,uuid)'::regprocedure)) IS DISTINCT FROM '1028f8e41ffa8db6c330490b2a7497d5' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FENCE_POSTIMAGE_CHANGED'; END IF;
 IF md5(pg_get_functiondef('public.rag_current_commit(text,uuid,uuid,uuid,jsonb)'::regprocedure)) IS DISTINCT FROM '500beddc2986ceb72c2711e74f202973' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FENCE_POSTIMAGE_CHANGED'; END IF;
 IF md5(pg_get_functiondef('public.rag_current_fail(text,uuid,uuid,uuid)'::regprocedure)) IS DISTINCT FROM 'f5bf5fb681f6bb0fe5dc96701cf2be3e' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FENCE_POSTIMAGE_CHANGED'; END IF;
 IF md5(pg_get_functiondef('public.rag_current_initialize(text,text,uuid)'::regprocedure)) IS DISTINCT FROM '24b7753ce323c84027f725f1bedb4b42' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FENCE_POSTIMAGE_CHANGED'; END IF;
 IF md5(pg_get_functiondef('public.rag_current_reserve_provider(text,uuid,uuid,uuid)'::regprocedure)) IS DISTINCT FROM 'b2b1de1412d9c653e60dfc8773f2d22d' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FENCE_POSTIMAGE_CHANGED'; END IF;
 IF md5(pg_get_functiondef('public.rag_current_rollback(text,uuid,uuid,text)'::regprocedure)) IS DISTINCT FROM '59afffd3540f542ac2a9e19a7a64da0a' THEN RAISE EXCEPTION 'CURRENT_RETIREMENT_FENCE_POSTIMAGE_CHANGED'; END IF;
END $retirement_migration$;
COMMIT;
