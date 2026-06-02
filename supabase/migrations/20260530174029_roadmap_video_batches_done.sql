-- All 88 curriculum lessons have Bunny videos. Close all open video-render batches.
UPDATE public.roadmap_items
SET status = 'done',
    notes = COALESCE(notes,'') || E'\n\n[ai-edit 2026-05-30]: تم التحقق — كل دروس المنهج (88 درس) موجود فيديوهاتها في bunny-videos.ts. الـ batch ده مفيش حاجة محتاج تتعمل.',
    updated_at = now()
WHERE id IN (
  'ab279b5f-5cc1-491b-b4ff-5945bc460f82', -- Creator B2
  '7cfbed97-9e5f-45d4-97e2-34ab28467833', -- Automator B1
  '39e2f761-5712-4465-aad6-555a269307fd', -- Creator B1
  '2868778a-fde4-4107-b863-dd3f825c4113', -- Builder B2
  '057e2eb6-ca9f-42d2-bf90-5f9ab27b285b', -- intro B2
  'f5670237-6333-48f8-ba69-1be9051197e7', -- Analyst B1
  'a220fa92-3db1-48e8-b933-01db1914b1c9'  -- Business B1
);

-- Log the audit itself as an AI item.
INSERT INTO public.roadmap_items (title, status, notes, source, created_at, updated_at)
VALUES (
  'Audit: مطابقة دروس المنهج مع فيديوهات Bunny',
  'done',
  E'[source:ai]\n\nمقارنة كاملة:\n- 88 lesson_id في curriculum-data.ts\n- 88 منهم لهم GUID في bunny-videos.ts\n- 0 دروس ناقصة فيديو\n\nالـ batches اللي كانت مفتوحة (Creator B1/B2, Automator B1, Builder B2, intro B2, Analyst B1, Business B1) كلها كانت متعملة بالفعل قبل ما أزقّها. تم قفلهم بـ done.\n\nخطأ سابق: Creator B2 الـ dispatch run 26690364561 اتعمل cancel تلقائيًا — مفيش damage.',
  'ai',
  now(), now()
);
