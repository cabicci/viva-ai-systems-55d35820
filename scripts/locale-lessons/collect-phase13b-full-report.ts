import { promises as fs } from "node:fs";
import path from "node:path";
import type { LessonPackageLocale } from "../../src/lib/locale-lessons/types.ts";
import {
  buildPhase13BArtifactIndex,
} from "./lib/phase13b-artifact-index.ts";
import {
  lookupPhase13BJobResult,
  lookupPhase13BLessonArtifact,
  phase13BCellKey,
} from "./lib/phase13b-collect-helpers.ts";
import {
  buildPhase13BFullMatrix,
  localesFromPhase13BTarget,
  parseLessonIdsArg,
  parsePhase13BRetryCellsArg,
  parsePhase13BSourceScope,
  parsePhase13BTargetLocales,
  type Phase13BFullMatrixCell,
} from "./lib/phase13b-full-matrix.ts";
import {
  phase13BJobResultPath,
  readPhase13BJobResult,
  type Phase13BJobResult,
} from "./lib/phase13b-job-result.ts";
import { learnerFinalLessonsDirForLocale } from "./lib/phase13b-output-paths.ts";
import { selectFullLessonIds } from "./lib/full-lesson-ids.ts";

export interface Phase13BFullCellReport {
  locale: LessonPackageLocale;
  lessonId: string;
  pipeline: Phase13BJobResult["pipeline"];
  requiresPaidApi: boolean;
  status: "generated" | "failed" | "skipped" | "dry-run-ok";
  errors: string[];
  artifactPath?: string;
  jobResultPath?: string;
  jobResultSourcePath?: string;
  artifactRelativePath?: string;
  artifactSource?: string;
}

export interface Phase13BFullRetryCell {
  locale: LessonPackageLocale;
  lessonId: string;
}

export interface Phase13BFullFailedCellDetail {
  locale: LessonPackageLocale;
  lessonId: string;
  status: "failed" | "skipped";
  errors: string[];
  jobResultSourcePath?: string;
  artifactSource?: string;
}

