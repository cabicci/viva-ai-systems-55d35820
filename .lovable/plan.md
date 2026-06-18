## المشكلة
البريفيو ظاهر فيه خطأ:
`Failed to fetch dynamically imported module: virtual:tanstack-start-client-entry`

السبب: الـ dev server اتعمله restart تلقائي بعد ما اتغيّر ملف `.env`، والتبويب المفتوح عند المستخدم لسه ماسك نسخة قديمة من الموديول.

## الحالة الفعلية
- Vite شغّال على port 8080 وسليم (`[vite] server restarted` + `[vite] connected`)
- مفيش أخطاء build أو compile
- مفيش تعديلات معلّقة في الكود
- المشكلة في الـ client tab فقط (stale module)

## الخطوة المقترحة
لا تعديل على الكود. الحل:
1. اعمل **Hard Refresh** للبريفيو (Ctrl/Cmd+Shift+R) — ده غالباً يكفي.
2. لو لسه فيه نفس الخطأ، أعمل restart للـ dev server من جهتي للتأكد من نظافة الـ module graph.

تأكدلي تعمل Refresh الأول، ولو الخطأ استمر قوللي وأنا أعمل restart.