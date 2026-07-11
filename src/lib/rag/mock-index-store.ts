import type { RagChunkRecord } from "./types";
import { CONTENT_FREEZE_SHA, EMBEDDING_DIMENSIONS, RAG_INDEX_VERSION } from "./constants";
import { sha256Hex } from "./checksum";

export type IndexVersionStatus = "staging" | "active" | "superseded" | "failed";
export type ChunkIndexState = "staging" | "active" | "superseded" | "failed";

export interface MockIndexVersion {
  versionKey: string;
  sourceSha: string;
  status: IndexVersionStatus;
  packageCount: number;
  chunkCount: number;
  chunkManifestChecksum: string;
  embeddingModel: string;
  failureReason: string | null;
  createdAt: string;
  activatedAt: string | null;
  supersededAt: string | null;
}

export interface MockIndexedChunk {
  id: string;
  sourceType: "locale_lesson";
  sourceId: string;
  locale: string;
  lessonId: string;
  moduleId: string;
  pathId: string;
  title: string;
  content: string;
  packagePath: string;
  sourceSha: string;
  packageChecksum: string;
  chunkChecksum: string;
  contentVersion: string | null;
  indexVersion: string;
  indexState: ChunkIndexState;
  sectionIndex: number;
  sectionRole: string;
  chunkPosition: number;
  contentType: string;
  productionRoute: string | null;
  indexingFailed: boolean;
  embedding: number[];
}

export interface MockInsertResult {
  inserted: number;
  skipped: number;
  retried: number;
}

/** Disposable in-memory store mirroring migration semantics for local validation. */
export class MockRagIndexStore {
  versions = new Map<string, MockIndexVersion>();
  chunks = new Map<string, MockIndexedChunk>();

  private nextId = 1;

  private makeId(): string {
    return `mock-chunk-${this.nextId++}`;
  }

  createStagingVersion(input: {
    versionKey: string;
    packageCount: number;
    chunkCount: number;
    chunkManifestChecksum: string;
    embeddingModel?: string;
  }): MockIndexVersion {
    if (this.versions.has(input.versionKey)) {
      throw new Error(`Version already exists: ${input.versionKey}`);
    }
    const version: MockIndexVersion = {
      versionKey: input.versionKey,
      sourceSha: CONTENT_FREEZE_SHA,
      status: "staging",
      packageCount: input.packageCount,
      chunkCount: input.chunkCount,
      chunkManifestChecksum: input.chunkManifestChecksum,
      embeddingModel: input.embeddingModel ?? "text-embedding-3-small",
      failureReason: null,
      createdAt: new Date().toISOString(),
      activatedAt: null,
      supersededAt: null,
    };
    this.versions.set(input.versionKey, version);
    return version;
  }

  private chunkKey(versionKey: string, sourceId: string): string {
    return `${versionKey}::${sourceId}`;
  }

