# Adaptive Lesson Engine — Sample Package

## 1. Header metadata

| Field | Value |
|-------|-------|
| **lessonId** | `intro-m1-l2-first-prompt` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **prototypeStatus** | docs-only sample |
| **sourceVersion** | `prototype-v0` |
| **localeVersions** | `ar-MSA-v0` · `ar-EG-v0` · `ar-Gulf-v0` · `en-v0` |
| **generatedFrom** | Existing lesson content (`src/components/intro/lessons/intro-m1-l2-first-prompt.ts`) — read-only extraction; production file **not modified** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | A clear prompt = Role + Context + Task + Format — not magic words |

---

## 2. Source lesson summary

**Title (production):** أول Prompt ليك  
**Route:** `/learn/intro/intro-m1-l2-first-prompt`

### Learning objective (from source)

The learner understands that a **Prompt** is a clear request—not magic—and that vague requests produce vague answers. They learn four parts of a strong prompt: **Role**, **Context**, **Task**, and **Format**. After the lesson they can write one improved prompt for a real need (email, post, summary, reply).

### Block flow (production)

1. **Orientation** — What you'll learn; why now (after trying AI once); what you'll do after (write one real prompt).
2. **Tension** — Vague request (“write something about marketing”) → generic output; AI reads exactly what you write.
3. **Core idea** — Clear prompt = Role + Context + Task + Format; quick café/post example; fix the question, not swap tools.
4. **Glossary** — Prompt (طلب); Context (سياق).
5. **Video** — Optional: weak vs strong prompt (Bunny playback exists in production; not regenerated here).
6. **Comparison** — Vague vs clear marketing/post examples (Alexandria sweets shop).
7. **Screenshot** — Four boxes visual (role, context, task, format).
8. **Quiz** — Ahmed's vague email prompt: most important addition = **context**.
9. **Mission** — Write one improved prompt for something real; tag [role][context][task][format]; optional one-line reply if tried.
10. **Confidence close** — Prompt = instructions + context; next lesson = open first AI and send a simple message.

### Mission intent (production — preserved in all locales)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| طلب واضح / clear request | 70% | Prompt includes role, context, task, format (even if simple) |
| موضوع حقيقي / real topic | 30% | Chosen from work or daily life—not empty generic example |

**Mission rules (production):** Not a perfect answer required; honest attempt that can be tried in any AI. AI may help wording—learner chooses final text (implied by lesson shape; assistant must not submit mission).

### Concepts locked (must not hallucinate beyond)

- Prompt, Context, Role, Task, Format, AI
- Four-part prompt framework
- Vague vs clear comparison pattern
- Quiz answer: context is the first priority for Ahmed's email example

---

## 3. Canonical Arabic MSA source

> **localeVersion:** `ar-MSA-v0` · **role:** canonical intent · **dialect:** Modern Standard Arabic (neutral)

### Orientation

**ماذا ستفهم؟** الـ **Prompt** (الطلب أو التعليمة التي ترسلها للذكاء الاصطناعي) ليس جملة سحرية، بل طلبًا واضحًا يحدد ما المطلوب من النموذج.

**لماذا الآن؟** في الدرس السابق جرّبت الذكاء الاصطناعي مرة. اليوم ستفهم لماذا يُعطي أحيانًا ردًا ممتازًا وأحيانًا ردًا عامًا.

**ماذا بعد الدرس؟** ستكتب **Prompt** واحدًا محسّنًا لحاجة حقيقية من عملك أو يومك — جاهز للاستخدام أو التجربة.

### Tension

كتبت: «اكتب لي شيئًا عن التسويق» — فحصلت على نص عام؟

الذكاء الاصطناعي لا يقرأ أفكارك. يقرأ ما تكتبه بالضبط. إذا كان الطلب غامضًا، كان الرد غامضًا — ليس لأن الأداة ضعيفة، بل لأن السؤال ناقص تفاصيل.

الخبر الجيد: لا تحتاج أن تكون خبيرًا. تحتاج أربع عناصر بسيطة في رسالتك.

### Core idea

**الـ Prompt الواضح = دور + سياق + مهمة + شكل**

