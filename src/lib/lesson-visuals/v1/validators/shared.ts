/** Shared paths + primitives for the lesson-visuals v1 local validators. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { LessonVisualMaster } from "../types";
import { BANNED_GENERIC_LABELS, LOCALES } from "../types";
import { canonicalChecksum } from "../scripts/canonical";

function moduleDir(): string {
  if (typeof import.meta.dirname === "string") return import.meta.dirname;
  if (typeof import.meta.dir === "string") return import.meta.dir;
  return fileURLToPath(new URL(".", import.meta.url));
}

export const REPO_ROOT = resolve(moduleDir(), "../../../../..");
export const DOCS_V1 = resolve(REPO_ROOT, "docs/lesson-visuals/v1");
export const MASTERS_DIR = resolve(REPO_ROOT, "docs/lesson-visuals/v1/masters");
export const MANIFEST_PATH = resolve(REPO_ROOT, "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json");
export const FONTS_DIR = resolve(REPO_ROOT, "src/lib/lesson-visuals/v1/fonts");

export interface ValidationIssue {
  gate: string;
  lessonId?: string;
  cellId?: string;
  message: string;
}

export function loadJson<T>(absPath: string): T {
  return JSON.parse(readFileSync(absPath, "utf8")) as T;
}

export function verifyMasterChecksum(master: LessonVisualMaster): boolean {
  const { checksum, ...rest } = master;
  return canonicalChecksum(rest) === checksum;
}

export function assertSourceExists(master: LessonVisualMaster): string[] {
  const errors: string[] = [];
  for (const locale of LOCALES) {
    const sp = master.sourcePackages[locale];
    const abs = resolve(REPO_ROOT, sp.path);
    if (!existsSync(abs)) {
      errors.push(`missing source file: ${sp.path} (${locale})`);
    }
  }
  return errors;
}

const fileCache = new Map<string, string | null>();

function readFileCached(absPath: string): string | null {
  if (fileCache.has(absPath)) return fileCache.get(absPath) ?? null;
  try {
    const text = readFileSync(absPath, "utf8");
    fileCache.set(absPath, text);
    return text;
  } catch {
    fileCache.set(absPath, null);
    return null;
  }
}

export function quoteInFile(absPath: string, quote: string): boolean {
  if (!quote || quote.trim().length === 0) return false;
  const text = readFileCached(absPath);
  if (text === null) return false;
  return text.includes(quote);
}

export function isBannedLabel(text: string): boolean {
  const t = text.trim();
  if (t.length === 0) return true;
  return (BANNED_GENERIC_LABELS as readonly string[]).some((b) => b.toLowerCase() === t.toLowerCase());
}

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/g;
const LATIN_RE = /[A-Za-z]/g;

export function arabicCharRatio(text: string): number {
  const letters = text.replace(/[^A-Za-z\u0600-\u06FF\u0750-\u077F]/g, "");
  if (letters.length === 0) return 0;
  return (text.match(ARABIC_RE)?.length ?? 0) / letters.length;
}

export function latinCharRatio(text: string): number {
  const letters = text.replace(/[^A-Za-z\u0600-\u06FF\u0750-\u077F]/g, "");
  if (letters.length === 0) return 0;
  return (text.match(LATIN_RE)?.length ?? 0) / letters.length;
}
