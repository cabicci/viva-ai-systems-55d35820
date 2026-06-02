UPDATE public.roadmap_items
SET status = 'done'::roadmap_status,
    completed_at = now(),
    notes = COALESCE(notes,'') || E'\n\n[done] أضفنا خطوة "فكّر الأول" في QuizBlock — الخيارات مخفية لحد ما المستخدم يضغط "فكّرت — ورّيني الخيارات". ده بيفرض active recall قبل الـ MCQ scan. اتسجّل برضو event quiz_predicted في learner_events.',
    updated_at = now()
WHERE id = '5ecd78a3-36b0-4047-ba61-24cbdac7241d';