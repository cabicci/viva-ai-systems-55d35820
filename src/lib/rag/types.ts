import type { ApprovedLocale } from "./constants";
import type { RagPackageLocale } from "@/lib/locale-lessons/types";

/** Content-type tags for indexed chunks. */
export type ChunkContentType =
  | "explanation"
  | "glossary"
  | "quiz"
  | "mission"
  | "example"
  | "summary"
  | "other";

/** Approved package record discovered from locale-lessons runtime paths. */
export interface ApprovedPackageRecord {
  lessonId: string;
  locale: RagPackageLocale;
  moduleId: string;
  trackId: string;
  packagePath: string;
  productionRoute: string | null;
  sourceSha: string;
  packageChecksum: string;
  canonicalVersion: string | null;
  title: string;
}

/** Deterministic chunk record for local indexing. */
export interface RagChunkRecord {
  chunkId: string;
  lessonId: string;
  locale: RagPackageLocale;
  moduleId: string;
  trackId: string;
  sectionIndex: number;
  sectionRole: string;
  sectionHeading: string;
  chunkIndex: number;
  contentType: ChunkContentType;
  displayText: string;
  textChecksum: string;
  charCount: number;
  packagePath: string;
  productionRoute: string | null;
}

/** Package-level manifest entry. */
export interface PackageManifestEntry {
  lessonId: string;
  locale: RagPackageLocale;
  moduleId: string;
  trackId: string;
  packagePath: string;
  productionRoute: string | null;
  sourceSha: string;
  packageChecksum: string;
  canonicalVersion: string | null;
  chunkCount: number;
}

/** Package manifest schema. */
export interface PackageManifest {
  schemaVersion: "package-manifest-v1";
  indexVersion: string;
  sourceSha: string;
  generatedAt: string;
  packageCount: number;
  localeCounts: Record<ApprovedLocale, number>;
  packages: PackageManifestEntry[];
  manifestChecksum: string;
}

/** Chunk-level manifest entry. */
export interface ChunkManifestEntry {
  chunkId: string;
  lessonId: string;
  locale: RagPackageLocale;
  moduleId: string;
  trackId: string;
  sectionIndex: number;
  sectionRole: string;
  chunkIndex: number;
  contentType: ChunkContentType;
  textChecksum: string;
  charCount: number;
  packagePath: string;
}

/** Chunk manifest schema. */
export interface ChunkManifest {
  schemaVersion: "chunk-manifest-v1";
  indexVersion: string;
  sourceSha: string;
  generatedAt: string;
  embeddingModel: string;
  embeddingDimensions: number;
  chunkCount: number;
  localeCounts: Record<ApprovedLocale, number>;
  chunks: ChunkManifestEntry[];
  manifestChecksum: string;
}

/** Corpus verification report. */
export interface CorpusVerificationReport {
  ok: boolean;
  sourceSha: string;
  totalPackages: number;
  localeCounts: Record<ApprovedLocale, number>;
  uniqueLessonCounts: Record<ApprovedLocale, number>;
  ag4RecordCount: number;
  ag4RecordsPresent: boolean;
  archivedExcluded: string[];
  supersededExcluded: string[];
  duplicatePaths: string[];
  duplicateLessonLocalePairs: string[];
  missingMetadata: string[];
  errors: string[];
  warnings: string[];
}

/** Reindex planning unit. */
export type ReindexAction = "skip" | "reindex" | "delete" | "retry";

export interface ReindexPlanEntry {
  packagePath: string;
  lessonId: string;
  locale: RagPackageLocale;
  action: ReindexAction;
  previousChecksum: string | null;
  currentChecksum: string | null;
  reason: string;
}

/** Reindex plan report. */
export interface ReindexPlanReport {
  dryRun: boolean;
  sourceSha: string;
  skipCount: number;
  reindexCount: number;
  deleteCount: number;
  retryCount: number;
  entries: ReindexPlanEntry[];
  localeReports: Record<
    ApprovedLocale,
    { skip: number; reindex: number; delete: number; retry: number }
  >;
}

/** Chunk generation quality report. */
export interface ChunkQualityReport {
  emptyChunks: string[];
  duplicateChunks: string[];
  oversizedChunks: string[];
  undersizedChunks: string[];
  crossLocaleViolations: string[];
  crossLessonViolations: string[];
}
