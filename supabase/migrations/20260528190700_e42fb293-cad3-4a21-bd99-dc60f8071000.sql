
UPDATE public.roadmap_items
SET status = 'done', completed_at = now()
WHERE id = '291326a7-0b3f-4776-8b13-30cdfa112827' AND status != 'done';
