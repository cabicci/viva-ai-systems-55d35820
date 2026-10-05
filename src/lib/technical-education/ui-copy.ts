import type { SupportedLocale } from "@/lib/locale/types";
const copy = {
  "ar-EG": {
    loading: "بنحمّل الدرس…",
    error: "تعذر تحميل الدرس. حاول تاني.",
    retry: "حاول تاني",
    login: "سجّل دخولك عشان تبدأ",
    locked: "الدرس ده محتاج باقة التعليم المهني.",
    plans: "شوف الباقة",
    back: "ارجع للمنهج",
    next: "الدرس اللي بعده",
    previous: "الدرس اللي قبله",
    title: "باقة النجارة وصناعة الأثاث",
    details:
      "كل دروس مسار الأثاث بأربع صيغ، مع الفيديوهات والتطبيقات وملفات PDF. الباقة مستقلة عن AI وكيدز.",
  },
  "ar-MSA": {
    loading: "جارٍ تحميل الدرس…",
    error: "تعذر تحميل الدرس. حاول مجددًا.",
    retry: "إعادة المحاولة",
    login: "سجّل الدخول لبدء التعلم",
    locked: "يتطلب هذا الدرس باقة التعليم المهني.",
    plans: "عرض الباقة",
    back: "العودة إلى المنهج",
    next: "الدرس التالي",
    previous: "الدرس السابق",
    title: "باقة النجارة وصناعة الأثاث",
    details:
      "جميع دروس مسار الأثاث بأربع صيغ، مع الفيديوهات والتطبيقات وملفات PDF. الباقة مستقلة عن AI وكيدز.",
  },
  "ar-Gulf": {
    loading: "نحمّل الدرس…",
    error: "ما قدرنا نحمّل الدرس. حاول مرة ثانية.",
    retry: "حاول مرة ثانية",
    login: "سجّل دخولك عشان تبدأ",
    locked: "هذا الدرس يحتاج باقة التعليم المهني.",
    plans: "شوف الباقة",
    back: "ارجع للمنهج",
    next: "الدرس اللي بعده",
    previous: "الدرس اللي قبله",
    title: "باقة النجارة وصناعة الأثاث",
    details:
      "كل دروس مسار الأثاث بأربع صيغ، مع الفيديوهات والتطبيقات وملفات PDF. الباقة مستقلة عن AI وكيدز.",
  },
  en: {
    loading: "Loading lesson…",
    error: "Could not load this lesson. Try again.",
    retry: "Try again",
    login: "Sign in to start learning",
    locked: "This lesson requires the vocational learning plan.",
    plans: "View plan",
    back: "Back to curriculum",
    next: "Next lesson",
    previous: "Previous lesson",
    title: "Carpentry and furniture plan",
    details:
      "The full furniture path in four locales, with videos, practice and PDF downloads. This plan is independent of AI and Kids.",
  },
};
export const technicalUiCopy = (locale: SupportedLocale) => copy[locale];
