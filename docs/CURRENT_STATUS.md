# مسارات (masaarat.ai) — Current Status

## 2026-09-27 — ترتيب Kids والباقات

- صفحة Kids العامة تعرض تعريفًا وثلاثة مستويات وروابط إلى مساحة وليّ الأمر وأسعار كيدز؛ أزيل جدول الأسعار وبطاقات تفاصيل الاشتراك من الصفحة. بقيت مساحة وليّ الأمر مستقلة على `/kids/family` وصفحة المستوى تعرض قائمة الدروس.
- تعرض صفحة `/pricing#kids` أسعار كيدز ضمن باقات المنصة. رابط صفحة Kids ينقل إلى هذا القسم مع الحفاظ على اللغة.
- عند اختيار دفع Pro أو Pro Plus يظهر تنويه كيدز، وقبل الانتقال إلى Stripe تظهر خطوة مراجعة صريحة: الطلب الحالي يخص باقة الكبار فقط. لم تُضف باقة كيدز أو سعرها أو صلاحياتها إلى عملية الدفع؛ أرجئ ربطها بـStripe حسب قرار المالك. بقي Stripe في وضع الاختبار.
- فحص هذه الخطوة: 10 اختبارات واجهة ذات صلة نجحت، وESLint للملفات المعدلة نجح، وبناء Vite نجح. النشر والتحقق من الإنتاج لم يثبتا بعد.

## 2026-09-27 — Kids: صفحة مستقلة لوليّ الأمر

- مسار `/kids/family` يجمع موافقة وليّ الأمر على سياسة خصوصية الأطفال وإنشاء ملفاتهم وإدارتها، مع روابط للانتقال إلى دروس المستوى. تستخدم الرحلة حساب المنصة نفسه؛ الموافقة والملفات محفوظة بحساب وليّ الأمر في قاعدة البيانات.
- صفحة Kids وصفحة المستوى تعرضان رابطًا لمساحة وليّ الأمر؛ صفحة الدرس تعرض رابطًا عند الحاجة إلى الموافقة أو ملف مناسب، دون نموذج الموافقة أو إنشاء طفل داخل الدرس. يظل اختيار الملف وفتح الدرس خاضعين لفحص الخادم.
- تسجيل الدخول أو تأكيد التسجيل بقصد Kids يوجّه إلى `/kids/family` مع اللغة المختارة. فحص محلي: 9 اختبارات موجهة نجحت وبناء Vite نجح. الدمج والنشر والتحقق من الواجهة الحية لم تثبت بعد.

## 2026-09-27 — رحلة الزائر: تقديم Kids وحجب صفحة الدرس حتى التسجيل

- أضيف قسم تعريفي بأعمار ومسارات Kids في آخر الصفحة الرئيسية بأربع لغات؛ بطاقة Kids القائمة في قسم المسارات باقية.
- يبقى `/curriculum` عامًا ويعرض أسماء الدروس. يتطلب `/learn/$pathId/$lessonId` جلسة حساب موثقة قبل تشغيل محمل الدرس، بما في ذلك دروس الباقة المجانية؛ التحقق على الخادم مع حارس واجهة أثناء تهيئة الحساب.
- فحص محلي: 14 اختبارًا مرتبطًا بالدروس والمصادقة نجح، ESLint للملفات الجديدة والمعدلة بلا أخطاء (تحذير Fast Refresh قديم في ملف الدرس)، وبناء Vite نجح بذاكرة Node مرفوعة. النشر والتحقق من زائر غير مسجل في الإنتاج **قيد الانتظار**.
- حدود هذه الخطوة: حجب صفحة الدرس لا ينقل ملفات المحتوى المحلية المضمّنة في حزم البناء إلى تخزين خاص. إن كان المطلوب منع تنزيل الحزم ذاتها عبر عنوانها المباشر، فهذا يتطلب نقل تقديم المحتوى إلى مسار خادم مصرح؛ لا يُدّعى هنا تحقق ذلك.

## 2026-09-27 — Kids: مرجع الترابط والتشغيل

**قاعدة الإعلان عن الجاهزية:** وجود فيديو في Bunny أو سجل في قاعدة البيانات أو نجاح نشر الواجهة لا يثبت تشغيل الدرس. يجب نجاح المسار الكامل أدناه بحساب ولي أمر فعلي، لدرس مجاني وآخر يحتاج صلاحية، ثم التحقق من بقية مستويات Kids دون إعادة فحص الصور والفيديوهات ما لم يتغير مسارهما.