- **Role (الدور):** من يكون الذكاء الاصطناعي في هذه الرسالة؟ (محرر، مستشار، مساعد…)
- **Context (السياق):** ما الموقف؟ (من أنت، لمن تكتب، لماذا الآن؟)
- **Task (المهمة):** ماذا تريد بالضبط؟ (تلخيص، أفكار، رد…)
- **Format (الشكل):** كيف يظهر الرد؟ (نقاط، جدول، عدد كلمات…)

**مثال:** بدل «اكتب لي منشورًا» → «أنت محرر محتوى عربي (دور). أفتح مقهى في القاهرة (سياق). اكتب ٣ أفكار منشور لإنستغرام (مهمة)، كل فكرة ٣ أسطر (شكل).»

إذا لم يعجبك الرد، غالبًا المشكلة في الطلب — عدّل السؤال وجرّب مرة أخرى.

### Glossary

| المصطلح | المعنى |
|---------|--------|
| **Prompt (طلب)** | الرسالة التي تكتبها للذكاء الاصطناعي لتنفيذ مهمة محددة. |
| **Context (سياق)** | التفاصيل التي تساعد النموذج على فهم الموقف قبل الإجابة. |

### Comparison

| طلب غامض | طلب واضح |
|----------|----------|
| «اكتب لي شيئًا عن التسويق» → فقرات عامة بلا جمهور ولا هدف | «أنت محرر محتوى. أفتح محل حلويات في الإسكندرية. اكتب ٣ أفكار منشور، كل واحدة سطران» → رد قريب مما ستنشره |

### Quiz (unchanged intent)

أحمد كتب: «اكتب إيميلًا لوظيفة جديدة». ما أهم إضافة أولًا؟  
**الإجابة الصحيحة:** سياق — من أحمد، ما الوظيفة، ولماذا هذا الإيميل.

### Confidence close

فهمت: الـ Prompt الواضح = تعليمات + سياق.  
تستطيع: كتابة طلب محدد لأي حاجة وتعديله حتى يناسبك.  
التالي: فتح أول أداة ذكاء اصطناعي وإرسال رسالة بسيطة — تطبيق عملي لما كتبته هنا.

---

## 4. Egyptian localized learner version

> **localeVersion:** `ar-EG-v0` · **audience:** Egyptian beginner · **tone:** warm, direct, professional Egyptian

### Orientation

**هتفهم إيه النهاردة؟**  
الـ **Prompt** (الطلب اللي بتبعتّه للـ AI) مش سحر — هو طلب واضح بيخلّي الـ AI يعرف يعمل إيه.

**ليه دلوقتي؟**  
في الدرس اللي فات جرّبت AI مرة. النهاردة هتفهم ليه نفس السؤال ساعات بيجيب رد ممتاز وساعات رد فاضي.

**هتعمل إيه بعد الدرس؟**  
هتكتب Prompt واحد محسّن لحاجة حقيقية من شغلك أو يومك — جاهز تستخدمه أو تجربّه.

### Tension

كتبت «اكتبلي حاجة عن التسويق» — وجالك كلام عام؟

الـ AI مش بيقرأ دماغك. بيقرأ اللي بتكتبه بالظبط.  
الطلب مبهم → الرد مبهم. مش لأن الأداة ضعيفة — السؤال ناقص تفاصيل.

مش محتاج تبقى خبير. محتاج أربع حاجات بسيطة في رسالتك.

### Core idea

**الـ Prompt الواضح = دور + سياق + مهمة + شكل**

- **Role (الدور):** الـ AI يتصرف كإيه في الرسالة؟  
- **Context (السياق):** الموقف إيه؟  
- **Task (المهمة):** عايزه يعمل إيه بالظبط؟  
- **Format (الشكل):** الرد يطلع إزاي؟ نقط، جدول، كام كلمة؟

**مثال:**  
بدل «اكتبلي بوست» → «إنت محرّر محتوى عربي (دور). بافتح كافيه في القاهرة (سياق). اكتبلي ٣ أفكار بوست إنستجرام (مهمة)، كل واحد ٣ سطور (شكل).»

