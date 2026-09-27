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
  familyTitle: "اشتراك عائلي مستقل",
  parentNote:
    "إنشاء ملفات الأطفال والوصول للدروس يتطلبان موافقة وليّ الأمر على خصوصية الطفل والتحقق على الخادم.",
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
  familyTitle: "اشتراك عائلي منفصل",
  parentNote:
    "إنشاء ملفات الأطفال وفتح الدروس محتاج تفعيل الخدمة وموافقة وليّ الأمر على خصوصية الطفل.",
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
  familyTitle: "اشتراك عائلي مستقل",
  parentNote:
    "إنشاء ملفات الأطفال وفتح الدروس يتطلب تفعيل الخدمة وموافقة وليّ الأمر على خصوصية الطفل.",
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
  familyTitle: "Separate family subscription",
  parentNote:
    "Child profiles and lesson access require parent consent to the children's privacy policy and server access checks.",
};

export function getKidsCopy(locale: SupportedLocale): KidsCopy {
  if (locale === "en") return en;
  if (locale === "ar-EG") return egyptian;
  if (locale === "ar-Gulf") return gulf;
  return arabic;
}
