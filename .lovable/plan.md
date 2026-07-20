# خطة: عدّ الفيديوهات في 400 خلية درس — Runtime من صفحة الدرس

## الهدف
معرفة كام درس (من إجمالي 400 = 100 lessonId × 4 locales) بيعرض iframe فيديو فعلي عند تحميل صفحة الدرس، مش بمجرد وجوده في `bunny-videos.ts`.

## المصدر الوحيد المعتمد
`GET /learn/{pathId}/{lessonId}?locale={locale}` — نفس المسار اللي المتعلّم بيفتحه.
مؤشر النجاح: عنصر بـ `[data-locale-video="player"]` (iframe فعلي) بدلاً من `[data-locale-video="placeholder"]`.

## الخطوات

1. **بناء قائمة الـ 400 خلية**
   - قراءة `PATHS` من `src/lib/curriculum-data` لجمع كل `(pathId, lessonId)`.
   - ضرب في `["en", "ar-MSA", "ar-Gulf", "ar-EG"]`.
   - التأكد إن العدد = 400 قبل أي فحص. لو أقل/أكتر، إيقاف والإبلاغ.

2. **فحص Runtime عبر Playwright**
   - تشغيل dev server محلي (شغّال بالفعل على `localhost:8080`).
   - لكل خلية: `page.goto("/learn/{pathId}/{lessonId}?locale={locale}")`.
   - انتظار `networkidle` ثم فحص:
     - `player = await page.locator('[data-locale-video="player"] iframe').count()`
     - `placeholder = await page.locator('[data-locale-video="placeholder"]').count()`
   - تصنيف الخلية: `HAS_VIDEO` / `NO_VIDEO` / `ERROR`.
   - تشغيل بـ 6 صفحات متوازية لتقليل الزمن (~5–8 دقائق).

3. **التقرير النهائي** (بدون أي كتابة على الريبو)
   - إجمالي: `HAS_VIDEO / 400`.
   - تقسيم حسب اللغة: en, ar-MSA, ar-Gulf, ar-EG.
   - قائمة الخلايا اللي بدون فيديو (lessonId + locale) في CSV تحت `/mnt/documents/`.
   - عيّنة تحقق: 3 لقطات شاشة (لغة عندها فيديو، لغة placeholder، خلية فيها خطأ لو وُجدت).

## قيود
- Read-only بالكامل: مفيش تعديل ملفات، مفيش commits، مفيش dispatch، مفيش كتابة على Bunny/Supabase.
- الاعتماد الحصري على runtime لصفحة الدرس — مش على `bunny-videos.ts` مباشرة ولا على الـ manifests.

## المخرجات
- عدد الفيديوهات الفعلية / 400.
- CSV بأسماء الخلايا الناقصة.
- تفصيل لكل لغة.
