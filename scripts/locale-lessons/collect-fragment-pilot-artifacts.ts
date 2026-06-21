import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
} from "../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  loadMsaLessonPackage,
  readJsonFile,
} from "./lib/source-package.ts";
import {
  buildFragmentPilotReport,
  type FragmentPilotLessonResult,
} from "./lib/fragment-pilot-report.ts";
import {
  writeFragmentPilotLessonPackages,
  writeFragmentPilotManifest,
  writeFragmentPilotReport,
} from "./lib/fragment-output-writer.ts";
import {
  localesForTarget,
  parseLessonIdsArg,
  resolveFragmentPilotLessonIds,
} from "./lib/resolve-fragment-pilot-lesson-ids.ts";
import {
  readFragmentPilotJobResult,
  type FragmentPilotJobResult,
} from "./lib/fragment-pilot-job-result.ts";
import { validateFragmentPipelineArtifact } from "./lib/validate-structural-parity.ts";
import {
  clampPilotLessonCount,
  DEFAULT_PILOT_LESSON_COUNT,
} from "./lib/pilot-lesson-ids.ts";
import { openAiAdaptationModel } from "./providers/types.ts";

export interface FragmentPilotCollectSummary {
  target: AdaptationTargetLocale | "all";
  generatedAt: string;
  passed: string[];
  failed: string[];
  missing: string[];
  ok: boolean;
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

function parseCount(): number {
  const raw = readArg("count");
  if (raw === null) return DEFAULT_PILOT_LESSON_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid --count value: ${raw}`);
  }
  return clampPilotLessonCount(parsed);
}

async function listJsonFiles(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files.filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
}

async function loadLocalLessonPackage(
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<AdaptedLessonPackage | null> {
  try {
    return await readJsonFile<AdaptedLessonPackage>(
      path.join(lessonsDirForLocale(locale), `${lessonId}.json`),
    );
  } catch {
    return null;
  }
}

async function importLessonFromArtifacts(
  artifactsDir: string,
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<AdaptedLessonPackage | null> {
  const candidates = [
    path.join(artifactsDir, locale, "lessons", `${lessonId}.json`),
    path.join(
      artifactsDir,
      `locale-fragment-pilot-${locale}-${lessonId}`,
      locale,
      "lessons",
      `${lessonId}.json`,
    ),
    path.join(artifactsDir, "lessons", `${lessonId}.json`),
  ];

  for (const candidate of candidates) {
    try {
      return await readJsonFile<AdaptedLessonPackage>(candidate);
    } catch {
      continue;
    }
  }

  const lessonsDir = path.join(artifactsDir, locale, "lessons");
  const files = await listJsonFiles(lessonsDir);
  const match = files.find((file) => file.replace(/\.json$/, "") === lessonId);
  if (match) {
    return readJsonFile<AdaptedLessonPackage>(path.join(lessonsDir, match));
  }

  return null;
}

export async function collectFragmentPilotArtifacts(input: {
  target: AdaptationTargetLocale | "all";
  count: number;
  lessonIdsOverride?: string[];
  artifactsDir?: string;
  generatedAt?: string;
}): Promise<FragmentPilotCollectSummary> {
  const artifactsDir = input.artifactsDir ?? readArg("artifacts-dir") ?? "fragment-artifacts";
  const locales = localesForTarget(input.target);
  const pilotLessonIds = await resolveFragmentPilotLessonIds({
    count: input.count,
    lessonIdsOverride: input.lessonIdsOverride,
  });
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const passed: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];

  for (const locale of locales) {
    const packages: AdaptedLessonPackage[] = [];
    const lessonResults: FragmentPilotLessonResult[] = [];

    for (const lessonId of pilotLessonIds) {
      const key = `${locale}/${lessonId}`;
      const jobResult = await readFragmentPilotJobResult(locale, lessonId);
      let artifact =
        (await loadLocalLessonPackage(locale, lessonId)) ??
        (await importLessonFromArtifacts(artifactsDir, locale, lessonId));

      if (!artifact) {
        missing.push(key);
        continue;
      }

      const source = await loadMsaLessonPackage(lessonId);
      const validation = validateFragmentPipelineArtifact(source, artifact, locale);
      lessonResults.push({
        lessonId,
        fieldCount: jobResult?.fieldCount ?? 0,
        validation,
      });

      if (jobResult && !jobResult.ok) {
        failed.push(key);
        continue;
      }

      if (!validation.ok) {
        failed.push(key);
        continue;
      }

      await writeFragmentPilotLessonPackage(locale, artifact);
      packages.push(artifact);
      passed.push(key);
    }

    if (packages.length === pilotLessonIds.length) {
      await writeFragmentPilotManifest({
        targetLocale: locale,
        generatedAt,
        pilotLessonIds,
        packages,
        providerModel: openAiAdaptationModel(),
      });
      const report = buildFragmentPilotReport({
        targetLocale: locale,
        providerModel: openAiAdaptationModel(),
        generatedAt,
        pilotLessonIds,
        lessonResults,
      });
      await writeFragmentPilotReport(locale, report);
    }
  }

  const expectedTotal = locales.length * pilotLessonIds.length;
  const ok =
    passed.length === expectedTotal && failed.length === 0 && missing.length === 0;

  return {
    target: input.target,
    generatedAt,
    passed,
    failed,
    missing,
    ok,
  };
}

async function main() {
  const summary = await collectFragmentPilotArtifacts({
    target: parseTarget(),
    count: parseCount(),
    lessonIdsOverride: parseLessonIdsArg(readArg("lesson_ids")),
  });

  console.log(
    `Fragment pilot collect: passed=${summary.passed.length} failed=${summary.failed.length} missing=${summary.missing.length}`,
  );

  if (summary.failed.length > 0) {
    console.error("Failed lessons:");
    for (const item of summary.failed) console.error(`  - ${item}`);
  }
  if (summary.missing.length > 0) {
    console.error("Missing lessons:");
    for (const item of summary.missing) console.error(`  - ${item}`);
  }

  if (!summary.ok) {
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
