import { promises as fs } from "node:fs";
import path from "node:path";
import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";
import { packageDirForLocale } from "./source-package.ts";

export interface FragmentPilotJobResult {
  locale: AdaptationTargetLocale;
  lessonId: string;
  ok: boolean;
  fieldCount: number;
  errors: string[];
  generatedAt: string;
}

export function fragmentPilotJobsDirForLocale(locale: string): string {
  return path.join(packageDirForLocale(locale), "reports", "fragment-pilot-jobs");
}

/** Locale-scoped result path (preferred). */
export function fragmentPilotJobResultPath(
  locale: AdaptationTargetLocale,
  lessonId: string,
): string {
  return path.join(
    fragmentPilotJobsDirForLocale(locale),
    locale,
    `${lessonId}.result.json`,
  );
}

/** Legacy flat path kept for backward compatibility when reading old artifacts. */
export function fragmentPilotJobResultPathLegacy(
  locale: AdaptationTargetLocale,
  lessonId: string,
): string {
  return path.join(fragmentPilotJobsDirForLocale(locale), `${lessonId}.result.json`);
}

export async function writeFragmentPilotJobResult(
  result: FragmentPilotJobResult,
): Promise<string> {
  const filePath = fragmentPilotJobResultPath(result.locale, result.lessonId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return filePath;
}

export async function readFragmentPilotJobResult(
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<FragmentPilotJobResult | null> {
  for (const resolver of [
    fragmentPilotJobResultPath,
    fragmentPilotJobResultPathLegacy,
  ]) {
    try {
      const raw = await fs.readFile(resolver(locale, lessonId), "utf8");
      return JSON.parse(raw) as FragmentPilotJobResult;
    } catch {
      // try next layout
    }
  }
  return null;
}
