import type { SupportedLocale } from "@/lib/locale/types";

const arabic = {
  title: "مسارات كيدز",
  pathLabel: "مسار تعلّم مستقل للأطفال",
  cardDescription:
    "ثلاث مراحل عمرية؛ يبدأ كل مستوى بدرسين مجانيين. يدير وليّ الأمر الحساب والتقدم.",
  details: "اكتشف مسارات كيدز",
  eyebrow: "تعلّم الذكاء الاصطناعي بحسب المرحلة العمرية",
  intro:
    "ثلاث مراحل، في كل مرحلة 12 درسًا بنسخ عربية وإنجليزية. يدير وليّ الأمر الوصول والتقدم، وتبقى باقات الكبار مستقلة.",
  reviewNotice:
    "خدمة الأطفال مغلقة مؤقتًا. عند إتاحتها يقرأ وليّ الأمر سياسة خصوصية الأطفال ويوافق عليها قبل إنشاء الملفات.",
  freeBadge: "أول درسين مجانًا",
  level: "المستوى",
  lessons: "12 درسًا",
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
    "٣ مراحل عمرية، وأول درسين في كل مستوى مجانًا. وليّ الأمر بيتابع الحساب والتقدم.",
  details: "اكتشف مسارات كيدز",
  eyebrow: "اتعلّم الذكاء الاصطناعي على قد مرحلتك العمرية",
  intro:
    "٣ مراحل، في كل مرحلة ١٢ درس بالعربي والإنجليزي. وليّ الأمر بيتابع الوصول والتقدم، وباقات الكبار منفصلة.",
  reviewNotice:
    "خدمة الأطفال مقفولة مؤقتًا. لما تتاح، وليّ الأمر يقرأ سياسة خصوصية الأطفال ويوافق عليها قبل إنشاء الملفات.",
  freeBadge: "أول درسين ببلاش",
  level: "المستوى",
  lessons: "١٢ درس",
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
    "ثلاث مراحل عمرية، وأول درسين بكل مستوى مجانًا. وليّ الأمر يدير الحساب ويتابع التقدّم.",
  details: "اكتشف مسارات كيدز",
  eyebrow: "تعلّم الذكاء الاصطناعي على حسب مرحلتك العمرية",
  intro:
    "ثلاث مراحل، بكل مرحلة ١٢ درس بالعربي والإنجليزي. وليّ الأمر يدير الوصول والتقدّم، وباقات الكبار منفصلة.",
  reviewNotice:
    "خدمة الأطفال مقفولة مؤقتًا. عند إتاحتها وليّ الأمر يقرأ سياسة خصوصية الأطفال ويوافق عليها قبل إنشاء الملفات.",
  freeBadge: "أول درسين مجانًا",
  level: "المستوى",
  lessons: "١٢ درس",
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
    "Three age levels, planned to start with two free lessons each. Parents will manage access and progress.",
  details: "Explore Masaarat Kids",
  eyebrow: "AI learning for each age level",
  intro:
    "Three levels with 12 lessons each, in Arabic and English versions. A parent manages access and progress; adult plans stay separate.",
  reviewNotice:
    "Kids is temporarily closed. Once available, parents read and accept the children's privacy policy before creating profiles.",
  freeBadge: "First two lessons free",
  level: "Level",
  lessons: "12 lessons",
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
