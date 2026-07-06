import { promises as fs } from "node:fs";
import path from "node:path";
import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import { packageDirForLocale } from "./source-package.ts";
import type { Phase13BPipelineMode } from "./phase13b-full-matrix.ts";

export interface Phase13BJobResult {
  locale: LessonPackageLocale;
  lessonId: string;
  ok: boolean;
  pipeline: Phase13BPipelineMode;
  requiresPaidApi: boolean;
  fieldCount: number;
  errors: string[];
  generatedAt: string;
  mode?: string;
  skippedPaidApi?: boolean;
  artifactPath?: string | null;
}

export function phase13BJobsDir(): string {
  return path.join(packageDirForLocale("ar-MSA"), "reports", "phase13b-full-jobs");
}

export function phase13BJobResultPath(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return path.join(phase13BJobsDir(), locale, `${lessonId}.result.json`);
}

export async function writePhase13BJobResult(
  result: Phase13BJobResult,
): Promise<string> {
  const filePath = phase13BJobResultPath(result.locale, result.lessonId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return filePath;
}

export async function readPhase13BJobResult(
  locale: LessonPackageLocale,
  lessonId: string,
): Promise<Phase13BJobResult | null> {
  try {
    const raw = await fs.readFile(phase13BJobResultPath(locale, lessonId), "utf8");
    return JSON.parse(raw) as Phase13BJobResult;
  } catch {
    return null;
  }
}
