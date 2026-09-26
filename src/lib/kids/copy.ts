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
    "الدروس والفيديوهات جاهزة. يمكن تقديم طلب وليّ الأمر، لكن إنشاء ملفات الأطفال وفتح الدروس لم يُفعّلا بعد.",
  freeBadge: "أول درسين مجانًا",
  level: "المستوى",
  lessons: "12 درسًا",
  familyTitle: "اشتراك عائلي مستقل",
  familyDescription: "باقات Pro وPro Plus للكبار لا تفتح دروس كيدز تلقائيًا.",
  bundleTitle: "خصم الجمع 10%",
  bundleDescription:
    "خصم 10% على اشتراك كيدز فقط عند الجمع مع Pro أو Pro Plus؛ لا يتغير سعر باقة الكبار.",
  parentNote:
    "إنشاء ملفات الأطفال والوصول للدروس يتطلبان تفعيل سياسة وليّ الأمر والخصوصية والتحقق على الخادم.",
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
    "الدروس والفيديوهات جاهزة. تقدر تطلب مراجعة حساب وليّ الأمر، لكن إنشاء ملفات الأطفال وفتح الدروس لسه ما اتفعّلوش.",
  freeBadge: "أول درسين ببلاش",
  level: "المستوى",
  lessons: "١٢ درس",
  familyTitle: "اشتراك عائلي منفصل",
  familyDescription: "باقات Pro وPro Plus للكبار مش بتفتح دروس كيدز لوحدها.",
  bundleTitle: "خصم الجمع ١٠٪",
  bundleDescription:
    "خصم ١٠٪ على اشتراك كيدز بس لما تجمعه مع Pro أو Pro Plus؛ سعر باقة الكبار ما بيتغيرش.",
  parentNote:
    "إنشاء ملفات الأطفال وفتح الدروس محتاج تفعيل الخدمة والتحقق من وليّ الأمر والموافقة على خصوصية الطفل.",
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
    "الدروس والفيديوهات جاهزة. تقدر تقدم طلب وليّ الأمر، لكن إنشاء ملفات الأطفال وفتح الدروس ما تفعّلوا للحين.",
  freeBadge: "أول درسين مجانًا",
  level: "المستوى",
  lessons: "١٢ درس",
  familyTitle: "اشتراك عائلي مستقل",
  familyDescription: "باقات Pro وPro Plus للكبار ما تفتح دروس كيدز تلقائيًا.",
  bundleTitle: "خصم الجمع ١٠٪",
  bundleDescription: "خصم ١٠٪ على كيدز بس عند الجمع مع Pro أو Pro Plus؛ سعر باقة الكبار ما يتغير.",
  parentNote:
    "إنشاء ملفات الأطفال وفتح الدروس يتطلب تفعيل الخدمة والتحقق من وليّ الأمر والموافقة على خصوصية الطفل.",
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
    "Lessons and videos are ready. Parents may request access, but child profiles and lessons have not been opened yet.",
  freeBadge: "First two lessons free",
  level: "Level",
  lessons: "12 lessons",
  familyTitle: "Separate family subscription",
  familyDescription: "Adult Pro and Pro Plus plans do not unlock Kids lessons automatically.",
  bundleTitle: "10% bundle discount",
  bundleDescription:
    "Save 10% on Kids only when combined with Pro or Pro Plus; the adult plan price stays the same.",
  parentNote:
    "Child profiles and lesson access require parental verification, approved privacy controls, and server release.",
};

export function getKidsCopy(locale: SupportedLocale): KidsCopy {
  if (locale === "en") return en;
  if (locale === "ar-EG") return egyptian;
  if (locale === "ar-Gulf") return gulf;
  return arabic;
}
