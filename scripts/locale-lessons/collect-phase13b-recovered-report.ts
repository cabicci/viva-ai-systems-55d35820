/**
 * Phase 13B recovered-packages collector (read-only).
 *
 * Reads the committed recovery staging folder
 *   src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/{locale}/*.json
 * and produces an accurate per-locale report without re-downloading GitHub
 * artifact ZIPs or calling any paid API.
 *
 * This utility never writes into final locale lesson folders and never
 * touches ar-EG production lessons or the ar-MSA canonical source.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { LessonPackageLocale } from "../../src/lib/locale-lessons/types.ts";
import { packageDirForLocale } from "./lib/source-package.ts";
import { selectFullLessonIds } from "./lib/full-lesson-ids.ts";

export const PHASE13B_RECOVERED_PACKAGES_ROOT = path.join(
  packageDirForLocale("ar-MSA"),
  "reports",
  "phase13b-recovered-packages",
);

const LOCALES: readonly LessonPackageLocale[] = ["ar-MSA", "ar-Gulf", "en"];

export interface Phase13BRecoveredCellReport {
  locale: LessonPackageLocale;
  lessonId: string;
}

export interface Phase13BRecoveredPerLocaleReport {
  locale: LessonPackageLocale;
  recovered: number;
  recoveredIds: string[];
  missingIds: string[];
  missingCount: number;
}

export interface Phase13BRecoveredReport {
  root: string;
  expectedLessonCount: number;
  totalRecovered: number;
  perLocale: Record<LessonPackageLocale, Phase13BRecoveredPerLocaleReport>;
  failedGeneratedPackages: Phase13BRecoveredCellReport[];
  retryCells: Phase13BRecoveredCellReport[];
}

async function listLessonIds(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => e.name.slice(0, -".json".length))
      .sort();
  } catch {
    return [];
  }
}

async function isValidJson(filePath: string): Promise<boolean> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

export async function collectPhase13BRecoveredReport(
  options: { root?: string; expectedLessonIds?: string[] } = {},
): Promise<Phase13BRecoveredReport> {
  const root = options.root ?? PHASE13B_RECOVERED_PACKAGES_ROOT;
  const expected =
    options.expectedLessonIds ?? (await selectFullLessonIds());
  const expectedSet = new Set(expected);

  const perLocale = {} as Record<LessonPackageLocale, Phase13BRecoveredPerLocaleReport>;
  const failed: Phase13BRecoveredCellReport[] = [];
  const retry: Phase13BRecoveredCellReport[] = [];
  let total = 0;

  for (const locale of LOCALES) {
    const dir = path.join(root, locale);
    const ids = await listLessonIds(dir);
    const recoveredIds = ids.filter((id) => expectedSet.has(id));
    for (const id of recoveredIds) {
      const ok = await isValidJson(path.join(dir, `${id}.json`));
      if (!ok) failed.push({ locale, lessonId: id });
    }
    const missingIds = expected.filter((id) => !recoveredIds.includes(id));
    for (const id of missingIds) retry.push({ locale, lessonId: id });
    perLocale[locale] = {
      locale,
      recovered: recoveredIds.length,
      recoveredIds,
      missingIds,
      missingCount: missingIds.length,
    };
    total += recoveredIds.length;
  }

  return {
    root,
    expectedLessonCount: expected.length,
    totalRecovered: total,
    perLocale,
    failedGeneratedPackages: failed,
    retryCells: retry,
  };
}

// CLI entrypoint (read-only): `bun scripts/locale-lessons/collect-phase13b-recovered-report.ts`
if (import.meta.main) {
  collectPhase13BRecoveredReport()
    .then((r) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(r, null, 2));
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    });
}
