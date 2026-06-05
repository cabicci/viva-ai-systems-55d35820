## الهدف

تشغيل 20 برسونا (من الـ100 اللي بنينا قائمتهم في `run_v12_full.py`) يمشوا الدروس بالترتيب من **Intro** كله ← **Creator** كله، ولكل درس: قراءة + كومنت تفصيلي + محاولة Mission. الناتج تقرير شامل بالملاحظات.

**API**: Gemini مباشر (`generativelanguage.googleapis.com`) باستخدام `GEMINI_API_KEY` … `_4` الموجودين كـ env vars — **بدون Lovable AI Gateway** (صفر credits).

## اختيار الـ20 برسونا

من الـ100 = 20 archetype × 5 psych flags. هاخد **برسونا واحدة لكل archetype** (الـ20 archetypes كلهم) مع توزيع flags متنوّع عشان نغطّي كل الأنماط النفسية.

## خطوات التنفيذ

1. **سكريبت جديد**: `scripts/persona-sim/run_v17_intro_creator_20.py`
  - يستورد نفس فكرة `extract_lesson` + استدعاء Gemini من `run_v16`.
  - `LESSON_ORDER = intro كله + creator كله` (مرتّبين بالموديول/الدرس).
  - `PERSONAS = build_personas()[::5]` أو selection يدوي = 20 برسونا.
  - لكل (persona × lesson):
    - prompt Gemini يرجّع JSON: `{comment, mission_attempt, confusion_points, jargon_hits, drop_risk(0-10), aha_moment}`.
    - ThreadPoolExecutor (8-12 threads) + key rotation.
  - Retry/backoff على 429/5xx.
2. **التقرير** (`/mnt/documents/persona-sim-v17-{stamp}.md`):
  - Executive summary: متوسط drop_risk لكل درس، أعلى 10 دروس خطر، أكتر jargon مكرّر.
  - Per-lesson section: ملخص الكومنتات + نقاط الالتباس المشتركة + جودة محاولات الـMission.
  - Per-persona path: رحلة كل برسونا (في أي درس وقف/اتلخبط).
  - Raw JSON جنبه: `persona-sim-v17-{stamp}-raw.json`.
3. **تشغيل**: `python3 scripts/persona-sim/run_v17_intro_creator_20.py` ومتابعة الـlog. متوقّع 20 × ~36 درس ≈ 720 استدعاء Gemini.

## ملاحظات

- مفيش تعديل على الكود الإنتاجي — سكريبت تحليل بس.
- الناتج في `/mnt/documents/` للتنزيل.
- بعد ما التقرير يخلص هنسجّله في `roadmap_items` (`[source:ai] persona-sim v17`).

## أسئلة قبل ما أبدأ

1. تأكيد عدد الدروس: Intro كله (كل ملفات `intro-*.ts`) + Creator كله (18 درس)؟ ولا Intro بس + Creator؟
2. ميزانية الوقت: تشغيل كامل بالـ720 استدعاء ≈ 8-15 دقيقة. تمام؟
3. الانترو والبيونيس والكريتور كلهم