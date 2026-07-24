import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeRagArtifacts } from "@/lib/rag/manifests";
import { RAG_MANIFEST_GENERATED_AT } from "@/lib/rag/constants";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("byte-deterministic RAG manifests", () => {
  it("uses fixed RAG_MANIFEST_GENERATED_AT and no live Date in manifests.ts", () => {
    const src = fs.readFileSync(path.join(REPO_ROOT, "src/lib/rag/manifests.ts"), "utf8");
    expect(src).toContain("RAG_MANIFEST_GENERATED_AT");
    expect(src).not.toMatch(/new Date\(\)\.toISOString\(\)/);
    expect(src).not.toMatch(/Date\.now\(\)/);
    expect(RAG_MANIFEST_GENERATED_AT).toBe("1970-01-01T00:00:00.000Z");
  });

  it("double-generates byte-identical package/chunk/chunks artifacts", () => {
    const dirA = fs.mkdtempSync(path.join(os.tmpdir(), "rag-det-a-"));
    const dirB = fs.mkdtempSync(path.join(os.tmpdir(), "rag-det-b-"));
    const relA = path.relative(REPO_ROOT, dirA).replace(/\\/g, "/");
    const relB = path.relative(REPO_ROOT, dirB).replace(/\\/g, "/");

    const a = writeRagArtifacts(REPO_ROOT, relA);
    const b = writeRagArtifacts(REPO_ROOT, relB);

    expect(a.packageManifest.generatedAt).toBe(RAG_MANIFEST_GENERATED_AT);
    expect(b.chunkManifest.generatedAt).toBe(RAG_MANIFEST_GENERATED_AT);
    expect(a.packageManifest.manifestChecksum).toBe(b.packageManifest.manifestChecksum);
    expect(a.chunkManifest.manifestChecksum).toBe(b.chunkManifest.manifestChecksum);

    for (const name of ["package-manifest.json", "chunk-manifest.json", "chunks.json"] as const) {
      const bytesA = fs.readFileSync(path.join(dirA, name));
      const bytesB = fs.readFileSync(path.join(dirB, name));
      expect(bytesA.equals(bytesB)).toBe(true);
      const digestA = createHash("sha256").update(bytesA).digest("hex");
      const digestB = createHash("sha256").update(bytesB).digest("hex");
      expect(digestA).toBe(digestB);
    }

    fs.rmSync(dirA, { recursive: true, force: true });
    fs.rmSync(dirB, { recursive: true, force: true });
  }, 180000);
});
