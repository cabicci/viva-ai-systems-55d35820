import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedPilotManifest,
} from "../../src/lib/locale-lessons/types.ts";
import { ADAPTATION_TARGET_LOCALES, REQUIRED_LESSON_COUNT } from "../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  listLessonJsonIds,
  loadMsaLessonPackage,
  manifestPathForLocale,
  readJsonFile,
  validateMsaSourcePackage,
} from "./lib/source-package.ts";
import { collectLearnerTextQualityViolations } from "./lib/quality-warnings.ts";
import {
  clampPilotLessonCount,
  DEFAULT_PILOT_LESSON_COUNT,
  selectPilotLessonIds,
} from "./lib/pilot-lesson-ids.ts";
import { SAMPLE_LESSON_IDS } from "./lib/sample-lesson-ids.ts";
import { createOpenAiAdaptationProvider } from "./providers/openai-adaptation.ts";
import { requireOpenAiApiKey } from "./providers/types.ts";

export interface PilotGenerationReport {
  targetLocale: AdaptationTargetLocale;
  provider: string;
  model: string;
  generatedCount: number;
  lessonIds: string[];
  mode: "pilot";
}

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseTarget(): AdaptationTargetLocale | "all" {
  const target = readArg("target");
  if (!target || target === "all") return "all";
  if (target === "ar-Gulf" || target === "en") return target;
  throw new Error("Usage: --target ar-Gulf|en|all");
}

function parseMode(): "pilot" {
  const mode = readArg("mode") ?? "pilot";
  if (mode !== "pilot") {
    throw new Error('Only --mode pilot is supported for localized pilot generation');
  }
  return mode;
}

function parseCount(): number {
  const raw = readArg("count");
  if (raw === null) return DEFAULT_PILOT_LESSON_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid --count value: ${raw}`);
  }
  return clampPilotLessonCount(parsed);
}

export async function generatePilotPackage(
  targetLocale: AdaptationTargetLocale,
  count = DEFAULT_PILOT_LESSON_COUNT,
): Promise<PilotGenerationReport> {
  requireOpenAiApiKey();

  const sourceValidation = await validateMsaSourcePackage();
  if (!sourceValidation.ok) {
    throw new Error(
      `Arabic Fusha source invalid:\n${sourceValidation.errors.join("\n")}`,
    );
  }

  const pilotLessonIds = await selectPilotLessonIds(count);
  const provider = createOpenAiAdaptationProvider();
  const lessonsDir = lessonsDirForLocale(targetLocale);
  await fs.mkdir(lessonsDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const packages: AdaptedLessonPackage[] = [];

  for (const lessonId of pilotLessonIds) {
    const source = await loadMsaLessonPackage(lessonId);
    const adapted = await provider.adaptLesson({ source, targetLocale });
    const outPath = path.join(lessonsDir, `${lessonId}.json`);
    await fs.writeFile(outPath, `${JSON.stringify(adapted, null, 2)}\n`, "utf8");
    packages.push(adapted);
    console.log(`  generated ${targetLocale} pilot: ${lessonId}`);
  }

  const manifest: LocalizedPilotManifest = {
    locale: targetLocale,
    packageStatus: "pilot",
    mode: "pilot",
    incomplete: true,
    sourceLocale: "ar-MSA",
    generatedAt,
    lessonCount: packages.length,
    requiredLessonCount: REQUIRED_LESSON_COUNT,
    sampleLessonIds: [...SAMPLE_LESSON_IDS],
    pilotLessonIds,
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
    mode: "pilot",
  };
}

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
    const manifest = await readJsonFile<LocalizedPilotManifest>(
      manifestFile,
    );
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
      errors.push(
        `manifest lessonCount must be ${expectedCount}, got ${manifest.lessonCount}`,
      );
    }
  } catch {
    errors.push(`missing or invalid manifest.json for ${locale}`);
    return { ok: false, errors, count: foundIds.length, expectedCount };
  }

  if (foundIds.length !== expectedCount) {
    errors.push(
      `expected ${expectedCount} pilot lessons, found ${foundIds.length}`,
    );
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
  const manifest = await readJsonFile<LocalizedPilotManifest>(
    manifestPathForLocale(locale),
  );
  const warnings: string[] = [];

  for (const lessonId of manifest.pilotLessonIds) {
    const source = await loadMsaLessonPackage(lessonId);
    const adapted = await readJsonFile<AdaptedLessonPackage>(
      path.join(lessonsDirForLocale(locale), `${lessonId}.json`),
    );
    warnings.push(
      ...collectLearnerTextQualityViolations(
        source,
        adapted,
        locale,
        `${locale}/${lessonId}`,
      ),
    );
  }

  return warnings;
}

async function main() {
  const mode = parseMode();
  const count = parseCount();
  const target = parseTarget();

  console.log(
    `Generating pilot batch (${mode}, count=${count}) for ${target === "all" ? ADAPTATION_TARGET_LOCALES.join(", ") : target}`,
  );

  const targets =
    target === "all" ? [...ADAPTATION_TARGET_LOCALES] : [target];

  for (const locale of targets) {
    console.log(`\nTarget: ${locale}`);
    const report = await generatePilotPackage(locale, count);
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
