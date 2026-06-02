---
name: lesson-naming-and-approval-workflow
description: Lesson reference format + per-lesson approval workflow before video render
type: preference
---
## التسمية (مطلقة)
لما أتكلم عن أي درس، الصيغة الإجبارية:
`<المسار> · M<رقم الموديول> · درس <ترتيبه داخل المسار> (<lesson-id>)`

مثال: `Intro · M0 · درس 2 (intro-what-is-ai)`.
ممنوع تمامًا "L1, L2, L3..." — دي صيغة عامة بتلخبط.

## Workflow لكل درس
1. أعدّل المحتوى (UI + Remotion scenes).
2. أعرض التغييرات على المستخدم وأطلب موافقة صريحة.
3. لو وافق → أشغّل الرندر على GitHub Actions.
4. لو لأ → أعدّل تاني قبل أي رندر.
ممنوع أي رندر قبل الموافقة.

## Roadmap
- كل درس = صف منفصل في `roadmap_items`.
- log فوري بعد كل تعديل بـ `[ai-edit YYYY-MM-DD]: [scope:lessons] ...`.
