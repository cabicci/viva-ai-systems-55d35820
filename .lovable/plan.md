# Read-only email audit (Masaarat)

Verified so far: the current commit is `c800a73cff56fd2ffeb16888221268f76bc8e8f3` and the working tree is clean. The project is `abyqqeboyrkkwhjpwmtd`.

## Steps (all read-only)
1. **Live Auth email settings**
   - Check the backend's email status for the sender domain, verification status, and whether auto-confirm is on.
   - Try to read the live auth email templates and settings, if a permitted read exists.
   - Auth email templates, the security notification email, the email hook and the SMTP settings may not be readable. Any part I can't read is reported as "not accessible", never inferred from repository files.
2. **Email delivery log**
   - Read only aggregate counts by event type and template. No recipients or personal rows.
3. **Deployed mail functions**
   - Mail-related functions in the repository: `account-welcome-job` (welcome, subscription, commerce, email_access, contact, technical, academic, lifecycle streams), `contact-mail-webhook`, `commerce-invitations`, `kids-retention-job` and `kids-retention-webhook`.
   - Deployment evidence per function: a POST with no credentials, expecting a 401/405 rejection before any database access. This is the only call made, and it runs no job.
   - Recorded deployment fingerprints from this conversation are also used, for example the `account-welcome-job` fingerprint `1ba7a381…`.
   - Trigger type per function, taken from the source: secret-authenticated cron or job, signed webhook, or signed-in admin.
4. **Source-only templates and drift**
   - Compare `docs/email/templates/*.html` (confirm-signup, reset-password) and `_shared/masaarat-mail.ts` against what is confirmed live.
   - Check whether remote branches are ahead of main for mail-related files, using `git log` with no fetch that changes state.
5. **Report**
   - A concise Arabic summary with exact coverage, plus limitations: what was confirmed live, what comes from source only, and what is not accessible.

## Not done
No edits, deployments, publishing, emails, job runs, configuration or secrets changes, personal-row queries, or token creation.