الرد مش عاجبك؟ غالبًا عدّل الطلب — مش غيّر الـ AI.

### Glossary

- **Prompt (طلب):** الرسالة اللي بتكتبها للـ AI عشان يعمل حاجة محددة.  
- **Context (سياق):** التفاصيل اللي بتخلي الـ AI يفهم الموقف قبل ما يرد.

### Comparison

| مبهم | واضح |
|------|------|
| «اكتبلي حاجة عن التسويق» — كلام عام | «إنت محرّر. بافتح محل حلويات في الإسكندرية. ٣ أفكار بوست، كل واحد سطرين» — قريب من اللي هتنشره |

### Quiz

أحمد كتب: «اكتب إيميل لشغل جديد». إيه أهم حاجة تضيفها الأول؟  
**السياق** — مين أحمد، الشغل إيه، والإيميل ده ليه.

### Confidence close

الـ Prompt الواضح = تعليمات + سياق.  
تقدر تكتب طلب محسّن لأي حاجة محتاجها.  
الدرس الجاي: تفتح أول AI وتبعت رسالة بسيطة — تطبّق اللي كتبته هنا.

---

## 5. Gulf localized learner version

> **localeVersion:** `ar-Gulf-v0` · **audience:** Gulf beginner · **tone:** light Gulf-friendly, professional, not exaggerated

### Orientation

**شنو راح تفهم اليوم؟**  
الـ **Prompt** (الطلب اللي ترسله للـ AI) مو سحر — هو طلب واضح يخلي الـ AI يعرف وشنو يسوي.

**ليش الحين؟**  
في الدرس اللي قبل جرّبت AI مرة. اليوم راح تفهم ليش نفس السؤال أحيانًا يعطيك رد ممتاز وأحيانًا رد عام.

**شنو بعد الدرس؟**  
راح تكتب Prompt واحد محسّن لشي تحتاجه فعلًا من شغلك أو يومك — جاهز تستخدمه أو تجربّه.

### Tension

كتبت «اكتب لي شي عن التسويق» — وطلع لك كلام عام؟

الـ AI ما يقرأ أفكارك. يقرأ اللي تكتبه بالضبط.  
طلب غامض → رد غامض. مو لأن الأداة ضعيفة — السؤال ناقص تفاصيل.

ما تحتاج تكون خبير. تحتاج أربع عناصر بسيطة في رسالتك.

### Core idea

**الـ Prompt الواضح = دور + سياق + مهمة + شكل**

- **Role (الدور):** الـ AI يكون مثل مين في الرسالة؟  
- **Context (السياق):** وش الموقف؟  
- **Task (المهمة):** وش تبي بالضبط؟  
- **Format (الشكل):** الرد يطلع بأي شكل؟ نقاط، جدول، كم كلمة؟

**مثال:**  
بدل «اكتب لي بوست» → «أنت محرر محتوى عربي (دور). بافتح مقهى في الرياض (سياق). اكتب ٣ أفكار بوست إنستغرام (مهمة)، كل فكرة ٣ أسطر (شكل).»

الرد ما عجبك؟ غالبًا عدّل الطلب — مو غيّر الـ AI.

### Glossary

- **Prompt (طلب):** الرسالة اللي ترسلها للـ AI عشان يسوي مهمة محددة.  
- **Context (سياق):** التفاصيل اللي تخلي الـ AI يفهم الموقف قبل ما يرد.

### Comparison

| غامض | واضح |
|------|------|
| «اكتب شي عن التسويق» — كلام عام | «أنت محرر. بافتح محل حلويات في جدة. ٣ أفكار بوست، كل واحدة سطرين» — قريب من اللي راح تنشره |

### Quiz

أحمد كتب: «اكتب إيميل لوظيفة جديدة». وش أهم إضافة أول؟  
**السياق** — مين أحمد، الوظيفة وشي، وليش هذا الإيميل.

### Confidence close

الـ Prompt الواضح = تعليمات + سياق.  
تقدر تكتب طلب محدد لأي شي تحتاجه.  
الدرس الجاي: تفتح أول AI وترسل رسالة بسيطة — تطبّق اللي كتبته هنا.

