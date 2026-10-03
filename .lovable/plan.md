# Current coordination note — 3 October 2026

The owner has retired the obsolete contact-mail-job path. The sole active
contact switch is CONTACT_MAIL_DIRECT_ENABLED, used by immediate app delivery
and retries in the existing account-welcome-job. Do not reinstall the old
contact cron preparation or its Vault/job-secret binding. The source below is
historical capability evidence, not current release instructions. The direct
query_database tool has independently proven postgres and EXECUTE permission
on Vault create_secret/update_secret; protected matching of the lifecycle token
remains a separate operation.

---

# فحص حالة قراءة فقط — بريد التواصل والترحيب

فحص حالة حالي بدون أي تعديل. النتائج:

## الدوال المنشورة (GET بدون مصادقة)

- contact-mail-job: منشورة (405)
- contact-mail-webhook: منشورة (405)
- account-welcome-job: منشورة (405) — تشمل بريد الترحيب والاشتراك
- account-deletion-job: غير منشورة (404)

## الأعلام والأسرار (أسماء فقط، بدون قيم)

- CONTACT_MAIL_ENABLED: موجودة في الأسرار؛ القيمة الحالية غير قابلة للفحص بأمان — UNVERIFIED (آخر حالة موثقة: false)
- مفتاح الإدخال في التطبيق (نفس الراية): UNVERIFIED لنفس السبب
- RESEND_API_KEY: موجود
- RESEND_WEBHOOK_SECRET: موجود (ربط التوقيع نجح سابقًا)
- CONTACT_MAIL_JOB_SECRET: موجود
- ACCOUNT_WELCOME_JOB_SECRET: موجود

## الجداول المجدولة

- masaarat-account-welcome-v1: موجودة ونشطة (كل 5 دقائق) — محفوظة
- لا يوجد أي جدول مجدول لبريد التواصل

## قابلية نشر account-deletion-job

- نعم: بعد دمج/مزامنة مصدرها المراجع من GitHub في المشروع، يمكن نشرها عبر أداة نشر الدوال المعتمدة (نفس مسار contact-mail-job). هذا يختلف عن إنشاء عامل مؤقت جديد الذي رُفض سابقًا — النشر لدالة موجودة في المصدر مسموح. لا نشر الآن.

## لا إجراءات

لا تعديل كود، لا SQL، لا نشر، لا تغيير أسرار أو أعلام، لا بريد. تدوير الأسرار والإرسال الحقيقي ونشر الموقع بوابات إنتاج منفصلة.

## Previous read-only explanation preserved

# شرح تفصيلي: ليه الموقع كان بطيء وبقى سريع (بدون أي تنفيذ)

القرار: **مفيش أي تعديل**. ده شرح للحالة الحالية بناءً على قراءة السجلات والملفات فقط.

## اللي بيحصل عند أول فتح (الإقلاع البارد)

التسلسل الفعلي من سجل خادم التطوير:

```text
1) توليد الأصول قبل التشغيل  → materialized: 400  (كتابة 400 صورة PNG على القرص)
2) Vite ready                → 2299 ms  (وفي مرة تانية 3249 ms)
3) أول زيارة للصفحة          → new dependencies optimized: h3-v2, @tanstack/router-core, ...
4) optimized dependencies changed → reloading   ← الصفحة بتعيد التحميل في نص أول زيارة
5) كل route وكل صورة بتتترجم عند أول طلب لها → الصور بتظهر بالتدريج
```

النتيجة اللي كنت شايفها: الصفحة الرئيسية بس هي اللي بتفتح (لأنها أول route اتترجم)، والصور بتفضل تتحمّل واحدة ورا التانية.

## ليه بقى سريع دلوقتي

- مجلد `node_modules/.vite/deps` موجود ومحدّث (آخر تحديث 10:57)، يعني خطوة optimize خلصت خلاص.
- الـ400 صورة متولّدة بالفعل على القرص، والعلامة `.materialize-ok.json` بتقول `ok: true, materialized: 400`.
- فمرحلة الـ`reloading` الوسطانية مش بتحصل، والصفحة بتفتح على طول.

**مهم:** مفيش أي سطر كود اتغير. الفرق كله في الكاش (cache) مش في المشروع.

## متى ترجع البطء تاني

أي حاجة تمسح أو تبطّل الكاش:

- إعادة تشغيل بيئة البريفيو أو الخادم
- تغيير في `bun.lockb` — السجل شايف فعلاً: `Re-optimizing dependencies because lockfile has changed` الساعة 11:07
- تثبيت أو تحديث أي حزمة

## المصدر البنيوي للبطء (للعِلم فقط)

- `src/lib/lesson-visuals/controlled-v1/runtime/controlledV1BrowserResolver.ts` بيستخدم `import.meta.glob` بـ `eager: true` على 400 أصل — في وضع التطوير ده بيخلي المتصفح يجيب مئات الموديولات كل واحد لوحده.
- سكربت `controlled-visuals:materialize-runtime-assets` بيعيد كتابة 400 ملف في كل إقلاع حتى لو موجودين بالفعل.

## الحالة

مفيش أي تنفيذ مطلوب. لو حبيت بعدين نثبّت السرعة دايمًا، الحلول الثلاثة المعروفة: تخطّي إعادة التوليد لو الأصول موجودة، تحويل الـglob لـ lazy في التطوير، وإضافة الحزم لـ `optimizeDeps`.
