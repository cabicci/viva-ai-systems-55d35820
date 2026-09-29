# Masaarat Kids: current product and release state

As checked on 2026-09-29 against the connected production database and the
published site. This document supersedes the *preparation* state in
`kids-market-gates.md`, `kids-consent-lifecycle.md`, and
`kids-family-policy.md`. Those documents record earlier migration boundaries;
they are not the current launch switch or parent journey.

## Parent journey

1. A visitor can see the Kids overview and all three level lists without an
   account. The public catalogue returns only approved, digest-checked lesson
   names for the selected locale. Lesson bodies, quiz answers and signed video
   links are not public.
2. The parent signs up for one Masaarat account and confirms its email, or logs
   in with an existing account. There is no second Kids account.
3. In `/kids/family`, the parent chooses a country of residence, declares
   adulthood and parenthood, reads the current children's privacy notice and
   accepts it with an unchecked checkbox. The server records a versioned
   attestation and approves this request. The policy is also available at
   `/kids/privacy` and its record in account data; an approved parent is not
   asked to accept it on every lesson page.
4. The parent can create up to three short-named child profiles. Each profile
   belongs to one level. The selected profile stays active across lessons until
   the parent uses **Exit child profile**. A profile of another level cannot
   open the current level's lessons.
5. The first two lessons in each level need the same approved parent and
   profile gate, but no paid Kids entitlement. Lessons 3–12 additionally need
   a current independent family entitlement. Adult Pro access alone does not
   grant Kids lessons. Lesson content and Bunny playback each independently
   check the same server-side grant; the content response checks the approved
   SHA-256 of the private JSON before returning the student subset. A signed
   Bunny embed URL expires after five minutes.

## Operational observations

The production database returned `kids_public_launch_open() = true`, the
global child-data and lesson-access controls both `true`, 22 open market rows,
and 88 enabled policy rows (22 countries × four locales). Approved lesson rows
and mapped media rows both counted 36 for each of `ar-EG`, `ar-MSA`, `ar-Gulf`,
and `en`: 144 lesson/media pairs in total, with no malformed approval hashes.
The existing parent account displayed three profiles and a protected lesson
with its text, activities, quiz, help and Bunny player. A prior full production
pass verified the 36 Egyptian Arabic Kids lesson routes and all 144 HLS first
segments; do not rerun that entire media sweep for an unrelated UI copy change.

On first paint, the old public component displayed a false temporary-closure
warning until the launch RPC resolved. `KidsReleaseNotice` now waits for the
server answer; an actual closed or unavailable signal still fails closed.

## Payments and retention

Kids checkout accepts Stripe **test** keys only. The server derives market,
adult-plan discount, currency and amount, and the signed webhook controls paid
entitlements. Prices are created in Stripe test mode as needed: a single
existing price row does not imply all variants were pre-created. The public
pricing page shows the monthly and annual catalogue for Egypt and
international customers and links from Kids. No live charge or live payment
activation is in this launch scope.

The retention control currently has both email notices and automatic deletion
disabled. The public privacy text says the 90-day process is prepared and
automatic deletion has not begun. The controls must not be turned on without
the separate delivery, recovery and processor-erasure procedure described in
`kids-retention-operations.md`.

## Release checklist

- Merge only a clean candidate with CI and the frozen browser/video gates
  passing; a unit test or mapped GUID is not proof that the actual player works.
- Deploy the three Kids Edge Function CORS updates, the new public
  `kids-catalogue` names endpoint, and the site build.
  Only `masaarat.ai`, `www.masaarat.ai`, and this project's exact Lovable
  preview origin may receive browser responses. Keep JWT, profile grant,
  digest, Bunny signing and token restrictions in place.
- Confirm the preview parent session, selected profile, protected lesson and
  signed player, then publish and confirm the same journey on production.
- Keep Stripe in test mode. Do not turn on the retention scheduler or deletion
  while completing this Kids site release.
