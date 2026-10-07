# My journey implementation — 7 October 2026

Owner approved the unified dashboard and the name رحلتي / My journey. Base: main 8b46ab3fe09987091d6d68d02bf42d4d93ec1acc. Canonical route: /my-learning; /dashboard redirects while preserving locale.

The page presents one AI path, the Technical furniture path, server-returned Academic courses, and separate child journeys. It reads existing completion data, counts only currently available steps, preserves server entitlement enforcement, and does not grant Builder to Pro. Admin Kids previews do not create child records or progress. The AI assistant and analytics remain linked from the AI card; administration stays in its existing separate menu.

## Durable resume and Kids completion

The additive migration 20261007072809_unified_learning_journey creates account/child-scoped resume bookmarks with RLS, server timestamps, and deletion cascades. It joins the existing explicit account-erasure inventory and reuses its read/write blocking during deletion. Bookmarks never grant access or imply completion. Consumers revalidate the stored lesson against their current catalogue and access. Existing progress is retained. Resume history begins when the new authorized lesson recorder is deployed; no historical visits are fabricated.

Existing Kids lessons had a progress table but no completion writer. An explicit learner/guardian completion button now writes that existing table through an ownership-checked function that reuses kids_can_access_lesson. This records completion of activities, not a quiz score, mastery or inferred video viewing. Marks remain locale-specific under the existing schema. Quiz answer selections are still transient; this change does not claim persisted quiz attempts. Admin preview is excluded.

## Verification

- 103 tests passed across 12 targeted files: summary/resume selection, four locales, Pro restriction, child separation, query errors, navigation, actual Technical/Academic SQL integrations, existing parent and lesson guards, and new migration RLS/idempotency/cascade tests.
- New migration tests run against a disposable PGlite database; they do not mutate production learners.
- Follow-up: all nine migration tests passed, including blocking bookmark reads and privileged writes during deletion. The existing native cumulative deletion test now asserts that own adult/child bookmarks are erased before auth deletion while the other family's bookmarks remain. CI revalidation is pending; this closes the missing inventory classification found by LC09-76.
- Technical test fixture was prepared locally with the existing import.ts --prepare command. No import/upload was performed.
- TypeScript passed; scoped lint passed with one existing Fast Refresh warning.
- Client/server build passed; roadmap and contextual-visual guards passed.
- Browser installation failed because downloaded Chromium archives were invalid/truncated. Visual desktop/mobile review and actual signed-in persistence on the deployment remain unverified.

## Release sequence

Keep this candidate separate from ongoing Academic video production. Review the additive migration and deploy it before the frontend. Use an authorized preview/test learner and two synthetic child profiles to verify resume across sign-out/sign-in and per-child completion in all four locales. Confirm ordinary paid access and admin access without subscription. Publish only after the pending visual/authenticated checks and release approval. This slice has not applied the production migration, merged main or published the frontend.

Rollback: restore the previous frontend; leave the additive bookmark table and existing Kids completion marks intact. Do not delete learner progress to roll back presentation. No lesson payload, media GUID, subscription, payment, account, consent or release flag was changed.
