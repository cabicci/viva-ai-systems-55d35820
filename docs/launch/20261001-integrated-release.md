# 1 October 2026 — sole integration and release ownership

Khalil assigned one owner for merge, deployment, production configuration and
the two authoritative registers. This does not approve a pending irreversible
operation or a new email send. Other workstreams hand over their work and
evidence; they do not independently release changes after this assignment.

## Reconciled current sources and production

| Surface | Verified state | Integration consequence |
| --- | --- | --- |
| PR #53 | Open Draft at `b0b5b839`; previous exact-head CI431, native deletion15 (11/11), Billing224 (175/23/1) passed | Prepared deletion remained disabled, unmerged and absent from production. A later integrated head needs its own receipts. |
| PR #126 | Merged as `2c86cc9b`; localized Auth email direction fix | Preserve the shared RTL/LTR shell, confirmation/reset URLs and locale selection. Source acceptance is separate from received-email acceptance. |
| PR #127 | Merged as `d86274fd9609d048b27161dacd638565c0f4f7d9` before the ownership assignment; head `503de907` passed CI435/36914867428 | Preserve automatic displaced-session `scope: local`, manual sign-out and initial claim ordering. Billing227 was SKIPPED by its existing filter, not a new Billing pass. Two-browser production acceptance is still open. |
| Contact mail | The two tables and four service-only RPCs are present; RLS enabled, anon/authenticated access denied, delivery receipts cascade through their outbox | Do not reapply the already deployed contact migrations or recreate the provider webhook. Preserve provider ID/recipient binding, deduplication and negative outcomes. |
| Contact transport | Live GET405/unsigned POST401 for both functions; two controlled ar-EG owner tests have `email.delivered`; no pending outbox or active lease at inspection. Marketing's received handoff supplies Gmail inbox IDs | No repeat sends. Inbox arrival is accepted as handoff evidence; visual acceptance remains open. Final handoff confirms `CONTACT_MAIL_ENABLED=false`, no schedule and no website publication. |
| Deletion production | Request RPC, control and lifecycle absent; worker GET/POST404 | No production deletion proof exists. Name both deletion migrations, the worker and Kids Checkout coordinator in any separately approved production operation. |

Controlled contact evidence: outbox IDs
`7c1e0a52-3b6d-4f8e-9a21-c0a7ac700001` (support) and
`7c1e0a52-3b6d-4f8e-9a21-c0a7ac700002` (sales), created at
19:37:27 UTC. Provider IDs `01a0f8f8-c3f6-74fc-90d9-e6fff97efac8` and
`01a0f8f8-c4d9-758e-9857-2138c500ce61` have delivered receipts at
19:37:29 UTC. Read-only checks confirmed the exact authorized owner recipient
and controlled test labels without exposing the stored message content.
Marketing's received handoff records inbox arrival at 19:37:28 UTC and Gmail IDs
`1a0f8f8c8dc50a0a` and `1a0f8f8c99a465c9`. The temporary allowlisted runner was
removed. These accepted transport tests must not be repeated.

GitHub main remains `d86274fd`; current Lovable metadata and the QA handoff point
to `fe511e6c36af68576025091e7a0dd4b8d920aed6`. Its only source delta from main
is the generated contact tables/RPC TypeScript definitions. Preserve it in the
candidate. Neither metadata nor a merge establishes the production-served SHA.
The deployment-generated Drizzle migrations in commit `d739f86d` match the
canonical contact Supabase migrations, except for their final newline. They are
already-applied operational artifacts, not an additional pending schema change.
Their source history is retained; do not run both migration systems or import
the empty generated Drizzle schema as an application database replacement.

## Interaction correction in the integrated candidate

The review reproduced an erasure gap: an existing welcome/subscription sender
lease did not hold deletion. The regression failed against the former SQL.
The candidate preserves the installed v1/v2 welcome and subscription claim
functions in place, adds the account lifecycle lock before their row locks,
skips blocked-account queues and waits for existing sender leases before
reconciliation or erasure. An Auth confirmation/audit transaction remains
valid while its mail enqueue is suppressed. Existing completion RPCs remain
available so an earlier sender can record its result. Contact mail keeps its
same recipient guard and receipt handling.

Auth hard deletion and financial replay guards have different jobs: an issued
JWT can remain valid until expiry, so the database/Checkout/AI guards must stay
in place. PR #127's local browser sign-out does not replace those guards. A
Realtime event or missing device row is not used alone as proof of account
deletion; the final browser case checks cache clearance and denied server
requests explicitly. See the primary Supabase documentation:
https://supabase.com/docs/guides/auth/managing-user-data and
https://supabase.com/docs/guides/realtime/postgres-changes.

