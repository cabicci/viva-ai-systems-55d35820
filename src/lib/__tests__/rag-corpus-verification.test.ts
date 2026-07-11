import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONTENT_FREEZE_SHA,
  EXPECTED_AG4_RECORD_COUNT,
  EXPECTED_PACKAGES_PER_LOCALE,
  EXPECTED_TOTAL_PACKAGES,
} from "@/lib/rag/constants";
import { discoverApprovedPackages, isExcludedPackagePath } from "@/lib/rag/corpus-discovery";
import { verifyCorpus } from "@/lib/rag/corpus-verification";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("RAG corpus verification", () => {
  it("discovers exactly 300 approved runtime packages", () => {
    const packages = discoverApprovedPackages(REPO_ROOT);
    expect(packages).toHaveLength(EXPECTED_TOTAL_PACKAGES);
  });

  it("has 100 packages per locale", () => {
    const report = verifyCorpus(REPO_ROOT);
    expect(report.localeCounts.en).toBe(EXPECTED_PACKAGES_PER_LOCALE);
    expect(report.localeCounts["ar-MSA"]).toBe(EXPECTED_PACKAGES_PER_LOCALE);
    expect(report.localeCounts["ar-Gulf"]).toBe(EXPECTED_PACKAGES_PER_LOCALE);
  });

  it("has unique lessonId/locale pairs", () => {
    const report = verifyCorpus(REPO_ROOT);
    expect(report.duplicateLessonLocalePairs).toHaveLength(0);
    expect(report.duplicatePaths).toHaveLength(0);
    expect(report.uniqueLessonCounts.en).toBe(100);
    expect(report.uniqueLessonCounts["ar-MSA"]).toBe(100);
    expect(report.uniqueLessonCounts["ar-Gulf"]).toBe(100);
  });

  it("confirms all 40 Agent 4 corrected records", () => {
    const report = verifyCorpus(REPO_ROOT);
    expect(report.ag4RecordCount).toBe(EXPECTED_AG4_RECORD_COUNT);
    expect(report.ag4RecordsPresent).toBe(true);
  });

  it("excludes archived and superseded artifacts", () => {
    const report = verifyCorpus(REPO_ROOT);
    expect(report.archivedExcluded).toHaveLength(4);
    expect(report.supersededExcluded.length).toBeGreaterThan(0);

    const packages = discoverApprovedPackages(REPO_ROOT);
    for (const pkg of packages) {
      expect(isExcludedPackagePath(pkg.packagePath)).toBe(false);
      expect(pkg.packagePath).not.toMatch(/phase13b-recovered-packages/);
      expect(pkg.packagePath).not.toMatch(/\/reports\//);
    }
  });

  it("tracks Content Freeze SHA as source", () => {
    const report = verifyCorpus(REPO_ROOT);
    expect(report.sourceSha).toBe(CONTENT_FREEZE_SHA);
    expect(report.ok).toBe(true);
  });

  it("requires metadata on all packages", () => {
    const packages = discoverApprovedPackages(REPO_ROOT);
    for (const pkg of packages) {
      expect(pkg.lessonId).toBeTruthy();
      expect(pkg.locale).toBeTruthy();
      expect(pkg.moduleId).not.toBe("unknown");
      expect(pkg.trackId).not.toBe("unknown");
      expect(pkg.packageChecksum).toMatch(/^[a-f0-9]{64}$/);
      expect(pkg.sourceSha).toBe(CONTENT_FREEZE_SHA);
    }
  });
});
