# دليل استلام المشروع (HANDOFF)

> أول حاجة تقراها لو لسه استلمت الحساب أو الكود. لو اتلخبطت في أي حاجة، ابدأ من هنا.

---

## 1. ايه المشروع ده؟

**مسارات (masaarat.ai)** — منصة عربية لتعلّم الذكاء الاصطناعي من خلال:
- كتاب أساسي (المرجع الفكري).
- 5 مسارات تعلّم (Builder · Creator · Automator · Analyst · Business).
- مهام تطبيقية وبناء حقيقي داخل كل درس.
- مساعد AI (Assistant) مقيّد دلاليًا بسياق المنصة — يعلّم ولا يحل بدلًا عن المتعلم.

الهوية العامة: `public/brand/README.md` · المنهج: `src/lib/curriculum-data.ts`.

## 2. ايه اللي المشروع ده **مش** هو

- مش منصة AI SaaS عامة.
- مش wrapper حول ChatGPT.
- مش كورس فيديوهات تقليدي.
- مش أداة بناء بدون فهم — كل خطوة مربوطة بفهم معماري.

لو حد طلب يحوّله لواحدة من دي، ده **خروج عن نطاق المشروع**.

## 3. الفلسفة التعليمية (6 قواعد)

| القاعدة | السبب |
|---|---|
| البناء قبل الاستهلاك | المتعلم يبني، مش بس يستهلك. |
| الفهم قبل الأداة | أي أداة AI يسبقها فهم معماري. |
| Runtime قبل النظرية | كل مفهوم يتجسّد في تجربة حيّة. |
| Micro-step progression | خطوات صغيرة، فتح تدريجي. |
| Context-aware teaching | المساعد يعرف فين أنت في المنهج. |
| العربية أولًا | RTL ولغة طبيعية، مش ترجمة. |

المصدر: القسم 3 في هذا الملف.

## 4. البنية التقنية (صفحة واحدة)

- **Frontend:** TanStack Start v1 + React 19 + Tailwind v4 + Vite 7.
- **Backend:** Lovable Cloud (Supabase تحته) — Auth · Postgres · Edge Functions · Storage.
- **AI:** Lovable AI Gateway (بدون API key يدوي) + retrieval عبر pgvector.
- **Routing:** file-based في `src/routes/` (auto-generated `routeTree.gen.ts` — ممنوع تعديله يدويًا).
- **Deployment:** Cloudflare Workers (عبر Lovable publish).

## 5. خريطة المسارات الخمسة

| المسار | الحالة الحالية |
|---|---|
| Intro (تمهيدي) | شغّال بالكامل |
| Builder | M1 شغّال (6 دروس v2)، باقي الموديولات قيد البناء |
| Creator | M1 درسين v2 |
| Automator / Analyst / Business | هياكل مبدئية فقط |

> **Current launch state:** all **100** learner-path lessons are active in `PATHS`; **4** Business lesson files are archived/internal only. See `docs/CURRENT_STATUS.md`.

للتفاصيل افتح `src/lib/curriculum-data.ts` وابحث عن `PATHS`.

## 6. أين يعيش كل شيء؟

| العنصر | المكان |
|---|---|
| محتوى الدروس (v2) | `src/components/intro/lessons/<lesson-id>.ts` |
| سجل الدروس | `src/components/intro/lessons/index.ts` |
| Lesson adapter (dashboard, missions, RAG consumers) | `src/lib/unified-lessons.ts` |
| المنهج (paths/modules/lessons) | `src/lib/curriculum-data.ts` |
| المساعد التعليمي | `src/lib/assistant-runtime.ts` + `supabase/functions/assistant-runtime/` |
| Retrieval (بحث دلالي) | `src/lib/retrieval/` + `supabase/functions/semantic-search/` |
| ضخّ المحتوى للـ corpus | `supabase/functions/ingest-curriculum-knowledge/` |
| Brand + curriculum SSOT | `public/brand/README.md` + `src/lib/curriculum-data.ts` |
| اللاندنج | `src/components/site/*` |
| لوحة المتعلم | `src/routes/dashboard.tsx` |
| Auth (login/signup/reset) | `src/routes/login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx` |
| Supabase client (مولّد، ممنوع التعديل) | `src/integrations/supabase/*` |

## 7. ابدأ من هنا (3 سيناريوهات)

**(أ) عايز أكمّل من حيث وقف:**
1. افتح `src/data/master-report-data.ts` → `ROADMAP`.
2. شوف العناصر اللي فيها `priority: "now"`.
3. نفّذها بترتيب الأولوية.

