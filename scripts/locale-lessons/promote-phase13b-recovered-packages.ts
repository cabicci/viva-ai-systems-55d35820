/**
 * Phase 13B runtime package promotion CLI.
 *
 * Usage:
 *   bun scripts/locale-lessons/promote-phase13b-recovered-packages.ts --dry-run
 *   bun scripts/locale-lessons/promote-phase13b-recovered-packages.ts --promote
 *   bun scripts/locale-lessons/promote-phase13b-recovered-packages.ts --validate-equivalence
 *   bun scripts/locale-lessons/promote-phase13b-recovered-packages.ts --checksum-report
 *
 * No AI. No external APIs. No ar-EG production changes.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertRecoveredCorpusValidationClean,
  buildEquivalenceChecksumReport,
  findStaleRuntimePackages,
  listPromotionCells,
  promoteRecoveredToRuntime,
  PROMOTION_RUNTIME_LOCALES,
  syncIndexesIfNeeded,
  validateRecoveredRuntimeEquivalence,
} from "./lib/promote-phase13b-recovered-packages-core.ts";
import { lessonsDirForLocale } from "./lib/source-package.ts";
import { REQUIRED_LESSON_COUNT } from "../../src/lib/locale-lessons/types.ts";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

async function countRuntimePackages(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const dir = lessonsDirForLocale(locale);
    const entries = await fs.readdir(dir);
    counts[locale] = entries.filter((name) => name.endsWith(".json")).length;
  }
  counts.total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return counts;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const promote = process.argv.includes("--promote");
  const validateEquivalence = process.argv.includes("--validate-equivalence");
  const checksumReport = process.argv.includes("--checksum-report");

  if (checksumReport) {
    const report = await buildEquivalenceChecksumReport();
    const mismatches = report.filter((cell) => !cell.semanticallyEqual);
    console.log(
      JSON.stringify(
        {
          packagesChecked: report.length,
          mismatches: mismatches.length,
          report,
        },
        null,
        2,
      ),
    );
    if (mismatches.length > 0) process.exit(1);
    return;
  }

  if (validateEquivalence) {
    const result = await validateRecoveredRuntimeEquivalence();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exit(1);
    return;
  }

  if (dryRun) {
    await assertRecoveredCorpusValidationClean();
    const cells = await listPromotionCells();
    const stale = await findStaleRuntimePackages();
    const runtimeBefore = await countRuntimePackages();
    const promotion = await promoteRecoveredToRuntime({ dryRun: true });
    const indexSync = await syncIndexesIfNeeded({ dryRun: true });

    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          runtimeBefore,
          promotionCells: cells.length,
          staleRuntimePackages: stale.map((filePath) =>
            path.relative(REPO_ROOT, filePath).replace(/\\/g, "/"),
          ),
          promotion,
          indexSync,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (promote) {
    const runtimeBefore = await countRuntimePackages();
    const promotion = await promoteRecoveredToRuntime();
    const indexSync = await syncIndexesIfNeeded();
    const equivalence = await validateRecoveredRuntimeEquivalence();
    const runtimeAfter = await countRuntimePackages();

    const report = {
      mode: "promote",
      runtimeBefore,
      runtimeAfter,
      promotion,
      indexSync,
      equivalence: {
        ok: equivalence.ok,
        packagesChecked: equivalence.packagesChecked,
        mismatches: equivalence.mismatches.length,
      },
    };

    console.log(JSON.stringify(report, null, 2));

    if (!equivalence.ok) process.exit(1);
    if (runtimeAfter.total !== REQUIRED_LESSON_COUNT * PROMOTION_RUNTIME_LOCALES.length) {
      process.exit(1);
    }
    return;
  }

  console.error(
    "Usage: --dry-run | --promote | --validate-equivalence | --checksum-report",
  );
  process.exit(1);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
