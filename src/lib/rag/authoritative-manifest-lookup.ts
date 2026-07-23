/**
 * Server-owned authoritative corpus lookup built from committed package + chunk manifests.
 * Lookup key jointly binds: locale | lessonId | chunkId | packagePath | indexVersion
 */

import fs from "node:fs";
import path from "node:path";
import { CONTENT_FREEZE_SHA, RAG_ARTIFACTS_DIR, RAG_INDEX_VERSION } from "./constants";
import { isValidSha256Digest } from "./canonical-checksum";
import type { ChunkManifest, PackageManifest } from "./types";

function packagePathMatchesLocale(packagePath: string, locale: string): boolean {
  const normalized = packagePath.replace(/\\/g, "/");
  return (
    normalized.includes(`/locale-lessons/${locale}/`) ||
    normalized.startsWith(`src/lib/locale-lessons/${locale}/`)
  );
}

export interface AuthoritativeChunkRecord {
  locale: string;
  lessonId: string;
  chunkId: string;
  packagePath: string;
  sourceSha: string;
  packageChecksum: string;
  chunkChecksum: string;
  indexVersion: string;
  sectionIndex: number | null;
  chunkIndex: number | null;
  sectionRole: string | null;
}

export interface AuthoritativeLookupKeyParts {
  locale: string;
  lessonId: string;
  chunkId: string;
  packagePath: string;
  indexVersion: string;
}

export interface AuthoritativeCorpusLookup {
  sourceSha: string;
  indexVersion: string;
  recordCount: number;
  /** Map keyed by composeAuthoritativeLookupKey(...) */
  byKey: Map<string, AuthoritativeChunkRecord>;
  /** Secondary index for duplicate-chunk-id detection / diagnostics */
  byChunkId: Map<string, AuthoritativeChunkRecord>;
}

export interface AuthoritativeLookupJson {
  schemaVersion: "authoritative-corpus-lookup-v1";
  sourceSha: string;
  indexVersion: string;
  recordCount: number;
  records: Record<string, AuthoritativeChunkRecord>;
}

export function composeAuthoritativeLookupKey(parts: AuthoritativeLookupKeyParts): string {
  return [
    parts.locale,
    parts.lessonId,
    parts.chunkId,
    parts.packagePath.replace(/\\/g, "/"),
    parts.indexVersion,
  ].join("|");
}

export class AuthoritativeLookupBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthoritativeLookupBuildError";
  }
}

export function buildAuthoritativeLookupFromManifests(
  packageManifest: PackageManifest,
  chunkManifest: ChunkManifest,
): AuthoritativeCorpusLookup {
  if (packageManifest.sourceSha !== CONTENT_FREEZE_SHA) {
    throw new AuthoritativeLookupBuildError(
      `package manifest sourceSha mismatch: ${packageManifest.sourceSha}`,
    );
  }
  if (chunkManifest.sourceSha !== CONTENT_FREEZE_SHA) {
    throw new AuthoritativeLookupBuildError(
      `chunk manifest sourceSha mismatch: ${chunkManifest.sourceSha}`,
    );
  }
  if (packageManifest.indexVersion !== RAG_INDEX_VERSION) {
    throw new AuthoritativeLookupBuildError(
      `package manifest indexVersion unsupported: ${packageManifest.indexVersion}`,
    );
  }
  if (chunkManifest.indexVersion !== RAG_INDEX_VERSION) {
    throw new AuthoritativeLookupBuildError(
      `chunk manifest indexVersion unsupported: ${chunkManifest.indexVersion}`,
    );
  }

  const packagesByPath = new Map(
    packageManifest.packages.map((p) => [p.packagePath.replace(/\\/g, "/"), p]),
  );

  const byKey = new Map<string, AuthoritativeChunkRecord>();
  const byChunkId = new Map<string, AuthoritativeChunkRecord>();

  for (const chunk of chunkManifest.chunks) {
    const packagePath = chunk.packagePath.replace(/\\/g, "/");
    const pkg = packagesByPath.get(packagePath);
    if (!pkg) {
      throw new AuthoritativeLookupBuildError(`missing package for chunk ${chunk.chunkId}`);
    }
    if (pkg.locale !== chunk.locale) {
      throw new AuthoritativeLookupBuildError(
        `locale mismatch for chunk ${chunk.chunkId}: package=${pkg.locale} chunk=${chunk.locale}`,
      );
    }
    if (pkg.lessonId !== chunk.lessonId) {
      throw new AuthoritativeLookupBuildError(
        `lesson mismatch for chunk ${chunk.chunkId}: package=${pkg.lessonId} chunk=${chunk.lessonId}`,
      );
    }
    if (!packagePathMatchesLocale(packagePath, chunk.locale)) {
      throw new AuthoritativeLookupBuildError(
        `package path/locale mismatch for chunk ${chunk.chunkId}`,
      );
    }
    if (pkg.sourceSha !== CONTENT_FREEZE_SHA || chunkManifest.sourceSha !== CONTENT_FREEZE_SHA) {
      throw new AuthoritativeLookupBuildError(`sourceSha inconsistent for ${chunk.chunkId}`);
    }
    if (!isValidSha256Digest(pkg.packageChecksum)) {
      throw new AuthoritativeLookupBuildError(`malformed packageChecksum for ${packagePath}`);
    }
    if (!isValidSha256Digest(chunk.textChecksum)) {
      throw new AuthoritativeLookupBuildError(`malformed chunk checksum for ${chunk.chunkId}`);
    }

    const record: AuthoritativeChunkRecord = {
      locale: chunk.locale,
      lessonId: chunk.lessonId,
      chunkId: chunk.chunkId,
      packagePath,
      sourceSha: CONTENT_FREEZE_SHA,
      packageChecksum: pkg.packageChecksum,
      chunkChecksum: chunk.textChecksum,
      indexVersion: RAG_INDEX_VERSION,
      sectionIndex: chunk.sectionIndex ?? null,
      chunkIndex: chunk.chunkIndex ?? null,
      sectionRole: chunk.sectionRole ?? null,
    };

    const key = composeAuthoritativeLookupKey(record);
    if (byKey.has(key)) {
      throw new AuthoritativeLookupBuildError(`duplicate lookup key: ${key}`);
    }
    if (byChunkId.has(chunk.chunkId)) {
      throw new AuthoritativeLookupBuildError(`duplicate chunk ID: ${chunk.chunkId}`);
    }
    byKey.set(key, record);
    byChunkId.set(chunk.chunkId, record);
  }

  return {
    sourceSha: CONTENT_FREEZE_SHA,
    indexVersion: RAG_INDEX_VERSION,
    recordCount: byKey.size,
    byKey,
    byChunkId,
  };
}

