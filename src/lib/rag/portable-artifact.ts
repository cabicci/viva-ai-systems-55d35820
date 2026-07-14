import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import {
  APPROVED_LOCALES,
  CONTENT_FREEZE_SHA,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_PLACEHOLDER,
} from "./constants";
import { sha256Hex, sha256Json } from "./checksum";
import type { ChunkManifest, PackageManifest, RagChunkRecord } from "./types";

export const PORTABLE_ARTIFACT_SCHEMA = "rag-portable-artifact-v1" as const;
export const CANDIDATE_SHA = "8e48d655489fcdfad4df8e33b3c93c61bbde3468";
export const RECORDS_PER_SHARD = 1000;
export const FUTURE_MAX_APPROVED_COST_USD = 1;

export interface PortableVectorRecord {
  chunkId: string;
  lessonId: string;
  locale: string;
  trackId: string;
  moduleId: string;
  packagePath: string;
  sourceSha: string;
  packageChecksum: string;
  chunkChecksum: string;
  contentVersion: string | null;
  sectionIndex: number;
  sectionRole: string;
  chunkIndex: number;
  contentType: string;
  productionRoute: string | null;
  model: string;
  vectorDimensions: number;
  embedding: number[];
}

export interface PortableArtifactFileEntry {
  path: string;
  sha256: string;
  recordCount?: number;
  bytes: number;
}

export interface PortableArtifactManifest {
  schemaVersion: typeof PORTABLE_ARTIFACT_SCHEMA;
  candidateSha: string;
  contentFreezeSha: string;
  indexVersion: string;
  model: string;
  vectorDimensions: number;
  packageCount: number;
  chunkCount: number;
  packageManifestChecksum: string;
  chunkManifestChecksum: string;
  exactTokenCount: number;
  requestCount: number;
  successful: number;
  failed: number;
  retried: number;
  skipped: number;
  localeCounts: Record<string, number>;
  localeLessonIsolation: {
    crossLocaleLeakage: number;
    crossLessonLeakage: number;
  };
  duplicateChunkIds: number;
  files: PortableArtifactFileEntry[];
  payloadChecksum: string;
  generatedAt: string;
}

export interface PortableArtifactVerificationReport {
  ok: boolean;
  recordCount: number;
  duplicateChunkIds: number;
  checksumMismatches: number;
  dimensionMismatches: number;
  modelMismatches: number;
  missingMetadata: number;
  localeLessonIsolation: {
    crossLocaleLeakage: number;
    crossLessonLeakage: number;
  };
  errors: string[];
}

export interface WritePortableArtifactInput {
  outputDir: string;
  indexVersion: string;
  chunks: RagChunkRecord[];
  embeddings: Map<string, number[]>;
  packageManifest: PackageManifest;
  chunkManifest: ChunkManifest;
  stats: {
    exactTokenCount: number;
    requestCount: number;
    successful: number;
    failed: number;
    retried: number;
    skipped: number;
  };
  model?: string;
}

function assertRecordVector(record: PortableVectorRecord): void {
  if (record.embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`dimension mismatch for ${record.chunkId}`);
  }
  if (record.model !== EMBEDDING_MODEL_PLACEHOLDER) {
    throw new Error(`model mismatch for ${record.chunkId}`);
  }
}

export function buildPortableVectorRecords(
  chunks: RagChunkRecord[],
  embeddings: Map<string, number[]>,
  packageChecksums: Map<string, string>,
  contentVersions: Map<string, string | null>,
  model = EMBEDDING_MODEL_PLACEHOLDER,
): PortableVectorRecord[] {
  const sorted = [...chunks].sort((a, b) => a.chunkId.localeCompare(b.chunkId));
  return sorted.map((chunk) => {
    const embedding = embeddings.get(chunk.chunkId);
    if (!embedding) {
      throw new Error(`missing embedding for ${chunk.chunkId}`);
    }
    return {
      chunkId: chunk.chunkId,
      lessonId: chunk.lessonId,
      locale: chunk.locale,
      trackId: chunk.trackId,
      moduleId: chunk.moduleId,
      packagePath: chunk.packagePath,
      sourceSha: CONTENT_FREEZE_SHA,
      packageChecksum: packageChecksums.get(chunk.packagePath) ?? "",
      chunkChecksum: chunk.textChecksum,
      contentVersion: contentVersions.get(chunk.packagePath) ?? null,
      sectionIndex: chunk.sectionIndex,
      sectionRole: chunk.sectionRole,
      chunkIndex: chunk.chunkIndex,
      contentType: chunk.contentType,
      productionRoute: chunk.productionRoute,
      model,
      vectorDimensions: EMBEDDING_DIMENSIONS,
      embedding,
    };
  });
}

function countLocaleRecords(records: PortableVectorRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const locale of APPROVED_LOCALES) counts[locale] = 0;
  for (const record of records) {
    counts[record.locale] = (counts[record.locale] ?? 0) + 1;
  }
  return counts;
}

