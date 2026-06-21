import type {
  AdaptationTargetLocale,
  LocalizedSampleManifest,
} from "../../src/lib/locale-lessons/types.ts";
import { ADAPTATION_TARGET_LOCALES } from "../../src/lib/locale-lessons/types.ts";
import { validateSampleTargetPackage, collectSamplePackageWarnings } from "./generate-localized-samples.ts";
import {
  validatePilotTargetPackage,
  collectPilotPackageWarnings,
} from "./generate-localized-pilot.ts";
import {
  manifestPathForLocale,
  pathExists,
  readJsonFile,
  validateMsaSourcePackage,
  validateTargetPackage,
} from "./lib/source-package.ts";

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const target = readArg("target") as AdaptationTargetLocale | "all" | null;

  const source = await validateMsaSourcePackage();
  console.log(
    source.ok
      ? `ar-MSA source: OK (${source.foundLessonCount}/${source.expectedLessonCount})`
      : `ar-MSA source: FAIL (${source.foundLessonCount}/${source.expectedLessonCount})`,
  );
  if (!source.ok) {
    for (const error of source.errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const targets =
    target && target !== "all"
      ? [target]
      : [...ADAPTATION_TARGET_LOCALES];

  if (target && target !== "all" && target !== "ar-Gulf" && target !== "en") {
    console.error("Usage: --target ar-Gulf|en|all");
    process.exit(1);
  }

  let exitCode = 0;
  for (const locale of targets) {
    const manifestPath = manifestPathForLocale(locale);
    const hasManifest = await pathExists(manifestPath);

    if (hasManifest) {
      const manifest = await readJsonFile<LocalizedSampleManifest | { packageStatus?: string }>(
        manifestPath,
      );
      if (manifest.packageStatus === "sample") {
        const sample = await validateSampleTargetPackage(locale);
        console.log(
          sample.ok
            ? `${locale}: SAMPLE OK (${sample.count}/3 sample lessons, package incomplete)`
            : `${locale}: SAMPLE INVALID (${sample.count}/3)`,
        );
        if (!sample.ok) {
          exitCode = 1;
          for (const error of sample.errors) console.error(`  - ${error}`);
        } else {
          const warnings = await collectSamplePackageWarnings(locale);
          if (warnings.length > 0) {
            console.log(`${locale}: ${warnings.length} quality warning(s)`);
            for (const warning of warnings) console.warn(`  WARN: ${warning}`);
          }
        }
        continue;
      }

      if (manifest.packageStatus === "pilot") {
        const pilot = await validatePilotTargetPackage(locale);
        console.log(
          pilot.ok
            ? `${locale}: PILOT OK (${pilot.count}/${pilot.expectedCount} pilot lessons, package incomplete)`
            : `${locale}: PILOT INVALID (${pilot.count}/${pilot.expectedCount})`,
        );
        if (!pilot.ok) {
          exitCode = 1;
          for (const error of pilot.errors) console.error(`  - ${error}`);
        } else {
          const warnings = await collectPilotPackageWarnings(locale);
          if (warnings.length > 0) {
            console.error(
              `${locale}: LEARNER TEXT QUALITY GATE FAILED (${warnings.length} violation(s))`,
            );
            for (const warning of warnings) console.error(`  FAIL: ${warning}`);
            exitCode = 1;
          }
        }
        continue;
      }
    }

    const result = await validateTargetPackage(locale);
    if (result.foundLessonCount === 0) {
      console.log(
        `${locale}: not generated yet (0/${result.expectedLessonCount})`,
      );
      continue;
    }

    console.log(
      result.ok
        ? `${locale}: OK (${result.foundLessonCount}/${result.expectedLessonCount})`
        : `${locale}: INVALID (${result.foundLessonCount}/${result.expectedLessonCount})`,
    );
    if (!result.ok) {
      exitCode = 1;
      for (const error of result.errors) console.error(`  - ${error}`);
    }
  }

  process.exit(exitCode);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
