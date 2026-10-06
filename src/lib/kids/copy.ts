import type { SupportedLocale } from "@/lib/locale/types";

const arabic = {
  title: "مسارات كيدز",
  pathLabel: "مسار تعلّم مستقل للأطفال",
  cardDescription:
    "ثلاث مراحل عمرية؛ يبدأ كل مسار بخطوةين مجانيين. يدير وليّ الأمر حساب الأطفال وملفاتهم.",
  details: "اكتشف مسارات كيدز",
  eyebrow: "تعلّم الذكاء الاصطناعي بحسب المرحلة العمرية",
  intro:
    "ثلاث مراحل، في كل مرحلة 12 خطوة بنسخ عربية وإنجليزية. يدير وليّ الأمر الوصول وملفات الأطفال، وتبقى باقات الكبار مستقلة.",
  reviewNotice:
    "خدمة الأطفال مغلقة مؤقتًا. عند إتاحتها يقرأ وليّ الأمر سياسة خصوصية الأطفال ويوافق عليها قبل إنشاء الملفات.",
  releaseUnavailable: "تعذر التحقق من حالة كيدز الآن. حاول مجددًا بعد قليل.",
  freeBadge: "أول خطوةين مجانًا",
  level: "المسار",
  lessons: "12 خطوة",
  viewPricing: "عرض باقات كيدز وأسعارها",
  nextStep: "الخطوة التالية",
  startKids: "ابدأ كيدز",
  parentNote:
    "استخدم حساب مسارات نفسه، ثم وافق على سياسة الأطفال وأنشئ ملفًا لكل طفل. لا يحتاج كيدز إلى حساب آخر.",
} as const;

type KidsCopy = { [K in keyof typeof arabic]: string };

const egyptian: KidsCopy = {
  title: "مسارات كيدز",
  pathLabel: "مسار تعليم مخصوص للأطفال",
  cardDescription:
    "٣ مراحل عمرية، وأول خطوةين في كل مسار مجانًا. وليّ الأمر بيدير حساب الأطفال وملفاتهم.",
  details: "اكتشف مسارات كيدز",
  eyebrow: "اتعلّم الذكاء الاصطناعي على قد مرحلتك العمرية",
  intro:
    "٣ مراحل، في كل مرحلة ١٢ خطوة بالعربي والإنجليزي. وليّ الأمر بيدير الوصول وملفات الأطفال، وباقات الكبار منفصلة.",
  reviewNotice:
    "خدمة الأطفال مقفولة مؤقتًا. لما تتاح، وليّ الأمر يقرأ سياسة خصوصية الأطفال ويوافق عليها قبل إنشاء الملفات.",
  releaseUnavailable: "مش قادرين نتأكد من حالة كيدز دلوقتي. حاول بعد شوية.",
  freeBadge: "أول خطوةين ببلاش",
  level: "المسار",
  lessons: "١٢ خطوة",
  viewPricing: "شوف باقات كيدز وأسعارها",
  nextStep: "الخطوة الجاية",
  startKids: "ابدأ كيدز",
  parentNote:
    "استخدم نفس حساب مسارات، ووافق على سياسة الأطفال واعمل ملف لكل طفل. مفيش حساب تاني لكيدز.",
};

const gulf: KidsCopy = {
  title: "مسارات كيدز",
  pathLabel: "مسار تعلّم مستقل للأطفال",
  cardDescription:
    "ثلاث مراحل عمرية، وأول خطوةين بكل مسار مجانًا. وليّ الأمر يدير حساب الأطفال وملفاتهم.",
  details: "اكتشف مسارات كيدز",
  eyebrow: "تعلّم الذكاء الاصطناعي على حسب مرحلتك العمرية",
  intro:
    "ثلاث مراحل، بكل مرحلة ١٢ خطوة بالعربي والإنجليزي. وليّ الأمر يدير الوصول وملفات الأطفال، وباقات الكبار منفصلة.",
  reviewNotice:
    "خدمة الأطفال مقفولة مؤقتًا. عند إتاحتها وليّ الأمر يقرأ سياسة خصوصية الأطفال ويوافق عليها قبل إنشاء الملفات.",
  releaseUnavailable: "تعذر التحقق من حالة كيدز الحين. جرّب بعدين.",
  freeBadge: "أول خطوةين مجانًا",
  level: "المسار",
  lessons: "١٢ خطوة",
  viewPricing: "شوف باقات كيدز وأسعارها",
  nextStep: "الخطوة التالية",
  startKids: "ابدأ كيدز",
  parentNote:
    "استخدم حساب مسارات نفسه، ثم وافق على سياسة الأطفال وسوّ ملفًا لكل طفل. ما تحتاج حساب ثاني لكيدز.",
};

const en: KidsCopy = {
  title: "Masaarat Kids",
  pathLabel: "A separate learning path for children",
  cardDescription:
    "Three age paths with two free steps each. Parents manage children's access and profiles.",
  details: "Explore Masaarat Kids",
  eyebrow: "AI learning for each age path",
  intro:
    "Three levels with 12 steps each, in Arabic and English versions. A parent manages access and child profiles; adult plans stay separate.",
  reviewNotice:
    "Kids is temporarily closed. Once available, parents read and accept the children's privacy policy before creating profiles.",
  releaseUnavailable: "Kids availability could not be checked right now. Please try again shortly.",
  freeBadge: "First two steps free",
  level: "Path",
  lessons: "12 steps",
  viewPricing: "View Kids plans and prices",
  nextStep: "Next step",
  startKids: "Get started with Kids",
  parentNote:
    "Use your existing Masaarat account, accept the children's policy, and create a profile for each child. Kids needs no second account.",
};

export function getKidsCopy(locale: SupportedLocale): KidsCopy {
  if (locale === "en") return en;
  if (locale === "ar-EG") return egyptian;
  if (locale === "ar-Gulf") return gulf;
  return arabic;
}
