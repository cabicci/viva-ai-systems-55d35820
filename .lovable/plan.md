## الخطة: تيست v16 شامل

### الهدف

قياس تأثير التعديلات الأخيرة (rename لـ reactive-relapse + pricing teaser في m1-l1) على الـ Business Track كاملاً.

### النطاق

- **10 personas** × **16 درس Business** = 160 خلية
- - **7 دروس Intro** للسياق = 70 خلية
- **الإجمالي: 230 LLM call**
- موديل: `google/gemini-2.5-flash` (متوافق مع gemini-only policy)

### الخطوات

1. **تجهيز السكريبت**: استخدام `scripts/persona-sim/run_v15_intro_business_deep.py` كأساس، نسخه لـ `run_v16_*.py` مع تحديث:
  - رقم النسخة في الـ output paths
  - قراءة محتوى الدروس المحدّثة (الـ rename الجديد + الـ teaser)
2. **التشغيل**: `python scripts/persona-sim/run_v16_intro_business_deep.py`
  - تقدير الوقت: 15-25 دقيقة
  - تقدير التكلفة: ~API call على Gemini Flash   هتاخد api خارجي فقط
  - &nbsp;
3. **التقرير**: توليد `/mnt/documents/persona-sim-v16-FINAL.md` مع:
  - مقارنة v15 vs v16 (confidence, bore, aha, quits)
  - تحليل أثر التعديلات على m1-l1 (pricing teaser) و m4-l2 (rename)
  - توصيات للـ batch التالي

### تأكيد مطلوب قبل التنفيذ

- ⚠️ التيست هيصرف **~230 API call** على Lovable AI Gateway (workspace credits)
- موافق نمشي؟ ولا تفضل تيست أصغر (مثلاً 5 personas × 5 دروس متغيرة فقط = 25 call)؟