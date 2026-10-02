# Owner prerequisites — corrected

## What can be supplied through a native protected field

- Edge/server secrets (e.g. `RESEND_WEBHOOK_SECRET`, `ACCOUNT_DELETION_JOB_SECRET`, `CONTACT_MAIL_JOB_SECRET`) are managed by the owner via the Lovable Cloud secrets UI, documented as **More → Cloud → Secrets** (https://docs.lovable.dev/features/secrets). This store holds function environment secrets only. It does **not** write Postgres Vault, and the exact edit affordances have not been verified by automated browser access (the private editor is not reachable from here).

## What needs platform support — no usable protected route exists

- **Vault bindings** (`masaarat_account_lifecycle_job_secret`, `masaarat_contact_mail_job_secret`): there is no native Vault-entry form in this project, and no verified protected-parameter path for an owner to write a Vault secret without exposing the value in a logged SQL argument. This is a **platform capability blocker** — the owner cannot close it by supplying a key. It requires a Lovable platform/support intervention: a protected Vault-secret input, or an official supported mechanism for binding an existing Edge secret into Vault without plaintext SQL.

## Resend webhook signing secret

- No rotation has been performed. When coordinated replacement happens: Resend's rotate-signing-secret keeps both the previous and new signing keys accepted for 24 hours, so there is no forced 401 window. The existing webhook endpoint, its six events, and `RESEND_API_KEY` stay untouched. The new value goes into the Edge secrets store only.

## What the integration owner does afterwards

- Once a supported Vault-binding route exists: verify both bindings (length >= 32), re-verify worker/webhook auth behavior, then install the two schedules and enable the flags. Activation approvals are already documented and valid — the only blockers are the technical bindings above.

## Bottom line

There is currently **no verified end-to-end owner action** that completes the Vault bindings. The Edge-secret values can be managed by the owner through the documented Cloud secrets UI; the Vault side is blocked on platform capability.
