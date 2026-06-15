# خطة المراجعة الشاملة العميقة

## الهدف
مراجعة كاملة للمشروع من 4 زوايا، توليد تقرير مفصّل، وتسجيل كل مشكلة كـ `roadmap_items` للمتابعة.

## المنهج
المراجعة **read-only فقط** — مفيش تعديل كود أو محتوى في الجولة دي. التعديلات تيجي بعد ما تعتمد التقرير.

## النطاق (4 محاور)

### 1. المحتوى والدروس
- جرد كل ملفات `src/components/intro/lessons/` عبر المسارات الـ5 (Builder/Creator/Automator/Analyst/Business + Intro).
- فحص: تطابق IDs مع الـ naming convention، تسلسل modules/lessons، جودة النص العربي (قواعد مصرية)، طول السكريبت، صور/دياجرامز ناقصة، روابط مكسورة بين الدروس.
- استخدام `scripts/lesson-audit/output/` لو فيه نتايج جاهزة.
- فحص توافق الدروس مع Bunny videos و registry.

### 2. الكود والمعمارية
- مراجعة `src/routes/` كاملة: auth gates، loaders، error/notFound boundaries، head metadata.
- مراجعة `src/lib/*.functions.ts`: استخدام `requireSupabaseAuth`، input validation، rate limiting، تسريب server-only imports.
- مراجعة `src/components/` للأنماط المتكررة، الـ dead code، الـ prop drilling.
- مراجعة `src/integrations/` و `src/start.ts`.
- فحص `package.json` للحزم القديمة/غير المستخدمة.
- مراجعة `vite.config.ts`, `tsconfig.json`, eslint.

### 3. قاعدة البيانات والـ RLS
- فحص الـ24 جدول: GRANTs صحيحة، RLS مفعّل، policies آمنة (مفيش `USING (true)` على بيانات حساسة).
- مراجعة الـ 20 database function: search_path، SECURITY DEFINER صحيح، authorization checks.
- تشغيل `supabase--linter` + `security--run_security_scan`.
- فحص الـ indexes الناقصة على foreign keys + columns المستخدمة في policies.
- فحص الـ triggers وتأثيرها.

### 4. الـ UI/UX والتصميم
- مراجعة `src/styles.css` و design tokens (oklch، semantic colors).
- فحص responsive على mobile/tablet/desktop عبر `browser--view_preview`.
- فحص الـ RTL support للصفحات الرئيسية.
- فحص accessibility (alt text, aria labels, contrast, keyboard nav).
- فحص الـ loading states و error states.
- فحص الـ navigation flow: dashboard → path → lesson → mission.

## الأدوات المستخدمة
- `acp_subagent--explore` لكل محور (4 subagents بالتوازي) — يقلل credits ويعطي تقارير مركّزة.
- `supabase--linter` + `security--get_scan_results`.
- `browser--view_preview` + `browser--screenshot` لـ UI checks.
- `code--view` + `rg` للتدقيق المستهدف.

## المخرَجات

### أ. التقرير
ملف `docs/COMPREHENSIVE_REVIEW_2026-06-15.md` يحتوي:
- ملخص تنفيذي (عربي، خلاصة سريعة)
- جدول للـ blockers (Critical)
- لكل محور: قسم منفصل بقائمة المشاكل، severity (Critical/High/Medium/Low)، الموقع (file:line)، التوصية، التقدير.
- ملحق: ميزات شغّالة كويس (positive findings).

### ب. roadmap_items
- INSERT row لكل مشكلة بـ `[source:ai]` marker.
- `title`، `description`، `priority`، `notes` بالـ tracking format المعتمد.
- بعدها تشغيل `bun run roadmap:log`.

## التقدير
- المراجعة: ~6-10 دقائق (4 subagents بالتوازي).
- التقرير + roadmap inserts: ~3 دقائق إضافية.
- **استهلاك credits متوسط–عالي** بسبب الـ subagents الأربعة. لو عايز توفير، نقدر نقلّلهم لاتنين (محتوى+كود في واحد، DB+UI في تاني).

## غير مشمول (out of scope)
- مفيش تعديل كود أو محتوى.
- مفيش re-render فيديوهات.
- مفيش publish/deploy.
- مراجعة الـ Remotion lessons-generated مستبعدة (auto-generated).

## استئذان قبل التنفيذ
لو موافق على الخطة، أبدأ. لو عايز تقلل النطاق أو الـ subagents لتوفير credits، قولّي.
