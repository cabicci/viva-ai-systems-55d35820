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
    "محتوى الدروس مُراجع، لكن الوصول للأطفال مغلق حتى تكتمل بوابات الخصوصية والتحقق من وليّ الأمر وتشغيل المحتوى على الخادم.",
  freeBadge: "أول درسين مجانًا",
  level: "المستوى",
  lessons: "12 درسًا",
  familyTitle: "اشتراك عائلي مستقل",
  familyDescription: "باقات Pro وPro Plus للكبار لا تفتح دروس كيدز تلقائيًا.",
  bundleTitle: "خصم الجمع 10%",
  bundleDescription:
    "خصم 10% عند الجمع بين اشتراك كيدز وPro أو Pro Plus. سيُعلن السعر وشروط تطبيق الخصم بعد اعتمادها.",
  parentNote:
    "إنشاء ملفات الأطفال والوصول للدروس يتطلبان تفعيل سياسة وليّ الأمر والخصوصية والتحقق على الخادم.",
} as const;

type KidsCopy = { [K in keyof typeof arabic]: string };

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
    "Lesson content has been reviewed, but child access remains closed pending privacy controls, parental verification, and server release.",
  freeBadge: "First two lessons free",
  level: "Level",
  lessons: "12 lessons",
  familyTitle: "Separate family subscription",
  familyDescription: "Adult Pro and Pro Plus plans do not unlock Kids lessons automatically.",
  bundleTitle: "10% bundle discount",
  bundleDescription:
    "A 10% discount applies when combining Kids with Pro or Pro Plus. Pricing and discount terms will be announced after approval.",
  parentNote:
    "Child profiles and lesson access require parental verification, approved privacy controls, and server release.",
};

export function getKidsCopy(locale: SupportedLocale): KidsCopy {
  return locale === "en" ? en : arabic;
}
