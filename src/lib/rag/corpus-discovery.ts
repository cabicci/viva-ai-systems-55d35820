import fs from "node:fs";
import path from "node:path";
import { ARCHIVED_LESSON_ID_SET } from "@/lib/archived-lessons";
import type { RagLocalizedLessonPackage } from "@/lib/locale-lessons/types";
import {
  APPROVED_LOCALES,
  CONTENT_FREEZE_SHA,
  EXCLUDED_PATH_SEGMENTS,
  LOCALE_LESSONS_ROOT,
} from "./constants";
import { sha256Hex } from "./checksum";
import type { ApprovedPackageRecord } from "./types";

export function isExcludedPackagePath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  if (!normalized.startsWith(`${LOCALE_LESSONS_ROOT}/`)) return true;
  if (!normalized.endsWith(".json")) return true;
  for (const segment of EXCLUDED_PATH_SEGMENTS) {
    if (normalized.includes(`/${segment}/`)) return true;
  }
  return false;
}

export function runtimePackagePath(locale: string, lessonId: string): string {
  return `${LOCALE_LESSONS_ROOT}/${locale}/lessons/${lessonId}.json`;
}

function parsePackage(absolutePath: string, relativePath: string): ApprovedPackageRecord | null {
  const raw = fs.readFileSync(absolutePath, "utf8");
  const pkg = JSON.parse(raw) as RagLocalizedLessonPackage;

  if (!pkg.lessonId || !pkg.locale) return null;
  if (ARCHIVED_LESSON_ID_SET.has(pkg.lessonId)) return null;

  const trackId = pkg.pathId ?? "unknown";
  const moduleId = pkg.moduleId ?? "unknown";

  return {
    lessonId: pkg.lessonId,
    locale: pkg.locale,
    moduleId,
    trackId,
    packagePath: relativePath.replace(/\\/g, "/"),
    productionRoute: pkg.productionRoute ?? null,
    sourceSha: CONTENT_FREEZE_SHA,
    packageChecksum: sha256Hex(raw),
    canonicalVersion: pkg.canonicalVersion ?? null,
    title: pkg.title,
  };
}

/** Discover approved runtime packages from locale-lessons directories. */
export function discoverApprovedPackages(repoRoot: string): ApprovedPackageRecord[] {
  const packages: ApprovedPackageRecord[] = [];

  for (const locale of APPROVED_LOCALES) {
    const lessonsDir = path.join(repoRoot, LOCALE_LESSONS_ROOT, locale, "lessons");
    if (!fs.existsSync(lessonsDir)) continue;

    const files = fs
      .readdirSync(lessonsDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    for (const file of files) {
      const absolutePath = path.join(lessonsDir, file);
      const relativePath = path.relative(repoRoot, absolutePath).replace(/\\/g, "/");

      if (isExcludedPackagePath(relativePath)) continue;

      const record = parsePackage(absolutePath, relativePath);
      if (record) packages.push(record);
    }
  }

  packages.sort((a, b) =>
    a.locale === b.locale ? a.lessonId.localeCompare(b.lessonId) : a.locale.localeCompare(b.locale),
  );

  return packages;
}

/** Load a single approved package by path. */
export function loadPackageByPath(
  repoRoot: string,
  packagePath: string,
): RagLocalizedLessonPackage {
  const absolute = path.join(repoRoot, packagePath);
  return JSON.parse(fs.readFileSync(absolute, "utf8")) as RagLocalizedLessonPackage;
}
