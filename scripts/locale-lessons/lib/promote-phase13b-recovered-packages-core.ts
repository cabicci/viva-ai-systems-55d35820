import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { LessonPackageLocale, LocalizedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";
import { REQUIRED_LESSON_COUNT } from "../../../src/lib/locale-lessons/types.ts";
import { PHASE13B_RECOVERED_PACKAGES_ROOT } from "../collect-phase13b-recovered-report.ts";
import { selectFullLessonIds } from "./full-lesson-ids.ts";
import { PHASE13B_RECOVERED_LOCALES } from "./phase13b-merge-readiness.ts";
import { deepEqual } from "./phase13b-semantic-diff.ts";
import {
  lessonsDirForLocale,
  packageDirForLocale,
  readJsonFile,
} from "./source-package.ts";
import { validateAllRecoveredPackages } from "../repair-phase13b-recovered-packages.ts";

export const PROMOTION_RUNTIME_LOCALES = PHASE13B_RECOVERED_LOCALES;

export interface PromotionCell {
  locale: LessonPackageLocale;
  lessonId: string;
  recoveredPath: string;
  runtimePath: string;
}

export interface PromotionFileResult {
  locale: LessonPackageLocale;
  lessonId: string;
  action: "written" | "skipped_identical" | "dry_run_would_write";
}

export interface PromotionResult {
  dryRun: boolean;
  packagesPromoted: number;
  filesWritten: number;
  filesSkippedIdentical: number;
  staleFilesRemoved: string[];
  staleFilesReported: string[];
  cells: PromotionFileResult[];
}

export interface EquivalenceCellReport {
  locale: LessonPackageLocale;
  lessonId: string;
  sourceSha256: string;
  targetSha256: string;
  semanticallyEqual: boolean;
  structuralErrors: string[];
}

export interface EquivalenceResult {
  ok: boolean;
  packagesChecked: number;
  mismatches: EquivalenceCellReport[];
  perLocaleCounts: Record<LessonPackageLocale, number>;
}

export interface IndexSyncResult {
  manifestChanged: Record<LessonPackageLocale, boolean>;
  lessonTitlesChanged: Record<LessonPackageLocale, boolean>;
  labelsChanged: Record<LessonPackageLocale, boolean>;
  filesWritten: string[];
}

export function recoveredPackagePath(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return path.join(PHASE13B_RECOVERED_PACKAGES_ROOT, locale, `${lessonId}.json`);
}

export function runtimePackagePath(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return path.join(lessonsDirForLocale(locale), `${lessonId}.json`);
}

export function formatDeterministicJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function sha256File(filePath: string): Promise<string> {
  const raw = await fs.readFile(filePath);
  return createHash("sha256").update(raw).digest("hex");
}

export async function sha256Text(text: string): Promise<string> {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function assertRecoveredCorpusValidationClean(): Promise<void> {
  const validation = await validateAllRecoveredPackages();
  if (!validation.ok || validation.mergeBlocked) {
    throw new Error(
      `Recovered corpus is not validation-clean: ok=${validation.ok} mergeBlocked=${validation.mergeBlocked} errors=${validation.validationErrors.length}`,
    );
  }
}

export async function loadApprovedLessonIds(): Promise<string[]> {
  const lessonIds = await selectFullLessonIds();
  if (lessonIds.length !== REQUIRED_LESSON_COUNT) {
    throw new Error(
      `Approved manifest must list ${REQUIRED_LESSON_COUNT} lessons, found ${lessonIds.length}`,
    );
  }
  return lessonIds;
}

export async function listPromotionCells(): Promise<PromotionCell[]> {
  const lessonIds = await loadApprovedLessonIds();
  const cells: PromotionCell[] = [];

  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const localeDir = path.join(PHASE13B_RECOVERED_PACKAGES_ROOT, locale);
    const entries = await fs.readdir(localeDir);
    const jsonFiles = entries.filter((name) => name.endsWith(".json")).sort();

    if (jsonFiles.length !== REQUIRED_LESSON_COUNT) {
      throw new Error(
        `${locale} recovered corpus has ${jsonFiles.length} packages, expected ${REQUIRED_LESSON_COUNT}`,
      );
    }

    const seen = new Set<string>();
    for (const fileName of jsonFiles) {
      const lessonId = fileName.slice(0, -".json".length);
      if (seen.has(lessonId)) {
        throw new Error(`${locale} recovered corpus has duplicate lesson ID: ${lessonId}`);
      }
      seen.add(lessonId);

      if (!lessonIds.includes(lessonId)) {
        throw new Error(
          `${locale} recovered package ${lessonId} is not in the approved 100-ID manifest`,
        );
      }

      cells.push({
        locale,
        lessonId,
        recoveredPath: path.join(localeDir, fileName),
        runtimePath: runtimePackagePath(locale, lessonId),
      });
    }

    const missing = lessonIds.filter((id) => !seen.has(id));
    if (missing.length > 0) {
      throw new Error(
        `${locale} recovered corpus missing ${missing.length} approved lesson ID(s): ${missing.slice(0, 5).join(", ")}`,
      );
    }
  }

  if (cells.length !== REQUIRED_LESSON_COUNT * PROMOTION_RUNTIME_LOCALES.length) {
    throw new Error(
      `Expected ${REQUIRED_LESSON_COUNT * PROMOTION_RUNTIME_LOCALES.length} promotion cells, found ${cells.length}`,
    );
  }

  return cells.sort((a, b) =>
    a.locale === b.locale
      ? a.lessonId.localeCompare(b.lessonId)
      : a.locale.localeCompare(b.locale),
  );
}

export function assertStructuralFieldsUnchanged(
  source: LocalizedLessonPackage,
  target: LocalizedLessonPackage,
): string[] {
  const errors: string[] = [];
  const scalarFields = [
    "lessonId",
    "locale",
    "pathId",
    "moduleId",
    "productionRoute",
    "nextLessonId",
  ] as const;

  for (const field of scalarFields) {
    if (source[field] !== target[field]) {
      errors.push(`${field}: ${String(source[field])} != ${String(target[field])}`);
    }
  }

  const sourceRoles = source.sections.map((section) => section.role);
  const targetRoles = target.sections.map((section) => section.role);
  if (JSON.stringify(sourceRoles) !== JSON.stringify(targetRoles)) {
    errors.push("section role order changed");
  }

  for (let index = 0; index < source.sections.length; index++) {
    const sourceSection = source.sections[index];
    const targetSection = target.sections[index];
    if (!sourceSection || !targetSection) continue;

    if (JSON.stringify(sourceSection.tables) !== JSON.stringify(targetSection.tables)) {
      errors.push(`sections[${index}].tables changed`);
    }

    const sourceQuiz = sourceSection.quiz;
    const targetQuiz = targetSection.quiz;
    if (Boolean(sourceQuiz) !== Boolean(targetQuiz)) {
      errors.push(`sections[${index}].quiz presence changed`);
      continue;
    }
    if (sourceQuiz && targetQuiz && sourceQuiz.correctIndex !== targetQuiz.correctIndex) {
      errors.push(
        `sections[${index}].quiz.correctIndex: ${String(sourceQuiz.correctIndex)} != ${String(targetQuiz.correctIndex)}`,
      );
    }

    const sourceMission = sourceSection.mission;
    const targetMission = targetSection.mission;
    if (Boolean(sourceMission) !== Boolean(targetMission)) {
      errors.push(`sections[${index}].mission presence changed`);
    }
  }

  return errors;
}

async function readPackage(filePath: string): Promise<LocalizedLessonPackage> {
  const pkg = await readJsonFile<LocalizedLessonPackage>(filePath);
  if (!pkg.lessonId || !pkg.locale) {
    throw new Error(`${filePath} is missing lessonId or locale`);
  }
  return pkg;
}

export async function findStaleRuntimePackages(): Promise<string[]> {
  const approved = new Set(await loadApprovedLessonIds());
  const stale: string[] = [];

  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const lessonsDir = lessonsDirForLocale(locale);
    const entries = await fs.readdir(lessonsDir);
    for (const entry of entries.filter((name) => name.endsWith(".json")).sort()) {
      const lessonId = entry.slice(0, -".json".length);
      if (!approved.has(lessonId)) {
        stale.push(path.join(lessonsDir, entry));
      }
    }
  }

  return stale;
}

