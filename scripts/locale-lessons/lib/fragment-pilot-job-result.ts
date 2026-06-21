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

export function fragmentPilotJobResultPath(
  locale: AdaptationTargetLocale,
  lessonId: string,
): string {
  return path.join(fragmentPilotJobsDirForLocale(locale), `${lessonId}.result.json`);
}

export async function writeFragmentPilotJobResult(
  result: FragmentPilotJobResult,
): Promise<string> {
  const dir = fragmentPilotJobsDirForLocale(result.locale);
  await fs.mkdir(dir, { recursive: true });
  const filePath = fragmentPilotJobResultPath(result.locale, result.lessonId);
  await fs.writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return filePath;
}

export async function readFragmentPilotJobResult(
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<FragmentPilotJobResult | null> {
  try {
    const raw = await fs.readFile(fragmentPilotJobResultPath(locale, lessonId), "utf8");
    return JSON.parse(raw) as FragmentPilotJobResult;
  } catch {
    return null;
  }
}
