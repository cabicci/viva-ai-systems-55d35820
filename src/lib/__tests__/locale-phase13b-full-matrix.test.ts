import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildPhase13BFullCollectReport,
  phase13BCollectReportExitCode,
} from "../../../scripts/locale-lessons/collect-phase13b-full-report.ts";
import { deriveArMsaLearnerFinalPackage } from "../../../scripts/locale-lessons/lib/derive-ar-msa-learner-final.ts";
import {
  FULL_LESSON_COUNT,
  selectFullLessonIds,
} from "../../../scripts/locale-lessons/lib/full-lesson-ids.ts";
import {
  PHASE13B_FULL_CELL_COUNT,
  PHASE13B_GITHUB_MATRIX_JOB_LIMIT,
  PHASE13B_SHARD_SIZE,
  buildPhase13BFullMatrix,
  buildPhase13BWorkflowShardMatrix,
  chunkLessonIds,
  formatPhase13BShardIndex,
  parsePhase13BRetryCellsArg,
  parseShardLessonIdsArg,
  phase13BShardArtifactName,
  requiresPaidApiForLocale,
  serializeGitHubActionsMatrix,
} from "../../../scripts/locale-lessons/lib/phase13b-full-matrix.ts";
import {
  finalMergeTargetPathForLocale,
  isPhase13BGeneratedPackagePath,
  phase13BGeneratedPackagePath,
} from "../../../scripts/locale-lessons/lib/phase13b-generated-packages.ts";
import {
  AR_MSA_CANONICAL_LESSONS_DIR,
  arMsaLearnerFinalLessonsDir,
  isCanonicalArMsaLessonsPath,
  learnerFinalLessonsDirForLocale,
} from "../../../scripts/locale-lessons/lib/phase13b-output-paths.ts";
import { runPhase13BFullCell } from "../../../scripts/locale-lessons/run-phase13b-full-cell.ts";
import { runPhase13BLocaleBatch } from "../../../scripts/locale-lessons/run-phase13b-locale-batch.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";
import { readPhase13BJobResult } from "../../../scripts/locale-lessons/lib/phase13b-job-result.ts";
import {
  buildPhase13BArtifactIndex,
  parsePhase13BBatchArtifactDirName,
  parsePhase13BShardArtifactDirName,
} from "../../../scripts/locale-lessons/lib/phase13b-artifact-index.ts";

const SAMPLE_LESSON_ID = "intro-m1-l1-what-is-ai";
const tempDirs: string[] = [];
const writtenJobResults: string[] = [];

afterEach(async () => {
  await Promise.all(
    writtenJobResults.splice(0).map((filePath) => rm(filePath, { force: true })),
  );
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeTempArtifactsRoot(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "phase13b-artifacts-"));
  tempDirs.push(dir);
  return dir;
}

