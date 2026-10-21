import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadReindexBaseline, planReindex } from "@/lib/rag/reindex-planning";
import type { PackageManifest } from "@/lib/rag/types";
import { runReindexPlan } from "@/lib/rag/indexing";

const discovery = vi.hoisted(() => ({ discover: vi.fn(), chunks: vi.fn(), manifest: vi.fn() }));
vi.mock("@/lib/rag/corpus-discovery", () => ({ discoverApprovedPackages: discovery.discover }));
vi.mock("@/lib/rag/manifests", () => ({ generateAllChunks: discovery.chunks, buildPackageManifest: discovery.manifest, buildChunkManifest: vi.fn() }));
const root = path.resolve(import.meta.dirname, "../../..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "artifacts/rag/package-manifest.json"), "utf8")) as PackageManifest;
const directories: string[] = [];
function baseline(value: unknown = fixture) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "masaarat-reindex-baseline-"));
  directories.push(directory);
  fs.writeFileSync(path.join(directory, "previous.json"), JSON.stringify(value));
  return directory;
}
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe("explicit reindex baseline and metadata diff", () => {
  it("requires an explicit previous manifest or initial-index choice before discovery", () => {
    expect(() => runReindexPlan(root)).toThrow("explicit --baseline");
    expect(discovery.discover).not.toHaveBeenCalled();
    expect(() => loadReindexBaseline(root, { initialIndex: true, baselinePath: "previous.json" })).toThrow("not both");
    expect(() => loadReindexBaseline(root, { baselinePath: "missing-baseline.json" })).toThrow("not found");
    expect(loadReindexBaseline(root, { initialIndex: true })).toBeNull();
  });

  it("compares discovered current packages to the supplied baseline, never current to itself", () => {
    const previous = structuredClone(fixture);
    previous.packages = fixture.packages.slice(1);
    const directory = baseline(previous);
    discovery.discover.mockReturnValue([]);
    discovery.chunks.mockReturnValue([]);
    discovery.manifest.mockReturnValue(fixture);
    const report = runReindexPlan(directory, { baselinePath: "previous.json" });
    expect(report.reindexCount).toBe(1);
    expect(report.skipCount).toBe(fixture.packages.length - 1);
  });

  it("rejects malformed or duplicate baseline identity", () => {
    expect(() => loadReindexBaseline(baseline({ packages: [] }), { baselinePath: "previous.json" })).toThrow("Invalid reindex");
    const duplicate = { ...fixture, packages: [fixture.packages[0], fixture.packages[0]] };
    expect(() => loadReindexBaseline(baseline(duplicate), { baselinePath: "previous.json" })).toThrow("duplicate package");
  });

  it("reindexes moved membership/route metadata while allowing unchanged content reuse", () => {
    for (const field of ["trackId", "moduleId", "productionRoute", "canonicalVersion"] as const) {
      const changed = structuredClone(fixture);
      changed.packages[0][field] = "updated";
      const report = planReindex(changed, fixture);
      expect(report.reindexCount).toBe(1);
      expect(report.entries.find((entry) => entry.action === "reindex")?.reason).toContain("reuse unchanged content");
    }
  });

  it("separately plans new, changed, unchanged and removed packages", () => {
    const previous = { ...fixture, packages: fixture.packages.slice(0, 3) };
    const current = { ...fixture, packages: [fixture.packages[0], { ...fixture.packages[1], packageChecksum: "a".repeat(64) }, fixture.packages[3]] };
    const report = planReindex(current, previous);
    expect([report.skipCount, report.reindexCount, report.deleteCount]).toEqual([1, 2, 1]);
    expect(report.entries.find((entry) => entry.action === "delete")?.packagePath).toBe(fixture.packages[2].packagePath);
  });
});
