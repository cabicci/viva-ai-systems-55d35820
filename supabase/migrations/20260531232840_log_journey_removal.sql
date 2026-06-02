-- Log removal of /journey route per user request (2026-05-31)
UPDATE public.roadmap_items
SET notes = E'[source:user]\n[user-edit 2026-05-31]: [scope:ui] حذف /journey بالكامل (route + sidebar link + استبدال 6 مراجع في الدروس بـ /dashboard). كمان شيل /curriculum من الـ sidebar (الراوت لسه موجود ومراجع كتير عليه). السبب: مكرر مع الـ dashboard widget.'
WHERE id = '92e72bd4-34c8-4221-b2be-94b4baa869c8';
