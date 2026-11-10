-- Operational RAG metadata is service-owned. Learner market reads need only
-- country eligibility; audit provenance is not part of either browser query.
-- Existing service operations, readiness policy, rows and functions are retained.
DO $metadata_read_scope$
DECLARE
  table_name text;
  column_names text;
  target oid;
  client text;
BEGIN
  IF pg_catalog.to_regrole('anon') IS NULL
     OR pg_catalog.to_regrole('authenticated') IS NULL
     OR pg_catalog.to_regrole('service_role') IS NULL THEN
    RAISE EXCEPTION 'METADATA_READ_REQUIRED_ROLES';
  END IF;
  FOREACH table_name IN ARRAY ARRAY['rag_index_versions', 'kids_market_release'] LOOP
    target := pg_catalog.to_regclass('public.' || table_name);
    IF target IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class WHERE oid = target AND relkind = 'r' AND relrowsecurity
    ) OR EXISTS (
      SELECT 1 FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) AS required(privilege)
      WHERE NOT pg_catalog.has_table_privilege('service_role', target, required.privilege)
    ) THEN
      RAISE EXCEPTION 'METADATA_READ_REQUIRED_TABLE_BOUNDARY';
    END IF;
    FOREACH client IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = client AND (rolsuper OR rolbypassrls))
         OR pg_catalog.pg_has_role(client, 'service_role', 'MEMBER')
         OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c WHERE c.oid = target
                    AND pg_catalog.pg_has_role(client, c.relowner, 'MEMBER')) THEN
        RAISE EXCEPTION 'METADATA_READ_CLIENT_ROLE_BOUNDARY';
      END IF;
    END LOOP;
  END LOOP;

  LOCK TABLE public.rag_index_versions, public.kids_market_release IN ACCESS EXCLUSIVE MODE;
  FOREACH table_name IN ARRAY ARRAY['rag_index_versions', 'kids_market_release'] LOOP
    target := pg_catalog.to_regclass('public.' || table_name);
    SELECT string_agg(pg_catalog.quote_ident(attname), ', ' ORDER BY attnum)
      INTO column_names FROM pg_catalog.pg_attribute
      WHERE attrelid = target AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
    -- Table revocation does not remove separately granted column privileges.
    EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON public.%I FROM PUBLIC, anon, authenticated', column_names, table_name);
  END LOOP;
  DROP POLICY IF EXISTS rag_index_versions_select_authenticated ON public.rag_index_versions;
  GRANT SELECT (country_code, accepts_child_data) ON public.kids_market_release TO authenticated;

  FOREACH client IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (
      SELECT 1 FROM unnest(ARRAY['public.rag_index_versions', 'public.kids_market_release']) AS scoped(relation)
      WHERE pg_catalog.has_table_privilege(client, scoped.relation, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
         OR pg_catalog.has_any_column_privilege(client, scoped.relation, 'INSERT,UPDATE,REFERENCES')
         OR CASE WHEN current_setting('server_version_num')::integer >= 170000
              THEN pg_catalog.has_table_privilege(client, scoped.relation, 'MAINTAIN') ELSE false END
    ) THEN
      RAISE EXCEPTION 'METADATA_CLIENT_EXTRA_ACCESS_REMAINS';
    END IF;
    IF pg_catalog.has_any_column_privilege(client, 'public.rag_index_versions', 'SELECT') THEN
      RAISE EXCEPTION 'METADATA_READ_REGISTRY_ACCESS_REMAINS';
    END IF;
  END LOOP;
  IF pg_catalog.has_any_column_privilege('anon', 'public.kids_market_release', 'SELECT')
     OR pg_catalog.has_table_privilege('authenticated', 'public.kids_market_release', 'SELECT')
     OR NOT pg_catalog.has_column_privilege('authenticated', 'public.kids_market_release', 'country_code', 'SELECT')
     OR NOT pg_catalog.has_column_privilege('authenticated', 'public.kids_market_release', 'accepts_child_data', 'SELECT')
     OR EXISTS (
       SELECT 1 FROM pg_catalog.pg_attribute
       WHERE attrelid = 'public.kids_market_release'::regclass AND attnum > 0 AND NOT attisdropped
         AND attname NOT IN ('country_code', 'accepts_child_data')
         AND pg_catalog.has_column_privilege('authenticated', attrelid, attnum, 'SELECT')
     ) THEN
    RAISE EXCEPTION 'METADATA_READ_MARKET_PROJECTION_BOUNDARY';
  END IF;
END
$metadata_read_scope$;
