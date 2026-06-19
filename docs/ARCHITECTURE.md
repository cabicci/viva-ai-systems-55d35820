# ARCHITECTURE — الخريطة المعمارية

> **Product:** مسارات (masaarat.ai). References to Lovable below describe hosting/tooling, not the public product brand.

> الملف ده بيجاوب على سؤال واحد: "أنا عايز أعدّل X، أروح فين؟"

---

## 1. الطبقات (نظرة علوية)

```text
┌─────────────────────────────────────────────┐
│  Browser (React 19 + TanStack Router)       │
│  src/routes/  →  / · /dashboard · /curriculum│
│                  /learn/$pathId/$lessonId   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  Lesson Layer                               │
│   IntroLessonRenderer                       │
│        ← src/lib/unified-lessons.ts         │
│           (adapter: PATHS + registry)       │
│        ← INTRO_LESSON_CONTENT (registry)    │
│        ← <lesson-id>.ts (blocks)            │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  Curriculum Layer                           │
│   src/lib/curriculum-data.ts                │
│   PATHS → MODULES → LESSONS                 │
│   (مصدر الحقيقة لخريطة المنهج)              │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  Assistant + Retrieval                      │
│   src/lib/assistant-runtime.ts              │
│      ↕ supabase/functions/assistant-runtime │
│      ↕ supabase/functions/semantic-search   │
│      ↕ knowledge_chunks (pgvector)          │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  Lovable Cloud                              │
│   Auth · Postgres (RLS) · Edge Fns · Secrets│
└─────────────────────────────────────────────┘
```

## 2. عايز تعدّل X → روح Y

| المهمة | الملفات / المسار |
|---|---|
| إضافة درس v2 جديد | الـ 3 خطوات في HANDOFF §8 |
| تعديل ترتيب موديول | `src/lib/curriculum-data.ts` فقط |
| تعديل عنوان/حالة مسار | `src/lib/curriculum-data.ts` (داخل `PATHS`) |
| تعديل نص اللاندنج | `src/components/site/Hero.tsx`, `Ecosystem.tsx`, `Journey.tsx`, `Philosophy.tsx`, `CTA.tsx` |
| تعديل لوحة المتعلم | `src/routes/dashboard.tsx` + `src/components/dashboard/Sidebar.tsx` |
| تعديل سلوك المساعد | `supabase/functions/assistant-runtime/index.ts` |
| تعديل الـ corpus / re-ingest | `supabase/functions/ingest-curriculum-knowledge/` ثم Run |
| تعديل البحث الدلالي | `src/lib/retrieval/` + `supabase/functions/semantic-search/` |
| تعديل صفحات Auth | `src/routes/login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx` |
| تعديل الهوية / الفلسفة | `src/data/brain-identity.ts` |
| تعديل الـ Roadmap | `src/data/master-report-data.ts` |
| تعديل الـ navigation العلوي | `src/components/site/Navbar.tsx` |
| إضافة route جديد | أنشئ ملف في `src/routes/` (الـ Vite plugin يولّد `routeTree.gen.ts` تلقائيًا) |

## 3. الحالة الحالية (Current State)

| البند | الحالة |
|---|---|
| Current learner route | `/learn/$pathId/$lessonId` |
| Current lesson adapter | `src/lib/unified-lessons.ts` |
| Active learner lessons | 100 |
| Archived Business lessons | 4 internal/archive-only lessons — not counted for learners |
| Egyptian production content | locked — do not edit |
| Localization | docs-only — not runtime-wired |

> **ملاحظة:** النظام القديم (`lessons-data.ts` + `LessonEngine` + `/lessons/<id>`) متوقف — للقراءة فقط ولا يُوسّع.

## 4. Server-side: Server Functions vs Edge Functions

- **الـ default على هذا الـ stack هو `createServerFn` من `@tanstack/react-start`** (يعمل داخل Cloudflare Worker).
- **Edge Functions موجودة لـ 3 حالات فقط** (لأسباب تاريخية أو تكامل مع pgvector):
  - `assistant-runtime` — خط المحادثة الرئيسي.
  - `semantic-search` — استعلام pgvector.
  - `ingest-curriculum-knowledge` — إنشاء embeddings.
- **لا تضيف edge function جديدة.** أي logic جديد → `createServerFn`.
- التفاصيل في knowledge file `server-side-modern` داخل Lovable.

## 5. جداول قاعدة البيانات (سطر لكل جدول)

