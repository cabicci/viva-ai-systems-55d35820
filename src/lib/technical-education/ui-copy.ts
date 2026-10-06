import type { SupportedLocale } from "@/lib/locale/types";
const copy = {
  "ar-EG": {
    loading: "بنحمّل الخطوة…",
    error: "تعذر تحميل الخطوة. حاول تاني.",
    retry: "حاول تاني",
    login: "سجّل دخولك عشان تبدأ",
    locked: "الخطوة ده محتاج باقة التعليم الفني.",
    plans: "شوف الباقة",
    back: "ارجع للمنهج",
    next: "الخطوة اللي بعده",
    previous: "الخطوة اللي قبله",
    title: "باقة النجارة وصناعة الأثاث",
    details:
      "كل خطوات مسار الأثاث بأربع صيغ، مع الفيديوهات والتطبيقات وملفات PDF. الباقة مستقلة عن AI وكيدز.",
  },
  "ar-MSA": {
    loading: "جارٍ تحميل الخطوة…",
    error: "تعذر تحميل الخطوة. حاول مجددًا.",
    retry: "إعادة المحاولة",
    login: "سجّل الدخول لبدء التعلم",
    locked: "يتطلب هذا الخطوة باقة التعليم الفني.",
    plans: "عرض الباقة",
    back: "العودة إلى المنهج",
    next: "الخطوة التالي",
    previous: "الخطوة السابق",
    title: "باقة النجارة وصناعة الأثاث",
    details:
      "جميع خطوات مسار الأثاث بأربع صيغ، مع الفيديوهات والتطبيقات وملفات PDF. الباقة مستقلة عن AI وكيدز.",
  },
  "ar-Gulf": {
    loading: "نحمّل الخطوة…",
    error: "ما قدرنا نحمّل الخطوة. حاول مرة ثانية.",
    retry: "حاول مرة ثانية",
    login: "سجّل دخولك عشان تبدأ",
    locked: "هذا الخطوة يحتاج باقة التعليم الفني.",
    plans: "شوف الباقة",
    back: "ارجع للمنهج",
    next: "الخطوة اللي بعده",
    previous: "الخطوة اللي قبله",
    title: "باقة النجارة وصناعة الأثاث",
    details:
      "كل خطوات مسار الأثاث بأربع صيغ، مع الفيديوهات والتطبيقات وملفات PDF. الباقة مستقلة عن AI وكيدز.",
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
    title: "Carpentry and furniture plan",
    details:
      "The full furniture path in four locales, with videos, practice and PDF downloads. This plan is independent of AI and Kids.",
  },
};
export const technicalUiCopy = (locale: SupportedLocale) => copy[locale];
