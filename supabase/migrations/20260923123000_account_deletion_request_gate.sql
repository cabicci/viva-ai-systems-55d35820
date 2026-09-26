-- LC-09 review-only migration. A paid account needs a provider cancellation,
-- financial-retention decision and reconciliation before any destructive wipe.
-- This migration is not authorized for production application.
BEGIN;

CREATE TABLE billing.account_deletion_requests (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status = 'pending_review'),
  requested_at timestamptz NOT NULL DEFAULT now(),
  last_requested_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing.account_deletion_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.account_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON billing.account_deletion_requests TO service_role;

CREATE FUNCTION public.request_account_deletion()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = billing, public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR v_user IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  INSERT INTO billing.account_deletion_requests (user_id)
  VALUES (v_user)
  ON CONFLICT (user_id) DO UPDATE
    SET last_requested_at = now();

  RETURN jsonb_build_object('status', 'pending_review');
END;
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;

-- The old RPC claims to delete all account data, yet neither cancels Stripe
-- nor handles billing's NO ACTION foreign keys. Disable it before the UI uses
-- the honest request flow. Retain the body for forensic review, not execution.
REVOKE ALL ON FUNCTION public.delete_my_account_data() FROM PUBLIC, anon, authenticated;
COMMIT;