| الجدول | الغرض |
|---|---|
| `lesson_progress` | تقدّم legacy lessons لكل user. |
| `user_lesson_status` | تقدّم v2 lessons لكل user (الـ source الحالي). |
| `mission_submissions` | إجابات/مشاريع المتعلم على المهام + التقييم. |
| `user_mission_state` | حالة المهمة (available / done / locked …). |
| `lesson_notes` | ملاحظات شخصية للمتعلم على الدرس. |
| `build_logs` | سجل البناء الحقيقي (تجارب وقرارات المتعلم). |
| `knowledge_chunks` | الـ corpus + embeddings (pgvector) للـ retrieval. |

## 6. Row-Level Security (باختصار)

- **كل الجداول الشخصية:** RLS مقفولة بـ `auth.uid() = user_id` للـ select/insert/update/delete.
- **`knowledge_chunks`:** قراءة لكل user مصادق عليه، الكتابة عبر edge function بمفتاح service role فقط.
- **القاعدة الذهبية:** أي جدول جديد يحتوي بيانات مستخدم → فعّل RLS فورًا، ولا تنسى السياسة الـ 4 (S/I/U/D).
- الـ roles (لو احتجت admin مستقبلًا): جدول `user_roles` منفصل + function `has_role()` بـ `security definer`. **ممنوع** تخزين الـ role على `profiles`.

## 7. مفاتيح الـ stack

- **TanStack Start v1** — لا تستخدم `entry-client.tsx` / `entry-server.tsx` / `vinxi`. كل حاجة عبر `src/router.tsx` + `src/routes/__root.tsx`.
- **Routing:** flat dot-separated (مثال: `learn.$pathId.$lessonId.tsx` = `/learn/builder/<lessonId>`). ممنوع `src/pages/`.
- **Tailwind v4:** عبر `src/styles.css` + CSS `@import` + theme variables (مفيش `tailwind.config.js` تقليدي).
- **Cloudflare Workers runtime:** بعض Node APIs مش متاحة (`child_process`, `sharp`, `puppeteer`). راجع knowledge `server-runtime`.

## 8. نقاط دخول الـ AI

1. **AssistantFab** (الزرار العائم) → `src/components/assistant/AssistantFab.tsx`.
2. يفتح **AssistantPanel** → `src/components/assistant/AssistantPanel.tsx`.
3. الـ panel بيستدعي `assistant-runtime` edge function مع context (lesson id + path id).
4. الـ edge function بتنادي `semantic-search` لجلب أقرب chunks من `knowledge_chunks`.
5. ترجع الإجابة مع citations، مقيّدة بقواعد `ASSISTANT_PHILOSOPHY` في `brain-identity.ts`.

## 9. الـ Narrative System (popups بين الموديولات)

- التريغرز في `src/components/narrative/narrative-triggers.ts`.
- المحرّك: `src/components/narrative/NarrativeRuntime.tsx`.
- الإضافة: ضيف entry جديد في array الـ `NARRATIVE_TRIGGERS` — مفيش wiring تاني.

## 10. مصادر الحقيقة (Single Sources of Truth)

| المعنى | الملف |
|---|---|
| الهوية والفلسفة | `src/data/brain-identity.ts` |
| Roadmap والقرارات | `src/data/master-report-data.ts` |
| خريطة المنهج | `src/lib/curriculum-data.ts` |
| سجل الدروس v2 | `src/components/intro/lessons/index.ts` |
| Lesson adapter / runtime consumers | `src/lib/unified-lessons.ts` |
| Archived slugs | `src/lib/archived-lessons.ts` |
| Localization Phase 0 | `docs/playbooks/ADAPTIVE_RUNTIME_LOCALIZATION_ARCHITECTURE.md` — docs-only, not runtime-wired |
| Schema الـ DB | Lovable → Cloud → Database (live) |
| P0 launch operating model | `docs/playbooks/P0_LAUNCH_CONSTITUTION.md` |
| Curriculum freeze | `docs/playbooks/CURRICULUM_FREEZE_CONTRACT.md` |

لو فيه تعارض بين أي ملفين، ابدأ من `brain-identity.ts` (الفلسفة) ثم `curriculum-data.ts` (التنفيذ).

---

بعد ما تقرأ الملف ده + HANDOFF + RUNBOOK، تكون عندك خريطة كاملة للمشروع تكفي إنك تعدّل أو تمتد بأمان.