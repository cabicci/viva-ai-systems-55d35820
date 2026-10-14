# Contextual platform mail

General welcome and authentication emails describe the account action only. They do not advertise packages or fixed lesson counts. Welcome links to the localized `/my-learning` route. Subscription, payment and package-invitation messages retain only the relevant package, amount, duration and acceptance conditions.

Auth invite, magic-link, email-change and reauthentication templates use the same signed-recipient profile lookup as signup and recovery. Unknown or unavailable profile data yields a bilingual fallback. Original Auth verification URLs and tokens are passed through unchanged.

Lesson grants display friendly catalogue labels. Academic labels are resolved from the existing service-authorized `academic_courses` metadata (only requested enabled course IDs and titles) after grant authorization, cached per locale within the invocation. Failed metadata lookup uses a neutral translated description rather than exposing an internal catalogue identifier or blocking mail. The stored recipient remains authoritative. Guardian requirements appear only for Kids or all-published grants. No entitlement, duration, payment or database-schema policy changes are introduced.

Checks cover four locales, both email representations, verification data preservation, scoped guardian wording, package-specific notices and metadata failures/authorization. Browser previews use synthetic content and blocked network requests; they do not demonstrate real inbox delivery.

Release: deploy `account-welcome-job` and `commerce-invitations` with their full shared dependencies after merge. Publish the website to update the Auth email handler. Keep all existing secrets, enable flags, webhook authentication and verification settings. Do not resend historical emails or run real mail queues as a test. Native Supabase Auth templates/security-notification settings remain unverified if the connected tools cannot read them; do not silently replace them with a parallel configuration.
