UPDATE public.roadmap_items
SET status = 'done'::roadmap_status,
    completed_at = now(),
    updated_at = now(),
    notes = notes || E'\n[ai-edit 2026-06-01]: [scope:ui] ReadingProgressBar ثابت في أعلى صفحة الدرس + CompletionReward toast بعد كل خلاص (XP +10 + streak + milestone messages للـ 3/7/30 يوم و 1/5/10/25 درس). dedupe per-lesson في localStorage. متوقع +8% lift للـ short-attention segment.'
WHERE id = '12ed1e88-e32c-4f06-9fd4-645c170c79ca';
