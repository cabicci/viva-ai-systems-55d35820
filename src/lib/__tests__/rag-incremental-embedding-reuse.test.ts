import { describe, expect, it, vi } from "vitest";
import { CONTENT_FREEZE_SHA, EMBEDDING_DIMENSIONS } from "@/lib/rag/constants";
import { sha256CanonicalHex } from "@/lib/rag/canonical-checksum";
import type { PackageManifest, RagChunkRecord } from "@/lib/rag/types";
import { loadReusableEmbeddings } from "@/lib/rag/inactive-importer/embedding-reuse";
import { importPackageUnit } from "@/lib/rag/inactive-importer/import-engine";
import { MemorySqlExecutor } from "@/lib/rag/inactive-importer/memory-sql";
import type { EmbeddingProvider, ReusableEmbeddingRow, RowProgress, SqlExecutor, StagingChunkInsert } from "@/lib/rag/inactive-importer/types";

const MODEL = "text-embedding-3-small";
const OLD_SHA = "b".repeat(40);
const OLD_VERSION = "approved-active-baseline";
const TARGET = "replacement-staging";
const vector = () => Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => i / EMBEDDING_DIMENSIONS);

function chunk(id: string, text: string): RagChunkRecord {
  return {
    chunkId: `en/current-step/s0/${id}`, lessonId: "current-step", locale: "en",
    moduleId: "current-station", trackId: "current-card", sectionIndex: 0,
    sectionRole: "explanation", sectionHeading: "Current heading", chunkIndex: Number(id.replace(/\D/g, "")) || 0,
    contentType: "explanation", displayText: text, textChecksum: sha256CanonicalHex(text),
    charCount: text.length, packagePath: "src/lib/locale-lessons/en/lessons/current-step.json",
    productionRoute: "/learn/current-card/current-step",
  };
}

function pkg(chunks: RagChunkRecord[]): PackageManifest["packages"][number] {
  return {
    lessonId: chunks[0].lessonId, locale: "en", moduleId: chunks[0].moduleId, trackId: chunks[0].trackId,
    packagePath: chunks[0].packagePath, productionRoute: chunks[0].productionRoute,
    sourceSha: CONTENT_FREEZE_SHA, packageChecksum: "a".repeat(64), canonicalVersion: "current", chunkCount: chunks.length,
  };
}

function provider(): EmbeddingProvider {
  return { kind: "mock", model: MODEL, dimensions: EMBEDDING_DIMENSIONS,
    embedBatch: vi.fn(async (texts: string[]) => ({ vectors: texts.map(vector), attemptsUsed: 0 })) };
}

function baseline(sql: MemorySqlExecutor, chunks: RagChunkRecord[]) {
  sql.registry.set(OLD_VERSION, { version_key: OLD_VERSION, source_sha: OLD_SHA, status: "active",
    package_count: 1, chunk_count: chunks.length, chunk_manifest_checksum: "d".repeat(64), embedding_model: MODEL });
  for (const c of chunks) sql.insertStagingChunk({
    sourceId: `old/${c.chunkId}`, pathId: "old-card", moduleId: "old-station", lessonId: "old-step",
    title: "Old heading", content: c.displayText, embedding: vector(), locale: c.locale,
    packagePath: "src/lib/locale-lessons/en/lessons/old-step.json", sourceSha: OLD_SHA,
    packageChecksum: "b".repeat(64), chunkChecksum: c.textChecksum, contentVersion: "old",
    indexVersion: OLD_VERSION, indexState: "active", sectionIndex: 0, sectionRole: c.sectionRole,
    chunkPosition: c.chunkIndex, contentType: c.contentType, productionRoute: "/old", indexingFailed: false,
  });
}

function importOptions(sql: MemorySqlExecutor, chunks: RagChunkRecord[], embeddingProvider = provider()) {
  return { sql, versionKey: TARGET, pkg: pkg(chunks), chunks, provider: embeddingProvider,
    attemptState: { attempted: 0, max: 10 }, progress: { inserted: 0, skippedExact: 0, conflicting: 0, failed: 0 } as RowProgress,
    existingBySourceId: new Map<string, string>() };
}