describe("Phase 13B full-scale matrix", () => {
  it("plans 300 cells for 100 lessons × 3 locales", async () => {
    const matrix = await buildPhase13BFullMatrix({});
    expect(matrix).toHaveLength(PHASE13B_FULL_CELL_COUNT);
    expect(PHASE13B_FULL_CELL_COUNT).toBe(FULL_LESSON_COUNT * 3);

    const locales = new Set(matrix.map((cell) => cell.locale));
    expect(locales).toEqual(new Set(["ar-MSA", "ar-Gulf", "en"]));

    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      const cells = matrix.filter((cell) => cell.locale === locale);
      expect(cells).toHaveLength(FULL_LESSON_COUNT);
      expect(new Set(cells.map((cell) => cell.lesson_id)).size).toBe(
        FULL_LESSON_COUNT,
      );
    }

    const lessonIds = await selectFullLessonIds();
    expect(lessonIds).toHaveLength(FULL_LESSON_COUNT);
  });

  it("marks ar-MSA cells as deterministic learner-final derived", async () => {
    const matrix = await buildPhase13BFullMatrix({});
    const msaCell = matrix.find(
      (cell) => cell.locale === "ar-MSA" && cell.lesson_id === SAMPLE_LESSON_ID,
    );
    expect(msaCell?.pipeline).toBe("learner-final-derived");
    expect(msaCell?.requires_paid_api).toBe(false);
    expect(requiresPaidApiForLocale("ar-MSA")).toBe(false);
  });

  it("marks ar-Gulf/en cells as paid-adaptation gated", async () => {
    const matrix = await buildPhase13BFullMatrix({});
    for (const locale of ["ar-Gulf", "en"] as const) {
      const cell = matrix.find(
        (entry) => entry.locale === locale && entry.lesson_id === SAMPLE_LESSON_ID,
      );
      expect(cell?.pipeline).toBe("fragment-adapt");
      expect(cell?.requires_paid_api).toBe(true);
      expect(requiresPaidApiForLocale(locale)).toBe(true);
    }
  });

  it("parses retry-only-failed locale/lesson pairs", () => {
    const retryCells = parsePhase13BRetryCellsArg(
      "ar-MSA/intro-m1-l1-what-is-ai,en/builder-m6-l1-idea-to-page",
    );
    expect(retryCells).toEqual([
      expect.objectContaining({
        locale: "ar-MSA",
        lesson_id: "intro-m1-l1-what-is-ai",
        pipeline: "learner-final-derived",
        requires_paid_api: false,
      }),
      expect.objectContaining({
        locale: "en",
        lesson_id: "builder-m6-l1-idea-to-page",
        pipeline: "fragment-adapt",
        requires_paid_api: true,
      }),
    ]);
  });

  it("uses separate ar-MSA learner-final output path from canonical source", () => {
    expect(arMsaLearnerFinalLessonsDir()).not.toBe(AR_MSA_CANONICAL_LESSONS_DIR);
    expect(learnerFinalLessonsDirForLocale("ar-MSA")).toBe(
      arMsaLearnerFinalLessonsDir(),
    );
    expect(isCanonicalArMsaLessonsPath(`${AR_MSA_CANONICAL_LESSONS_DIR}/x.json`)).toBe(
      true,
    );
    expect(
      isCanonicalArMsaLessonsPath(`${arMsaLearnerFinalLessonsDir()}/x.json`),
    ).toBe(false);
  });

  it("builds a GitHub-consumable workflow shard matrix under the 256 job limit", async () => {
    const shards = await buildPhase13BWorkflowShardMatrix({});
    expect(shards).toHaveLength(30);
    expect(shards.length).toBeLessThan(PHASE13B_GITHUB_MATRIX_JOB_LIMIT);

    for (const shard of shards) {
      const lessonIds = parseShardLessonIdsArg(shard.lesson_ids);
      expect(lessonIds.length).toBeGreaterThan(0);
      expect(lessonIds.length).toBeLessThanOrEqual(PHASE13B_SHARD_SIZE);
      expect(shard.shard_index).toMatch(/^\d{2}$/);
      expect(shard.source_scope).toBe("ar-MSA");
      expect(phase13BShardArtifactName(shard.locale, shard.shard_index)).toBe(
        `locale-phase13b-shard-${shard.locale}-${shard.shard_index}`,
      );
    }

    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      const localeShards = shards.filter((shard) => shard.locale === locale);
      expect(localeShards).toHaveLength(FULL_LESSON_COUNT / PHASE13B_SHARD_SIZE);
    }

    const parsed = JSON.parse(serializeGitHubActionsMatrix(shards)) as {
      include: Array<{
        locale: string;
        source_scope: string;
        shard_index: string;
        lesson_ids: string;
      }>;
    };
    expect(parsed.include).toHaveLength(30);
    expect(() => structuredClone(parsed)).not.toThrow();
  });

  it("chunks lesson IDs into shards of at most 10", () => {
    const ids = Array.from({ length: 25 }, (_, index) => `lesson-${index}`);
    const chunks = chunkLessonIds(ids, PHASE13B_SHARD_SIZE);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(10);
    expect(chunks[1]).toHaveLength(10);
    expect(chunks[2]).toHaveLength(5);
    expect(formatPhase13BShardIndex(9)).toBe("09");
  });

  it("builds retry-only shards without unaffected locale shards", async () => {
    const retryCells = parsePhase13BRetryCellsArg(
      "ar-MSA/intro-m1-l1-what-is-ai,en/builder-m6-l1-idea-to-page",
    );
    const shards = await buildPhase13BWorkflowShardMatrix({ retryCells });
    expect(shards).toHaveLength(2);
    expect(shards.map((shard) => shard.locale).sort()).toEqual(["ar-MSA", "en"]);
    for (const shard of shards) {
      expect(parseShardLessonIdsArg(shard.lesson_ids)).toHaveLength(1);
    }
  });
});