**(ب) عايز أعدّل أو أضيف محتوى:**
1. اقرأ "قاعدة الـ 3 خطوات" تحت.
2. لو هتعدّل ترتيب موديول فقط، عدّل `curriculum-data.ts` لوحده.

**(ج) عايز أقفل المشروع وأطلع:**
1. افتح `docs/RUNBOOK.md` → قسم **Decommission**.
2. اعمل export للبيانات قبل أي حذف.

## 8. قاعدة الـ 3 خطوات لأي درس جديد (لا تتجاوزها)

أي درس جديد لازم يلمس **3 ملفات في نفس التغيير**، وبعدها `bunx tsc --noEmit`:

1. **محتوى:** `src/components/intro/lessons/<lesson-id>.ts` (نوع `IntroLessonContent`).
2. **تسجيل:** `src/components/intro/lessons/index.ts` → ضيف `INTRO_LESSON_CONTENT[<lesson-id>] = ...`.
3. **منهج:** `src/lib/curriculum-data.ts` → ضيف `lesson(...)` في الموديول الصح بـ `state="available"` و `route="/learn/<pathId>/<lesson-id>"`.

تخطي الخطوة 3 = الدرس مش هيظهر في الـ dashboard ولا في خريطة المنهج، حتى لو الـ route شغّال.

بعد التعديل: ابحث عن الـ lesson id في `curriculum-data.ts` للتأكد إنه اتسجّل فعلاً.

## 9. الحالة الحالية (Current State)

| البند | الحالة |
|---|---|
| Current learner route | `/learn/$pathId/$lessonId` |
| Current lesson adapter | `src/lib/unified-lessons.ts` |
| Active learner lessons | 100 |
| Archived Business lessons | 4 internal/archive-only — not counted for learners |
| Egyptian production content | locked — do not edit |
| Localization | docs-only — not runtime-wired (`docs/playbooks/ADAPTIVE_RUNTIME_LOCALIZATION_ARCHITECTURE.md`) |

> **ملاحظة:** النظام القديم (`lessons-data.ts` + `LessonEngine` + `/lessons/<id>`) متوقف — للقراءة فقط ولا يُوسّع.

## 10. القرارات المفتوحة (محتاجة حسم من القيادة)

مأخوذة من `ROADMAP` بـ `priority: "next"` أو `"later"`:

- **Monetization:** نموذج التسعير (اشتراك / كوهورت / مجاني). لسه مش محسوم.
- **نظام الشهادات:** مرتبط بإنجاز المسارات.
- **تقييم آلي للمهام:** بـ tool-use داخل المساعد.
- **مسارات تكيّفية:** حسب أداء المتعلم.
- **ذاكرة طويلة الأمد للمتعلم.**

القائمة الكاملة في `ROADMAP` داخل `src/data/master-report-data.ts`.

## 11. ممنوعات (Hard Rules)

- ❌ لا تعدّل `src/integrations/supabase/*` يدويًا — ملفات مولّدة.
- ❌ لا تعدّل `src/routeTree.gen.ts` يدويًا — مولّد من الـ Vite plugin.
- ❌ لا تعمل migrations على schemas: `auth`, `storage`, `realtime`, `vault`, `supabase_functions`.
- ❌ لا تستخدم anonymous sign-ups أبدًا.
- ❌ لا تخزّن الـ roles على جدول `profiles` — لازم جدول `user_roles` منفصل (privilege escalation).
- ❌ لا تضيف ميزة كبيرة قبل تحديث المنهج (`curriculum-data.ts`) أو الهوية (`public/brand/README.md`).
- ❌ لا تضيف Edge Function جديدة — استخدم `createServerFn` من `@tanstack/react-start`. الـ edge functions الموجودة (3 فقط) محفوظة لأسباب تاريخية.

## 12. روابط مفيدة

- وثائق Lovable: https://docs.lovable.dev
- Lovable Cloud (DB · Auth · Storage · Secrets): من داخل المنصة → Cloud.
- History / Rollback: من داخل Lovable → أيقونة الساعة.
- للطوارئ: راجع `docs/RUNBOOK.md`.
- للمعمارية الكاملة: راجع `docs/ARCHITECTURE.md`.

---

لو لسه عندك سؤال بعد قراءة الملفات الـ 3 (HANDOFF + RUNBOOK + ARCHITECTURE)، يبقى السؤال محتاج قرار قيادي مش معلومة تقنية.