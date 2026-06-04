# خطة v15 → v16: 5 تعديلات صغيرة على مسار Business

## الأولويات (بالترتيب)

### 1. حل تكرار Reactive Relapse (HIGH — بيأثر على analytics)

- درس `reactive-relapse` ظهر في m4-l2 و m6-l1
- **الحل:** فحص `src/components/intro/lessons/business-*.ts` + `curriculum-data.ts` + `INTRO_LESSON_CONTENT` index
- لو فعلاً نسختين → احتفظ بواحدة + احذف التانية (مع rename لو لازم) + update DB roadmap_items
- لو نسخة واحدة بس بـ ID خطأ → rename one-shot (file + images + Bunny GUID + DB)

### 2. Fix JSON parse error في `system-then-people` (HIGH — درس مش متقيّم أصلاً)

- `Unterminated string starting at line 32`
- افتح الملف، صلّح الـ string، حقق إن `getLesson()` بترجعه صح
- شغّل persona-sim للدرس ده فقط (10 personas × 1 lesson) للتحقق

### 3. تقليل 10-15% من النظري في الدروس عالية الـ bore (MEDIUM)

- استهداف: الدروس اللي Restaurant-Owner/Engineer قالوا عليها bore ≥ 4
- **النمط:** كل concept إداري مجرد يبدأ بسؤال/مشكلة قبل ما يدخل الـ framework
- مثال: "Strategic vs Operational vs Admin" → يبدأ بـ "ليه آخر اليوم بتحس..."
- متوقع 4-6 دروس فقط محتاجة tightening

### 4. إضافة "Examples by Business Type" box (MEDIUM — feedback متكرر)

- block جديد اختياري في `intro-lesson-types.ts` أو re-use existing block
- 5 أنواع: مطعم / Ecommerce / Service / HR-Office / Freelancer
- 3-4 سطور لكل نوع
- يتحط في كل درس Business (16 درس)
- **قرار:** ابدأ بأهم 8 دروس (heavy concepts) في الـ batch الأول

### 5. Teaser لـ pricing-cash-flow بدري (LOW — opportunistic)

- درس `pricing-cash-flow` أعلى hit (conf 9 / bore 1)
- إضافة جملة teaser في L1 أو L2: "هنتكلم إزاي تمنع البيزنس يكسب ورق ويخسر فلوس"
- تعديل سطر واحد فقط

---

## التنفيذ


| #   | المهمة                      | الدفعة  | Re-render فيديو؟  |
| --- | --------------------------- | ------- | ----------------- |
| 1   | Reactive duplication fix    | Batch A | نعم للدرس المتأثر |
| 2   | system-then-people JSON fix | Batch A | نعم               |
| 5   | pricing teaser سطر واحد     | Batch A | لا (one-line)     |
| 3   | tighten 4-6 lessons         | Batch B | نعم لكل واحد      |
| 4   | Examples box × 8 دروس       | Batch C | نعم لكل واحد      |


كل batch:

- تحديث `roadmap_items` + `[ai-edit YYYY-MM-DD]: [scope:lessons] ...`
- `bun run roadmap:log`
- `bash scripts/trigger-lesson.sh "<ids>" --force-script` (≤400 char per call)

## Validation

- `bun run test` (unified-lessons + curriculum-data tests)
- persona-sim موجه (5 personas × business فقط) بعد كل دفعة عبر direct Gemini (zero Lovable credits)

## مخاطر

- Examples box ممكن يضخّم الدرس → نخلّيه collapsible
- Reactive duplication fix لو فيه DB rows مرتبطة بالـ ID المحذوف → update مش delete (per memory rule)
- Bunny re-render ~8-12 فيديو = 15-30 دقيقة بالخلفية

هاتعمل كل حاجة وهاتوقف الفيديوهات

&nbsp;