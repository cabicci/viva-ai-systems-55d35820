# START HERE — الملف الواحد لفهم المشروع

> أنت AI أو إنسان لسه فاتح المشروع لأول مرة؟ اقرأ الملف ده لحد الآخر. لو خلصته وعندك سؤال، يبقى السؤال محتاج قرار قيادي مش معلومة تقنية.

الملف ده بيلخّص ويوحّد: `HANDOFF.md` + `docs/RUNBOOK.md` + `docs/ARCHITECTURE.md`. الملفات دي لسه موجودة كمراجع تفصيلية، لكن الملف ده هو نقطة الدخول.

---

## 1. ايه المشروع

**مسارات (masaarat.ai)** — منصة عربية لتعلّم الذكاء الاصطناعي عبر:
- كتاب أساسي (المرجع الفكري).
- 5 مسارات: Intro · Builder · Creator · Automator · Analyst · Business.
- مهام تطبيقية وبناء حقيقي داخل كل درس.
- مساعد AI مقيّد بسياق المنصة (يعلّم، لا يحل بدلًا عن المتعلم).

الهوية العامة: `public/brand/README.md` · المنهج: `src/lib/curriculum-data.ts`.

## 2. ايه المشروع **مش** هو

- مش منصة AI SaaS عامة.
- مش wrapper حول ChatGPT.
- مش كورس فيديوهات تقليدي.
- مش أداة بناء بدون فهم.

لو حد طلب يحوّله لواحدة من دي → خروج عن النطاق.

## 3. الفلسفة التعليمية (6 قواعد)

| القاعدة | السبب |
|---|---|
| البناء قبل الاستهلاك | المتعلم يبني، مش بس يستهلك. |
| الفهم قبل الأداة | كل أداة AI يسبقها فهم معماري. |
| Runtime قبل النظرية | كل مفهوم يتجسّد في تجربة حيّة. |
| Micro-step progression | خطوات صغيرة، فتح تدريجي. |
| Context-aware teaching | المساعد يعرف فين أنت في المنهج. |
| العربية أولًا | RTL ولغة طبيعية، مش ترجمة. |

المصدر: القسم 3 في `HANDOFF.md`.

## 4. البنية التقنية (صفحة واحدة)

- **Frontend:** TanStack Start v1 + React 19 + Tailwind v4 + Vite 7.
- **Backend:** Lovable Cloud (Supabase) — Auth · Postgres · Edge Functions · Storage.
- **AI:** Lovable AI Gateway (بدون API key يدوي) + retrieval عبر pgvector.
- **Routing:** file-based في `src/routes/` (الـ `routeTree.gen.ts` مولّد تلقائيًا — ممنوع تعديله).
- **Deployment:** Cloudflare Workers عبر Lovable publish.

## 5. خريطة المسارات

| المسار | الحالة |
|---|---|
| Intro | شغّال بالكامل |
| Builder | M1 شغّال (6 دروس v2)، باقي الموديولات قيد البناء |
| Creator | M1 درسين v2 |
| Automator / Analyst / Business | هياكل مبدئية فقط |

المصدر التفصيلي: `src/lib/curriculum-data.ts` (`PATHS`).

## 6. عايز تعدّل X → روح Y

| المهمة | المكان |
|---|---|
| إضافة درس v2 | الـ 3 خطوات في §8 تحت |
| تعديل ترتيب موديول | `src/lib/curriculum-data.ts` |
| تعديل عنوان/حالة مسار | `src/lib/curriculum-data.ts` (داخل `PATHS`) |
| محتوى دروس v2 | `src/components/intro/lessons/<id>.ts` |
| سجل الدروس v2 | `src/components/intro/lessons/index.ts` |
| المساعد التعليمي | `src/lib/assistant-runtime.ts` + `supabase/functions/assistant-runtime/` |
| Retrieval (pgvector) | `src/lib/retrieval/` + `supabase/functions/semantic-search/` |
| ضخّ المحتوى للـ corpus | `supabase/functions/ingest-curriculum-knowledge/` |
| الهوية / الفلسفة | `public/brand/README.md` + `HANDOFF.md` §3 |
| Roadmap والقرارات | `src/data/master-report-data.ts` |
| اللاندنج | `src/components/site/*` |
| لوحة المتعلم | `src/routes/dashboard.tsx` + `src/components/dashboard/Sidebar.tsx` |
| Auth | `src/routes/login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx` |
| Navbar | `src/components/site/Navbar.tsx` |
| Narrative popups | `src/components/narrative/narrative-triggers.ts` |
| Supabase client (مولّد) | `src/integrations/supabase/*` — **ممنوع التعديل اليدوي** |

## 7. قالب الدرس الموحّد (Builder v2.2) — 7 بلوكات بالترتيب

