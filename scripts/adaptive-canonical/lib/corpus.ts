import { promises as fs } from "node:fs";
import path from "node:path";
import { ARCHIVED_LESSON_ID_SET } from "../../../src/lib/archived-lessons.ts";

const REPO_ROOT = path.resolve(import.meta.dir, "../../..");
export const CANONICAL_DIR = path.join(
  REPO_ROOT,
  "docs/playbooks/adaptive-canonical",
);
export const REPORTS_DIR = path.join(CANONICAL_DIR, "reports");
export const PRODUCTION_DIR = path.join(
  REPO_ROOT,
  "src/components/intro/lessons",
);
const CURRICULUM_FILE = path.join(REPO_ROOT, "src/lib/curriculum-data.ts");

const EXCLUDE_CANONICAL = new Set([
  "MSA_CANONICAL_TEMPLATE.md",
  "API_AUDIT_PIPELINE.md",
]);

export function repoRoot(): string {
  return REPO_ROOT;
}

export async function loadPathsLessonIds(): Promise<Set<string>> {
  const src = await fs.readFile(CURRICULUM_FILE, "utf8");
  const ids = [
    ...src.matchAll(/(?:lesson|Shipped)\(\s*\d+,\s*"([^"]+)"/g),
  ].map((m) => m[1]);
  return new Set(ids);
}

export async function listCanonicalLessonIds(): Promise<string[]> {
  const files = await fs.readdir(CANONICAL_DIR);
  return files
    .filter((f) => f.endsWith(".canonical.md"))
    .map((f) => f.replace(/\.canonical\.md$/, ""))
    .sort();
}

export function isExcludedCanonicalDoc(filename: string): boolean {
  return EXCLUDE_CANONICAL.has(filename);
}

export function productionPath(lessonId: string): string {
  return path.join(PRODUCTION_DIR, `${lessonId}.ts`);
}

export function canonicalPath(lessonId: string): string {
  return path.join(CANONICAL_DIR, `${lessonId}.canonical.md`);
}

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  productionFile: string;
  canonicalFile: string;
}

export async function preflightLesson(
  lessonId: string,
  pathsIds: Set<string>,
): Promise<PreflightResult> {
  const errors: string[] = [];
  const productionFile = productionPath(lessonId);
  const canonicalFile = canonicalPath(lessonId);

  if (!pathsIds.has(lessonId)) {
    errors.push(`invalid lessonId — not in PATHS`);
  }
  if (ARCHIVED_LESSON_ID_SET.has(lessonId)) {
    errors.push(`archived lesson — excluded from learner path`);
  }
  try {
    await fs.access(productionFile);
  } catch {
    errors.push(`missing production lesson file`);
  }
  try {
    await fs.access(canonicalFile);
  } catch {
    errors.push(`missing canonical file`);
  }

  return {
    ok: errors.length === 0,
    errors,
    productionFile,
    canonicalFile,
  };
}
