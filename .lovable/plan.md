# خطة: تقرير شامل عن منصة Masaarat

## الهدف
إنتاج تقرير Markdown مفصّل يغطي كل المنصة من الكود مباشرة، مع قائمة أخطاء/مخاطر مرصودة.

## المخرج
ملف واحد: `docs/PLATFORM_FULL_REPORT.md` (قراءة فقط — لا تعديلات على كود التطبيق).

## أقسام التقرير

1. **نظرة عامة**
   - الاسم، النطاق (masaarat.ai)، آخر SHA منشور (`bed4994`).
   - Stack: TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 + Lovable Cloud (Supabase) + Cloudflare Workers.

2. **معمارية الكود**
   - `src/routes/` — كل المسارات (public / `_authenticated` / `api/public/*`).
   - `src/components/` — تجميع حسب الدومين (assistant, intro, learn, lesson, locale, site, ui, dashboard…).
   - `src/lib/locale-lessons/` — نظام اللغات (ar-MSA, ar-Gulf, ar-EG, en).
   - `src/integrations/supabase/` — client / server / auth-middleware.
   - `remotion/` — رندر الفيديوهات.
   - `scripts/locale-lessons/` — pipeline التوليد والتحقق.
   - `.github/workflows/` — lesson-video, locale-fragment-*, assistant-seed.

3. **المسارات التعليمية (5 paths)**
   - Builder / Creator / Automator / Analyst / Business — عدد الموديولات والدروس لكل مسار من ملفات JSON.
   - Intro path (M0/M1).

4. **نظام اللغات**
   - 4 locales، قواعد الـ contract، UI keys parity، leak scan.
   - آخر حالة QA لـ ar-EG (Egyptian bridge).

5. **الـ Backend (Lovable Cloud)**
   - جداول عامة، RLS، user_roles pattern، has_role function.
   - Edge functions المستخدمة (assistant / RAG / mission — من غير تعديل).

6. **الفيديو / Bunny / Remotion**
   - lesson-video workflow، حد 400 chars.
   - GitHub repo: `cabicci/viva-ai-systems-55d35820`.

7. **الأخطاء والمخاطر المرصودة**
   - Console warnings حالية: `Missing Description or aria-describedby for DialogContent` (Radix Dialog).
   - Security scan pre-existing: 2 warnings من `supabase_lov` (MISSING_RLS_PROTECTION, EXPOSED_SENSITIVE_DATA).
   - ar-EG: `HLS manifestIncompatibleCodecsError` على playlist معيّن (نطاق Bunny — خارج).
   - أي imports أو routes فيها mismatch (فحص سريع بـ rg).
   - أي lesson JSON فيه leaks أو bold غير متوازن (تشغيل validators read-only).
   - أي orphan videos من `docs/orphan-videos.md`.

8. **Deferred / معلّقات معروفة**
   - Route meta/head deferred.
   - Intro renderer toasts/chrome deferred.
   - errorComponent dir warning deferred.
   - Path integration / visual journey map deferred.

9. **Roadmap snapshot**
   - أحدث صفوف `roadmap_items` (من `.lovable/roadmap-sync.md`).

## طريقة التنفيذ (Read-only بالكامل)
- `rg` + `code--view` على الملفات المذكورة.
- تشغيل validators read-only:
  - `bun scripts/locale-lessons/validate-locale-leak-scan.ts`
  - `bun scripts/locale-lessons/validate-ui-key-parity.ts`
  - `bun scripts/locale-lessons/validate-title-index-parity.ts`
  - `bun scripts/locale-lessons/validate-manifest-curriculum-sync.ts`
- `security--run_security_scan` لتحديث نتائج الـ backend.
- استعلام `supabase--read_query` بسيط على `roadmap_items` (SELECT فقط) لآخر 20 صف.

## القيود
- لا تعديل كود.
- لا نشر.
- لا تعديل package.json / bun.lock / lesson JSON / Supabase schema / Bunny / Remotion / RAG / assistant / mission / video.
- المخرج الوحيد: ملف `docs/PLATFORM_FULL_REPORT.md`.

## الخلاصة
تقرير واحد شامل يجمع: البنية + الحالة + الأخطاء + المعلّقات، بدون أي تغيير في الكود.
