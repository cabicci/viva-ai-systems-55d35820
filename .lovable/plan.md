# خطة بروديكت Business كامل (مرة واحدة)

الهدف: مسار Business يوصل **9.5/10** — متوازن، عملي، ومبني حوالين قصة واحدة.

---

## 1. الهيكل الجديد: 4 Modules × 15 درس

```
M1 — العقلية (3 دروس)
  L1: AI Operating System (مش أدوات، نظام تفكير)
  L2: Reactive vs Proactive (إزاي AI بيقلب الـ mode)
  L3: AI as Thinking Partner [جديد] — Decision Framework

M2 — العميل + الفلوس (4 دروس)
  L4: Customer Lifecycle بالـ AI
  L5: Retention Flow (Build Along: فلو احتفاظ كامل)
  L6: Readiness Signals
  L7: Pricing & Cash Flow [جديد] — AI في التسعير والكاش

M3 — التشغيل + الفريق (4 دروس)
  L8: Delegate or Automate (Framework القرار)
  L9: Strategic / Operational / Admin
  L10: System then People
  L11: Hiring & Onboarding [جديد] — AI في التوظيف

M4 — الاستدامة + الصورة الكاملة (4 دروس)
  L12: Premature Scaling
  L13: Reactive Relapse (Weekly Rhythm)
  L14: Full Ecosystem (الـ 5 مسارات في يوم واحد)
  L15: Your AI Business OS [جديد] — تجميع كل الـ Build Along في نظام واحد
```

**15 درس بدل 12.** كل module متوازن (3-4 دروس).

---

## 2. الـ Case Study الموحّد

**"أحمد — صاحب مطعم في المعادي"**

- بيظهر في كل درس بمرحلة مختلفة من رحلته
- L1: أحمد reactive، بيطفي حرايق
- L7: أحمد بيكتشف إنه بيخسر 18% من كل طلب
- L11: أحمد بيوظف Operations Manager بالـ AI
- L15: أحمد عنده Business OS كامل شغّال

كل درس فيه scene قصير من رحلته → بيخلي المسار قصة مش محاضرات.

---

## 3. Build Along — نظام واحد بيتبني عبر 15 درس

كل درس بيضيف **قطعة** للـ "AI Business OS" الشخصي للمتعلم:


| الدرس | القطعة اللي بتتبني                          |
| ----- | ------------------------------------------- |
| L1    | Mindset Audit (ورقة تشخيص)                  |
| L2    | Proactive Trigger List                      |
| L3    | Decision Prompt Template                    |
| L4    | Customer Journey Map                        |
| L5    | Retention Flow كامل (Notion)                |
| L6    | Readiness Scorecard                         |
| L7    | Pricing Calculator + Cash Tracker           |
| L8    | Delegate/Automate Matrix                    |
| L9    | Task Classifier                             |
| L10   | SOP Template                                |
| L11   | JD + Onboarding Generator                   |
| L12   | Scale Readiness Check                       |
| L13   | Weekly Review Ritual                        |
| L14   | Ecosystem Map                               |
| L15   | **Business OS Dashboard** (تجميع كل ما سبق) |


في نهاية المسار: المتعلم عنده نظام شخصي شغّال، مش مجرد معلومات.

---

## 4. Framework الكتابة لكل درس

```
1. Hook (Case Study scene — أحمد بيواجه مشكلة)
2. Promise (هتطلع بإيه من الدرس)
3. Concept (المفهوم + إزاي AI بيغيّره)
4. Build Along (تبني القطعة بتاعتك دلوقتي)
5. Output (الـ artifact اللي طلعت بيه)
6. Next (إزاي بيوصل بالدرس الجاي)
```

---

## 5. خطة التنفيذ (Sequential — مرة واحدة)

### Phase A — Restructure (يوم 1)

1. Rename + reorganize ملفات `src/components/intro/lessons/business-*` على الـ pattern: `business-m{1-4}-l{1-15}-{slug}.ts`
2. تحديث `curriculum-data.ts` بـ 4 modules
3. تحديث `lessonsRegistry.ts`
4. Migration في DB: تحديث lesson_ids
5. Trigger video re-render للـ renames (batch ≤400 chars)

### Phase B — Write Content (أيام 2-4)

- إعادة كتابة الـ 12 درس الموجودين بالـ framework الجديد + Case Study + Build Along
- كتابة الـ 3 دروس الجديدة (L3, L7, L11, L15 — فعلياً 4 جديدة بحساب L15)
- كل درس: hook → promise → concept → build along → output → next

### Phase C — Build Along Artifacts (يوم 5)

- إنشاء الـ templates/sheets/prompts المطلوبة في كل Build Along
- L15: Dashboard component يجمع كل الـ outputs

### Phase D — Re-render + QA (يوم 6)

- Trigger `lesson-video.yml` لكل الـ 15 درس (batched)
- مراجعة الفيديوهات بعد generate
- تحديث roadmap_items بكل خطوة

---

## 6. ملفات هتتعدل / تتعمل

**ملفات جديدة:**

- 4 ملفات دروس جديدة في `src/components/intro/lessons/`
- 15 build-along artifact (templates/components)
- `src/components/business/BusinessOSDashboard.tsx` (للـ L15)

**ملفات هتتعدل:**

- 12 ملف درس موجود (rename + rewrite)
- `src/lib/curriculum-data.ts`
- `src/components/business/lessons/lessonsRegistry.ts`
- Migration واحدة لتحديث lesson_ids في DB

**Roadmap logging:** كل خطوة بـ `[source:ai]` marker + `bun run roadmap:log`.

---

## التقييم المتوقع: **9.5/10**

- ✅ Modules متوازنة (4 × 3-4 دروس)
- ✅ Cash + People + Decision Framework مُغطّيين
- ✅ Case Study موحّد عبر كل المسار
- ✅ Build Along بمخرج ملموس في كل درس
- ✅ AI Operating System كخيط ناظم واضح
- ✅ Wow factor: المتعلم بيطلع بنظام شخصي شغّال

**مدة التنفيذ التقديرية:** 6 أيام عمل متتالية.

هل أبدأ؟

عندي سؤال جاوب عليه الاول ليه ٦ ايام مهو احنا نخلص دلوقتي؟ 

الحاجة التاني لازم كل الدروس يكون ليها علاقة بال ai مش كلام نظري اداري