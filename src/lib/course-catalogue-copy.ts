import type { SupportedLocale } from "@/lib/locale/types";
import { getPathStoryCopy } from "@/lib/path-story";
export function getCourseCatalogueCopy(locale: SupportedLocale) {
  const c = getPathStoryCopy(locale);
  return {
    intro:
      locale === "en"
        ? "Choose a path, explore its overview, then begin its steps."
        : locale === "ar-EG"
          ? "اختار مسارك، اعرف هتتعلّم إيه، وبعدها ابدأ خطواتك."
          : locale === "ar-Gulf"
            ? "اختر مسارك، شوف وش بتتعلّم، وبعدها ابدأ خطواتك."
            : "اختر مسارك، وتعرّف إلى محتواه، ثم ابدأ خطواتك.",
    open: c.open,
    back: c.back,
    lessons: c.steps,
    modules: c.stations,
  };
}
