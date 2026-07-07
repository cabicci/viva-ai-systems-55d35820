/**
 * Phase 13B merge-readiness audit + deterministic repair CLI.
 *
 * Usage:
 *   bun scripts/locale-lessons/repair-phase13b-recovered-packages.ts --audit
 *   bun scripts/locale-lessons/repair-phase13b-recovered-packages.ts --repair
 *   bun scripts/locale-lessons/repair-phase13b-recovered-packages.ts --validate
 *
 * No AI. No OpenAI. No workflow triggers. No publish. No runtime locale merge.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AdaptedLessonPackage } from "../../src/lib/locale-lessons/types.ts";
import { collectPhase13BRecoveredReport } from "./collect-phase13b-recovered-report.ts";
import {
  auditRecoveredPackage,
  buildValidationSummary,
  mergeWithShippedLesson,
  PHASE13B_RECOVERED_LOCALES,
  repairRecoveredPackage,
  sectionRolesAlign,
  summarizeAuditIssues,
  type Phase13BAuditIssue,
} from "./lib/phase13b-merge-readiness.ts";
import {
  lessonsDirForLocale,
  loadMsaLessonPackage,
  readJsonFile,
} from "./lib/source-package.ts";
import { PHASE13B_RECOVERED_PACKAGES_ROOT } from "./collect-phase13b-recovered-report.ts";

async function listPackagePaths(): Promise<Array<{ locale: string; lessonId: string; filePath: string }>> {
  const report = await collectPhase13BRecoveredReport();
  const cells: Array<{ locale: string; lessonId: string; filePath: string }> = [];

  for (const locale of PHASE13B_RECOVERED_LOCALES) {
    const ids = report.perLocale[locale]?.recoveredIds ?? [];
    for (const lessonId of ids) {
      cells.push({
        locale,
        lessonId,
        filePath: path.join(PHASE13B_RECOVERED_PACKAGES_ROOT, locale, `${lessonId}.json`),
      });
    }
  }
  return cells;
}

async function loadPackage(filePath: string): Promise<AdaptedLessonPackage> {
  return readJsonFile<AdaptedLessonPackage>(filePath);
}

async function loadShippedLesson(
  locale: string,
  lessonId: string,
): Promise<AdaptedLessonPackage | null> {
  const filePath = path.join(lessonsDirForLocale(locale), `${lessonId}.json`);
  try {
    return await readJsonFile<AdaptedLessonPackage>(filePath);
  } catch {
    return null;
  }
}

export async function auditAllRecoveredPackages(): Promise<{
  packagesScanned: number;
  issues: Phase13BAuditIssue[];
  byKind: ReturnType<typeof summarizeAuditIssues>;
}> {
  const cells = await listPackagePaths();
  const issues: Phase13BAuditIssue[] = [];

  for (const cell of cells) {
    try {
      const source = await loadMsaLessonPackage(cell.lessonId);
      const pkg = await loadPackage(cell.filePath);
      issues.push(...auditRecoveredPackage(source, pkg));
    } catch (error) {
      issues.push({
        locale: cell.locale,
        lessonId: cell.lessonId,
        path: cell.filePath,
        kind: "structural_parity",
        message: error instanceof Error ? error.message : String(error),
        severity: "error",
      });
    }
  }

  return {
    packagesScanned: cells.length,
    issues,
    byKind: summarizeAuditIssues(issues),
  };
}

export async function repairAllRecoveredPackages(): Promise<{
  packagesScanned: number;
  filesWritten: number;
  touched: string[];
  auditBefore: number;
  auditAfter: number;
}> {
  const before = await auditAllRecoveredPackages();
  const cells = await listPackagePaths();
  const touched: string[] = [];
  let filesWritten = 0;

  for (const cell of cells) {
    const source = await loadMsaLessonPackage(cell.lessonId);
    let pkg = await loadPackage(cell.filePath);
    if (!sectionRolesAlign(source, pkg)) {
      const shipped = await loadShippedLesson(cell.locale, cell.lessonId);
      if (shipped) {
        pkg = mergeWithShippedLesson(pkg, shipped);
      }
    }
    const repaired = repairRecoveredPackage(source, pkg);
    const beforeJson = JSON.stringify(pkg);
    const afterJson = JSON.stringify(repaired);
    if (beforeJson !== afterJson) {
      await fs.writeFile(cell.filePath, JSON.stringify(repaired, null, 2) + "\n", "utf8");
      filesWritten++;
      touched.push(`${cell.locale}/${cell.lessonId}`);
    }
  }

  const after = await auditAllRecoveredPackages();

  return {
    packagesScanned: cells.length,
    filesWritten,
    touched,
    auditBefore: before.issues.filter((i) => i.severity === "error").length,
    auditAfter: after.issues.filter((i) => i.severity === "error").length,
  };
}

export async function validateAllRecoveredPackages() {
  const report = await collectPhase13BRecoveredReport();
  const cells = await listPackagePaths();
  const issues: Phase13BAuditIssue[] = [];
  let jsonParseErrors = 0;

  for (const cell of cells) {
    try {
      const source = await loadMsaLessonPackage(cell.lessonId);
      const pkg = await loadPackage(cell.filePath);
      issues.push(...auditRecoveredPackage(source, pkg));
    } catch (error) {
      jsonParseErrors++;
      issues.push({
        locale: cell.locale,
        lessonId: cell.lessonId,
        path: cell.filePath,
        kind: "structural_parity",
        message: error instanceof Error ? error.message : String(error),
        severity: "error",
      });
    }
  }

  const missingIds: string[] = [];
  const retryCells: { locale: string; lessonId: string }[] = [];
  for (const locale of PHASE13B_RECOVERED_LOCALES) {
    for (const id of report.perLocale[locale]?.missingIds ?? []) {
      missingIds.push(`${locale}/${id}`);
      retryCells.push({ locale, lessonId: id });
    }
  }

  const perLocaleCounts = Object.fromEntries(
    PHASE13B_RECOVERED_LOCALES.map((locale) => [
      locale,
      report.perLocale[locale]?.recovered ?? 0,
    ]),
  );

  return buildValidationSummary({
    perLocaleCounts,
    issues,
    missingIds,
    retryCells,
    jsonParseErrors,
  });
}

async function main() {
  const mode = process.argv.includes("--repair")
    ? "repair"
    : process.argv.includes("--validate")
      ? "validate"
      : "audit";

  if (mode === "repair") {
    const result = await repairAllRecoveredPackages();
    console.log(JSON.stringify(result, null, 2));
    const validation = await validateAllRecoveredPackages();
    console.log(JSON.stringify({ validation }, null, 2));
    if (!validation.ok) process.exit(1);
    return;
  }

  if (mode === "validate") {
    const validation = await validateAllRecoveredPackages();
    console.log(JSON.stringify(validation, null, 2));
    if (!validation.ok) process.exit(1);
    return;
  }

  const audit = await auditAllRecoveredPackages();
  console.log(JSON.stringify(audit, null, 2));
  if (audit.issues.some((i) => i.severity === "error")) process.exit(1);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
