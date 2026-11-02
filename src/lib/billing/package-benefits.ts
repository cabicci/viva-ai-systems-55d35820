import type { SupportedLocale } from "@/lib/locale/types";

// Benefit wording never selects a price or authorizes content. Existing price
// components keep their reviewed currency and monthly/annual values.
const benefits = {
  en: {
    paid: [
      "Access lasts for your active subscription.",
      "Questions renew on your monthly anniversary; unused questions do not roll over.",
    ],
    freeRenewal:
      "Questions renew each month on your activation anniversary; unused questions do not roll over.",
    lifetime: [
      "Choose one complete curriculum from any learning path.",
      "One payment gives lifetime access to that curriculum.",
      "100 assistant questions for the first month only.",
      "Buy extra questions at any time.",
    ],
    topup: [
      "100 extra questions; repeat purchases accumulate and never expire.",
      "Used after your monthly question allowance.",
      "Usable only in content your account can currently access.",
    ],
    invitationCommon: [
      "No paid subscription required; access starts when the invitation is accepted.",
      "Access and included questions last only while the invitation is valid.",
      "Questions renew on the monthly acceptance anniversary; unused questions do not roll over.",
    ],
    invitationSingle: [
      "One selected published curriculum from any learning path.",
      "100 questions each month; for Kids, one shared allowance across the recipient’s children.",
    ],
    invitationComprehensive: [
      "Access to the curricula selected by the administrator.",
      "300 questions each month in one shared pool per invitation, additional to any paid allowance.",
    ],
  },
  "ar-EG": {
    paid: [
      "المحتوى متاح طول ما اشتراكك ساري.",
      "الأسئلة بتتجدد في نفس يوم بداية الاشتراك كل شهر، والباقي مش بيترحّل.",
    ],
    freeRenewal: "الأسئلة بتتجدد في نفس يوم التفعيل كل شهر، والباقي مش بيترحّل.",
    lifetime: [
      "اختار منهج كامل واحد من أي مسار.",
      "دفعة واحدة تفتح لك المنهج مدى الحياة.",
      "١٠٠ سؤال للمساعد لأول شهر بس.",
      "تقدر تشتري أسئلة زيادة في أي وقت.",
    ],
    topup: [
      "١٠٠ سؤال زيادة؛ المشتريات بتتجمع ومش بتنتهي.",
      "بتستخدمها بعد انتهاء حصتك الشهرية.",
      "بتشتغل بس في المحتوى المتاح لحسابك وقت الاستخدام.",
    ],
    invitationCommon: [
      "مش محتاج اشتراك مدفوع؛ الوصول بيبدأ لما تقبل الدعوة.",
      "المحتوى والأسئلة المتضمنة متاحين طول ما الدعوة سارية بس.",
      "الأسئلة بتتجدد في نفس يوم قبول الدعوة كل شهر، والباقي مش بيترحّل.",
    ],
    invitationSingle: [
      "منهج منشور واحد تختاره الإدارة من أي مسار.",
      "١٠٠ سؤال كل شهر؛ في كيدز الحصة مشتركة بين أطفال صاحب الدعوة.",
    ],
    invitationComprehensive: [
      "وصول للمناهج اللي تختارها الإدارة.",
      "٣٠٠ سؤال كل شهر في حصة واحدة لكل دعوة، زيادة على أي حصة مدفوعة.",
    ],
  },
  "ar-MSA": {
    paid: [
      "يستمر الوصول إلى المحتوى طوال سريان الاشتراك.",
      "تتجدد الأسئلة في يوم بدء الاشتراك من كل شهر، ولا يُرحّل المتبقي.",
    ],
    freeRenewal: "تتجدد الأسئلة في يوم التفعيل من كل شهر، ولا يُرحّل المتبقي.",
    lifetime: [
      "اختر منهجًا كاملًا واحدًا من أي مسار.",
      "دفعة واحدة تمنحك الوصول إلى المنهج مدى الحياة.",
      "١٠٠ سؤال للمساعد للشهر الأول فقط.",
      "يمكن شراء أسئلة إضافية في أي وقت.",
    ],
    topup: [
      "١٠٠ سؤال إضافي؛ تتراكم المشتريات ولا تنتهي صلاحيتها.",
      "تُستخدم بعد استنفاد حصتك الشهرية.",
      "تُستخدم فقط ضمن المحتوى المتاح لحسابك وقت الاستخدام.",
    ],
    invitationCommon: [
      "لا يلزم اشتراك مدفوع؛ يبدأ الوصول عند قبول الدعوة.",
      "يستمر الوصول وحصة الأسئلة فقط طوال سريان الدعوة.",
      "تتجدد الأسئلة في يوم القبول من كل شهر، ولا يُرحّل المتبقي.",
    ],
    invitationSingle: [
      "منهج منشور واحد يختاره المسؤول من أي مسار.",
      "١٠٠ سؤال شهريًا؛ حصة الأطفال مشتركة بين أطفال المستفيد.",
    ],
    invitationComprehensive: [
      "الوصول إلى المناهج التي يحددها المسؤول.",
      "٣٠٠ سؤال شهريًا في حصة مشتركة لكل دعوة، بالإضافة إلى أي حصة مدفوعة.",
    ],
  },
  "ar-Gulf": {
    paid: [
      "المحتوى يبقى متاح طول ما اشتراكك ساري.",
      "الأسئلة تتجدد في نفس يوم بداية الاشتراك كل شهر، والمتبقي ما يترحّل.",
    ],
    freeRenewal: "الأسئلة تتجدد في نفس يوم التفعيل كل شهر، والمتبقي ما يترحّل.",
    lifetime: [
      "اختر منهج كامل واحد من أي مسار.",
      "دفعة واحدة تفتح لك المنهج مدى الحياة.",
      "١٠٠ سؤال للمساعد للشهر الأول فقط.",
      "تقدر تشتري أسئلة إضافية في أي وقت.",
    ],
    topup: [
      "١٠٠ سؤال إضافي؛ مشترياتك تتجمع وما تنتهي.",
      "تستخدمها بعد ما تخلص حصتك الشهرية.",
      "تستخدمها بس في المحتوى المتاح لحسابك وقت الاستخدام.",
    ],
    invitationCommon: [
      "ما تحتاج اشتراك مدفوع؛ الوصول يبدأ لما تقبل الدعوة.",
      "المحتوى والأسئلة المشمولة متاحة طول ما الدعوة سارية فقط.",
      "الأسئلة تتجدد في نفس يوم قبول الدعوة كل شهر، والمتبقي ما يترحّل.",
    ],
    invitationSingle: [
      "منهج منشور واحد تختاره الإدارة من أي مسار.",
      "١٠٠ سؤال كل شهر؛ في كيدز الحصة مشتركة بين أطفال صاحب الدعوة.",
    ],
    invitationComprehensive: [
      "وصول للمناهج اللي تحددها الإدارة.",
      "٣٠٠ سؤال كل شهر في حصة مشتركة لكل دعوة، بالإضافة لأي حصة مدفوعة.",
    ],
  },
} satisfies Record<
  SupportedLocale,
  {
    paid: string[];
    freeRenewal: string;
    lifetime: string[];
    topup: string[];
    invitationCommon: string[];
    invitationSingle: string[];
    invitationComprehensive: string[];
  }
>;

export const packageBenefits = (locale: SupportedLocale) => benefits[locale];