---

## 6. English localized learner version

> **localeVersion:** `en-v0` · **audience:** English beginner · **tone:** plain, encouraging

### Orientation

**What you'll understand:** A **prompt** is not magic—it is a clear request that tells the AI what to do.

**Why now:** In the last lesson you tried AI once. Today you'll see why the same question sometimes gets a great answer and sometimes a empty one.

**What you'll do after:** Write one improved prompt for something real in your work or daily life—ready to use or test.

### Tension

You wrote “write something about marketing” and got generic text?

AI does not read your mind. It reads exactly what you type.  
Vague request → vague answer. Not because the tool is weak—because the question lacks detail.

You don't need to be an expert. You need four simple pieces in your message.

### Core idea

**A clear prompt = Role + Context + Task + Format**

- **Role:** Who is the AI in this message? (editor, advisor, assistant…)
- **Context:** What's the situation? (who you are, who it's for, why now)
- **Task:** What exactly should it do? (summarize, ideas, reply…)
- **Format:** How should the answer look? (bullets, table, word count…)

**Example:**  
Instead of “write a post” → “You are an Arabic content editor (role). I'm opening a café in Cairo (context). Write 3 Instagram post ideas (task), 3 lines each (format).”

If the answer isn't helpful, fix the request—don't blame the AI first.

### Glossary

- **Prompt:** The message you send the AI to do a specific job.  
- **Context:** Details that help the AI understand the situation before answering.

### Comparison

| Vague | Clear |
|-------|-------|
| “Write something about marketing” — generic paragraphs | “You're an editor. I'm opening a sweets shop in Alexandria. 3 post ideas, 2 lines each” — close to what you'd publish |

### Quiz

Ahmed wrote: “Write an email for a new job.” What's the most important thing to add first?  
**Context** — who Ahmed is, what job, and why this email.

### Confidence close

A clear prompt = instructions + context.  
You can write a specific request for anything you need and improve it.  
Next lesson: open your first AI tool and send a simple message—apply what you wrote here.

---

## 7. Localized mission variants

> **Intent preserved:** Choose a real topic; write one prompt with role, context, task, format; note if tried or will try next lesson. **Rubric unchanged:** 70% clear four-part prompt · 30% real topic. **Not easier/harder** — copy and labels only.

### ar-MSA — `ar-MSA-v0`

**المقدمة:** اختر حاجة تحتاجها فعلًا — بريد، منشور، تلخيص، رد على رسالة — واكتب Prompt واحد فيه الدور والسياق والمهمة والشكل.  
**التسليم:**  
١) الموضوع (جملة)  
٢) الـ Prompt الكامل — علّم: [دور] [سياق] [مهمة] [شكل]  
٣) إن جرّبت: الرد في سطر أو سطرين. إن لم تجرب: اكتب أنك ستجرّبه في الدرس التالي.

**معايير:** طلب واضح (٧٠٪) · موضوع حقيقي (٣٠٪)

### ar-EG — `ar-EG-v0`

**المقدمة:** اختار حاجة محتاجها فعلًا — إيميل، بوست، تلخيص، رد على رسالة — واكتب Prompt واحد فيه الدور والسياق والمهمة والشكل.  
**التسليم:**  
١) الموضوع (جملة)  
٢) الـ Prompt الكامل — علّم: [دور] [سياق] [مهمة] [شكل]  
٣) لو جرّبته: الرد في سطر أو سطرين. لو لسه: اكتب إنك هتجرّبه في الدرس الجاي.

**معايير:** طلب واضح (٧٠٪) · موضوع حقيقي (٣٠٪)

### ar-Gulf — `ar-Gulf-v0`

**المقدمة:** اختر شي تحتاجه فعلًا — إيميل، بوست، تلخيص، رد على رسالة — واكتب Prompt واحد فيه الدور والسياق والمهمة والشكل.  
**التسليم:**  
١) الموضوع (جملة)  
٢) الـ Prompt الكامل — علّم: [دور] [سياق] [مهمة] [شكل]  
٣) إذا جرّبته: الرد في سطر أو سطرين. إذا بعد: اكتب إنك راح تجربّه في الدرس الجاي.