describe("Phase 13B cell runner (dry-run, no paid API)", () => {
  it("derives ar-MSA learner-final deterministically without paid API", async () => {
    const sourceBefore = await loadMsaLessonPackage(SAMPLE_LESSON_ID);
    const summary = await runPhase13BFullCell({
      locale: "ar-MSA",
      lessonId: SAMPLE_LESSON_ID,
      dryRun: true,
      confirmPaidApi: false,
      confirmWrite: false,
      writeJobResult: false,
    });

    expect(summary.requiresPaidApi).toBe(false);
    expect(summary.skippedPaidApi).toBe(true);
    expect(summary.pipeline).toBe("learner-final-derived");
    expect(summary.ok).toBe(true);
    expect(summary.wrotePackage).toBe(false);

    const sourceAfter = await loadMsaLessonPackage(SAMPLE_LESSON_ID);
    expect(sourceAfter).toEqual(sourceBefore);
    expect(
      sourceAfter.sections.some((section) => section.role.includes("Video block")),
    ).toBe(true);
  });

  it("keeps ar-Gulf/en cells paid-adaptation gated in dry-run", async () => {
    for (const locale of ["ar-Gulf", "en"] as const) {
      const summary = await runPhase13BFullCell({
        locale,
        lessonId: SAMPLE_LESSON_ID,
        dryRun: true,
        confirmPaidApi: false,
        confirmWrite: false,
        writeJobResult: false,
      });

      expect(summary.requiresPaidApi).toBe(true);
      expect(summary.skippedPaidApi).toBe(true);
      expect(summary.pipeline).toBe("fragment-adapt");
      expect(summary.wrotePackage).toBe(false);
    }
  });

  it("derives sanitized learner-final ar-MSA from canonical source in memory", async () => {
    const source = await loadMsaLessonPackage(SAMPLE_LESSON_ID);
    const { pkg, errors } = deriveArMsaLearnerFinalPackage(structuredClone(source));

    expect(errors).toEqual([]);
    expect(pkg.title).toBe(source.title);
    expect(
      pkg.sections.some((section) => section.role.includes("Video block")),
    ).toBe(false);
    expect(
      source.sections.some((section) => section.role.includes("Video block")),
    ).toBe(true);
  });

  it("locale batch dry-run writes per-cell job results without paid APIs", async () => {
    const lessonIds = [SAMPLE_LESSON_ID, "intro-m1-l2-first-prompt"];
    const summary = await runPhase13BLocaleBatch({
      locale: "ar-MSA",
      lessonIds,
      dryRun: true,
      confirmPaidApi: false,
      confirmWrite: false,
    });

    expect(summary.cellCount).toBe(2);
    expect(summary.okCount).toBe(2);
    expect(summary.failedCount).toBe(0);
    expect(summary.dryRun).toBe(true);

    for (const lessonId of lessonIds) {
      const job = await readPhase13BJobResult("ar-MSA", lessonId);
      expect(job?.ok).toBe(true);
      expect(job?.skippedPaidApi).toBe(true);
      writtenJobResults.push(
        path.join(
          process.cwd(),
          "src/lib/locale-lessons/ar-MSA/reports/phase13b-full-jobs/ar-MSA",
          `${lessonId}.result.json`,
        ),
      );
    }
  });
});

