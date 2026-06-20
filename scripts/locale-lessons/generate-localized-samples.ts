import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedSampleManifest,
} from "../../src/lib/locale-lessons/types.ts";
import { REQUIRED_LESSON_COUNT } from "../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  listLessonJsonIds,
  loadMsaLessonPackage,
  manifestPathForLocale,
  readJsonFile,
  validateMsaSourcePackage,
} from "./lib/source-package.ts";
import { validateAdaptedLessonWarnings } from "./lib/quality-warnings.ts";
import type { AdaptedLessonPackage } from "../../src/lib/locale-lessons/types.ts";
import {
  SAMPLE_LESSON_COUNT,
  SAMPLE_LESSON_IDS,
} from "./lib/sample-lesson-ids.ts";
import { createAnthropicAdaptationProvider } from "./providers/anthropic-adaptation.ts";
import { requireAnthropicApiKey } from "./providers/types.ts";

export interface SampleGenerationReport {
  targetLocale: AdaptationTargetLocale;
  provider: string;
  model: string;
  generatedCount: number;
  lessonIds: string[];
}

export async function generateSamplePackage(
  targetLocale: AdaptationTargetLocale,
): Promise<SampleGenerationReport> {
  requireAnthropicApiKey();

  const sourceValidation = await validateMsaSourcePackage();
  if (!sourceValidation.ok) {
    throw new Error(
      `Arabic Fusha source invalid:\n${sourceValidation.errors.join("\n")}`,
    );
  }

  const provider = createAnthropicAdaptationProvider();
  const lessonsDir = lessonsDirForLocale(targetLocale);
  await fs.mkdir(lessonsDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const packages: AdaptedLessonPackage[] = [];

  for (const lessonId of SAMPLE_LESSON_IDS) {
    const source = await loadMsaLessonPackage(lessonId);
    const adapted = await provider.adaptLesson({ source, targetLocale });
    const outPath = path.join(lessonsDir, `${lessonId}.json`);
    await fs.writeFile(outPath, `${JSON.stringify(adapted, null, 2)}\n`, "utf8");
    packages.push(adapted);
    console.log(`  generated ${targetLocale} sample: ${lessonId}`);
  }

  const manifest: LocalizedSampleManifest = {
    locale: targetLocale,
    packageStatus: "sample",
    incomplete: true,
    sourceLocale: "ar-MSA",
    generatedAt,
    lessonCount: packages.length,
    requiredLessonCount: REQUIRED_LESSON_COUNT,
    sampleLessonIds: [...SAMPLE_LESSON_IDS],
    lessonIds: packages.map((pkg) => pkg.lessonId).sort(),
    provider: provider.name,
    providerModel: provider.model,
  };

  await fs.writeFile(
    manifestPathForLocale(targetLocale),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return {
    targetLocale,
    provider: provider.name,
    model: provider.model,
    generatedCount: packages.length,
    lessonIds: manifest.lessonIds,
  };
}

export async function validateSampleTargetPackage(
  locale: AdaptationTargetLocale,
): Promise<{ ok: boolean; errors: string[]; count: number }> {
  const lessonsDir = lessonsDirForLocale(locale);
  const foundIds = await listLessonJsonIds(lessonsDir);
  const errors: string[] = [];

  if (foundIds.length !== SAMPLE_LESSON_COUNT) {
    errors.push(
      `expected ${SAMPLE_LESSON_COUNT} sample lessons, found ${foundIds.length}`,
    );
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
    for (const warning of validateAdaptedLessonWarnings(source, adapted, locale)) {
      warnings.push(`${locale}/${lessonId}: ${warning}`);
    }
  }

  return warnings;
}

async function main() {
  requireAnthropicApiKey();
  console.log(
    `Generating ${SAMPLE_LESSON_COUNT} contextual samples per target (${SAMPLE_LESSON_IDS.join(", ")})`,
  );

  for (const target of ["ar-Gulf", "en"] as const) {
    console.log(`\nTarget: ${target}`);
    const report = await generateSamplePackage(target);
    console.log(
      `  done: ${report.generatedCount} lessons via ${report.provider}/${report.model}`,
    );
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
