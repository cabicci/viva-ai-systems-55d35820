-- Schema and non-learner registry/policy fingerprints. Run with search_path=public,extensions.
-- Reads three reviewed registry/policy rowsets; no learner data, job/receipt rows,
-- vectors, provider requests, migration stamps or secrets are read.
WITH relations AS (
 SELECT c.*,n.nspname FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND (c.relname LIKE 'card_assistant_%' OR c.relname LIKE 'assistant_auto_%'
  OR c.relname LIKE 'rag_current_%' OR c.relname='academic_rag_chunks')
 AND c.relkind IN ('r','p','v','S')
), objects AS (
 SELECT 'function:'||n.nspname||'.'||p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')' AS object_key,
 jsonb_build_object('definition',pg_catalog.pg_get_functiondef(p.oid),'owner',pg_catalog.pg_get_userbyid(p.proowner),
  'acl',coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))::text) AS definition
 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND (p.proname LIKE 'card_assistant_%' OR p.proname LIKE 'assistant_auto_%'
  OR p.proname LIKE 'rag_current_%' OR p.proname IN ('rag_reusable_embeddings','academic_sync_chunks','lc09_advance_deletion')
  OR p.prosrc LIKE '%LC09_UNCLASSIFIED_USER_TABLE%')
 UNION ALL
 SELECT 'relation:'||c.nspname||'.'||c.relname,jsonb_build_object(
  'kind',c.relkind,'owner',pg_catalog.pg_get_userbyid(c.relowner),'acl',coalesce(c.relacl,pg_catalog.acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END,c.relowner))::text,
  'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'options',c.reloptions,'replica_identity',c.relreplident,
  'columns',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
   'not_null',a.attnotnull,'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity,'generated',a.attgenerated,
   'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::regcollation::text END) ORDER BY a.attnum),'[]'::jsonb)
   FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
   WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
  'constraints',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',k.conname,'definition',pg_catalog.pg_get_constraintdef(k.oid),
   'validated',k.convalidated) ORDER BY k.conname),'[]'::jsonb) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT coalesce(jsonb_agg(jsonb_build_object('definition',pg_catalog.pg_get_indexdef(i.indexrelid),'valid',i.indisvalid,
   'ready',i.indisready) ORDER BY i.indexrelid::regclass::text),'[]'::jsonb) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',p.polname,'permissive',p.polpermissive,'command',p.polcmd,
   'roles',(SELECT jsonb_agg(CASE WHEN role_oid=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(role_oid) END ORDER BY role_oid)
     FROM unnest(p.polroles) role_oid),'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname),'[]'::jsonb)
   FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
  'view',CASE WHEN c.relkind='v' THEN pg_catalog.pg_get_viewdef(c.oid,true) ELSE NULL END,
  'sequence',(SELECT jsonb_build_object('start',s.seqstart,'increment',s.seqincrement,'max',s.seqmax,'min',s.seqmin,'cache',s.seqcache,'cycle',s.seqcycle)
   FROM pg_catalog.pg_sequence s WHERE s.seqrelid=c.oid))
 FROM relations c
 UNION ALL
 SELECT 'trigger:'||n.nspname||'.'||c.relname||'.'||t.tgname,jsonb_build_object('definition',pg_catalog.pg_get_triggerdef(t.oid,true),'enabled',t.tgenabled)
 FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE NOT t.tgisinternal AND n.nspname='public' AND (t.tgname LIKE 'assistant_auto_%' OR c.oid IN (SELECT oid FROM relations))
 UNION ALL
 SELECT 'registry:public.card_assistant_steps',jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(s) ORDER BY area,card_id,step_id),'[]'::jsonb)) FROM public.card_assistant_steps s
 UNION ALL
 SELECT 'registry:public.card_assistant_policy',jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(p) ORDER BY area,card_id),'[]'::jsonb)) FROM public.card_assistant_policy p
 UNION ALL
 SELECT 'registry:public.assistant_auto_policy',jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(p) ORDER BY singleton),'[]'::jsonb)) FROM public.assistant_auto_policy p
)
SELECT object_key,definition,encode(sha256(convert_to(definition::text,'UTF8')),'hex') AS sha256
FROM objects ORDER BY object_key;
