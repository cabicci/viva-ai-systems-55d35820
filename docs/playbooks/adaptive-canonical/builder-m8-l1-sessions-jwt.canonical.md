# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m8-l1-sessions-jwt` |
| **pathId** | `builder` |
| **moduleId** | `builder-m8` |
| **productionTitle (ar-EG)** | كارت الدخول (Sessions & JWT) |
| **productionRoute** | `/learn/builder/builder-m8-l1-sessions-jwt` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m8-l1-sessions-jwt.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Session = المنصة تتذكر أنك داخل — JWT = كارت دخول مؤقت يثبت ذلك |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending.** It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `builder-m8-l1-sessions-jwt.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Session = platform remembers login; JWT = temporary pass between server and browser |
| **Mission rubric** | 35% المستخدم واضح · 35% فهم «لسه داخل» · 30% انتهاء الصلاحية |
| **Quiz intent** | Personal page needs Session + temporary pass (correctIndex 0) |
| **Concepts locked** | Session, JWT |
| **Prerequisite** | `builder-m7-l3-queries` |
| **Next lesson** | `builder-m8-l2-rls` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m8-l1-sessions-jwt
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m8-l1-sessions-jwt.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Sessions & JWT
  oneAha: "Session = platform remembers you are logged in — JWT = temporary pass proving it"
  difficulty: intermediate
  estimatedMinutes: 10
  prerequisites: [builder-m7-l3-queries]

objectives:
  - id: obj-1
    statement: Learner explains Session and JWT as temporary login proof without password each click.
    measurable: true
  - id: obj-2
    statement: Learner answers 3 short questions — who user, how still logged in, when expires.
    measurable: true

concepts:
  - id: concept-session
    term: Session
    termEn: Session
    definition: Platform remembers you are logged in — no password on every click.
    mustPreserve: true
  - id: concept-jwt
    term: JWT
    termEn: JWT
    definition: Temporary pass proving you are still logged in — between server and browser.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Builder-only optional depth; Session + JWT in two lines; 3 short answers after
  - role: tension
    intent: Platform must remember who is logged in for personal pages
  - role: core
    intent: Hotel card analogy — Session remembers; JWT = temporary pass
  - role: glossary
    intent: Session, JWT
  - role: optional_depth
    intent: Technical details optional — not required for mission
  - role: screenshot
    intent: JWT lifecycle diagram — optional
  - role: video
    intent: Login to pass — optional; production Bunny unchanged
  - role: quiz
    intent: Personal page needs Session + pass (correctIndex 0)
  - role: mission
    intent: 3 one-sentence answers — user, still in, expiry
  - role: confidence_close
    intent: Next = RLS

mission:
  type: practice
  intent: 3 short answers — who user, how platform knows still in, when expires — ~5 min
  rubricIntent:
    - dimension: user_clear
      weight: 35
      criteria: Specific user named — not just "people"
    - dimension: still_logged_in
      weight: 35
      criteria: Explains how platform remembers login — own words OK
    - dimension: expiry
      weight: 30
      criteria: When login again or pass expires — logical and realistic
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - require_jwt_implementation_details

termsLocked: [Session, JWT, login]

links:
  nextLessonId: builder-m8-l2-rls
  continuityNote: RLS — simple rules for who sees what in the database

slugValidation:
  validatedAt: 2026-06-18
  lessonId: pass
  productionFile: pass
  prerequisites: pass
  nextLessonId: pass
  missionRubric: pass
  quizAnswer: pass
```

---

## 4. Arabic MSA canonical lesson text

### Orientation — بداية الدرس

- **هذا الدرس لمسار Builder فقط.** **إن كان هدفك استخدام الذكاء الاصطناعي في العمل أو المحتوى**، **لست مضطرًا لحفظ JWT** — **يمكنك تخطيه والعودة لاحقًا**.
- **ماذا ستفهم؟** **فكرة بسيطة:** **كيف تتذكر المنصة أنك ما زلت داخلًا من دون كتابة كلمة المرور كل مرة**.
- **الفكرة في سطرين:** **Session (جلسة)** = **المنصة تتذكر أنك داخل**. **JWT (كارت دخول مؤقت)** = **يثبت ذلك بين السيرفر والمتصفح**.
- **ماذا بعد الدرس؟** **٣ إجابات قصيرة** — **ليس كودًا ولا تنفيذًا**.

### Tension — لماذا يجب أن «تتذكرك» المنصة؟

- **تفتح التطبيق وترى صفحة «طلباتي»** — **إن نسيت المنصة أنك دخلت**، **قد تعرض بيانات خاطئة أو تطلب login في كل نقرة**.
- **المشكلة ليست معقدة:** **نحتاج طريقة بسيطة تقول للسيرفر «هذا نفس الشخص الذي دخل منذ قليل»**.
- **مهم فقط إن كنت تبني تطبيقًا فيه حسابات شخصية**. **إن لم تكن تبني الآن — الفكرة العامة كافية**.

### Core idea — كارت الفندق — Session و JWT ببساطة

