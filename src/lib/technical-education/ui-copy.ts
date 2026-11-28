import type { SupportedLocale } from "@/lib/locale/types";
const copy = {
  "ar-EG": {
    loading: "بنحمّل الخطوة…",
    error: "تعذر تحميل الخطوة. حاول تاني.",
    retry: "حاول تاني",
    login: "سجّل دخولك عشان تبدأ",
    locked: "الخطوة دي محتاجة باقة التعليم الفني.",
    plans: "شوف الباقة",
    back: "ارجع للمنهج",
    next: "الخطوة اللي بعدها",
    previous: "الخطوة اللي قبلها",
    title: "باقة التعليم الفني",
    details:
      "اشتراكك بيفتح لك كل المناهج المنشورة في التعليم الفني طول مدة الاشتراك، ومعاها الفيديوهات والتدريبات وملفات الدروس.",
  },
  "ar-MSA": {
    loading: "جارٍ تحميل الخطوة…",
    error: "تعذر تحميل الخطوة. حاول مجددًا.",
    retry: "إعادة المحاولة",
    login: "سجّل الدخول لبدء التعلم",
    locked: "تتطلب هذه الخطوة باقة التعليم الفني.",
    plans: "عرض الباقة",
    back: "العودة إلى المنهج",
    next: "الخطوة التالية",
    previous: "الخطوة السابقة",
    title: "باقة التعليم الفني",
    details:
      "يتيح الاشتراك الوصول إلى جميع مناهج التعليم الفني المنشورة طوال مدة الاشتراك، بما فيها مقاطع الفيديو والتدريبات وملفات الدروس.",
  },
  "ar-Gulf": {
    loading: "نحمّل الخطوة…",
    error: "ما قدرنا نحمّل الخطوة. حاول مرة ثانية.",
    retry: "حاول مرة ثانية",
    login: "سجّل دخولك عشان تبدأ",
    locked: "هالخطوة تحتاج باقة التعليم الفني.",
    plans: "شوف الباقة",
    back: "ارجع للمنهج",
    next: "الخطوة اللي بعدها",
    previous: "الخطوة اللي قبلها",
    title: "باقة التعليم الفني",
    details:
      "اشتراكك يفتح لك كل مناهج التعليم الفني المنشورة طول مدة اشتراكك، ومعها الفيديوهات والتمارين وملفات الدروس.",
  },
  en: {
    loading: "Loading step…",
    error: "Could not load this step. Try again.",
    retry: "Try again",
    login: "Sign in to start learning",
    locked: "This step requires the technical learning plan.",
    plans: "View plan",
    back: "Back to curriculum",
    next: "Next step",
    previous: "Previous step",
    title: "Technical learning plan",
    details:
      "Access all published technical curricula while your subscription is active, including their videos, practice activities and lesson downloads.",
  },
};
export const technicalUiCopy = (locale: SupportedLocale) => copy[locale];
