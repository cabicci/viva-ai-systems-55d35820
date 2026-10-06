import type { SupportedLocale } from "@/lib/locale/types";

export function getCourseCatalogueCopy(locale: SupportedLocale) {
  return locale === "en"
    ? {
        intro: "Choose a course to explore its modules and lessons.",
        open: "Open curriculum",
        back: "All courses",
        lessons: "lessons",
        modules: "modules",
      }
    : {
        intro:
          locale === "ar-EG"
            ? "اختار المنهج عشان تشوف وحداته ودروسه."
            : locale === "ar-Gulf"
              ? "اختر المنهج عشان تشوف وحداته ودروسه."
              : "اختر المنهج لاستعراض وحداته ودروسه.",
        open: "افتح المنهج",
        back: "كل المناهج",
        lessons: "درسًا",
        modules: "وحدات",
      };
}
