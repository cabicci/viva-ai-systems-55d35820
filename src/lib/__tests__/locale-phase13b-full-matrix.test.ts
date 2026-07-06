import { describe, expect, it } from "vitest";
import { deriveArMsaLearnerFinalPackage } from "../../../scripts/locale-lessons/lib/derive-ar-msa-learner-final.ts";
import {
  FULL_LESSON_COUNT,
  selectFullLessonIds,
} from "../../../scripts/locale-lessons/lib/full-lesson-ids.ts";
import {
  PHASE13B_FULL_CELL_COUNT,
  buildPhase13BFullMatrix,
  parsePhase13BRetryCellsArg,
  requiresPaidApiForLocale,
} from "../../../scripts/locale-lessons/lib/phase13b-full-matrix.ts";
import {
  AR_MSA_CANONICAL_LESSONS_DIR,
  arMsaLearnerFinalLessonsDir,
  isCanonicalArMsaLessonsPath,
  learnerFinalLessonsDirForLocale,
} from "../../../scripts/locale-lessons/lib/phase13b-output-paths.ts";
import { runPhase13BFullCell } from "../../../scripts/locale-lessons/run-phase13b-full-cell.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";

const SAMPLE_LESSON_ID = "intro-m1-l1-what-is-ai";

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
});
