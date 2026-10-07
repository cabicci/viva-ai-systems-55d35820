import type { SupportedLocale } from "@/lib/locale/types";
import { localizePathText } from "@/lib/path-story";
const copy = {
  title: ["رحلتي في مسارات", "رحلتي في مسارات", "رحلتي في مسارات", "My Masaarat journey"],
  progress: ["وصلت لفين؟", "إلى أين وصلت؟", "وين وصلت؟", "Your progress"],
  resume: [
    "كمّل من آخر مرة",
    "تابع من حيث توقفت",
    "كمّل من آخر مرة",
    "Continue where you left off",
  ],
  start: ["ابدأ المسار", "ابدأ المسار", "ابدأ المسار", "Start path"],
  next: ["الخطوة التالية", "الخطوة التالية", "الخطوة التالية", "Next step"],
  contents: ["محتويات المسار", "محتويات المسار", "محتويات المسار", "Path contents"],
  completed: ["خطوة مكتملة", "خطوة مكتملة", "خطوة مكتملة", "steps completed"],
  available: [
    "الخطوات المتاحة لحسابك",
    "الخطوات المتاحة لحسابك",
    "الخطوات المتاحة لحسابك",
    "Steps available to your account",
  ],
  loading: ["بنحمّل تقدّمك…", "جارٍ تحميل تقدّمك…", "نحمّل تقدّمك…", "Loading your progress…"],
  error: [
    "تعذّر تحميل التقدّم. جرّب تاني.",
    "تعذّر تحميل التقدّم. أعد المحاولة.",
    "ما قدرنا نحمّل التقدّم. جرّب مرة ثانية.",
    "Progress could not be loaded. Please retry.",
  ],
  retry: ["جرّب تاني", "أعد المحاولة", "جرّب مرة ثانية", "Retry"],
  family: ["رحلات الأطفال", "رحلات الأطفال", "رحلات الأطفال", "Children’s journeys"],
  familyLink: [
    "إدارة ملفات الأطفال",
    "إدارة ملفات الأطفال",
    "إدارة ملفات الأطفال",
    "Manage child profiles",
  ],
  familyNote: [
    "تقدّم كل طفل محفوظ في ملفه، ومنفصل عن تقدّمك.",
    "يُحفظ تقدّم كل طفل في ملفه، مستقلًا عن تقدّمك.",
    "تقدّم كل طفل محفوظ بملفه، ومنفصل عن تقدّمك.",
    "Each child’s progress is saved separately from your own.",
  ],
  noChild: [
    "اختار أو أنشئ ملف طفل من صفحة الأسرة.",
    "اختر أو أنشئ ملف طفل من صفحة الأسرة.",
    "اختر أو أنشئ ملف طفل من صفحة الأسرة.",
    "Choose or create a child profile on the family page.",
  ],
  preview: ["معاينة الأدمن", "معاينة المسؤول", "معاينة المشرف", "Admin preview"],
  previewNote: [
    "المعاينة مش بتسجّل تقدّم لطفل.",
    "لا تسجّل المعاينة تقدّمًا لطفل.",
    "المعاينة ما تسجّل تقدّم لطفل.",
    "Preview does not record child progress.",
  ],
  mark: ["أنهيت الخطوة", "أكملت الخطوة", "خلصت الخطوة", "Mark step complete"],
  marked: [
    "تم حفظ إكمال الخطوة",
    "حُفظ إكمال الخطوة",
    "تم حفظ إكمال الخطوة",
    "Step completion saved",
  ],
  markNote: [
    "سجّل إنك خلّصت أنشطة الخطوة. ده مش تقييم لنتيجة الاختبار.",
    "سجّل إكمال أنشطة الخطوة؛ هذا ليس تقييمًا لنتيجة الاختبار.",
    "سجّل إنك خلصت أنشطة الخطوة. هذا مو تقييم للاختبار.",
    "Record that you finished the step’s activities. This is not a quiz score.",
  ],
  saveError: [
    "تعذّر الحفظ. جرّب تاني.",
    "تعذّر الحفظ. أعد المحاولة.",
    "ما قدرنا نحفظ. جرّب مرة ثانية.",
    "Could not save. Please retry.",
  ],
  allDone: [
    "أنهيت الخطوات المتاحة لك",
    "أكملت الخطوات المتاحة لك",
    "خلصت الخطوات المتاحة لك",
    "You completed your available steps",
  ],
  bookmarkError: [
    "تعذّر حفظ مكان التوقّف.",
    "تعذّر حفظ موضع التوقّف.",
    "ما قدرنا نحفظ مكان التوقف.",
    "Your resume position could not be saved.",
  ],
} satisfies Record<string, readonly [string, string, string, string]>;
export const journeyCopy = (locale: SupportedLocale) =>
  Object.fromEntries(
    Object.entries(copy).map(([key, value]) => [key, localizePathText(value, locale)]),
  ) as Record<keyof typeof copy, string>;