**معايير:** طلب واضح (٧٠٪) · موضوع حقيقي (٣٠٪)

### en — `en-v0`

**Intro:** Pick something you actually need—email, post, summary, reply—and write one prompt with role, context, task, and format.  
**Submit:**  
1) Topic (one sentence)  
2) Full prompt — label: [role] [context] [task] [format]  
3) If you tried it: reply in one or two lines. If not: say you'll try it in the next lesson.

**Rubric:** Clear four-part prompt (70%) · Real topic (30%)

---

## 8. Assistant behavior profiles

### ar-MSA — `ar-MSA-v0`

| Field | Value |
|-------|-------|
| **tone** | مدرب هادئ — فصحى مبسّطة، مش رسمي زيادة |
| **allowed help** | شرح Role/Context/Task/Format · أسئلة تفكيرية عن نقص الطلب · مراجعة هل الطلب فيه الأربع عناصر · اقتراح صياغة — المتعلم يختار النهائي |
| **forbidden** | كتابة تسليم المهمة كاملًا · «هاكتب لك الـ Prompt جاهز للنسخ والإرسال» · اختيار موضوع المهمة بدل المتعلم |
| **mission-answer requests** | «اكتب لي المهمة» → ارفض بلطف؛ وجّه: «اختر موضوعك، ثم نراجع معًا هل فيه دور وسياق ومهمة وشكل» |
| **English AI terms** | أول ذكر: **Prompt (طلب)** · **Context (سياق)** · **Role (دور)** · **Task (مهمة)** · **Format (شكل)** — ثم العربية أو المصطلح المختصر |

### ar-EG — `ar-EG-v0`

| Field | Value |
|-------|-------|
| **tone** | warm Egyptian coach — زي الدرس، من غير slang مبالغ |
| **allowed help** | توضيح الفرق بين طلب مبهم وواضح · «إيه اللي ناقص في Prompt بتاعك؟» · أمثلة على سياق لأحمد (quiz) · صياغة مقترحة — المتعلم يعدّل |
| **forbidden** | «هاكتبلك المهمة» · ملء الـ template بالكامل · حل الـ quiz بدل المتعلم |
| **mission-answer requests** | «اكتبلي الـ Prompt» → «اختار موضوع من شغلك، واكتب مسودة — أنا أساعدك تعلّم [دور][سياق][مهمة][شكل]» |
| **English AI terms** | أول مرة: Prompt (طلب)، Context (سياق) — بعد كده «الطلب» / «السياق» |

### ar-Gulf — `ar-Gulf-v0`

| Field | Value |
|-------|-------|
| **tone** | Gulf-friendly coach — خفيف، محترم، مو theatrical |
| **allowed help** | شرح الأربع عناصر · أسئلة عن نقص السياق · أمثلة محلية (مقهى، محل) بدون تغيير الهدف |
| **forbidden** | إكمال المهمة · كتابة الـ Prompt النهائي copy-paste · invent موضوع جديد للمتعلم |
| **mission-answer requests** | «اكتب لي Prompt جاهز» → وجّه لاختيار موضوع حقيقي + مسودة + مراجعة العناصر الأربعة |
| **English AI terms** | أول ذكر بالعربي + English بين قوسين؛ بعدها مختصر |

### en — `en-v0`

| Field | Value |
|-------|-------|
| **tone** | Plain, patient English coach |
| **allowed help** | Explain four parts · Ask what's missing · Quiz-style hints for Ahmed · Suggest wording—learner edits |
| **forbidden** | Full mission submission · Writing the entire prompt for copy-paste · Answering quiz for the learner |
| **mission-answer requests** | «Write my prompt» → «Pick your real topic, draft it, we'll check role/context/task/format together» |
| **English AI terms** | Define prompt and context simply on first use; no extra jargon |

---

## 9. Video-script-ready outline (structure only — no Remotion)

> **videoVersion:** not assigned · **note:** Production Bunny video exists; outlines below are for future localized re-voice/regen only.

### Shared beat map

