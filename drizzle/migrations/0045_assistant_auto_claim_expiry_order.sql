-- Append-only correction of assistant_auto_claim expiry lock order.
-- Exact accepted body transition; no policy, grants, owner, signature or table changes.
DO $migration$
DECLARE
  target regprocedure := pg_catalog.to_regprocedure('public.assistant_auto_claim(jsonb,uuid)');
  prior pg_catalog.jsonb;
  updated pg_catalog.jsonb;
  previous_source text;
  updated_source text;
  definition text;
  old_sweep text := $auto_expiry_old_sweep$ UPDATE public.assistant_auto_attempts a SET state='held' FROM public.assistant_auto_jobs queued
  WHERE a.request_id=queued.request_id AND queued.state='running' AND queued.lease_until<=now();
 UPDATE public.assistant_auto_jobs SET state='held',error_code='AUTOMATION_UNCERTAIN_REQUEST' WHERE state='running' AND lease_until<=now();$auto_expiry_old_sweep$;
  new_sweep text := $auto_expiry_new_sweep$ WITH expired_jobs AS (
  UPDATE public.assistant_auto_jobs
   SET state='held',error_code='AUTOMATION_UNCERTAIN_REQUEST'
   WHERE state='running' AND lease_until<=now()
   RETURNING job_id,request_id
 )
 UPDATE public.assistant_auto_attempts a SET state='held' FROM expired_jobs AS expired_job
  WHERE a.job_id=expired_job.job_id AND a.request_id=expired_job.request_id AND a.state='running';$auto_expiry_new_sweep$;
BEGIN
  IF target IS NULL THEN RAISE EXCEPTION 'AUTO_EXPIRY_CLAIM_MISSING'; END IF;
  SELECT pg_catalog.to_jsonb(p)-'prosrc',
    pg_catalog.replace(p.prosrc,pg_catalog.chr(13)||pg_catalog.chr(10),pg_catalog.chr(10))
    INTO prior,previous_source FROM pg_catalog.pg_proc p
    WHERE p.oid=target AND p.prokind='f' AND p.prosecdef
      AND p.proconfig=ARRAY['search_path=""'];
  IF prior IS NULL OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(previous_source,'UTF8')),'hex')
    IS DISTINCT FROM 'c288547c9fb5a2ae77906a4cd8fefc940f80ecd5d3586fd021af99bf451e9a64'
    THEN RAISE EXCEPTION 'AUTO_EXPIRY_PREIMAGE_DRIFT'; END IF;
  IF pg_catalog.has_function_privilege('anon',target,'EXECUTE')
     OR pg_catalog.has_function_privilege('authenticated',target,'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('service_role',target,'EXECUTE')
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p,
       LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
       WHERE p.oid=target AND a.grantee=0 AND a.privilege_type='EXECUTE')
    THEN RAISE EXCEPTION 'AUTO_EXPIRY_ACL_DRIFT'; END IF;
  definition := pg_catalog.replace(pg_catalog.pg_get_functiondef(target),
    pg_catalog.chr(13)||pg_catalog.chr(10),pg_catalog.chr(10));
  IF (pg_catalog.length(definition)-pg_catalog.length(pg_catalog.replace(definition,old_sweep,'')))
    /pg_catalog.length(old_sweep) <> 1
    THEN RAISE EXCEPTION 'AUTO_EXPIRY_SWEEP_OCCURRENCE_MISMATCH'; END IF;
  EXECUTE pg_catalog.replace(definition,old_sweep,new_sweep);
  SELECT pg_catalog.to_jsonb(p)-'prosrc',
    pg_catalog.replace(p.prosrc,pg_catalog.chr(13)||pg_catalog.chr(10),pg_catalog.chr(10))
    INTO updated,updated_source FROM pg_catalog.pg_proc p WHERE p.oid=target;
  IF updated IS DISTINCT FROM prior OR
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(updated_source,'UTF8')),'hex')
      IS DISTINCT FROM '142a975dc5b5a52361637b1eef12714e74917c2764116e7c817b82d865b44039'
    THEN RAISE EXCEPTION 'AUTO_EXPIRY_POSTIMAGE_OR_CATALOG_DRIFT'; END IF;
END
$migration$;