export interface Phase13BFullCollectReport {
  phase: "13B";
  sourceScope: "ar-MSA";
  targetLocales: LessonPackageLocale[] | "all";
  fullLessonIds: string[];
  planned: number;
  cellCount: number;
  dryRun: boolean;
  dryRunOk: number;
  generated: string[];
  failed: string[];
  skipped: string[];
  cells: Phase13BFullCellReport[];
  validationErrors: string[];
  retryLessonIds: string[];
  retryCells: Phase13BFullRetryCell[];
  failedCellDetails: Phase13BFullFailedCellDetail[];
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

async function resolveJobResult(
  locale: LessonPackageLocale,
  lessonId: string,
  artifactIndex: Awaited<ReturnType<typeof buildPhase13BArtifactIndex>> | null,
): Promise<{
  job: Phase13BJobResult;
  jobResultPath: string;
  jobResultSourcePath: string;
  artifactSource?: string;
} | null> {
  const indexed = lookupPhase13BJobResult(artifactIndex, locale, lessonId);
  if (indexed) {
    return {
      job: indexed.result,
      jobResultPath: indexed.filePath,
      jobResultSourcePath: indexed.filePath,
      artifactSource: indexed.artifactSource,
    };
  }

  const workspace = await readPhase13BJobResult(locale, lessonId);
  if (!workspace) return null;

  return {
    job: workspace,
    jobResultPath: phase13BJobResultPath(locale, lessonId),
    jobResultSourcePath: phase13BJobResultPath(locale, lessonId),
  };
}

async function resolveLessonArtifactPath(
  locale: LessonPackageLocale,
  lessonId: string,
  artifactIndex: Awaited<ReturnType<typeof buildPhase13BArtifactIndex>> | null,
): Promise<{
  filePath: string;
  relativePath?: string;
  artifactSource?: string;
} | null> {
  const indexed = lookupPhase13BLessonArtifact(artifactIndex, locale, lessonId);
  if (indexed) {
    return {
      filePath: indexed.filePath,
      relativePath: indexed.relativePath,
      artifactSource: indexed.artifactSource,
    };
  }

  const workspacePath = path.join(
    learnerFinalLessonsDirForLocale(locale),
    `${lessonId}.json`,
  );
  try {
    await fs.access(workspacePath);
    return { filePath: workspacePath };
  } catch {
    return null;
  }
}

function buildRetryFields(cells: Phase13BFullCellReport[]): {
  retryLessonIds: string[];
  retryCells: Phase13BFullRetryCell[];
  failedCellDetails: Phase13BFullFailedCellDetail[];
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

export function countPhase13BDryRunOkCells(cells: Phase13BFullCellReport[]): number {
  return cells.filter((cell) => cell.status === "dry-run-ok").length;
}

export function phase13BCollectReportExitCode(report: Phase13BFullCollectReport): number {
  if (report.planned === 0) {
    return 1;
  }

  if (report.dryRun) {
    const dryRunOk = countPhase13BDryRunOkCells(report.cells);
    if (dryRunOk !== report.planned) return 1;
    if (report.failed.length > 0) return 1;
    if (report.skipped.length > 0) return 1;
    return 0;
  }

  if (report.failed.length > 0) return 1;
  return 0;
}

export async function buildPhase13BFullCollectReport(input: {
  sourceScope?: "ar-MSA";
  target: ReturnType<typeof parsePhase13BTargetLocales>;
  lessonIdsOverride?: string[];
  retryCells?: Phase13BFullMatrixCell[];
  dryRun: boolean;
  artifactsDir?: string | null;
  matrix?: Phase13BFullMatrixCell[];
}): Promise<Phase13BFullCollectReport> {
  const fullLessonIds = await selectFullLessonIds();
  const matrix =
    input.matrix ??
    (await buildPhase13BFullMatrix({
      sourceScope: input.sourceScope ?? "ar-MSA",
      targetLocales: localesFromPhase13BTarget(input.target),
      lessonIdsOverride: input.lessonIdsOverride,
      retryCells: input.retryCells,
    }));

  const artifactIndex = input.artifactsDir
    ? await buildPhase13BArtifactIndex(input.artifactsDir)
    : null;

  const cells: Phase13BFullCellReport[] = [];
  const generated: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  const validationErrors: string[] = [];

  for (const cell of matrix) {
    const key = phase13BCellKey(cell.locale, cell.lesson_id);
    const resolved = await resolveJobResult(cell.locale, cell.lesson_id, artifactIndex);

    if (!resolved) {
      skipped.push(key);
      cells.push({
        locale: cell.locale,
        lessonId: cell.lesson_id,
        pipeline: cell.pipeline,
        requiresPaidApi: cell.requires_paid_api,
        status: "skipped",
        errors: ["missing job result"],
      });
      continue;
    }

    const artifact = await resolveLessonArtifactPath(
      cell.locale,
      cell.lesson_id,
      artifactIndex,
    );

    let status: Phase13BFullCellReport["status"];
    if (input.dryRun) {
      status = resolved.job.ok ? "dry-run-ok" : "failed";
    } else if (resolved.job.ok && artifact) {
      status = "generated";
      generated.push(key);
    } else if (resolved.job.ok && !artifact) {
      status = "skipped";
      skipped.push(key);
    } else {
      status = "failed";
      failed.push(key);
    }

    if (!resolved.job.ok) {
      validationErrors.push(...resolved.job.errors.map((error) => `${key}: ${error}`));
    }

    cells.push({
      locale: cell.locale,
      lessonId: cell.lesson_id,
      pipeline: cell.pipeline,
      requiresPaidApi: cell.requires_paid_api,
      status,
      errors: resolved.job.errors,
      artifactPath: artifact?.filePath,
      jobResultPath: resolved.jobResultPath,
      jobResultSourcePath: resolved.jobResultSourcePath,
      artifactRelativePath: artifact?.relativePath,
      artifactSource: artifact?.artifactSource ?? resolved.artifactSource,
    });
  }

  const retry = buildRetryFields(cells);
  const dryRunOk = countPhase13BDryRunOkCells(cells);

  return {
    phase: "13B",
    sourceScope: "ar-MSA",
    targetLocales: input.target,
    fullLessonIds,
    planned: matrix.length,
    cellCount: matrix.length,
    dryRun: input.dryRun,
    dryRunOk,
    generated,
    failed,
    skipped,
    cells,
    validationErrors,
    ...retry,
    artifactNaming: "locale-phase13b-full-{locale}-{lessonId}",
    artifactsDir: input.artifactsDir ?? undefined,
    collectedAt: new Date().toISOString(),
  };
}

async function main() {
  const sourceScope = parsePhase13BSourceScope(readArg("source_scope"));
  const target = parsePhase13BTargetLocales(
    readArg("target_locales") ?? readArg("target"),
  );
  const dryRun = parseBool("dry_run", true);
  const artifactsDir = readArg("artifacts_dir") ?? readArg("artifacts-dir");
  const retryCells = parsePhase13BRetryCellsArg(
    readArg("retry_cells") ?? readArg("retry-cells"),
  );
  const lessonIdsOverride = parseLessonIdsArg(
    readArg("lesson_ids") ?? readArg("lesson-ids"),
  );

  const report = await buildPhase13BFullCollectReport({
    sourceScope,
    target,
    dryRun,
    artifactsDir,
    lessonIdsOverride,
    retryCells,
  });

  const outDir = path.resolve(
    readArg("out_dir") ?? "src/lib/locale-lessons/ar-MSA/reports",
  );
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "phase13b-full-report.json");
  await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify({
      ok: phase13BCollectReportExitCode(report) === 0,
      outPath,
      planned: report.planned,
      cellCount: report.cellCount,
      dryRunOk: report.dryRunOk,
      generated: report.generated.length,
      failed: report.failed.length,
      skipped: report.skipped.length,
      retryCells: report.retryCells,
    }),
  );

  process.exit(phase13BCollectReportExitCode(report));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
