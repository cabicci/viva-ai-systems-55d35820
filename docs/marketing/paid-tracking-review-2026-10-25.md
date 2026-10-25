# Paid-tracking implementation awaiting release

This change prepares consent-gated TikTok measurement using the existing pixel
`DAP5613C77UFPT800490`, and registration measurement only after a new signup
attempt is matched to a confirmed account in the same consenting browser.
The legacy TikTok GTM tag must remain paused to avoid a second owner.

The application emits `masaarat_sign_up` with `method: email` into the data layer,
and `CompleteRegistration` to Meta/TikTok. It does not send a user ID, email,
name, phone number or form value as conversion-event parameters. The local
pending marker contains the internal account ID and expires after 24 hours.
Consent withdrawal and Kids routes discard it. Confirmation on another device
is not counted; this is measurement, never account authorization or billing.

Authentication routes, fragment-bearing URLs, and URLs with identity/token
parameters suppress tracking through the existing consent gate. Loaded SDKs
cannot be unloaded from memory; revocation calls their consent interfaces.

## Validation

- 54 tests pass across registration analytics, marketing foundation, conversions
  and route-head integration. Targeted ESLint and whitespace validation pass.
- Full TypeScript checking is blocked by existing imports of the unavailable
  `@electric-sql/pglite-pgvector` dependency in five unchanged tests.
- The build is blocked by the mandatory roadmap guard. The roadmap logger was
  attempted but has no Supabase service environment in this worktree. No roadmap
  record or matching marker was fabricated, and no guard was bypassed.

## Release checks still required

1. Record the actual change through the approved roadmap path and run the full
   build. Review and release this isolated change without other checkout work.
2. Configure GA4 `sign_up` on custom event `masaarat_sign_up`, with `method`
   constant `email`, in a reviewed GTM change. Four pre-existing workspace
   additions for lead/pricing measurement are preserved and unpublished.
3. Verify confirmed-registration receipt in GA4, Meta and TikTok with an
   authorized consenting test account. A signup request or old-account login
   must not count. Verify denial, revocation and absence of duplicate pageviews.
4. Review actual platform targeting, creatives, account currency, payment state
   and spending controls. The owner's EGP 8,000 test ceiling does not authorize
   enabling any campaign before their review and separate spending approval.

Production browser checks on 25 October observed GA4 and Meta pageviews after
consent on the homepage and an AI SPA navigation. Reloading with denied consent
sent zero tracker requests. At withdrawal one Meta `/tr/` request occurred;
the subsequent denied reload sent zero. These observations do not establish
receipt of a real signup conversion or paid attribution. TikTok remained paused
and this source change has not been deployed.