  /** Deterministic fake embedding from chunk checksum — not for semantic quality claims. */
  fakeEmbedding(chunkChecksum: string): number[] {
    const out = new Array<number>(EMBEDDING_DIMENSIONS);
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      const slice = chunkChecksum.slice(i % 32, (i % 32) + 8);
      out[i] = (parseInt(slice, 16) % 1000) / 1000;
    }
    return out;
  }

  insertChunksIdempotent(
    versionKey: string,
    chunks: RagChunkRecord[],
    options?: {
      packageChecksums?: Map<string, string>;
      contentVersions?: Map<string, string | null>;
      retryOnlyFailed?: boolean;
      failedPackagePaths?: Set<string>;
    },
  ): MockInsertResult {
    const version = this.versions.get(versionKey);
    if (!version || version.status !== "staging") {
      throw new Error("Target version must exist and be staging");
    }

    let inserted = 0;
    let skipped = 0;
    let retried = 0;
    const retryOnlyFailed = options?.retryOnlyFailed ?? false;
    const failedPaths = options?.failedPackagePaths ?? new Set<string>();

    for (const chunk of chunks) {
      if (retryOnlyFailed && !failedPaths.has(chunk.packagePath)) {
        skipped += 1;
        continue;
      }

      const key = this.chunkKey(versionKey, chunk.chunkId);
      const existing = this.chunks.get(key);
      if (existing && !existing.indexingFailed && existing.chunkChecksum === chunk.textChecksum) {
        skipped += 1;
        continue;
      }

      if (existing?.indexingFailed) retried += 1;

      const pkgChecksum =
        options?.packageChecksums?.get(chunk.packagePath) ?? sha256Hex(chunk.packagePath);
      const contentVersion =
        options?.contentVersions?.get(chunk.packagePath) ?? null;

      this.chunks.set(key, {
        id: this.makeId(),
        sourceType: "locale_lesson",
        sourceId: chunk.chunkId,
        locale: chunk.locale,
        lessonId: chunk.lessonId,
        moduleId: chunk.moduleId,
        pathId: chunk.trackId,
        title: chunk.sectionHeading || chunk.lessonId,
        content: chunk.displayText,
        packagePath: chunk.packagePath,
        sourceSha: CONTENT_FREEZE_SHA,
        packageChecksum: pkgChecksum,
        chunkChecksum: chunk.textChecksum,
        contentVersion,
        indexVersion: versionKey,
        indexState: "staging",
        sectionIndex: chunk.sectionIndex,
        sectionRole: chunk.sectionRole,
        chunkPosition: chunk.chunkIndex,
        contentType: chunk.contentType,
        productionRoute: chunk.productionRoute,
        indexingFailed: false,
        embedding: this.fakeEmbedding(chunk.textChecksum),
      });
      inserted += 1;
    }

    return { inserted, skipped, retried };
  }

  markPackageFailed(versionKey: string, packagePath: string): void {
    for (const [key, chunk] of this.chunks) {
      if (chunk.indexVersion === versionKey && chunk.packagePath === packagePath) {
        this.chunks.set(key, { ...chunk, indexingFailed: true, indexState: "failed" });
      }
    }
  }

  activateVersion(versionKey: string): { ok: boolean; reason?: string } {
    const version = this.versions.get(versionKey);
    if (!version) return { ok: false, reason: "version_not_found" };
    if (version.status !== "staging") return { ok: false, reason: "not_staging" };

    const stagingChunks = [...this.chunks.values()].filter(
      (c) =>
        c.indexVersion === versionKey &&
        c.indexState === "staging" &&
        !c.indexingFailed,
    );
    if (stagingChunks.length !== version.chunkCount) {
      return { ok: false, reason: "incomplete_staging" };
    }

    const failed = [...this.chunks.values()].filter(
      (c) => c.indexVersion === versionKey && c.indexingFailed,
    );
    if (failed.length > 0) return { ok: false, reason: "failed_units_present" };

    for (const [key, v] of this.versions) {
      if (v.status === "active") {
        this.versions.set(key, {
          ...v,
          status: "superseded",
          supersededAt: new Date().toISOString(),
        });
      }
    }

    for (const [key, chunk] of this.chunks) {
      if (chunk.indexState === "active") {
        this.chunks.set(key, { ...chunk, indexState: "superseded" });
      }
    }

    this.versions.set(versionKey, {
      ...version,
      status: "active",
      activatedAt: new Date().toISOString(),
    });

    for (const [key, chunk] of this.chunks) {
      if (chunk.indexVersion === versionKey && chunk.indexState === "staging") {
        this.chunks.set(key, { ...chunk, indexState: "active" });
      }
    }

    return { ok: true };
  }

  rollbackVersion(versionKey: string): { ok: boolean; reason?: string } {
    const target = this.versions.get(versionKey);
    if (!target) return { ok: false, reason: "version_not_found" };
    if (target.status !== "superseded") return { ok: false, reason: "not_superseded" };

    const restorable = [...this.chunks.values()].filter(
      (c) => c.indexVersion === versionKey && !c.indexingFailed,
    );
    if (restorable.length !== target.chunkCount) {
      return { ok: false, reason: "rollback_target_incomplete" };
    }

    for (const [key, v] of this.versions) {
      if (v.status === "active") {
        this.versions.set(key, {
          ...v,
          status: "superseded",
          supersededAt: new Date().toISOString(),
        });
      }
    }

    for (const [key, chunk] of this.chunks) {
      if (chunk.indexState === "active") {
        this.chunks.set(key, { ...chunk, indexState: "superseded" });
      }
    }

    this.versions.set(versionKey, {
      ...target,
      status: "active",
      activatedAt: new Date().toISOString(),
      supersededAt: null,
    });

    for (const [key, chunk] of this.chunks) {
      if (chunk.indexVersion === versionKey) {
        this.chunks.set(key, { ...chunk, indexState: "active" });
      }
    }

    return { ok: true };
  }

  getActiveVersion(): MockIndexVersion | null {
    return [...this.versions.values()].find((v) => v.status === "active") ?? null;
  }

  getActiveChunks(locale?: string): MockIndexedChunk[] {
    return [...this.chunks.values()].filter(
      (c) =>
        c.indexState === "active" &&
        (!locale || c.locale === locale),
    );
  }

  planSupersededCleanup(): string[] {
    const activeIds = new Set(
      [...this.chunks.values()]
        .filter((c) => c.indexState === "active")
        .map((c) => c.sourceId),
    );
    return [...this.chunks.values()]
      .filter((c) => c.indexState === "superseded" && !activeIds.has(c.sourceId))
      .map((c) => c.sourceId)
      .sort();
  }
}

export function defaultVersionKey(): string {
  return `${RAG_INDEX_VERSION}-${CONTENT_FREEZE_SHA.slice(0, 8)}`;
}