export function serializeAuthoritativeLookup(
  lookup: AuthoritativeCorpusLookup,
): AuthoritativeLookupJson {
  const records: Record<string, AuthoritativeChunkRecord> = {};
  const keys = [...lookup.byKey.keys()].sort();
  for (const key of keys) {
    records[key] = lookup.byKey.get(key)!;
  }
  return {
    schemaVersion: "authoritative-corpus-lookup-v1",
    sourceSha: lookup.sourceSha,
    indexVersion: lookup.indexVersion,
    recordCount: lookup.recordCount,
    records,
  };
}

export function hydrateAuthoritativeLookup(
  json: AuthoritativeLookupJson,
): AuthoritativeCorpusLookup {
  if (json.sourceSha !== CONTENT_FREEZE_SHA) {
    throw new AuthoritativeLookupBuildError(`lookup sourceSha mismatch: ${json.sourceSha}`);
  }
  if (json.indexVersion !== RAG_INDEX_VERSION) {
    throw new AuthoritativeLookupBuildError(
      `lookup indexVersion unsupported: ${json.indexVersion}`,
    );
  }
  const byKey = new Map<string, AuthoritativeChunkRecord>();
  const byChunkId = new Map<string, AuthoritativeChunkRecord>();
  for (const [key, record] of Object.entries(json.records)) {
    if (byKey.has(key)) {
      throw new AuthoritativeLookupBuildError(`duplicate lookup key in json: ${key}`);
    }
    if (byChunkId.has(record.chunkId)) {
      throw new AuthoritativeLookupBuildError(`duplicate chunk ID in json: ${record.chunkId}`);
    }
    byKey.set(key, record);
    byChunkId.set(record.chunkId, record);
  }
  if (byKey.size !== json.recordCount) {
    throw new AuthoritativeLookupBuildError(
      `lookup recordCount mismatch: declared=${json.recordCount} actual=${byKey.size}`,
    );
  }
  return {
    sourceSha: json.sourceSha,
    indexVersion: json.indexVersion,
    recordCount: byKey.size,
    byKey,
    byChunkId,
  };
}

export function loadAuthoritativeLookupFromRepo(
  repoRoot: string,
  artifactsDir = RAG_ARTIFACTS_DIR,
): AuthoritativeCorpusLookup {
  const packageManifestPath = path.join(repoRoot, artifactsDir, "package-manifest.json");
  const chunkManifestPath = path.join(repoRoot, artifactsDir, "chunk-manifest.json");
  const packageManifest = JSON.parse(
    fs.readFileSync(packageManifestPath, "utf8"),
  ) as PackageManifest;
  const chunkManifest = JSON.parse(fs.readFileSync(chunkManifestPath, "utf8")) as ChunkManifest;
  return buildAuthoritativeLookupFromManifests(packageManifest, chunkManifest);
}

export function lookupAuthoritativeChunk(
  lookup: AuthoritativeCorpusLookup,
  keyParts: AuthoritativeLookupKeyParts,
): AuthoritativeChunkRecord | null {
  const key = composeAuthoritativeLookupKey(keyParts);
  return lookup.byKey.get(key) ?? null;
}
