## Phase 9.6 Production-Preview Re-QA Plan

Verify ar-EG cookie reset edge case at commit `557b0eb` without modifying code or publishing.

### Steps

1. **Read locale code** (no edits) to confirm expected cookie/URL behavior:
   - `src/lib/locale/locale-cookie.ts`
   - `src/lib/locale/resolve-locale.ts`
   - `src/lib/locale/resolve-public-locale.ts`
   - `src/components/locale/*` (selector)
   - `wrangler.jsonc` for preview command

2. **Build production bundle**: `bun run build`

3. **Start production preview** (Wrangler/Workers preview, not Vite dev) in background, wait for readiness on its port.

4. **Drive Playwright** against the preview at `http://localhost:<port>/learn/intro/intro-m1-l1-what-is-ai`:
   - Clear cookies → load bare URL → assert ar-EG default render, no cookie or default cookie
   - Click خليجي → assert URL `?locale=ar-Gulf`, cookie `masaarat_locale=ar-Gulf`, Gulf content
   - Click مصري → assert URL bare (or valid ar-EG), cookie cleared or `ar-EG`, NOT `ar-Gulf`
   - Refresh → assert ar-EG persists, no stale cookie
   - Reopen bare URL → assert ar-EG still loads
   - Verify English and MSA selector paths still work
   - Confirm no `?previewLocale=false` query anywhere
   - Check console for hydration/client-entry errors

5. **Stop the preview server** explicitly.

6. **Return report**: PASS/FAIL, runtime command used, per-step cookie + URL + selector behavior, refresh result, server-stopped confirmation, and confirmation no code/publish changes were made.

### Constraints honored
- No code edits, no publish, no generate, no OpenAI, no Supabase/Bunny/Remotion/RAG/assistant/mission/video touch, no workflow runs.
