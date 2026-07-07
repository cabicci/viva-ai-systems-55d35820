/**
 * Deep semantic JSON diff for Phase 13B recovered packages.
 * Ignores key order; compares parsed values recursively.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type SemanticChangeCategory =
  | "table_row_reconstruction"
  | "mission_delivery_restoration"
  | "quiz_option_prefix_removal"
  | "quiz_markdown_artifact_cleanup"
  | "quiz_structure_restoration"
  | "section_role_alignment"
  | "sections_array_change"
  | "quiz_correct_index"
  | "learner_text_change"
  | "metadata_change"
  | "other";

export interface SemanticJsonChange {
  pointer: string;
  before: unknown;
  after: unknown;
  category: SemanticChangeCategory;
}

export interface PackageSemanticDiff {
  locale: string;
  lessonId: string;
  relPath: string;
  semanticallyIdentical: boolean;
  gitModified: boolean;
  changes: SemanticJsonChange[];
}

export interface SemanticDiffManifest {
  generatedAt: string;
  baseRef: string;
  headRef: string;
  packagesScanned: number;
  gitModifiedCount: number;
  semanticallyIdenticalCount: number;
  semanticChangePackageCount: number;
  formattingOnlyCount: number;
  changesByCategory: Record<SemanticChangeCategory, number>;
  changesByPointerPattern: Record<string, number>;
  packages: PackageSemanticDiff[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (!isObject(value)) return value;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortKeysDeep(value[key]);
  }
  return sorted;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(sortKeysDeep(a)) === JSON.stringify(sortKeysDeep(b));
}

function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function classifyPointer(pointer: string, before: unknown, after: unknown): SemanticChangeCategory {
  if (pointer === "/sections" || pointer.startsWith("/sections/") && pointer.includes("/role")) {
    return "section_role_alignment";
  }
  if (/\/tables\/\d+\/rows/.test(pointer)) {
    return "table_row_reconstruction";
  }
  if (/\/mission\/delivery/.test(pointer)) {
    return "mission_delivery_restoration";
  }
  if (pointer.endsWith("/correctIndex")) {
    return "quiz_correct_index";
  }
  if (/\/quiz\/options\//.test(pointer)) {
    const beforeText = String(before ?? "");
    const afterText = String(after ?? "");
    if (
      /\*\*\.\*\*/.test(beforeText) ||
      /Option\s*\d+|correct answer|الإجابة الصحيحة|خيار\s*\d/i.test(beforeText)
    ) {
      return "quiz_option_prefix_removal";
    }
    if (stripMarkdownEmphasis(beforeText) === stripMarkdownEmphasis(afterText)) {
      return "quiz_markdown_artifact_cleanup";
    }
    return "learner_text_change";
  }
  if (/\/quiz\/(question|explanation)/.test(pointer)) {
    if (/\*\*\.\*\*/.test(String(before ?? ""))) {
      return "quiz_markdown_artifact_cleanup";
    }
    if (
      stripMarkdownEmphasis(String(before ?? "")) ===
      stripMarkdownEmphasis(String(after ?? ""))
    ) {
      return "quiz_markdown_artifact_cleanup";
    }
    return "learner_text_change";
  }
  if (/\/sections\/\d+\/(bullets|contentMarkdown)/.test(pointer)) {
    const beforeText = String(before ?? "");
    const afterText = String(after ?? "");
    if (/\*\*\.\*\*/.test(beforeText)) {
      return "quiz_markdown_artifact_cleanup";
    }
    if (
      /الإجابة الصحيحة|Correct answer|Correct Answer|The correct answer/i.test(
        beforeText,
      )
    ) {
      return "quiz_option_prefix_removal";
    }
    if (stripMarkdownEmphasis(beforeText) === stripMarkdownEmphasis(afterText)) {
      return "quiz_markdown_artifact_cleanup";
    }
    return "learner_text_change";
  }
  if (
    /\/(contentMarkdown|bullets|heading|subtitle|intro|criteria|title|summary)/.test(pointer)
  ) {
    if (/\*\*\.\*\*/.test(String(before ?? ""))) {
      return "quiz_markdown_artifact_cleanup";
    }
    if (
      stripMarkdownEmphasis(String(before ?? "")) ===
      stripMarkdownEmphasis(String(after ?? ""))
    ) {
      return "quiz_markdown_artifact_cleanup";
    }
    return "learner_text_change";
  }
  if (
    /\/(lessonId|pathId|moduleId|productionRoute|nextLessonId|canonicalVersion|estimatedMinutes|locale)/.test(
      pointer,
    )
  ) {
    return "metadata_change";
  }
  if (pointer.startsWith("/sections")) {
    return "sections_array_change";
  }
  return "other";
}

