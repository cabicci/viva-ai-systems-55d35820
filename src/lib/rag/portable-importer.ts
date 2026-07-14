import { APPROVED_LOCALES } from "./constants";
import {
  legacyChunksUnchanged,
  seedLegacyArEgChunks,
  snapshotLegacyChunks,
  type LegacyArEgChunkMap,
} from "./legacy-ar-eg-store";
import { evaluateRagEntitlementGate } from "./entitlement-gate";
import { MockRagIndexStore, type MockIndexedChunk } from "./mock-index-store";
import {
  readPortableArtifactRecords,
  verifyPortableArtifact,
  type PortableArtifactManifest,
  type PortableVectorRecord,
} from "./portable-artifact";
import type { EntitlementSnapshot } from "@/lib/billing/types";
import type { RagChunkRecord } from "./types";

export interface PortableImportOptions {
  dryRun?: boolean;
  retryOnlyFailed?: boolean;
  failedChunkIds?: Set<string>;
  resume?: boolean;
}

export interface PortableImportReport {
  ok: boolean;
  batchId: string;
  dryRun: boolean;
  packageCount: number;
  chunkCount: number;
  inserted: number;
  skipped: number;
  retried: number;
  failed: number;
  duplicateRecords: number;
  checksumMismatches: number;
  dimensionMismatches: number;
  modelMismatches: number;
  missingMetadata: number;
  arEgPreserved: boolean;
  legacyChunkCount: number;
  errors: string[];
}

export interface PortableRollbackReport {
  ok: boolean;
  batchId: string;
  removedLocalizedRecords: number;
  arEgPreserved: boolean;
  errors: string[];
}

function portableRecordToChunk(record: PortableVectorRecord): RagChunkRecord {
  return {
    chunkId: record.chunkId,
    lessonId: record.lessonId,
    locale: record.locale as RagChunkRecord["locale"],
    moduleId: record.moduleId,
    trackId: record.trackId,
    sectionIndex: record.sectionIndex,
    sectionRole: record.sectionRole,
    sectionHeading: record.lessonId,
    chunkIndex: record.chunkIndex,
    contentType: record.contentType as RagChunkRecord["contentType"],
    displayText: "",
    textChecksum: record.chunkChecksum,
    charCount: 0,
    packagePath: record.packagePath,
    productionRoute: record.productionRoute,
  };
}

/** Production-compatible importer — mock/disposable only; preserves ar-EG rows. */
export class ProductionCompatibleImporter {
  readonly legacyChunks: LegacyArEgChunkMap;
  readonly localizedStore: MockRagIndexStore;
  private legacySnapshot: LegacyArEgChunkMap;
  private importedBatches = new Set<string>();

  constructor() {
    this.legacyChunks = seedLegacyArEgChunks();
    this.legacySnapshot = snapshotLegacyChunks(this.legacyChunks);
    this.localizedStore = new MockRagIndexStore();
  }

  getLegacyActiveChunks(): MockIndexedChunk[] {
    return [...this.legacyChunks.values()].filter((c) => c.indexState === "active");
  }

  legacyUnchanged(): boolean {
    return legacyChunksUnchanged(this.legacySnapshot, this.legacyChunks);
  }

  private validateRecord(
    record: PortableVectorRecord,
    manifest: PortableArtifactManifest,
    errors: string[],
  ): { checksumMismatch: number; dimensionMismatch: number; modelMismatch: number; missingMeta: number } {
    let checksumMismatch = 0;
    let dimensionMismatch = 0;
    let modelMismatch = 0;
    let missingMeta = 0;

    if (!(APPROVED_LOCALES as readonly string[]).includes(record.locale)) {
      errors.push(`rejected locale: ${record.locale}`);
      missingMeta += 1;
    }
    if (record.locale === "ar-EG") {
      errors.push("ar-EG overwrite rejected");
      missingMeta += 1;
    }
    if (this.legacyChunks.has(record.chunkId) || this.legacyChunks.has(`legacy-eg/${record.lessonId}`)) {
      errors.push(`legacy collision: ${record.chunkId}`);
      missingMeta += 1;
    }
    if (!record.chunkChecksum || !record.packageChecksum || !record.sourceSha) missingMeta += 1;
    if (record.embedding.length !== manifest.vectorDimensions) dimensionMismatch += 1;
    if (record.model !== manifest.model) modelMismatch += 1;
    if (record.sourceSha !== manifest.contentFreezeSha) checksumMismatch += 1;

    return { checksumMismatch, dimensionMismatch, modelMismatch, missingMeta };
  }