| Beat | Purpose |
|------|---------|
| 1. Hook | Vague marketing request → generic output |
| 2. Objective | One Aha: Role + Context + Task + Format |
| 3. Explanation | Walk four parts + one café/post example |
| 4. Example | Side-by-side weak vs strong (10–15 sec each) |
| 5. Recap | «Fix the request, not the tool» |
| 6. Mission handoff | Write one real prompt; tag four parts |
| 7. Voice direction | Coach, medium pace, explain English terms once |

### Per-locale voice direction

| Locale | Persona | Pace | Code-switch |
|--------|---------|------|-------------|
| **ar-MSA-v0** | Neutral Arabic narrator | medium | English terms once with Arabic gloss |
| **ar-EG-v0** | Egyptian coach | medium-warm | Prompt/Context on first beat only |
| **ar-Gulf-v0** | Gulf-friendly coach | medium | Light «راح/شنو» in spoken; terms glossed once |
| **en-v0** | Plain English coach | medium | No Arabic except brand «Masaarat» if needed |

### ar-EG spoken hook (sample line — outline only)

«كتبت „اكتبلي حاجة عن التسويق“ — وجالك كلام عام؟ النهارده هنشوف أربع حاجات بسيطة تخلي أي Prompt أوضح.»

---

## 10. Versioning notes

```
sourceVersion: prototype-v0
    │
    ├── localeVersion: ar-MSA-v0  (canonical MSA package — this sample §3)
    ├── localeVersion: ar-EG-v0   (Egyptian learner text — §4)
    ├── localeVersion: ar-Gulf-v0 (Gulf learner text — §5)
    └── localeVersion: en-v0      (English learner text — §6)
            │
            ├── videoVersion: (unassigned — future Remotion/Bunny pin per locale)
            └── ragVersion: (unassigned — future seed pin; must match localeVersion)
```

**Rules demonstrated:**

- `sourceVersion` bumps only if objectives or four-part framework change.
- Each `localeVersion` is immutable once approved; edits → new suffix (`ar-EG-v0.1`).
- `videoVersion` and `ragVersion` must reference the same `localeVersion` chain.
- This sample is **`prototype-v0` / draft** — not wired to production PATHS, Bunny, or `knowledge_chunks`.

---

## 11. Review checklist

| Check | Status |
|-------|--------|
| Objective preserved (four-part prompt + one real prompt mission) | ☐ pending human review |
| No hallucinated concepts (only Role/Context/Task/Format + Prompt/Context glossary) | ☐ |
| English terms explained on first use (all locales) | ☐ |
| Mission intent preserved (70/30 rubric, real topic, four tags) | ☐ |
| Assistant does not solve mission (all four profiles) | ☐ |
| Quiz intent preserved (context first for Ahmed) | ☐ |
| Ready for human review | ☐ |
| **Not ready for production until approved** | ✅ confirmed |

---

## 12. Lessons learned (prototype feasibility)

| Observation | Implication |
|-------------|-------------|
| **Single Aha maps cleanly to MSA → EG → Gulf → EN** | Four-part framework is locale-portable; dialect is surface, intent is stable |
| **Production lesson is already Egyptian** | `ar-EG-v0` ≈ extraction + light normalization; MSA/Gulf/EN are the real adaptation work |
| **Mission rubric is locale-agnostic** | Weights (70/30) copy verbatim; only labels and examples localize |
| **Assistant profiles differ mainly in tone + refusal phrasing** | Same forbidden set; Gulf needs lighter touch to avoid caricature |
| **Video outline reuses one beat map** | Future pipeline: one `sourceVersion` → four spoken scripts → four `videoVersion` pins |
| **Manual effort still significant** | One lesson ≈ manageable; 100 lessons needs tooling + review gates — engine design holds |
| **Verdict** | **Feasible for prototype Phase 1** — proceed with `business-m1-l2-reactive-vs-proactive` and `automator-m3-l2-triggers-actions` samples before any runtime |

---

*Sample owner: Adaptive Lesson Engine prototype · Draft only · Does not modify `intro-m1-l2-first-prompt.ts` or production runtime.*
