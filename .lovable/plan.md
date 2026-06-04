## الخلاصة

أنا في **Plan Mode** فمش قادر أعدّل كود. محتاج تضغط "Approve" أو تحوّل لـ Build Mode عشان أبدأ. الخطة دي بتنفّذ على ٤ مراحل متتالية من غير ما أوقف بينهم — كل مرحلة هتاخد turn واحد لوحدها.

---

## الهيكل الجديد (٤ موديولز × ١٦ درس)

**M1 — العقلية (3):** from-decisions-to-leadership → reactive-vs-proactive → **ai-thinking-partner** ✨
**M2 — العميل + الفلوس (4):** customer-lifecycle → retention-flow → readiness-signals → **pricing-cash-flow** ✨
**M3 — التشغيل + الفريق (4):** delegate-or-automate → strategic-operational-admin → system-then-people → **hiring-onboarding** ✨
**M4 — الاستدامة + الصورة الكاملة (5):** premature-scaling → reactive-relapse → weekly-rhythm → full-ecosystem → **business-os-dashboard** ✨

✨ = الـ ٤ دروس الجداد (موجودين بالفعل كملفات)

---

## المراحل

### المرحلة ١ — الهيكل (turn واحد، سريع)
- تحديث `src/lib/curriculum-data.ts` للهيكل الجديد (٤ موديولز)
- تحديث `src/components/intro/lessons/index.ts` (تسجيل الـ ٤ دروس الجداد)
- **النتيجة:** التطبيق يعرض الهيكل الجديد فوراً + الـ ٤ دروس الجداد شغّالة. المحتوى القديم بيبقى كما هو في الـ ١٢ درس القدام.

### المرحلة ٢ — إعادة كتابة محتوى M1 + M2 (turn)
- إعادة كتابة ٥ دروس قديمة (m1-l1, m2-l1, m3-l1, m3-l2, m5-l1) بالـ Framework الجديد + Case Study أحمد المطعم
- إضافة Build Along output لكل درس

### المرحلة ٣ — إعادة كتابة محتوى M3 + M4 (turn)
- إعادة كتابة ٧ دروس قديمة (m4-l1, m4-l2, m5-l2, m6-l1, m6-l2, m2-l2, m7-l1)
- إضافة Build Along output لكل درس

### المرحلة ٤ — Bunny Re-render (بموافقتك)
- بقولك "خلاص كل المحتوى جاهز — أرندر الفيديوهات؟"
- لو موافق: `bash scripts/trigger-lesson.sh "<ids>" --force-script` على دفعات ≤400 char

---

## مهم تعرفه

- **ملفات الـ ١٢ درس مش هتترنّم.** هخليهم بأسمائهم الحالية (m2-l1, m3-l1, إلخ) عشان أتجنب إعادة تسمية ضخمة في DB + Bunny GUIDs. الهيكل الجديد بيرتّبهم في الموديولز الجداد بس.
- **مفيش DB migration في المرحلة ١.** بس لو الـ rewrite هيغيّر lesson_id أصلاً، هنعمل migration في المرحلة ٤.
- **مفيش BusinessOSDashboard component منفصل دلوقتي.** الدرس الأخير (m4-l5) فيه instructions للمستخدم يبني Dashboard بـ Notion يدوياً. لو عايز component تفاعلي جوا التطبيق — قولّي وهضيفه كـ extra step.

---

## للموافقة

اضغط Approve أو قول "كمّل" وهبدأ المرحلة ١ على طول.
