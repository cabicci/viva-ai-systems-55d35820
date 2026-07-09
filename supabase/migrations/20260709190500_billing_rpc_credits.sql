-- Stage 2A1: credit ledger RPC foundation (draft)
CREATE OR REPLACE FUNCTION billing.grant_monetary_credit(
  p_user_id uuid,
  p_amount_minor bigint,
  p_currency_code text,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_balance bigint := 0;
  v_existing billing.monetary_credit_ledger%ROWTYPE;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'CREDIT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing FROM billing.monetary_credit_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('idempotent_replay', true, 'ledger_id', v_existing.id);
  END IF;

  SELECT COALESCE(
    (
      SELECT balance_after_minor
      FROM billing.monetary_credit_ledger
      WHERE user_id = p_user_id AND currency_code = p_currency_code
      ORDER BY occurred_at DESC
      LIMIT 1
    ),
    0
  )
  INTO v_balance;

  INSERT INTO billing.monetary_credit_ledger (
    user_id, entry_type, amount_minor, currency_code, balance_after_minor,
    source_type, source_id, idempotency_key, occurred_at
  ) VALUES (
    p_user_id, 'grant', p_amount_minor, p_currency_code, v_balance + p_amount_minor,
    p_source_type, p_source_id, p_idempotency_key, now()
  )
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object('ledger_id', v_existing.id, 'balance_after_minor', v_balance + p_amount_minor);
END;
$$;

CREATE OR REPLACE FUNCTION billing.grant_ai_credit(
  p_user_id uuid,
  p_credit_units integer,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = billing, public, pg_temp
AS $$
DECLARE
  v_balance integer := 0;
  v_existing billing.ai_credit_ledger%ROWTYPE;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'CREDIT_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing FROM billing.ai_credit_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('idempotent_replay', true, 'ledger_id', v_existing.id);
  END IF;

  SELECT COALESCE(
    (
      SELECT balance_after
      FROM billing.ai_credit_ledger
      WHERE user_id = p_user_id
      ORDER BY occurred_at DESC
      LIMIT 1
    ),
    0
  )
  INTO v_balance;

  INSERT INTO billing.ai_credit_ledger (
    user_id, entry_type, credit_units, balance_after, source_type, source_id, idempotency_key, occurred_at
  ) VALUES (
    p_user_id, 'grant', p_credit_units, v_balance + p_credit_units,
    p_source_type, p_source_id, p_idempotency_key, now()
  )
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object('ledger_id', v_existing.id, 'balance_after', v_balance + p_credit_units);
END;
$$;

REVOKE ALL ON FUNCTION billing.grant_monetary_credit(uuid, bigint, text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION billing.grant_ai_credit(uuid, integer, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION billing.grant_monetary_credit(uuid, bigint, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION billing.grant_ai_credit(uuid, integer, text, uuid, text) TO service_role;
