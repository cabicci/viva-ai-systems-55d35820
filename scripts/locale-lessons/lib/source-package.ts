import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  LocalizedLessonManifest,
  LocalizedLessonPackage,
  LocalizedPackageValidationResult,
} from "../../../src/lib/locale-lessons/types.ts";
import { REQUIRED_LESSON_COUNT } from "../../../src/lib/locale-lessons/types.ts";
import { ARCHIVED_LESSON_ID_SET } from "../../../src/lib/archived-lessons.ts";
import { activeLessonIds } from "./active-lesson-ids.ts";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

export const MSA_PACKAGE_DIR = path.join(REPO_ROOT, "src/lib/locale-lessons/ar-MSA");
export const MSA_MANIFEST_PATH = path.join(MSA_PACKAGE_DIR, "manifest.json");
export const MSA_LESSONS_DIR = path.join(MSA_PACKAGE_DIR, "lessons");

export function packageDirForLocale(locale: string): string {
  return path.join(REPO_ROOT, "src/lib/locale-lessons", locale);
}

export function lessonsDirForLocale(locale: string): string {
  return path.join(packageDirForLocale(locale), "lessons");
}

export function manifestPathForLocale(locale: string): string {
  return path.join(packageDirForLocale(locale), "manifest.json");
}

export function adaptationPlanPathForLocale(locale: string): string {
  return path.join(packageDirForLocale(locale), "adaptation-plan.json");
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function loadMsaManifest(): Promise<LocalizedLessonManifest> {
  return readJsonFile<LocalizedLessonManifest>(MSA_MANIFEST_PATH);
}

export async function loadMsaLessonPackage(
  lessonId: string,
): Promise<LocalizedLessonPackage> {
  return readJsonFile<LocalizedLessonPackage>(
    path.join(MSA_LESSONS_DIR, `${lessonId}.json`),
  );
}

export async function listLessonJsonIds(lessonsDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(lessonsDir);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""))
      .sort();
  } catch {
    return [];
  }
}

export function compareLessonIds(
  locale: LocalizedPackageValidationResult["locale"],
  foundIds: string[],
  expectedIds: string[] = activeLessonIds(),
): LocalizedPackageValidationResult {
  const expectedSet = new Set(expectedIds);
  const foundSet = new Set(foundIds);
  const missingIds = expectedIds.filter((id) => !foundSet.has(id));
  const extraIds = foundIds.filter((id) => !expectedSet.has(id));
  const archivedIncluded = foundIds.filter((id) => ARCHIVED_LESSON_ID_SET.has(id));

  const errors: string[] = [];
  if (foundIds.length !== REQUIRED_LESSON_COUNT) {
    errors.push(
      `expected ${REQUIRED_LESSON_COUNT} lessons, found ${foundIds.length}`,
    );
  }
  if (missingIds.length > 0) {
    errors.push(`missing lesson IDs: ${missingIds.join(", ")}`);
  }
  if (extraIds.length > 0) {
    errors.push(`extra lesson IDs: ${extraIds.join(", ")}`);
  }

  if (archivedIncluded.length > 0) {
    errors.push(`archived lesson IDs included: ${archivedIncluded.join(", ")}`);
  }

  return {
    ok:
      errors.length === 0 &&
      missingIds.length === 0 &&
      extraIds.length === 0 &&
      archivedIncluded.length === 0,
    locale,
    expectedLessonCount: REQUIRED_LESSON_COUNT,
    foundLessonCount: foundIds.length,
    missingIds,
    extraIds,
    archivedIncluded,
    errors,
  };
}

export async function validateMsaSourcePackage(): Promise<LocalizedPackageValidationResult> {
  const manifest = await loadMsaManifest();
  const lessonIds = await listLessonJsonIds(MSA_LESSONS_DIR);

  const base = compareLessonIds("ar-MSA", lessonIds, manifest.lessonIds);
  const errors = [...base.errors];

  if (manifest.locale !== "ar-MSA") {
    errors.push(`manifest locale must be ar-MSA, got ${manifest.locale}`);
  }
  if (manifest.lessonCount !== REQUIRED_LESSON_COUNT) {
    errors.push(
      `manifest lessonCount must be ${REQUIRED_LESSON_COUNT}, got ${manifest.lessonCount}`,
    );
  }

  return {
    ...base,
    errors,
    ok: errors.length === 0,
  };
}

export async function validateTargetPackage(
  locale: "ar-Gulf" | "en",
): Promise<LocalizedPackageValidationResult> {
  const lessonsDir = lessonsDirForLocale(locale);
  const lessonIds = await listLessonJsonIds(lessonsDir);
  const result = compareLessonIds(locale, lessonIds);

  if (result.foundLessonCount === 0) {
    return {
      ...result,
      ok: false,
      errors: [
        ...result.errors,
        `no generated lessons found at ${path.relative(REPO_ROOT, lessonsDir).replace(/\\/g, "/")}`,
        "target package is not valid until all 100 lesson files exist",
      ],
    };
  }

  if (!result.ok) {
    return {
      ...result,
      errors: [
        ...result.errors,
        "target package is not valid until all 100 lesson files exist with matching IDs",
      ],
    };
  }

  return result;
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
