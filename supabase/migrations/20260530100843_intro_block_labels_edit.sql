-- Rename block #5 eyebrow to "شوف بنفسك" + block #9 caseStudy eyebrow to "جزء من المنصة"
-- across all 7 Intro lessons. Cleaned the 3 screenshot titles that still said "Case Study —"
-- and prepended a path-link sentence to every caseStudy summary.
UPDATE public.roadmap_items
SET notes = COALESCE(notes,'') || E'\n[user-edit 2026-05-30]: renamed labels — screenshot #5 eyebrow → "شوف بنفسك" + cleaned 3 titles. caseStudy #9 eyebrow → "جزء من المنصة" (renderer + 7 lessons). كل summary بقى يبدأ بجملة "الجزء ده من المنصة اتبنى بمسار {Path}".',
    updated_at = now()
WHERE title ILIKE '%Case Study block%آخر بلوك%';
