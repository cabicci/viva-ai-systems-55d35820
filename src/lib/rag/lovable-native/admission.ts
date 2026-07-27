/**
 * Locked corpus admission — platform-neutral (no fs / no Vite).
 */
import type { AuthoritativeLookupJson } from "../authoritative-manifest-lookup";
import type { ChunkManifest, PackageManifest, RagChunkRecord } from "../types";
import {
  LOCKED_ARTIFACT_DIGESTS,
  LOCKED_CHUNK_COUNT,
  LOCKED_EMBEDDING_DIMENSIONS,
  LOCKED_EMBEDDING_MODEL,
  LOCKED_INDEX_VERSION,
  LOCKED_LOCALE_CHUNK_COUNTS,
  LOCKED_LOCALE_PACKAGE_COUNTS,
  LOCKED_PACKAGE_COUNT,
  LOCKED_SOURCE_SHA,
} from "./contracts";

export async function sha256Utf8(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface LockedCorpusRawTexts {
  packageManifestRaw: string;
  chunkManifestRaw: string;
  chunksRaw: string;
  authoritativeLookupRaw: string;
}

export interface LockedCorpus {
  packageManifest: PackageManifest;
  chunkManifest: ChunkManifest;
  chunks: RagChunkRecord[];
  lookup: AuthoritativeLookupJson;
  digests: typeof LOCKED_ARTIFACT_DIGESTS;
}

function assertExact(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`DIGEST_MISMATCH:${label}`);
  }
}

export async function admitLockedCorpusFromRaw(raw: LockedCorpusRawTexts): Promise<LockedCorpus> {
  const packageManifestSha256 = await sha256Utf8(raw.packageManifestRaw);
  const chunkManifestSha256 = await sha256Utf8(raw.chunkManifestRaw);
  const chunksSha256 = await sha256Utf8(raw.chunksRaw);
  const authoritativeLookupSha256 = await sha256Utf8(raw.authoritativeLookupRaw);

  assertExact(
    packageManifestSha256,
    LOCKED_ARTIFACT_DIGESTS.packageManifestSha256,
    "package-manifest",
  );
  assertExact(chunkManifestSha256, LOCKED_ARTIFACT_DIGESTS.chunkManifestSha256, "chunk-manifest");
  assertExact(chunksSha256, LOCKED_ARTIFACT_DIGESTS.chunksSha256, "chunks");
  assertExact(
    authoritativeLookupSha256,
    LOCKED_ARTIFACT_DIGESTS.authoritativeLookupSha256,
    "authoritative-lookup",
  );

  let packageManifest: PackageManifest;
  let chunkManifest: ChunkManifest;
  let chunksParsed: RagChunkRecord[] | { chunks: RagChunkRecord[] };
  let lookup: AuthoritativeLookupJson;
  try {
    packageManifest = JSON.parse(raw.packageManifestRaw) as PackageManifest;
    chunkManifest = JSON.parse(raw.chunkManifestRaw) as ChunkManifest;
    chunksParsed = JSON.parse(raw.chunksRaw) as RagChunkRecord[] | { chunks: RagChunkRecord[] };
    lookup = JSON.parse(raw.authoritativeLookupRaw) as AuthoritativeLookupJson;
  } catch {
    throw new Error("CORPUS_ADMISSION_FAILED:malformed_json");
  }

  const chunks = Array.isArray(chunksParsed) ? chunksParsed : chunksParsed.chunks;

  if (packageManifest.sourceSha !== LOCKED_SOURCE_SHA) {
    throw new Error("CORPUS_ADMISSION_FAILED:source_sha");
  }
  if (chunkManifest.sourceSha !== LOCKED_SOURCE_SHA || lookup.sourceSha !== LOCKED_SOURCE_SHA) {
    throw new Error("CORPUS_ADMISSION_FAILED:source_sha");
  }
  if (
    packageManifest.indexVersion !== LOCKED_INDEX_VERSION ||
    chunkManifest.indexVersion !== LOCKED_INDEX_VERSION ||
    lookup.indexVersion !== LOCKED_INDEX_VERSION
  ) {
    throw new Error("CORPUS_ADMISSION_FAILED:index_version");
  }
  if (packageManifest.packages.length !== LOCKED_PACKAGE_COUNT) {
    throw new Error("CORPUS_ADMISSION_FAILED:package_count");
  }
  if (chunks.length !== LOCKED_CHUNK_COUNT) {
    throw new Error("CORPUS_ADMISSION_FAILED:chunk_count");
  }
  if (
    chunkManifest.embeddingModel !== LOCKED_EMBEDDING_MODEL ||
    chunkManifest.embeddingDimensions !== LOCKED_EMBEDDING_DIMENSIONS
  ) {
    throw new Error("CORPUS_ADMISSION_FAILED:model_dims");
  }

  const pkgByLocale: Record<string, number> = {
    "ar-EG": 0,
    "ar-MSA": 0,
    "ar-Gulf": 0,
    en: 0,
  };
  for (const pkg of packageManifest.packages) {
    pkgByLocale[pkg.locale] = (pkgByLocale[pkg.locale] ?? 0) + 1;
  }
  for (const locale of Object.keys(LOCKED_LOCALE_PACKAGE_COUNTS) as Array<
    keyof typeof LOCKED_LOCALE_PACKAGE_COUNTS
  >) {
    if (pkgByLocale[locale] !== LOCKED_LOCALE_PACKAGE_COUNTS[locale]) {
      throw new Error(`CORPUS_ADMISSION_FAILED:package_locale:${locale}`);
    }
  }

  const chunkByLocale: Record<string, number> = {
    "ar-EG": 0,
    "ar-MSA": 0,
    "ar-Gulf": 0,
    en: 0,
  };
  const identities = new Set<string>();
  for (const chunk of chunks) {
    chunkByLocale[chunk.locale] = (chunkByLocale[chunk.locale] ?? 0) + 1;
    if (identities.has(chunk.chunkId)) {
      throw new Error("CORPUS_ADMISSION_FAILED:duplicate_chunk");
    }
    identities.add(chunk.chunkId);
  }
  for (const locale of Object.keys(LOCKED_LOCALE_CHUNK_COUNTS) as Array<
    keyof typeof LOCKED_LOCALE_CHUNK_COUNTS
  >) {
    if (chunkByLocale[locale] !== LOCKED_LOCALE_CHUNK_COUNTS[locale]) {
      throw new Error(`CORPUS_ADMISSION_FAILED:chunk_locale:${locale}`);
    }
  }

  const packagePaths = new Set(packageManifest.packages.map((p) => p.packagePath));
  for (const chunk of chunks) {
    if (!packagePaths.has(chunk.packagePath)) {
      throw new Error("CORPUS_ADMISSION_FAILED:chunk_package_membership");
    }
  }

  return {
    packageManifest,
    chunkManifest,
    chunks,
    lookup,
    digests: LOCKED_ARTIFACT_DIGESTS,
  };
}
