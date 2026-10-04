# Unified payments, groups, invitations and offers

Isolated change from `8af11334a6d57c808d9746b15d9045d40d7c47db` on `feat/unified-payments-groups-20261004`. This is the new bounded commerce task. `ACCEPTANCE-EXPLANATION-PAUSE-12`, launch NO-GO and unrelated Kids work remain paused. This conversation now owns integration and execution, as explicitly directed by the owner. No merge, deployment, production migration, production setting change, real invitation or payment is included in this delivery.

## Behavior and impact

- `/admin/commerce` manages methods, groups, recipients, payment review, independent access, offers, suppression, exports and administrator history. `/payments` provides the customer's own orders, private receipts, offer redemption and access. `/invitations/$invitationId` requires verified sign-in and explicit acceptance.
- The existing Pro/Pro Plus and Kids purchase buttons preserve Stripe checkout and add configured manual methods. Administrator access is only in the administrator interface. Paymob remains unavailable at UI, command and database boundaries.
- A server quote fixes the catalogue price, currency and one offer before an order. Unconfigured manual destinations cannot create orders. The order preserves its instruction snapshot and unique reference. A receipt only changes review status. An administrator must verify actual funds, amount and transaction reference. Approval is independent of entitlement activation.
- A confirmed payment records one gross amount. Group allocations attach amounts to explicit recipient orders. Partial allocations do not activate access. Administrators can later allocate the remaining balance of the same payment without recording another payment. Recorded refunds are bounded by each allocation or unallocated balance and require verified actual repayment.
- Stripe retains its existing customers, subscriptions, events, invoices, checkout and discounts. No external payment or gift creates a Stripe object. External orders, grants and source-owned entitlements are independent. Access takes the strongest currently valid package; quotas take the largest valid allowance, never a sum. Expired/revoked gifts cannot remove another source's paid access. Stripe handlers cannot revoke the new sources.
- Pro grants the canonical 71 adult lessons and excludes Builder; Pro Plus grants 100. Kids is a separate package using the existing guardian, country, consent, profile and approved-content gates. Adult purchases never issue Kids access. The existing eligible adult-subscriber Kids price benefit is applied once unless an explicit offer is selected.
- Invitation acceptance deadline and access duration are independent. Default access starts at verified acceptance after required funds are confirmed. Selected dates and starts after existing access expires are supported. Manual renewal always creates a new payment order.
- Import supports CSV/XLSX, pasted addresses, template download, mapping, group defaults, row overrides/exclusion, local and server validation, existing-subscription warnings, batch offer-limit conflicts and downloadable errors. Parsing rejects formulas, macros, encrypted files, external references and excessive ZIP expansion. Import writes no payment confirmation, access or email.
- Complimentary invitations and public/email-bound offers support package-specific periods. Existing temporary grant/coupon mechanisms are retained rather than widened: the new records do not relax their identity or 72-hour policies. Paid offers reserve capacity until payment/expiry/cancellation; creation does not consume redemption. Confirmed consumption remains counted after refunds/revocation and required financial erasure via an anonymous campaign counter. Per-email history is erased under the existing deletion policy.
- Individual invitation messages reuse the four existing locale brands. Queue and dispatch are explicit, batches can pause/resume, and one durable outbox record exists per invitation. Provider acceptance, delivery, recipient acceptance, funds confirmation and activation stay separate. The existing verified receipt endpoint handles delivery events without a new signing secret. Opt-out, suppression, invalid/deleted recipients and pause are checked before sending. Uncertain sends stop before the provider's idempotency window expires and require provider-log reconciliation, rather than automatic duplicate mail.
- Receipts are private, limited to the verified owner/authorized admin and downloaded through an ownership check on every request. JPEG/PNG/PDF are validated by size, MIME and signature (5 MiB maximum). Hash and transaction-reference reuse require review. A retention manifest precedes object upload so an uncertain upload remains tracked.
- Account deletion immediately removes new access/invitations and retains owned financial records until the existing 15-day deadline after completed account/Auth deletion. The financial worker removes private receipt objects before completing erasure. A group's other orders and allocations survive member deletion; its payment is removed when no remaining allocations require it. Existing protected-account, family/Kids and account suspension safeguards remain.

The future provider contract is `UnifiedPaymentProvider` in `src/lib/commerce/contracts.ts`: create with an idempotency key, verify notification evidence, reconcile, and refund/cancel its own source. OCR is not confirmation. No Paymob adapter is implemented.

## Changed files

The five `2026100401*_commerce_*.sql` migrations own the data model, commands, access composition, receipt/mail privacy and LC09 retention integration. New application code is under `src/lib/commerce`, `src/components/commerce` and the three new routes. Existing checkout/navigation/locales only receive entry points. The route tree is regenerated by the installed generator, including its ordering changes. The three routes are classified as private in the existing SEO catalogue, use noindex/nofollow, and are excluded by robots rules. The billing RPC migration inventory explicitly includes the additive migrations without weakening its historical checks.

`supabase/functions/commerce-invitations` is the explicit admin-authenticated sender. Existing `masaarat-mail`, account lifecycle worker and verified delivery-record function are extended. The existing Stripe handlers, lesson media, content and unrelated Kids UI are unchanged. `fflate@0.8.3` is made a direct dependency at its already installed version. The existing deletion fixture SQL is exported for native disposable testing without changing its schema sequence.

`scripts/commerce/browser-check.mjs` renders the real components with synthetic local RPCs, shipped CSS and all external requests blocked. `docs/commerce/evidence` contains its results/screenshots. `.github/workflows/commerce-validation.yml` runs the scoped tests on disposable PostgreSQL 16, including true concurrent transactions.

