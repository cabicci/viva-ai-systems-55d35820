import type { AdaptationTargetLocale } from "../../src/lib/locale-lessons/types.ts";
import { ADAPTATION_TARGET_LOCALES } from "../../src/lib/locale-lessons/types.ts";
import {
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
    const result = await validateTargetPackage(locale);
    if (result.foundLessonCount === 0) {
      console.log(
        `${locale}: not generated yet (0/${result.expectedLessonCount}) — expected in Phase 2B dry-run`,
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