describe("incremental embedding reuse", () => {
  it("embeds new content once and resumes exact target rows without another provider call", async () => {
    const sql = new MemorySqlExecutor();
    const chunks = [chunk("0", "A new supported concept."), chunk("1", "Another supported concept.")];
    const options = importOptions(sql, chunks);
    await importPackageUnit(options);
    await importPackageUnit(options);
    expect(options.provider.embedBatch).toHaveBeenCalledTimes(1);
    expect(options.progress).toMatchObject({ inserted: 2, skippedExact: 2, reusedEmbeddings: 0 });
    expect(sql.chunks).toHaveLength(2);
    expect(sql.chunks.every((row) => row.index_state === "staging")).toBe(true);
  });

  it("reuses unchanged chunk inputs across versions even when the containing package checksum changes", async () => {
    const sql = new MemorySqlExecutor();
    const unchanged = chunk("0", "An unchanged supported concept.");
    const prior = chunk("1", "The previous explanation.");
    baseline(sql, [unchanged, prior]);
    const activeBefore = structuredClone(sql.chunks);
    const edited = chunk("1", "The revised supported explanation.");
    const options = importOptions(sql, [unchanged, edited]);
    await importPackageUnit(options);
    expect(options.provider.embedBatch).toHaveBeenCalledWith([edited.displayText], expect.any(Object));
    expect(options.progress).toMatchObject({ inserted: 2, reusedEmbeddings: 1 });
    expect(sql.chunks.filter((row) => row.index_version === OLD_VERSION)).toEqual(activeBefore);
    const staged = sql.chunks.filter((row) => row.index_version === TARGET);
    expect(staged).toHaveLength(2);
    for (const row of staged) expect(row).toMatchObject({ path_id: "current-card", module_id: "current-station",
      lesson_id: "current-step", source_sha: CONTENT_FREEZE_SHA, package_checksum: "a".repeat(64),
      content_version: "current", index_state: "staging", production_route: "/learn/current-card/current-step" });
  });

  it("reuses exact inputs after chunk identifiers move and never copies a removed chunk into staging", async () => {
    const sql = new MemorySqlExecutor();
    const retained = chunk("0", "Retained concept.");
    const removed = chunk("1", "Deleted concept.");
    baseline(sql, [retained, removed]);
    const moved = { ...retained, chunkId: "en/current-step/s2/c8", sectionIndex: 2, chunkIndex: 8 };
    const options = importOptions(sql, [moved]);
    await importPackageUnit(options);
    expect(options.provider.embedBatch).not.toHaveBeenCalled();
    expect(options.progress.reusedEmbeddings).toBe(1);
    expect(sql.chunks.filter((row) => row.index_version === TARGET).map((row) => row.content)).toEqual([retained.displayText]);
    expect(sql.chunks.find((row) => row.index_version === TARGET)).toMatchObject({ source_id: moved.chunkId, section_index: 2, chunk_position: 8 });
  });

  it("rolls back failed packages without marking absent target rows as resumable", async () => {
    const sql = new MemorySqlExecutor();
    const chunks = [chunk("0", "First concept."), chunk("1", "Second concept.")];
    baseline(sql, chunks);
    const activeBefore = structuredClone(sql.chunks);
    const insert = sql.insertStagingChunk.bind(sql);
    let count = 0;
    sql.insertStagingChunk = (row: StagingChunkInsert) => { if (++count === 2) throw new Error("fixture insert failure"); insert(row); };
    const options = importOptions(sql, chunks);
    await expect(importPackageUnit(options)).rejects.toThrow("fixture insert failure");
    expect(sql.chunks).toEqual(activeBefore);
    expect(options.existingBySourceId.size).toBe(0);
    expect(options.progress).toMatchObject({ inserted: 0, failed: 2 });
  });

  const candidate = (): ReusableEmbeddingRow => ({ content: "A supported concept.",
    chunkChecksum: sha256CanonicalHex("A supported concept."), embedding: vector(), locale: "en", model: MODEL,
    dimensions: EMBEDDING_DIMENSIONS, sourceSha: OLD_SHA, registrySourceSha: OLD_SHA,
    indexState: "active", versionStatus: "active", indexingFailed: false });

  it.each([
    { model: "different-model" }, { dimensions: 10 }, { embedding: [1, 2] },
    { embedding: vector().map(() => Number.NaN) }, { sourceSha: "c".repeat(40) },
    { registrySourceSha: "c".repeat(40) }, { sourceSha: "", registrySourceSha: "" },
    { indexState: "superseded" }, { versionStatus: "superseded" }, { indexState: "staging" },
    { indexingFailed: true }, { locale: "ar-EG" }, { chunkChecksum: "f".repeat(64) },
    { content: "An unverified different input." }, { content: "A supported concept.\n" }, { embedding: "invalid json" },
  ] as Partial<ReusableEmbeddingRow>[])("does not reuse unverified vector provenance: %j", (overrides) => {
    const sql: SqlExecutor = { redactedTargetId: "test", query: vi.fn(() => ""), readReusableEmbeddingRows: () => [{ ...candidate(), ...overrides }] };
    const vectors = loadReusableEmbeddings(sql, [chunk("0", "A supported concept.")], provider());
    expect(vectors.size).toBe(0);
  });

  it("uses a read-only SQL join that authenticates the active registry model/source and validates returned text", () => {
    const row = candidate();
    const query = vi.fn(() => JSON.stringify([{ ...row, embedding: JSON.stringify(row.embedding) }]));
    const vectors = loadReusableEmbeddings({ query, redactedTargetId: "test" }, [chunk("0", row.content)], provider());
    expect(vectors.size).toBe(1);
    expect(query.mock.calls[0][0]).toContain("JOIN public.rag_index_versions");
    expect(query.mock.calls[0][0]).toContain("kc.source_sha = version.source_sha");
    expect(query.mock.calls[0][0]).toContain("version.embedding_model = 'text-embedding-3-small'");
    expect(query.mock.calls[0][0]).toContain("version.status = 'active'");
    expect(query.mock.calls[0][0]).not.toMatch(/\b(INSERT|UPDATE|DELETE)\b/i);
  });
});
