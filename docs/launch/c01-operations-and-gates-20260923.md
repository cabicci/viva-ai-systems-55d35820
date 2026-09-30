# C01 release operations and gate evidence — 23 September 2026

## Current continuation — 30 September 2026

This section supersedes the remaining-action wording in the historical handoff
below. It preserves the accepted evidence; it does not declare commercial GO.

- Main after PR #120: `559a82a7e36769e700974e102488b7e29751c241`.
  The Billing evidence checker is fixed. CI `36703452558` and disposable
  Billing `36703452382` passed on `a0d3dcc964b56be1f916ce56a5567fe52eab11ad`:
  175 / 23 / 1 tests in phases A / B / C, with no skips. No deployment was
  requested for this validation-only change.
- LC-10/12's scoped contact acceptance is closed in Report 55: production
  ALLOW at `2026-09-24T09:39:06.125742Z`, correlated HubSpot creation at
  `09:39:06.267Z`, and isolated DENY without increment. PR #62/CI
  `35989050188` passed and merged at `d69335fc53a0f1c71b8036df7cdedecaa0d272c8`.
  Server secret operation is an inference from that successful route, not a
  direct secret-presence inventory. Do not repeat the contact submission.
- Khalil is the sole incident responder and rollback decision maker. A backup
  person is not required. The existing hourly task `6aaaa016cacc8191bae3ddab4227c586`
  was observed disabled and resumed at `2026-09-30T10:44:30Z`, changing only
  `is_enabled` to true. Its existing read-only prompt and Africa/Cairo schedule
  remain intact. This proves resumption, not delivery of an incident alert.
- Recovery evidence from 18–19 September is accepted within its recorded scope.
  The final encrypted database export is the last step after code/release
  decisions. Key custody is Khalil's personal Google Password Manager. Convert
  the 32-byte binary key locally to reversible text, verify the round trip,
  and record only custody and checksum evidence, never key material.
- Password recovery PR #117 is merged. Its deployment request was pending;
  inbox receipt, reset-link behavior and deployed source SHA remain separate
  final-round receipts. Project SHA and `is_published` do not prove them.
- Kids changes are paused. Keep the accepted 36 Egyptian-Arabic lesson starts
  for the owner test grant; do not generalize to ordinary guardian purchases
  or repeat a complete media check. Stripe remains TEST. Live PR #52 stays
  separate and inactive; LC-09 PR #53 remains a request-only draft.
- The owner declined installing Codex Security. Use the available dependency
  advisory check, relevant access-control regression tests and focused source
  review. Never label these as a Codex Security scan or a full penetration test.

### One final manual review round

| Receipt | Prepared action | Evidence and failure handling |
| --- | --- | --- |
| Password reset | One authorized adult account receives its localized recovery message and opens the reset link | Record actual inbox/time, correct name/locale and successful reset flow; if delivery fails, inspect this one message's provider status and keep the gate open |
| Incident notification | Khalil confirms one explicitly labelled test notification through the existing alert destination, without simulating a site outage | Record sent/received times and recipient acknowledgment; if absent, repair that destination rather than duplicate the production watcher |
| Release and rollback | Record the final candidate SHA and hosting deployment ID, plus the previous accepted hosting version available for rollback | Require hosting evidence binding the deployment to the reviewed source; select that previous version only for a real regression or an approved nonproduction drill; never restore DB merely to revert UI |
| Changed runtime smoke | Sign-in/session refresh and the affected adult Free/Pro/Plus routes, Builder denial/allowance, and the four locales on mobile/desktop | Use existing account grants with their limits recorded; no repeat of closed lessons/media or real payment; one scoped defect leads to one targeted correction |
| LC-09 policy | Review the request-only draft and the financial/CRM retention schedule in its design document | Do not promise completed erasure, enable a finalizer, apply this draft, or delete Auth while parent cascades and retention are unresolved |
| Final recovery point | After the above decisions, create one fresh encrypted DB export and verify key custody/round-trip conversion | Record schema/time/checksum/export result; reuse the accepted isolated restore; separately state Storage and runtime secrets coverage, RPO/RTO and backup expiry |

### Operational response

Khalil records the affected route, UTC time, deployment ID, payment mode and
sanitized error. The technical work checks the changed component and proposes
one concrete repair. An unverified release is never called a known-good
rollback merely because its source compiles. Select a previous hosting version
with accepted runtime evidence and matching source metadata. If that mapping
is unavailable, preserve the current deployment and prepare the reviewed
source as a candidate rather than guessing a rollback target. For billing,
block new Checkout at the existing server gate while preserving signed webhook
reconciliation. Do not trigger a real financial operation in this TEST work.

### Prepared key custody conversion

`scripts/recovery/key_text_roundtrip.py` writes a 64-character hexadecimal
copy of an exactly 32-byte binary key to a new local file, verifies the written
round trip, and prints no key. It creates the file with mode 0600 on POSIX and
refuses to overwrite an existing file. Four tests use synthetic keys only.
At the final backup step, Khalil runs it on his own device, stores the text in
his personal Google Password Manager, then verifies decoding a retrieved copy
back to the same original 32 bytes. Remove the temporary text copy after
confirmed custody; preserve the binary key needed by the accepted backup tool.
No real key or new backup was handled in this source preparation.

Proposed launch recovery targets for the final review: RPO 24 hours and RTO
4 hours for the database-backed service, with a daily encrypted export and
30-day rolling ciphertext retention. These are planning targets, not measured
service guarantees or an approved legal retention policy. A recurring export
is not yet configured; one final snapshot alone cannot meet a continuing RPO.
Confirm export automation, storage quota/owner, key retrieval, and separate
object Storage/secrets recovery before claiming these targets are covered.

Historical evidence follows unchanged.

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