describe("Phase 13B collector dry-run", () => {
  async function writeNestedDryRunJobArtifact(
    root: string,
    locale: "ar-MSA" | "en" | "ar-Gulf",
    lessonId: string,
  ): Promise<void> {
    const jobsDir = path.join(
      root,
      `locale-phase13b-batch-${locale}`,
      "src",
      "lib",
      "locale-lessons",
      "ar-MSA",
      "reports",
      "phase13b-full-jobs",
      locale,
    );
    await mkdir(jobsDir, { recursive: true });
    await writeFile(
      path.join(jobsDir, `${lessonId}.result.json`),
      `${JSON.stringify({
        locale,
        lessonId,
        ok: true,
        pipeline: locale === "ar-MSA" ? "learner-final-derived" : "fragment-adapt",
        requiresPaidApi: locale !== "ar-MSA",
        fieldCount: locale === "ar-MSA" ? 0 : 12,
        errors: [],
        generatedAt: "2026-07-07T00:00:00.000Z",
        mode: "dry-run-derived",
        skippedPaidApi: true,
      })}\n`,
      "utf8",
    );
  }

  async function writeFlatBatchDryRunJobArtifact(
    root: string,
    locale: "ar-MSA" | "en" | "ar-Gulf",
    lessonId: string,
  ): Promise<void> {
    const batchDir = path.join(root, `locale-phase13b-batch-${locale}`);
    await mkdir(batchDir, { recursive: true });
    await writeFile(
      path.join(batchDir, `${lessonId}.result.json`),
      `${JSON.stringify({
        locale,
        lessonId,
        ok: true,
        pipeline: locale === "ar-MSA" ? "learner-final-derived" : "fragment-adapt",
        requiresPaidApi: locale !== "ar-MSA",
        fieldCount: locale === "ar-MSA" ? 0 : 12,
        errors: [],
        generatedAt: "2026-07-07T00:00:00.000Z",
        mode: "dry-run-derived",
        skippedPaidApi: true,
      })}\n`,
      "utf8",
    );
  }

  it("parses locale from locale-phase13b-batch and shard artifact folder names", () => {
    expect(parsePhase13BBatchArtifactDirName("locale-phase13b-batch-ar-MSA")).toEqual({
      locale: "ar-MSA",
    });
    expect(parsePhase13BBatchArtifactDirName("locale-phase13b-batch-ar-Gulf")).toEqual({
      locale: "ar-Gulf",
    });
    expect(parsePhase13BShardArtifactDirName("locale-phase13b-shard-ar-MSA-00")).toEqual({
      locale: "ar-MSA",
      shardIndex: "00",
    });
    expect(parsePhase13BShardArtifactDirName("locale-phase13b-shard-en-09")).toEqual({
      locale: "en",
      shardIndex: "09",
    });
  });

  it("collects flat root-level batch artifact result files", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonIds = [SAMPLE_LESSON_ID, "intro-m1-l2-first-prompt"];
    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      for (const lessonId of lessonIds) {
        await writeFlatBatchDryRunJobArtifact(root, locale, lessonId);
      }
    }

    const matrix = await buildPhase13BFullMatrix({
      targetLocales: ["ar-MSA", "ar-Gulf", "en"],
      lessonIdsOverride: lessonIds,
    });

    const report = await buildPhase13BFullCollectReport({
      target: "all",
      dryRun: true,
      artifactsDir: root,
      matrix,
    });

    expect(report.planned).toBe(6);
    expect(report.dryRunOk).toBe(6);
    expect(report.skipped).toEqual([]);
    expect(phase13BCollectReportExitCode(report)).toBe(0);
  });

  it("succeeds when all planned dry-run artifacts use nested job paths", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonIds = [SAMPLE_LESSON_ID, "intro-m1-l2-first-prompt"];
    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      for (const lessonId of lessonIds) {
        await writeNestedDryRunJobArtifact(root, locale, lessonId);
      }
    }

    const matrix = await buildPhase13BFullMatrix({
      targetLocales: ["ar-MSA", "ar-Gulf", "en"],
      lessonIdsOverride: lessonIds,
    });

    const report = await buildPhase13BFullCollectReport({
      target: "all",
      dryRun: true,
      artifactsDir: root,
      matrix,
    });

    expect(report.planned).toBe(6);
    expect(report.dryRunOk).toBe(6);
    expect(report.failed).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.retryCells).toEqual([]);
    expect(phase13BCollectReportExitCode(report)).toBe(0);
  });

  it("aggregates flat batch artifacts for full 300-cell dry-run plan", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonIds = await selectFullLessonIds();

    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      const batchDir = path.join(root, `locale-phase13b-batch-${locale}`);
      await mkdir(batchDir, { recursive: true });
      for (const lessonId of lessonIds) {
        await writeFile(
          path.join(batchDir, `${lessonId}.result.json`),
          `${JSON.stringify({
            locale,
            lessonId,
            ok: true,
            pipeline: locale === "ar-MSA" ? "learner-final-derived" : "fragment-adapt",
            requiresPaidApi: locale !== "ar-MSA",
            fieldCount: locale === "ar-MSA" ? 0 : 12,
            errors: [],
            generatedAt: "2026-07-07T00:00:00.000Z",
            mode: "dry-run-derived",
            skippedPaidApi: true,
          })}\n`,
          "utf8",
        );
      }
    }

    const report = await buildPhase13BFullCollectReport({
      target: "all",
      dryRun: true,
      artifactsDir: root,
    });

    expect(report.planned).toBe(PHASE13B_FULL_CELL_COUNT);
    expect(report.dryRunOk).toBe(PHASE13B_FULL_CELL_COUNT);
    expect(report.failed).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.retryCells).toEqual([]);
    expect(phase13BCollectReportExitCode(report)).toBe(0);
  });

  it("fails clearly when dry-run artifacts are missing", async () => {
    const matrix = await buildPhase13BFullMatrix({
      targetLocales: ["ar-MSA"],
      lessonIdsOverride: [SAMPLE_LESSON_ID],
    });

    const report = await buildPhase13BFullCollectReport({
      target: ["ar-MSA"],
      dryRun: true,
      artifactsDir: await makeTempArtifactsRoot(),
      matrix,
    });

    expect(report.planned).toBe(1);
    expect(report.dryRunOk).toBe(0);
    expect(report.skipped).toEqual(["ar-MSA/intro-m1-l1-what-is-ai"]);
    expect(phase13BCollectReportExitCode(report)).toBe(1);
  });
});

