import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedSampleManifest,
} from "../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  listLessonJsonIds,
  loadMsaLessonPackage,
  manifestPathForLocale,
  readJsonFile,
} from "./lib/source-package.ts";
import { validateSanitizedAdaptedLessonWarnings } from "./lib/quality-warnings.ts";

import { SAMPLE_LESSON_COUNT, SAMPLE_LESSON_IDS } from "./lib/sample-lesson-ids.ts";

export async function validateSampleTargetPackage(
  locale: AdaptationTargetLocale,
): Promise<{ ok: boolean; errors: string[]; count: number }> {
  const lessonsDir = lessonsDirForLocale(locale);
  const foundIds = await listLessonJsonIds(lessonsDir);
  const errors: string[] = [];

  if (foundIds.length !== SAMPLE_LESSON_COUNT) {
    errors.push(`expected ${SAMPLE_LESSON_COUNT} sample lessons, found ${foundIds.length}`);
  }

  for (const id of SAMPLE_LESSON_IDS) {
    if (!foundIds.includes(id)) {
      errors.push(`missing sample lesson: ${id}`);
    }
  }

  const extra = foundIds.filter(
    (id) => !SAMPLE_LESSON_IDS.includes(id as (typeof SAMPLE_LESSON_IDS)[number]),
  );
  if (extra.length > 0) {
    errors.push(`unexpected extra sample lessons: ${extra.join(", ")}`);
  }

  try {
    const manifest = JSON.parse(
      await fs.readFile(manifestPathForLocale(locale), "utf8"),
    ) as LocalizedSampleManifest;
    if (manifest.packageStatus !== "sample") {
      errors.push(`manifest packageStatus must be sample`);
    }
    if (!manifest.incomplete) {
      errors.push(`manifest must mark incomplete: true`);
    }
    if (manifest.lessonCount !== SAMPLE_LESSON_COUNT) {
      errors.push(
        `manifest lessonCount must be ${SAMPLE_LESSON_COUNT}, got ${manifest.lessonCount}`,
      );
    }
  } catch {
    errors.push(`missing or invalid manifest.json for ${locale}`);
  }

  return { ok: errors.length === 0, errors, count: foundIds.length };
}

export async function collectSamplePackageWarnings(
  locale: AdaptationTargetLocale,
): Promise<string[]> {
  const warnings: string[] = [];

  for (const lessonId of SAMPLE_LESSON_IDS) {
    const source = await loadMsaLessonPackage(lessonId);
    const adapted = await readJsonFile<AdaptedLessonPackage>(
      path.join(lessonsDirForLocale(locale), `${lessonId}.json`),
    );
    for (const warning of validateSanitizedAdaptedLessonWarnings(source, adapted, locale)) {
      warnings.push(`${locale}/${lessonId}: ${warning}`);
    }
  }

  return warnings;
}
