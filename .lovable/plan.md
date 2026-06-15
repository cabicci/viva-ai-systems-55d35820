## Plan: Publish latest main + verify lesson-audit exposure closed

### Steps
1. Check publish settings and current security scan status (read-only).
2. Call `preview_ui--publish` with `website_info_status=already_relevant` (no metadata changes requested; site info was verified in prior audit). No slug change. No file edits.
3. Wait ~60s for deploy to roll out.
4. Verify production via HTTP GET (curl) on:
   - `https://masaarat.ai/lesson-audit/all-lessons-audit.json`
   - `https://masaarat.ai/lesson-audit/cross-path-issues.json`
   - `https://masaarat.ai/lesson-audit/cross-path-issues.md`
   - `https://masaarat.ai/lesson-audit/`
   Expect 404 / no audit content.
5. Public smoke via browser preview + curl on `/`, `/login`, `/learn/intro/intro-m1-l1-what-is-ai`. Check console for errors.
6. Inspect a built JS asset hash to confirm new bundle is live (proxy for "commit deployed").
7. Produce the final 11-point report exactly as requested.

### Strict guarantees
- No file edits, no commits, no code/route/content/asset changes.
- Publish only — deploys whatever is on main (4055ced).
- Runtime verification only via curl + browser tools.
