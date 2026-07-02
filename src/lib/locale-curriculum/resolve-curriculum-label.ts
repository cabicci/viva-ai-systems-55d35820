import { getPath, type PathId } from "@/lib/curriculum-data";
import type { SupportedLocale } from "@/lib/locale/types";
import arEGLabels from "./ar-EG/labels.json";
import arMSALabels from "./ar-MSA/labels.json";
import arGulfLabels from "./ar-Gulf/labels.json";
import enLabels from "./en/labels.json";
import type { CurriculumPathLabelField, LocaleCurriculumLabelsFile } from "./types";

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
