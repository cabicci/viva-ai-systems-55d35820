import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverApprovedPackages } from "@/lib/rag/corpus-discovery";
import {
  analyzeChunkQuality,
  buildChunkId,
  splitTextIntoChunks,
} from "@/lib/rag/chunking";
import { generateAllChunks } from "@/lib/rag/manifests";
import { sha256Hex } from "@/lib/rag/checksum";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("RAG deterministic chunking", () => {
  const packages = discoverApprovedPackages(REPO_ROOT);

  it("produces identical chunks on repeated runs", () => {
    const run1 = generateAllChunks(REPO_ROOT, packages);
    const run2 = generateAllChunks(REPO_ROOT, packages);
    expect(run1).toEqual(run2);
  });

  it("has stable chunk IDs and checksums", () => {
    const chunks = generateAllChunks(REPO_ROOT, packages);
    expect(chunks.length).toBeGreaterThan(0);

    for (const chunk of chunks) {
      expect(chunk.chunkId).toBe(
        buildChunkId(chunk.locale, chunk.lessonId, chunk.sectionIndex, chunk.chunkIndex),
      );
      expect(chunk.textChecksum).toBe(sha256Hex(chunk.displayText));
    }
  });

  it("never mixes locales or lessons within chunk groups", () => {
    const chunks = generateAllChunks(REPO_ROOT, packages);
    const quality = analyzeChunkQuality(chunks);

    expect(quality.crossLocaleViolations).toHaveLength(0);
    expect(quality.crossLessonViolations).toHaveLength(0);
    expect(quality.emptyChunks).toHaveLength(0);
    expect(quality.duplicateChunks).toHaveLength(0);
  });

  it("preserves section role and heading metadata", () => {
    const chunks = generateAllChunks(REPO_ROOT, packages);
    for (const chunk of chunks) {
      expect(chunk.sectionRole).toBeTruthy();
      expect(chunk.sectionHeading).toBeTruthy();
      expect(chunk.contentType).toBeTruthy();
      expect(chunk.displayText.trim().length).toBeGreaterThan(0);
    }
  });

  it("splits large text deterministically", () => {
    const longText = "أ".repeat(2500);
    const parts1 = splitTextIntoChunks(longText);
    const parts2 = splitTextIntoChunks(longText);
    expect(parts1).toEqual(parts2);
    expect(parts1.length).toBeGreaterThan(1);
  });

  it("generates chunks for all 300 packages", () => {
    const chunks = generateAllChunks(REPO_ROOT, packages);
    const packagePaths = new Set(chunks.map((c) => c.packagePath));
    expect(packagePaths.size).toBe(300);
  });
});
