---
name: Roadmap discipline
description: Roadmap = strategic memory, not task list. Rules for editing roadmap_items.
type: preference
---
# Roadmap discipline

الـ `roadmap_items` table = **ذاكرة استراتيجية** بين الـ sessions:
- Goals كبيرة
- قرارات اتاخدت
- Open questions
- Status على مستوى المسار، مش الخطوة

**مش** task list تنفيذي. التفاصيل التنفيذية (خطوات صغيرة، sub-tasks) مكانها `task_tracking` داخل الـ loop — هي loop-local وبتتمسح كل user message.

## قواعد إجبارية

1. **قبل أي INSERT/UPDATE/DELETE على `roadmap_items`:** اعمل `SELECT` الأول واقرا الموجود. ممنوع تكتب من غير ما تقرا.
2. **كل بند = goal/intent، مش step.** لو لقيت نفسك بتقسّم حاجة واحدة لـ 5 بنود، ده غلط — اعمل بند واحد و notes فيها التفاصيل.
3. **Notes هي اللي بتشيل التفاصيل** — endpoints، limits، sub-tasks، edge cases. الـ title يفضل قصير واستراتيجي.
4. **مفيش UNIQUE constraint على title** (حل وهمي — أي rewording بيلتفّ عليه). الحماية في الـ workflow: اقرا قبل ما تكتب.

## مثال

❌ غلط:
- "Migration: rate_limit_buckets"
- "Helper rate-limit.server.ts"
- "Rate limit على evaluateMissionWithAI"
- "Rate limit على assistant-runtime"
- "Rate limit على logClientError"

✅ صح:
- title: "Cost protection: Rate limiting على AI endpoints"
- notes: قايمة الـ 3 endpoints + الـ limits + الـ infra needed