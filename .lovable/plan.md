# Verification result: Meta never delivered the three 10:56 tests

## What the read-only checks found
- **Requests to the live site:** no POST from Meta reached /api/public/support-meta after 10:26:01 UTC. No webhook was received for any of the three tests.
- **Support records:** no reply row was created after 10:50 UTC (none accepted, ignored or failed). Nothing was sent and no echo occurred.
- **Facebook comment 1149564044132875:** it exists, was written at 10:56:19 UTC, and has no reply from the Page.
- **Instagram comment 18661724704021592:** it exists, was written at 10:56:26 UTC, and is on an owned normal post (not a Reel). It has no reply from the account.
- **Instagram Direct:** the Page's Instagram conversation list is empty through Graph (0 conversations, no error).
- **Address and routing:**
  - https://masaarat.ai/api/public/support-meta answers directly with no redirect. An unsigned request is rejected with 403, which is the correct signature check.
  - Only www.masaarat.ai redirects (307), and Meta is not configured to use it.
- **Meta setup (checked earlier today, unchanged by us):**
  - The app is subscribed for the Page (messages, message_echoes, feed) and Instagram (messages, comments), both pointing to the exact masaarat.ai address.
  - The Page lists Masaarat Support as subscribed.
- **App review / app mode:** not readable through the API available to the project. Unknown.

## Conclusion
- There is no address, redirect, signature or field mismatch on our side.
- The missing deliveries happen at Meta before sending. This most likely depends on the app's mode or review: outside Live mode with Advanced Access, Meta only delivers comment and DM events for app-role users.
- Instagram DMs also need "Allow access to messages" turned on in the Instagram app. The empty conversation list is consistent with that being off.
- I can't confirm either point from here.

## Owner steps in Meta (no project changes)
1. In the Meta App Dashboard for Masaarat Support:
   - confirm the app is in Live mode;
   - confirm Advanced Access for pages_read_user_content, pages_manage_engagement, instagram_manage_comments and instagram_manage_messages;
   - otherwise, confirm the tester accounts have app roles.
2. In the Instagram app, go to Settings > Messages > Connected tools and turn on "Allow access to messages".
3. In Webhooks for the Page and Instagram products, use the dashboard "Test" button for one field. Then I check the receipt read-only.

No code, settings, scheduler or messages change under this plan.
