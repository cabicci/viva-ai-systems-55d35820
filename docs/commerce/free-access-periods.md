# Scheduled free access periods

An administrator can open multiple AI paths and curricula together for a fixed
shared interval. This is not a per-user trial, coupon, subscription or email grant.
Learners must sign in with a verified, available account. The interval is
`starts_at <= database now() < ends_at`; no cron or first-visit timestamp is used.

## Administration

Use **Admin → Commerce → Free access periods**. Select any combination of current
catalogue targets, enter a name and Cairo start/end, then save. Multiple overlapping
periods compose by union. Stop early disables only that period; edit/resume uses
the row's loaded version. A competing edit requires refresh/review before retry.
An uncertain retry retains its UUID and exact parameters, so it cannot multiply
offers or audit events. The server rechecks stored administrator authority.

The selector reads the current database catalogue on load, refresh and focus.
AI paths derive from `billing.commerce_lesson_catalog`; academic curricula derive
from **every** `academic_courses` row, including newly added drafts. Technical
furniture and Kids are the current separately released catalogues. A future new
product type needs its own authoritative catalogue/access adapter; merely adding
a checkbox must never grant content the server cannot authorize. New draft
academic curricula appear immediately but retain their publication restrictions.
Selecting an individual path does not silently select the entire AI programme.
Choosing the entire AI programme covers newly catalogued AI lessons/paths too.

Cairo local times are converted with `Africa/Cairo` timezone rules. Missing or
repeated clock-change minutes are rejected; UTC is stored. Client wall-clock
changes cannot prolong a grant: readbacks use server-relative monotonic deadlines.

## Access composition

- Paid tier, subscription/payment records and AI allowances are unchanged.
- AI lesson/video evaluation gains only the explicitly selected lesson scope;
  assistant runtime/RAG and builder tool privileges are unchanged.
- Academic and Technical compose the new commercial alternative with existing
  authenticated, lifecycle, release and approved-locale checks.
- Kids retains guardian, country, profile ownership, publication and consent
  checks. It receives no child-data release or consent override.
- Expiry/early stop never deletes learning progress. Independently paid access
  remains valid. An offer does not rewrite progress or completion prerequisites.
- Previously downloaded material cannot be recalled. Existing signed media URLs
  retain the provider's normal lifetime; new protected requests recheck access.

The learner snapshot expires at the next boundary or within 30 seconds, whichever
is sooner. Refresh begins before expiry; failed reads close only campaign access.
Already open free Academic/Technical deliveries have the same short readback
deadline, without resetting it on rerenders/remounts or discarding draft inputs
after a successful refresh. Paid deliveries receive no new timer. Kids checks its
protected SQL gate during an offer and at the observed end, preserving paid family
access. Browser suspension/offline operation cannot authorize new server requests.

## Database candidate and release boundary

`scripts/free-access/free-access-candidate.sql` is a review/rehearsal candidate,
**not an automatically executed production migration**. Local integration tests
apply it after the repository's cumulative commerce, Technical, Academic, Kids
admin review and email-access candidates in a disposable database. No production
schema, writer, release switch, provider or payment action is part of this change.

Before a separately authorized deployment, verify installed definitions against
the tested prerequisites (including email-access), rehearse the SQL on a disposable
copy and capture backup/function definitions. The candidate fails transactionally
if expected commercial composition points have changed. Apply once; do not replay
or wrap functions repeatedly. Deploy backend before frontend, with no active offer
created by installation. Use the normal reviewed migration process for the actual
release; do not rename this candidate into a migration and apply it blindly.

All new private tables have RLS and no browser table grants. Public RPC execution
is authenticated-only; administrator commands also check the stored admin role.
Private/cloned functions explicitly revoke browser and service-role execution.
Attribution belongs to shared configuration rather than learner ownership;
Auth removal unlinks attribution without deleting offers used by other learners.

## Verification

Run TypeScript, scoped ESLint/format checks, the cumulative commerce DB suite,
`free-access*.test.*`, `AdminFreeAccess.test.tsx`, entitlement and affected
Academic/Technical/Kids/journey regressions, then the repository's normal build.
The roadmap record is `1d6dff16-fa66-4ab0-a2b8-e0126d383857`.
Tests use synthetic accounts and disposable databases; never real learner activity.