  importPortableArtifact(
    artifactDir: string,
    options: PortableImportOptions = {},
  ): PortableImportReport {
    const dryRun = options.dryRun ?? false;
    const verification = verifyPortableArtifact(artifactDir);
    const errors = [...verification.errors];
    const { manifest, records } = readPortableArtifactRecords(artifactDir);
    const batchId = manifest.indexVersion;

    let inserted = 0;
    let skipped = 0;
    let retried = 0;
    let failed = 0;
    let duplicateRecords = 0;
    let checksumMismatches = verification.checksumMismatches;
    let dimensionMismatches = verification.dimensionMismatches;
    let modelMismatches = verification.modelMismatches;
    let missingMetadata = verification.missingMetadata;

    if (!verification.ok) {
      return {
        ok: false,
        batchId,
        dryRun,
        packageCount: manifest.packageCount,
        chunkCount: manifest.chunkCount,
        inserted,
        skipped,
        retried,
        failed: records.length,
        duplicateRecords: verification.duplicateChunkIds,
        checksumMismatches,
        dimensionMismatches,
        modelMismatches,
        missingMetadata,
        arEgPreserved: this.legacyUnchanged(),
        legacyChunkCount: this.legacyChunks.size,
        errors,
      };
    }

    if (!dryRun && !options.resume && this.importedBatches.has(batchId)) {
      if (!this.localizedStore.versions.has(batchId)) {
        errors.push(`batch already imported: ${batchId}`);
      }
    }

    if (!dryRun && !this.localizedStore.versions.has(batchId)) {
      this.localizedStore.createStagingVersion({
        versionKey: batchId,
        packageCount: manifest.packageCount,
        chunkCount: manifest.chunkCount,
        chunkManifestChecksum: manifest.chunkManifestChecksum,
        embeddingModel: manifest.model,
      });
    }

    const pkgChecksums = new Map<string, string>();
    const contentVersions = new Map<string, string | null>();
    for (const record of records) {
      pkgChecksums.set(record.packagePath, record.packageChecksum);
      contentVersions.set(record.packagePath, record.contentVersion);
    }

    const seen = new Set<string>();
    const ragChunks: RagChunkRecord[] = [];
    const embeddingByChunk = new Map<string, number[]>();

    for (const record of records) {
      if (seen.has(record.chunkId)) {
        duplicateRecords += 1;
        continue;
      }
      seen.add(record.chunkId);

      const validation = this.validateRecord(record, manifest, errors);
      checksumMismatches += validation.checksumMismatch;
      dimensionMismatches += validation.dimensionMismatch;
      modelMismatches += validation.modelMismatch;
      missingMetadata += validation.missingMeta;

      if (options.retryOnlyFailed) {
        const failedSet = options.failedChunkIds ?? new Set<string>();
        if (!failedSet.has(record.chunkId)) {
          skipped += 1;
          continue;
        }
      }

      ragChunks.push(portableRecordToChunk(record));
      embeddingByChunk.set(record.chunkId, record.embedding);
    }

    if (dryRun) {
      return {
        ok: errors.length === 0 && duplicateRecords === 0,
        batchId,
        dryRun: true,
        packageCount: manifest.packageCount,
        chunkCount: manifest.chunkCount,
        inserted: ragChunks.length,
        skipped,
        retried: 0,
        failed: 0,
        duplicateRecords,
        checksumMismatches,
        dimensionMismatches,
        modelMismatches,
        missingMetadata,
        arEgPreserved: this.legacyUnchanged(),
        legacyChunkCount: this.legacyChunks.size,
        errors,
      };
    }

    const result = this.localizedStore.insertChunksIdempotent(batchId, ragChunks, {
      packageChecksums: pkgChecksums,
      contentVersions,
      retryOnlyFailed: options.retryOnlyFailed,
      failedPackagePaths: new Set(
        [...(options.failedChunkIds ?? [])].map((id) => {
          const record = records.find((r) => r.chunkId === id);
          return record?.packagePath ?? "";
        }),
      ),
    });

    inserted = result.inserted;
    skipped = result.skipped;
    retried = result.retried;

    for (const [key, chunk] of this.localizedStore.chunks) {
      if (chunk.indexVersion !== batchId) continue;
      const embedding = embeddingByChunk.get(chunk.sourceId);
      if (embedding) {
        this.localizedStore.chunks.set(key, { ...chunk, embedding });
      }
    }

    this.importedBatches.add(batchId);

    const stagingCount = [...this.localizedStore.chunks.values()].filter(
      (c) => c.indexVersion === batchId && c.indexState === "staging" && !c.indexingFailed,
    ).length;

    failed = manifest.chunkCount - stagingCount;

    return {
      ok:
        errors.length === 0 &&
        duplicateRecords === 0 &&
        checksumMismatches === 0 &&
        dimensionMismatches === 0 &&
        modelMismatches === 0 &&
        missingMetadata === 0 &&
        stagingCount === manifest.chunkCount &&
        this.legacyUnchanged(),
      batchId,
      dryRun: false,
      packageCount: manifest.packageCount,
      chunkCount: manifest.chunkCount,
      inserted,
      skipped,
      retried,
      failed,
      duplicateRecords,
      checksumMismatches,
      dimensionMismatches,
      modelMismatches,
      missingMetadata,
      arEgPreserved: this.legacyUnchanged(),
      legacyChunkCount: this.legacyChunks.size,
      errors,
    };
  }