describe("Phase 13B generated package staging", () => {
  it("maps ar-MSA generated packages to staging, not canonical source", () => {
    const staging = phase13BGeneratedPackagePath("ar-MSA", SAMPLE_LESSON_ID);
    const mergeTarget = finalMergeTargetPathForLocale("ar-MSA", SAMPLE_LESSON_ID);
    const normalizedStaging = staging.split(path.sep).join("/");
    const normalizedMerge = mergeTarget.split(path.sep).join("/");
    expect(isPhase13BGeneratedPackagePath(staging)).toBe(true);
    expect(isCanonicalArMsaLessonsPath(staging)).toBe(false);
    expect(normalizedStaging).toContain("/reports/phase13b-generated-packages/ar-MSA/");
    expect(normalizedMerge).toContain("/generated/learner-final/lessons/");
    expect(mergeTarget).not.toBe(staging);
  });

  it("maps en/ar-Gulf generated packages to staging, not shipped lesson dirs", () => {
    for (const locale of ["ar-Gulf", "en"] as const) {
      const staging = phase13BGeneratedPackagePath(locale, SAMPLE_LESSON_ID);
      const mergeTarget = finalMergeTargetPathForLocale(locale, SAMPLE_LESSON_ID);
      const normalizedStaging = staging.split(path.sep).join("/");
      const normalizedMerge = mergeTarget.split(path.sep).join("/");
      expect(isPhase13BGeneratedPackagePath(staging)).toBe(true);
      expect(normalizedStaging).toContain(
        `/reports/phase13b-generated-packages/${locale}/`,
      );
      expect(normalizedMerge).toContain(`/locale-lessons/${locale}/lessons/`);
      expect(mergeTarget).not.toBe(staging);
    }
  });

  it("does not index pre-existing repo lesson JSON from checkout", async () => {
    const root = await makeTempArtifactsRoot();
    const repoLessonPath = path.join(
      root,
      "src/lib/locale-lessons/en/lessons",
      `${SAMPLE_LESSON_ID}.json`,
    );
    await mkdir(path.dirname(repoLessonPath), { recursive: true });
    await writeFile(repoLessonPath, '{"lessonId":"intro-m1-l1-what-is-ai"}\n', "utf8");

    const index = await buildPhase13BArtifactIndex(root);
    expect(index.lessonArtifacts.size).toBe(0);
  });
});