| حلقة المسار               | الاعتماد والاختبار                                                                                          | الحالة المثبتة                                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| موافقة ولي الأمر والملفات | سياسة Kids، موافقة الحساب، وموافقة الملف؛ استعلامات `kids_can_access_lesson`                                | مفعلة؛ حساب الاختبار لديه ملفان للمستويين 1 و3                                                                                                                                |
| إطلاق السوق والمحتوى      | أعلام الإطلاق، موافقة SHA لمحتوى الدرس، كائن Storage وسجل الفيديو                                           | مثبتة بعينة الدرس 1 المجاني والدرس 3 المشمول بصلاحية الاختبار في المستوى 1؛ هذا لا يثبت تشغيل 36 درسًا                                                                        |
| واجهة الدرس               | `src/routes/kids.$levelId.$lessonNumber.tsx` تستدعي `kids-lesson-content` و`kids-playback` معًا             | استدعاءات الخادم نجحت للدرس 1 والدرس 3 في `level-1/ar-EG`؛ إعادة فتح الصفحة ورؤية المحتوى والفيديو فيها غير موثقة بعد                                                         |
| نشر الدوال                | كل دالة تضم اعتمادها النسبي داخل مجلدها؛ OPTIONS=200 وPOST بلا مصادقة=401                                   | إصلاح PR #96 مدمج (`0499163`)؛ أفاد سجل Lovable بنشر `kids-lesson-content` و`kids-lesson-help` بنجاح، ولكل منهما OPTIONS=200 وPOST دون جلسة=401؛ `kids-playback` منشورة أيضًا |
| توقيع تشغيل Bunny         | `BUNNY_KIDS_STREAM_TOKEN_KEY` في أسرار الخادم، منفصل عن `BUNNY_KIDS_STREAM_API_KEY`؛ اختبار رابط تشغيل مصرح | حُفظ المفتاح عبر Lovable، وعادت `kids-playback` برمز 200 ورابط Bunny موقّع للدرسين 1 و3 في `level-1/ar-EG` على حساب المالك                                                    |
| تحقق النهاية للنهاية      | فتح درس مجاني وآخر بصلاحية ولي الأمر، ثم عينة عبر المستويات الثلاثة؛ لا تكرر فحص الوسائط دون تغيير يمسها    | محتوى الدرسين 1 و3 عاد من `kids-lesson-content` برمز 200؛ العرض داخل المتصفح وبقية المستويات ومسار الاشتراك الحقيقي **لم تتحقق بعد**                                          |

دليل الإنتاج أعلاه: رسالتا Lovable بتاريخ 2026-09-27، الساعة 08:26 و08:31 UTC (نشر الدوال ثم حفظ المفتاح وفحص الدرسين). صلاحية الاختبار الحالية للمالك مدتها سنة ولا تمثل شراء اشتراك حقيقي. المرجع الفني لمسار الفيديو العام في `mem/workflows/lesson-video-recovery.md` لا يغني عن بوابات Kids هذه. عند تغير أي حلقة، حدث هذا الجدول بدليل جديد واسم النشر/الالتزام، بدل استنتاج حالة بقية الحلقات منها.

## 2026-09-26 — مساعد المنصة (تغيير قيد النشر)

- صفحة `/ai-assistant`: الهيدر الموحد للحساب، نصوص الأربع لغات، تقدم كل المسارات والدرس التالي، تسمية حقل السؤال، ومصادر الإجابة من استرجاع الخادم.
- سؤال العميل يبقى عند الخطأ. سجل الأسئلة والإجابات محدود بآخر 20 سؤالًا على جهاز العميل لكل حساب؛ تستخدم أسئلة المتابعة آخر ثلاثة أدوار كسياق غير موثوق، وتبقى أدلة الدروس من استرجاع الخادم فقط. يمكن مسح السجل من الصفحة.
- اختبارات الواجهة والعقود واللغة والبناء المحلي نجحت. التحقق من الإنتاج بعد الدمج والنشر **قيد الانتظار**؛ لم تُرسل أسئلة مدفوعة إلى المساعد في هذا العمل.
- فحص `tsc` المحلي على تثبيت npm يعرض ثلاثة أخطاء سابقة في نوع `ErrorRouteComponent` خارج الملفات المعدلة. CI يستخدم إصدارات `bun.lock`؛ نتيجته هي بوابة الدمج.

## Current Phase

**P0 Launch Ready** — Aggressive Controlled Launch Ready

Operating model: `docs/playbooks/P0_LAUNCH_CONSTITUTION.md`.

