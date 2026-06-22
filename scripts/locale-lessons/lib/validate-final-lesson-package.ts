/**
 * Final disk-level validator for sanitized fragment-pilot lesson packages.
 *
 * Re-reads the lesson JSON from disk (NOT from memory) and asserts that
 * no banned production-leak substrings or unbalanced ** markers remain.
 * This is the last line of defense — per-job result.json files cannot be
 * trusted on their own.
 */
import { promises as fs } from "node:fs";
import { PRODUCTION_LEAK_SUBSTRINGS } from "./sanitize-final-lesson-package.ts";

export interface FinalLessonValidation {
  ok: boolean;
  filePath: string;
  bannedHits: string[];
  unbalancedFields: string[];
}

const BANNED_SUBSTRINGS = [
  ...PRODUCTION_LEAK_SUBSTRINGS,
  "Option 1:",
  "Option 2:",
  "Option 3:",
  "Option 4:",
  "Correct answer (Option",
  "خيار ١:",
  "خيار ٢:",
  "خيار ٣:",
  "خيار ٤:",
  "الإجابة الصحيحة (خيار",
];

export const BANNED_PATTERNS = BANNED_SUBSTRINGS;

function findUnbalanced(node: unknown, pathStr: string, out: string[]): void {
  if (typeof node === "string") {
    const bold = (node.match(/\*\*/g) ?? []).length;
    if (bold % 2 !== 0) out.push(pathStr);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => findUnbalanced(v, `${pathStr}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      findUnbalanced(v, pathStr ? `${pathStr}.${k}` : k, out);
    }
  }
}

export async function validateFinalLessonFile(
  filePath: string,
): Promise<FinalLessonValidation> {
  const raw = await fs.readFile(filePath, "utf8");
  const bannedHits: string[] = [];
  for (const needle of BANNED_SUBSTRINGS) {
    if (raw.includes(needle)) bannedHits.push(needle);
  }
  const parsed = JSON.parse(raw);
  const unbalancedFields: string[] = [];
  findUnbalanced(parsed, "", unbalancedFields);
  return {
    ok: bannedHits.length === 0 && unbalancedFields.length === 0,
    filePath,
    bannedHits,
    unbalancedFields,
  };
}
