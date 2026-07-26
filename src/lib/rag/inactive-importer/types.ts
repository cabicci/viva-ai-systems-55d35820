import type { ApprovedLocale } from "../constants";
import type { ImporterEnvironment, ImporterOperation } from "./constants";
import {
  EXPECTED_LOCALE_CHUNK_COUNTS,
  EXPECTED_LOCALE_PACKAGE_COUNTS,
  REPORT_SCHEMA_VERSION,
} from "./constants";

export type LocaleCountMap = Record<ApprovedLocale, number>;

export interface ArtifactDigests {
  packageManifestSha256: string;
  chunkManifestSha256: string;
  chunksSha256: string;
  authoritativeLookupSha256: string;
}

export interface CorpusAdmissionSnapshot {
  ok: boolean;
  packageCount: number;
  chunkCount: number;
  localePackageCounts: LocaleCountMap;
  localeChunkCounts: LocaleCountMap;
  sourceSha: string;
  indexVersion: string;
  embeddingModel: string;
  embeddingDimensions: number;
  digests: ArtifactDigests;
  packageManifestChecksum: string;
  chunkManifestChecksum: string;
  errors: string[];
}

export interface TargetLocks {
  controlRoomAuthorizationId: string;
  expectedRepository: string;
  expectedMainSha: string;
  expectedProjectRef: string;
  expectedSourceSha: string;
  expectedIndexVersion: string;
  expectedPackageManifestSha256: string;
  expectedChunkManifestSha256: string;
  expectedChunksSha256: string;
  expectedAuthoritativeLookupSha256: string;
  expectedPackageCount: number;
  expectedChunkCount: number;
  expectedEmbeddingModel: string;
  expectedEmbeddingDimensions: number;
  maxEmbeddingRequests: number;
  databaseUrlEnvName: string;
  providerCredentialEnvName: string;
  confirmInactiveRagImport?: string;
  paidCallAuthorizationId?: string;
  executionId: string;
}

export interface ImporterConfig {
  repoRoot: string;
  operation: ImporterOperation;
  environment: ImporterEnvironment;
  dryRun: boolean;
  locks: TargetLocks;
  stagingVersionKey?: string;
  interruptAfterPackages?: number;
  reportDir?: string;
  /** Test-only: inject SQL executor */
  sql?: SqlExecutor;
  /** Test-only: inject embedding provider */
  embeddings?: EmbeddingProvider;
  /**
   * Test-only: inject observed source SHA resolver.
   * Production/disposable runtime must use git rev-parse HEAD via locks.resolveCheckedOutSourceSha.
   */
  resolveObservedSourceSha?: () => string;
}

export interface StagingChunkInsert {
  sourceId: string;
  pathId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  content: string;
  embedding: number[];
  locale: string;
  packagePath: string;
  sourceSha: string;
  packageChecksum: string;
  chunkChecksum: string;
  contentVersion: string | null;
  indexVersion: string;
  indexState: string;
  sectionIndex: number;
  sectionRole: string;
  chunkPosition: number;
  contentType: string;
  productionRoute: string | null;
  indexingFailed: boolean;
}

export interface SqlExecutor {
  query: (sql: string) => string;
  /** Optional structured insert used by memory/tests to avoid SQL text parsing. */
  insertStagingChunk?: (row: StagingChunkInsert) => void;
  begin?: () => void;
  commit?: () => void;
  rollback?: () => void;
  /** Redacted identifier for reports */
  redactedTargetId: string;
}

export interface EmbeddingProvider {
  readonly kind: "mock" | "openai";
  readonly model: string;
  readonly dimensions: number;
  embedBatch: (
    texts: string[],
    meta: { attemptBudgetRemaining: number },
  ) => Promise<{ vectors: number[][]; attemptsUsed: number }>;
}

export interface RowProgress {
  inserted: number;
  skippedExact: number;
  conflicting: number;
  failed: number;
}

export interface ImporterReport {
  schemaVersion: typeof REPORT_SCHEMA_VERSION;
  reportKind: "preflight" | "progress" | "validation" | "completion" | "failure";
  timestamp: string;
  executionEnvironment: ImporterEnvironment;
  operation: ImporterOperation;
  dryRun: boolean;
  redactedTargetId: string;
  repository: string;
  mainSha: string;
  sourceSha: string;
  indexVersion: string;
  artifactDigests: ArtifactDigests;
  packageCount: number;
  chunkCount: number;
  localePackageCounts: typeof EXPECTED_LOCALE_PACKAGE_COUNTS;
  localeChunkCounts: typeof EXPECTED_LOCALE_CHUNK_COUNTS;
  embeddingModel: string;
  embeddingDimensions: number;
  requestCeiling: number;
  attemptedRequestCount: number;
  stagingVersionKey: string | null;
  rowProgress: RowProgress;
  activeCorpusMutationCount: number;
  validationStatus: "pass" | "fail" | "not_run" | "dry_run";
  errorCode: string | null;
  errorMessageRedacted: string | null;
  authorizationIdPresent: boolean;
  confirmationTokenPresent: boolean;
}

export interface StagingValidationResult {
  ok: boolean;
  stagingVersionKey: string;
  packageCount: number;
  chunkCount: number;
  stagingChunkCount: number;
  activeChunkCountCreatedByImporter: number;
  localeChunkCounts: LocaleCountMap;
  vectorDimensionOk: boolean;
  nonFiniteVectors: number;
  activeCorpusMutationCount: number;
  errors: string[];
}

export { EXPECTED_LOCALE_CHUNK_COUNTS, EXPECTED_LOCALE_PACKAGE_COUNTS };
