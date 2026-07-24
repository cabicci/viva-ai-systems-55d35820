import { describe, expect, it } from "vitest";
import {
  AuthoritativeLookupBuildError,
  buildAuthoritativeLookupFromManifests,
  composeAuthoritativeLookupKey,
  loadAuthoritativeLookupFromRepo,
  lookupAuthoritativeChunk,
} from "@/lib/rag/authoritative-manifest-lookup";
import { CONTENT_FREEZE_SHA, RAG_INDEX_VERSION } from "@/lib/rag/constants";
import type { ChunkManifest, PackageManifest } from "@/lib/rag/types";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

const SAMPLE_CHUNK_ID = "en/analyst-m1-l1-from-automation-to-insight/s0/c0";

describe("authoritative manifest lookup", () => {
  it("loads committed manifests and looks up a registered chunk", () => {
    const lookup = loadAuthoritativeLookupFromRepo(REPO_ROOT);
    expect(lookup.sourceSha).toBe(CONTENT_FREEZE_SHA);
    expect(lookup.indexVersion).toBe(RAG_INDEX_VERSION);
    expect(lookup.recordCount).toBeGreaterThan(0);

    const registered = lookup.byChunkId.get(SAMPLE_CHUNK_ID);
    expect(registered).toBeTruthy();
    const hit = lookupAuthoritativeChunk(lookup, {
      locale: registered!.locale,
      lessonId: registered!.lessonId,
      chunkId: registered!.chunkId,
      packagePath: registered!.packagePath,
      indexVersion: RAG_INDEX_VERSION,
    });
    expect(hit).toEqual(registered);
    expect(hit!.chunkChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(hit!.packageChecksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects wrong package path for an otherwise valid identity", () => {
    const lookup = loadAuthoritativeLookupFromRepo(REPO_ROOT);
    const registered = lookup.byChunkId.get(SAMPLE_CHUNK_ID)!;
    const miss = lookupAuthoritativeChunk(lookup, {
      locale: registered.locale,
      lessonId: registered.lessonId,
      chunkId: registered.chunkId,
      packagePath: "src/lib/locale-lessons/en/lessons/wrong.json",
      indexVersion: RAG_INDEX_VERSION,
    });
    expect(miss).toBeNull();
  });

  it("fails closed on duplicate chunk IDs", () => {
    const lookup = loadAuthoritativeLookupFromRepo(REPO_ROOT);
    const registered = lookup.byChunkId.get(SAMPLE_CHUNK_ID)!;
    const packageManifest: PackageManifest = {
      schemaVersion: "package-manifest-v1",
      indexVersion: RAG_INDEX_VERSION,
      sourceSha: CONTENT_FREEZE_SHA,
      generatedAt: "1970-01-01T00:00:00.000Z",
      packageCount: 1,
      localeCounts: { "ar-EG": 0, en: 1, "ar-MSA": 0, "ar-Gulf": 0 },
      packages: [
        {
          lessonId: registered.lessonId,
          locale: "en",
          moduleId: "analyst-m1",
          trackId: "analyst",
          packagePath: registered.packagePath,
          productionRoute: null,
          sourceSha: CONTENT_FREEZE_SHA,
          packageChecksum: registered.packageChecksum,
          canonicalVersion: null,
          chunkCount: 2,
        },
      ],
      manifestChecksum: "a".repeat(64),
    };
    const chunkManifest: ChunkManifest = {
      schemaVersion: "chunk-manifest-v1",
      indexVersion: RAG_INDEX_VERSION,
      sourceSha: CONTENT_FREEZE_SHA,
      generatedAt: "1970-01-01T00:00:00.000Z",
      embeddingModel: "text-embedding-3-small",
      embeddingDimensions: 1536,
      chunkCount: 2,
      localeCounts: { "ar-EG": 0, en: 2, "ar-MSA": 0, "ar-Gulf": 0 },
      chunks: [
        {
          chunkId: registered.chunkId,
          lessonId: registered.lessonId,
          locale: "en",
          moduleId: "analyst-m1",
          trackId: "analyst",
          sectionIndex: 0,
          sectionRole: "Orientation",
          chunkIndex: 0,
          contentType: "explanation",
          textChecksum: registered.chunkChecksum,
          charCount: 10,
          packagePath: registered.packagePath,
        },
        {
          chunkId: registered.chunkId,
          lessonId: registered.lessonId,
          locale: "en",
          moduleId: "analyst-m1",
          trackId: "analyst",
          sectionIndex: 0,
          sectionRole: "Orientation",
          chunkIndex: 1,
          contentType: "explanation",
          textChecksum: registered.chunkChecksum,
          charCount: 10,
          packagePath: registered.packagePath,
        },
      ],
      manifestChecksum: "b".repeat(64),
    };

    expect(() => buildAuthoritativeLookupFromManifests(packageManifest, chunkManifest)).toThrow(
      AuthoritativeLookupBuildError,
    );
  });

  it("composeAuthoritativeLookupKey jointly binds identity fields", () => {
    const key = composeAuthoritativeLookupKey({
      locale: "en",
      lessonId: "l1",
      chunkId: "en/l1/s0/c0",
      packagePath: "src/lib/locale-lessons/en/lessons/l1.json",
      indexVersion: RAG_INDEX_VERSION,
    });
    expect(key).toBe(
      `en|l1|en/l1/s0/c0|src/lib/locale-lessons/en/lessons/l1.json|${RAG_INDEX_VERSION}`,
    );
  });
});
