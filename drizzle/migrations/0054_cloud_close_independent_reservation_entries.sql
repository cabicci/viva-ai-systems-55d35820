-- R01: assistant questions use the canonical question meter. Other paid AI
-- categories retain the exact guarded implementation, owner and caller policy.
-- No existing reservations, balances or settlement functions are changed.
DO $migration$
DECLARE
  entry record;
  original_oid oid;
  original_owner oid;
  original_owner_name text;
  original_definition text;
  original_prefix text;
  preserved_definition text;
  alias_oid oid;
  granted_role record;
BEGIN
  FOR entry IN SELECT * FROM (VALUES
    ('public', 'reserve_learner_ai_access', 'r01_preserved_public_reserve_learner_ai_access'),
    ('billing', 'reserve_learner_ai_access', 'r01_preserved_billing_reserve_learner_ai_access'),
    ('billing', 'reserve_ai_quota', 'r01_preserved_billing_reserve_ai_quota')
  ) AS entries(schema_name, function_name, alias_name)
  LOOP
    original_oid := to_regprocedure(format('%I.%I(uuid,text,text,uuid,integer,text)',
      entry.schema_name, entry.function_name));
    IF original_oid IS NULL THEN
      RAISE EXCEPTION 'RESERVATION_RETIREMENT_BASE_SIGNATURE_MISSING';
    END IF;
    SELECT proowner INTO original_owner FROM pg_proc WHERE oid = original_oid;
    original_owner_name := pg_get_userbyid(original_owner);
    IF original_owner_name IN ('anon', 'authenticated', 'service_role')
       OR (SELECT prorettype FROM pg_proc WHERE oid = original_oid) <> 'jsonb'::regtype THEN
      RAISE EXCEPTION 'RESERVATION_RETIREMENT_BASE_POLICY_MISMATCH';
    END IF;
    IF to_regprocedure(format('billing.%I(uuid,text,text,uuid,integer,text)', entry.alias_name)) IS NOT NULL THEN
      RAISE EXCEPTION 'RESERVATION_RETIREMENT_ALIAS_ALREADY_EXISTS';
    END IF;

    -- Keep the current body and function options, including the account-deletion
    -- guard. Never delegate around that guard to a raw LC09 predecessor.
    original_definition := pg_get_functiondef(original_oid);
    original_prefix := format('CREATE OR REPLACE FUNCTION %I.%I(', entry.schema_name, entry.function_name);
    IF left(original_definition, length(original_prefix)) <> original_prefix THEN
      RAISE EXCEPTION 'RESERVATION_RETIREMENT_DEFINITION_MISMATCH';
    END IF;
    preserved_definition := format('CREATE FUNCTION billing.%I(', entry.alias_name)
      || substr(original_definition, length(original_prefix) + 1);
    EXECUTE preserved_definition;
    EXECUTE format('ALTER FUNCTION billing.%I(uuid,text,text,uuid,integer,text) OWNER TO %I',
      entry.alias_name, original_owner_name);
    EXECUTE format('REVOKE ALL ON FUNCTION billing.%I(uuid,text,text,uuid,integer,text) FROM PUBLIC, anon, authenticated, service_role',
      entry.alias_name);
    alias_oid := to_regprocedure(format('billing.%I(uuid,text,text,uuid,integer,text)', entry.alias_name));
    -- Remove any additional default caller grants on the newly created alias.
    FOR granted_role IN
      SELECT DISTINCT acl.grantee, roles.rolname
      FROM pg_proc AS functions
      CROSS JOIN LATERAL aclexplode(coalesce(functions.proacl, acldefault('f', functions.proowner))) AS acl
      JOIN pg_roles AS roles ON roles.oid = acl.grantee
      WHERE functions.oid = alias_oid AND acl.grantee <> original_owner
    LOOP
      EXECUTE format('REVOKE ALL ON FUNCTION billing.%I(uuid,text,text,uuid,integer,text) FROM %I',
        entry.alias_name, granted_role.rolname);
    END LOOP;

    -- CREATE OR REPLACE preserves the existing interface owner and ACL. Only
    -- assistant_runtime is retired; all other input reaches the original policy.
    EXECUTE format($wrapper$
      CREATE OR REPLACE FUNCTION %I.%I(
        p_user_id uuid, p_category text, p_lesson_id text, p_request_id uuid,
        p_units integer, p_idempotency_key text
      ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
      BEGIN
        IF lower(btrim(coalesce(p_category, ''))) = 'assistant_runtime' THEN
          IF NOT billing.is_service_role_caller() THEN
            RAISE EXCEPTION 'QUOTA_SERVICE_ONLY' USING ERRCODE='42501';
          END IF;
          RAISE EXCEPTION 'ASSISTANT_UNIFIED_METER_REQUIRED';
        END IF;
        RETURN billing.%I(p_user_id, p_category, p_lesson_id, p_request_id, p_units, p_idempotency_key);
      END;
      $body$;
    $wrapper$, entry.schema_name, entry.function_name, entry.alias_name);
  END LOOP;
END;
$migration$;
