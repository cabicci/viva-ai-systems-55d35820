import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptedLessonPackage,
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { assertNotCanonicalArMsaWriteTarget } from "./phase13b-output-paths.ts";
import { phase13BGeneratedPackagePath } from "./phase13b-generated-packages.ts";

/** Write finalized learner package JSON to Phase 13B artifact staging only. */
export async function writePhase13BGeneratedLessonPackage(
  locale: LessonPackageLocale,
  pkg: AdaptedLessonPackage | LocalizedLessonPackage,
): Promise<string> {
  const outPath = phase13BGeneratedPackagePath(locale, pkg.lessonId);
  assertNotCanonicalArMsaWriteTarget(outPath);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  return outPath;
}
