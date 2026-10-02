-- Operational pause only, for an authorized owner in the reviewed environment.
-- Do not execute merely to review this draft. This does not recover erased data.
BEGIN;
UPDATE billing.account_deletion_control SET enabled=false,financial_purge_enabled=false WHERE singleton;
COMMIT;
-- Also set ACCOUNT_DELETION_ENABLED=false in the protected owner environment.
-- Also set ACCOUNT_FINANCIAL_PURGE_ENABLED=false. Keep the deadline guards:
-- pausing jobs never permits a late financial event to restore erased records.
-- Preserve lifecycle tombstones, guarded RPCs, RLS, receipts and worker evidence.
-- Never roll back to unguarded entitlement/webhook functions: late events could
-- recreate access. External cancellations and completed erasure are final.
-- Review any lease-held operation, then resume only under the same approved
-- policy/release references. Backups do not authorize reinstating the account.