| # | Block kind | الغرض |
|---|---|---|
| 1 | `paragraphs` (Hero) | فكرة الدرس في جملتين — eyebrow = "HERO" |
| 2 | `lessonVideo` | فيديو قصير (1-2 دقيقة) — لو لسه مش جاهز سيب `url: ""` |
| 3 | `paragraphs` | شرح بسيط — 3-4 فقرات قصيرة |
| 4 | `comparison` (مفاهيمي) | إنسان × AI / قبل × بعد / عام × مفصّل |
| 5 | `comparison` (صح×غلط) | السلوك الصح × الغلطة الشائعة — eyebrow = "صح × غلط" |
| 6 | `caseStudy` | "المنصة دي عملت كده بالظبط" |
| 7 | `mission` | مهمة تطبيقية (مزيج عملي + تأملي) + قالب prompt |

التفاصيل والمثال الكامل: `docs/LESSON_TEMPLATE.md`.

## 8. قاعدة الـ 3 خطوات لأي درس جديد (لا تتجاوزها)

لازم تلمس **3 ملفات في نفس التغيير**، وبعدها `bunx tsc --noEmit`:

1. **محتوى:** أنشئ `src/components/intro/lessons/<lesson-id>.ts` بنوع `IntroLessonContent` (7 بلوكات).
2. **تسجيل:** ضيف في `src/components/intro/lessons/index.ts`:
   `INTRO_LESSON_CONTENT[<lesson-id>] = ...`.
3. **منهج:** ضيف `lesson(...)` في الموديول الصح في `src/lib/curriculum-data.ts` بـ `state="available"` و `route="/<path>/<lesson-id>"`.

تخطّي الخطوة 3 = الدرس مش هيظهر في الـ dashboard ولا في خريطة المنهج. بعد التعديل: `rg "<lesson-id>" src/lib/curriculum-data.ts` للتأكد.

## 9. الحالة الحالية (Current State)

| البند | الحالة |
|---|---|
| Current learner route | `/learn/$pathId/$lessonId` |
| Current lesson adapter | `src/lib/unified-lessons.ts` |
| Active learner lessons | 100 |
| Archived Business lessons | 4 internal/archive-only lessons — not counted for learners |
| Egyptian production content | locked — do not edit |
| Localization | docs-only — not runtime-wired |

> **ملاحظة:** النظام القديم (`lessons-data.ts` + `LessonEngine` + `/lessons/<id>`) متوقف — للقراءة فقط ولا يُوسّع.

## 10. ممنوعات (Hard Rules)

- ❌ تعديل `src/integrations/supabase/*` يدويًا (مولّد).
- ❌ تعديل `src/routeTree.gen.ts` يدويًا (مولّد من Vite plugin).
- ❌ migrations على schemas: `auth`, `storage`, `realtime`, `vault`, `supabase_functions`.
- ❌ anonymous sign-ups.
- ❌ تخزين roles على `profiles` — لازم جدول `user_roles` منفصل + `has_role()` بـ `security definer`.
- ❌ إضافة Edge Function جديدة — استخدم `createServerFn` من `@tanstack/react-start`. الـ 3 edge functions الموجودة (`assistant-runtime`, `semantic-search`, `ingest-curriculum-knowledge`) محفوظة لأسباب تاريخية.
- ❌ إضافة ميزة كبيرة قبل تحديث Brain Center.
- ❌ كتابة secrets في الكود أو في `.env` يدويًا — مكانها Lovable → Cloud → Secrets.

## 11. جداول قاعدة البيانات (سطر لكل جدول)

| الجدول | الغرض |
|---|---|
| `lesson_progress` | تقدّم legacy lessons. |
| `user_lesson_status` | تقدّم v2 lessons (الـ source الحالي). |
| `mission_submissions` | إجابات/مشاريع المتعلم + التقييم. |
| `user_mission_state` | حالة المهمة (available / done / locked). |
| `lesson_notes` | ملاحظات المتعلم على الدرس. |
| `build_logs` | سجل البناء الحقيقي. |
| `knowledge_chunks` | الـ corpus + embeddings (pgvector). |

RLS مقفولة على كل الجداول الشخصية بـ `auth.uid() = user_id` للـ S/I/U/D. أي جدول جديد بيحتوي بيانات مستخدم → فعّل RLS فورًا بالسياسات الـ 4.

## 12. سيناريوهات تشغيل سريعة (تفاصيلها في `docs/RUNBOOK.md`)

