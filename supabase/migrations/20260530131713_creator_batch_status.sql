-- Mark Creator Batch 1 done
UPDATE public.roadmap_items
SET status = 'done', completed_at = now(), updated_at = now(),
    notes = notes || E'\n[ai-edit 2026-05-30]: خلصت ✅ run 26683095344، 7/7 lessons رفعوا على Bunny.'
WHERE id = '39e2f761-5712-4465-aad6-555a269307fd';

-- Mark Creator Batch 2 in_progress
UPDATE public.roadmap_items
SET status = 'in_progress', updated_at = now(),
    notes = notes || E'\n[ai-edit 2026-05-30]: Triggered run 26684785340 على cabicci/ai-ecosystem-hub-72-5bf9f6ff (lesson-video.yml).'
WHERE id = 'ab279b5f-5cc1-491b-b4ff-5945bc460f82';
