---
name: builder-reframing-glossary
description: Builder m5-m8 reframing — Arabic mental-model dictionary + AI-app framing rules to keep non-technical learners from feeling like they entered a CS course
type: design
---

# Builder Reframing — قاموس الـ Mental Model

**القاعدة الأساسية:** اليوزر دخل عشان يبني AI app، مش عشان يتعلم Web Development. أي مصطلح تقني في m5-m8 لازم يتقدم كـ analogy حياتية أولاً، والمصطلح الإنجليزي يبقى ثانوي (بين قوسين أو في نهاية الـ concept).

## القاموس الملزم (لازم يستخدم في كل lesson من m5-m8)

| المصطلح التقني | الـ framing الإلزامي |
|---|---|
| Frontend | **واجهة التطبيق** — "الوش اللي العميل بيشوفه" (زي ديكور المحل) |
| Backend | **مخ التطبيق / الكواليس** — "المطبخ اللي بيطبخ القرار" |
| API | **ساعي البريد** — "بيوصل الرسائل بين البرامج" |
| Database | **المخزن الذكي** — "الأرشيف اللي بنشيّل فيه كل حاجة" |
| JWT | **كارت الدخول المؤقت / الإسورة** — "السيرفر بيعرفك بيها من غير ما تكتب الباسورد" |
| RLS Policy | **الحارس الشخصي لكل سطر** — "كل واحد يشوف اللي يخصه بس" |
| Foreign Key | **الوصلة بين دولابين** — "زي رقم الأوردر على كيس الدليفري" |
| Query | **سؤال للمخزن** |
| Session | **جلسة الزائر** |
| Cascade Delete | **يمسحوا مع بعض** |
| Restrict Delete | **منع المسح لحد ما تفضّى** |
| Many-to-many | **علاقة جدول وسيط** |
| Index | **فهرس عشان السرعة** |
| RAG | **AI بيقرا ملفاتك قبل ما يجاوب** — "زي مدير بيفتح الدرج قبل ما يرد" |

## قاعدة الـ AI-App Framing (لازم تتكرر)

في كل lesson من m5–m8، **لازم يبقى فيه scene واحدة على الأقل** تأكد:

> "إحنا لسه بنبني AI app — مش بنتعلم Web Development. الطبقة دي هي اللي بتخلي الـ AI يقدر يخدم ناس حقيقيين."

أمثلة جاهزة:
- Frontend → "الوش اللي العميل بيكلم منه الـ AI بتاعك"
- Backend → "المخ اللي بيستقبل سؤال العميل ويبعته للـ AI"
- Database → "المخزن اللي بيحفظ سؤال كل عميل ورد الـ AI عليه"
- Auth (JWT) → "عشان كل عميل يكلم AI خاص بيه، مش AI مشترك"
- RLS → "عشان عميل A ميشوفش محادثات عميل B مع الـ AI"
- Relations → "ربط العميل بمحادثاته مع الـ AI"

## الكلمات الممنوعة (تستخدم لو ضروري + analogy في نفس السطر)

- "Software Engineering"
- "Full-stack"
- "Web Development"
- "React" بدون شرح "أداة بنبني بيها الواجهة"
- "SQL" بدون شرح "لغة سؤال المخزن"

## الـ Phases الثلاثة (mental anchors)

1. **Phase 1 — AI Foundation** (m1–m4): "فهمت AI"
2. **Phase 2 — AI Execution** (m5–m8): "بحوّل الـ AI لتطبيق حقيقي" ← الـ phase الخطر
3. **Phase 3 — AI Power** (m9–m10): "بخلي تطبيقي ذكي بجد"

أي تعديل جاي في m5–m8 لازم يفتح بـ reminder من الـ phase ده + analogy من القاموس.
