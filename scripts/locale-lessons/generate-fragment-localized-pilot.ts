import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedPilotManifest,
} from "../../src/lib/locale-lessons/types.ts";
import { ADAPTATION_TARGET_LOCALES } from "../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  listLessonJsonIds,
  loadMsaLessonPackage,
  manifestPathForLocale,
  readJsonFile,
  validateMsaSourcePackage,
} from "./lib/source-package.ts";
import {
  clampPilotLessonCount,
  DEFAULT_PILOT_LESSON_COUNT,
  selectPilotLessonIds,
} from "./lib/pilot-lesson-ids.ts";
import { runFragmentLocalizationPipelineWithOpenAi } from "./lib/fragment-localization-pipeline.ts";
import {
  buildFragmentPilotReport,
  type FragmentPilotLessonResult,
} from "./lib/fragment-pilot-report.ts";
import {
  writeFragmentPilotLessonPackages,
  writeFragmentPilotManifest,
  writeFragmentPilotReport,
} from "./lib/fragment-output-writer.ts";
import { validateFragmentPipelineArtifact } from "./lib/validate-structural-parity.ts";
import {
  openAiAdaptationModel,
  requireOpenAiApiKey,
} from "./providers/types.ts";
import type { OpenAiFragmentAdapterOptions } from "./lib/openai-fragment-adapter.ts";

export interface FragmentPilotGenerationSummary {
  targetLocale: AdaptationTargetLocale;
  provider: "openai-fragment";
  model: string;
  generatedCount: number;
  lessonIds: string[];
  mode: "pilot";
  pipeline: "fragment";
  allValid: boolean;
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
    throw new Error("Only --mode pilot is supported for fragment pilot generation");
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

export async function generateFragmentPilotPackage(
  targetLocale: AdaptationTargetLocale,
  count = DEFAULT_PILOT_LESSON_COUNT,
  openAiOptions: OpenAiFragmentAdapterOptions = {},
): Promise<FragmentPilotGenerationSummary> {
  requireOpenAiApiKey();

  const sourceValidation = await validateMsaSourcePackage();
  if (!sourceValidation.ok) {
    throw new Error(
      `Arabic Fusha source invalid:\n${sourceValidation.errors.join("\n")}`,
    );
  }

  const pilotLessonIds = await selectPilotLessonIds(count);
  const model = openAiOptions.model ?? openAiAdaptationModel();
  const generatedAt = new Date().toISOString();
  const packages: AdaptedLessonPackage[] = [];
  const lessonResults: FragmentPilotLessonResult[] = [];
  const validationErrors: string[] = [];

  for (const lessonId of pilotLessonIds) {
    const source = await loadMsaLessonPackage(lessonId);
    const result = await runFragmentLocalizationPipelineWithOpenAi(
      source,
      targetLocale,
      openAiOptions,
      generatedAt,
    );

    packages.push(result.artifact);
    lessonResults.push({
      lessonId,
      fieldCount: result.textMap.fields.length,
      validation: result.validation,
    });

    if (!result.validation.ok) {
      for (const error of result.validation.errors) {
        validationErrors.push(`${lessonId}: ${error}`);
      }
    } else {
      console.log(`  generated ${targetLocale} fragment pilot: ${lessonId}`);
    }
  }

  if (validationErrors.length > 0) {
    throw new Error(
      `Fragment pilot validation failed for ${targetLocale}:\n${validationErrors.join("\n")}`,
    );
  }

  await writeFragmentPilotLessonPackages({ targetLocale, packages });
  await writeFragmentPilotManifest({
    targetLocale,
    generatedAt,
    pilotLessonIds,
    packages,
    providerModel: model,
  });

  const report = buildFragmentPilotReport({
    targetLocale,
    providerModel: model,
    generatedAt,
    pilotLessonIds,
    lessonResults,
  });
  await writeFragmentPilotReport(targetLocale, report);

  return {
    targetLocale,
    provider: "openai-fragment",
    model,
    generatedCount: packages.length,
    lessonIds: report.lessonIds,
    mode: "pilot",
    pipeline: "fragment",
    allValid: report.allValid,
  };
}

export async function validateFragmentPilotTargetPackage(
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
      errors.push("manifest packageStatus must be pilot");
    }
    if (manifest.mode !== "pilot") {
      errors.push("manifest mode must be pilot");
    }
    if (!manifest.incomplete) {
      errors.push("manifest must mark incomplete: true");
    }
    if (manifest.pipeline !== "fragment") {
      errors.push("manifest pipeline must be fragment");
    }
    if (manifest.provider !== "openai-fragment") {
      errors.push("manifest provider must be openai-fragment");
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

  for (const lessonId of pilotLessonIds) {
    const source = await loadMsaLessonPackage(lessonId);
    const adapted = await readJsonFile<AdaptedLessonPackage>(
      path.join(lessonsDir, `${lessonId}.json`),
    );
    const validation = validateFragmentPipelineArtifact(source, adapted, locale);
    if (!validation.ok) {
      for (const error of validation.errors) {
        errors.push(`${lessonId}: ${error}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    count: foundIds.length,
    expectedCount,
  };
}

async function main() {
  const mode = parseMode();
  const count = parseCount();
  const target = parseTarget();

  console.log(
    `Generating fragment pilot batch (${mode}, count=${count}) for ${target === "all" ? ADAPTATION_TARGET_LOCALES.join(", ") : target}`,
  );

  const targets =
    target === "all" ? [...ADAPTATION_TARGET_LOCALES] : [target];

  for (const locale of targets) {
    console.log(`\nTarget: ${locale}`);
    const report = await generateFragmentPilotPackage(locale, count);
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
