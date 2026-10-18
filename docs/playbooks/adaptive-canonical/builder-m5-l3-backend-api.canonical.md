# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m5-l3-backend-api` |
| **pathId** | `builder` |
| **moduleId** | `builder-m5` |
| **productionTitle (ar-EG)** | كواليس التطبيق وساعي البريد |
| **productionRoute** | `/learn/builder/builder-m5-l3-backend-api` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m5-l3-backend-api.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | API connects what the client sees to hidden backend work |
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
| `builder-m5-l3-backend-api.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Classify UI events as local or server-dependent; map backend requests only when needed |
| **Mission rubric** | 60% clear path · 40% logical |
| **Quiz intent** | Backend talks to AI on client's behalf (correctIndex 1) |
| **Concepts locked** | Backend, API |
| **Prerequisite** | `builder-m5-l2-frontend` |
| **Next lesson** | `builder-m5-l4-database-intro` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m5-l3-backend-api
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m5-l3-backend-api.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Backend & API (Mail Carrier)
  oneAha: "API connects what the client sees to hidden backend work"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m5-l2-frontend]

objectives:
  - id: obj-1
    statement: Learner explains API as messenger between Frontend and Backend.
    measurable: true
  - id: obj-2
    statement: Learner maps button → UI action → backend action → screen response for 3 actions.
    measurable: true

concepts:
  - id: concept-backend
    term: Backend
    termEn: Backend
    definition: Where app thinks — receives, talks to AI, returns.
    mustPreserve: true
  - id: concept-api
    term: API
    termEn: API (Application Programming Interface)
    definition: Language that carries requests and responses between interface and backend.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Server APIs connect UI to backend work; classify local/server actions first
  - role: tension
    intent: Send clicked but nothing happens — no link to backend
  - role: core
    intent: A UI event may update local state, request server work, or both
  - role: comparison
    intent: Menu without waiter vs working restaurant
  - role: glossary
    intent: Backend, API
  - role: video
    intent: Button to response path — production Bunny unchanged
  - role: screenshot
    intent: Button → request → response
  - role: quiz
    intent: Backend talks to AI (correctIndex 1)
  - role: mission
    intent: Classify four actions; map local state or required server flow
  - role: confidence_close
    intent: UI event is not automatically a server request; next = Database

mission:
  type: practice
  intent: Classify local/server actions and map server requests only when needed — ~5–10 min
  rubricIntent:
    - dimension: clear_path
      weight: 60
      criteria: Correct local/server classification and clear state/result path; accept local drafts until first save or send
    - dimension: logical
      weight: 40
      criteria: Visible result follows from action and assumptions; accept correct local behavior without inventing API calls
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_api_flow_for_learner

termsLocked: [Backend, API, Frontend]

links:
  nextLessonId: builder-m5-l4-database-intro
  continuityNote: Database — why app needs memory

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- ماذا ستفهم؟ في تطبيق الذكاء الاصطناعي هذا، تربط واجهات الخادم الواجهة بمعالجة الخلفية وبيانات الحساب.
- لماذا الآن؟ إرسال سؤال للذكاء الاصطناعي أو جلب محادثات الحساب المحفوظة يحتاج إلى الخادم في هذا التصميم. أما فتح قائمة أو تغيير لون محلي فيمكن تنفيذه بالكامل داخل المتصفح.
- ماذا بعد هذه الخطوة؟ صنّف كل إجراء إلى محلي أو معتمد على الخادم، ثم ارسم طلبات الخادم اللازمة فقط.


### Tension — تنقر «إرسال» — ولا شيء يحدث

- **الزر يعمل**. **الشاشة تحمّل**. **لكن الرد لا يصل** — **أو يظهر خطأ**.
- **الواجهة أدت عملها**: **أخذت كلامك ونقر «إرسال»**. **لكن لا أحد يربطها بالكواليس**.
- **API = الجرسون** — **ينقل الطلب من الطاولة إلى المطبخ ويرجع الطعام**.

### Core idea — API تربط الظاهر بالمخفي

- النقر على زر حدث في الواجهة. قد يغيّر معالج الحدث الحالة المحلية، أو يطلب خدمة من الخادم، أو ينفّذ الأمرين.
- مثال محلي: فتح قائمة أو تغيير لونها في المتصفح؛ لا يحتاج هذا التغيير المرئي إلى طلب للخادم.
- مثال يحتاج إلى الخادم في هذا التطبيق: إرسال سؤال عبر API إلى الخلفية لمعالجة الذكاء الاصطناعي ثم عرض الرد؛ وجلب محادثات الحساب من الخادم إن لم تكن محمّلة بالفعل.
- قد تبدأ المحادثة الجديدة بمسودة محلية فارغة حتى أول حفظ أو إرسال. وضّح متى يبدأ الحفظ الدائم، ولا تفترض طلبًا للخادم لكل زر.


### Comparison — منيو بدون جرسون vs مطعم يعمل

| بدون API | مع API |
|----------|--------|
| **العميل يكتب على المنيو** — **لكن لا أحد يوصّل الطلب للمطبخ**. **المنيو جميل — لكن لا طعام** | **العميل يطلب → الجرسون يأخذ الطلب → المطبخ يطبخ → الجرسون يرجع الطعام**. **كل خطوة مربوطة** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Backend (الكواليس)** | **المكان الذي يفكّر فيه التطبيق** — **يستقبل، يكلّم AI، ويرجع** | **عند «إرسال»**، **الكواليس ترسل السؤال للـ AI** |
| **API (ساعي البريد)** | **اللغة التي تنقل الطلبات والردود بين الواجهة والكواليس** | **زر «إرسال» → API → الكواليس تكلّم AI → API → الرد يظهر** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من الزر إلى الرد — مسار API». **لا يُعاد توليده.**

### Screenshot block (intent)

**اكتب رسالة وانقر إرسال**: **الواجهة ترسل طلبًا → الكواليس تكلّم AI → الرد يعود للشاشة**. **هذا مسار API**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **العميل كتب سؤالًا ونقر Send. أي مكوّن مسؤول عن تكلّم AI؟**

- خيار ١: **الواجهة** — **لأن العميل يكتب فيها**.
- **الإجابة الصحيحة (خيار ٢):** **الكواليس** — **هي التي تكلّم AI نيابة عن العميل**.
- خيار ٣: **المتصفح يكلّم AI مباشرة**.

**التفسير:** **الواجهة تأخذ الطلب**. **API تنقله**. **الكواليس تكلّم AI**.

### Mission — ارسم خريطة: زر → ماذا يحدث؟

مهمة تخطيط فقط — دون كتابة كود أو إرسال طلبات فعلية. تكفي ٥–١٠ دقائق. صنّف كل إجراء أولًا إلى محلي أو معتمد على الخادم واذكر افتراضاتك. اشرح تغيير حالة المتصفح ونتيجته للإجراء المحلي. وعند الحاجة إلى الخادم فقط، ارسم: الواجهة → API/الخلفية → الرد.

**التسليم:**

1. إرسال سؤال: اشرح في هذا التطبيق طلب الخادم لمعالجة الذكاء الاصطناعي والرد المعروض.
2. فتح محادثة قديمة: ميّز بين محادثة محمّلة محليًا بالفعل وجلب محادثة الحساب المحفوظة من الخادم.
3. محادثة جديدة: يجوز بقاء المسودة الفارغة محلية حتى أول حفظ أو إرسال؛ اشرح هذا الانتقال.
4. فتح قائمة أو تغيير لون: اشرح تغيير الحالة المحلية في المتصفح دون طلب للخادم لهذا التغيير المرئي.

| البعد | الوزن | المعيار |
|---|---|---|
| مسار واضح | 60% | تصنيف صحيح للإجراء المحلي أو المعتمد على الخادم ومسار واضح للحالة والنتيجة. تُطلب معالجة الخلفية أو بياناتها عند الحاجة فقط؛ تُقبل مسودة المحادثة المحلية حتى أول حفظ أو إرسال. |
| منطقي | 40% | تتبع النتيجة المرئية الإجراء والافتراضات المذكورة. يُقبل السلوك المحلي الصحيح دون اختراع طلب API. |


### Confidence close

- فهمت: حدث الواجهة لا يعني تلقائيًا طلبًا للخادم؛ نستخدم API عندما يحتاج الإجراء إلى معالجة الخلفية أو بياناتها.
- أستطيع تصنيف الإجراءات أولًا، وشرح تغيير الحالة المحلية أو مسار الواجهة → الخلفية → الرد عند الحاجة.
- التالي: قاعدة البيانات — لماذا يحتاج التطبيق إلى ذاكرة محفوظة.


---

## 5. Future generation notes

### Downstream locale packages

All Gulf / English / other locales derive from this MSA canonical script — **not** from Egyptian dialect copy directly.

---

### Script layer status (polish lock — 2026-06-18)

| Field | Value |
|-------|-------|
| **Layer** | MSA Canonical Lesson Script |
| **API audit** | 100/100 reviewed (Anthropic) — 0 CONTENT FAIL |
| **Polish pass** | 2026-06-18 — read-aloud naturalness, gloss normalization, quiz reasoning, mission clarity |
| **Production wiring** | **Not wired** — Egyptian `ar-EG` remains default UX |
| **Video / render** | **Not rendered** — Bunny production videos frozen |
| **Runtime localization** | **Not active** — no locale switch in `src/` |
| **Human sign-off** | **pending** — not production-ready for rollout |

### Feeds next architecture stages (when chartered)

1. Runtime language / locale architecture
2. Video script / voice-over pipeline
3. Assistant localization
4. Mission localization packages
5. Gulf / English / other locale generation from MSA — **not** from Egyptian directly

### Explicitly deferred

- Remotion render / Bunny upload / publish
- Runtime locale switching in `src/`
- Mission evaluator changes
- Assistant/RAG seed from canonical
- Replacing Egyptian on-page copy with this MSA text
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
| Concept preservation | 5 | Backend, API only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — Backend talks to AI |
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
| 6 | Mission rubric 60/40 | ☑ pass |
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ pending |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*


Audit111 scoped correction (2026-10-18): distinguish local UI events from server requests. Agent-reviewed draft; human language/live acceptance pending. Application architecture, quiz key1 and rubric60/40 preserved.
