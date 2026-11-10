import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedPilotManifest,
} from "../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  listLessonJsonIds,
  loadMsaLessonPackage,
  manifestPathForLocale,
  readJsonFile,
} from "./lib/source-package.ts";
import { collectLearnerTextQualityViolations } from "./lib/quality-warnings.ts";

export async function validatePilotTargetPackage(
  locale: AdaptationTargetLocale,
  options?: {
    manifestPath?: string;
    lessonsDir?: string;
  },
): Promise<{ ok: boolean; errors: string[]; count: number; expectedCount: number }> {
  const lessonsDir = options?.lessonsDir ?? lessonsDirForLocale(locale);
  const manifestFile = options?.manifestPath ?? manifestPathForLocale(locale);
  const foundIds = await listLessonJsonIds(lessonsDir);
  const errors: string[] = [];
  let expectedCount = 0;
  let pilotLessonIds: string[] = [];

  try {
    const manifest = await readJsonFile<LocalizedPilotManifest>(manifestFile);
    if (manifest.packageStatus !== "pilot") {
      errors.push(`manifest packageStatus must be pilot`);
    }
    if (manifest.mode !== "pilot") {
      errors.push(`manifest mode must be pilot`);
    }
    if (!manifest.incomplete) {
      errors.push(`manifest must mark incomplete: true`);
    }
    expectedCount = manifest.pilotLessonIds.length;
    pilotLessonIds = manifest.pilotLessonIds;

    if (manifest.lessonCount !== expectedCount) {
      errors.push(`manifest lessonCount must be ${expectedCount}, got ${manifest.lessonCount}`);
    }
  } catch {
    errors.push(`missing or invalid manifest.json for ${locale}`);
    return { ok: false, errors, count: foundIds.length, expectedCount };
  }

  if (foundIds.length !== expectedCount) {
    errors.push(`expected ${expectedCount} pilot lessons, found ${foundIds.length}`);
  }

  for (const id of pilotLessonIds) {
    if (!foundIds.includes(id)) {
      errors.push(`missing pilot lesson: ${id}`);
    }
  }

  const extra = foundIds.filter((id) => !pilotLessonIds.includes(id));
  if (extra.length > 0) {
    errors.push(`unexpected extra pilot lessons: ${extra.join(", ")}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    count: foundIds.length,
    expectedCount,
  };
}

export async function collectPilotPackageWarnings(
  locale: AdaptationTargetLocale,
): Promise<string[]> {
  const manifest = await readJsonFile<LocalizedPilotManifest>(manifestPathForLocale(locale));
  const warnings: string[] = [];

  for (const lessonId of manifest.pilotLessonIds) {
    const source = await loadMsaLessonPackage(lessonId);
    const adapted = await readJsonFile<AdaptedLessonPackage>(
      path.join(lessonsDirForLocale(locale), `${lessonId}.json`),
    );
    warnings.push(
      ...collectLearnerTextQualityViolations(source, adapted, locale, `${locale}/${lessonId}`),
    );
  }

  return warnings;
}
