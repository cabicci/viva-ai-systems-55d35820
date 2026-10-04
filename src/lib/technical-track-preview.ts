import type { SupportedLocale } from "@/lib/locale/types";
import curriculum from "./technical-curriculum-preview.json";

// Public names only from experiment/furniture-pilot-20261003 at
// e81e46643b3b7caf0d4cf20310b0d477df9e8c5e. No experimental runtime or media.
export const TECHNICAL_TRACK_PREVIEWS = [
  {
    id: "furniture",
    lessonCount: curriculum.lessons.length,
    moduleCount: curriculum.modules.length,
    sections: curriculum.sections,
  },
] as const;
export function getTechnicalTrackOutline(locale: SupportedLocale) {
  return TECHNICAL_TRACK_PREVIEWS.map((track) => ({
    ...track,
    sections: track.sections.map((section) => ({
      id: section.id,
      title: section.title[locale],
    })),
  }));
}
export function getTechnicalCurriculumPreview(locale: SupportedLocale) {
  return curriculum.sections.map((section) => ({
    id: section.id,
    title: section.title[locale],
    modules: curriculum.modules
      .filter((module) => module.sectionId === section.id)
      .map((module) => ({
        id: module.id,
        title: module.title[locale],
        lessons: module.lessonIds.map((id) => {
          const lesson = curriculum.lessons.find((entry) => entry.id === id)!;
          return { id: lesson.id, title: lesson.title[locale] };
        }),
      })),
  }));
}
