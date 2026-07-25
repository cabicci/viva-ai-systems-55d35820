import fs from "node:fs";
import { APPROVED_LOCALES, type ApprovedLocale } from "../constants";
import type { AuthoritativeLookupJson } from "../authoritative-manifest-lookup";
import type { ChunkManifest, PackageManifest, RagChunkRecord } from "../types";
import {
  CHUNK_MANIFEST_SCHEMA,
  EXPECTED_CHUNK_COUNT,
  EXPECTED_EMBEDDING_DIMENSIONS,
  EXPECTED_EMBEDDING_MODEL,
  EXPECTED_INDEX_VERSION,
  EXPECTED_LOCALE_CHUNK_COUNTS,
  EXPECTED_LOCALE_PACKAGE_COUNTS,
  EXPECTED_PACKAGE_COUNT,
  EXPECTED_SOURCE_SHA,
  LOOKUP_SCHEMA,
  PACKAGE_MANIFEST_SCHEMA,
} from "./constants";
import { computeArtifactDigests, resolveArtifactPaths } from "./digests";
import type { CorpusAdmissionSnapshot, LocaleCountMap } from "./types";

function emptyLocaleCounts(): LocaleCountMap {
  return {
    "ar-EG": 0,
    "ar-MSA": 0,
    "ar-Gulf": 0,
    en: 0,
  };
}

function isApprovedLocale(value: string): value is ApprovedLocale {
  return (APPROVED_LOCALES as readonly string[]).includes(value);
}

