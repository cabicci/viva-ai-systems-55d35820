---
name: Bunny Stream video hosting
description: How all 95 lesson videos are hosted (Bunny Stream), how the renderer resolves them, and how to add/replace videos
type: feature
---

All lesson videos are hosted on Bunny Stream (NOT in `public/`).

## Architecture
- **Library ID**: `670679` (public, hardcoded in `src/lib/bunny-videos.ts`)
- **API Key**: `BUNNY_STREAM_API_KEY` secret (server-only, for upload scripts)
- **Registry**: `src/lib/bunny-videos.ts` exports `BUNNY_VIDEO_GUIDS` (slug → GUID) and `getBunnyEmbedUrl(lessonId)`
- **Renderer**: `src/components/intro/IntroLessonRenderer.tsx`
  - `lessonVideo` block: looks up GUID by `lessonId`, renders Bunny `<iframe>`. Falls back to `<video>` + "coming soon" placeholder if no GUID.
  - `video` block (explicit url): also auto-upgrades to Bunny iframe if URL matches `/lessons/intro/{slug}.mp4` and slug exists in registry.

## Adding a new video
1. Upload to Bunny Stream (dashboard OR upload script using `BUNNY_STREAM_API_KEY`). Endpoint: POST `https://video.bunnycdn.com/library/{LIB}/videos` then PUT binary to `/videos/{guid}`.
2. Copy the returned GUID.
3. Add line to `BUNNY_VIDEO_GUIDS` in `src/lib/bunny-videos.ts`: `"lesson-slug": "guid-here",`
4. In the lesson file, use `{ block: { kind: "lessonVideo", caption: "..." } }` — slug auto-resolves.

## Replacing a video
- Upload new version → get NEW GUID → update the slug's value in `bunny-videos.ts`.
- Don't delete the old Bunny video immediately (1-week safety window).

## Upload script reference
Working script lives at `/tmp/bunny-upload.mjs` during sessions (not committed). It iterates `.mp4` files, creates+uploads each, saves GUIDs to `/tmp/bunny-guids.json`. Resumable (skips slugs already in JSON).

## Important
- `public/lessons/intro/` is empty (videos deleted). Old files still in git history.
- Embed URL format: `https://iframe.mediadelivery.net/embed/{LIB}/{GUID}?autoplay=false&preload=true`
- Lesson slugs must match registry keys EXACTLY (case-sensitive).
