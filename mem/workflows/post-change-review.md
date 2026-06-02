---
name: Post-change review workflow
description: إجراء إجباري بعد أي بند/تعديل يخلص — impact scan + roadmap re-prioritization
type: preference
---
# Post-Change Review Workflow

بعد ما أي بند يخلص (code change، migration، refactor، fix، decision)، ممنوع أقول "خلص" قبل ما أعمل الـ 2 خطوات دول:

## 1. Impact scan

امشي على كل حاجة ممكن تكون اتأثرت بالتعديل:

- **Code references:** `rg` على اسم الـ table/function/file/symbol اللي اتغيّر. لو في references قديمة لسلوك قديم → عدّلها أو وثّقها.
- **Docs:** `src/lib/dna-report.functions.ts`, `src/routes/system-state.tsx`, `docs/ARCHITECTURE.md`, `docs/RUNBOOK.md`, `HANDOFF.md`, `START_HERE.md` — في أي حاجة بتوصف السلوك القديم؟
- **Tests:** فيه test كان بيختبر السلوك القديم وممكن يفشل أو بقى irrelevant؟
- **Decisions log:** هل القرار ده يستاهل سطر في `.lovable/decisions.md`؟
- **Memory:** فيه ملف `mem://...` بيقول حاجة بقت غلط دلوقتي؟

## 2. Roadmap ripple + re-prioritization

- اقرأ بنود `roadmap_items` اللي حالتها `todo` أو `in_progress`.
- لكل بند اسأل:
  - **Unblocked:** التعديل ده فتح طريقه؟ (مثلاً refactor سهّل feature تاني)
  - **Blocked / changed scope:** التعديل ده غيّر نيّتنا أو خلّى البند ده مش ضروري؟
  - **Higher priority now:** فيه risk جديد اتكشف بسبب التعديل؟
  - **Lower priority now:** الـ pain اللي البند ده بيحلّه قلّ؟
- لو الترتيب اتغيّر → اعرض للمستخدم جدول مقارنة قبل/بعد + اقترح البند الجاي.
- لو الترتيب ما اتغيّرش → قول كده صراحة ("راجعت الباقي، الترتيب مفيش فيه تغيير").

## 3. التقرير النهائي للمستخدم

بعد أي بند، الرد لازم يحتوي على:
1. **اللي اتعمل** (موجز + سبب لكل خطوة).
2. **Verification** (query/test/screenshot يثبت إنه شغّال).
3. **Impact scan result** (لقيت إيه + عملت إيه).
4. **Roadmap re-prioritization** (الترتيب الجاي + اقتراح بند بعده).

## ممنوع

- "خلص" من غير impact scan.
- "عايز ندخل على البند اللي بعده؟" من غير ما أكون فعلاً راجعت إنه لسه أولى.
- افتراض إن مفيش ripple بدون ما أبحث.