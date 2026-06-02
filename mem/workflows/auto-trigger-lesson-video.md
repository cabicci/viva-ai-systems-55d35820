---
name: Auto-trigger lesson video on content change
description: After ANY edit to a lesson file under src/components/intro/lessons/, immediately trigger the GitHub Action to rebuild the video with the new content
type: preference
---
# Auto-trigger lesson video build

**Rule (user-stated):** أي تغيير في محتوى درس = AI يبعت تلقائي لـ GitHub Action علشان يعيد توليد الفيديو بالمحتوى الجديد. مفيش انتظار لأمر يدوي.

## How

After editing ANY file under `src/components/intro/lessons/*.ts`, run:

```bash
bash scripts/trigger-lesson.sh "<lesson-id-1>,<lesson-id-2>,..." --force-script
```

- Lesson ID = filename without `.ts` (e.g. `learn-without-fear`, `builder-m1-what-is-llm`).
- Batch all edited lessons in one comma-separated call (matrix runs serial, max-parallel=1).
- Always pass `--force-script` so the script regenerates from the new content (cache bypass).
- The script needs `GH_PAT` env var (already in Supabase secrets — exported in sandbox).

## When to skip

- Pure cosmetic edits to non-content fields (icon swap, tone change) — no narration change.
- Edits to files outside `src/components/intro/lessons/` (registry, types, runtime).

## When in doubt — trigger.
The video build is async + idempotent; cost of re-render << cost of stale video.