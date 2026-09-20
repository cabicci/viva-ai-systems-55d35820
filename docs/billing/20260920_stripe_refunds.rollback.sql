-- Deploy the previous webhook source before removing this RPC.
-- Financial rows are intentionally preserved by rollback.
BEGIN;
SET LOCAL lock_timeout = '5s';
DROP FUNCTION IF EXISTS public.apply_stripe_refund_event(text,text,timestamptz,text,text,text,bigint,text,text,text,uuid,boolean);
DO $guard$
DECLARE v_body text;
BEGIN
  SELECT prosrc INTO v_body FROM pg_proc WHERE oid='billing.subscription_next_access_state(text,text)'::regprocedure;
  v_body := replace(v_body,
    'SELECT CASE WHEN p_event_type = ''canceled'' AND p_from IN (''refunded'', ''refund_pending'') THEN p_from',
    'SELECT CASE');
  EXECUTE format('CREATE OR REPLACE FUNCTION billing.subscription_next_access_state(p_from text,p_event_type text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO billing,public,pg_temp AS %L',v_body);
END;
$guard$;
COMMIT;
