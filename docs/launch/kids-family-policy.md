# Kids family policy preparation

The family subscription is independent of adult plans and covers up to three
child profiles. The first two lessons per level remain free within the existing
guardian, market and content gates. Adult entitlements do not unlock Kids.

| Market | Monthly | Annual | Monthly with Pro/Pro Plus | Annual with Pro/Pro Plus |
| --- | ---: | ---: | ---: | ---: |
| Egypt (EGP) | 199.00 | 1,990.00 | 179.10 | 1,791.00 |
| International (USD) | 7.99 | 79.90 | 7.19 | 71.91 |

Prices exclude tax. The 10% discount affects Kids only. Final Kids amounts round
half-up to the currency's minor unit. The UI displays catalogue quotes, not a
checkout, an entitlement grant or a verified billing eligibility decision.
Billing must derive eligibility from trusted subscription records. Eligibility
timing at renewal, handling an adult cancellation during a paid Kids term, tax,
Stripe product/price IDs and checkout remain separate integration work.

## Family limit

The fifth prepared migration, `20260925160000_kids_family_profile_limit.sql`,
enforces at most three profiles per parent in a database trigger, serializes
inserts per parent with a transaction advisory lock, and prevents ownership
transfer. Creation requires READ COMMITTED isolation so a retained transaction
snapshot cannot undercount after waiting for the lock. The form also disables
additional creation at the limit. Deleting an
own profile frees a slot. The migration does not delete existing records or enable
any market. Apply only after the existing privacy/editorial/deployment gates.

## Automatic parental verification

The intended normal path is automatic approval after successful guardian
verification and recorded consent, without routine manual admin approval.
The earlier human-review flow is a transitional implementation, not the target
policy or a claim that a human reviewer is legally required.

Before replacing it, the server integration needs a selected verification method
accepted for each released country, authenticated/idempotent result delivery,
binding to the requesting account and country, a versioned consent receipt,
withdrawal/revocation and failure/expiry behavior. Email confirmation and the
adulthood checkbox alone are not that evidence. No automatic approval endpoint
or vendor integration is claimed by this change; the existing gates remain.

## Expiry retention

After the latest paid Kids entitlement expires, retain child profiles and
progress for 90 days, then delete automatically after notifying the guardian.
A renewal supersedes the old expiry; a notice for an old term cannot authorize
deletion for a newer term. Never-paid free families are outside this paid-expiry
rule. An earlier parent erasure request follows its own process, not a forced
90-day wait.

`evaluateKidsRetention` is a side-effect-free policy evaluator. It requires a
delivered notice for the same expiry before the 90-day deadline; missing, stale,
invalid or late notice leaves the candidate blocked. It is not a deletion job.
Before activation, set the notice channel/lead time, late-notice grace period,
and treatment of continuing free use after paid expiry. Implement delivery
receipts, retries, a server-side renewal recheck under transaction lock, processor
and backup handling, and a tested deletion receipt. A scheduler must not call a
delete based on a stale quote or client-supplied dates.

There is no payment activation, notification sending, scheduled deletion,
production migration, guardian auto-approval or production release in this slice.
