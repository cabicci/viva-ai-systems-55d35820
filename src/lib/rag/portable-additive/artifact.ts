import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { buildBatchId, sha256Bytes, sha256Json, stableStringify } from "./identity";
import {
  PORTABLE_ADDITIVE_SCHEMA,
  type ArtifactValidationReport,
  type BatchIdentityInput,
  type PortableArtifactFileEntry,
  type PortableArtifactManifest,
  type PortableVectorRecord,
} from "./types";

export const RECORDS_PER_SHARD = 50;

export interface BuildArtifactInput {
  candidateSha: string;
  contentFreezeSha: string;
  model: string;
  vectorDimensions: number;
  packageCount: number;
  packageManifestChecksum: string;
  chunkManifestChecksum: string;
  records: PortableVectorRecord[];
  generatedAt?: string;
}

export interface BuiltPortableArtifact {
  manifest: PortableArtifactManifest;
  /** path → file bytes (utf8 text or gzip binary) */
  files: Map<string, Buffer>;
  records: PortableVectorRecord[];
}

function assertVectorRecordShape(
  record: PortableVectorRecord,
  model: string,
  dims: number,
): string | null {
  if (!record.chunkId || !record.lessonId || !record.locale) {
    return "missing identity metadata";
  }
  if (!record.packageChecksum || !record.chunkChecksum || !record.sourceSha) {
    return "missing checksum metadata";
  }
  if (!Array.isArray(record.embedding)) return "missing embedding";
  if (record.embedding.length !== dims) return "dimension mismatch";
  if (record.vectorDimensions !== dims) return "vectorDimensions field mismatch";
  if (record.model !== model) return "model mismatch";
  return null;
}

function payloadChecksum(files: PortableArtifactFileEntry[]): string {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  return sha256Json(sorted.map((f) => ({ path: f.path, sha256: f.sha256 })));
}

/** Build a complete portable artifact with vector-bearing shards (in-memory). */
export function buildPortableArtifact(input: BuildArtifactInput): BuiltPortableArtifact {
  const sorted = [...input.records].sort((a, b) => a.chunkId.localeCompare(b.chunkId));
  for (const record of sorted) {
    const err = assertVectorRecordShape(record, input.model, input.vectorDimensions);
    if (err) throw new Error(`invalid record ${record.chunkId}: ${err}`);
  }

  const identity: BatchIdentityInput = {
    candidateSha: input.candidateSha,
    contentFreezeSha: input.contentFreezeSha,
    model: input.model,
    vectorDimensions: input.vectorDimensions,
    packageManifestChecksum: input.packageManifestChecksum,
    chunkManifestChecksum: input.chunkManifestChecksum,
  };
  const batchId = buildBatchId(identity);

  const files = new Map<string, Buffer>();
  const fileEntries: PortableArtifactFileEntry[] = [];

  const packageManifestBody = Buffer.from(
    JSON.stringify(
      {
        packageCount: input.packageCount,
        manifestChecksum: input.packageManifestChecksum,
      },
      null,
      2,
    ),
    "utf8",
  );
  files.set("package-manifest.json", packageManifestBody);
  fileEntries.push({
    path: "package-manifest.json",
    sha256: sha256Bytes(packageManifestBody),
    bytes: packageManifestBody.length,
  });

  const chunkManifestBody = Buffer.from(
    JSON.stringify(
      {
        chunkCount: sorted.length,
        manifestChecksum: input.chunkManifestChecksum,
        model: input.model,
        vectorDimensions: input.vectorDimensions,
      },
      null,
      2,
    ),
    "utf8",
  );
  files.set("chunk-manifest.json", chunkManifestBody);
  fileEntries.push({
    path: "chunk-manifest.json",
    sha256: sha256Bytes(chunkManifestBody),
    bytes: chunkManifestBody.length,
  });

  for (let i = 0; i < sorted.length; i += RECORDS_PER_SHARD) {
    const shard = sorted.slice(i, i + RECORDS_PER_SHARD);
    const ndjson = shard.map((r) => JSON.stringify(r)).join("\n");
    const compressed = gzipSync(Buffer.from(ndjson, "utf8"));
    const name = `vectors-shard-${String(Math.floor(i / RECORDS_PER_SHARD) + 1).padStart(3, "0")}.ndjson.gz`;
    files.set(name, compressed);
    fileEntries.push({
      path: name,
      sha256: sha256Bytes(compressed),
      bytes: compressed.length,
      recordCount: shard.length,
    });
  }

  const manifest: PortableArtifactManifest = {
    schemaVersion: PORTABLE_ADDITIVE_SCHEMA,
    batchId,
    candidateSha: input.candidateSha,
    contentFreezeSha: input.contentFreezeSha,
    model: input.model,
    vectorDimensions: input.vectorDimensions,
    packageCount: input.packageCount,
    chunkCount: sorted.length,
    packageManifestChecksum: input.packageManifestChecksum,
    chunkManifestChecksum: input.chunkManifestChecksum,
    files: fileEntries,
    payloadChecksum: payloadChecksum(fileEntries),
    generatedAt: input.generatedAt ?? "1970-01-01T00:00:00.000Z",
  };

  const manifestBody = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  files.set("artifact-manifest.json", manifestBody);

  return { manifest, files, records: sorted };
}

