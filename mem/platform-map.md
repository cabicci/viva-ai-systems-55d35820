---
name: platform-map
description: Big-picture map of the whole platform — paths, lesson anatomy, all systems and their current state, and cross-system rules. READ FIRST before any change.
type: reference
---

# Platform Map — اقرأني قبل أي تعديل

الغرض: أفتكر **الصورة الكبيرة** قبل ما أقترح أي تغيير. لو في حاجة هنا قديمة، حدّثها في نفس الـ turn اللي بتتغير فيه.

## Paths (5 — كلهم منشورين)

| Path | Lessons | Modules | Videos | Status |
|------|---------|---------|--------|--------|
| Builder | 29 | m1–m10 | Bunny ✓ | Live |
| Creator | 18 | m1–m6 | Bunny ✓ | Live |
| Automator | 17 | m0–m6 | Bunny ✓ | Live |
| Analyst | 12 | m0–m6 | Bunny ✓ | Live |
| Business | 12 | m0–m6 | Bunny ✓ | Live |
| Intro (cross-path) | 7 | — | — | Live |

ممنوع أقول "coming soon" على أي path. Path integration / journey map **مؤجل**.

## Lesson ID Convention

`{path}-{module}-{slug}` — مثال: `automator-m1-systems-view`. الـ id نفسه بيرمز للمسار + الموديول + الترتيب جوا المسار. ممنوع أخترع رقم درس عالمي زي "الدرس 22".

## Lesson Anatomy

```
Video (Bunny) → Concept blocks (text/diagrams/compare) → Quiz → Mission (لو فيه rubric = إجباري للتقدم)
```

- المحتوى في `src/components/intro/lessons/<lesson-id>.ts`
- العرض في `src/components/intro/IntroLessonRenderer.tsx`
- صفحة الدرس: `src/routes/learn.$pathId.$lessonId.tsx`

## Systems

| System | الحالة الحالية | الملفات المفتاحية |
|--------|---------------|--------------------|
| **Auth** | Supabase Email + Google OAuth | `src/lib/auth-context.tsx` |
| **Cloud Backend** | Lovable Cloud (Supabase under the hood) | `src/integrations/supabase/*` |
| **Videos** | Bunny Stream Library 670679 — auto-resolve by lessonId | `src/lib/bunny-videos.ts` |
| **Missions (AI)** | Gemini 2.5 Flash · threshold **60** · **2 محاولات + reveal-answer escape hatch** | `src/lib/mission-ai-evaluation.functions.ts` |
| **Mission Gate** | يمنع "الدرس التالي" لحد ما الـ mission تنجح | `src/lib/mission-gate.ts` |
| **Progress** | `lesson_progress` + `user_lesson_status` + `mission_submissions` | `src/lib/lesson-progress.ts` |
| **Streaks / Activity** | `user_streaks` + `user_activity_time` | `src/components/dashboard/StreakCard.tsx` |
| **Quiz** | per-lesson, `lesson_quiz_attempts` | `src/components/intro/QuizBlock.tsx` |
| **Notes** | per-lesson, `lesson_notes` | — |
| **Knowledge / RAG** | `knowledge_chunks` + embeddings (للـ assistant) | `scripts/seed-knowledge/run.py` |
| **Assistant** | edge function `assistant-runtime` | `supabase/functions/assistant-runtime/` |
| **Payments / Subscriptions** | جدول `user_subscriptions` موجود — التفعيل الفعلي غير مؤكد | TBD |
| **Roles** | `user_roles` + `has_role()` | `src/components/AdminGate.tsx` |
| **Error Logging** | `client_error_logs` | `src/lib/error-capture.ts` |
| **Device Lock** | `user_active_device` (one device per user) | — |

## Cross-System Rules (مهم جداً)

- لما أضيف **mission** جديدة لازم: تبقى block `kind: "mission"` فيها `rubric` → بتدخل تلقائياً في mission-gate.
- لما أعدّل **lesson structure** لازم: أراجع `IntroLessonRenderer` + الـ Bunny mapping + الـ `lesson-continuity.ts`.
- لما أغير **mission threshold** أو الـ flow لازم: أحدّث `MISSION_PASS_THRESHOLD` + الـ system prompt + الـ UI hints في `MissionRubricSubmit`.
- لما أضيف **table** جديدة لازم: GRANT + RLS policies في نفس الـ migration.
- لما أغير **lesson id**: أبحث بـ `rg` على كل reference (Bunny mapping, registry, lesson-continuity, urls).
- ممنوع أعدّل: `src/integrations/supabase/{client,types,auth-middleware,auth-attacher,client.server}.ts` و `.env` و `src/routeTree.gen.ts`.

## Deferred / Decisions

للقرارات والـ trade-offs الكاملة → `.lovable/decisions.md`.
للشغل الحالي والـ phases → `.lovable/plan.md`.