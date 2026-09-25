# Transactional confirmed-account welcome

This slice sends one bilingual service welcome per newly confirmed auth account. It does not subscribe anyone to marketing, backfill old users, trigger on child profiles, or send offers. Recipient and immutable message content come from the server. No recipient/payload is accepted in the job request.

Apply `20260925220000_account_welcome_email.sql` through the Supabase owner after isolated rehearsal. Deploy `account-welcome-job`. Configure `ACCOUNT_WELCOME_JOB_SECRET` (at least 32 random characters), existing `RESEND_API_KEY`, verified `RESEND_FROM_EMAIL`, and optional `RESEND_REPLY_TO_EMAIL`. Keep `ACCOUNT_WELCOME_ENABLED=false` until the approved controlled test. Enable only after sender verification and release approval; invoke POST with the dedicated bearer secret from the trusted scheduler. No scheduler is created by this migration. Choose scheduling explicitly at deployment.

Every invocation claims at most five rows with a five-minute lease. SQL rechecks the confirmed email matches the captured recipient. Deleted accounts cascade-delete their outbox. The content and provider idempotency key remain constant on retries. Retries stop after 23 hours from first attempt to stay within provider deduplication; old unattempted rows stop after seven days. Inspect aged/blocked rows manually instead of replaying them automatically. Never change the v1 payload while v1 rows are retryable.

`accepted` means Resend accepted the API request, not inbox delivery. For the controlled test, verify the exact provider event and actual inbox arrival separately. Do not send to an arbitrary test address through this worker: use an approved newly confirmed account. Confirm subsequent invocations do not resend it. Read application metrics only in aggregate; do not log emails or credentials.

Rollback: disable `ACCOUNT_WELCOME_ENABLED` and stop the scheduler first. The queue can remain inert. Removing the trigger stops new queue records; do not delete auth users. Marketing journeys require their own explicit consent and release work.
