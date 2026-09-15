# B023 exact-commit disposable verification

This harness verifies the contextual image build/module graph and all 16 frozen real-browser cases against an isolated Supabase instance on a GitHub runner. It does not deploy, migrate a hosted database, publish images, merge a PR or use real accounts.

The workflow checks out the exact PR head, not GitHub's synthetic merge commit. Manual dispatch requires the selected workflow commit to equal `expected_product_sha`. All build/browser receipts bind that same clean commit. Keep this harness in a separate child commit of the complete atomic image checkpoint so the original 546-path image change remains independently reviewable.

## Helper layout

- `local-guards.mjs`: clean candidate identity and local URL/public-key guards.
- `build-with-module-graph.mjs`: original product build and active client graph observer.
- `fixture-login-and-gate.mjs`: one temporary Auth/admin fixture, real form login, frozen browser gate and fixture cleanup.
- `browser-network-gate.mjs`: unchanged accepted gate, SHA-256 `adc7d2add0d0951a7349300144ce2b4aa7b4ef9a5c3c6c7e1b5cc474932a8c49`.
- `ci-local-environment.mjs`: external disposable directories and masked credentials from **local CLI status only**.

## Verification sequence

The workflow reuses `scripts/billing/prepare-disposable-supabase-tree.ts` and Supabase CLI `2.109.1`, matching the existing Billing validation workflow. Only a new runner-temporary directory is passed to that preparer because it replaces its destination. Product migration bytes remain unchanged; the existing disposable-only realtime ownership adaptation remains explicit in its receipt.

Dependencies use `bun install --frozen-lockfile`. The installed repository Playwright CLI installs its matching Chromium build on the GitHub runner. No browser or Docker installation is performed on Dell.

The local Supabase API must be `http://127.0.0.1:54321`; the product preview must be `http://127.0.0.1:4173`. Client and SSR receive the same local URL/public key before the build. The raw CLI status and startup/preview logs remain private in the temporary runner directory.

The original B023 build sequence is checked exactly. Vite keeps the existing product configuration and plugins, with a read-only graph observer added. Client dependency closures begin at `IntroLessonRenderer`, the localized package adapter and `GalleryGrid`. The receipt rejects reachable legacy visual resolvers/assets and checks that contextual resolution uses JSON metadata without importing images.

The fixture runner creates a unique `@example.test` Auth user through the local admin API, inserts only that user's `public.user_roles(role=admin)` row, and logs in through the normal email/password form. It observes the exact returned user ID and the browser's successful `has_role` response. It saves only the storage state produced by normal login and supplies it to the unchanged 16-case gate. It then deletes the created user and credential file. No subscription or client entitlement is fabricated.

Preview and Supabase cleanup run with `always()`. The runner also removes any interrupted auth-state file. Uploads are limited to candidate, disposable-tree, build/module-graph, browser-network and fixture/cleanup JSON receipts. No complete temporary directory, state file, CLI status, raw log, service-role key or database password is uploaded.

## Receipt limits

This harness is a draft until its first successful execution and independent receipt review. A workflow definition or passing syntax check does not prove its runtime APIs/configuration.

The frozen matrix covers 4 lessons × 4 locales. It does not navigate the image gallery; gallery locale behavior remains a separate runtime-test claim plus the graph check. Browser success proves local preview image selection/decode and legacy-request exclusion, not production authentication, video playback, payments or launch readiness.

Review/execution must resolve these environment-specific assumptions:

1. Supabase CLI status JSON exposes `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY`; missing/changed keys fail closed.
2. The local service-role API can create an Auth user and insert the existing public `user_roles` row. The normal dashboard issues the observed `has_role` request before the fixture timeout.
3. Vite's `createBuilder().buildApp()` delivers the observer to the `client` environment, and all three roots are emitted. Missing evidence fails the build receipt.
4. The Cloudflare/TanStack preview serves the real local login and lesson routes with the built local Supabase variables. Browser requests to external HTTP origins are blocked by the frozen gate.
5. GitHub runner Chromium dependencies and disposable Supabase startup fit within the job timeout. No repeated installs, broader audit or local Docker workaround is implied.
6. A forced cancellation can interrupt cleanup; GitHub's disposable runner is the outer isolation boundary. The normal gate child has a 180-second deadline and the step a six-minute limit.
7. `workflow_dispatch` availability for a newly introduced workflow still depends on GitHub recognizing the workflow. The PR event is the initial verification path; no main merge is implied merely to make manual dispatch available.

Do not label B023 browser verification complete until the exact-commit sanitized receipts show a successful build/graph result, all 16 real-browser cases, and successful fixture cleanup.