export async function runtimeMatchesRecovered(
  cells?: PromotionCell[],
): Promise<boolean> {
  const resolvedCells = cells ?? (await listPromotionCells());
  return allRuntimePackagesMatchRecovered(resolvedCells);
}

async function allRuntimePackagesMatchRecovered(
  cells: PromotionCell[],
): Promise<boolean> {
  for (const cell of cells) {
    const sourcePkg = await readPackage(cell.recoveredPath);
    const formatted = formatDeterministicJson(sourcePkg);
    let existing: string | null = null;
    try {
      existing = await fs.readFile(cell.runtimePath, "utf8");
    } catch {
      return false;
    }
    if (existing !== formatted) {
      return false;
    }
  }
  return true;
}

export async function promoteRecoveredToRuntime(options: {
  dryRun?: boolean;
  skipValidation?: boolean;
} = {}): Promise<PromotionResult> {
  const dryRun = options.dryRun ?? false;
  const cells = await listPromotionCells();
  const alreadyPromoted = await allRuntimePackagesMatchRecovered(cells);

  if (!options.skipValidation && !alreadyPromoted) {
    await assertRecoveredCorpusValidationClean();
  }
  const results: PromotionFileResult[] = [];
  let filesWritten = 0;
  let filesSkippedIdentical = 0;

  for (const cell of cells) {
    const sourcePkg = await readPackage(cell.recoveredPath);
    if (sourcePkg.lessonId !== cell.lessonId) {
      throw new Error(
        `${cell.recoveredPath} lessonId ${sourcePkg.lessonId} != filename ${cell.lessonId}`,
      );
    }
    if (sourcePkg.locale !== cell.locale) {
      throw new Error(
        `${cell.recoveredPath} locale ${sourcePkg.locale} != expected ${cell.locale}`,
      );
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
      results.push({
        locale: cell.locale,
        lessonId: cell.lessonId,
        action: "skipped_identical",
      });
      continue;
    }

    if (dryRun) {
      results.push({
        locale: cell.locale,
        lessonId: cell.lessonId,
        action: "dry_run_would_write",
      });
      continue;
    }

    await fs.mkdir(path.dirname(cell.runtimePath), { recursive: true });
    await fs.writeFile(cell.runtimePath, formatted, "utf8");
    filesWritten++;
    results.push({
      locale: cell.locale,
      lessonId: cell.lessonId,
      action: "written",
    });
  }

  const staleFilesReported = (await findStaleRuntimePackages()).map((filePath) =>
    filePath.replace(/\\/g, "/"),
  );
  const staleFilesRemoved: string[] = [];

  if (!dryRun) {
    for (const stalePath of staleFilesReported) {
      await fs.unlink(stalePath);
      staleFilesRemoved.push(stalePath.replace(/\\/g, "/"));
    }
  }

  return {
    dryRun,
    packagesPromoted: cells.length,
    filesWritten,
    filesSkippedIdentical,
    staleFilesReported,
    staleFilesRemoved,
    cells: results,
  };
}