function measureIsolation(records: PortableVectorRecord[]): {
  crossLocaleLeakage: number;
  crossLessonLeakage: number;
} {
  let crossLocaleLeakage = 0;
  let crossLessonLeakage = 0;
  for (const record of records) {
    if (!record.chunkId.startsWith(`${record.locale}/`)) crossLocaleLeakage += 1;
    if (!record.chunkId.includes(`/${record.lessonId}/`)) crossLessonLeakage += 1;
  }
  return { crossLocaleLeakage, crossLessonLeakage };
}

function payloadChecksum(files: PortableArtifactFileEntry[]): string {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  return sha256Json(sorted.map((f) => ({ path: f.path, sha256: f.sha256 })));
}

function writeShard(
  outputDir: string,
  shardIndex: number,
  records: PortableVectorRecord[],
): PortableArtifactFileEntry {
  const lines = records.map((r) => JSON.stringify(r)).join("\n");
  const compressed = gzipSync(Buffer.from(lines, "utf8"));
  const fileName = `vectors-shard-${String(shardIndex).padStart(3, "0")}.ndjson.gz`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, compressed);
  return {
    path: fileName,
    sha256: createHash("sha256").update(compressed).digest("hex"),
    recordCount: records.length,
    bytes: compressed.length,
  };
}

/** Write complete portable artifact with checksums (no secrets, no Git commit). */
export function writePortableArtifact(input: WritePortableArtifactInput): PortableArtifactManifest {
  const {
    outputDir,
    indexVersion,
    chunks,
    embeddings,
    packageManifest,
    chunkManifest,
    stats,
    model = EMBEDDING_MODEL_PLACEHOLDER,
  } = input;

  fs.mkdirSync(outputDir, { recursive: true });

  const pkgChecksums = new Map(
    packageManifest.packages.map((p) => [p.packagePath, p.packageChecksum]),
  );
  const contentVersions = new Map(
    packageManifest.packages.map((p) => [p.packagePath, p.canonicalVersion]),
  );

  const records = buildPortableVectorRecords(
    chunks,
    embeddings,
    pkgChecksums,
    contentVersions,
    model,
  );
  for (const record of records) assertRecordVector(record);

  const files: PortableArtifactFileEntry[] = [];

  const packageManifestPath = "package-manifest.json";
  const packageManifestBody = JSON.stringify(packageManifest, null, 2);
  fs.writeFileSync(path.join(outputDir, packageManifestPath), packageManifestBody);
  files.push({
    path: packageManifestPath,
    sha256: sha256Hex(packageManifestBody),
    bytes: Buffer.byteLength(packageManifestBody, "utf8"),
  });

  const chunkManifestPath = "chunk-manifest.json";
  const chunkManifestBody = JSON.stringify(chunkManifest, null, 2);
  fs.writeFileSync(path.join(outputDir, chunkManifestPath), chunkManifestBody);
  files.push({
    path: chunkManifestPath,
    sha256: sha256Hex(chunkManifestBody),
    bytes: Buffer.byteLength(chunkManifestBody, "utf8"),
  });

  for (let i = 0; i < records.length; i += RECORDS_PER_SHARD) {
    const shardRecords = records.slice(i, i + RECORDS_PER_SHARD);
    files.push(writeShard(outputDir, Math.floor(i / RECORDS_PER_SHARD) + 1, shardRecords));
  }

  const duplicateChunkIds = records.length - new Set(records.map((r) => r.chunkId)).size;
  const localeLessonIsolation = measureIsolation(records);

  const manifestWithoutPayload: Omit<PortableArtifactManifest, "payloadChecksum"> = {
    schemaVersion: PORTABLE_ARTIFACT_SCHEMA,
    candidateSha: CANDIDATE_SHA,
    contentFreezeSha: CONTENT_FREEZE_SHA,
    indexVersion,
    model,
    vectorDimensions: EMBEDDING_DIMENSIONS,
    packageCount: packageManifest.packageCount,
    chunkCount: records.length,
    packageManifestChecksum: packageManifest.manifestChecksum,
    chunkManifestChecksum: chunkManifest.manifestChecksum,
    exactTokenCount: stats.exactTokenCount,
    requestCount: stats.requestCount,
    successful: stats.successful,
    failed: stats.failed,
    retried: stats.retried,
    skipped: stats.skipped,
    localeCounts: countLocaleRecords(records),
    localeLessonIsolation,
    duplicateChunkIds,
    files,
    generatedAt: new Date().toISOString(),
  };

  const manifest: PortableArtifactManifest = {
    ...manifestWithoutPayload,
    payloadChecksum: payloadChecksum(files),
  };

  const manifestPath = "artifact-manifest.json";
  const manifestBody = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(path.join(outputDir, manifestPath), manifestBody);

  return manifest;
}

function readShardRecords(shardPath: string): PortableVectorRecord[] {
  const compressed = fs.readFileSync(shardPath);
  const body = gunzipSync(compressed).toString("utf8");
  const lines = body.split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line) as PortableVectorRecord);
}