describe("Phase 13B collector paid run", () => {
  async function writePaidJobAndPackage(
    root: string,
    locale: "ar-MSA" | "en" | "ar-Gulf",
    lessonId: string,
    options?: { includePackage?: boolean },
  ): Promise<void> {
    const shardDir = path.join(root, `locale-phase13b-shard-${locale}-00`);
    const jobsDir = path.join(
      shardDir,
      "src/lib/locale-lessons/ar-MSA/reports/phase13b-full-jobs",
      locale,
    );
    const packagesDir = path.join(
      shardDir,
      "src/lib/locale-lessons/ar-MSA/reports/phase13b-generated-packages",
      locale,
    );
    await mkdir(jobsDir, { recursive: true });
    await writeFile(
      path.join(jobsDir, `${lessonId}.result.json`),
      `${JSON.stringify({
        locale,
        lessonId,
        ok: true,
        pipeline: locale === "ar-MSA" ? "learner-final-derived" : "fragment-adapt",
        requiresPaidApi: locale !== "ar-MSA",
        fieldCount: locale === "ar-MSA" ? 0 : 12,
        errors: [],
        generatedAt: "2026-07-07T00:00:00.000Z",
        mode: locale === "ar-MSA" ? "learner-final-write" : "openai-fragment",
        skippedPaidApi: false,
      })}\n`,
      "utf8",
    );
    if (options?.includePackage !== false) {
      await mkdir(packagesDir, { recursive: true });
      await writeFile(
        path.join(packagesDir, `${lessonId}.json`),
        `${JSON.stringify({ lessonId, locale, title: "test" })}\n`,
        "utf8",
      );
    }
  }

  it("fails paid collect when job result is ok but package JSON is missing", async () => {
    const root = await makeTempArtifactsRoot();
    await writePaidJobAndPackage(root, "ar-MSA", SAMPLE_LESSON_ID, {
      includePackage: false,
    });

    const matrix = await buildPhase13BFullMatrix({
      targetLocales: ["ar-MSA"],
      lessonIdsOverride: [SAMPLE_LESSON_ID],
    });

    const report = await buildPhase13BFullCollectReport({
      target: ["ar-MSA"],
      dryRun: false,
      artifactsDir: root,
      matrix,
    });

    expect(report.planned).toBe(1);
    expect(report.lessonJsonPresent).toBe(0);
    expect(report.generated).toEqual([]);
    expect(report.failed).toEqual(["ar-MSA/intro-m1-l1-what-is-ai"]);
    expect(report.retryCells).toEqual([
      { locale: "ar-MSA", lessonId: SAMPLE_LESSON_ID },
    ]);
    expect(phase13BCollectReportExitCode(report)).toBe(1);
  });

  it("succeeds paid collect when job result and package JSON both exist", async () => {
    const root = await makeTempArtifactsRoot();
    await writePaidJobAndPackage(root, "en", SAMPLE_LESSON_ID);

    const matrix = await buildPhase13BFullMatrix({
      targetLocales: ["en"],
      lessonIdsOverride: [SAMPLE_LESSON_ID],
    });

    const report = await buildPhase13BFullCollectReport({
      target: ["en"],
      dryRun: false,
      artifactsDir: root,
      matrix,
    });

    expect(report.planned).toBe(1);
    expect(report.lessonJsonPresent).toBe(1);
    expect(report.generated).toEqual(["en/intro-m1-l1-what-is-ai"]);
    expect(report.failed).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.retryCells).toEqual([]);
    expect(phase13BCollectReportExitCode(report)).toBe(0);
  });
});
