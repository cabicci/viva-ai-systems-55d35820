---
name: Orphan videos needing Remotion re-creation
description: 9 lessons (7 intro + 2 builder) have Bunny videos but no .gen.ts source — to be rebuilt with the same pipeline as the other 86
type: feature
---
# Orphan lessons missing Remotion source

These 9 lessons are LIVE on Bunny Stream and work fine in the app, but have NO `.gen.ts` source in `remotion/src/lessons-generated/`. Means: can't edit the video without rebuilding from scratch.

**Decision**: rebuild ALL 9 using the same pipeline as the other 86 videos (build-lesson.py → script_writer → gemini_tts → Remotion render → Bunny upload) so the whole library is uniform. Do this when the user says to start.

## Intro (7)
1. `ai-can-cannot`
2. `ai-vs-software`
3. `choose-your-path`
4. `first-prompt`
5. `learn-without-fear`
6. `setup-your-ai`
7. `what-is-ai`

## Builder (2)
8. `builder-m2-prompt-layer` — "تشريح الـ Prompt / طبقة البرومبت"
9. `builder-m8-queries` — "Queries: ازاي بتجيب البيانات"

## When rebuilding
- Use the same `build-lesson.py` pipeline as the other 86.
- Output `.gen.ts` to `remotion/src/lessons-generated/`.
- Upload new mp4 to Bunny → get new GUID → update `src/lib/bunny-videos.ts` (replace the old GUID for the same slug key).
- Keep old Bunny videos for 1 week as safety, then delete.