Drift cleanup: **complete** (Final Drift Re-audit PASS — launch blockers 0, high runtime blockers 0). Remotion registry aligned — technical cleanup closed.

## Completed

- Master Blueprint completed
- Mission Constitution completed
- Mission Target Design completed
- Lesson Shape Constitution completed
- Pilot Template Decision completed
- Curriculum Architecture Decision completed
- Intro full rewrite completed
- Business / Creator / Analyst / Automator / Builder rewrites completed
- Learner path aligned to 100 lessons
- Registry remains 104 with 4 archived Business lessons excluded from learner path
- Mission Runtime Phase A + B1/B2 + B3-lite completed
- Fast UX pass and polish completed
- Persona-100 diagnostics completed
- 6 technical lesson fixes completed — f45ba9f
- 8-lesson terminology pass completed — 133637b
- Curriculum Freeze Contract committed — a3f1ecb
- Assistant P0 semantic seed + retrieval smoke test PASS
- knowledge_chunks seeded (100 learner lessons / 198 chunks)
- Path-aware retrieval filtering completed
- Builder fallback removed
- Prompt grounding hardening P0.1 completed
- Semantic similarity threshold P0.2 completed
- Unsupported-topic fallback completed
- Assistant production hardening completed
- P0 Launch Constitution committed — Aggressive Controlled Launch + Rapid Iteration (`docs/playbooks/P0_LAUNCH_CONSTITUTION.md`)
- Launch blockers Batch A1/A2 closed (route guards, legal drafts, persona-sim secured)
- P0 Safe Fixes published and verified (strict validators, rate limits, dynamic admin load) — with auth-limitation warning documented
- Duplicate homepage canonical fixed and verified on production — `0d58a49`
- Standalone `/ai-assistant` auth-gated (anonymous → `/login`); verified on production — `cc84946`
- In-lesson assistant: `AssistantPanel` compact embedded on every open lesson (`/learn/$pathId/$lessonId`)
- `public/persona-sim` local leak cleaned; assets secured under `src/data/` + admin-only server fns
- Mega Source-of-Truth Audit: **PASS WITH WARNINGS**
- Drift cleanup Batches 1–4C completed (route auth, brand/naming, stale audit artifacts, Remotion loader drift)
- Final Drift Re-audit: **PASS** — launch blockers 0; PATHS 100; registry/content 104 (100 learner + 4 archived Business); RAG seed 100; Bunny playback 100/100
- Production route/source smoke: **PASS** (post onboarding hotfix — no spinner, no redirect loop, no protected content exposed)
- Onboarding legacy redirect hotfix — `26b8758`
- Remotion registry aligned (100/100 learner; 104 total = 100 learner + 4 archived) — `6a6a40e`
- **MSA canonical corpus complete** — 100/100 learner-path `*.canonical.md` drafts (docs-only) — `a88e251`
- **MSA canonical API audit gate complete** — Anthropic reviewer; **corrected** final QA **0 PASS · 100 PASS WITH NOTES · 0 CONTENT FAIL · 0 ERROR_RETRY_REQUIRED** — `ADAPTIVE_LESSON_ENGINE.md` §9f · `f2cd9ec`
- **MSA canonical scripts polished + locked** — 100/100 `*.canonical.md` at `2026-06-18.1-polished` · **polished / not production-wired** — §9g

## Video layer

- **Bunny playback:** 100/100 learner GUIDs
- **Remotion registry:** 100/100 learner coverage; 104 total entries (100 learner + 4 archived Business retained for asset stability)
- PATHS and Bunny GUIDs unchanged; no video regeneration or upload in `6a6a40e`

## In Progress

- Post-launch hardening and cleanup (non-blocking backlog only)
- Visual Freeze Planning (deferred polish per P0 Constitution)
- **Adaptive Lesson Engine (docs-only):** MSA canonical script layer **polished + locked** (§9g); **next:** language/runtime · media/video script · assistant/mission localization architecture (design — not production-wired)

## Blocked

None

## Launch blockers

**Critical / High / High runtime: 0 open.** Remaining items are post-launch hardening unless live evidence elevates them.

## Latest Production Commit

26b87589d563ee9b9399b64339026516aa28e83e

## Next Planned Step

**Launch / marketing preparation** — aggressive controlled launch + 72h observation (per P0 Launch Constitution). Post-launch hardening backlog (system-state GAPS refresh, doc/tooling sync, visual polish) as needed after launch.

## Latest Assistant Milestone

Assistant P0.2 PASS · standalone page auth-gated · in-lesson embedding confirmed
