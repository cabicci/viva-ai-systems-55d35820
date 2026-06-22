import type {
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { alignEnglishCatalogTitle } from "./quality-warnings.ts";

/** Align EN catalog title to canonical titleEn after fragment injection. */
export function repairEnglishCatalogTitle(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  if (adapted.locale !== "en") return adapted;

  const canonicalTitleEn = source.titleEn?.trim();
  if (!canonicalTitleEn) return adapted;

  return alignEnglishCatalogTitle(source, {
    ...adapted,
    titleEn: canonicalTitleEn,
  });
}