function readShardRecords(buf: Buffer): PortableVectorRecord[] {
  const body = gunzipSync(buf).toString("utf8");
  return body
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as PortableVectorRecord);
}

/** Fail-closed verification of a portable artifact. */
export function validatePortableArtifact(
  files: Map<string, Buffer>,
): ArtifactValidationReport {
  const errors: string[] = [];
  const manifestBuf = files.get("artifact-manifest.json");
  if (!manifestBuf) {
    return {
      ok: false,
      recordCount: 0,
      duplicateChunkIds: 0,
      checksumMismatches: 1,
      dimensionMismatches: 0,
      modelMismatches: 0,
      missingMetadata: 0,
      errors: ["artifact-manifest.json missing"],
    };
  }

  let manifest: PortableArtifactManifest;
  try {
    manifest = JSON.parse(manifestBuf.toString("utf8")) as PortableArtifactManifest;
  } catch {
    return {
      ok: false,
      recordCount: 0,
      duplicateChunkIds: 0,
      checksumMismatches: 1,
      dimensionMismatches: 0,
      modelMismatches: 0,
      missingMetadata: 0,
      errors: ["artifact-manifest.json malformed"],
    };
  }

  if (manifest.schemaVersion !== PORTABLE_ADDITIVE_SCHEMA) {
    errors.push(`unsupported schema: ${String(manifest.schemaVersion)}`);
  }

  const expectedBatchId = buildBatchId({
    candidateSha: manifest.candidateSha,
    contentFreezeSha: manifest.contentFreezeSha,
    model: manifest.model,
    vectorDimensions: manifest.vectorDimensions,
    packageManifestChecksum: manifest.packageManifestChecksum,
    chunkManifestChecksum: manifest.chunkManifestChecksum,
  });
  if (manifest.batchId !== expectedBatchId) {
    errors.push("batchId does not match deterministic identity");
  }

  let checksumMismatches = 0;
  for (const entry of manifest.files) {
    const buf = files.get(entry.path);
    if (!buf) {
      checksumMismatches += 1;
      errors.push(`missing file: ${entry.path}`);
      continue;
    }
    if (sha256Bytes(buf) !== entry.sha256) {
      checksumMismatches += 1;
      errors.push(`checksum mismatch: ${entry.path}`);
    }
  }

  if (payloadChecksum(manifest.files) !== manifest.payloadChecksum) {
    checksumMismatches += 1;
    errors.push("payloadChecksum mismatch");
  }

  const records: PortableVectorRecord[] = [];
  for (const entry of manifest.files) {
    if (!entry.path.startsWith("vectors-shard-")) continue;
    const buf = files.get(entry.path);
    if (!buf) continue;
    try {
      records.push(...readShardRecords(buf));
    } catch {
      errors.push(`unreadable shard: ${entry.path}`);
    }
  }

  let dimensionMismatches = 0;
  let modelMismatches = 0;
  let missingMetadata = 0;
  const seen = new Set<string>();
  let duplicateChunkIds = 0;

  for (const record of records) {
    if (seen.has(record.chunkId)) {
      duplicateChunkIds += 1;
      continue;
    }
    seen.add(record.chunkId);
    const shapeErr = assertVectorRecordShape(
      record,
      manifest.model,
      manifest.vectorDimensions,
    );
    if (shapeErr === "missing identity metadata" || shapeErr === "missing checksum metadata") {
      missingMetadata += 1;
    } else if (shapeErr === "dimension mismatch" || shapeErr === "vectorDimensions field mismatch") {
      dimensionMismatches += 1;
    } else if (shapeErr === "model mismatch") {
      modelMismatches += 1;
    } else if (shapeErr) {
      errors.push(`${record.chunkId}: ${shapeErr}`);
    }
  }

  if (records.length !== manifest.chunkCount) {
    errors.push(`record count ${records.length} != manifest chunkCount ${manifest.chunkCount}`);
  }
  if (duplicateChunkIds > 0) errors.push(`duplicate chunk IDs: ${duplicateChunkIds}`);

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
    errors,
  };
}

export function readArtifactRecords(files: Map<string, Buffer>): {
  manifest: PortableArtifactManifest;
  records: PortableVectorRecord[];
} {
  const manifest = JSON.parse(
    files.get("artifact-manifest.json")!.toString("utf8"),
  ) as PortableArtifactManifest;
  const records: PortableVectorRecord[] = [];
  for (const entry of manifest.files) {
    if (!entry.path.startsWith("vectors-shard-")) continue;
    records.push(...readShardRecords(files.get(entry.path)!));
  }
  records.sort((a, b) => a.chunkId.localeCompare(b.chunkId));
  return { manifest, records };
}

/** Tamper a file checksum entry for fail-closed tests. */
export function corruptManifestChecksum(
  manifest: PortableArtifactManifest,
): PortableArtifactManifest {
  return {
    ...manifest,
    payloadChecksum: createHash("sha256").update("tampered").digest("hex"),
  };
}

export function serializeManifest(manifest: PortableArtifactManifest): Buffer {
  return Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
}

export { stableStringify };
