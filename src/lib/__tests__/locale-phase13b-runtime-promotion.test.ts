import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateManifestCurriculumSync } from "../../../scripts/locale-lessons/lib/validate-manifest-curriculum-sync-core.ts";
import { validateTitleIndexParity } from "../../../scripts/locale-lessons/lib/validate-title-index-parity-core.ts";
import {
  buildEquivalenceChecksumReport,
  findStaleRuntimePackages,
  formatDeterministicJson,
  listPromotionCells,
  promoteRecoveredToRuntime,
  PROMOTION_RUNTIME_LOCALES,
  runtimeMatchesRecovered,
  runtimePackagePath,
  syncIndexesIfNeeded,
  validateRecoveredRuntimeEquivalence,
} from "../../../scripts/locale-lessons/lib/promote-phase13b-recovered-packages-core.ts";
import { validateAllRecoveredPackages } from "../../../scripts/locale-lessons/repair-phase13b-recovered-packages.ts";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function countRuntimeJson(locale: string): number {
  const dir = path.join(REPO_ROOT, "src/lib/locale-lessons", locale, "lessons");
  return readdirSync(dir).filter((file) => file.endsWith(".json")).length;
}

describe("phase13b runtime package promotion (Stage 1)", () => {
  it(
    "recovered corpus validation gate before first promotion",
    async () => {
      const alreadyPromoted = await runtimeMatchesRecovered();
      if (alreadyPromoted) {
        const equivalence = await validateRecoveredRuntimeEquivalence();
        expect(equivalence.ok).toBe(true);
        return;
      }
      // Single full-corpus scan — assertRecoveredCorpusValidationClean() would
      // duplicate this work. Same gate coverage via explicit expects below.
      const validation = await validateAllRecoveredPackages();
      expect(validation.ok).toBe(true);
      expect(validation.mergeBlocked).toBe(false);
      expect(validation.blockedMissingGulfQuiz).toEqual([]);
    },
    // 300-package recovered/runtime equivalence checks routinely exceed the
    // default 5s Vitest budget, especially under parallel suite load.
    30_000,
  );

  it("lists exactly 300 deterministic promotion cells (100 per locale)", async () => {
    const cells = await listPromotionCells();
    expect(cells).toHaveLength(REQUIRED_LESSON_COUNT * PROMOTION_RUNTIME_LOCALES.length);

    for (const locale of PROMOTION_RUNTIME_LOCALES) {
      const localeCells = cells.filter((cell) => cell.locale === locale);
      expect(localeCells).toHaveLength(REQUIRED_LESSON_COUNT);
      const ids = localeCells.map((cell) => cell.lessonId);
      expect(new Set(ids).size).toBe(REQUIRED_LESSON_COUNT);
    }
  });

  it("promotes recovered packages with recovered-to-runtime semantic equivalence", async () => {
    const first = await promoteRecoveredToRuntime();
    expect(first.packagesPromoted).toBe(300);

    const equivalence = await validateRecoveredRuntimeEquivalence();
    expect(equivalence.ok).toBe(true);
    expect(equivalence.packagesChecked).toBe(300);
    expect(equivalence.mismatches).toEqual([]);

    const checksums = await buildEquivalenceChecksumReport();
    expect(checksums).toHaveLength(300);
    expect(checksums.every((cell) => cell.semanticallyEqual)).toBe(true);
    expect(checksums.every((cell) => cell.structuralErrors.length === 0)).toBe(true);
  }, 180_000);

  it("second promotion run writes zero files (idempotent)", async () => {
    const second = await promoteRecoveredToRuntime();
    expect(second.filesWritten).toBe(0);
    expect(second.staleFilesRemoved).toEqual([]);
  }, 180_000);

  it("runtime lesson folders contain exactly 100 packages per locale (300 total)", () => {
    for (const locale of PROMOTION_RUNTIME_LOCALES) {
      expect(countRuntimeJson(locale)).toBe(REQUIRED_LESSON_COUNT);
    }
    const total = PROMOTION_RUNTIME_LOCALES.reduce(
      (sum, locale) => sum + countRuntimeJson(locale),
      0,
    );
    expect(total).toBe(300);
  });

  it("has no stale runtime packages outside the approved manifest", async () => {
    const stale = await findStaleRuntimePackages();
    expect(stale).toEqual([]);
  });

  it("uses deterministic JSON formatting", async () => {
    const cells = await listPromotionCells();
    const sample = cells[0];
    const formatted = formatDeterministicJson(
      JSON.parse(readFileSync(sample.recoveredPath, "utf8")),
    );
    expect(formatted.endsWith("\n")).toBe(true);
    expect(formatted).toContain("\n  ");
  });

  it("does not touch ar-EG production lesson paths", async () => {
    const cells = await listPromotionCells();
    for (const cell of cells) {
      expect(cell.runtimePath).not.toContain(`${path.sep}ar-EG${path.sep}`);
      expect(cell.recoveredPath).not.toContain(`${path.sep}ar-EG${path.sep}`);
      expect(cell.runtimePath).not.toContain("components/intro/lessons");
    }

    const arEgLessonDir = path.join(REPO_ROOT, "src/components/intro/lessons");
    const promotedPaths = cells.map((cell) => runtimePackagePath(cell.locale, cell.lessonId));
    for (const promotedPath of promotedPaths) {
      expect(promotedPath.startsWith(arEgLessonDir)).toBe(false);
    }
  });

  it("keeps manifest and lesson-titles parity after index sync", async () => {
    await syncIndexesIfNeeded();
    const manifest = await validateManifestCurriculumSync();
    const titles = await validateTitleIndexParity();
    expect(manifest.ok).toBe(true);
    expect(titles.ok).toBe(true);
  }, 120_000);
});
