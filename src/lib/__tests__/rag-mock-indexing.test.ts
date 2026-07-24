import path from "node:path";
import { describe, expect, it } from "vitest";
import { runMockIndexingFlow } from "@/lib/rag/indexing";
import { MockRagIndexStore } from "@/lib/rag/mock-index-store";
import { discoverApprovedPackages } from "@/lib/rag/corpus-discovery";
import { generateAllChunks } from "@/lib/rag/manifests";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("RAG mock indexing and activation", () => {
  it("runs full staging → activation → rollback flow", () => {
    const report = runMockIndexingFlow(REPO_ROOT);
    expect(report.packageCount).toBe(400);
    expect(report.chunkCount).toBe(3700);
    expect(report.inserted).toBe(3700);
    expect(report.skipped).toBe(3700);
    expect(report.activationOk).toBe(true);
    expect(report.rollbackOk).toBe(true);
    expect(report.singleActiveEnforced).toBe(true);
  }, 120000);

  it("denies activation when failed units remain", () => {
    const packages = discoverApprovedPackages(REPO_ROOT);
    const chunks = generateAllChunks(REPO_ROOT, packages);
    const failedPath = packages[0].packagePath;
    const report = runMockIndexingFlow(REPO_ROOT, chunks, {
      simulateFailedPackage: failedPath,
    });
    expect(report.failedActivationDenied).toBe(true);
    expect(report.activationOk).toBe(true);
  }, 120000);

  it("enforces single active version", () => {
    const store = new MockRagIndexStore();
    store.createStagingVersion({
      versionKey: "v1",
      packageCount: 1,
      chunkCount: 1,
      chunkManifestChecksum: "abc",
    });
    store.createStagingVersion({
      versionKey: "v2",
      packageCount: 1,
      chunkCount: 1,
      chunkManifestChecksum: "def",
    });
    // Manually activate without chunks for structure test
    store.versions.get("v1")!.chunkCount = 0;
    store.activateVersion("v1");
    store.versions.get("v2")!.chunkCount = 0;
    store.activateVersion("v2");
    const active = [...store.versions.values()].filter((v) => v.status === "active");
    expect(active).toHaveLength(1);
    expect(active[0].versionKey).toBe("v2");
  });
});