  activateBatch(
    batchId: string,
    snapshot: EntitlementSnapshot | null,
  ): { ok: boolean; reason?: string; entitlementDenied?: boolean } {
    const lessonIds = [
      ...new Set(
        [...this.localizedStore.chunks.values()]
          .filter((c) => c.indexVersion === batchId)
          .map((c) => c.lessonId),
      ),
    ];
    const gate = evaluateRagEntitlementGate({
      snapshot,
      locale: "en",
      lessonId: lessonIds[0] ?? null,
      operation: "activate_batch",
      batchLessonIds: lessonIds,
    });
    if (!gate.allowed) {
      return { ok: false, reason: gate.reason, entitlementDenied: true };
    }
    return this.localizedStore.activateVersion(batchId);
  }

  rollbackBatch(batchId: string): PortableRollbackReport {
    const beforeLegacy = snapshotLegacyChunks(this.legacyChunks);
    let removed = 0;

    for (const [key, chunk] of [...this.localizedStore.chunks.entries()]) {
      if (chunk.indexVersion === batchId) {
        this.localizedStore.chunks.delete(key);
        removed += 1;
      }
    }
    this.localizedStore.versions.delete(batchId);
    this.importedBatches.delete(batchId);

    const arEgPreserved = legacyChunksUnchanged(beforeLegacy, this.legacyChunks);

    return {
      ok: arEgPreserved && removed > 0,
      batchId,
      removedLocalizedRecords: removed,
      arEgPreserved,
      errors: arEgPreserved ? [] : ["legacy ar-EG rows mutated during rollback"],
    };
  }

  getInactiveBatchChunks(batchId: string): MockIndexedChunk[] {
    return [...this.localizedStore.chunks.values()].filter(
      (c) => c.indexVersion === batchId && c.indexState === "staging",
    );
  }

  getActiveLocalizedChunks(locale?: string): MockIndexedChunk[] {
    return this.localizedStore.getActiveChunks(locale);
  }
}
