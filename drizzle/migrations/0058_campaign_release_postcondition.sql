DO $campaign_release_postcondition$
DECLARE v record; object_id oid;
BEGIN
  IF EXISTS (SELECT 1 FROM billing.free_access_windows WHERE enabled) THEN
    RAISE EXCEPTION 'CAMPAIGN_MUST_STAY_DISABLED';
  END IF;
  FOR v IN SELECT * FROM (VALUES
    (1794381000000::bigint,'bc8ddebb3365eb3524bdd25dd9b56624b7c9c2af72b26474b313600b5ffe6d89'),
    (1794381000001::bigint,'f3494e772c336aed446ea5864f47f16e5386f804cacfdf3d9868897434f3c80a'),
    (1794381000002::bigint,'2d0d32ccc7e632fc0e7215c3228a9a803a3f20c1b2306cdc38256dcc8103473b')
  ) AS expected(stamp,digest) LOOP
    IF NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations j WHERE j.created_at=v.stamp AND j.hash=v.digest) THEN
      RAISE EXCEPTION 'CAMPAIGN_MIGRATION_PROOF_MISSING: %',v.stamp;
    END IF;
  END LOOP;
  FOR v IN SELECT unnest(ARRAY[
    'billing.access_notice_outbox','billing.campaign_manual_time_awards','billing.campaign_stripe_renewals'
  ]) AS relation_name LOOP
    object_id:=to_regclass(v.relation_name);
    IF object_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class WHERE oid=object_id AND relrowsecurity)
       OR has_table_privilege('anon',object_id,'SELECT,INSERT,UPDATE,DELETE')
       OR has_table_privilege('authenticated',object_id,'SELECT,INSERT,UPDATE,DELETE') THEN
      RAISE EXCEPTION 'CAMPAIGN_PRIVATE_TABLE_POSTCONDITION: %',v.relation_name;
    END IF;
  END LOOP;
  FOR v IN SELECT unnest(ARRAY[
    'public.award_campaign_manual_time()',
    'public.claim_campaign_stripe_renewals()',
    'public.activate_campaign_stripe_renewal(uuid,text)'
  ]) AS routine_name LOOP
    object_id:=to_regprocedure(v.routine_name);
    IF object_id IS NULL OR NOT has_function_privilege('service_role',object_id,'EXECUTE')
       OR has_function_privilege('anon',object_id,'EXECUTE')
       OR has_function_privilege('authenticated',object_id,'EXECUTE') THEN
      RAISE EXCEPTION 'CAMPAIGN_SERVICE_RPC_POSTCONDITION: %',v.routine_name;
    END IF;
  END LOOP;
END $campaign_release_postcondition$;