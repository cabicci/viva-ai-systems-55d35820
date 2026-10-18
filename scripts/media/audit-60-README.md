# Audit 60 — weekly-review session duration

The Egyptian written schedule and mission describe a 30-minute review session. The prior curriculum/source/visual header said 15 minutes. The inspected Bunny poster already says 30 minutes, while its player title still says 15. A paused read-only inspection on 2026-10-18 showed a 167-second video; session duration and video runtime are separate.

The original 400-image manifest and original WebP remain untouched. The built-in image_gen edit is a separately named PNG under public/lesson-visuals/audit-revisions/2026-10-18/. Its source/base/new asset hashes, dimensions, method and draft visual review are recorded in contextualV2AuditRevisions.json. The browser resolver selects it only for the exact verified original lesson/locale/base hashes. Build verification checks original assets, the revised PNG, source fingerprint and orphan derivatives separately. Other locales retain their original mappings.

The curriculum title, source title, video-plan heading and caption now describe a 30-minute session. The existing timeline and task, reading estimate, Bunny GUID and video bytes are preserved. Image-gallery titles follow the effective audited mapping. The original manifest remains historical provenance and must not be repinned to disguise a changed asset.

## Separate Bunny title delivery

The live provider title is not changed by a frontend merge/publication. The exact metadata-only proposal is:
- library 670679; video f8236eba-21ec-41c4-aac2-0adbd7e32d09
- before: Review أسبوعي = ١٥ دقيقة
- after: Review أسبوعي = ٣٠ دقيقة (مدة الجلسة)

Use the existing approved server BUNNY_STREAM_API_KEY. The tool never reads a credential file, creates a secret or dispatches media production.
Run node scripts/media/audit-60-video-title.mjs --check for a read-only provider check.
After the exact batch is reviewed for delivery, --apply changes only the title field and verifies identity, duration and non-title metadata. It refuses an independently changed title, is idempotent and does not upload/re-encode or replace the video/poster.

The implementation follows the official [Get Video](https://docs.bunny.net/reference/video_getvideo) and [Update Video](https://docs.bunny.net/reference/video_updatevideo) contracts, read 2026-10-18. No provider write was executed while preparing this draft. Record the actual check/application receipt and re-read the player title after provider cache refresh before closing that delivery requirement.

