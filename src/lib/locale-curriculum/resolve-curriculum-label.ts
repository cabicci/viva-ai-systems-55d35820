import { getPath, PATHS, type PathId } from "@/lib/curriculum-data";
import type { SupportedLocale } from "@/lib/locale/types";
import arEGLabels from "./ar-EG/labels.json";
import arMSALabels from "./ar-MSA/labels.json";
import arGulfLabels from "./ar-Gulf/labels.json";
import enLabels from "./en/labels.json";
import enLessonTitles from "@/lib/locale-lessons/en/lesson-titles.json";
import arMSALessonTitles from "@/lib/locale-lessons/ar-MSA/lesson-titles.json";
import arGulfLessonTitles from "@/lib/locale-lessons/ar-Gulf/lesson-titles.json";
import type {
  CurriculumModuleLabelField,
  CurriculumPathLabelField,
  LocaleCurriculumLabelsFile,
} from "./types";

const LABELS_BY_LOCALE: Record<SupportedLocale, LocaleCurriculumLabelsFile> = {
  "ar-EG": arEGLabels as LocaleCurriculumLabelsFile,
  "ar-MSA": arMSALabels as LocaleCurriculumLabelsFile,
  "ar-Gulf": arGulfLabels as LocaleCurriculumLabelsFile,
  en: enLabels as LocaleCurriculumLabelsFile,
};

/** Lightweight title indexes only — not full lesson packages. */
const LESSON_TITLES_BY_LOCALE: Partial<
  Record<SupportedLocale, Record<string, string>>
> = {
  en: enLessonTitles as Record<string, string>,
  "ar-MSA": arMSALessonTitles as Record<string, string>,
  "ar-Gulf": arGulfLessonTitles as Record<string, string>,
};

function canonicalPathLabel(pathId: PathId, field: CurriculumPathLabelField): string {
  const path = getPath(pathId);
  if (!path) return pathId;
  return field === "title" ? path.title : path.tagline;
}

function canonicalModuleLabel(moduleId: string, field: CurriculumModuleLabelField): string {
  for (const path of PATHS) {
    const module = path.modules.find((m) => m.id === moduleId);
    if (module) {
      if (field === "title") return module.title;
      return module.subtitle ?? "";
    }
  }
  return moduleId;
}

/** Locale overlay for curriculum path chrome — falls back to curriculum-data (ar-EG canonical). */
export function getCurriculumPathLabel(
  locale: SupportedLocale,
  pathId: PathId,
  field: CurriculumPathLabelField,
): string {
  const overlay = LABELS_BY_LOCALE[locale]?.paths?.[pathId]?.[field]?.trim();
  if (overlay) return overlay;
  return canonicalPathLabel(pathId, field);
}

/** Locale overlay for curriculum module chrome — falls back to curriculum-data canonical field. */
export function getCurriculumModuleLabel(
  locale: SupportedLocale,
  moduleId: string,
  field: CurriculumModuleLabelField,
): string {
  const overlay = LABELS_BY_LOCALE[locale]?.modules?.[moduleId]?.[field]?.trim();
  if (overlay) return overlay;
  return canonicalModuleLabel(moduleId, field);
}

function canonicalLessonTitle(lessonId: string): string {
  for (const path of PATHS) {
    for (const module of path.modules) {
      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson.title;
    }
  }
  return lessonId;
}

/**
 * Locale overlay for curriculum lesson titles.
 * ar-EG uses curriculum-data; package locales use lightweight lesson-titles.json.
 * Missing titles fall back to curriculum-data, then lessonId.
 */
export function getCurriculumLessonLabel(
  locale: SupportedLocale,
  lessonId: string,
): string {
  if (locale !== "ar-EG") {
    const overlay = LESSON_TITLES_BY_LOCALE[locale]?.[lessonId]?.trim();
    if (overlay) return overlay;
  }
  return canonicalLessonTitle(lessonId);
}
