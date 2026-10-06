# Academic written-first integration

Pinned workstream handoff: `7b93d7d707c382c3b2ffc654ece60d43701733c1`.

`manifest.json` contains only the 160 source identities and 160 original PDF SHA-256 identities. Original PDFs remain outside GitHub in the existing private workbook bundle. The importer reads lesson bodies from the already-committed owner-specified workstream source. The PDFs were recovered from the existing `Masaarat_Academic_Review_Workbooks.zip`, without rendering or regeneration. This directory is server/import source; it is never imported by a client route or copied into public assets. All rows remain unapproved and all media mappings are deliberately null. The source workstream and running media workflow are unchanged.

Run `bun run scripts/academic-integration/import.ts --check --pdf-root PRIVATE_DIR` for offline identity/hash/PDF coverage checks. This command never contacts a service.

## Release sequence

1. Merge reviewed code after required CI. Merging is not publication or content approval.
2. Apply the four `2026100611*` migrations, in filename order, through the existing recorded migration mechanism. Do not replay existing Technical migrations. They add the Academic tables and extend current commerce/LC09 contracts; a changed installed definition must fail and be reviewed, never bypassed.
3. Obtain independent academic and contextual acceptance for the exact delivery. Record `source`, `deliverySha256`, `academicAccepted: true`, `contextualAccepted: true`, `reviewReference`, `reviewer`, and `acceptedAt` in the actual review receipt. Do not fabricate that receipt. Learner timing evidence and any claims remain separate acceptance work.
4. Use `bun run scripts/academic-integration/import.ts --apply --pdf-root PRIVATE_DIR --acceptance REVIEW.json` in the approved server environment. It refuses absent/mismatched acceptance, an active course, a public bucket, changed existing content, or differing PDF bytes. It verifies every cloud payload and PDF. It never enables courses, approves database rows, activates the assistant, or changes a video mapping.
5. Explicitly register accepted content and course release only after integration acceptance. Deploy `academic-stripe-checkout`, the existing webhook/portal and existing welcome worker together with the reviewed migrations. Use existing server credentials; do not add a Vault/secret/cron/backup. Preserve all current methods and other-line rights.
6. Complete actual TEST checkout, webhook/renewal/refund, protected signed PDF and receipt/notification/invitation journeys using designated TEST identities, plus four-locale browser acceptance, before public deployment. Local fake-provider tests and disposable SQL tests are not those production checks. No real email sends or charges are part of the local checks.
7. Publish only after the documented gates. Until then, keep AC-BUS disabled, content unapproved, assistant disabled and Academic pages noindex. Canonical base price uses Pro Plus prices with independent rights. Assistant price/quota/provider remains undecided and no assistant purchase is implemented.

## Media follow-up

Run `37451264552` belongs to `work/masaarat-academic-20261005` at `f6617cfcf7ac7aa72284b0144baeb4bda81f753b`. Preserve its branch and active run. Retrieve `academic-course-media-collection` when available (14-day retention); run the existing exact-source collector against receipts without dispatching production or retrying successful outputs. Check exact course/lesson/locale/source SHA, fingerprint, Bunny identity, duration and playback readiness before a bounded follow-up mapping update. An uploaded video is not an activated site mapping. Never replace a non-null existing identity or use a pilot/other-locale fallback. Missing tabs remain hidden and autoplay stays off.

## Recovery

This slice does not remove existing data or change existing prices. Before activation, course disablement keeps new content/purchases closed. If a deployment needs rollback, disable the new course and restore the previous application/functions; retain private data and financial receipts. Do not drop the new financial tables, reset any deletion clock, or re-run historical account deletion. Existing financial retention remains 15 days after completed Auth/account deletion. The optional assistant remains disabled throughout.

## Administrator review before public acceptance

Owner requested completion of the real catalogue and administrator access on2026-10-06. Apply `20261006120000_academic_admin_review.sql` after the four earlier Academic migrations. `--stage-review --pdf-root PRIVATE_DIR` imports the exact original source and private PDFs for stored administrators, without claiming academic acceptance. `--stage-content` stages and hash-verifies only the written packages when PDF transfer is unavailable; it explicitly reports zero verified PDFs and pending PDF import, creates no bucket/asset rows and sends no PDF bytes. Both modes keep `enabled=false`, `approved=false`, the assistant disabled and all video mappings unchanged. `review_enabled=true` is set only after the relevant cloud checks pass.

Normal accounts cannot see review catalogue titles, lessons or files. Stored admin role and account eligibility are checked server-side on each request. Catalogue caching is scoped to account identity, and review visibility never opens payment controls. The accepted `--apply --acceptance` flow still requires the independent review receipt. Review access does not authorize public release.