| السيناريو | الخطوة الأولى |
|---|---|
| إيقاف فوري لمصاريف AI | احذف/بدّل `LOVABLE_API_KEY` من Cloud → Secrets |
| Rollback لإصدار سابق | Lovable → أيقونة الساعة → Restore (الكود فقط، مش DB) |
| Export بيانات متعلمين | Cloud → Database → Tables → Export CSV |
| حذف user واحد | Cloud → Users → Delete، ثم cleanup يدوي للجداول بدون FK |
| إخفاء درس | غيّر `state` لـ `"coming-soon"` في `curriculum-data.ts`، **لا تحذف** |
| Unpublish الموقع | Lovable → Publish → Unpublish |
| Decommission كامل | Export → Download codebase → Unpublish → Delete |
| تحديث الـ corpus | شغّل `ingest-curriculum-knowledge` edge function |
| build فشل | اقرأ الـ error → `bunx tsc --noEmit` → تأكد من الـ 3 خطوات → rollback |

**قاعدة ذهبية:** قبل أي عملية تخريبية → **export أولًا**.

## 13. ابدأ من هنا (3 سيناريوهات)

**(أ) عايز تكمّل من حيث وقفنا:**
1. افتح `src/data/master-report-data.ts` → `ROADMAP`.
2. شوف العناصر بـ `priority: "now"`.
3. نفّذها بالترتيب.

**(ب) عايز تعدّل/تضيف محتوى:**
1. اقرأ §7 (قالب الدرس) و §8 (قاعدة الـ 3 خطوات).
2. لو ترتيب موديول فقط → `curriculum-data.ts` لوحده.

**(ج) عايز تقفل المشروع وتطلع:**
1. `docs/RUNBOOK.md` → §7 Decommission.
2. Export الكل قبل أي حذف.

## 14. القرارات المفتوحة (محتاجة حسم قيادي)

من `ROADMAP` بـ `priority: "next"` أو `"later"`:
- نموذج التسعير (اشتراك / كوهورت / مجاني).
- نظام الشهادات.
- تقييم آلي للمهام بـ tool-use.
- مسارات تكيّفية حسب أداء المتعلم.
- ذاكرة طويلة الأمد للمتعلم.

القائمة الكاملة في `ROADMAP` داخل `src/data/master-report-data.ts`.

## 15. مصادر الحقيقة (Single Sources of Truth)

| المعنى | الملف |
|---|---|
| الهوية والفلسفة | `public/brand/README.md` + `HANDOFF.md` |
| Roadmap والقرارات | `src/data/master-report-data.ts` |
| خريطة المنهج | `src/lib/curriculum-data.ts` |
| سجل دروس v2 | `src/components/intro/lessons/index.ts` |
| قالب الدرس | `docs/LESSON_TEMPLATE.md` |
| قواعد ذاكرة الـ AI | `mem/index.md` |
| Schema الـ DB | Lovable → Cloud → Database (live) |

لو فيه تعارض بين ملفين → ابدأ من `HANDOFF.md` (الفلسفة) ثم `curriculum-data.ts` (التنفيذ).

---

## للـ AI خصيصًا

- اقرأ `mem/index.md` قبل أي تعديل — فيه القواعد اللي بتطبّق على كل خطوة.
- أي درس جديد → قالب الـ 7 بلوكات + قاعدة الـ 3 خطوات + `bunx tsc --noEmit`.
- اللغة: عربي مصري طبيعي، RTL، المصطلحات الإنجليزية بين قوسين بعد العربي.
- لو طُلب منك تعمل حاجة تخالف §10 (الممنوعات) → ارفض واشرح السبب.
- ممنوع تخمّن — لو معلومة مش هنا، اقرأ الملف اللي بيشير له الجدول في §6 أو §15.

---

**الملفات المرجعية الأعمق** (لو محتاج تفاصيل أكتر من اللي هنا):
- `HANDOFF.md` — نسخة مطوّلة من ده.
- `docs/RUNBOOK.md` — تفاصيل عمليات التشغيل والطوارئ.
- `docs/ARCHITECTURE.md` — الخريطة المعمارية بالـ ASCII diagram.
- `docs/LESSON_TEMPLATE.md` — مثال درس كامل بكود.
---

## ملحق: مؤقت — مساعد تأليف الدروس (Admin)

صفحة `/admin/lesson-author` فيها AI chat بيساعد على تأليف وتنقيح الدروس. **مؤقت — لازم يتشال قبل الإطلاق النهائي.**

### خطوات الحذف الكاملة (نظيف 100%)
1. احذف الملفات دي:
   - `src/routes/admin.tsx`
   - `src/routes/admin.lesson-author.tsx`
   - `src/components/admin/` (الفولدر كله)
   - `src/lib/lesson-author.functions.ts`
   - `src/lib/use-is-admin.ts`
2. في `src/components/dashboard/Sidebar.tsx`: شيل import `useIsAdmin` و `Wand2` و سطر `navItems = isAdmin ? ...` ورجّع `items.map` بدل `navItems.map`.
3. (اختياري) drop جدول `user_roles` + enum `app_role` + function `has_role` لو مش هتستخدمهم لحاجة تانية.