function diffValues(
  before: unknown,
  after: unknown,
  pointer: string,
  out: SemanticJsonChange[],
): void {
  if (deepEqual(before, after)) return;

  if (Array.isArray(before) && Array.isArray(after)) {
    const max = Math.max(before.length, after.length);
    for (let i = 0; i < max; i++) {
      diffValues(before[i], after[i], `${pointer}/${i}`, out);
    }
    return;
  }

  if (isObject(before) && isObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of [...keys].sort()) {
      diffValues(before[key], after[key], `${pointer}/${key}`, out);
    }
    return;
  }

  out.push({
    pointer,
    before,
    after,
    category: classifyPointer(pointer, before, after),
  });
}

export function diffPackages(
  beforePkg: unknown,
  afterPkg: unknown,
): SemanticJsonChange[] {
  const changes: SemanticJsonChange[] = [];
  diffValues(beforePkg, afterPkg, "", changes);
  return changes.map((c) => ({
    ...c,
    pointer: c.pointer || "/",
  }));
}

export function isAllowedMechanicalChange(change: SemanticJsonChange): boolean {
  const allowed: SemanticChangeCategory[] = [
    "table_row_reconstruction",
    "mission_delivery_restoration",
    "quiz_option_prefix_removal",
    "quiz_markdown_artifact_cleanup",
    "quiz_structure_restoration",
    "section_role_alignment",
    "sections_array_change",
  ];
  return allowed.includes(change.category);
}

export function summarizePointerPattern(pointer: string): string {
  return pointer
    .replace(/\/\d+/g, "/*")
    .replace(/\/[a-f0-9-]{36}/gi, "/*");
}

export async function readJsonFromGit(ref: string, relPath: string): Promise<unknown | null> {
  const { execSync } = await import("node:child_process");
  try {
    const raw = execSync(`git show ${ref}:${relPath}`, { encoding: "utf8" });
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function buildSemanticDiffManifest(options: {
  repoRoot: string;
  baseRef?: string;
  headRef?: string;
  packageRelPaths: string[];
  gitModifiedRelPaths?: Set<string>;
}): Promise<SemanticDiffManifest> {
  const baseRef = options.baseRef ?? "origin/main";
  const headRef = options.headRef ?? "HEAD";
  const gitModified = options.gitModifiedRelPaths ?? new Set<string>();

  const packages: PackageSemanticDiff[] = [];
  const changesByCategory = {} as Record<SemanticChangeCategory, number>;
  const changesByPointerPattern: Record<string, number> = {};

  for (const relPath of options.packageRelPaths) {
    const parts = relPath.replace(/\\/g, "/").split("/");
    const locale = parts.at(-2) ?? "";
    const lessonId = path.basename(parts.at(-1) ?? "", ".json");

    const before = await readJsonFromGit(baseRef, relPath);
    const afterRaw = await fs.readFile(path.join(options.repoRoot, relPath), "utf8");
    const after = JSON.parse(afterRaw) as unknown;

    const changes =
      before === null ? diffPackages({}, after) : diffPackages(before, after);
    const semanticallyIdentical = changes.length === 0;
    const gitModifiedFlag = gitModified.has(relPath);

    for (const change of changes) {
      changesByCategory[change.category] = (changesByCategory[change.category] ?? 0) + 1;
      const pattern = summarizePointerPattern(change.pointer);
      changesByPointerPattern[pattern] = (changesByPointerPattern[pattern] ?? 0) + 1;
    }

    if (changes.length > 0 || gitModifiedFlag) {
      packages.push({
        locale,
        lessonId,
        relPath,
        semanticallyIdentical,
        gitModified: gitModifiedFlag,
        changes,
      });
    }
  }

  const semanticChangePackageCount = packages.filter((p) => !p.semanticallyIdentical).length;
  const formattingOnlyCount = packages.filter(
    (p) => p.semanticallyIdentical && p.gitModified,
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    baseRef,
    headRef,
    packagesScanned: options.packageRelPaths.length,
    gitModifiedCount: gitModified.size,
    semanticallyIdenticalCount: options.packageRelPaths.length - semanticChangePackageCount,
    semanticChangePackageCount,
    formattingOnlyCount,
    changesByCategory,
    changesByPointerPattern,
    packages: packages.sort((a, b) => a.relPath.localeCompare(b.relPath)),
  };
}
