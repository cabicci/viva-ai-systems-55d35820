# Capability answer: sending Cloud Auth emails through Resend (read-only, nothing to build)

## Summary
In this project, auth emails cannot go through Resend. Lovable Emails is required for auth emails; Resend stays available for app emails.

## What I checked in this project's tools
1. **Custom SMTP in Cloud Auth: not available.** The auth settings tool only controls signup, auto-confirm, anonymous sign-in, leaked-password checks, the current-password requirement and the hourly email limit. It has no SMTP fields. There is no Supabase dashboard access and no screen for this in Cloud.
2. **Send Email Hook pointed at Resend: not supported.** On Lovable Cloud, auth emails route through Lovable's email service by design. The only supported custom path is Lovable's managed auth templates, which are signed with the Lovable key. Changing the hook setting yourself (through a function, SQL or Cloud) is not supported and can break auth emails.
3. **Another documented method: none.** The only documented options are Lovable's default templates or Lovable's branded auth templates on your own domain.

## Answers
- **Is Lovable Emails required for auth emails?** Yes, in this project.
  - Without templates: auth emails go out from Lovable's default sender.
  - With branded templates: they go out from `auth.masaarat.ai`.
- **Welcome and subscription emails:** can stay on Resend through `notifications@mail.masaarat.ai`. This doesn't conflict, because `mail.` and `auth.` are separate subdomains.
- **info@masaarat.ai (Google Workspace):** can be the Reply-To for the Resend emails and keep receiving mail. The root domain's mail records stay untouched.
- **Does Pending `auth.masaarat.ai` change sending before DNS?** No. Until the DNS is verified and branded templates are added, auth emails keep going out from the default sender exactly as today.

## Smallest blocker and best option
- **Blocker:** this project has no custom SMTP setting and no supported hook to Resend. It is a platform limit, not a missing secret.
- **Best option inside the project:**
  1. Add the DNS records for `auth.masaarat.ai`.
  2. Set up Lovable's branded auth templates, matching the design and wording of `docs/email/templates`, and keep the confirmation link as is.
  3. Keep Resend for app emails.
  4. Set `info@masaarat.ai` as Reply-To on both.
- **Secrets needed for auth emails:** none new. `RESEND_*` stays for app emails only.

No changes were made.
