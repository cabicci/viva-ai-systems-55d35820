# Meta support diagnostic, 19 Nov 08:02–08:08 UTC (read-only, no changes)

## Evidence
- No support event was recorded after 18 Nov 10:35:33 UTC. The last 4 events were all Messenger replies.
- There is nothing for Instagram DM, Instagram comment or Facebook comment in the test window.
- The published site's server logs for the last hour (which covers the test window) contain no request to support-meta.
- The site was published at 18 Nov 10:14:59 UTC and has no unpublished changes. The latest saved version before that time was ab5b13ac, whose contents match a7737e08. This is an inference and not a confirmed build ID.

## Result per channel
- Instagram DM: no request reached the site. Status and send error: none.
- Instagram comment: no request reached the site. Status and send error: none.
- Facebook comment: no request reached the site. Status and send error: none.

## Likely next step (owner, outside the code)
- Add the missing permissions: pages_read_engagement, pages_read_user_content, pages_manage_engagement and instagram_manage_comments.
- Confirm that the Instagram account is subscribed to the app's webhook (messages and comments).