## Local verification snapshot and current review

Local checks passed: TypeScript, changed-file ESLint, Edge entrypoint TypeScript, immutable action reference validation (147 references), migration replay with the installed billing/LC09 fixture, build including roadmap and mandatory asset verification, 135 scoped regression tests and 50 existing Stripe billing tests. The receipt-object retention case was subsequently strengthened and passed. Chromium covers all four locales at 375px and 1280px with synthetic manual quote/order, import preview and confirmed-balance allocation.

The native PostgreSQL concurrency case is intentionally skipped locally without `COMMERCE_NATIVE_DATABASE_URL`; the scoped CI runs it on disposable PostgreSQL 16. Current exact-head workflow results and the authoritative delivery status are tracked in [draft PR #137](https://github.com/cabicci/viva-ai-systems-55d35820/pull/137) and the existing project registers. Native Supabase Storage HTTP authorization, signed-in end-to-end acceptance and production behavior are not established by synthetic browser/fixture checks. Those require an authorized integration environment and existing eligible test accounts; do not create another acceptance account or repeat completed real email tests.

Follow-up verification adds `scripts/commerce/native-storage.test.ts` to the existing disposable Supabase CI job. It exercises the shipped authentication middleware, input validators, receipt handlers, database RPCs and real Storage HTTP with ephemeral local Auth fixtures. It checks ownership, administrator attachment, forged tokens, private/public/signed URL denial, invalid uploads, pending access and repeated confirmation. Only framework dispatch is adapted in-process; this is not full browser/route HTTP acceptance. The harness refuses hosted endpoints or owner credentials and sends no email or real payment. Production application code, migrations and configuration are unchanged by this follow-up. Its current result is tracked on the reviewed PR head, separately from the earlier successful fixture/browser checks.

At draft creation: implemented locally and local checks passed. Integration review and exact-head CI are tracked in PR #137; this document is a local evidence snapshot. Not merged, deployed or production verified by this delivery. Stripe remains TEST. No launch acceptance is implied.

Reproduce scoped checks:

```sh
bun install --frozen-lockfile
bunx tsc --noEmit
bunx vitest run src/lib/commerce src/components/commerce/commerce-ui.test.tsx
bunx vitest run --config vitest.billing.config.ts
NODE_OPTIONS=--max-old-space-size=6144 bun run build
node scripts/commerce/browser-check.mjs
```

The browser requires installed Playwright Chromium or `COMMERCE_CHROMIUM_PATH`. Native concurrency accepts only a disposable localhost/127.0.0.1 database named `commerce_test`; never use a production URL. Migrations use transactions and fail if installed function signatures, catalogue or private Storage policies do not match expected contracts.

## Owner configuration required

Supply actual InstaPay address, Vodafone Cash number and/or bank account details, instructions, permitted currencies, public payment QR image URL if wanted, and which methods should be available. No destination has been invented. Manual methods default disabled. The existing package catalogue remains authoritative; administrators provide explicit group discounts and allocation amounts. Specify offer renewal applicability, campaign dates/limits and invitation deadlines.

The existing Supabase authentication/service client and existing Resend sender/credentials/signature are reused. This change does not request Vault, another protection token, signing rotation or private credential setup. No additional backup requirement is introduced.

## Prepared production migration sequence (not executed)

1. After integration authorization, confirm approved head/CI, installed prerequisite migrations, published Pro/Pro Plus policies and canonical lesson counts. Check the existing Storage policy guard against the intended Supabase environment. A guard failure is a specific configuration conflict to resolve; never bypass it by granting public receipt access.
2. Apply the five migrations in timestamp order. Each file is atomic. Confirm `commerce_control.enabled=false`, `invitations_enabled=false`, `access_enabled=true`, empty commerce records, private receipt bucket and RPC ACLs. Do not change Stripe TEST.
3. Deploy the updated account lifecycle worker before allowing any receipt upload so its existing retention job understands object manifests. Deploy the new invitation endpoint with verified JWT and existing email configuration, plus the application from the approved commit. The endpoint and new flows remain disabled by the database gates.
4. Enter owner-supplied manual instructions through the authorized administrator UI. Rehearse signed-in ownership, receipt storage/download denial for another existing account, manual approval/retry, overlapping Stripe access, Kids guardian access and multilingual mobile behavior in the authorized test environment. Use synthetic funds/evidence only; no real invitation sends/payments or protected-family modifications.
5. A separate authorization is required to enable new orders/invitations in production. Keep `invitations_enabled=false` unless sending is explicitly authorized. Verify the served SHA, deployed function versions and applied migrations independently; deployment alone does not establish production verification.

## Prepared rollback / stop procedure (not executed)

Stop new activity with `commerce_control.enabled=false`, `invitations_enabled=false` and all groups paused. Keep `access_enabled=true` to honor valid access already issued. This leaves existing Stripe access and new valid paid/granted access intact. Wait for any in-flight mail lease/outcome before retrying/reconciling; never reset an unknown send automatically.

Before production data exists, failed migration files roll back their own transaction; diagnose/fix the failed file before continuing. After orders/payments/receipts exist, do not drop tables or blindly restore prior authorization functions: that would remove paid access or evade retention. Use a reviewed forward correction, retaining the source records and ownership composition. If the web UI is reverted, keep the updated LC09 worker and required database wrappers until all retained receipt objects/finance have passed their existing deadline. Financial timing and protected-account rules remain unchanged. No rollback action was performed during implementation.
