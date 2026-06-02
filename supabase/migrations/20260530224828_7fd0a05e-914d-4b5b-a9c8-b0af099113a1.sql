UPDATE public.roadmap_items
SET notes = COALESCE(notes,'') || E'\n[ai-edit 2026-05-30]: [scope:content] شُغّلت محاكاة الـ12 درس على 6 شخصيات بعد إصلاحات #2 (voluntary gate) و #3 (دقة تقنية). النتيجة: 0/6 abandoned, 6/6 سألوا المساعد, 1/6 quit طوعًا, متوسط الدروس المكتملة 0.5/12 (الـ finished flag بيتسجل قليل — يحتاج مراجعة منطق lesson_completed). التقرير: /mnt/documents/persona-sim-report.md',
    updated_at = now()
WHERE id = '9927ccd0-f853-4d1f-aee9-6032ca32df81';