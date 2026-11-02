import type { SupportedLocale } from "@/lib/locale/types";

/** Display copy only. Access, pricing and balances are verified by the server. */
const copy = {
  en: {
    included:
      "The assistant is included: 300 questions each month per subscribed curriculum, with no per-lesson limit.",
    family: "Each child has their own allowance of 100 questions each month.",
    renewal:
      "Already subscribed? Your current price and question allowance stay unchanged until your next renewal.",
    monthly:
      "Monthly questions renew on your subscription anniversary and do not roll over. Free-plan questions renew on the anniversary of activation.",
    discount:
      "One eligible discount applies: the automatic discount or the coupon, whichever saves you more. They are never combined.",
    lifetime: "One curriculum, yours for life",
    lifetimePrice: "75 EGP · one payment",
    lifetimeDetail:
      "Choose one curriculum from any path. Includes 100 questions for the first month only. Your access to that curriculum continues for life; you can buy more questions at any time.",
    childDetail:
      "For Kids, choose one child. This purchase belongs only to that child and the selected curriculum.",
    topup: "Extra questions",
    topupPrice: "50 EGP · 100 questions",
    topupDetail:
      "Buy at any time. Purchased questions accumulate and never expire, even after a subscription or invitation ends. Use them after your monthly allowance, within content you currently have access to.",
    familyTopup:
      "Family credit is shared by your children. Each child uses their own monthly allowance before family credit.",
    curriculum: "Choose one curriculum",
    child: "Choose one child",
    account: "My account",
    familyAccount: "My children’s shared balance",
    buy: "Continue to payment",
    signIn: "Sign in to choose",
    unavailable: "Purchases are temporarily unavailable. Please try again.",
    empty: "No eligible curricula are available yet.",
    childEmpty: "Add a child in your parent account before purchasing a Kids curriculum.",
    scope: "Add questions to",
    coupon: "Coupon code (optional)",
    duration: "Discount duration",
    once: "First payment only",
    repeating: "A specified number of months",
    forever: "Throughout the subscription",
    months: "Number of months",
    couponScope: "Coupon applies to",
    subscription: "Subscription",
    topupScope: "Question top-ups only",
    couponScopeNote:
      "Subscription coupons do not apply to question top-ups. Select top-ups explicitly to discount them.",
    invitation:
      "The invitation starts when accepted. Choose a duration or no expiry. It includes one shared allowance of 300 questions per month across its granted curricula, in addition to any paid allowance.",
  },
  "ar-EG": {
    included: "المساعد داخل الباقة: ٣٠٠ سؤال كل شهر لكل منهج مشترك فيه، من غير حد لكل درس.",
    family: "لكل طفل ١٠٠ سؤال كل شهر لوحده، لحد ٣ أطفال.",
    renewal: "مشترك بالفعل؟ سعرك وحصة أسئلتك الحالية هيفضلوا زي ما هم لحد التجديد الجاي.",
    monthly:
      "الأسئلة الشهرية بتتجدد في نفس يوم بداية اشتراكك كل شهر، ومن غير ترحيل الباقي. أسئلة الباقة المجانية بتتجدد في نفس يوم تفعيلها كل شهر.",
    discount: "بيتحسب خصم واحد: الخصم التلقائي أو الكوبون، أيهما أوفر لك. الخصمين مش بيتجمعوا.",
    lifetime: "منهج واحد معاك مدى الحياة",
    lifetimePrice: "٧٥ جنيه · دفعة واحدة",
    lifetimeDetail:
      "اختار منهج واحد من أي مسار. معاه ١٠٠ سؤال لأول شهر بس. المنهج بيفضل متاح لك مدى الحياة، وتقدر تشتري أسئلة زيادة في أي وقت.",
    childDetail: "في كيدز، اختار طفل واحد. الشراء بيكون للطفل ده والمنهج اللي اخترته بس.",
    topup: "أسئلة زيادة",
    topupPrice: "٥٠ جنيه · ١٠٠ سؤال",
    topupDetail:
      "اشتري في أي وقت. الأسئلة المشتراة بتتجمع ومش بتنتهي، حتى بعد انتهاء الاشتراك أو الدعوة. بتستخدمها بعد حصتك الشهرية، في المحتوى المتاح لحسابك وقت الاستخدام.",
    familyTopup:
      "رصيد الأسرة مشترك بين أطفالك. كل طفل بيستخدم حصته الشهرية الأول، وبعدها رصيد الأسرة.",
    curriculum: "اختار منهج واحد",
    child: "اختار طفل واحد",
    account: "حسابي",
    familyAccount: "رصيد أطفالي المشترك",
    buy: "كمّل للدفع",
    signIn: "سجّل دخولك للاختيار",
    unavailable: "الشراء مش متاح دلوقتي. حاول تاني بعد شوية.",
    empty: "مفيش مناهج متاحة للشراء دلوقتي.",
    childEmpty: "ضيف طفل في حساب ولي الأمر قبل شراء منهج كيدز.",
    scope: "إضافة الأسئلة إلى",
    coupon: "كود الخصم (اختياري)",
    duration: "مدة الخصم",
    once: "أول دفعة بس",
    repeating: "عدد شهور محدد",
    forever: "طول مدة الاشتراك",
    months: "عدد الشهور",
    couponScope: "الكوبون يسري على",
    subscription: "الاشتراك",
    topupScope: "رصيد الأسئلة الإضافي بس",
    couponScopeNote:
      "كوبون الاشتراك مش بيسري على الأسئلة الإضافية. اختار رصيد الأسئلة صراحةً عشان الخصم يسري عليه.",
    invitation:
      "الدعوة بتبدأ من قبولها. اختار مدة أو من غير نهاية. معاها حصة واحدة مشتركة من ٣٠٠ سؤال كل شهر للمناهج الممنوحة، زيادة على أي حصة من اشتراك مدفوع.",
  },
  "ar-MSA": {
    included: "المساعد مشمول: ٣٠٠ سؤال شهريًا لكل منهج مشترك فيه، دون حد لكل درس.",
    family: "لكل طفل حصة مستقلة من ١٠٠ سؤال شهريًا، حتى ٣ أطفال.",
    renewal: "هل أنت مشترك حاليًا؟ يبقى سعرك وحصة أسئلتك الحالية دون تغيير حتى التجديد القادم.",
    monthly:
      "تتجدد الأسئلة الشهرية في يوم بدء الاشتراك من كل شهر، ولا يُرحّل المتبقي. تتجدد أسئلة الباقة المجانية في يوم تفعيلها من كل شهر.",
    discount: "يُطبّق خصم واحد: الخصم التلقائي أو الكوبون، أيهما أوفر لك. لا يُجمع الخصمان.",
    lifetime: "منهج واحد مدى الحياة",
    lifetimePrice: "٧٥ جنيهًا · دفعة واحدة",
    lifetimeDetail:
      "اختر منهجًا واحدًا من أي مسار. يشمل ١٠٠ سؤال للشهر الأول فقط. يستمر وصولك إلى المنهج مدى الحياة، ويمكنك شراء أسئلة إضافية في أي وقت.",
    childDetail: "في كيدز، اختر طفلًا واحدًا. يخص الشراء هذا الطفل والمنهج المحدد فقط.",
    topup: "أسئلة إضافية",
    topupPrice: "٥٠ جنيهًا · ١٠٠ سؤال",
    topupDetail:
      "اشترِ في أي وقت. تتراكم الأسئلة المشتراة ولا تنتهي صلاحيتها، حتى بعد انتهاء الاشتراك أو الدعوة. تُستخدم بعد حصتك الشهرية، ضمن المحتوى المسموح لحسابك وقت الاستخدام.",
    familyTopup: "رصيد الأسرة مشترك بين أطفالك. يستخدم كل طفل حصته الشهرية أولًا، ثم رصيد الأسرة.",
    curriculum: "اختر منهجًا واحدًا",
    child: "اختر طفلًا واحدًا",
    account: "حسابي",
    familyAccount: "رصيد أطفالي المشترك",
    buy: "المتابعة إلى الدفع",
    signIn: "سجّل الدخول للاختيار",
    unavailable: "الشراء غير متاح مؤقتًا. يرجى المحاولة لاحقًا.",
    empty: "لا تتوفر مناهج مؤهلة للشراء حاليًا.",
    childEmpty: "أضف طفلًا في حساب ولي الأمر قبل شراء منهج كيدز.",
    scope: "إضافة الأسئلة إلى",
    coupon: "رمز الخصم (اختياري)",
    duration: "مدة الخصم",
    once: "الدفعة الأولى فقط",
    repeating: "عدد محدد من الأشهر",
    forever: "طوال الاشتراك",
    months: "عدد الأشهر",
    couponScope: "نطاق الكوبون",
    subscription: "الاشتراك",
    topupScope: "رصيد الأسئلة الإضافي فقط",
    couponScopeNote:
      "لا يسري كوبون الاشتراك على الأسئلة الإضافية. يجب تخصيص الكوبون صراحةً لرصيد الأسئلة ليشمله الخصم.",
    invitation:
      "تبدأ الدعوة عند قبولها. اختر مدة محددة أو دون تاريخ انتهاء. تشمل حصة مشتركة واحدة من ٣٠٠ سؤال شهريًا للمناهج الممنوحة، بالإضافة إلى أي حصة من اشتراك مدفوع.",
  },
  "ar-Gulf": {
    included: "المساعد مشمول: ٣٠٠ سؤال كل شهر لكل منهج مشترك فيه، بدون حد لكل درس.",
    family: "لكل طفل ١٠٠ سؤال كل شهر بحصة مستقلة، لحد ٣ أطفال.",
    renewal: "مشترك حاليًا؟ سعرك وحصة أسئلتك الحالية تبقى مثل ما هي لين التجديد القادم.",
    monthly:
      "الأسئلة الشهرية تتجدد في نفس يوم بداية اشتراكك كل شهر، والمتبقي ما يترحّل. أسئلة الباقة المجانية تتجدد في نفس يوم تفعيلها كل شهر.",
    discount: "ينحسب خصم واحد: الخصم التلقائي أو الكوبون، أيهما أوفر لك. الخصمين ما يجتمعون.",
    lifetime: "منهج واحد لك مدى الحياة",
    lifetimePrice: "٧٥ جنيه · دفعة واحدة",
    lifetimeDetail:
      "اختر منهج واحد من أي مسار. يشمل ١٠٠ سؤال للشهر الأول فقط. المنهج يبقى متاح لك مدى الحياة، وتقدر تشتري أسئلة إضافية في أي وقت.",
    childDetail: "في كيدز، اختر طفل واحد. الشراء يخص هالطفل والمنهج اللي اخترته فقط.",
    topup: "أسئلة إضافية",
    topupPrice: "٥٠ جنيه · ١٠٠ سؤال",
    topupDetail:
      "اشترِ في أي وقت. الأسئلة المشتراة تتجمع وما تنتهي، حتى بعد انتهاء الاشتراك أو الدعوة. تستخدمها بعد حصتك الشهرية، في المحتوى المتاح لحسابك وقت الاستخدام.",
    familyTopup:
      "رصيد الأسرة مشترك بين أطفالك. كل طفل يستخدم حصته الشهرية أول، وبعدها رصيد الأسرة.",
    curriculum: "اختر منهج واحد",
    child: "اختر طفل واحد",
    account: "حسابي",
    familyAccount: "رصيد أطفالي المشترك",
    buy: "المتابعة للدفع",
    signIn: "سجّل دخولك للاختيار",
    unavailable: "الشراء مو متاح حاليًا. حاول مرة ثانية لاحقًا.",
    empty: "ما فيه مناهج متاحة للشراء حاليًا.",
    childEmpty: "أضف طفل في حساب ولي الأمر قبل شراء منهج كيدز.",
    scope: "إضافة الأسئلة إلى",
    coupon: "كود الخصم (اختياري)",
    duration: "مدة الخصم",
    once: "أول دفعة فقط",
    repeating: "عدد شهور محدد",
    forever: "طوال الاشتراك",
    months: "عدد الشهور",
    couponScope: "الكوبون يشمل",
    subscription: "الاشتراك",
    topupScope: "رصيد الأسئلة الإضافي فقط",
    couponScopeNote:
      "كوبون الاشتراك ما يشمل الأسئلة الإضافية. اختر رصيد الأسئلة صراحةً عشان يشمله الخصم.",
    invitation:
      "الدعوة تبدأ من قبولها. اختر مدة أو بدون تاريخ انتهاء. تشمل حصة مشتركة واحدة من ٣٠٠ سؤال كل شهر للمناهج الممنوحة، بالإضافة لأي حصة من اشتراك مدفوع.",
  },
} satisfies Record<SupportedLocale, Record<string, string>>;

export function commercialCopy(locale: SupportedLocale) {
  return copy[locale];
}
