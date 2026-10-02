# Owner action list — protected configuration prerequisites

Plain-English, numbered. Each item: what is needed, why, where to get it, where to enter it. No secret values in chat, files, SQL literals, or logs.

## What the owner must do

1. **Bind the account-deletion job secret into Postgres Vault**
   - Setting: Vault entry named `masaarat_account_lifecycle_job_secret`, value identical to the existing Edge secret `ACCOUNT_DELETION_JOB_SECRET`.
   - Why: the lifecycle schedule (`lc09-account-lifecycle-schedule.sql`) reads the bearer token from Vault; without it the schedule cannot be installed and activation stays blocked.
   - Where the value comes from: it already exists in Edge configuration. Edge secret values are write-only — neither the agent nor the owner UI can read them back.
   - Where to enter it: **there is no native Vault-entry form in this Lovable Cloud project.** The only supported route is a privileged database session (the owner's own Root/postgres access) running `vault.create_secret(...)` with the value typed directly by the owner. If the owner cannot retrieve the existing Edge value (it is unreadable), the clean path is: owner generates a fresh random value (32+ chars), enters it in **Project Settings → Secrets → ACCOUNT_DELETION_JOB_SECRET** (owner UI can edit existing secrets; the agent tool cannot), and enters the same value into Vault in the same session.

2. **Bind the contact mail job secret into Postgres Vault**
   - Setting: Vault entry named `masaarat_contact_mail_job_secret`, value identical to the existing Edge secret `CONTACT_MAIL_JOB_SECRET`.
   - Why: the contact schedule (`contact-mail-schedule.sql`) reads its bearer token from Vault.
   - Same constraint and same route as item 1: no native Vault form; owner enters via privileged DB session. If the existing Edge value is not retrievable, owner regenerates and sets both stores in one session.

3. **Rotate the Resend webhook signing secret (coordinated, both ends)**
   - Setting: `RESEND_WEBHOOK_SECRET` in Edge configuration, matching the signing secret of existing webhook `c6c8a671-9128-4304-b65c-7f8dbaffc2e1`.
   - Why: previous exposure requires rotation before contact activation.
   - Where to get it: Resend dashboard → Webhooks → the existing endpoint → rotate/roll signing secret. Do not create a new webhook; the six subscribed events stay as-is.
   - Where to enter it: **Project Settings → Secrets → RESEND_WEBHOOK_SECRET** (owner edits the existing entry; agent tool cannot update existing secrets).
   - Order: rotate in Resend first, immediately paste the new value into Lovable Secrets. Until both ends match, receipt verification returns 401 — that is expected during the swap window.

## What is NOT needed from the owner

- No Resend API key — the connector is working; `RESEND_API_KEY` is preserved untouched.
- No Auth mail/provider changes — preserved.
- No business re-approval — existing approvals stand.

## What the platform cannot do (verified, not assumed)

- Agent tool: cannot read secret values, cannot update existing secret entries, cannot write to Vault, and there is no native Vault form in this project. Lovable Cloud users have no Supabase dashboard.
- No single protected input can bind the same value to both Edge secrets and Vault in one action.

## What the integration owner completes after items 1–3

- Verify both Vault bindings exist (length >= 32) via privileged read.
- Verify contact-mail-job returns 200 `{"enabled":false}` with the protected bearer, and webhook rejects unsigned POST with 401 / accepts correctly signed POST.
- Then, under separate activation confirmation: install the two schedules and enable the flags.
