# خطة v14 — Three-Tier Repositioning

بناءً على نتائج v13 worst-20، المشكلة **positioning مش محتوى**. الخطة دي بتحل الجذر مش الأعراض.

---

## Phase A — Three-Tier System (الجوهر)

إعادة تنظيم الـ 5 مسارات تحت 3 مستويات واضحة، كل مستوى بـ promise مختلف.

### Level 1 — AI User (80% من السوق)

**Promise:** "استخدم AI في شغلك من غير ما تتعلم برمجة"

- Intro
- Business (كامل)
- Creator (كامل)
- Analyst (كامل)
- **Automator Lite** = m1 + m2 فقط (workflows + leads بدون RAG/agents)

### Level 2 — AI Operator

**Promise:** "ابني systems متقدمة بـ AI من غير ما تكتب كود"

- Automator m3 + m4 (RAG practical, agents, webhooks)

### Level 3 — AI Builder (Advanced)

**Promise:** "للي عايز يبني منتجات AI بنفسه — مش المرحلة التالية الطبيعية"

- Builder كامل

**التغيير الحرج:** إزالة أي صياغة بتقول "المرحلة التالية" أو "كمّل لـ Builder". Builder = اختيار، مش progression.

---

## Phase B — إعادة صياغة التحذيرات

بدل `⚠ تنبيه: درس تقني`:

```
⚠ لو هدفك استخدام AI في شغلك فقط،
   ممكن تعدّي الدرس ده بأمان — مش هيأثر على باقي الكورس.
```

يتطبق على:

- كل دروس Builder (المسار كله)
- Automator m3 + m4 (لما يدخلوا Level 2)

---

## Phase C — UI/Curriculum changes

### 1. `src/lib/curriculum-data.ts`

- إضافة حقل `tier: "user" | "operator" | "builder"` لكل path
- Automator يتقسم منطقيًا: m1+m2 = tier "user"، m3+m4 = tier "operator" (نفس المسار، badge مختلف على الموديولات)

### 2. صفحة `/curriculum`

- 3 sections بصرية واضحة:
  - **"للاستخدام اليومي" (Level 1)** — أخضر، مفتوح للكل
  - **"للأنظمة المتقدمة" (Level 2)** — أزرق، badge "متقدم"
  - **"لبناء المنتجات" (Level 3)** — رمادي، badge "للمطورين فقط"

### 3. Landing/Hero copy

- إزالة أي وعد ضمني بإن المستخدم هيطلع "AI engineer"
- التركيز على Level 1 كـ default journey

### 4. Onboarding

- سؤال واحد: "إيه هدفك من AI؟"
  - "أستخدمه في شغلي" → Level 1
  - "أبني systems لشركتي" → Level 1 + 2
  - "أبني منتجات AI" → كل المستويات

---

## Phase D — Validation (v14 sim)

نفس الـ worst-20 personas، نقيس:

- هل completion في Level 1 وصل >85%؟
- هل الـ frustration على Builder اختفى (لأنه بقى opt-in واضح)؟
- هل الـ "حسيت إني بتعلم شغل حد تاني" pattern اختفى من الـ verdicts؟

**Pass criteria:** Level 1 avg completion ≥ 85%، 0 verdicts فيها "مش مكاني".

---

## Phase E — Re-render videos (Phase 7 الأصلية)

بعد ما الصياغة الجديدة للتحذيرات تستقر، نفك التجميد ونعمل re-render للدروس المتأثرة فقط (11 درس: 5 Builder + 6 Automator). Batches ≤400 chars حسب memory.

---

## Roadmap items هتتعمل

1. `v14-phase-a-three-tier-data` — حقل tier + تقسيم Automator
2. `v14-phase-b-warning-rewrite` — صياغة جديدة في 11 درس
3. `v14-phase-c-curriculum-ui` — 3 sections + badges
4. `v14-phase-c-onboarding-question` — سؤال الهدف
5. `v14-phase-c-landing-copy` — إزالة وعود "engineer"
6. `v14-phase-d-sim` — worst-20 v14
7. `v14-phase-e-rerender` — unfreeze + Bunny dispatch

---

## ملاحظات للموافقة

- **مفيش حذف لأي درس** — كله إعادة تنظيم بصري + صياغة
- **مفيش تغيير في lesson IDs** — الـ Automator m3+m4 يفضلوا بنفس الـ ID، بس tier="operator" على الموديول
- **Phase E (re-render) لسه موقوفة** لحد ما توافق صراحة بعد Phase D

---

**سؤال واحد قبل البدء:** هل توافق على تقسيم Automator (m1+m2 في Level 1، m3+m4 في Level 2)، ولا تفضّل Automator كله يبقى Level 2 و"Automator Lite" يبقى مسار جديد منفصل؟

&nbsp;

Automator Lite" يبقى مسار جديد منفصل