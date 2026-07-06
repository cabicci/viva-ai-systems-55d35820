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
  buildPhase13BFullMatrix,
  buildPhase13BWorkflowShardMatrix,
  parsePhase13BRetryCellsArg,
  requiresPaidApiForLocale,
  serializeGitHubActionsMatrix,
} from "../../../scripts/locale-lessons/lib/phase13b-full-matrix.ts";
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
    expect(shards).toHaveLength(3);
    expect(shards.length).toBeLessThan(PHASE13B_GITHUB_MATRIX_JOB_LIMIT);

    const parsed = JSON.parse(serializeGitHubActionsMatrix(shards)) as {
      include: Array<{ locale: string; source_scope: string }>;
    };
    expect(parsed.include).toHaveLength(3);
    expect(() => structuredClone(parsed)).not.toThrow();
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
  async function writeDryRunJobArtifact(
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

  it("succeeds when all planned dry-run artifacts are present", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonIds = [SAMPLE_LESSON_ID, "intro-m1-l2-first-prompt"];
    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      for (const lessonId of lessonIds) {
        await writeDryRunJobArtifact(root, locale, lessonId);
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
