# خطة إعادة framing مسار Builder

## الفكرة الأساسية

مش هنفصل Builder Lite / Pro. هنخلي Builder مسار واحد متكامل بـ **3 phases نفسية** + **rewrite للمصطلحات التقنية بـ analogies** عشان غير التقنيين يكملوا.

---

## Phase 1 — AI Builder Foundation (m1 → m4)

**الحالة:** شغّالة كويس، confidence 8+، مفيش مشاكل. **مش هنغير حاجة في المحتوى.**

التغيير الوحيد: إضافة **شاشة انتقال نفسية** بعد آخر درس في m4.

### Transition Screen (component جديد)

- مكانها: نهاية `builder-m4-l8-parameters` أو كـ interstitial route
- الرسالة:
  > "لحد هنا أنت فهمت AI فعلاً. من هنا هنبدأ نحول الأفكار لتطبيقات حقيقية. مش محتاج تكون مبرمج — هنمشي معاك خطوة بخطوة."
- CTA واحد: "كمّل للـ Execution" (مفيش خيار يطلع — عشان نحافظ على Builder كـ core)
- ممكن يبقى milestone celebration برضو (badge, progress 40%)

---

## Phase 2 — Builder Execution (m5 → m8) — **rewrite كامل للـ framing**

**المحتوى نفسه يفضل، بس المصطلحات والـ mental model يتغيروا.**

### قاموس الترجمة (يطبق في كل lesson files):


| المصطلح الحالي | الـ framing الجديد                              |
| -------------- | ----------------------------------------------- |
| Frontend       | **واجهة التطبيق** — "الوش اللي العميل بيشوفه"   |
| Backend        | **مخ التطبيق** — "المكان اللي بياخد القرار"     |
| API            | **ساعي البريد** — "بيوصل الرسائل بين البرامج"   |
| Database       | **المخزن الذكي** — "الدولاب اللي بيخزن كل حاجة" |
| JWT            | **كارت دخول مؤقت**                              |
| RLS            | **كل موظف يشوف اللي يخصه**                      |
| Foreign Key    | **الرابط بين دولابين**                          |
| Query          | **سؤال للمخزن**                                 |
| Session        | **جلسة الزائر**                                 |


### اللي هيتعدل في كل درس من m5–m8:

- `eyebrow` و `title` — يبقوا بالعربي المبسط + المصطلح بين قوسين
- أول scene/intro — analogy واضحة قبل أي مصطلح تقني
- `terms` array — كل term يبقى عربي + شرح حياتي + المصطلح الإنجليزي تحته
- أي مثال code — يتقدم كـ "شوف ساعي البريد ده بيعمل إيه" مش "هنعمل API call"
- إضافة scene جديدة في كل lesson تربط الـ analogy بالـ AI use case (عشان اليوزر يفتكر إنه لسه في AI course مش React course)

### الـ lessons المتأثرة (11 درس):

- m5: l9-transition, l10-frontend, l11-backend-api, l12-database-intro
- m6: l13-l18 (6 دروس Lovable)
- m7: l19-tables, l20-relations, l21-queries
- m8: l22-sessions-jwt, l23-rls

---

## Phase 3 — AI Power Builder (m9 → m10)

**Reframing فقط — مفيش rewrite كبير.**

- Module 9 يتقدم كـ: "دلوقتي هنخلي التطبيق ذكي بجد" (مش "RAG & Agents")
- إضافة شاشة intro لـ m9 تربط m5–m8 (الأساس) بـ m9 (الذكاء)
- m10 يفضل زي ما هو

---

## الـ deliverables بالترتيب

1. **Audit دقيق لكل lesson من m5–m8** — استخراج كل مصطلح تقني + اقتراح بديله العربي (output: `mem://design/builder-reframing-glossary.md`)
2. **Transition Screen component** بعد m4 (component + route integration)
3. **Rewrite m5–m8** — 11 lesson file، كل واحد:
  - تحديث الـ scenes (terms, eyebrows, titles, intro)
  - الحفاظ على نفس الـ lesson ID والـ structure (مفيش rename)
  - تسجيل في roadmap_items + trigger lesson-video.yml لكل lesson
4. **Reframe m9 intro** — درس واحد (`builder-m9-l24-rag`) يتعدل أول scene يربط بالـ Execution Phase
5. **اختبار** — تشغيل persona-sim v11 على نفس الـ 100 personas بعد التعديلات للمقارنة

---

## ملاحظات تقنية (للـ AI)

- مفيش schema changes في DB — كل التغيير في `src/components/intro/lessons/*.ts`
- الـ lesson IDs تفضل زي ما هي (مفيش rename) عشان Bunny videos تتحدث في نفس الـ GUID
- كل lesson متعدل = `roadmap_items` entry جديد + `bash scripts/trigger-lesson.sh "<id>" --force-script` (batched ≤400 chars)
- الـ Transition Screen ممكن يبقى داخل `IntroSection` كـ special variant أو route جديد `/learn/builder/transition-execution`
- الـ glossary يتحط في `mem://` عشان أي rewrite مستقبلي يلتزم بنفس المصطلحات

---

## المخاطر

- **مدة التنفيذ:** rewrite 11 درس + إعادة render فيديوهات = استهلاك credits + وقت GitHub Actions كبير
- **Veo/TTS:** الـ analogies الجديدة لازم تتماشى مع `mem://design/egyptian-arabic-prompt-rules` عشان الـ voiceover ميبقاش غريب
- **الـ aha moments في m9:** لو الـ reframing لـ m5–m8 ضعّف الأساس التقني، m9 ممكن يبقى أصعب — لازم نراقب في v11 sim

---

## السؤال قبل البدء

تحب أبدأ بالـ **Audit + Glossary** الأول (خطوة 1) عشان توافق عليه قبل ما نلمس أي درس؟ ولا أبدأ بالـ Transition Screen (خطوة 2) كـ quick win مرئي؟

&nbsp;

نفذ التعديلات وابعت لجيت هب الاسكريب الجديد وما بتستخدمش غير ال api الخارجي 