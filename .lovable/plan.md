# خطة تعديل محتوى Builder النهائية (v4)

استنادًا لنتايج محاكاة الـ 100 persona + توصياتك الـ 10. كل التنفيذ يستخدم `GEMINI_API_KEY` المباشر فقط — **لا spawn_agent، لا Lovable AI Gateway**.

---

## القواعد الحاكمة (ثابتة في كل تعديل)

1. **الفايدة قبل المصطلح** — أول 20 ثانية = ROI واضح للمتعلم.
2. **القاموس الإلزامي** — `mem://design/builder-reframing-glossary` (Frontend=واجهة، Backend=الكواليس، API=ساعي البريد، Database=المخزن الذكي، JWT=كارت الدخول، RLS=الحارس).
3. **3 خطوات لأي مصطلح**: تشبيه ← الفايدة ← الاسم التقني (في الآخر).
4. **رؤية Builder ثابتة** — مش بنقسمه ولا بنغير هيكله الكبير، بنعدّل الـ framing والمحتوى داخل الدروس + إضافات صغيرة.
5. **بعد أي تعديل** = تحديث `roadmap_items` بـ `[ai-edit YYYY-MM-DD]` + `bun run roadmap:log` + تشغيل `lesson-video.yml` لإعادة الـ render.

---

## المرحلة 1 — إصلاح الانهيارات (Critical Fixes)

### 1A. `builder-m1-l2-tokens-training` (10 quits)

- إزالة أي تشبيه مرفوض (الشاورما إن وُجد) من السكربت والـ scenes.
- إعادة ترتيب الـ blocks:
  1. **TitleCard**: "ليه ساعات الـ AI يرد كويس وساعات لأ؟ وليه الحساب أحيانًا يخلص بسرعة؟"
  2. **BulletsCard**: المشكلة الواقعية (محادثة طويلة → بطء + تكلفة).
  3. **BigStatCard**: تكلفة بسيطة (1000 token ≈ X قرش).
  4. **ConceptCard**: فكرة الـ "قطمة" ببساطة.
  5. **CompareCard**: prompt حشو vs prompt مباشر.
  6. **ConceptCard**: المصطلح التقني `Token` آخر حاجة.
  7. **CTACard**: اختبر فهمك.

### 1B. `builder-m5-l11-backend-api` (11 quits, أعلى confusion)

أنت طلبت "قسّم لدرسين" — في curriculum Builder ده يتم بإضافة درس جديد لنفس الموديول (m5) من غير ما نمس بقية الـ path:

- **L11a — "إزاي التطبيق يفكر؟" (Backend بس)**
  - بدون كلمة API في أول 60–90 ثانية.
  - الكواليس = العقل اللي بياخد القرار + يكلم الـ AI.
  - مثال حي من Lovable (function في الكواليس).
- **L11b — "إزاي التطبيقات تتكلم مع بعض؟" (API)**
  - مثال WhatsApp + CRM، وموقعك + ChatGPT.
  - المصطلح API في الآخر.
  - **ممنوع**: فواتير ضخمة، مفاتيح مسروقة، أي تخويف.

التنفيذ التقني للتقسيم:

- إضافة lesson جديدة في `src/lib/curriculum-data.ts` تحت m5 بعد l11.
- إنشاء ملفي محتوى: `builder-m5-l11-backend-think.ts` + `builder-m5-l12-api-talk.ts`.
- إعادة تسمية وترقيم باقي m5 (l12→l13, l13→l14, …) **في نفس الـ shot** (rename كامل للملفات + الصور + Bunny GUID + DB rows + كل المراجع — حسب قاعدة الـ memory).

### 1C. `builder-m5-l12-database-intro` (7 quits → سيصبح l13)

- افتتاحية جديدة: "لو العميل رجع بعد أسبوع، إزاي التطبيق يفتكره؟"
- التسلسل: Excel sheet → customer list → Database.
- **ممنوع في هذا الدرس**: SQL، Schema، Relations (تأجل لدروس m7).

---

## المرحلة 2 — Reframing لـ m5–m8

### 2A. عناوين الموديولات (في `curriculum-data.ts`)


| Module | العنوان الجديد                    | Subtitle (تقني، مكتوب أصغر)     |
| ------ | --------------------------------- | ------------------------------- |
| m5     | إزاي التطبيق يشتغل فعلاً          | Frontend · Backend · Database   |
| m6     | تحويل الفكرة لتطبيق               | Components · Routes · Debugging |
| m7     | إزاي التطبيق يفتكر وينظم البيانات | Tables · Relations · Queries    |
| m8     | حماية التطبيق والصلاحيات          | JWT · RLS                       |


