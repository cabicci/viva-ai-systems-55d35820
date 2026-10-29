# Live coded-offer checkout safety

## Current audited inventory

The actual project database contains **0 commerce offer records and 0 currently active paid coded offers**. No customer codes or personal data were queried. There are therefore no offer-specific Stripe objects or IDs to provision from the current inventory.

Installed eligibility rules cover package, EGP/USD market, optional monthly/annual interval, percentage or fixed discount, validity dates, global redemption cap including pending orders, per-email limits, optional targeted audiences, required phone reuse protection, new-customer eligibility and renewal eligibility. An explicit code replaces the Kids automatic family discount.

**Important:** `renewals` means an existing customer may redeem an offer; it does not define Stripe recurring discount duration. Existing commerce access uses one paid order and 30/365-day simple-offer durations. Do not infer a perpetual subscription discount from that flag.

## Proposed implementation

1. Add service-only, versioned Live mapping records for internal offer IDs, registered base price/product, market/currency/interval, precreated coupon and promotion-code IDs, reviewed discount definition and explicit duration. Leave all mappings disabled and empty; never invent Stripe IDs or create Stripe objects.
2. Add authenticated, server-validated coded-offer checkout with transactional identity/cap reservations shared with existing manual offer limits. Revalidate package, currency, interval, expiry, usage, audience, phone and renewal eligibility. Bind retries to immutable mapping versions. Resolve Kids codes against its standard price, not its family price. Unmapped or unreviewed offers remain unavailable for Stripe.
3. Bind the reservation to the created Checkout Session/customer/subscription and prove its mapped discount on signed `invoice.paid` using permitted expanded invoice/subscription/session reads. Verify one mapped discount, price/product, coupon/promotion relationship, totals, currency, period and the immutable project offer snapshot. Consume once by invoice identity; renewals cannot consume again or extend beyond the verified paid period. Preserve risk holds and existing event guards.
4. Preserve manual/free behavior while mode is Test; route fully mapped paid codes to Live only after the server-owned public mode and existing gates permit it. No fallback between modes.
5. Revise public billing Test labels, errors, pricing/paywall descriptions and subscription terms across all four locales without changing internal historical Test records. Do not falsely advertise real payments while Test remains selected.
6. Run focused eligibility, concurrency, replay, expired/used-code, amount, currency/interval, unmapped/incorrect-object and webhook failure tests. Check automatic compilation; separate manual typecheck/build commands are prohibited by this environment.

## Required provisioning and launch blockers

- Current offer-specific provisioning list: **none**, because there are zero offer records. Future offers must exist before exact definitions can be generated.
- Each future mapping needs the actual Live coupon ID and promotion-code ID, an explicit `once`/`repeating`/`forever` policy (and month count for repeating), product restrictions and percentage or currency-specific fixed amount. Discount duration must be owner-reviewed; renewal eligibility alone is insufficient.
- Stripe caps/expiry/customer restrictions must not be less restrictive than the reviewed offer; the project remains authoritative for cross-channel identity and redemption limits. Private customer restrictions are never included in chat.
- The restricted key has no Coupons/Promotion Codes read permission. Do not broaden it: validate discount definitions through permitted expanded payment objects and fail closed if required evidence is unavailable. Verify those expansions before enabling any mapping.
- Catalogue/webhook activation, all mapping provisioning, hosted end-to-end validation and publication remain separate launch blockers. No secrets, switches, Stripe objects or payments will be changed in this work.

## Technical details

Use this project's supported Lovable migration tool for additive schema/RPC changes, explicit service-only grants and RLS. Keep authenticated request validation in existing server boundaries and preserve exact-path hosted dispatch. Integrate reservation locking with commerce offer/order locking, paid-access writers and current lifecycle/user risk-hold locks; no independent entitlement grant path. Add migration-backed disposable/rollback database tests rather than testing safety only with mocks.

<!-- Previous plan retained below as historical context; superseded by the plan above. -->
## Historical context
- كل مسارات الدفع الحالية **مقفولة على Test بالكود**: 5 دوال ترفض أي مفتاح غير `sk_/rk_test_`، وتكتب `metadata.environment="test"`، والـ webhook يرفض `livemode=true` (LIVE_EVENT_REJECTED)، والاستردادات تشترط `livemode=false`.
- قاعدة البيانات **لا تحتوي عمود بيئة** (test/live) في أي جدول ربط؛ التمييز الوحيد هو `gateway_code='stripe_us'`. لذلك Live يحتاج فصلًا بنيويًا قبل أي مفتاح.
- Live **غير جاهز**: لا مفتاح Live، لا سر webhook Live، لا أسعار Live، لا بوابة عملاء Live (كلها غير مُتحقَّق منها ويجب افتراض غيابها).

## الحالة الحالية (مُتحقَّق منها)
| المنتج | الدالة | جدول الأسعار | صفوف حالية |
|---|---|---|---|
| Pro / Pro Plus | billing-stripe-checkout + portal + webhook | billing.market_prices + gateway_price_mappings | 8 أسعار (EG/INTL × شهري/سنوي × باقتين)، كلها مربوطة Test |
| Kids | kids-stripe-checkout | public.kids_stripe_prices | 1 (EG شهري 199 ج.م) |
| الأكاديمي (+ المساعد) | academic-stripe-checkout | billing.academic_stripe_prices | 0 (تُنشأ عند أول دفع) |
| التقني | technical-stripe-checkout | billing.technical_stripe_prices | 0 (تُنشأ عند أول دفع) |

