import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverApprovedPackages } from "@/lib/rag/corpus-discovery";
import { generateAllChunks } from "@/lib/rag/manifests";
import {
  buildPackageManifest,
  buildChunkManifest,
} from "@/lib/rag/manifests";
import {
  planReindex,
  planSupersededChunkCleanup,
} from "@/lib/rag/reindex-planning";
import { CONTENT_FREEZE_SHA } from "@/lib/rag/constants";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("RAG manifest and reindex planning", () => {
  const packages = discoverApprovedPackages(REPO_ROOT);
  const chunks = generateAllChunks(REPO_ROOT, packages);

  it("builds reproducible package manifest", () => {
    const m1 = buildPackageManifest(REPO_ROOT, packages, chunks);
    const m2 = buildPackageManifest(REPO_ROOT, packages, chunks);
    expect(m1.manifestChecksum).toBe(m2.manifestChecksum);
    expect(m1.packageCount).toBe(300);
    expect(m1.sourceSha).toBe(CONTENT_FREEZE_SHA);
  });

  it("builds reproducible chunk manifest", () => {
    const m1 = buildChunkManifest(chunks);
    const m2 = buildChunkManifest(chunks);
    expect(m1.manifestChecksum).toBe(m2.manifestChecksum);
    expect(m1.chunkCount).toBe(chunks.length);
    expect(m1.embeddingModel).toBe("text-embedding-3-small");
  });

  it("skips unchanged packages on checksum match", () => {
    const manifest = buildPackageManifest(REPO_ROOT, packages, chunks);
    const plan = planReindex(manifest, manifest, { dryRun: true });
    expect(plan.skipCount).toBe(300);
    expect(plan.reindexCount).toBe(0);
    expect(plan.deleteCount).toBe(0);
  });

  it("detects changed packages", () => {
    const manifest = buildPackageManifest(REPO_ROOT, packages, chunks);
    const modified = structuredClone(manifest);
    modified.packages[0] = {
      ...modified.packages[0],
      packageChecksum: "0".repeat(64),
    };
    const plan = planReindex(modified, manifest, { dryRun: true });
    expect(plan.reindexCount).toBe(1);
    expect(plan.skipCount).toBe(299);
  });

  it("detects new packages not in previous manifest", () => {
    const manifest = buildPackageManifest(REPO_ROOT, packages, chunks);
    const reduced = structuredClone(manifest);
    reduced.packages = reduced.packages.slice(1);
    const plan = planReindex(manifest, reduced, { dryRun: true });
    expect(plan.reindexCount).toBe(1);
    expect(plan.skipCount).toBe(299);
    expect(plan.deleteCount).toBe(0);
  });

  it("plans deletion for packages removed from corpus", () => {
    const manifest = buildPackageManifest(REPO_ROOT, packages, chunks);
    const expanded = structuredClone(manifest);
    expanded.packages = [
      {
        ...manifest.packages[0],
        packagePath: "src/lib/locale-lessons/en/lessons/removed-lesson.json",
        lessonId: "removed-lesson",
        packageChecksum: "deadbeef",
      },
      ...manifest.packages,
    ];
    const plan = planReindex(manifest, expanded, { dryRun: true });
    expect(plan.deleteCount).toBe(1);
  });

  it("supports retry-only-failed mode", () => {
    const manifest = buildPackageManifest(REPO_ROOT, packages, chunks);
    const failedPath = manifest.packages[0].packagePath;
    const plan = planReindex(manifest, manifest, {
      dryRun: true,
      failedUnits: [failedPath],
      retryOnlyFailed: true,
    });
    expect(plan.retryCount).toBe(1);
    expect(plan.skipCount).toBe(299);
  });

  it("identifies superseded chunk IDs for cleanup", () => {
    const previous = buildChunkManifest(chunks);
    const current = structuredClone(previous);
    current.chunks = current.chunks.slice(10);
    const orphans = planSupersededChunkCleanup(current, previous);
    expect(orphans).toHaveLength(10);
  });
});
