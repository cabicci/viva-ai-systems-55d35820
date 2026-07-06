import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptedLessonPackage,
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  assertNotCanonicalArMsaWriteTarget,
  learnerFinalLessonsDirForLocale,
} from "./phase13b-output-paths.ts";

export async function writePhase13BLearnerFinalLessonPackage(
  locale: LessonPackageLocale,
  pkg: AdaptedLessonPackage | LocalizedLessonPackage,
): Promise<string> {
  const lessonsDir = learnerFinalLessonsDirForLocale(locale);
  await fs.mkdir(lessonsDir, { recursive: true });
  const outPath = path.join(lessonsDir, `${pkg.lessonId}.json`);
  assertNotCanonicalArMsaWriteTarget(outPath);
  await fs.writeFile(outPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  return outPath;
}