- العملاء/الاشتراكات: billing.gateway_customers و gateway_subscriptions = 0 صف؛ webhook_events = 1. جداول kids/academic/technical لها جداول events/subscriptions خاصة.
- الأسعار تُنشأ آليًا من الدالة (lookup_key ينتهي بـ `_test_v1`) ثم تُسجَّل في قاعدة البيانات — أي لا معرفات أسعار ثابتة في الكود.
- المفاتيح في الخادم فقط (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)؛ لا مفتاح في المتصفح.

## عدد الأسعار المطلوبة في Live
- Pro/Pro Plus: **8** (مؤكد).
- Kids: **1 مؤكد**؛ أي أسواق/فترات إضافية غير مخزّنة = غير مُتحقَّق.
- الأكاديمي: حسب الأسعار المعتمدة سابقًا (EGP 50/600، USD 1/12) × (عادي/مع المساعد) = حتى **8** لكل كورس — يحتاج تأكيد من سياق الدفع.
- التقني: غير مُتحقَّق (0 صفوف) — يُستخرج من سياق الدفع.
- **الإجمالي المؤكد 9، المتوقع ~17–25** بعد جرد الخطوة 1.

## نقاط الخطر
1. خلط Test وLive في نفس الجداول (لا عمود بيئة) → عميل Test يُستخدم في Live أو العكس.
2. lookup_key ومفاتيح idempotency ثابتة على `test_v1` → تصادم إن غُيّر المفتاح فقط.
3. تبديل `STRIPE_SECRET_KEY` لقيمة Live يكسر Test كليًا ويفقد سجلاته عمليًا.
4. webhook واحد بسر واحد؛ Live يحتاج endpoint/سر منفصل.
5. الاستردادات وحذف الحسابات (LC09، الاحتفاظ المالي 15 يوم) مبنية على Test فقط.
6. Kids يتطلب موافقة ولي أمر؛ يجب أن يبقى الحارس مطبقًا في Live.
7. البوابة (Customer Portal) تحتاج تفعيلًا يدويًا في لوحة Stripe Live.
8. الضرائب: `tax_behavior=exclusive` قد يغيّر المبلغ النهائي في Live.

## خطوات التنفيذ (بعد موافقتك، كل خطوة بإذن منفصل)
1. **جرد للقراءة فقط**: استخراج كل الأسعار من دوال سياق الدفع للأكاديمي والتقني والأطفال وتثبيت العدد النهائي.
2. **فصل البيئة في قاعدة البيانات** (migration عبر GitHub): إضافة `environment` (test|live، افتراضي test) لجداول الأسعار/العملاء/الاشتراكات/الأحداث، تعبئة الصفوف الحالية بـ test، وفهارس فريدة تشمل البيئة. لا حذف لأي سجل Test.
3. **مفتاح إيقاف**: إعداد `stripe_live_enabled=false` في جدول تحكم محمي (أدمن فقط) + فحصه داخل كل دالة قبل أي نداء Live.
4. **أسرار منفصلة**: `STRIPE_LIVE_SECRET_KEY` (restricted key `rk_live_` بأقل صلاحيات) و`STRIPE_LIVE_WEBHOOK_SECRET` — يضيفها owner في الإعدادات. تبقى أسرار Test كما هي.
5. **تعديل الدوال الست** (عبر PR مراجَع): اختيار المفتاح حسب البيئة، `metadata.environment` و lookup_key بلاحقة `_live_v1`، والتحقق المزدوج: مفتاح Live ⇔ `livemode=true`.
6. **webhook Live منفصل** يقبل `livemode=true` فقط ويرفض أحداث Test، والعكس للحالي.
7. **إنشاء الأسعار Live** مرة واحدة يدويًا بأداة Stripe أو سكربت خادمي، وتسجيل معرفاتها مسبقًا (لا إنشاء آلي عند أول دفع في Live).
8. **تفعيل البوابة** في Stripe Live وربط return_url بـ masaarat.ai.
9. نشر الدوال والموقع بإذن owner؛ المفتاح يبقى OFF.

## خطوات التحقق (بدون أي اشتراك مدفوع)
- Test بعد التعديل: checkout/webhook/portal لكل منتج يعمل كما قبل، والسجلات القديمة باقية بنفس العدد.
- Live والمفتاح OFF: كل دالة Live ترجع 403/409 دون أي نداء لـ Stripe.
- مفتاح Test مع بيئة Live (والعكس) → رفض.
- حدث Test على webhook Live (والعكس) → 400.
- طلب بدون مصادقة → 401؛ مستخدم غير أدمن لا يغيّر المفتاح.
- قراءة الأسعار Live من Stripe API (GET فقط) ومطابقة المبالغ/العملات/الفترات مع القاعدة.
- فحص كود المتصفح: لا `sk_`/`rk_`/`whsec_`.
- التفعيل الفعلي (أول عملية حقيقية) قرار owner منفصل خارج هذه الخطة.

## غير مُتحقَّق (UNVERIFIED)
حالة حساب Stripe Live (التفعيل، البنك، الضرائب)، وجود أي مفاتيح Live، عدد أسعار التقني والأكاديمي النهائي، إعداد البوابة في Live.
