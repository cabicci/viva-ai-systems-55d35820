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
  reviewNotice: "الدروس قيد التجهيز والمراجعة قبل إتاحتها للأطفال. هذه الصفحة تعريفية حاليًا.",
  freeBadge: "أول درسين مجانًا",
  level: "المستوى",
  lessons: "12 درسًا",
  familyTitle: "اشتراك عائلي مستقل",
  familyDescription: "باقات Pro وPro Plus للكبار لا تفتح دروس كيدز تلقائيًا.",
  bundleTitle: "خصم الجمع 10%",
  bundleDescription:
    "عند الاشتراك في كيدز مع Pro أو Pro Plus، يُخصم 10% من إجمالي الاشتراكين وفق السعر المعتمد لاحقًا.",
  parentNote:
    "إنشاء ملفات الأطفال والوصول للدروس سيُتاحان بعد اكتمال سياسة وليّ الأمر والخصوصية والمراجعة التعليمية.",
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
    "Lessons are being prepared and reviewed before children can use them. This page is informational for now.",
  freeBadge: "First two lessons free",
  level: "Level",
  lessons: "12 lessons",
  familyTitle: "Separate family subscription",
  familyDescription: "Adult Pro and Pro Plus plans do not unlock Kids lessons automatically.",
  bundleTitle: "10% bundle discount",
  bundleDescription:
    "A Kids subscription combined with Pro or Pro Plus receives 10% off the combined approved subscription price.",
  parentNote:
    "Child profiles and lesson access open only after parent and privacy policies and educational review are completed.",
};

export function getKidsCopy(locale: SupportedLocale): KidsCopy {
  return locale === "en" ? en : arabic;
}
