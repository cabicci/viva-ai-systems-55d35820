/** Portable additive RAG core — schema and identity contracts (Phase A). */

export const PORTABLE_ADDITIVE_SCHEMA = "rag-portable-additive-v1" as const;

export type PortableBatchState = "inactive" | "failed";

/** Deterministic batch identity inputs. */
export interface BatchIdentityInput {
  candidateSha: string;
  contentFreezeSha: string;
  model: string;
  vectorDimensions: number;
  packageManifestChecksum: string;
  chunkManifestChecksum: string;
}

/** Deterministic record identity — locale + lesson + stable chunk id. */
export interface RecordIdentity {
  locale: string;
  lessonId: string;
  chunkId: string;
}

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
  bytes: number;
  recordCount?: number;
}

export interface PortableArtifactManifest {
  schemaVersion: typeof PORTABLE_ADDITIVE_SCHEMA;
  batchId: string;
  candidateSha: string;
  contentFreezeSha: string;
  model: string;
  vectorDimensions: number;
  packageCount: number;
  chunkCount: number;
  packageManifestChecksum: string;
  chunkManifestChecksum: string;
  files: PortableArtifactFileEntry[];
  payloadChecksum: string;
  generatedAt: string;
}

/** Existing corpus record that must never be deleted, overwritten, or re-keyed. */
export interface ExistingCorpusRecord {
  recordKey: string;
  locale: string;
  lessonId: string;
  chunkId: string;
  chunkChecksum: string;
  sourceType: string;
}

export type PlanAction =
  | "insert"
  | "skip_unchanged"
  | "retry_failed"
  | "reject_duplicate"
  | "reject_collision"
  | "reject_forbidden";

export interface ImportPlanEntry {
  recordKey: string;
  identity: RecordIdentity;
  action: PlanAction;
  reason: string;
}

export interface ImportPlan {
  batchId: string | null;
  ok: boolean;
  entries: ImportPlanEntry[];
  insertCount: number;
  skipCount: number;
  retryCount: number;
  rejectCount: number;
  errors: string[];
}

export interface ImportedBatchRecord {
  recordKey: string;
  identity: RecordIdentity;
  chunkChecksum: string;
  model: string;
  vectorDimensions: number;
  embedding: number[];
  state: PortableBatchState;
  indexingFailed: boolean;
}

export interface ImportedBatch {
  batchId: string;
  state: PortableBatchState;
  model: string;
  vectorDimensions: number;
  records: Map<string, ImportedBatchRecord>;
}

export interface ArtifactValidationReport {
  ok: boolean;
  recordCount: number;
  duplicateChunkIds: number;
  checksumMismatches: number;
  dimensionMismatches: number;
  modelMismatches: number;
  missingMetadata: number;
  errors: string[];
}

export interface AuditReceipt {
  receiptId: string;
  operation:
    | "validate_artifact"
    | "plan_import"
    | "import"
    | "replay"
    | "retry_failed"
    | "plan_rollback"
    | "reject_forbidden";
  batchId: string | null;
  ok: boolean;
  timestamp: string;
  details: Record<string, unknown>;
}

export type ForbiddenCorpusMutation =
  | "delete_existing"
  | "overwrite_existing"
  | "rekey_existing"
  | "rebuild_existing";
