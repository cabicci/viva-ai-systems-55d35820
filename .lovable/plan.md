# خطة مراجعة مسار Builder طبقًا للـ V2

## النطاق

- **Builder M1 → M9 فقط** (٢٦ درس). M10 (deploy + first-users) **مؤجل** زي ما اتفقنا في v2.
- بعد الانتهاء → نعيد persona-sim ونقرر هل نكمل لباقي المسارات.

## المبادئ الحاكمة (مأخوذة حرفيًا من v2)

1. **No Theory Without Tension** — مفيش مفهوم نظري قبل ما المتعلم يحس بمشكلة.
2. **Quick Win** في أول 30 ثانية.
3. مثال حسي قبل المصطلح.
4. مصطلح تقني واحد كحد أقصى لكل درس.
5. Mission ≤ 10 دقايق وأبسط من الحالي.
6. لهجة مصرية + مفيش تكرار.
7. **Momentum metric** (1-10) بعد كل درس — أهم من boring/confusing.

## تعديلات الترتيب/الدمج (قبل ما نبدأ الكتابة)


| #   | التعديل                                                          | السبب               |
| --- | ---------------------------------------------------------------- | ------------------- |
| 1   | `m1-tokens-training` → يتأخر ويتقدّم كـ "إجابة على ألم" مش مقدمة | Tension-First       |
| 2   | `m4-temperature` + `m4-parameters` → **يندمجوا في درس واحد**     | إزالة تكرار         |
| 3   | `m7-sessions-jwt` + `m7-rls` → يتأخروا لحد ما يكون فيه app شغّال | يحتاج سياق          |
| 4   | `m9-embeddings` → ينقل **بعد** `m9-rag`                          | magic قبل mechanics |


النتيجة: ٢٦ → ٢٥ درس (بعد دمج temperature+parameters).

## الترتيب الجديد المقترح (Builder M1-M9)

```
M1  what-is-llm  →  tokens-training (متأخر كإجابة على ألم)
M2  prompt-layer  →  instructions-examples  →  style-control
M3  context-layer  →  memory-limits
M4  parameters-merged (temperature + parameters)
M5  transition  →  frontend  →  backend-api  →  database-intro
M6  idea-to-page  →  wireframe  →  first-prompt-to-lovable
     →  components-routes  →  iteration  →  debugging
M7  tables-columns  →  queries  →  relations
     (sessions-jwt + rls يتأخروا لآخر M7)
M8  (محتوى M8 الحالي يندمج مع M7 — يتراجع لحظيًا)
M9  rag  →  embeddings  →  agents
```

## سير العمل لكل درس (متفق عليه في v2)

1. أعرض الدرس (id + blocks الحالية + ملاحظات السيم لو موجودة).
2. أعرض اقتراح التعديل: **Tension → Quick Win → Wow → ربط بنتيجة**.
3. إنت تقول: ✅ موافق / ✏️ عدّل / ⏭️ سيبه.
4. أنفّذ التعديل + Mission مبسّطة (لو فيه) في نفس اللحظة.
5. ألوگ في `roadmap_items` (`[source:ai]` أو `[source:user]` + `[scope:lessons]`).
6. أبعت الدرس لـ `lesson-video.yml` (≤400 char في الـ payload — batch بحد أقصى ٣).
7. لو الدرس اتعمله rename بسبب slug جديد → rename كامل (file + images + Bunny GUID + DB) من أول لحظة.

## الترتيب الزمني للتنفيذ

**Phase A — تعديلات الهيكل (مرة واحدة، بدون كتابة محتوى):**

- دمج `m4-temperature` + `m4-parameters` في درس واحد.
- نقل `m9-embeddings` لبعد `m9-rag` في `curriculum-data.ts`.
- إعادة ترتيب `m1-tokens-training` و`m7-sessions-jwt`/`m7-rls`.
- تحديث `lesson-naming` لو فيه slugs اتغيّرت.

**Phase B — مراجعة محتوى درس-بدرس:**
نبدأ من `builder-m1-what-is-llm` ونمشي بالترتيب الجديد. كل درس = round صغير معاك للموافقة.

**Phase C — إعادة رندر الفيديوهات:**
كل درس اتغيّر محتواه → batch لـ GitHub Action (٣ فيديوهات في المرة).

**Phase D — قياس الأثر:**
بعد آخر درس → persona-sim جديد. الهدف: completion 65-75% + momentum > 7.

## ملاحظات تقنية

- عمود `momentum_score` موجود في `lesson_feedback` ✅.
- لازم نتأكد إن الـ Quiz/Mission في كل درس يتراجع لو الـ slug اتغيّر (references في DB + components).
- كل تعديل = صف في `roadmap_items` + run `bun run roadmap:log`.

## السؤال قبل ما نبدأ

عاوزني أبدأ بـ **Phase A** (تعديلات الهيكل) دلوقتي، ولا تحب نبدأ مباشرة بـ Phase B من أول درس `builder-m1-what-is-llm` ونعمل الهيكل لما نوصل لنقطة الدمج؟

&nbsp;

ومتنساش اعادة تسمية الملفات بنفس السيناريو بتاع الانترو وتوحيد كل ما هو مرتبط واكد عليا انك فهمت

و نبداء phase a