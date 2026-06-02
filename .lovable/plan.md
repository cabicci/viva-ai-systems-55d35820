## الهدف

إعادة بناء مسار **Intro (7 دروس)** من الصفر طبقاً لمبادئ الوثيقة v2 (Tension-First + Momentum + Split نفسي). كل درس جديد يستبدل القديم في نفس المكان بالتسمية الجديدة، ويترندر فيديوه في GitHub Action. باقي المسارات (Builder/Creator/Automator/Analyst/Business) **ما تتلمسش دلوقتي**.

---

## القواعد الحاكمة (من الوثيقة v2)

1. **No Theory Without Tension**: مفيش مفهوم نظري قبل ما المستخدم يحس بمشكلة
2. **Quick Win**: أول 30 ثانية تجاوب "إيه الفايدة لي دلوقتي؟"
3. **مثال حسي قبل المصطلح** + مصطلح تقني واحد كحد أقصى لكل درس
4. **Mission ≤10 دقايق** وأبسط من الحالي
5. **لهجة مصرية** (طبقاً لقواعد `mem://design/egyptian-arabic-prompt-rules`)
6. **AI models: google/gemini فقط** — ممنوع openai/*

---

## التسمية الجديدة (متفق عليها قبل كده)

النمط: `<path>-m<module#>-l<lesson#>-<slug>`


| L#  | ID الجديد                        | الموضوع                     |
| --- | -------------------------------- | --------------------------- |
| L1  | `intro-m1-l1-what-is-ai`         | إيه هو الـ AI؟              |
| L2  | `intro-m1-l2-first-prompt`       | أول prompt                  |
| L3  | `intro-m1-l3-setup-your-ai`      | اختار أداتك                 |
| L4  | `intro-m1-l4-ai-can-cannot`      | يقدر/مايقدرش                |
| L5  | `intro-m1-l5-ai-vs-software`     | AI vs Software              |
| L6  | `intro-m1-l6-learn-without-fear` | اتعلم من غير خوف            |
| L7  | `intro-m1-l7-choose-your-path`   | اختار مسارك (مع Split نفسي) |


أسماء ملفات الكود والفيديو تتبع نفس الـ ID.

---

## سير العمل لكل درس (loop واحد)

```text
1. أعرض الدرس القديم (blocks الحالية)
2. أعرض اقتراح v2:
   - Tension hook (مشكلة المستخدم بيحسها)
   - Quick Win
   - Wow moment
   - ربط بنتيجة
   - Mission مبسطة
3. ✅ موافق / ✏️ عدّل / ⏭️ سيبه
4. لما توافق:
   a. أكتب الملف الجديد بالاسم الجديد
   b. أحدّث curriculum-data.ts (استبدال في نفس الموضع)
   c. أحدّث lessonsRegistry + knowledge_chunks
   d. migration لتحويل lesson_id القديم → الجديد في progress/status/feedback
   e. ألوگ في roadmap_items مع [source:user] / [ai-edit]
   f. أبعت الدرس لـ lesson-video.yml يرندر الفيديو
5. أتأكد إن الفيديو خلص بنجاح
6. أنتقل للدرس اللي بعده
```

---

## الخطوة التمهيدية (مرة واحدة قبل L1)

1. **Migration: عمود `momentum_score smallint**` في `lesson_feedback` (مطلوب من v2 — Metric #3)
2. **حفظ الوثيقة v2 في `mem://design/content-revision-plan-v2**` كمرجع دائم
3. **تحديث `mem://index.md**` Core: إضافة قاعدة "Tension-First + Momentum-as-metric"
4. **Roadmap item رئيسي**: `[source:user] Intro v2 rebuild — 7 lessons` مع 7 sub-items

---

## القديم: استبدال في المكان (مش مسح مسبق)

- مفيش مسح جماعي قبل البداية
- كل درس قديم يتحذف **في نفس الـ commit** اللي بيضيف الجديد
- بيانات المستخدمين (`lesson_progress`, `user_lesson_status`, `lesson_feedback`) تتحوّل من الـ ID القديم للجديد (مش تتمسح)
- الفيديو القديم على Bunny يفضل لحد ما الجديد يخلص رندر، بعدين يتحذف

---

## نقاط فنية مهمة

- **Lesson ID convention الجديد** يخالف Core memory الحالية (`{path}-{module}-{slug}` بدون رقم درس). هاحدّث Core بعد ما توافق.
- **GitHub Action `lesson-video.yml**`: payload ≤400 char، فهنبعت درس واحد في كل trigger (مش batch)
- **بدون AI Gateway**: التوليد بيتم منّي مباشرة (مش spawn_agent بيكلف credits على gemini)
- **روابط `/learn/...**`: هتتحدّث تلقائياً لما curriculum-data يتغير

---

## أول حركة فعلية بعد ما توافق على الخطة

1. Migration: `momentum_score`
2. حفظ v2 في mem
3. أعرضلك الدرس **L1 (`intro-m1-l1-what-is-ai`)**:
  - blocks الحالية
  - اقتراح v2 (Tension hook + Quick Win + Mission جديدة)
4. تقولي ✅/✏️/⏭️
5. اكد عليا انك هاتستخدم ال api بتاعتي انا مش بتاعت lovable 