import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedPilotManifest,
} from "../../../src/lib/locale-lessons/types.ts";
import { REQUIRED_LESSON_COUNT } from "../../../src/lib/locale-lessons/types.ts";
import { SAMPLE_LESSON_IDS } from "./sample-lesson-ids.ts";
import {
  lessonsDirForLocale,
  manifestPathForLocale,
  packageDirForLocale,
} from "./source-package.ts";
import type { FragmentPilotGenerationReport } from "./fragment-pilot-report.ts";

export function reportsDirForLocale(locale: string): string {
  return path.join(packageDirForLocale(locale), "reports");
}

export function fragmentPilotReportPathForLocale(locale: string): string {
  return path.join(reportsDirForLocale(locale), "fragment-pilot-report.json");
}

export async function writeFragmentPilotLessonPackage(
  targetLocale: AdaptationTargetLocale,
  pkg: AdaptedLessonPackage,
): Promise<string> {
  const lessonsDir = lessonsDirForLocale(targetLocale);
  await fs.mkdir(lessonsDir, { recursive: true });
  const outPath = path.join(lessonsDir, `${pkg.lessonId}.json`);
  await fs.writeFile(outPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  return outPath;
}

export async function writeFragmentPilotLessonPackages(input: {
  targetLocale: AdaptationTargetLocale;
  packages: AdaptedLessonPackage[];
}): Promise<void> {
  for (const pkg of input.packages) {
    await writeFragmentPilotLessonPackage(input.targetLocale, pkg);
  }
}

export async function writeFragmentPilotManifest(input: {
  targetLocale: AdaptationTargetLocale;
  generatedAt: string;
  pilotLessonIds: string[];
  packages: AdaptedLessonPackage[];
  providerModel: string;
}): Promise<LocalizedPilotManifest> {
  const manifest: LocalizedPilotManifest = {
    locale: input.targetLocale,
    packageStatus: "pilot",
    mode: "pilot",
    incomplete: true,
    pipeline: "fragment",
    sourceLocale: "ar-MSA",
    generatedAt: input.generatedAt,
    lessonCount: input.packages.length,
    requiredLessonCount: REQUIRED_LESSON_COUNT,
    sampleLessonIds: [...SAMPLE_LESSON_IDS],
    pilotLessonIds: input.pilotLessonIds,
    lessonIds: input.packages.map((pkg) => pkg.lessonId).sort(),
    provider: "openai-fragment",
    providerModel: input.providerModel,
  };

  await fs.writeFile(
    manifestPathForLocale(input.targetLocale),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return manifest;
}

export async function writeFragmentPilotReport(
  targetLocale: AdaptationTargetLocale,
  report: FragmentPilotGenerationReport,
): Promise<string> {
  const reportsDir = reportsDirForLocale(targetLocale);
  await fs.mkdir(reportsDir, { recursive: true });
  const reportPath = fragmentPilotReportPathForLocale(targetLocale);
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}
