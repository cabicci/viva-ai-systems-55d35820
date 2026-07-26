/**
 * Lovable-native resumable importer contracts.
 * Authorization: CR-RAG-LOVABLE-NATIVE-RESUMABLE-IMPORTER-20260727-01
 *
 * Provenance is server-locked. Browser/request inputs must never supply
 * source SHA, digests, version key, model, dimensions, or execution ID.
 *
 * Identity note:
 * - Bun CLI remains Git-checkout-SHA locked (git rev-parse HEAD).
 * - Lovable-native Worker is corpus-provenance locked (artifact digests +
 *   frozen source SHA in manifests). These are complementary, not interchangeable.
 * - No caller-supplied observed SHA is trusted.
 */

export { LOVABLE_NATIVE_AUTHORIZATION_ID } from "./public-ids";

export const EXECUTOR_CONTRACT_VERSION = "rag-lovable-native-resumable-v1" as const;

export const LOCKED_SOURCE_SHA = "3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2" as const;
export const LOCKED_INDEX_VERSION = "rag-index-v1" as const;

export const LOCKED_ARTIFACT_DIGESTS = {
  packageManifestSha256: "0ca5afee1c9e7ade676553cc51e3a0dd55515508a54f046dde098826b5fb510e",
  chunkManifestSha256: "3bfb0d1a04053adc6da5580283dd14d54ade85e079dcac12ceddf5ed1ef1faca",
  chunksSha256: "24a7ae7af60db811fab63b52604d79bc18fb5d82dd14e99e687e90a6dea216ca",
  authoritativeLookupSha256: "6f3bad994c0d0bb8b2a92fcc3d1e729cd98bab685d68e882dab7d69c7c910f8b",
} as const;

export const LOCKED_PACKAGE_COUNT = 400 as const;
export const LOCKED_CHUNK_COUNT = 3700 as const;
export const LOCKED_LOCALE_PACKAGE_COUNTS = {
  "ar-EG": 100,
  "ar-MSA": 100,
  "ar-Gulf": 100,
  en: 100,
} as const;
export const LOCKED_LOCALE_CHUNK_COUNTS = {
  "ar-EG": 1008,
  "ar-MSA": 866,
  "ar-Gulf": 862,
  en: 964,
} as const;

export const LOCKED_EMBEDDING_MODEL = "text-embedding-3-small" as const;
export const LOCKED_EMBEDDING_DIMENSIONS = 1536 as const;
export const LOCKED_BATCH_SIZE = 64 as const;
export const LOCKED_PLANNED_BATCH_COUNT = 58 as const;
export const LOCKED_LAST_BATCH_SIZE = 52 as const;
export const LOCKED_MAX_PROVIDER_ATTEMPTS = 67 as const;

export type SanitizedErrorCode =
  | "DIGEST_MISMATCH"
  | "CORPUS_ADMISSION_FAILED"
  | "MISSING_OPENAI_KEY"
  | "NO_SESSION"
  | "PROVIDER_ATTEMPT_CEILING"
  | "PROVIDER_FAILED"
  | "PROVIDER_RESPONSE_INVALID"
  | "COMMIT_FAILED"
  | "CLAIM_FAILED"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "INTERNAL";

export interface RagImportStatusView {
  ok: boolean;
  executionId: string | null;
  stagingVersionKey: string | null;
  sessionState: string | null;
  completedBatchCount: number;
  pendingBatchCount: number;
  failedBatchCount: number;
  acceptedChunkCount: number;
  providerAttemptCount: number;
  nextBatchOrdinal: number | null;
  currentActiveVersionKey: string | null;
  legacyLessonCount: number | null;
  localeLessonCount: number | null;
  lastErrorCode: string | null;
  plannedBatchCount: number;
  maxProviderAttempts: number;
  lockedCorpus: {
    sourceSha: typeof LOCKED_SOURCE_SHA;
    indexVersion: typeof LOCKED_INDEX_VERSION;
    packageCount: typeof LOCKED_PACKAGE_COUNT;
    chunkCount: typeof LOCKED_CHUNK_COUNT;
    model: typeof LOCKED_EMBEDDING_MODEL;
    dimensions: typeof LOCKED_EMBEDDING_DIMENSIONS;
    digests: typeof LOCKED_ARTIFACT_DIGESTS;
    executorContractVersion: typeof EXECUTOR_CONTRACT_VERSION;
  };
  activationEnabled: false;
  rollbackEnabled: false;
}

export interface ClaimedBatch {
  done: boolean;
  executionId: string;
  versionKey: string;
  batchOrdinal?: number;
  chunkOffset?: number;
  chunkCount?: number;
  leaseToken?: string;
  providerAttemptTotal?: number;
}

export interface CommitRow {
  sourceId: string;
  sourceType: "locale_lesson";
  indexState: "staging";
  indexVersion: string;
  sourceSha: typeof LOCKED_SOURCE_SHA;
  pathId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  content: string;
  locale: string;
  packagePath: string;
  packageChecksum: string;
  chunkChecksum: string;
  contentVersion: string | null;
  sectionIndex: number;
  sectionRole: string;
  chunkPosition: number;
  contentType: string;
  productionRoute: string | null;
  embedding: number[];
}

export interface BatchBoundary {
  ordinal: number;
  offset: number;
  count: number;
}

/** Fixed artifact-order batch plan: 57×64 + final 52 = 58 batches. */
export function planBatchBoundaries(
  chunkCount = LOCKED_CHUNK_COUNT,
  batchSize = LOCKED_BATCH_SIZE,
): BatchBoundary[] {
  if (chunkCount !== LOCKED_CHUNK_COUNT || batchSize !== LOCKED_BATCH_SIZE) {
    throw new Error("LOCKED_BATCH_PLAN_ONLY");
  }
  const batches: BatchBoundary[] = [];
  for (let ordinal = 0; ordinal < LOCKED_PLANNED_BATCH_COUNT; ordinal++) {
    const offset = ordinal * batchSize;
    const count = ordinal === LOCKED_PLANNED_BATCH_COUNT - 1 ? LOCKED_LAST_BATCH_SIZE : batchSize;
    batches.push({ ordinal, offset, count });
  }
  return batches;
}
