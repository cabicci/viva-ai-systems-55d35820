-- Reviewed release assertion for the native Drizzle runner.
-- No transaction envelope: the runner owns the pending migrations' transaction.
-- No grants, policy changes, customer actions, provider calls or publication.
DO $commercial_native_postcondition$
DECLARE
  relation_name text;
  relation_oid oid;
  routine_name text;
  routine record;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'commercial_policy_release','commercial_legacy_terms','commercial_purchases',
    'commercial_catalogue','commercial_payment_holds','assistant_allowance_periods',
    'assistant_requests','assistant_outside_days','assistant_provider_attempts',
    'assistant_legacy_usage','commerce_discount_terms','free_access_windows',
    'free_access_window_audit','free_access_window_requests'
  ] LOOP
    relation_oid := to_regclass('billing.' || relation_name);
    IF relation_oid IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class WHERE oid=relation_oid AND relrowsecurity
    ) THEN
      RAISE EXCEPTION 'COMMERCIAL_RELEASE_PRIVATE_TABLE_MISSING_OR_UNPROTECTED: %', relation_name;
    END IF;
    IF has_table_privilege('anon',relation_oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       OR has_table_privilege('authenticated',relation_oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
      RAISE EXCEPTION 'COMMERCIAL_RELEASE_BROWSER_TABLE_GRANT: %', relation_name;
    END IF;
  END LOOP;

  FOREACH routine_name IN ARRAY ARRAY[
    'list_commercial_purchase_options','prepare_commercial_purchase',
    'bind_commercial_purchase_session','get_commercial_purchase_by_session',
    'get_commercial_purchase_by_payment','close_commercial_purchase_session',
    'fulfill_commercial_purchase','apply_commercial_purchase_risk_hold',
    'assistant_question_balance','reserve_assistant_question','settle_assistant_question',
    'assistant_question_provider_attempt','prune_assistant_response_cache'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=routine_name
    ) THEN
      RAISE EXCEPTION 'COMMERCIAL_RELEASE_SERVICE_RPC_MISSING: %', routine_name;
    END IF;
    FOR routine IN
      SELECT p.oid FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=routine_name
    LOOP
      IF has_function_privilege('anon',routine.oid,'EXECUTE')
         OR has_function_privilege('authenticated',routine.oid,'EXECUTE')
         OR NOT has_function_privilege('service_role',routine.oid,'EXECUTE') THEN
        RAISE EXCEPTION 'COMMERCIAL_RELEASE_SERVICE_RPC_GRANT: %', routine_name;
      END IF;
    END LOOP;
  END LOOP;

  FOREACH routine_name IN ARRAY ARRAY[
    'get_my_commercial_invitations','accept_commercial_invitation',
    'get_my_commercial_access','get_my_free_access','free_access_window_command'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=routine_name
    ) THEN
      RAISE EXCEPTION 'COMMERCIAL_RELEASE_ACCOUNT_RPC_MISSING: %', routine_name;
    END IF;
    FOR routine IN
      SELECT p.oid FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=routine_name
    LOOP
      IF has_function_privilege('anon',routine.oid,'EXECUTE')
         OR has_function_privilege('service_role',routine.oid,'EXECUTE')
         OR NOT has_function_privilege('authenticated',routine.oid,'EXECUTE') THEN
        RAISE EXCEPTION 'COMMERCIAL_RELEASE_ACCOUNT_RPC_GRANT: %', routine_name;
      END IF;
    END LOOP;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM billing.commercial_policy_release WHERE singleton AND version='2026-11-02'
  ) OR NOT EXISTS (
    SELECT 1 FROM billing.commercial_catalogue
    WHERE kind='lifetime_course' AND amount_minor=7500 AND currency='EGP'
      AND price_id='price_1UXJ6GJUat05km9WKXP9ATsJ'
      AND product_id='prod_masaarat_lifetime_curriculum_v1'
  ) OR NOT EXISTS (
    SELECT 1 FROM billing.commercial_catalogue
    WHERE kind='question_topup' AND amount_minor=5000 AND currency='EGP'
      AND price_id='price_1UXJ6JJUat05km9WDjixVjfG'
      AND product_id='prod_masaarat_question_topup_100_v1'
  ) THEN
    RAISE EXCEPTION 'COMMERCIAL_RELEASE_POLICY_OR_CATALOGUE_MISMATCH';
  END IF;
  IF EXISTS(SELECT 1 FROM billing.free_access_windows) THEN
    RAISE EXCEPTION 'COMMERCIAL_RELEASE_MUST_NOT_CREATE_A_FREE_CAMPAIGN';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='billing'
      AND table_name='email_access_grants' AND column_name='grant_kind' AND is_nullable='NO'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='billing'
      AND table_name='commerce_offers' AND column_name='discount_duration' AND is_nullable='NO'
  ) THEN
    RAISE EXCEPTION 'COMMERCIAL_RELEASE_INVITATION_OR_DISCOUNT_POLICY_MISSING';
  END IF;
END $commercial_native_postcondition$;