### 2B. ROI Opener إلزامي

كل lesson في m5–m8 يبدأ بـ **TitleCard فيها سطر واحد**: "بعد الدرس ده هتقدر …"

- JWT → "كل موظف يشوف بياناته بس."
- Database → "التطبيق يفتكر العميل."
- Backend → "التطبيق ياخد قرار لوحده."
- RLS → "العميل A ميشوفش بيانات العميل B."

---

## المرحلة 3 — Psychological Design

### 3A. شاشة انتقال بين m4 و m5

- إضافة "interstitial block" جديد (component خفيف في `src/components/intro/`) يظهر مرة واحدة عند الانتقال من آخر درس m4 لأول درس m5:
  > "لحد هنا فهمت AI كويس. من هنا هنحوّل الفكرة لتطبيق حقيقي خطوة بخطوة. مش مطلوب تكون مبرمج."
- يتخزن في `lesson_progress` إنه اتعرض، فمش يتكرر.

### 3B. Mini-Win بعد m5

- إضافة درس قصير في نهاية m5: **"AI assistant بيرد على عميل — في 5 دقايق"**
- Demo سريع + dopamine hit، **قبل** دخول m7 (queries/relations) أو m8 (jwt/rls).

---

## المرحلة 4 — تقليل Jargon

كل lesson في m5–m8 يمر على linter يدوي للقاموس:

- أي مصطلح من القاموس يظهر بدون analogy في نفس الـ scene = يتعدّل.
- أي ScreenshotCard caption طولها > 280 حرف أو فيها 3 مصطلحات تقنية = تتقسم.
- script: `scripts/lesson-tool.ts --lint-jargon m5-m8` (نوسعه لو لازم).

---

## المرحلة 5 — تخفيف الألم

### 5A. `builder-m6-l18-debugging` (5 quits)

- تقصير 50%: نخلي الدرس "لو الدنيا بازت نعمل إيه" — playbook عملي مش deep dive.
- إزالة أي scenes فيها stack traces أو error logs مفصلة.

### 5B. m9 = Reward Framing

- إعادة كتابة عناوين m9:
  - "دلوقتي هنخلي التطبيق ذكي بجد"
  - بدلًا من Embeddings/Chunks/Vectors في العنوان.
  - الكلمات التقنية تبقى داخل الـ ConceptCard في النص.
- الـ RAG lesson (16 aha) يفضل كـ flagship — نزود فيه Mini-Win demo.

---

## ترتيب التنفيذ المقترح (Phase-by-phase)


| #   | Phase            | Files Touched                                | API Calls (Gemini مباشر) |
| --- | ---------------- | -------------------------------------------- | ------------------------ |
| 1   | 1A tokens fix    | 1 lesson file + 1 video re-render            | ~1 script rewrite        |
| 2   | 1B backend split | 2 new lessons + curriculum-data + renames m5 | ~2 script writes         |
| 3   | 1C database fix  | 1 lesson file + re-render                    | ~1 script rewrite        |
| 4   | 2A module titles | curriculum-data only                         | 0                        |
| 5   | 2B ROI opener    | ~16 lessons (m5–m8) edit TitleCard           | ~16 micro-edits          |
| 6   | 3A interstitial  | 1 new component + progress hook              | 0                        |
| 7   | 3B mini-win      | 1 new lesson                                 | ~1 script write          |
| 8   | 4 jargon lint    | script + manual passes                       | 0                        |
| 9   | 5A debugging cut | 1 lesson file                                | ~1 script rewrite        |
| 10  | 5B m9 reward     | ~3 lesson titles + RAG enhance               | ~1 script edit           |


**كل phase = commit مستقل** + roadmap log + video re-render للدروس المتأثرة (batch ≤400 chars لكل dispatch).

---

## Guardrails

- **مفيش حذف من `roadmap_items**` — تحديث status بس.
- **مفيش spawn_agent، مفيش Lovable AI Gateway.** كل توليد نصي عبر `GEMINI_API_KEY` المباشر (model: `google/gemini-3-flash-preview`).
- **Rename in one shot** — أي lesson اتعدلت بطريقة جوهرية، نعمل rename كامل + re-render فورًا.
- **التحقق بعد كل phase**: تشغيل `bun run roadmap:guard` + `bun run roadmap:log`.

---

## السؤال قبل التنفيذ

تحب أبدأ بـ **المرحلة 1 بالكامل** (الـ 3 إصلاحات الحرجة) كأول دفعة، ولا نبدأ بالـ **المرحلة 2A فقط** (تغيير عناوين الموديولات — تغيير سريع وتأثيره فوري على كل m5–m8)؟ اعمل كل المراحل بالترتيب

&nbsp;