export async function validateRecoveredRuntimeEquivalence(): Promise<EquivalenceResult> {
  const cells = await listPromotionCells();
  const mismatches: EquivalenceCellReport[] = [];

  for (const cell of cells) {
    const sourcePkg = await readPackage(cell.recoveredPath);
    const targetPkg = await readPackage(cell.runtimePath);
    const semanticallyEqual = deepEqual(sourcePkg, targetPkg);
    const structuralErrors = assertStructuralFieldsUnchanged(sourcePkg, targetPkg);

    if (!semanticallyEqual || structuralErrors.length > 0) {
      mismatches.push({
        locale: cell.locale,
        lessonId: cell.lessonId,
        sourceSha256: await sha256File(cell.recoveredPath),
        targetSha256: await sha256File(cell.runtimePath),
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

export async function buildEquivalenceChecksumReport(): Promise<EquivalenceCellReport[]> {
  const cells = await listPromotionCells();
  const reports: EquivalenceCellReport[] = [];

  for (const cell of cells) {
    const sourcePkg = await readPackage(cell.recoveredPath);
    const targetPkg = await readPackage(cell.runtimePath);
    reports.push({
      locale: cell.locale,
      lessonId: cell.lessonId,
      sourceSha256: await sha256File(cell.recoveredPath),
      targetSha256: await sha256File(cell.runtimePath),
      semanticallyEqual: deepEqual(sourcePkg, targetPkg),
      structuralErrors: assertStructuralFieldsUnchanged(sourcePkg, targetPkg),
    });
  }

  return reports;
}

function sortedRecord<T extends Record<string, string>>(record: T): T {
  const sorted = Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, record[key]]),
  ) as T;
  return sorted;
}

export async function syncIndexesIfNeeded(options: {
  dryRun?: boolean;
} = {}): Promise<IndexSyncResult> {
  const dryRun = options.dryRun ?? false;
  const lessonIds = await loadApprovedLessonIds();
  const filesWritten: string[] = [];
  const manifestChanged = {
    "ar-MSA": false,
    "ar-Gulf": false,
    en: false,
  } as Record<LessonPackageLocale, boolean>;
  const lessonTitlesChanged = {
    "ar-MSA": false,
    "ar-Gulf": false,
    en: false,
  } as Record<LessonPackageLocale, boolean>;
  const labelsChanged = {
    "ar-MSA": false,
    "ar-Gulf": false,
    en: false,
  } as Record<LessonPackageLocale, boolean>;

  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const manifestPath = path.join(packageDirForLocale(locale), "manifest.json");
    const manifest = await readJsonFile<Record<string, unknown>>(manifestPath);
    const currentIds = [...((manifest.lessonIds as string[] | undefined) ?? [])];
    const manifestIdsMatch =
      currentIds.length === lessonIds.length &&
      currentIds.every((id, index) => id === lessonIds[index]) &&
      manifest.lessonCount === REQUIRED_LESSON_COUNT;

    if (!manifestIdsMatch) {
      const nextManifest = {
        ...manifest,
        lessonIds: [...lessonIds],
        lessonCount: REQUIRED_LESSON_COUNT,
      };
      const manifestFormatted = formatDeterministicJson(nextManifest);
      const existingManifest = await fs.readFile(manifestPath, "utf8");
      if (existingManifest !== manifestFormatted) {
        manifestChanged[locale] = true;
        if (!dryRun) {
          await fs.writeFile(manifestPath, manifestFormatted, "utf8");
          filesWritten.push(manifestPath.replace(/\\/g, "/"));
        }
      }
    }

    const titlesPath = path.join(packageDirForLocale(locale), "lesson-titles.json");
    const currentTitles = sortedRecord(
      await readJsonFile<Record<string, string>>(titlesPath),
    );
    const nextTitles: Record<string, string> = { ...currentTitles };
    let titlesDirty = false;

    for (const lessonId of lessonIds) {
      const pkg = await readPackage(runtimePackagePath(locale, lessonId));
      const packageTitle = pkg.title?.trim() ?? "";
      if (!packageTitle) {
        throw new Error(`${locale}/${lessonId}: promoted package has empty title`);
      }
      if (nextTitles[lessonId] !== packageTitle) {
        nextTitles[lessonId] = packageTitle;
        titlesDirty = true;
      }
    }

    const titlesFormatted = formatDeterministicJson(sortedRecord(nextTitles));
    if (titlesDirty) {
      lessonTitlesChanged[locale] = true;
      const existingTitles = await fs.readFile(titlesPath, "utf8");
      if (existingTitles !== titlesFormatted && !dryRun) {
        await fs.writeFile(titlesPath, titlesFormatted, "utf8");
        filesWritten.push(titlesPath.replace(/\\/g, "/"));
      }
    }

    // labels.json is path/module chrome only; package promotion does not alter it.
    labelsChanged[locale] = false;
  }

  return {
    manifestChanged,
    lessonTitlesChanged,
    labelsChanged,
    filesWritten,
  };
}