function fileSha256(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return createHash("sha256").update(data).digest("hex");
}

/** Verify portable artifact integrity — rejects incomplete or mismatched payloads. */
export function verifyPortableArtifact(
  artifactDir: string,
): PortableArtifactVerificationReport {
  const errors: string[] = [];
  const manifestPath = path.join(artifactDir, "artifact-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      recordCount: 0,
      duplicateChunkIds: 0,
      checksumMismatches: 1,
      dimensionMismatches: 0,
      modelMismatches: 0,
      missingMetadata: 0,
      localeLessonIsolation: { crossLocaleLeakage: 0, crossLessonLeakage: 0 },
      errors: ["artifact-manifest.json missing"],
    };
  }

  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf8"),
  ) as PortableArtifactManifest;

  if (manifest.schemaVersion !== PORTABLE_ARTIFACT_SCHEMA) {
    errors.push(`unsupported schema: ${manifest.schemaVersion}`);
  }
  if (manifest.candidateSha !== CANDIDATE_SHA) {
    errors.push(`candidate SHA mismatch: ${manifest.candidateSha}`);
  }
  if (manifest.model !== EMBEDDING_MODEL_PLACEHOLDER) {
    errors.push(`model mismatch: ${manifest.model}`);
  }
  if (manifest.vectorDimensions !== EMBEDDING_DIMENSIONS) {
    errors.push(`dimension mismatch: ${manifest.vectorDimensions}`);
  }

  let checksumMismatches = 0;
  for (const file of manifest.files) {
    const fullPath = path.join(artifactDir, file.path);
    if (!fs.existsSync(fullPath)) {
      checksumMismatches += 1;
      errors.push(`missing file: ${file.path}`);
      continue;
    }
    const actual = fileSha256(fullPath);
    if (actual !== file.sha256) {
      checksumMismatches += 1;
      errors.push(`checksum mismatch: ${file.path}`);
    }
  }

  const payloadFiles = manifest.files.filter((f) => f.path !== "artifact-manifest.json");
  const expectedPayload = payloadChecksum(payloadFiles);
  if (expectedPayload !== manifest.payloadChecksum) {
    checksumMismatches += 1;
    errors.push("payload checksum mismatch");
  }

  const records: PortableVectorRecord[] = [];
  for (const file of manifest.files) {
    if (!file.path.startsWith("vectors-shard-")) continue;
    records.push(...readShardRecords(path.join(artifactDir, file.path)));
  }

  let dimensionMismatches = 0;
  let modelMismatches = 0;
  let missingMetadata = 0;
  const seen = new Set<string>();

  for (const record of records) {
    if (seen.has(record.chunkId)) continue;
    seen.add(record.chunkId);

    if (!record.chunkId || !record.lessonId || !record.locale || !record.packagePath) {
      missingMetadata += 1;
    }
    if (record.embedding.length !== manifest.vectorDimensions) dimensionMismatches += 1;
    if (record.model !== manifest.model) modelMismatches += 1;
    if (!record.packageChecksum || !record.chunkChecksum || !record.sourceSha) {
      missingMetadata += 1;
    }
  }

  const duplicateChunkIds = records.length - seen.size;
  const localeLessonIsolation = measureIsolation(records);

  if (records.length !== manifest.chunkCount) {
    errors.push(`record count ${records.length} != manifest ${manifest.chunkCount}`);
  }
  if (duplicateChunkIds > 0) errors.push(`duplicate chunk IDs: ${duplicateChunkIds}`);
  if (localeLessonIsolation.crossLocaleLeakage > 0) {
    errors.push(`cross-locale leakage: ${localeLessonIsolation.crossLocaleLeakage}`);
  }
  if (localeLessonIsolation.crossLessonLeakage > 0) {
    errors.push(`cross-lesson leakage: ${localeLessonIsolation.crossLessonLeakage}`);
  }

  const ok =
    errors.length === 0 &&
    checksumMismatches === 0 &&
    dimensionMismatches === 0 &&
    modelMismatches === 0 &&
    missingMetadata === 0 &&
    duplicateChunkIds === 0;

  return {
    ok,
    recordCount: records.length,
    duplicateChunkIds,
    checksumMismatches,
    dimensionMismatches,
    modelMismatches,
    missingMetadata,
    localeLessonIsolation,
    errors,
  };
}

/** Load verified portable artifact records (call verifyPortableArtifact first). */
export function readPortableArtifactRecords(artifactDir: string): {
  manifest: PortableArtifactManifest;
  records: PortableVectorRecord[];
} {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(artifactDir, "artifact-manifest.json"), "utf8"),
  ) as PortableArtifactManifest;

  const records: PortableVectorRecord[] = [];
  for (const file of manifest.files) {
    if (!file.path.startsWith("vectors-shard-")) continue;
    records.push(...readShardRecords(path.join(artifactDir, file.path)));
  }
  records.sort((a, b) => a.chunkId.localeCompare(b.chunkId));
  return { manifest, records };
}
