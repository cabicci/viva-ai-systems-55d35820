-- Forward-only explicit read capability for the existing service-only invoker RPCs.
-- No role, schema, policy, function, client access, grant option or write privilege change.
DO $rag_service_select$
DECLARE
 target oid := pg_catalog.to_regclass('public.knowledge_chunks');
 service oid := pg_catalog.to_regrole('service_role');
 client oid;
 fn oid;
 prior jsonb;
 updated jsonb;
 expected_acl jsonb;
 owner_oid oid;
 direct_select boolean;
 policy_expression text;
BEGIN
 IF target IS NULL OR service IS NULL OR pg_catalog.to_regrole('anon') IS NULL
    OR pg_catalog.to_regrole('authenticated') IS NULL THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_REQUIRED_IDENTITIES'; END IF;
 LOCK TABLE public.knowledge_chunks IN ACCESS EXCLUSIVE MODE;
 SELECT relowner INTO owner_oid FROM pg_catalog.pg_class WHERE oid=target AND relkind='r' AND relrowsecurity AND NOT relforcerowsecurity;
 IF owner_oid IS NULL THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_RELATION_BOUNDARY'; END IF;
 IF current_user::regrole::oid<>owner_oid AND NOT (SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user)
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_OWNER_AUTHORITY'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=service AND rolbypassrls AND NOT rolsuper)
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_SERVICE_BOUNDARY'; END IF;
 IF NOT pg_catalog.has_schema_privilege('service_role','public','USAGE') OR NOT pg_catalog.has_schema_privilege('service_role','extensions','USAGE')
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_SCHEMA_BOUNDARY'; END IF;
 FOREACH client IN ARRAY ARRAY['anon'::regrole::oid,'authenticated'::regrole::oid] LOOP
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=client AND (rolsuper OR rolbypassrls))
     OR pg_catalog.pg_has_role(client,service,'MEMBER')
     OR pg_catalog.has_table_privilege(client,target,'INSERT,UPDATE,DELETE')
     OR pg_catalog.has_any_column_privilege(client,target,'INSERT,UPDATE')
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_CLIENT_BOUNDARY'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_policy WHERE polrelid=target AND polcmd IN ('r','*'))<>1
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_POLICY_BOUNDARY'; END IF;
 SELECT pg_catalog.regexp_replace(pg_catalog.replace(pg_catalog.pg_get_expr(polqual,polrelid),'public.',''),'[[:space:]()]','','g')
  INTO policy_expression FROM pg_catalog.pg_policy WHERE polrelid=target AND polname='kc_select_admin' AND polcmd='r'
    AND polpermissive AND polroles=ARRAY['authenticated'::regrole::oid] AND polwithcheck IS NULL;
 IF policy_expression IS DISTINCT FROM 'has_roleSELECTauth.uidASuid,''admin''::app_role'
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_ADMIN_POLICY_CHANGED'; END IF;
 FOR fn IN SELECT oid FROM pg_catalog.pg_proc WHERE oid IN (
   pg_catalog.to_regprocedure('public.match_locale_knowledge_chunks(extensions.vector,text,integer,text,text,text,text,double precision,boolean)'),
   pg_catalog.to_regprocedure('public.match_knowledge_chunks(extensions.vector,integer,text,text,text,double precision)')) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_language l ON l.oid=p.prolang WHERE p.oid=fn
      AND p.prokind='f' AND NOT p.prosecdef AND p.provolatile='s' AND l.lanname='sql'
      AND pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.replace(p.prosrc,E'\r\n',E'\n'),'UTF8')),'hex')=
        CASE p.proname WHEN 'match_locale_knowledge_chunks' THEN '6ebdc6b46d21723d64079187873f79effb0c9339c0b6e50b02abb3fb462d41f9'
        WHEN 'match_knowledge_chunks' THEN 'c5b468efa922c6508b2f34819a03f1223ccb3acde14b6466dd715945c7a4aecf' END)
     OR NOT pg_catalog.has_function_privilege('service_role',fn,'EXECUTE')
     OR pg_catalog.has_function_privilege('anon',fn,'EXECUTE') OR pg_catalog.has_function_privilege('authenticated',fn,'EXECUTE')
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p,LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
        WHERE p.oid=fn AND a.grantee=0 AND a.privilege_type='EXECUTE')
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_FUNCTION_BOUNDARY'; END IF;
 END LOOP;
 IF pg_catalog.to_regprocedure('public.match_locale_knowledge_chunks(extensions.vector,text,integer,text,text,text,text,double precision,boolean)') IS NULL
    OR pg_catalog.to_regprocedure('public.match_knowledge_chunks(extensions.vector,integer,text,text,text,double precision)') IS NULL
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_FUNCTION_MISSING'; END IF;
WITH ids AS (
 SELECT 'public.knowledge_chunks'::regclass AS target,
   ARRAY['public.match_locale_knowledge_chunks(extensions.vector,text,integer,text,text,text,text,double precision,boolean)'::regprocedure,
         'public.match_knowledge_chunks(extensions.vector,integer,text,text,text,double precision)'::regprocedure]::oid[] AS functions,
   ARRAY['service_role'::regrole,'anon'::regrole,'authenticated'::regrole]::oid[] AS roles
)
SELECT jsonb_build_object(
 'database',current_database(),'databaseOid',(SELECT oid FROM pg_catalog.pg_database WHERE datname=current_database()),
 'relation',jsonb_build_object(
   'oid',c.oid,'relname',c.relname,'relnamespace',c.relnamespace,'reltype',c.reltype,'reloftype',c.reloftype,
   'relowner',c.relowner,'relam',c.relam,'reltablespace',c.reltablespace,'relisshared',c.relisshared,
   'relpersistence',c.relpersistence,'relkind',c.relkind,'relnatts',c.relnatts,'relchecks',c.relchecks,
   'relrowsecurity',c.relrowsecurity,'relforcerowsecurity',c.relforcerowsecurity,
   'relispopulated',c.relispopulated,'relreplident',c.relreplident,'relispartition',c.relispartition,
   'reloptions',c.reloptions,'relpartbound',c.relpartbound,
   -- Derive existence from the catalogs; pg_class flags can be stale until VACUUM.
   'relhasindex',EXISTS(SELECT 1 FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
   'relhasrules',EXISTS(SELECT 1 FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid),
   'relhastriggers',EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid=c.oid),
   'relhassubclass',EXISTS(SELECT 1 FROM pg_catalog.pg_inherits i WHERE i.inhparent=c.oid)),
 'acl',(SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',a.grantor,'grantee',a.grantee,'privilege',a.privilege_type,'grantable',a.is_grantable)
       ORDER BY a.grantor,a.grantee,a.privilege_type,a.is_grantable),'[]'::jsonb)
       FROM pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a),
 'columns',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'attrelid',a.attrelid,'attnum',a.attnum,'attname',a.attname,'atttypid',a.atttypid,'atttypmod',a.atttypmod,
   'attlen',a.attlen,'attndims',a.attndims,'attbyval',a.attbyval,'attalign',a.attalign,
   'attstorage',a.attstorage,'attcompression',a.attcompression,'attnotnull',a.attnotnull,
   'atthasdef',a.atthasdef,'atthasmissing',a.atthasmissing,'attidentity',a.attidentity,'attgenerated',a.attgenerated,
   'attisdropped',a.attisdropped,'attislocal',a.attislocal,'attinhcount',a.attinhcount,'attcollation',a.attcollation,
   'attacl',a.attacl,'attfdwoptions',a.attfdwoptions,'attmissingval',a.attmissingval,
   'attoptions',(SELECT coalesce(jsonb_agg(opt ORDER BY opt),'[]'::jsonb)
     FROM pg_catalog.unnest(a.attoptions) opt
     WHERE pg_catalog.split_part(opt,'=',1) NOT IN ('n_distinct','n_distinct_inherited'))
   ) ORDER BY a.attnum),'[]'::jsonb) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0),
 'policies',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.oid),'[]'::jsonb) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
 'functions',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p WHERE p.oid=ANY(ids.functions)),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM
   (SELECT oid,rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit FROM pg_catalog.pg_roles WHERE oid=ANY(ids.roles)) r),
 'memberships',(SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.roleid,m.member,m.grantor),'[]'::jsonb) FROM pg_catalog.pg_auth_members m WHERE m.roleid=ANY(ids.roles) OR m.member=ANY(ids.roles)),
 'schemas',(SELECT jsonb_agg(to_jsonb(n) ORDER BY n.oid) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('public','extensions'))
) INTO prior FROM pg_catalog.pg_class c CROSS JOIN ids WHERE c.oid=ids.target;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(prior->'acl') a WHERE (a->>'grantee')::oid=service AND a->>'privilege'='SELECT') INTO direct_select;
 IF NOT direct_select THEN GRANT SELECT ON TABLE public.knowledge_chunks TO service_role; END IF;
