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
import {
  fragmentPilotJobResultPath,
  fragmentPilotJobResultPathLegacy,
  readFragmentPilotJobResult,
  type FragmentPilotJobResult,
} from "./lib/fragment-pilot-job-result.ts";
import { packageDirForLocale } from "./lib/source-package.ts";
import {
  buildPhase13ArtifactIndex,
  lookupIndexedJobResult,
  lookupIndexedLessonArtifact,
  type Phase13ArtifactIndex,
} from "./lib/phase13-artifact-index.ts";

export interface Phase13PilotCellReport {
  locale: AdaptationTargetLocale;
  lessonId: string;
  status: "generated" | "failed" | "skipped" | "dry-run-ok";
  errors: string[];
  artifactPath?: string;
  jobResultPath?: string;
  /** Path to the result JSON as found (artifact download or workspace). */
  jobResultSourcePath?: string;
  /** Relative path within the artifacts download root, when applicable. */
  artifactRelativePath?: string;
  /** GitHub artifact directory name when the result came from a download. */
  artifactSource?: string;
}

export interface Phase13PilotFailedCellDetail {
  locale: AdaptationTargetLocale;
  lessonId: string;
  status: "failed" | "skipped";
  errors: string[];
  jobResultSourcePath?: string;
  artifactSource?: string;
}

export interface Phase13PilotRetryCell {
  locale: AdaptationTargetLocale;
  lessonId: string;
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
  /** `locale/lessonId` keys that should be retried. */
  retryLessonIds: string[];
  retryCells: Phase13PilotRetryCell[];
  failedCellDetails: Phase13PilotFailedCellDetail[];
  artifactNaming: string;
  artifactsDir?: string;
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

async function resolveJobResult(
  locale: AdaptationTargetLocale,
  lessonId: string,
  artifactIndex: Phase13ArtifactIndex | null,
): Promise<{
  job: FragmentPilotJobResult;
  jobResultPath: string;
  jobResultSourcePath: string;
  artifactSource?: string;
} | null> {
  const indexed = lookupIndexedJobResult(artifactIndex, locale, lessonId);
  if (indexed) {
    return {
      job: indexed.result,
      jobResultPath: indexed.filePath,
      jobResultSourcePath: indexed.filePath,
      artifactSource: indexed.artifactSource,
    };
  }

  const workspace = await readFragmentPilotJobResult(locale, lessonId);
  if (!workspace) return null;

  let workspacePath = fragmentPilotJobResultPath(locale, lessonId);
  try {
    await fs.access(workspacePath);
  } catch {
    workspacePath = fragmentPilotJobResultPathLegacy(locale, lessonId);
  }

  return {
    job: workspace,
    jobResultPath: workspacePath,
    jobResultSourcePath: workspacePath,
  };
}

async function resolveLessonArtifactPath(
  locale: AdaptationTargetLocale,
  lessonId: string,
  artifactIndex: Phase13ArtifactIndex | null,
): Promise<{
  filePath: string;
  relativePath?: string;
  artifactSource?: string;
} | null> {
  const indexed = lookupIndexedLessonArtifact(artifactIndex, locale, lessonId);
  if (indexed) {
    return {
      filePath: indexed.filePath,
      relativePath: indexed.relativePath,
      artifactSource: indexed.artifactSource,
    };
  }

  const workspacePath = path.join(
    packageDirForLocale(locale),
    "lessons",
    `${lessonId}.json`,
  );
  try {
    await fs.access(workspacePath);
    return { filePath: workspacePath };
  } catch {
    return null;
  }
}

function buildRetryFields(cells: Phase13PilotCellReport[]): {
  retryLessonIds: string[];
  retryCells: Phase13PilotRetryCell[];
  failedCellDetails: Phase13PilotFailedCellDetail[];
} {
  const retryCells = cells
    .filter((cell) => cell.status === "failed" || cell.status === "skipped")
    .map((cell) => ({ locale: cell.locale, lessonId: cell.lessonId }));

  const retryLessonIds = retryCells.map(
    (cell) => `${cell.locale}/${cell.lessonId}`,
  );

  const failedCellDetails = cells
    .filter((cell) => cell.status === "failed" || cell.status === "skipped")
    .map((cell) => ({
      locale: cell.locale,
      lessonId: cell.lessonId,
      status: cell.status as "failed" | "skipped",
      errors: cell.errors,
      jobResultSourcePath: cell.jobResultSourcePath,
      artifactSource: cell.artifactSource,
    }));

  return { retryLessonIds, retryCells, failedCellDetails };
}

/** Collector exits 0 when the report is usable — partial cell failures are retryable. */
export function phase13CollectReportExitCode(
  _report: Phase13PilotCollectReport,
): number {
  return 0;
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

  const artifactIndex = input.artifactsDir
    ? await buildPhase13ArtifactIndex(input.artifactsDir)
    : null;

  const generated: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  const validationErrors: string[] = [];
  const cells: Phase13PilotCellReport[] = [];

  for (const cell of matrix) {
    const key = `${cell.locale}/${cell.lesson_id}`;
    const resolved = await resolveJobResult(
      cell.locale,
      cell.lesson_id,
      artifactIndex,
    );
    const lessonArtifact = await resolveLessonArtifactPath(
      cell.locale,
      cell.lesson_id,
      artifactIndex,
    );

    if (!resolved) {
      skipped.push(key);
      cells.push({
        locale: cell.locale,
        lessonId: cell.lesson_id,
        status: "skipped",
        errors: ["missing job result"],
        artifactPath: lessonArtifact?.filePath,
        artifactRelativePath: lessonArtifact?.relativePath,
        artifactSource: lessonArtifact?.artifactSource,
      });
      continue;
    }

    const { job, jobResultPath, jobResultSourcePath, artifactSource } = resolved;

    if (job.ok) {
      const status = input.dryRun ? "dry-run-ok" : "generated";
      if (input.dryRun) {
        generated.push(key);
      } else if (lessonArtifact) {
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
        artifactPath: lessonArtifact?.filePath,
        artifactRelativePath: lessonArtifact?.relativePath,
        jobResultPath,
        jobResultSourcePath,
        artifactSource,
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
        artifactPath: lessonArtifact?.filePath,
        artifactRelativePath: lessonArtifact?.relativePath,
        jobResultPath,
        jobResultSourcePath,
        artifactSource,
      });
    }
  }

  const { retryLessonIds, retryCells, failedCellDetails } = buildRetryFields(cells);

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
    retryLessonIds,
    retryCells,
    failedCellDetails,
    artifactNaming: "locale-phase13a-pilot-{locale}-{lessonId}",
    artifactsDir: input.artifactsDir ?? undefined,
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
    `generated=${report.generated.length} failed=${report.failed.length} skipped=${report.skipped.length} retry=${report.retryLessonIds.length}`,
  );

  if (report.retryLessonIds.length > 0) {
    console.warn(
      `Retryable cells (${report.retryLessonIds.length}): ${report.retryLessonIds.join(", ")}`,
    );
  }

  process.exit(phase13CollectReportExitCode(report));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
