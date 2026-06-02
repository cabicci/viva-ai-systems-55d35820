# Orphan Bunny Videos — Audit & Decision

Last audit: 2026-05-28

## What's an "orphan"?

A GUID in `src/lib/bunny-videos.ts` whose key does NOT match any lesson
file in `src/components/intro/lessons/*.ts`. Orphans waste Bunny storage
and confuse the registry.

## Audit method

```bash
ls src/components/intro/lessons/*.ts | xargs -n1 basename | sed 's/\.ts$//' | sort > /tmp/lesson_files.txt
grep -oE '"[a-z][a-z0-9-]+":' src/lib/bunny-videos.ts | tr -d '":' | sort > /tmp/bunny_ids.txt
comm -23 /tmp/bunny_ids.txt /tmp/lesson_files.txt   # orphan videos
comm -13 /tmp/bunny_ids.txt /tmp/lesson_files.txt   # lessons missing video
```

## Current state (2026-05-28)

- **Total Bunny videos:** 98 GUIDs registered (95 originals + 3 aliases).
- **Lessons without video:** 0 (excluding `index.ts` which is the barrel file).
- **Orphan GUIDs:** 0 — the 3 legacy keys (`choose-your-path`,
  `first-prompt`, `setup-your-ai`) are kept and re-exposed via
  `intro-*` aliases pointing to the SAME Bunny GUIDs. Same video, two
  registry keys, no duplicate upload, no orphan. The legacy keys are
  frozen — do not delete them and do not point them at different GUIDs.

## Policy

1. Never delete a GUID from `bunny-videos.ts` without verifying the Bunny
   video is not referenced anywhere (`rg <guid> src/`).
2. When renaming a lesson id, add an alias entry in `bunny-videos.ts`
   pointing to the existing GUID instead of re-uploading.
3. Run the audit method above after any bulk lesson rename or video
   upload, and update this file with the new date.