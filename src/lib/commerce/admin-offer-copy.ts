import type { SupportedLocale } from "@/lib/locale/types";
const phrases = {
  title: [
    "الكوبونات والدعوات",
    "الكوبونات والدعوات",
    "الكوبونات والدعوات",
    "Coupons and invitations",
  ],
  intro: [
    "اختار لمين العرض، والباقة، ونسبة الخصم. 100٪ يعني مجاني.",
    "حدد المستفيد والباقة ونسبة الخصم. 100٪ تعني اشتراكًا مجانيًا.",
    "حدّد المستفيد والباقة ونسبة الخصم. 100٪ يعني مجاني.",
    "Choose the audience, package and discount. 100% means free access.",
  ],
  audience: ["١. العرض لمين؟", "١. لمن العرض؟", "١. العرض لمين؟", "1. Who is this for?"],
  individual: ["فرد واحد", "فرد واحد", "شخص واحد", "One person"],
  group: ["مجموعة", "مجموعة", "مجموعة", "A group"],
  public: ["كوبون عام", "كوبون عام", "كوبون عام", "Public coupon"],
  emails: [
    "الإيميل — كل إيميل في سطر",
    "البريد الإلكتروني — عنوان واحد في كل سطر",
    "الإيميل — كل إيميل بسطر",
    "Email — one address per line",
  ],
  emailHint: [
    "الإيميل كفاية، مش محتاج اسم المستفيد.",
    "يكفي البريد؛ لا يُطلب اسم المستفيد.",
    "الإيميل يكفي، ما تحتاج اسم المستفيد.",
    "Only email is needed; recipient names are not required.",
  ],
  groupName: [
    "اسم المجموعة — اختياري",
    "اسم المجموعة — اختياري",
    "اسم المجموعة — اختياري",
    "Group name — optional",
  ],
  packageStep: [
    "٢. الباقة والخصم",
    "٢. الباقة والخصم",
    "٢. الباقة والخصم",
    "2. Package and discount",
  ],
  market: ["سوق الأسعار", "سوق الأسعار", "سوق الأسعار", "Price market"],
  egypt: ["مصر — جنيه مصري", "مصر — جنيه مصري", "مصر — جنيه مصري", "Egypt — EGP"],
  international: [
    "خارج مصر — دولار",
    "خارج مصر — دولار",
    "خارج مصر — دولار",
    "Outside Egypt — USD",
  ],
  plan: ["الباقة ومدتها", "الباقة ومدتها", "الباقة ومدتها", "Package and duration"],
  percent: ["نسبة الخصم (%)", "نسبة الخصم (%)", "نسبة الخصم (%)", "Discount (%)"],
  after: ["السعر بعد الخصم", "السعر بعد الخصم", "السعر بعد الخصم", "Price after discount"],
  free: ["مجاني", "مجاني", "مجاني", "Free"],
  activation: [
    "مدة الباقة بتبدأ من ساعة التفعيل، مش من إنشاء العرض.",
    "تبدأ مدة الباقة من لحظة التفعيل، لا من إنشاء العرض.",
    "مدة الباقة تبدأ من وقت التفعيل، مو إنشاء العرض.",
    "Package duration starts at activation, not when the offer is created.",
  ],
  deliveryStep: [
    "٣. طريقة الاستفادة",
    "٣. طريقة الاستفادة",
    "٣. طريقة الاستفادة",
    "3. How will they receive it?",
  ],
  coupon: ["كوبون", "كوبون", "كوبون", "Coupon"],
  invitation: [
    "دعوة مباشرة بالإيميل",
    "دعوة مباشرة بالبريد",
    "دعوة مباشرة بالإيميل",
    "Direct email invitation",
  ],
  code: ["كود الكوبون", "رمز الكوبون", "كود الكوبون", "Coupon code"],
  codeHint: [
    "الكود جاهز، وتقدر تغيّره بحروف إنجليزية وأرقام من غير مسافات.",
    "الرمز جاهز؛ يمكنك تغييره بحروف إنجليزية وأرقام دون مسافات.",
    "الكود جاهز، وتقدر تغيّره بحروف إنجليزية وأرقام بدون مسافات.",
    "A code is ready. You can change it using English letters and digits without spaces.",
  ],
  expiryNote: [
    "العرض الخاص ينتهي لو ما اتستخدمش خلال 15 يوم. مدة الاشتراك بتبدأ بعد التفعيل.",
    "ينتهي العرض الخاص إذا لم يُستخدم خلال 15 يومًا. تبدأ مدة الاشتراك عند التفعيل.",
    "العرض الخاص ينتهي إذا ما استُخدم خلال 15 يوم. مدة الاشتراك تبدأ عند التفعيل.",
    "Private offers expire if unused for 15 days. Access duration starts at activation.",
  ],
  limitMode: [
    "الكوبون العام ينتهي إمتى؟",
    "متى ينتهي الكوبون العام؟",
    "متى ينتهي الكوبون العام؟",
    "When does the public coupon end?",
  ],
  time: [
    "في موعد محدد — عدد استخدامات مفتوح",
    "في موعد محدد — دون حد إجمالي للاستخدامات",
    "بموعد محدد — استخدامات غير محدودة",
    "On a date — unlimited total uses",
  ],
  count: [
    "بعد عدد استخدامات — من غير تاريخ انتهاء",
    "بعد عدد استخدامات — دون تاريخ انتهاء",
    "بعد عدد استخدامات — بدون تاريخ انتهاء",
    "After a number of uses — no expiry date",
  ],
  until: ["آخر موعد للاستخدام", "آخر موعد للاستخدام", "آخر موعد للاستخدام", "Redeem before"],
  total: [
    "عدد الاستخدامات الإجمالي",
    "العدد الإجمالي للاستخدامات",
    "إجمالي عدد الاستخدامات",
    "Total uses allowed",
  ],
  once: [
    "مرة واحدة لكل مستفيد. نفس الإيميل أو رقم الموبايل ما ينفعش يكرر نفس الكوبون.",
    "استخدام واحد لكل مستفيد؛ يُمنع تكرار الكوبون بنفس البريد أو الهاتف.",
    "مرة وحدة لكل مستفيد؛ نفس الإيميل أو الجوال ما يقدر يكرر الكوبون.",
    "Once per recipient. The same email or phone cannot redeem this coupon again.",
  ],
  review: ["راجع العرض", "مراجعة العرض", "راجع العرض", "Review offer"],
  confirm: [
    "تأكيد وإنشاء العرض",
    "تأكيد وإنشاء العرض",
    "تأكيد وإنشاء العرض",
    "Confirm and create offer",
  ],
  edit: ["تعديل", "تعديل", "تعديل", "Edit"],
  reviewTitle: [
    "راجع قبل التأكيد",
    "المراجعة قبل التأكيد",
    "راجع قبل التأكيد",
    "Review before confirming",
  ],
  created: ["العرض اتعمل", "تم إنشاء العرض", "تم إنشاء العرض", "Offer created"],
  send: ["إرسال الدعوات", "إرسال الدعوات", "إرسال الدعوات", "Send invitations"],
  sendHint: [
    "الدعوات محفوظة. اضغط إرسال الدعوات عشان توصل للمستفيدين.",
    "حُفظت الدعوات. اضغط إرسال الدعوات لإرسالها إلى المستفيدين.",
    "الدعوات محفوظة. اضغط إرسال الدعوات عشان توصل للمستفيدين.",
    "Invitations are saved. Select Send invitations to email recipients.",
  ],
  queued: [
    "الدعوات جاهزة للإرسال. لو الإرسال اتأخر، اضغط إرسال تاني؛ مش هتتكرر الرسائل المقبولة.",
    "الدعوات جاهزة للإرسال. عند تأخر الإرسال أعد المحاولة؛ لن تتكرر الرسائل المقبولة.",
    "الدعوات جاهزة للإرسال. لو تأخر الإرسال جرّب ثانية؛ الرسائل المقبولة ما تتكرر.",
    "Invitations are queued. Retry sending if needed; accepted messages will not be duplicated.",
  ],
  sent: [
    "قبلت خدمة البريد عدد الرسائل ده",
    "عدد الرسائل التي قبلتها خدمة البريد",
    "عدد الرسائل اللي قبلتها خدمة البريد",
    "Messages accepted by the email service",
  ],
  nextBatch: [
    "إرسال الدفعة التالية / إعادة المحاولة",
    "إرسال الدفعة التالية / إعادة المحاولة",
    "إرسال الدفعة التالية / إعادة المحاولة",
    "Send next batch / retry",
  ],
  couponHint: [
    "انسخ الكود وابعت للعميل رابط صفحة الدفع. يختار نفس الباقة والسوق ويستخدم الكود. المجاني مش محتاج تحويل أو إيصال.",
    "شارك الرمز ورابط صفحة الدفع. يختار العميل الباقة والسوق المحددين ويستخدم الرمز. المجاني لا يحتاج تحويلًا أو إيصالًا.",
    "شارك الكود ورابط صفحة الدفع. العميل يختار نفس الباقة والسوق ويستخدم الكود. المجاني ما يحتاج تحويل أو إيصال.",
    "Share the code and payment-page link. The customer selects this package and market and uses the code. Free access needs no transfer or receipt.",
  ],
  copy: ["نسخ الكود", "نسخ الرمز", "نسخ الكود", "Copy code"],
  copied: ["اتنسخ", "تم النسخ", "تم النسخ", "Copied"],
  copyFailed: [
    "حدّد الكود وانسخه يدويًا.",
    "حدد الرمز وانسخه يدويًا.",
    "حدّد الكود وانسخه يدويًا.",
    "Select the code and copy it manually.",
  ],
  paymentPage: [
    "صفحة الدفع للعميل",
    "صفحة الدفع للعميل",
    "صفحة الدفع للعميل",
    "Customer payment page",
  ],
  another: ["عرض جديد", "عرض جديد", "عرض جديد", "New offer"],
  existing: ["العروض الموجودة", "العروض الحالية", "العروض الموجودة", "Existing offers"],
  none: ["لسه مفيش عروض.", "لا توجد عروض بعد.", "ما فيه عروض للحين.", "No offers yet."],
  noExpiry: ["بدون تاريخ انتهاء", "دون تاريخ انتهاء", "بدون تاريخ انتهاء", "No expiry date"],
  unlimited: ["عدد إجمالي مفتوح", "دون حد إجمالي", "عدد إجمالي غير محدود", "Unlimited total uses"],
  advanced: [
    "إدارة قديمة ومتقدمة",
    "الإدارة القديمة والمتقدمة",
    "الإدارة القديمة والمتقدمة",
    "Legacy and advanced management",
  ],
  validation: [
    "راجع الإيميلات والباقة والكود. نسبة الخصم من 1 لـ100٪، ولازم تحدد تاريخ أو عدد للكوبون العام.",
    "راجع البريد والباقة والرمز. نسبة الخصم من 1 إلى 100٪، وحدد موعدًا أو عددًا للكوبون العام.",
    "راجع الإيميلات والباقة والكود. الخصم من 1 إلى 100٪، وحدّد تاريخ أو عدد للكوبون العام.",
    "Check emails, package and code. Discount must be 1–100%; public coupons need a date or total-use limit.",
  ],
  phone: [
    "رقم الموبايل بكود الدولة",
    "رقم الهاتف مع رمز الدولة",
    "رقم الجوال مع رمز الدولة",
    "Phone number with country code",
  ],
  phoneHint: [
    "اكتبه بالشكل ده: +201012345678. هنستخدمه لمنع تكرار الكوبون. مش هنبعت رمز تأكيد دلوقتي.",
    "مثال: +201012345678. يُستخدم لمنع تكرار الكوبون؛ لن يُرسل رمز تأكيد حاليًا.",
    "مثال: +201012345678. نستخدمه لمنع تكرار الكوبون؛ ما نرسل رمز تأكيد الحين.",
    "Example: +201012345678. Used to prevent repeat redemption; no verification code is sent yet.",
  ],
  phoneError: [
    "اكتب رقم صحيح بكود الدولة.",
    "أدخل رقمًا صحيحًا مع رمز الدولة.",
    "اكتب رقم صحيح مع رمز الدولة.",
    "Enter a valid phone number with country code.",
  ],
  usedError: [
    "الكوبون اتستخدم قبل كده أو له طلب قائم بنفس الحساب أو الإيميل أو الموبايل.",
    "استُخدم الكوبون أو يوجد طلب قائم بنفس الحساب أو البريد أو الهاتف.",
    "الكوبون مستخدم أو له طلب قائم بنفس الحساب أو الإيميل أو الجوال.",
    "This coupon was used or has a pending order for this account, email or phone.",
  ],
  priceChanged: [
    "السعر اتغيّر. حدّث الصفحة وراجع العرض تاني.",
    "تغير السعر. حدّث الصفحة وراجع العرض مجددًا.",
    "السعر تغيّر. حدّث الصفحة وراجع العرض ثانية.",
    "The price changed. Refresh and review the offer again.",
  ],
  methodError: [
    "مفيش وسيلة دفع مفعلة بالعملة دي للدعوة المدفوعة.",
    "لا توجد وسيلة دفع مفعلة بهذه العملة للدعوة المدفوعة.",
    "ما فيه وسيلة دفع مفعّلة بهالعملة للدعوة المدفوعة.",
    "No payment method is enabled for this paid invitation's currency.",
  ],
  invalidOffer: [
    "الكوبون مش متاح للاختيار ده، أو انتهى، أو وصل لحد الاستخدام.",
    "الكوبون غير متاح لهذا الاختيار، أو انتهت صلاحيته أو استخداماته.",
    "الكوبون مو متاح لهالاختيار، أو انتهى وقته أو استخداماته.",
    "This coupon is unavailable for this selection, expired or fully used.",
  ],
  retryError: [
    "الطلب محفوظ ببيانات مختلفة. حدّث الصفحة قبل المحاولة تاني.",
    "الطلب محفوظ ببيانات مختلفة. حدّث الصفحة قبل إعادة المحاولة.",
    "الطلب محفوظ ببيانات مختلفة. حدّث الصفحة قبل المحاولة ثانية.",
    "This request was already saved with different details. Refresh before retrying.",
  ],
} as const;
export function adminOfferCopy(locale: SupportedLocale) {
  const index = ["ar-EG", "ar-MSA", "ar-Gulf", "en"].indexOf(locale);
  return Object.fromEntries(
    Object.entries(phrases).map(([key, values]) => [key, values[index]]),
  ) as Record<keyof typeof phrases, string>;
}
export function offerError(error: unknown, locale: SupportedLocale, fallback: string) {
  const message = error instanceof Error ? error.message : String(error),
    w = adminOfferCopy(locale);
  if (/COMMERCE_PHONE_REQUIRED/.test(message)) return w.phoneError;
  if (/COMMERCE_OFFER_ALREADY_USED|COMMERCE_OFFER_LIMIT/.test(message)) return w.usedError;
  if (/COMMERCE_PRICE_CHANGED/.test(message)) return w.priceChanged;
  if (/COMMERCE_METHOD_UNAVAILABLE/.test(message)) return w.methodError;
  if (/COMMERCE_RETRY_CONFLICT/.test(message)) return w.retryError;
  if (/COMMERCE_OFFER_INELIGIBLE|COMMERCE_INVITATION_EXPIRED/.test(message)) return w.invalidOffer;
  return fallback;
}