export function admitCorpusArtifacts(repoRoot: string): CorpusAdmissionSnapshot {
  const errors: string[] = [];
  const digests = computeArtifactDigests(repoRoot);
  const paths = resolveArtifactPaths(repoRoot);

  const packageManifest = JSON.parse(
    fs.readFileSync(paths.packageManifest, "utf8"),
  ) as PackageManifest;
  const chunkManifest = JSON.parse(fs.readFileSync(paths.chunkManifest, "utf8")) as ChunkManifest;
  const chunksRaw = JSON.parse(fs.readFileSync(paths.chunks, "utf8")) as
    | RagChunkRecord[]
    | { chunks: RagChunkRecord[] };
  const chunks = Array.isArray(chunksRaw) ? chunksRaw : chunksRaw.chunks;
  const lookup = JSON.parse(
    fs.readFileSync(paths.authoritativeLookup, "utf8"),
  ) as AuthoritativeLookupJson;

  if (packageManifest.schemaVersion !== PACKAGE_MANIFEST_SCHEMA) {
    errors.push(`package schema mismatch: ${packageManifest.schemaVersion}`);
  }
  if (chunkManifest.schemaVersion !== CHUNK_MANIFEST_SCHEMA) {
    errors.push(`chunk schema mismatch: ${chunkManifest.schemaVersion}`);
  }
  if (lookup.schemaVersion !== LOOKUP_SCHEMA) {
    errors.push(`lookup schema mismatch: ${lookup.schemaVersion}`);
  }
  if (packageManifest.indexVersion !== EXPECTED_INDEX_VERSION) {
    errors.push(`package indexVersion mismatch: ${packageManifest.indexVersion}`);
  }
  if (chunkManifest.indexVersion !== EXPECTED_INDEX_VERSION) {
    errors.push(`chunk indexVersion mismatch: ${chunkManifest.indexVersion}`);
  }
  if (lookup.indexVersion !== EXPECTED_INDEX_VERSION) {
    errors.push(`lookup indexVersion mismatch: ${lookup.indexVersion}`);
  }
  if (packageManifest.sourceSha !== EXPECTED_SOURCE_SHA) {
    errors.push("package sourceSha mismatch");
  }
  if (chunkManifest.sourceSha !== EXPECTED_SOURCE_SHA) {
    errors.push("chunk sourceSha mismatch");
  }
  if (lookup.sourceSha !== EXPECTED_SOURCE_SHA) {
    errors.push("lookup sourceSha mismatch");
  }
  if (chunkManifest.embeddingModel !== EXPECTED_EMBEDDING_MODEL) {
    errors.push(`embedding model mismatch: ${chunkManifest.embeddingModel}`);
  }
  if (chunkManifest.embeddingDimensions !== EXPECTED_EMBEDDING_DIMENSIONS) {
    errors.push(`embedding dimensions mismatch: ${chunkManifest.embeddingDimensions}`);
  }

  if (packageManifest.packageCount !== EXPECTED_PACKAGE_COUNT) {
    errors.push(`packageCount ${packageManifest.packageCount} != ${EXPECTED_PACKAGE_COUNT}`);
  }
  if (packageManifest.packages.length !== EXPECTED_PACKAGE_COUNT) {
    errors.push(`packages.length ${packageManifest.packages.length} != ${EXPECTED_PACKAGE_COUNT}`);
  }
  if (chunkManifest.chunkCount !== EXPECTED_CHUNK_COUNT) {
    errors.push(`chunkCount ${chunkManifest.chunkCount} != ${EXPECTED_CHUNK_COUNT}`);
  }
  if (chunkManifest.chunks.length !== EXPECTED_CHUNK_COUNT) {
    errors.push(`chunks.length ${chunkManifest.chunks.length} != ${EXPECTED_CHUNK_COUNT}`);
  }
  if (chunks.length !== EXPECTED_CHUNK_COUNT) {
    errors.push(`chunks artifact length ${chunks.length} != ${EXPECTED_CHUNK_COUNT}`);
  }
  if (lookup.recordCount !== EXPECTED_CHUNK_COUNT) {
    errors.push(`lookup.recordCount ${lookup.recordCount} != ${EXPECTED_CHUNK_COUNT}`);
  }

  const localePackageCounts = emptyLocaleCounts();
  const packageByPath = new Map<string, PackageManifest["packages"][number]>();
  const lessonLocale = new Set<string>();
  const packageChecksums = new Map<string, string>();

  for (const pkg of packageManifest.packages) {
    if (!isApprovedLocale(pkg.locale)) {
      errors.push(`unrecognized package locale: ${pkg.locale}`);
      continue;
    }
    localePackageCounts[pkg.locale] += 1;
    if (packageByPath.has(pkg.packagePath)) {
      errors.push(`duplicate packagePath: ${pkg.packagePath}`);
    }
    packageByPath.set(pkg.packagePath, pkg);
    const pair = `${pkg.locale}|${pkg.lessonId}`;
    if (lessonLocale.has(pair)) {
      errors.push(`duplicate lesson/locale: ${pair}`);
    }
    lessonLocale.add(pair);
    if (pkg.sourceSha !== EXPECTED_SOURCE_SHA) {
      errors.push(`mixed package sourceSha at ${pkg.packagePath}`);
    }
    packageChecksums.set(pkg.packagePath, pkg.packageChecksum);
  }

  for (const locale of APPROVED_LOCALES) {
    if (localePackageCounts[locale] !== EXPECTED_LOCALE_PACKAGE_COUNTS[locale]) {
      errors.push(
        `locale package total ${locale}=${localePackageCounts[locale]} expected ${EXPECTED_LOCALE_PACKAGE_COUNTS[locale]}`,
      );
    }
  }

  const localeChunkCounts = emptyLocaleCounts();
  const chunkIds = new Set<string>();
  const sourceIds = new Set<string>();
  const chunksByPackage = new Map<string, number>();

  for (const entry of chunkManifest.chunks) {
    if (!isApprovedLocale(entry.locale)) {
      errors.push(`unrecognized chunk locale: ${entry.locale}`);
      continue;
    }
    localeChunkCounts[entry.locale] += 1;
    if (chunkIds.has(entry.chunkId)) {
      errors.push(`duplicate chunkId: ${entry.chunkId}`);
    }
    chunkIds.add(entry.chunkId);
    if (sourceIds.has(entry.chunkId)) {
      errors.push(`duplicate source_id candidate: ${entry.chunkId}`);
    }
    sourceIds.add(entry.chunkId);
    if (!packageByPath.has(entry.packagePath)) {
      errors.push(`chunk references missing package: ${entry.packagePath}`);
    }
    chunksByPackage.set(entry.packagePath, (chunksByPackage.get(entry.packagePath) ?? 0) + 1);
  }

  for (const locale of APPROVED_LOCALES) {
    if (localeChunkCounts[locale] !== EXPECTED_LOCALE_CHUNK_COUNTS[locale]) {
      errors.push(
        `locale chunk total ${locale}=${localeChunkCounts[locale]} expected ${EXPECTED_LOCALE_CHUNK_COUNTS[locale]}`,
      );
    }
  }

  for (const pkg of packageManifest.packages) {
    const actual = chunksByPackage.get(pkg.packagePath) ?? 0;
    if (actual !== pkg.chunkCount) {
      errors.push(
        `package chunkCount mismatch ${pkg.packagePath}: declared ${pkg.chunkCount} actual ${actual}`,
      );
    }
  }

  const chunkById = new Map(chunks.map((c) => [c.chunkId, c]));
  for (const entry of chunkManifest.chunks) {
    const full = chunkById.get(entry.chunkId);
    if (!full) {
      errors.push(`chunks.json missing chunkId ${entry.chunkId}`);
      continue;
    }
    if (full.textChecksum !== entry.textChecksum) {
      errors.push(`chunk checksum mismatch ${entry.chunkId}`);
    }
    if (full.packagePath !== entry.packagePath || full.locale !== entry.locale) {
      errors.push(`chunk identity drift ${entry.chunkId}`);
    }
  }

  const lookupKeys = Object.keys(lookup.records ?? {});
  if (lookupKeys.length !== EXPECTED_CHUNK_COUNT) {
    errors.push(`lookup records length ${lookupKeys.length} != ${EXPECTED_CHUNK_COUNT}`);
  }
  for (const entry of chunkManifest.chunks) {
    const pkg = packageByPath.get(entry.packagePath);
    if (!pkg) continue;
    const key = [
      entry.locale,
      entry.lessonId,
      entry.chunkId,
      entry.packagePath.replace(/\\/g, "/"),
      EXPECTED_INDEX_VERSION,
    ].join("|");
    const rec = lookup.records[key];
    if (!rec) {
      errors.push(`lookup membership missing for ${entry.chunkId}`);
      continue;
    }
    if (rec.chunkChecksum !== entry.textChecksum) {
      errors.push(`lookup chunkChecksum mismatch ${entry.chunkId}`);
    }
    if (rec.packageChecksum !== pkg.packageChecksum) {
      errors.push(`lookup packageChecksum mismatch ${entry.chunkId}`);
    }
    if (rec.sourceSha !== EXPECTED_SOURCE_SHA) {
      errors.push(`lookup mixed sourceSha ${entry.chunkId}`);
    }
  }

  // Reject legacy 100-lesson seed signature paths
  for (const pkg of packageManifest.packages) {
    const isLegacySeedPath =
      pkg.packagePath.includes("curriculum-data") ||
      (pkg.packagePath.includes("intro/lessons/") && !pkg.packagePath.includes("locale-lessons"));
    if (isLegacySeedPath) {
      errors.push(`legacy 100-lesson seed input rejected: ${pkg.packagePath}`);
    }
  }

  return {
    ok: errors.length === 0,
    packageCount: packageManifest.packages.length,
    chunkCount: chunks.length,
    localePackageCounts,
    localeChunkCounts,
    sourceSha: packageManifest.sourceSha,
    indexVersion: packageManifest.indexVersion,
    embeddingModel: chunkManifest.embeddingModel,
    embeddingDimensions: chunkManifest.embeddingDimensions,
    digests,
    packageManifestChecksum: packageManifest.manifestChecksum,
    chunkManifestChecksum: chunkManifest.manifestChecksum,
    errors,
  };
}

export function loadAdmittedCorpus(repoRoot: string): {
  admission: CorpusAdmissionSnapshot;
  packageManifest: PackageManifest;
  chunkManifest: ChunkManifest;
  chunks: RagChunkRecord[];
} {
  const admission = admitCorpusArtifacts(repoRoot);
  if (!admission.ok) {
    throw new Error(`Corpus admission failed:\n${admission.errors.join("\n")}`);
  }
  const paths = resolveArtifactPaths(repoRoot);
  const packageManifest = JSON.parse(
    fs.readFileSync(paths.packageManifest, "utf8"),
  ) as PackageManifest;
  const chunkManifest = JSON.parse(fs.readFileSync(paths.chunkManifest, "utf8")) as ChunkManifest;
  const chunksRaw = JSON.parse(fs.readFileSync(paths.chunks, "utf8")) as
    | RagChunkRecord[]
    | { chunks: RagChunkRecord[] };
  const chunks = Array.isArray(chunksRaw) ? chunksRaw : chunksRaw.chunks;
  return { admission, packageManifest, chunkManifest, chunks };
}
