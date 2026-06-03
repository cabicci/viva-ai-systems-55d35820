# خطة التحديث بعد Persona Sim v9

## الخلاصة من الـ 3 آراء + رأيي

الكل متفق على:

- المكاسب من **UX/visual flow** مش من المحتوى التعليمي
- النظام نضج (86.5% apply مع رفض حقيقي = صحة)
- خطر **analysis paralysis** لو كملنا v10
- لازم **manual gate** قبل التطبيق عشان السلسلة السردية متتكسرش
- توثيق القواعد كـ Design System Guidelines

## المراحل

### المرحلة 1 — Freeze (نفس اليوم)

- git tag `pre-v9-apply` قبل أي تعديل
- إيقاف أي شغل على persona-sim (مفيش v10)
- توثيق روح v9 في `roadmap_items` كـ done

### المرحلة 2 — Reviewed Apply للـ 83 درس

بدل Massive Apply الأعمى:

1. سكريبت يقرأ `v9-suggestions.json` ويعمل preview لكل درس (الترتيب القديم vs الجديد جنب بعض)
2. **manual gate**: 30 ثانية لكل درس — نوافق/نرفض/نعدّل
3. التطبيق = إعادة ترتيب `SCENES` array حسب `suggested_order` + تطبيق rules:
  - CTA دايمًا آخر بلوك
  - منع تتالي لونين متطابقين
  - سقف 2 ConceptCard متتاليين (نكسرها بـ BulletsCard/QuoteCard)
4. بعد كل درس → trigger `lesson-video.yml` لإعادة الرندر (batch ≤400 chars)
5. تسجيل كل تعديل في `roadmap_items` بـ `[ai-edit YYYY-MM-DD]`

**التوقع:** 83 درس × 30 ث = ~45 دقيقة مراجعة + شغل auto للباقي

### المرحلة 3 — Design System Guidelines (موازي)

ملف `docs/lesson-design-rules.md` يحتوي:

- ترتيب البلوكات المعياري
- قواعد التلوين والكسر
- موقع الـ CTA
- hierarchy للموبايل

يبقى مرجع لأي درس جديد. القواعد دي تتحول لـ lint script على `SCENES` arrays.

### المرحلة 4 — تأجيل الـ 7 iterate + 6 keep

- مفيش شغل عليهم دلوقتي
- بعد validation المستخدمين، نقرر لو محتاجين رجوع ليهم

### المرحلة 5 — Validation حقيقي (الأهم)

- 15 مستخدم عربي مبتدئ، أعمار مختلفة، مش تقنيين
- مش launch، مش marketing
- **المقياس الوحيد:** هل حصل wow moment خلال أول 7 دقايق؟ (مش completion، مش NPS)
- لو نعم لـ 10+ من 15 → جاهزين للـ soft launch
- لو لأ → نرجع نشوف أول 3 دروس بس، مش نلف على كل المنصة

## اللي مش هنعمله (صراحةً)

- ❌ v10 من persona-sim
- ❌ Massive Apply أعمى من غير مراجعة
- ❌ تقارير AI جديدة قبل validation البشر
- ❌ تعديل المسارات/البلوكات/البايبلاين (architecture frozen)

## التفاصيل التقنية

- ملف القرارات: `public/persona-sim/v9-apply-decisions.json` (يتولد من المراجعة اليدوية)
- سكريبت التطبيق: `scripts/apply-v9-suggestions.ts`
- سكريبت الـ video re-render: `scripts/trigger-lesson.sh` (موجود) — batched
- guard: `roadmap:guard` يتأكد إن كل lesson edit عنده marker

## السؤال قبل ما نبدأ

المراجعة اليدوية للـ 83 درس: تفضل تعملها كلها مرة واحدة (~45 دقيقة) ولا على دفعات حسب الـ path (Builder الأول، بعدها Creator، إلخ)؟

&nbsp;

فهمني اكتر نقطة نقطة والمطلوب مني؟

وايه او حاجة هانبتدي بيها؟