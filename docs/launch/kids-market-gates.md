# Kids country release preparation

This change prepares the owner's all-22-Arab-country scope. It does not apply
production migrations, enable a country, collect child records or publish a release.

## Enforcement

The signed-in adult selects a country of residence and separately acknowledges
the review notice and legal adulthood. The server uses the confirmed account
email and authenticated identity. These declarations are not guardianship proof
or consent to process a child's data. No child details or identity documents
belong in this request form or the admin reference field.

Every `kids_market_release` row starts closed. A country cannot be opened without
a dated review reference. The parent's country is attached to the request and
cannot be silently changed by resubmission. Clients cannot write release state,
approve themselves, supply an email or select another parent identity.

The admin approval RPC still requires the global child-data gate. A trigger also
requires the selected country's gate and the adult acknowledgment. Profile
creation/updates and lesson authorization independently require approved parent
review, verified guardianship and that country's open gate. Lessons additionally
require global lesson access, profile ownership and editorial approval. Lessons
1–2 are free only within these gates; other lessons require a current family
entitlement. Closing a country denies both free and paid lesson access.

Parent read/delete rights to existing own records remain available so closing
service access does not remove the existing rights pathway. Cross-family reads
remain denied. Do not represent this existing profile-delete route as a complete
account/processor/backups deletion implementation.

The old one-argument request RPC rejects stale forms. Requests created under
an older schema without country/adulthood cannot be approved by this migration;
any such row requires an explicit support-led review, not automatic grandfathering.
Country selection is self-reported residence, not geolocation or proof of residence.

## Rollout boundary

The five prepared migrations, in order, are:

1. `20260924190000_kids_parent_content_access_foundation.sql`
2. `20260924191000_kids_private_lesson_content.sql`
3. `20260925120000_kids_parent_access_review.sql`
4. `20260925140000_kids_market_release_gates.sql`
5. `20260925160000_kids_family_profile_limit.sql`

See [family policy preparation](kids-family-policy.md) for approved commercial
rules, expiry retention, and the intended automatic guardian-verification path.

The first migration's privacy, editorial and deployment review
requirements apply to the entire set. Country-specific review must define the
guardian verification method, consent wording/version/withdrawal, minimum data,
retention and deletion, processors/locations/transfers and required permissions.
The review reference records that external decision; the database does not
establish the review's legal adequacy.

Keep all release flags false during schema and isolation verification. Do not
open countries with a bulk update. A global flag alone never opens a market.
An approved country alone never authorizes an individual guardian or lesson.
Policy acceptance, migration application, signed playback verification and the
owner's activation decision remain separate from merging this code.

## Verification

`node scripts/kids/test_market_release_migration.mjs` runs the actual migrations
in isolated PostgreSQL with synthetic accounts. It checks all countries closed,
stale/invalid requests, confirmed email, anonymous/non-admin denial, request and
profile isolation, country approval, minimum review receipt, editorial access,
paid entitlement, closure and guardian revocation. It never connects to production.

The parent request and parent-state Vitest tests cover the form contract,
required acknowledgments, Arabic locales, account switches and unavailable backend.
Both suites are included in CI. A passing isolated test is not a production receipt.