WITH ids AS (
 SELECT 'public.knowledge_chunks'::regclass AS target,
   ARRAY['public.match_locale_knowledge_chunks(extensions.vector,text,integer,text,text,text,text,double precision,boolean)'::regprocedure,
         'public.match_knowledge_chunks(extensions.vector,integer,text,text,text,double precision)'::regprocedure]::oid[] AS functions,
   ARRAY['service_role'::regrole,'anon'::regrole,'authenticated'::regrole]::oid[] AS roles
)
SELECT jsonb_build_object(
 'database',current_database(),'databaseOid',(SELECT oid FROM pg_catalog.pg_database WHERE datname=current_database()),
 'relation',jsonb_build_object(
   'oid',c.oid,'relname',c.relname,'relnamespace',c.relnamespace,'reltype',c.reltype,'reloftype',c.reloftype,
   'relowner',c.relowner,'relam',c.relam,'reltablespace',c.reltablespace,'relisshared',c.relisshared,
   'relpersistence',c.relpersistence,'relkind',c.relkind,'relnatts',c.relnatts,'relchecks',c.relchecks,
   'relrowsecurity',c.relrowsecurity,'relforcerowsecurity',c.relforcerowsecurity,
   'relispopulated',c.relispopulated,'relreplident',c.relreplident,'relispartition',c.relispartition,
   'reloptions',c.reloptions,'relpartbound',c.relpartbound,
   -- Derive existence from the catalogs; pg_class flags can be stale until VACUUM.
   'relhasindex',EXISTS(SELECT 1 FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
   'relhasrules',EXISTS(SELECT 1 FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid),
   'relhastriggers',EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid=c.oid),
   'relhassubclass',EXISTS(SELECT 1 FROM pg_catalog.pg_inherits i WHERE i.inhparent=c.oid)),
 'acl',(SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',a.grantor,'grantee',a.grantee,'privilege',a.privilege_type,'grantable',a.is_grantable)
       ORDER BY a.grantor,a.grantee,a.privilege_type,a.is_grantable),'[]'::jsonb)
       FROM pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a),
 'columns',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'attrelid',a.attrelid,'attnum',a.attnum,'attname',a.attname,'atttypid',a.atttypid,'atttypmod',a.atttypmod,
   'attlen',a.attlen,'attndims',a.attndims,'attbyval',a.attbyval,'attalign',a.attalign,
   'attstorage',a.attstorage,'attcompression',a.attcompression,'attnotnull',a.attnotnull,
   'atthasdef',a.atthasdef,'atthasmissing',a.atthasmissing,'attidentity',a.attidentity,'attgenerated',a.attgenerated,
   'attisdropped',a.attisdropped,'attislocal',a.attislocal,'attinhcount',a.attinhcount,'attcollation',a.attcollation,
   'attacl',a.attacl,'attfdwoptions',a.attfdwoptions,'attmissingval',a.attmissingval,
   'attoptions',(SELECT coalesce(jsonb_agg(opt ORDER BY opt),'[]'::jsonb)
     FROM pg_catalog.unnest(a.attoptions) opt
     WHERE pg_catalog.split_part(opt,'=',1) NOT IN ('n_distinct','n_distinct_inherited'))
   ) ORDER BY a.attnum),'[]'::jsonb) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0),
 'policies',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.oid),'[]'::jsonb) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
 'functions',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p WHERE p.oid=ANY(ids.functions)),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM
   (SELECT oid,rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit FROM pg_catalog.pg_roles WHERE oid=ANY(ids.roles)) r),
 'memberships',(SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.roleid,m.member,m.grantor),'[]'::jsonb) FROM pg_catalog.pg_auth_members m WHERE m.roleid=ANY(ids.roles) OR m.member=ANY(ids.roles)),
 'schemas',(SELECT jsonb_agg(to_jsonb(n) ORDER BY n.oid) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('public','extensions'))
) INTO updated FROM pg_catalog.pg_class c CROSS JOIN ids WHERE c.oid=ids.target;
 expected_acl:=prior->'acl';
 IF NOT direct_select THEN expected_acl:=expected_acl||jsonb_build_array(jsonb_build_object('grantor',owner_oid,'grantee',service,'privilege','SELECT','grantable',false)); END IF;
 SELECT coalesce(jsonb_agg(a ORDER BY (a->>'grantor')::oid,(a->>'grantee')::oid,a->>'privilege',(a->>'grantable')::boolean),'[]'::jsonb)
  INTO expected_acl FROM jsonb_array_elements(expected_acl) a;
 IF (updated-'acl') IS DISTINCT FROM (prior-'acl') OR updated->'acl' IS DISTINCT FROM expected_acl
    OR NOT pg_catalog.has_table_privilege('service_role',target,'SELECT')
    THEN RAISE EXCEPTION 'RAG_SERVICE_SELECT_POSTIMAGE_CHANGED'; END IF;
END
$rag_service_select$;
