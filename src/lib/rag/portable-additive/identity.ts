import { createHash } from "node:crypto";
import type { BatchIdentityInput, RecordIdentity } from "./types";

/** Stable SHA-256 of UTF-8 bytes (no text normalization — binary-safe). */
export function sha256Bytes(data: Uint8Array | Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  return createHash("sha256").update(buf).digest("hex");
}

/** Stable JSON stringify with sorted object keys. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function sha256Json(value: unknown): string {
  return sha256Bytes(stableStringify(value));
}

/** Deterministic batch ID from identity inputs — independent of corpus size. */
export function buildBatchId(input: BatchIdentityInput): string {
  const digest = sha256Json({
    candidateSha: input.candidateSha,
    contentFreezeSha: input.contentFreezeSha,
    model: input.model,
    vectorDimensions: input.vectorDimensions,
    packageManifestChecksum: input.packageManifestChecksum,
    chunkManifestChecksum: input.chunkManifestChecksum,
  });
  return `rag-additive-${digest.slice(0, 16)}`;
}

/** Stable record key: locale + lesson + chunk identity. */
export function buildRecordKey(identity: RecordIdentity): string {
  return `${identity.locale}::${identity.lessonId}::${identity.chunkId}`;
}

export function identityFromParts(
  locale: string,
  lessonId: string,
  chunkId: string,
): RecordIdentity {
  return { locale, lessonId, chunkId };
}
