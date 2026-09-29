# Kids lesson diagnosis (read-only findings)

## Observed
- Source: 879f61c6 (PR #115). Latest build log: build OK, no build errors.
- No runtime, console or network logs were captured from the owner's preview session, so the visible error text cannot be observed.
- Preview /kids/level-1/1?locale=en: 401 without a Lovable login (expected, preview is private).
- Local sandbox route: 200. masaarat.ai route: 200 (page shell only; the deployed commit is not proven).
- The lesson itself needs a signed-in parent; no delegated session was used, so the first failing request (content or playback) is unobserved.

## Known likely cause for preview
- Bunny library 761387 rejects the preview origin (403), confirmed earlier. The account key needed to add it is unavailable.

## Next step (needs your approval)
1. Owner opens the lesson once in preview, then I read the new error logs. Or you allow one test with a delegated session.
2. If the error is the video player 403: add the preview hostname under Allowed Referrers in Bunny (library 761387 → Security), or add the Bunny account key as a secret.
