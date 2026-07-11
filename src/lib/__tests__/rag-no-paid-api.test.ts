import path from "node:path";
import { describe, expect, it, vi, afterEach } from "vitest";
import { runRagPipeline } from "@/lib/rag/index";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("RAG no paid API invocation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs full pipeline without fetch or external calls", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("fetch should not be called"),
    );

    const report = runRagPipeline(REPO_ROOT, { dryRun: true });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(report.corpus.ok).toBe(true);
    expect(report.deterministicRerunEqual).toBe(true);
  });

  it("uses embedding model placeholder only", () => {
    const report = runRagPipeline(REPO_ROOT, { dryRun: true });
    expect(report.chunkManifestChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(report.packageManifestChecksum).toMatch(/^[a-f0-9]{64}$/);
  });
});
