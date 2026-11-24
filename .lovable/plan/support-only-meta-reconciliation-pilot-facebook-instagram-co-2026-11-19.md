# Support-only Meta reconciliation pilot (Facebook/Instagram comments + Instagram DM)

## Baseline (checked)
- The project tree equals the approved release a7737e08, apart from this plan file. The live site was published at 2026-11-18 10:14:59 UTC.
- Meta access (read-only, verified today): all needed permissions are granted on the Masaarat Page and the masaarat.ai Instagram account. The Page and Instagram webhook subscriptions are active and point to support-meta.
- The test people were identified from the owner-approved test comments and are stored only as one-way hashes:
  - the Instagram tester, from the Reel test comment;
  - the Facebook app admin, from the photo comment at 09:33:27, which was the only comment in that window.
- No support event has been recorded since 18 Nov 10:35 UTC.

## What gets built (support files only)
1. **Shared reply engine.** The per-item reply logic inside the Meta webhook handler moves into one shared function, used by both the webhook and the new reconciler. Everything else stays the same:
   - signature checks, the fixed Page and Instagram identity, echo and manual-takeover rules;
   - per-event idempotency, so the same comment or message ID claims the same row and the webhook and reconciler can never both answer;
   - quota, handoff, and per-post/per-person public threads versus private DM continuity.
2. **Question detection.** Public-comment question detection also accepts تفاصيل / التفاصيل / details / info.
3. **Brand and link guard.** Every outgoing reply must contain the official masaarat.ai link and the brand signature. Otherwise it is skipped, not sent.
4. **New reconciler** (`src/lib/support/reconcile.server.ts`), pilot-only:
   - Only selected media: the Instagram Reel 18118806677170189 and the Facebook test photo.
   - Only allowlisted tester hashes. Anyone else is never claimed or answered.
   - Comments: reads `/{media}/comments` with a small page size and at most 2 pages per run. It skips comments that already have a reply from our Page or Instagram account (own or human-answered), and comments created before the pilot start (no backfill).
   - Instagram DM: reads the Page's Instagram conversations, bounded the same way. It answers only when the latest message is the tester's and is under 24 hours old (the messaging window), using messaging_type RESPONSE.
   - Before sending, the comment or conversation is read again from Meta. The send happens only if it still exists, is still unanswered, and the window is still open.
   - Uses only public catalogue and offer facts through the existing answer generator; lessons are never loaded.
   - If Meta denies access (any permission or review error), that source is paused with a sanitized code and no workaround is attempted.
5. **New protected endpoint** `/api/public/support-reconcile`:
   - POST only, accepted only with the managed scheduler credential.
   - Added to the exact-path dispatch the same way as support-meta.
   - Always returns safe counters only.
6. **Tests:**
   - a duplicate comment arriving from both the webhook and the reconciler → one reply;
   - a new follow-up → a second reply in the same thread;
   - two runs at the same time → one runs (lock);
   - manual staff reply present → skipped;
   - non-tester or unselected post → ignored;
   - DM older than 24h → skipped;
   - Graph 403 → source paused;
   - missing link or signature → not sent.
   - The full support test suite plus a production build must also pass.

## Database (one new migration, 0066, support schema only)
- A table `support_private.reconcile` with one row per source (ig_comments, fb_comments, ig_dm) holding:
  - mode, which starts as `pilot`;
  - pilot start time, set at migration time;
  - durable cursor;
  - single-run lease;
  - paused reason.
- Three locked-down functions (begin with lease, advance cursor, pause), callable by the service role only. RLS stays on, with no public grants.

## Scheduler
- Repair the managed scheduling authentication (Lovable's own scheduler credential), then add one new job, `masaarat-support-reconcile-pilot`, that calls the protected endpoint every 5 minutes.
- That is 288 small runs a day. In exchange, a tester's comment is answered within about 5 minutes if the webhook misses it. The cost is a little backend time on each run, even when there is nothing to do.
- The existing welcome job is not touched.

## Release
- Apply migration 0066.
- Run the tests and build.
- Restore any automatic platform file drift.
- Publish the site. The only differences from the live version are these support files, the migration and the plan.
- No WhatsApp, Messenger-webhook, marketing, UI or budget changes.

## Report after build
- Commit SHA and migration ID.
- Scheduler job state.
- Latest pilot runs per channel (sanitized counters and status only).
- Blockers per channel.
- When a fresh test comment or DM from the approved testers can be sent.
