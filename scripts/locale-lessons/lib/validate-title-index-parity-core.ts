import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import {
  ARABIC_LETTER,
  FORBIDDEN_GENERIC_TITLES,
  PACKAGE_LOCALES,
  activeCurriculumLessonIds,
  type ValidatorResult,
} from "./localization-contract-rules.ts";
import { lessonTitlesIndexPath } from "./lesson-title-index.ts";
import { packageDirForLocale } from "./source-package.ts";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function validateTitleIndexParity(
  locales: readonly LessonPackageLocale[] = PACKAGE_LOCALES,
): Promise<ValidatorResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const expected = [...activeCurriculumLessonIds()].sort();
  const expectedSet = new Set(expected);

  for (const locale of locales) {
    const baseDir = packageDirForLocale(locale);
    const indexPath = lessonTitlesIndexPath(locale);
    const index = await readJson<Record<string, string>>(indexPath);
    const indexIds = Object.keys(index).sort();

    const missing = expected.filter((id) => !(id in index));
    const extra = indexIds.filter((id) => !expectedSet.has(id));
    if (missing.length) {
      errors.push(`${locale} lesson-titles.json missing ${missing.length} ID(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`);
    }
    if (extra.length) {
      errors.push(`${locale} lesson-titles.json has ${extra.length} extra ID(s): ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? "…" : ""}`);
    }

    const titles = new Map<string, string>();
    for (const lessonId of expected) {
      const indexTitle = index[lessonId]?.trim() ?? "";
      if (!indexTitle) {
        errors.push(`${locale} ${lessonId}: empty title in lesson-titles.json`);
        continue;
      }
      if (FORBIDDEN_GENERIC_TITLES.has(indexTitle)) {
        errors.push(`${locale} ${lessonId}: forbidden generic title "${indexTitle}"`);
      }
      if (locale === "en" && ARABIC_LETTER.test(indexTitle)) {
        errors.push(`${locale} ${lessonId}: English index title contains Arabic letters`);
      }
      if (titles.has(indexTitle)) {
        errors.push(`${locale} ${lessonId}: duplicate title "${indexTitle}" (also ${titles.get(indexTitle)})`);
      } else {
        titles.set(indexTitle, lessonId);
      }

      const packagePath = path.join(baseDir, "lessons", `${lessonId}.json`);
      try {
        const pkg = await readJson<{ title?: string }>(packagePath);
        const packageTitle = pkg.title?.trim() ?? "";
        if (!packageTitle) {
          errors.push(`${locale} ${lessonId}: empty title in package JSON`);
        } else if (packageTitle !== indexTitle) {
          errors.push(
            `${locale} ${lessonId}: package title "${packageTitle}" != index "${indexTitle}"`,
          );
        }
      } catch {
        errors.push(`${locale} ${lessonId}: missing package JSON at ${path.relative(REPO_ROOT, packagePath)}`);
      }
    }
  }

  return {
    name: "title-index-parity",
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
