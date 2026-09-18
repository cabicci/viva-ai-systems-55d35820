-- FOR REVIEW ONLY. Roll back function behavior to the currently deployed definitions.
-- This rollback intentionally retains the two nullable generation columns because
-- dropping columns is unnecessary and would be a breaking operation.

\ir ../../supabase/migrations/20260917120000_stripe_test_checkout_bridge.sql