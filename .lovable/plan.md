## الخلاصة المقارنة


| Metric | v12     | v15  | **v16**    |
| ------ | ------- | ---- | ---------- |
| Conf   | 4.1–4.3 | 8.53 | **8.55** ✅ |
| Bore   | 5.6–5.8 | 2.80 | **2.75** ✅ |
| Aha    | منخفض   | 224  | **224**    |
| Quits  | كتير    | 0    | **1**      |


**الحكم: Business Track = 8.8/10 — جاهز، محتاج polish بس.**

عن قلقك من الـ duplication: **فحصت الـ files، مفيش duplication فعلي** (16 درس واضح في `src/components/intro/lessons/business-*.ts`). اللي ظهر في التقرير (`m4-l2-delegate-or-automate`, `m3-l1-customer-lifecycle`) ده **Gemini بيهلوس** الـ ID في ~4 رد من 160 (2.5%). الفايلات نضيفة، لكن لازم نحصّن السكريبت يتجاهل الـ ID اللي الموديل بيرجّعه.

---

## الـ Plan — 3 polish items + sim hardening

### 1. تقوية `business-m1-l1-from-decisions-to-leadership` (أضعف نقطة)

**المشكلة:** conf 8.0 / bore 3.3 — لسه concept-heavy في البداية.

**التعديل:** إعادة ترتيب بداية الدرس:

- **Hook**: "لو اختفيت أسبوع — البيزنس هيقف؟"
- **Self-diagnosis سريع**: 3 أسئلة score من 1-5
- **Mini shock**: "لو جمعت أقل من 9/15 → أنت Operator مش Leader"
- **بعدين** يدخل على Operator vs Builder framework

الـ pricing teaser الموجود يبقى مكانه (شغّال).

### 2. تدعيم `business-m4-l2-reactive-relapse`

**المشكلة:** conf 8.4 / aha 10 — الناس طالبة templates.

**التعديل:** ضيف بلوك جديد:

- **Mini Audit Template** (copy-paste) — 7 أسئلة بتطلع score
- **Copy-paste AI prompt** جاهز يعمل audit أوتوماتيكي على inbox/calendar
- يبقى inline في الدرس (مش link خارجي)

### 3. تحصين سكريبت السميوليتور

**المشكلة:** Gemini بيرجّع IDs مختلفة شوية أحياناً → بياناتك بتبان فيها "duplication" وهمية.

**التعديل:** في `run_v16_intro_business_deep.py`:

- نتجاهل أي `lesson_id` من response الموديل
- نحقن `lesson_id` من اللي إحنا بعتناه (force-pin)
- ده يضمن إن أي تقرير قادم يبقى نضيف 100% بدون اختلاط IDs

### 4. Re-render + Roadmap (mandatory)

- بعد التعديلات على درسين → trigger `lesson-video.yml` للـ 2 IDs
- log كل تعديل في `roadmap_items` بـ `[ai-edit YYYY-MM-DD]` marker
- run `bun run roadmap:log`

### 5. NO new test

مش هعمل تيست جديد بعد التعديلات دي (إلا لو طلبت). الأرقام دلوقتي قوية كفاية — التعديلات polish مش restructure.

---

## بعد كده: move on من Business

زي ما قلت — نوقف الـ iteration على Business ونروح للمسار التالي. عايز نروح فين؟ Builder / Creator / Automator / Analyst / Intro؟

ما تستخدمش ال ai بتاع lovable استخدم api خارجي 

**موافق على الـ plan؟**