// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeNextImportBatch, createOpenAiEmbeddingFetcher } from "@/lib/rag/lovable-native/executor.server";
import { LOCKED_EMBEDDING_DIMENSIONS, LOCKED_EMBEDDING_MODEL, LOCKED_SOURCE_SHA } from "@/lib/rag/lovable-native/contracts";
import type { PackageManifest, RagChunkRecord } from "@/lib/rag/types";

const loader = vi.hoisted(() => vi.fn());
vi.mock("@/lib/rag/lovable-native/corpus.server", () => ({ loadLockedCorpus: loader }));
const root = path.resolve(import.meta.dirname, "../../..");
const fixtureChunks = (JSON.parse(fs.readFileSync(path.join(root, "artifacts/rag/chunks.json"), "utf8")) as RagChunkRecord[]).filter(c => c.locale === "en").slice(0, 8);
const manifest = JSON.parse(fs.readFileSync(path.join(root, "artifacts/rag/package-manifest.json"), "utf8")) as PackageManifest;
const vec = (n = 0.25) => Array.from({ length: LOCKED_EMBEDDING_DIMENSIONS }, () => n);
const target = "new-staging-fixture";
function candidate(chunk: RagChunkRecord) {
  return { chunkId: chunk.chunkId, pathId: chunk.trackId, lessonId: chunk.lessonId,
    content: chunk.displayText, chunkChecksum: chunk.textChecksum, embedding: vec(), locale: chunk.locale,
    model: LOCKED_EMBEDDING_MODEL, dimensions: LOCKED_EMBEDDING_DIMENSIONS,
    sourceSha: "b".repeat(40), registrySourceSha: "b".repeat(40), indexState: "active", versionStatus: "active", indexingFailed: false };
}
function setup(options: { candidates?: unknown; missingRpc?: boolean; completed?: boolean; done?: boolean; commitError?: boolean } = {}) {
  const committed: Array<Record<string, unknown>> = [];
  const admin = { rpc: vi.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === "rag_get_import_status") return { data: { sessionState: options.completed ? "completed" : "running" }, error: null };
    if (name === "rag_claim_next_import_batch") return { data: { done: options.done ?? false, executionId: "fixture-execution", versionKey: target, chunkOffset: 0, chunkCount: 8, batchOrdinal: 0, leaseToken: "fixture-lease" }, error: null };
    if (name === "rag_reusable_embeddings") return options.missingRpc
      ? { data: null, error: { message: "Could not find function" } }
      : { data: options.candidates ?? fixtureChunks.map(candidate), error: null };
    if (name === "rag_commit_import_batch") {
      committed.push(...args!.p_rows as Array<Record<string, unknown>>);
      return options.commitError ? { data: null, error: { message: "commit failed" } } : { data: { acceptedRowCount: 8 }, error: null };
    }
    if (name === "rag_fail_import_batch") return { data: { ok: true }, error: null };
    throw new Error(`Unexpected RPC: ${name}`);
  }) };
  const embed = vi.fn(async (texts: string[]) => ({ vectors: texts.map(() => vec(0.75)) }));
  return { admin, embed, committed };
}
beforeEach(() => {
  loader.mockResolvedValue({ chunks: fixtureChunks, packageManifest: manifest });
  vi.stubEnv("OPENAI_API_KEY", "");
});
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("reports a provider HTTP failure without response bodies or automatic retry", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response("private provider response must not leave the server", { status: 429 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(createOpenAiEmbeddingFetcher("synthetic-test-key")(["synthetic text"]))
    .rejects.toThrow(/^PROVIDER_FAILED:HTTP_429$/);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

describe("native incremental executor with eight current fixtures and mocked providers", () => {
  it("uses zero provider calls for unchanged content, commits all rows with current metadata, and needs no provider key", async () => {
    const run = setup();
    const result = await executeNextImportBatch({ admin: run.admin });
    expect(result).toMatchObject({ providerCalls: 0, reusedChunkCount: 8, embeddedChunkCount: 0, acceptedRowCount: 8 });
    expect(run.committed).toHaveLength(8);
    fixtureChunks.forEach((chunk, index) => {
      const pkg = manifest.packages.find(p => p.packagePath === chunk.packagePath)!;
      expect(run.committed[index]).toMatchObject({ sourceId: chunk.chunkId, sourceSha: LOCKED_SOURCE_SHA,
        pathId: chunk.trackId, moduleId: chunk.moduleId, lessonId: chunk.lessonId, packagePath: chunk.packagePath,
        packageChecksum: pkg.packageChecksum, chunkChecksum: chunk.textChecksum, contentVersion: pkg.canonicalVersion,
        productionRoute: chunk.productionRoute, indexVersion: target, indexState: "staging", embedding: vec() });
    });
  });

  it("embeds only the changed inputs and reconstructs the full original batch order", async () => {
    const candidates = fixtureChunks.map(candidate);
    candidates[1].content += " old explanation";
    candidates[5].chunkChecksum = "a".repeat(64);
    const run = setup({ candidates });
    const result = await executeNextImportBatch(run);
    expect(result).toMatchObject({ providerCalls: 1, reusedChunkCount: 6, embeddedChunkCount: 2, acceptedRowCount: 8 });
    expect(run.embed).toHaveBeenCalledExactlyOnceWith([fixtureChunks[1].displayText, fixtureChunks[5].displayText]);
    expect(run.committed.map(row => row.sourceId)).toEqual(fixtureChunks.map(c => c.chunkId));
    expect(run.committed[1].embedding).toEqual(vec(0.75));
    expect(run.committed[2].embedding).toEqual(vec());
  });

  it("embeds all eight new chunks once when the cache has no eligible vectors", async () => {
    const run = setup({ candidates: [] });
    expect(await executeNextImportBatch(run)).toMatchObject({ providerCalls: 1, reusedChunkCount: 0, embeddedChunkCount: 8 });
    expect(run.embed).toHaveBeenCalledExactlyOnceWith(fixtureChunks.map(c => c.displayText));
  });

  it("fails closed on a missing reuse RPC before any provider or commit", async () => {
    const run = setup({ missingRpc: true });
    await expect(executeNextImportBatch(run)).rejects.toThrow("EMBEDDING_REUSE_UNAVAILABLE");
    expect(run.embed).not.toHaveBeenCalled();
    expect(run.committed).toEqual([]);
    expect(run.admin.rpc).toHaveBeenCalledWith("rag_fail_import_batch", { p_lease_token: "fixture-lease", p_error_code: "EMBEDDING_REUSE_UNAVAILABLE" });
  });

  it("never stages deleted rows or trusts a reused vector with another card/step label", async () => {
    const candidates = fixtureChunks.map(candidate);
    candidates[0].pathId = "foreign-card";
    candidates[1].lessonId = "foreign-step";
    candidates.push({ ...candidate(fixtureChunks[0]), chunkId: "removed-chunk" });
    const run = setup({ candidates });
    expect(await executeNextImportBatch(run)).toMatchObject({ reusedChunkCount: 6, embeddedChunkCount: 2 });
    expect(run.committed.map(row => row.sourceId)).toEqual(fixtureChunks.map(c => c.chunkId));
    expect(run.committed.some(row => row.sourceId === "removed-chunk")).toBe(false);
  });

  it("does not reopen a completed historical session or claim/read/cache/embed again", async () => {
    const run = setup({ completed: true });
    await expect(executeNextImportBatch(run)).rejects.toThrow("SESSION_ALREADY_COMPLETED");
    expect(run.admin.rpc.mock.calls.map(call => call[0])).toEqual(["rag_get_import_status"]);
    expect(run.embed).not.toHaveBeenCalled();
  });

  it("preserves corpus admission failure before claiming a batch", async () => {
    loader.mockRejectedValueOnce(new Error("DIGEST_MISMATCH"));
    const run = setup();
    await expect(executeNextImportBatch(run)).rejects.toThrow("DIGEST_MISMATCH");
    expect(run.admin.rpc).not.toHaveBeenCalled();
    expect(run.embed).not.toHaveBeenCalled();
  });

  it("replay returns zero calls and does not read candidate vectors", async () => {
    const run = setup({ done: true });
    expect(await executeNextImportBatch(run)).toMatchObject({ done: true, providerCalls: 0 });
    expect(run.admin.rpc.mock.calls.map(call => call[0])).toEqual(["rag_get_import_status", "rag_claim_next_import_batch"]);
    expect(run.embed).not.toHaveBeenCalled();
  });

  it("does not activate or weaken commit failure handling after successful reuse", async () => {
    const run = setup({ commitError: true });
    await expect(executeNextImportBatch(run)).rejects.toThrow("COMMIT_FAILED");
    expect(run.admin.rpc).toHaveBeenCalledWith("rag_fail_import_batch", { p_lease_token: "fixture-lease", p_error_code: "COMMIT_FAILED" });
    expect(run.admin.rpc.mock.calls.some(call => /activate|rollback|initialize/.test(call[0]))).toBe(false);
    expect(run.embed).not.toHaveBeenCalled();
  });
});
