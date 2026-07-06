import { promises as fs } from "node:fs";
import path from "node:path";
import type { AdaptationTargetLocale } from "../../src/lib/locale-lessons/types.ts";
import {
  buildPhase13PilotMatrix,
  parseLessonIdsArg,
  parsePhase13SourceScope,
  parsePhase13TargetLocales,
  type Phase13PilotMatrixCell,
} from "./lib/resolve-phase13-pilot-lesson-ids.ts";
import {
  clampPhase13PilotCount,
  pathsRepresented,
  PHASE13_DEFAULT_PILOT_COUNT,
  selectPhase13PilotLessonIds,
} from "./lib/phase13-pilot-manifest.ts";
import { readFragmentPilotJobResult } from "./lib/fragment-pilot-job-result.ts";
import { packageDirForLocale } from "./lib/source-package.ts";

export interface Phase13PilotCellReport {
  locale: AdaptationTargetLocale;
  lessonId: string;
  status: "generated" | "failed" | "skipped" | "dry-run-ok";
  errors: string[];
  artifactPath?: string;
  jobResultPath?: string;
}

export interface Phase13PilotCollectReport {
  phase: "13A";
  sourceScope: "ar-MSA";
  targetLocales: AdaptationTargetLocale[] | "all";
  pilotLessonIds: string[];
  pathsRepresented: string[];
  dryRun: boolean;
  generated: string[];
  failed: string[];
  skipped: string[];
  cells: Phase13PilotCellReport[];
  validationErrors: string[];
  artifactNaming: string;
  collectedAt: string;
}

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseBool(name: string, defaultValue: boolean): boolean {
  const raw = readArg(name);
  if (raw === null) return defaultValue;
  return raw === "true" || raw === "1";
}

function parseCount(): number {
  const raw = readArg("pilot_count") ?? readArg("count");
  if (raw === null) return PHASE13_DEFAULT_PILOT_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) throw new Error(`Invalid pilot_count: ${raw}`);
  return clampPhase13PilotCount(parsed);
}

async function findLessonArtifact(
  artifactsDir: string | null,
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<string | null> {
  const candidates = [
    artifactsDir
      ? path.join(
          artifactsDir,
          "src/lib/locale-lessons",
          locale,
          "lessons",
          `${lessonId}.json`,
        )
      : null,
    path.join(packageDirForLocale(locale), "lessons", `${lessonId}.json`),
  ].filter(Boolean) as string[];

  for (const filePath of candidates) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // continue
    }
  }
  return null;
}

export async function buildPhase13PilotCollectReport(input: {
  sourceScope: "ar-MSA";
  target: AdaptationTargetLocale | "all";
  count: number;
  lessonIdsOverride?: string[];
  dryRun: boolean;
  artifactsDir?: string | null;
  matrix?: Phase13PilotMatrixCell[];
}): Promise<Phase13PilotCollectReport> {
  const pilotLessonIds = await selectPhase13PilotLessonIds({
    count: input.count,
    lessonIdsOverride: input.lessonIdsOverride,
  });

  const matrix =
    input.matrix ??
    (await buildPhase13PilotMatrix({
      sourceScope: input.sourceScope,
      target: input.target,
      count: input.count,
      lessonIdsOverride: input.lessonIdsOverride,
    }));

  const generated: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  const validationErrors: string[] = [];
  const cells: Phase13PilotCellReport[] = [];

  for (const cell of matrix) {
    const key = `${cell.locale}/${cell.lesson_id}`;
    const job = await readFragmentPilotJobResult(cell.locale, cell.lesson_id);
    const artifactPath = await findLessonArtifact(
      input.artifactsDir ?? null,
      cell.locale,
      cell.lesson_id,
    );

    if (!job) {
      skipped.push(key);
      cells.push({
        locale: cell.locale,
        lessonId: cell.lesson_id,
        status: "skipped",
        errors: ["missing job result"],
      });
      continue;
    }

    const jobResultPath = path.join(
      packageDirForLocale(cell.locale),
      "reports",
      "fragment-pilot-jobs",
      `${cell.lesson_id}.result.json`,
    );

    if (job.ok) {
      const status = input.dryRun ? "dry-run-ok" : "generated";
      if (input.dryRun) {
        generated.push(key);
      } else if (artifactPath) {
        generated.push(key);
      } else {
        failed.push(key);
        validationErrors.push(`${key}: validation ok but lesson artifact missing`);
      }
      cells.push({
        locale: cell.locale,
        lessonId: cell.lesson_id,
        status,
        errors: [],
        artifactPath: artifactPath ?? undefined,
        jobResultPath,
      });
    } else {
      failed.push(key);
      for (const error of job.errors) {
        validationErrors.push(`${key}: ${error}`);
      }
      cells.push({
        locale: cell.locale,
        lessonId: cell.lesson_id,
        status: "failed",
        errors: job.errors,
        jobResultPath,
      });
    }
  }

  return {
    phase: "13A",
    sourceScope: input.sourceScope,
    targetLocales: input.target === "all" ? "all" : [input.target],
    pilotLessonIds,
    pathsRepresented: pathsRepresented(pilotLessonIds),
    dryRun: input.dryRun,
    generated,
    failed,
    skipped,
    cells,
    validationErrors,
    artifactNaming: "locale-phase13a-pilot-{locale}-{lessonId}",
    collectedAt: new Date().toISOString(),
  };
}

async function main() {
  const sourceScope = parsePhase13SourceScope(readArg("source_scope"));
  const target = parsePhase13TargetLocales(readArg("target_locales") ?? readArg("target"));
  const count = parseCount();
  const dryRun = parseBool("dry_run", true);
  const artifactsDir = readArg("artifacts-dir") ?? readArg("artifacts_dir");

  const report = await buildPhase13PilotCollectReport({
    sourceScope,
    target,
    count,
    lessonIdsOverride: parseLessonIdsArg(
      readArg("lesson_ids") ?? readArg("lesson-ids"),
    ),
    dryRun,
    artifactsDir,
  });

  const outDir = path.join(process.cwd(), "src/lib/locale-lessons/reports");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "phase13a-pilot-report.json");
  await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Phase 13A pilot report: ${outPath}`);
  console.log(
    `generated=${report.generated.length} failed=${report.failed.length} skipped=${report.skipped.length}`,
  );

  if (report.failed.length > 0 || report.validationErrors.length > 0) {
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
