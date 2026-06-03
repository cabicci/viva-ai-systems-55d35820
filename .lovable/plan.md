# تنفيذ v9 Apply — كل حاجة مرة واحدة

## الترتيب

### 1. Freeze + roadmap logging
- `roadmap_items`: مرحلة v9 → done + سطر جديد للـ apply phase = in_progress
- إغلاق persona-sim كـ deferred

### 2. صفحة المراجعة `/admin/v9-review`
- تقرأ `public/persona-sim/v9-suggestions.json`
- لكل درس من الـ 83 apply:
  - يسار: SCENES الحالية (من ملف الدرس الفعلي)
  - يمين: الترتيب المقترح (suggested_order)
  - أزرار: ✅ approve / ✏️ edit order / ❌ reject
- القرارات تتخزن في جدول جديد `v9_apply_decisions` (lesson_id, decision, new_order, notes)
- progress bar (X/83)
- زرار "Apply approved" في الآخر

### 3. سكريبت التطبيق `scripts/apply-v9-decisions.ts`
- يقرأ القرارات من DB
- للموافَق عليه: يعيد ترتيب `SCENES` array في ملف الدرس
- يطبق rules: CTA آخر، منع تتالي لونين، سقف 2 ConceptCard
- يحدث `roadmap_items` بـ `[ai-edit YYYY-MM-DD]: [scope:lessons] reorder via v9-apply`
- يبني batches IDs ≤400 chars ويطبع أوامر `trigger-lesson.sh`

### 4. Design rules doc
- `docs/lesson-design-rules.md` بالقواعد الـ 3

### 5. Wow-moment tracking (تحضير للـ 15 مستخدم)
- جدول `user_validation_sessions` (user_id, started_at, wow_moment_at, first_3_lessons_completed)
- صفحة `/admin/validation` بسيطة للمتابعة

## DB Migrations
```sql
create table v9_apply_decisions (
  lesson_id text primary key,
  decision text not null check (decision in ('approve','edit','reject')),
  new_order jsonb,
  notes text,
  decided_at timestamptz default now(),
  decided_by uuid references auth.users(id)
);

create table user_validation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  started_at timestamptz default now(),
  wow_moment_at timestamptz,
  first_3_lessons_completed boolean default false,
  notes text
);
```
+ GRANTs + RLS (admin-only read/write).

## بعد ما تخلص المراجعة
- تضغط Apply → السكريبت يشتغل → الدروس تتعدل → الفيديوهات تتعاد رندر تلقائيًا
- roadmap_items يتحدث + `bun run roadmap:log`

## غير داخل في النطاق
- الـ 7 iterate + 6 keep (مؤجل)
- v10 (ملغي نهائيًا)
- تعديل architecture/paths/pipeline

تمام أبدأ؟
