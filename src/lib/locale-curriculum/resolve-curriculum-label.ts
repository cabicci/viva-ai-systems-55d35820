import { getPath, PATHS, type PathId } from "@/lib/curriculum-data";
import type { SupportedLocale } from "@/lib/locale/types";
import arEGLabels from "./ar-EG/labels.json";
import arMSALabels from "./ar-MSA/labels.json";
import arGulfLabels from "./ar-Gulf/labels.json";
import enLabels from "./en/labels.json";
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
