# Technical furniture integration — 2026-10-05

Owner authorization: execute and publish the integration. Pronunciation listening remains an owner task and is not claimed as accepted.

Source: `experiment/furniture-pilot-20261003`, immutable handoff `87728437970170a0cb28bda536fddcaf6c1340ee`. Original handoff and PDF/video revision receipts are retained in `docs/experiments/technical-education/`. This is the first technical path, not the entire future vocational catalogue.

## Delivery contract

- `/technical/curriculum` retains the same curriculum shell as AI/Kids; its 80 rows open `/technical/learn/:lessonId`.
- Existing single account, menus, transparent logos, other-line choices, AI tiers, Kids consent and payment review flows are preserved.
- Authenticated first lesson `M01-L01` is Free. Other lessons require the independent `technical` entitlement, a verified TEST Stripe technical subscription, or administrator access. AI Pro/Pro Plus and Kids never grant technical access automatically.
- Technical prices reuse the published Pro Plus catalogue, without granting AI Pro Plus: EG monthly EGP309/year EGP3090; international monthly USD12.99/year USD129.90. Existing manual transfer, receipt preview/review, coupons, invitations and confirmation mail support the technical package. Phone verification remains deferred; the existing recorded-phone redemption limit is retained.
- Content: 320 four-context packages served by the authenticated `technical_command` RPC from private cloud tables. Quiz keys and explanations are excluded from delivery; server grading records account progress. Practice drafts are separate by locale; read/quiz/practice progress is shared across the same user's localized lesson. The lesson guide uses authored reference answers.
- Videos: original 320 Bunny GUIDs, including all four composite locale keys. No encoding, upload, audio regeneration or adult-video-registry replacement.
- PDFs: original 644 files, private `technical-downloads` bucket, exact authorized manifest, five-minute signed download links. Import uploads and downloads every file to verify its original SHA-256 before enabling the release.
- Illustrations: 1000 original explanatory SVGs at `/technical-assets/`; no public PDFs or paid lesson JSON payloads.
- Account deletion includes technical progress and pending technical mail. The installed worker already reconciles all subscriptions for the mapped Stripe customer. Technical financial receipts retain the same 15-day erasure deadline; shared content is preserved.
- TEST Stripe only. Technical paid invoices queue one immutable account email per invoice; existing protected scheduled welcome worker processes it with authorization, bounded retries and provider idempotency. Portal management uses the same mapped customer.

## Operations sequence

1. Merge the reviewed source after normal CI. Do not merge the experiment wholesale or restore its old Navbar.
2. Apply migrations `20261005100000`, `20261005101000`, `20261005102000` in order. No global commerce, account deletion, Kids or Stripe-mode control change.
3. Run `bun run scripts/technical-education/import.ts` with existing server-only Supabase credentials. Never print credentials. Expected receipts: source SHA above, imported 320, uploaded 644, verified cloud hashes 644, release enabled true. This is repeatable without duplicating lessons or assets.
4. Deploy exact reviewed functions: `technical-stripe-checkout`, `billing-stripe-webhook`, `billing-stripe-portal`, `account-welcome-job`, `commerce-invitations` (shared technical mail labels).
5. Build preview, verify protected/visitor navigation and four locales, then publish the same approved snapshot. Verify the actual production URLs separately.

## Validation evidence

Local production build succeeded with a larger Node heap. TypeScript and Edge checks passed. Authenticated data/price/access/quiz/drafts/Stripe/mail/refund/deletion tests use isolated databases and mocked providers. All 320 package mappings and 644 original PDF hashes are checked. Existing commerce regression runs against the extended schema; navigation/commerce UI regressions are included. Existing contextual visual verification remains 400 assets/100 lessons/four locales.

Cloud import, deployed function versions, CI, actual production publication and owner listening acceptance must be recorded after their own checks; local checks do not establish live acceptance. Broader platform launch NO-GO remains separate.