- **تشبيه:** **عند تسجيل الدخول في فندق**، **الاستقبال يعطيك كارت غرفة مؤقتًا**. **الكارت ليس هويتك الكاملة** — **لكنه يقول للمصعد والباب: «هذا النزيل ما زال هنا»**.
- **Session** = **المنصة تتذكر أنك داخل**. **بعد login، النظام يعمل على أساس أنك نفس المستخدم**.
- **JWT** = **كارت دخول مؤقت يثبت ذلك بين السيرفر والمتصفح**. **المتصفح يحتفظ بالكارت ويرسله مع كل طلب** — **من دون كلمة المرور مرة أخرى**.

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Session (جلسة)** | **المنصة تتذكر أنك داخل** — **من دون سؤالك كلمة المرور في كل نقرة** | **فتحت التطبيق الساعة ٩** — **حتى ينتهي «الكارت»، المنصة تتعامل معك كأنك ما زلت داخلًا** |
| **JWT — كارت دخول مؤقت** | **يثبت أنك ما زلت داخلًا** — **بين السيرفر والمتصفح** | **ككارت غرفة الفندق:** **يدخلك من دون العودة للاستقبال كل مرة** |

### Optional depth — تفاصيل تقنية (اختياري)

> **لمن يريد بناء منتجات بنفسه.** **إن كان هدفك استخدام الذكاء الاصطناعي في عملك فقط — تخطَّ هذا القسم.**

- **إرسال رقم مستخدم وحده سهل تزويره**. **الكارت المؤقت (JWT) يصدره السيرفر ويمكن التحقق منه**.
- **الخطوات:** **login → السيرفر يعطي كارت → المتصفح يرسله مع كل طلب → السيرفر يتأكد ويكمل**.

### Screenshot block (optional — production reference)

> **اختياري:** رسمة دورة حياة JWT — **login → كارت → كل طلب → تأكيد**. **مرجع إنتاج فقط — لا يُعاد توليده.**

### Video block (production reference only — optional)

> في الإنتاج: فيديو Bunny — «من login إلى كارت الدخول». **اختياري للمهتمين ببناء التطبيقات. لا يُعاد توليده.**

### Quiz — تأكيد سريع

**السؤال:** **سارة تبني تطبيقًا فيه صفحة «محادثاتي» شخصية وصفحة «الأسعار» للجميع. ما الفكرة الصحيحة؟**

- **الإجابة الصحيحة (خيار ١):** **«محادثاتي» تحتاج أن تتذكر المنصة من داخل** — **مثل Session وكارت دخول مؤقت**.
- خيار ٢: **يكفي أن الواجهة تخفي رابط «محادثاتي» من دون login**.
- خيار ٣: **إرسال رقم مستخدم في الرابط — كافٍ دائمًا**.

**التفسير:** **الصفحة الشخصية تحتاج إثبات أنك ما زلت داخلًا** — **ليس مجرد إخفاء الرابط**. **الفكرة: Session + كارت مؤقت**.

### Mission — ٣ إجابات قصيرة — ليس تنفيذًا

**المقدمة:** **مهمة خفيفة — ٥ دقائق**. **٣ إجابات بجملة لكل واحدة**. **ليس مطلوبًا JWT ولا كود**.

**التسليم:**

1. **من المستخدم؟** (جملة واحدة)
2. **كيف تعرف المنصة أنه ما زال داخلًا؟** (جملة — بلغتك، ليس مصطلحات تقنية)
3. **متى تنتهي الصلاحية؟** (جملة — متى «الكارت» ينتهي أو يحتاج login مرة أخرى)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| المستخدم واضح | 35% | **مستخدم محدد بجملة** — **ليس «الناس» فقط** |
| فهم «ما زال داخلًا» | 35% | **شرح كيف تتذكر المنصة الدخول** — **بأسلوبك** |
| انتهاء الصلاحية | 30% | **متى يحتاج login مرة أخرى** — **منطقي وواقعي** |

### Confidence close

- **فهمت:** **Session = المنصة تتذكر أنك داخل**. **JWT = كارت دخول مؤقت يثبت ذلك**. **الفكرة العامة كافية لهذه المرحلة**.
- **تستطيع:** **عندك ٣ إجابات قصيرة عن المستخدم والدخول وانتهاء الصلاحية** — **من دون كود**.
- **التالي:** **RLS** — **قواعد بسيطة لمن يرى ماذا في المخزن**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Session**, **JWT** preserved — gloss on first use. Optional technical blocks match production shape. JWT diagram = production reference. Deferred: Bunny · Remotion · RAG · runtime.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user locale | Manual **always wins** |
| 2 | Saved preference | Persisted |
| 3 | Geo suggestion | Auto-suggest |
| 4 | Default | **Egyptian Arabic production** |

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Session, JWT only |
| Beginner clarity | 4 | Optional depth preserved |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 35/35/30 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Session + pass |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | | pending |
| Concept preservation | | pending |
| Beginner clarity | | pending |
| MSA simplicity | | pending |
| Mission consistency | | pending |
| Quiz integrity | | pending |
| Assistant boundaries | | pending |
| Localization readiness | | pending |

| Human reviewer average | **pending — not scored** |
| **Production-ready?** | **no** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 35/35/30 | ☑ pass |
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ pending |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
