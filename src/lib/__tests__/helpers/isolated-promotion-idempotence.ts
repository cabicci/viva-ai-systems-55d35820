import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { LessonPackageLocale, LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";
import { PHASE13B_RECOVERED_PACKAGES_ROOT } from "../../../../scripts/locale-lessons/collect-phase13b-recovered-report.ts";
import { deepEqual } from "../../../../scripts/locale-lessons/lib/phase13b-semantic-diff.ts";
import {
  assertStructuralFieldsUnchanged,
  formatDeterministicJson,
  PROMOTION_RUNTIME_LOCALES,
  type EquivalenceResult,
  type PromotionCell,
  type PromotionResult,
} from "../../../../scripts/locale-lessons/lib/promote-phase13b-recovered-packages-core.ts";

async function readPackage(filePath: string): Promise<LocalizedLessonPackage> {
  const raw = await fs.readFile(filePath, "utf8");
  const pkg = JSON.parse(raw) as LocalizedLessonPackage;
  if (!pkg.lessonId || !pkg.locale) {
    throw new Error(`${filePath} is missing lessonId or locale`);
  }
  return pkg;
}

async function listIsolatedPromotionCells(
  recoveredRoot: string,
  runtimeRoot: string,
): Promise<PromotionCell[]> {
  const cells: PromotionCell[] = [];

  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const localeDir = path.join(recoveredRoot, locale);
    const entries = (await fs.readdir(localeDir))
      .filter((name) => name.endsWith(".json"))
      .sort();

    if (entries.length !== REQUIRED_LESSON_COUNT) {
      throw new Error(
        `${locale} isolated recovered corpus has ${entries.length} packages, expected ${REQUIRED_LESSON_COUNT}`,
      );
    }

    for (const fileName of entries) {
      const lessonId = fileName.slice(0, -".json".length);
      cells.push({
        locale,
        lessonId,
        recoveredPath: path.join(localeDir, fileName),
        runtimePath: path.join(runtimeRoot, locale, "lessons", fileName),
      });
    }
  }

  if (cells.length !== REQUIRED_LESSON_COUNT * PROMOTION_RUNTIME_LOCALES.length) {
    throw new Error(
      `Expected ${REQUIRED_LESSON_COUNT * PROMOTION_RUNTIME_LOCALES.length} isolated promotion cells, found ${cells.length}`,
    );
  }

  return cells.sort((a, b) =>
    a.locale === b.locale
      ? a.lessonId.localeCompare(b.lessonId)
      : a.locale.localeCompare(b.locale),
  );
}

async function promoteIsolatedCorpus(
  recoveredRoot: string,
  runtimeRoot: string,
): Promise<PromotionResult> {
  const cells = await listIsolatedPromotionCells(recoveredRoot, runtimeRoot);
  let filesWritten = 0;
  let filesSkippedIdentical = 0;

  for (const cell of cells) {
    const sourcePkg = await readPackage(cell.recoveredPath);
    if (sourcePkg.lessonId !== cell.lessonId || sourcePkg.locale !== cell.locale) {
      throw new Error(`${cell.recoveredPath} metadata mismatch for ${cell.lessonId}`);
    }

    const formatted = formatDeterministicJson(sourcePkg);
    let existing: string | null = null;
    try {
      existing = await fs.readFile(cell.runtimePath, "utf8");
    } catch {
      existing = null;
    }

    if (existing === formatted) {
      filesSkippedIdentical++;
      continue;
    }

    await fs.mkdir(path.dirname(cell.runtimePath), { recursive: true });
    await fs.writeFile(cell.runtimePath, formatted, "utf8");
    filesWritten++;
  }

  return {
    dryRun: false,
    packagesPromoted: cells.length,
    filesWritten,
    filesSkippedIdentical,
    staleFilesReported: [],
    staleFilesRemoved: [],
    cells: [],
  };
}

async function validateIsolatedEquivalence(
  recoveredRoot: string,
  runtimeRoot: string,
): Promise<EquivalenceResult> {
  const cells = await listIsolatedPromotionCells(recoveredRoot, runtimeRoot);
  const mismatches: EquivalenceResult["mismatches"] = [];

  for (const cell of cells) {
    const sourcePkg = await readPackage(cell.recoveredPath);
    const targetPkg = await readPackage(cell.runtimePath);
    const semanticallyEqual = deepEqual(sourcePkg, targetPkg);
    const structuralErrors = assertStructuralFieldsUnchanged(sourcePkg, targetPkg);

    if (!semanticallyEqual || structuralErrors.length > 0) {
      mismatches.push({
        locale: cell.locale,
        lessonId: cell.lessonId,
        sourceSha256: "",
        targetSha256: "",
        semanticallyEqual,
        structuralErrors,
      });
    }
  }

  const perLocaleCounts = Object.fromEntries(
    PROMOTION_RUNTIME_LOCALES.map((locale) => [
      locale,
      cells.filter((cell) => cell.locale === locale).length,
    ]),
  ) as Record<LessonPackageLocale, number>;

  return {
    ok: mismatches.length === 0,
    packagesChecked: cells.length,
    mismatches,
    perLocaleCounts,
  };
}

async function copyRecoveredCorpusToDir(targetRecoveredRoot: string): Promise<void> {
  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const sourceDir = path.join(PHASE13B_RECOVERED_PACKAGES_ROOT, locale);
    const targetDir = path.join(targetRecoveredRoot, locale);
    await fs.mkdir(targetDir, { recursive: true });

    const entries = (await fs.readdir(sourceDir))
      .filter((name) => name.endsWith(".json"))
      .sort();

    for (const fileName of entries) {
      await fs.copyFile(
        path.join(sourceDir, fileName),
        path.join(targetDir, fileName),
      );
    }
  }
}

export interface IsolatedPromotionIdempotenceResult {
  tempRoot: string;
  firstPromotion: PromotionResult;
  secondPromotion: PromotionResult;
  equivalence: EquivalenceResult;
}

export async function runIsolatedPromotionIdempotence(): Promise<IsolatedPromotionIdempotenceResult> {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "viva-scientific-correction-promote-"),
  );
  const recoveredRoot = path.join(tempRoot, "recovered");
  const runtimeRoot = path.join(tempRoot, "runtime");

  try {
    await copyRecoveredCorpusToDir(recoveredRoot);

    const firstPromotion = await promoteIsolatedCorpus(recoveredRoot, runtimeRoot);
    const equivalence = await validateIsolatedEquivalence(recoveredRoot, runtimeRoot);
    const secondPromotion = await promoteIsolatedCorpus(recoveredRoot, runtimeRoot);

    return {
      tempRoot,
      firstPromotion,
      secondPromotion,
      equivalence,
    };
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
    try {
      await fs.access(tempRoot);
      throw new Error(`Isolated promotion temp root was not removed: ${tempRoot}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
