# خطة تنفيذ نتائج تقرير v12

## القاعدة الأساسية

**تجميد كل توليد فيديو على Bunny + رندر Remotion** لحد ما المحتوى النهائي يثبت. يعني:

- مفيش `bash scripts/trigger-lesson.sh` بعد أي تعديل درس.
- مفيش rebuild لـ orphan videos الـ 9.
- التعديلات على ملفات `src/components/intro/lessons/*.ts` بس، بدون trigger.
- نعلّق مؤقتاً قاعدة "auto-trigger lesson video" في الذاكرة (نضيف override: "paused حتى إشعار آخر").

---

## المشاكل الـ 3 من التقرير

1. **Builder بيتحول من "إبداعي" لـ "كورس CS" من m5** — قفزة الـ confusion من 2 لـ 5+ عند JWT/RLS/embeddings.
2. **Creator/Automator مش أسهل من Builder** — boring + غير مقنعين (conf ~5 / bore ~5.5).
3. **Business مكسور تجريبياً** — كل التعليقات "سبت الكورس قبل الدرس ده".

---

## المراحل

### Phase 1 — تجميد الـ video pipeline (5 دقايق)

- تحديث `mem/workflows/auto-trigger-lesson-video.md` بـ banner علوي: **PAUSED — content-freeze mode**.
- تحديث `mem/index.md` Core: تعليق قاعدة "Lesson video re-render (MANDATORY)" مؤقتاً.
- لوج `roadmap_items` واحد: "Freeze video pipeline حتى v13".

### Phase 2 — إعادة ترتيب المسارات (UI فقط، بدون لمس الدروس)

- في `src/lib/curriculum-data.ts` + `src/components/site/Journey.tsx`: عرض المسارات بترتيب جديد على الـ Dashboard:
`Intro → Business (concepts) → Creator/Automator/Analyst → Builder (advanced)`.
- مفيش حذف لأي درس — بس re-order + label واضح إن Builder m5+ "للمتقدمين".
- إضافة badge "تقني" على Builder m5-m10 و Automator m3-m4.

### Phase 3 — إصلاح Business (أعلى ROI)

- مراجعة كل دروس Business في `src/components/intro/lessons/business-*.ts`.
- المشكلة مش في المحتوى — المشكلة إن الـ persona وصلها بعد ما اتلخبط في Builder. لما نرتب المسار (Phase 2)، Business هتتقاس من شخصيات داخلة فريش.
- نعمل sim جديد سريع (v12.1) على Business فقط بـ 20 persona بعد re-order للتأكد إن المشكلة فعلاً كانت order مش محتوى.

### Phase 4 — إعادة كتابة الدروس المكسورة (Builder m5+ و Automator m3-m4)

الدروس المستهدفة من التقرير:

- **Builder**: L18, L24, L30, L31, L33, L62-67
- **Automator**: m3-m4 (كل الدروس)

لكل درس:

1. قراءة الملف الحالي + التعليقات السلبية في raw.json.
2. إعادة كتابة بالـ framing الصح (analogy → mission → concept، مش العكس).
3. حذف أي JWT/RLS/embedding من Builder m5-m8، تأجيلها لـ m9-m10 مع warning واضح "تقني".
4. **بدون trigger للفيديو**.

### Phase 5 — تقسيم Automator

- Module 1-2: "Automation Mindset" (بشري، بدون أدوات).
- Module 3-4: rename لـ "n8n التقني" + warning واضح.
- تحديث `curriculum-data.ts` بالـ split.

### Phase 6 — Sim v13 شامل (validation)

- بعد ما كل التعديلات تخلص، تشغيل `run_v13_full.py` (نسخة من v12 مع personas جديدة) 3 مرات للتأكد إن:
  - completion rate ≥ 80%
  - Builder confusion < 3
  - Business بقى صحي

### Phase 7 — Unfreeze + bulk video regen

- بعد ما v13 يبقى أخضر، نشيل الـ freeze من الذاكرة.
- نعمل `trigger-lesson.sh` على **كل** الدروس المعدّلة (batched ≤400 char IDs).
- نتابع GitHub Actions لحد ما كل الفيديوهات تتجدد على Bunny.

---

## ترتيب التنفيذ (build mode)

نبدأ بـ Phase 1 + 2 في turn واحد (سريعين)، بعدها كل phase في turn منفصل عشان نراجع قبل ما نكمل.

## ملاحظات تقنية

- مفيش schema changes — كله UI + content.
- `roadmap_items` هتاخد row لكل phase + لكل درس معدّل.
- لما نوصل Phase 7، أي درس متعدّل من غير trigger هيفشل `roadmap:guard` build — لازم نشيل/نعدّل الـ guard مؤقتاً في Phase 1.

## القرار المطلوب منك

موافق على الترتيب ده؟ أبدأ من Phase 1+2 على طول؟ 

وا فق علي كل ده ونبداء بالترتيب ورا بعضة