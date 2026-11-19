# Lock the support pilot allowlist to the two approved test comments

## Verified (read-only)
- Instagram: the pilot tester is the author of comment 18575619226073544. That comment belongs to Reel 18118806677170189.
- Facebook: the pilot tester is the author of comment 1166151455766994. The selected media is already photo 122127622173478914.
- Neither tester was matched by name. Each is a one-way hash of the account ID taken from the official Graph comment object.
- Old comments are never answered: anything older than the pilot start (19 Nov 10:35 UTC) is ignored.
- A send with an uncertain outcome is never retried. Such an event stays recorded as "ambiguous" and the shared idempotency check refuses it from then on.

## Change
1. Remove the extra Instagram match by @username hash. The pilot will then recognise a tester only by the account ID from the approved comment. Drop the empty `instagramUsername` field from the pilot scope.
2. Add a test that an Instagram comment from a different account using the same username is not answered.
3. Add a test that an "ambiguous" send result is not sent again on the next scheduled run.
4. Restore the platform's automatic changes (package.json, bun.lock, previewAuthStorage.ts, types.ts) to the support release 5c8cb79c, using the platform's version restore. Git restore is now blocked.
5. Run the support tests and the production build, then publish the support-only change.
6. Report:
   - the commit;
   - the publish time;
   - the next scheduler run result;
   - that new test comments or DMs can be sent.
