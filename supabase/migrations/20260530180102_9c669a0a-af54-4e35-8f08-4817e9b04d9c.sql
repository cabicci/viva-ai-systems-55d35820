UPDATE public.roadmap_items
SET status = 'done'::roadmap_status,
    completed_at = now(),
    updated_at = now(),
    notes = notes || E'\n\n[ai-edit 2026-05-30]: تم التأكد إن كل الـ lesson_ids بتاعت الباتش ده موجودة فعلاً في src/lib/bunny-videos.ts. الفيديوهات اتحملت على Bunny قبل كده، الباتش متقفل.'
WHERE id IN (
  '2868778a-fde4-4107-b863-dd3f825c4113',
  '39e2f761-5712-4465-aad6-555a269307fd',
  '7cfbed97-9e5f-45d4-97e2-34ab28467833',
  'f5670237-6333-48f8-ba69-1be9051197e7',
  'a220fa92-3db1-48e8-b933-01db1914b1c9',
  'ab279b5f-5cc1-491b-b4ff-5945bc460f82'
);