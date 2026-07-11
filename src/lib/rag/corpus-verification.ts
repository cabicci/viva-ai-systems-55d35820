import fs from "node:fs";
import path from "node:path";
import { ARCHIVED_LESSON_IDS } from "@/lib/archived-lessons";
import {
  AG4_ISSUE_ID_PATTERN,
  assertManifestInvariants,
  type ScientificCorrectionRecord,
} from "@/lib/locale-lessons/scientific-curriculum-corrections-manifest";
import {
  APPROVED_LOCALES,
  CONTENT_FREEZE_SHA,
  EXPECTED_AG4_RECORD_COUNT,
  EXPECTED_PACKAGES_PER_LOCALE,
  EXPECTED_TOTAL_PACKAGES,
  EXCLUDED_PATH_SEGMENTS,
  LOCALE_LESSONS_ROOT,
} from "./constants";
import { discoverApprovedPackages } from "./corpus-discovery";
import type { CorpusVerificationReport } from "./types";
import type { ApprovedLocale } from "./constants";

const AG4_FIXTURE_PATH =
  "src/lib/__tests__/fixtures/scientific-curriculum-corrections-manifest.json";

function loadAg4Fixture(repoRoot: string): ScientificCorrectionRecord[] {
  const fixturePath = path.join(repoRoot, AG4_FIXTURE_PATH);
  const records = JSON.parse(
    fs.readFileSync(fixturePath, "utf8"),
  ) as ScientificCorrectionRecord[];
  assertManifestInvariants(records);
  return records;
}

function findSupersededArtifacts(repoRoot: string): string[] {
  const found: string[] = [];
  const reportsDir = path.join(repoRoot, LOCALE_LESSONS_ROOT, "ar-MSA", "reports");

  if (!fs.existsSync(reportsDir)) return found;

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (entry.name === "phase13b-recovered-packages") {
          found.push(rel);
        }
        walk(full);
      } else if (rel.includes("phase13b-recovered-packages")) {
        found.push(rel);
      }
    }
  }

  walk(reportsDir);
  return [...new Set(found)].sort();
}

/** Deterministic read-only corpus verification. */
export function verifyCorpus(repoRoot: string): CorpusVerificationReport {
  const packages = discoverApprovedPackages(repoRoot);
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingMetadata: string[] = [];

  const localeCounts = Object.fromEntries(
    APPROVED_LOCALES.map((l) => [l, 0]),
  ) as Record<ApprovedLocale, number>;

  const uniqueLessons = Object.fromEntries(
    APPROVED_LOCALES.map((l) => [l, new Set<string>()]),
  ) as Record<ApprovedLocale, Set<string>>;

  const pathSet = new Set<string>();
  const duplicatePaths: string[] = [];
  const pairSet = new Set<string>();
  const duplicateLessonLocalePairs: string[] = [];

  for (const pkg of packages) {
    localeCounts[pkg.locale as ApprovedLocale]++;
    uniqueLessons[pkg.locale as ApprovedLocale].add(pkg.lessonId);

    if (pathSet.has(pkg.packagePath)) {
      duplicatePaths.push(pkg.packagePath);
    }
    pathSet.add(pkg.packagePath);

    const pair = `${pkg.locale}/${pkg.lessonId}`;
    if (pairSet.has(pair)) {
      duplicateLessonLocalePairs.push(pair);
    }
    pairSet.add(pair);

    if (!pkg.moduleId || pkg.moduleId === "unknown") {
      missingMetadata.push(`${pkg.packagePath}: moduleId`);
    }
    if (!pkg.trackId || pkg.trackId === "unknown") {
      missingMetadata.push(`${pkg.packagePath}: trackId`);
    }
    if (!pkg.canonicalVersion) {
      warnings.push(`${pkg.packagePath}: canonicalVersion missing`);
    }
  }

  if (packages.length !== EXPECTED_TOTAL_PACKAGES) {
    errors.push(
      `Expected ${EXPECTED_TOTAL_PACKAGES} packages, found ${packages.length}`,
    );
  }

  for (const locale of APPROVED_LOCALES) {
    if (localeCounts[locale] !== EXPECTED_PACKAGES_PER_LOCALE) {
      errors.push(
        `Locale ${locale}: expected ${EXPECTED_PACKAGES_PER_LOCALE}, found ${localeCounts[locale]}`,
      );
    }
    if (uniqueLessons[locale].size !== EXPECTED_PACKAGES_PER_LOCALE) {
      errors.push(
        `Locale ${locale}: expected ${EXPECTED_PACKAGES_PER_LOCALE} unique lessons, found ${uniqueLessons[locale].size}`,
      );
    }
  }

  let ag4Records: ScientificCorrectionRecord[] = [];
  let ag4RecordsPresent = false;
  try {
    ag4Records = loadAg4Fixture(repoRoot);
    ag4RecordsPresent = ag4Records.length === EXPECTED_AG4_RECORD_COUNT;

    for (const record of ag4Records) {
      if (!AG4_ISSUE_ID_PATTERN.test(record.issueId)) {
        errors.push(`Invalid AG4 issue ID: ${record.issueId}`);
      }
      const runtimePath = path.join(repoRoot, record.runtimePackagePath);
      if (!fs.existsSync(runtimePath)) {
        errors.push(`AG4 runtime package missing: ${record.runtimePackagePath}`);
      }
    }
  } catch (e) {
    errors.push(`AG4 fixture load failed: ${(e as Error).message}`);
  }

  const supersededExcluded = findSupersededArtifacts(repoRoot);
  const archivedExcluded = [...ARCHIVED_LESSON_IDS];

  for (const pkg of packages) {
    if (ARCHIVED_LESSON_IDS.includes(pkg.lessonId as (typeof ARCHIVED_LESSON_IDS)[number])) {
      errors.push(`Archived lesson in corpus: ${pkg.lessonId}`);
    }
    for (const segment of EXCLUDED_PATH_SEGMENTS) {
      if (pkg.packagePath.includes(`/${segment}/`)) {
        errors.push(`Excluded path segment in corpus: ${pkg.packagePath}`);
      }
    }
  }

  const uniqueLessonCounts = Object.fromEntries(
    APPROVED_LOCALES.map((l) => [l, uniqueLessons[l].size]),
  ) as Record<ApprovedLocale, number>;

  return {
    ok: errors.length === 0,
    sourceSha: CONTENT_FREEZE_SHA,
    totalPackages: packages.length,
    localeCounts,
    uniqueLessonCounts,
    ag4RecordCount: ag4Records.length,
    ag4RecordsPresent,
    archivedExcluded,
    supersededExcluded,
    duplicatePaths,
    duplicateLessonLocalePairs,
    missingMetadata,
    errors,
    warnings,
  };
}
