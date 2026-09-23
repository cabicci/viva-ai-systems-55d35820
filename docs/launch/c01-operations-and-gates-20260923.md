# C01 release operations and gate evidence — 23 September 2026

Status: **NO-GO**. This is a release handoff, not a replacement for Report 40
or the authoritative `MASAARAT_CONTINUATION_REGISTER_2026-09-15.xlsx`.
Central owns updates to both trackers.

## Release baseline

- GitHub `main`: `1fff97b2305c32f88dc332dacfa8242053621199` (merged PRs
  #49, #48, #50). CI, B023, B024 passed on the accepted heads; Dedicated
  Billing V3 skipped on PR #50. Reuse earlier accepted Stripe TEST evidence.
- `https://masaarat.ai/contact` responded HTTP 200 on 2026-09-23 10:43 UTC
  with `x-deployment-id` including
  `0654e1f9-fe83-4384-8136-656e7d328a4d`. Lovable reports the latest
  project commit as the `main` SHA above, but the response does not bind
  deployment to source SHA. Deployed source SHA is **unverified**. Do not
  republish just to resolve that gap.
- The prior isolated database restore and encryption verification in Report 28
  are accepted. Its snapshot is from 18 September and does not establish a
  current recovery point, independent custody of the decryption key, Storage
  restore, secret recovery, or a full service RTO.

## Technical gate delta (no broad re-audit)

| Gate | Evidence reused or narrow finding | Remaining receipt |
| --- | --- | --- |
| LC-06/07 auth and entitlement | Existing SSR and Billing TEST reports; Pro=71, Builder restricted to Plus | Tie the precise SSR/entitlement receipts to the final release |
| LC-08 RAG RLS | Functional RAG acceptance preserved | Specific authenticated-read/RLS receipt is missing |
| LC-09 privacy deletion | Test-record cleanup is documented | Isolated account-deletion coverage for `billing.*` is missing |
| LC-10 secrets | Code references three contact server variables | Runtime *presence* of each remains unverified; no values should be displayed |
| LC-11/19 environment | Billing CI uses isolated PostgreSQL | Preview/Staging boundary to production remains unverified |
| LC-12 rate limit | Production function exists, service-role EXECUTE only | ALLOW from C02's one controlled submission; DENY only in isolated authorized bucket |
| LC-13 supply chain | This branch pins 138 action references in 17 workflows to verified commits and adds a CI pin gate | CI on this exact branch and merge are still required |
| LC-14/15 recovery | Report 28 isolated database restore accepted | Fresh encrypted snapshot, independent key custody, Storage/secrets scope and accepted RPO/RTO |
| LC-16 provenance | Deployment ID proven in live response | Source SHA of that deployment unverified |
| LC-17/18 operations | Billing rollback SQL exists; database restore rehearsed | Named responder, working alert, frontend/backend rollback drill and accepted DR contract |
| LC-26/27 payment | Full TEST acceptance retained | Mode-separated Live implementation, decision, controlled real transaction and refund |
| LC-35 final security | Prior checks retained | Final available security review after remediation with P0/P1 disposition |

The `public:contact-hubspot%` rate-limit bucket aggregate at 2026-09-23
10:43:12 UTC was zero rows. This is a point-in-time observation; C02 owns the
single submission allowance. Do not infer ALLOW, DENY, HubSpot delivery, or
server secret presence from this query.

## Incident and rollback draft

**Ownership to confirm:** primary incident responder, backup responder, alert
destination, who can turn off new Checkout, who can read Lovable/Supabase
logs, and who authorizes a production rollback. `info@masaarat.ai` is the
existing public contact point; it is not evidence of incident paging. Central
and Khalil must name people and verify one limited alert before accepting LC-17.

At an incident: timestamp and preserve the deployment ID, affected route,
request class, error and payment mode without collecting secrets or card data.
For contact failures, first inspect Turnstile, server variable *presence*,
rate-limit result and HubSpot response, while avoiding duplicate submissions.
For payment failures, stop **new** Checkouts at the server gate, preserve signed
webhook processing for existing subscriptions, and reconcile Stripe events
against billing records. For an application regression, select the last known
good release in the authorized Lovable workflow, check its exact source and
deployment metadata, then smoke-test affected routes. Do not replay database
migrations or restore production data just to revert UI code.

Recovery sequence: capture a fresh provider-backed logical export, checksum
and timestamp; encrypt it; keep ciphertext and key in independent controlled
locations; record custody without key material. Reuse Report 28's isolated
restore result but rehearse any **new** schema change against a disposable
database before production. Document that PostgreSQL snapshots do not by
themselves include object Storage or runtime secrets. Agree RPO, RTO, retention,
and an owner who can retrieve both ciphertext and key. No current fresh export
or off-device key custody was verified from this environment.

## Release acceptance still required

Correlate C02's UTC contact attempt with the rate-limit bucket, in-site result,
HubSpot record and actual notification separately. Resolve the security and
recovery receipts above; implement and test Live isolation before requesting
its activation approval. After C02 specifies any scoped event/code defect,
integrate only that change and run its affected gates. Freeze one final SHA,
prove the matching deployment where metadata permits, and smoke-test sign-in,
Free, Pro, Plus/Builder, learning task, four locales and mobile/desktop on
affected routes. Central alone decides GO/NO-GO and updates the two trackers.
