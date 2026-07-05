import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import {
  PACKAGE_LOCALES,
  activeCurriculumLessonIds,
  type ValidatorResult,
} from "./localization-contract-rules.ts";
import { manifestPathForLocale, readJsonFile } from "./source-package.ts";

interface ManifestShape {
  lessonIds?: string[];
}

export async function validateManifestCurriculumSync(
  locales: readonly LessonPackageLocale[] = PACKAGE_LOCALES,
): Promise<ValidatorResult> {
  const errors: string[] = [];
  const expected = [...activeCurriculumLessonIds()].sort();
  const expectedSet = new Set(expected);

  for (const locale of locales) {
    const manifestPath = manifestPathForLocale(locale);
    const manifest = await readJsonFile<ManifestShape>(manifestPath);
    const manifestIds = [...(manifest.lessonIds ?? [])].sort();
    const manifestSet = new Set(manifestIds);

    const missing = expected.filter((id) => !manifestSet.has(id));
    const extra = manifestIds.filter((id) => !expectedSet.has(id));

    if (manifestIds.length !== expected.length) {
      errors.push(
        `${locale} manifest count ${manifestIds.length} != curriculum ${expected.length}`,
      );
    }
    if (missing.length) {
      errors.push(
        `${locale} manifest missing ${missing.length} ID(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`,
      );
    }
    if (extra.length) {
      errors.push(
        `${locale} manifest has ${extra.length} extra ID(s): ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? "…" : ""}`,
      );
    }
  }

  return {
    name: "manifest-curriculum-sync",
    ok: errors.length === 0,
    errors,
    warnings: [],
  };
}
