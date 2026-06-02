UPDATE public.roadmap_items
SET status='done',
    notes='Audit جاهز (95 درس): كلهم ≤ 8 دقايق بناءً على عدد الكلمات @ 140 wpm.
- أطول 5 دروس: builder-m7-sessions-jwt (7.6m), builder-m8-relations (7.5m), builder-m10-first-users (7.2m), builder-m9-embeddings (6.9m), builder-m10-deploy-domain (6.9m).
- التوزيع: 54 درس بين 3-5 دقايق، 41 درس بين 5-8 دقايق.
- مفيش أي درس محتاج تقسيم/اختصار، فمفيش re-generation للفيديوهات مطلوب عن طريق GitHub Action.
- الأوديت اعتمد على Arabic word count داخل الـ string literals × 140 wpm (معدل النطق المصري).'
WHERE id='9457e775-b6ac-4e00-80c1-6b9232489ff3';