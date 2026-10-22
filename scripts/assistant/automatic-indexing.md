# Automatic preparation of approved assistant content

Course integrations use the existing course contract, registry, protected source
adapters and subscription rules. They do not install a separate assistant.
Content must already be approved in its authoritative source. This worker does
not approve teaching material, infer subscriptions or rewrite course content.

After successful main CI, and periodically for approved database imports, the
trusted-main workflow asks the platform to reconcile current source metadata.
The platform discovers native cards from the compiled registry and Academic
cards from the existing course registration. Missing approvals or incomplete
locales create a held job before provider work.

Each immutable job belongs to one card, source manifest and indexer version.
One source scope runs at a time. Existing matching vectors are reused. A durable
reservation precedes each new embedding request. Completed scopes are retained
across scheduled runs. A lost response or expired request is held for review;
neither a schedule nor a new source/build manifest automatically repeats an
uncertain paid request for the same card. Other cards can continue after the
outstanding lease ends.

Publication checks the current approvals, every completed source receipt and
the actual complete index in one transaction. Null, zero, incompatible, missing,
changed or extra index data prevents publication. Existing learner entitlement
checks and Academic commercial/release settings remain authoritative.

## One-time deployment

1. Review and install `automatic-indexing-candidate.sql` only after the existing
   assistant preparation schema. It creates private service-only queue tables
   and functions, with the worker disabled.
2. Install `automatic-publication-candidate.sql` after the reviewed native and
   Academic provenance prerequisites. Installing these functions activates no
   card and changes no content or subscription.
3. Deploy this server implementation and verify its actual runtime, source
   coverage and permissions before enabling `assistant_auto_policy.enabled`.
   This installation policy is deliberately separate from recurring work.

The maintenance endpoint accepts only `status` or a single `tick` request ID.
It verifies GitHub's signed short-lived identity before importing privileged
dependencies. Repository IDs, protected branch, workflow path, event, issuer,
audience, expiry and signature must match. Human login tokens and request-body
content are not accepted. Database and provider keys stay in the existing
server environment; the workflow receives no persistent service credential.

For a held request, inspect its source/job/attempt receipts and actual stored
index before deciding recovery. Do not clear leases, reset jobs or rerun a paid
request solely because time has passed. Disable the worker or exclude an
affected card when operator review is necessary. Ordinary source imports must
not edit the queue, runtime flags or security functions.

## Validation

The automatic identity, manifest, driver, worker and database tests cover signed
identity rejection, source discovery, unchanged content, lost responses,
reservations, holds across revisions and atomic native/Academic publication.
Database tests use disposable PostgreSQL with pgvector and require no live
provider calls. Full repository CI and deployment smoke tests are still required
before installation and activation.