The native cumulative test executes the actual pause SQL, checks that access
stays blocked and Auth stays present, then resumes the same durable stage after
the synthetic lease expires. No restore or backup is prepared or required.

## Current decisions and approval boundaries

- The owner cancelled every backup requirement. Do not request a backup or
  recovery key, recreate that gate, or describe its cancellation as a successful
  technical backup check. Existing archive buckets/files are not deleted.
- Kids is included in account/family deletion. Other Kids work stays paused.
- Stripe stays TEST. No live payment operation is included.
- Keep the prior separate HubSpot decision. No HubSpot record deletion is
  approved by this integration assignment. Finance field/expiry/hold/purge
  policy and the named responder still need their specific decision.
- The signing secret appeared in an existing tool-operation record during
  handoff retrieval. No secret value belongs in this document or a register.
  Rotate/rebind it in the protected provider/server environments before final
  mail activation; that production security operation requires its own
  confirmation. Do not rotate unrelated API keys or replay accepted emails.
- No source merge, deployment, configuration change or real deletion is claimed
  by this reconciliation. Exact new-head checks belong in PR #53 and the two
  authoritative registers before a release decision.

## Accepted QA fixes in this candidate

The owner explicitly authorized the coordinator to complete the three known QA
fixes. Login now distinguishes server-coded invalid credentials, unconfirmed
email, rate limits, connection failures and unknown errors in all four locales.
Only invalid credentials show the contextual reset prompt. A rejected request
settles loading and permits retry without leaking raw provider details. Labels
are associated with the email/password fields; password-manager autocomplete
uses `username`/`current-password`. The Free CTA routes a signed-in user to the
existing dashboard and an anonymous visitor to signup. Billing and lesson
entitlements are unchanged. Focused UI regressions fail against the former
source; they do not diagnose the earlier production fetch/email hypotheses.

## Received handoffs and remaining independent evidence

| Chat | Information still needed after independent verification |
| --- | --- |
| UI/Auth/session work | Received: PR126/127 heads, merge receipts, changed files, source tests, Lovable types delta and three UX findings. QA is read-only; the coordinator implements the accepted fixes. Remaining final acceptance: production version, two-browser displacement/restoration and actual received Auth email layout. The old login/email causes remain unresolved. |
| Marketing/mail work | Received: deployed source d2002c8e, two already-applied migrations, service-only ACLs, webhook c6c8a671-9128-4304-b65c-7f8dbaffc2e1 with six outcome events, verified mail domain, tracking disabled, sender false/no schedule/no site publish, runner removed and two real Gmail inbox IDs. Remaining: existing-message visual review and coordinator-owned security/configuration/automated-operation acceptance. |

GitHub merge state, database ACLs and the two receipt IDs are already verified;
do not ask the other chats to repeat those checks. Their handoff must distinguish
an action submitted from one completed and independently accepted. The owner
does not relay routine coordination updates. The coordinator maintains the
consolidated remaining-work list in the two original registers, integrates
source changes directly and records one final acceptance round.

## One final acceptance round

Execute once after the integrated candidate passes required checks and each
specific production/policy operation is authorized. One owner records the
outcome; a failure reopens only its affected case.

| Order | Case | Required acceptance evidence |
| --- | --- | --- |
| 1 | Release provenance/configuration | Exact deployed source and migration set; previously deployed mail migrations preserved; flags/schedules recorded; no cancelled backup gate. |
| 2 | Registration/recovery mail | One owner-approved locale case, actual received RTL/LTR layout and working confirmation/recovery URL; existing confirmation delivery is reused where sufficient. No unsolicited extra messages. |
| 3 | Two browsers | Browser B replaces A; A retires locally; B remains usable. Record the genuine failed request if any. Do not equate this with the earlier unknown Failed to fetch cause. |
| 4 | Contact mail | Reuse the two delivered support/sales tests; owner confirms inbox, sender/reply-to/locale/appearance. Rotate and verify signing binding before activating routine sending; no duplicate test sends. |
| 5 | Controlled account/family deletion | Exact disposable account UUID separately authorized for deletion; synthetic family only; block adult/Kids/Checkout/AI, settle provider/mail leases, erase learner/family/mail/storage/Auth, verify completion. Never substitute the owner's real family. |
| 6 | Stale/late and retry | Previously issued token cannot read/write/recreate paid or family access; signed late payment keeps only approved receipt data; expired worker lease resumes; unrelated account/family unchanged; client clears obsolete privileged state. |
| 7 | New registration and pause | A new UUID at the same email inherits no prior progress/entitlement; the pause procedure does not restore access or erased records. Billing and Kids wider pauses remain intact. |

Until those cases and the specific finance/security/deletion decisions close,
LC-09 and overall launch remain open. Passing source tests is not production
acceptance.
