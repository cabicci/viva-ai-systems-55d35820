import { buildRecordKey, identityFromParts } from "./identity";
import type {
  ExistingCorpusRecord,
  ForbiddenCorpusMutation,
  ImportPlan,
  ImportPlanEntry,
  ImportedBatch,
  PortableVectorRecord,
} from "./types";

function existingKeySet(existing: ExistingCorpusRecord[]): Set<string> {
  return new Set(existing.map((r) => r.recordKey));
}

/**
 * Reject any explicit mutation plan targeting the existing corpus.
 * Additive-only invariant — fail closed.
 */
export function rejectForbiddenCorpusMutation(
  mutation: ForbiddenCorpusMutation,
  targetRecordKey?: string,
): ImportPlan {
  return {
    batchId: null,
    ok: false,
    entries: [
      {
        recordKey: targetRecordKey ?? "*",
        identity: identityFromParts("*", "*", "*"),
        action: "reject_forbidden",
        reason: `forbidden_corpus_mutation:${mutation}`,
      },
    ],
    insertCount: 0,
    skipCount: 0,
    retryCount: 0,
    rejectCount: 1,
    errors: [`Rejected forbidden operation: ${mutation}`],
  };
}

export interface PlanImportOptions {
  batchId: string;
  records: PortableVectorRecord[];
  existing: ExistingCorpusRecord[];
  /** Prior imported batch for idempotent replay / retry. */
  priorBatch?: ImportedBatch | null;
  retryOnlyFailed?: boolean;
}

/** Build an additive-only import plan. Never plans delete/overwrite/re-key of existing corpus. */
export function planAdditiveImport(options: PlanImportOptions): ImportPlan {
  const { batchId, records, existing, priorBatch, retryOnlyFailed = false } = options;
  const existingKeys = existingKeySet(existing);
  const entries: ImportPlanEntry[] = [];
  const errors: string[] = [];
  const seenInArtifact = new Set<string>();

  let insertCount = 0;
  let skipCount = 0;
  let retryCount = 0;
  let rejectCount = 0;

  if (priorBatch && priorBatch.batchId !== batchId && priorBatch.records.size > 0) {
    // Duplicate batch identity with different content is handled at store level;
    // planning against a different prior batch ID is allowed only for fresh import.
  }

  for (const record of records) {
    const identity = identityFromParts(record.locale, record.lessonId, record.chunkId);
    const recordKey = buildRecordKey(identity);

    if (seenInArtifact.has(recordKey)) {
      entries.push({
        recordKey,
        identity,
        action: "reject_duplicate",
        reason: "duplicate_in_artifact",
      });
      rejectCount += 1;
      errors.push(`duplicate record in artifact: ${recordKey}`);
      continue;
    }
    seenInArtifact.add(recordKey);

    if (existingKeys.has(recordKey)) {
      entries.push({
        recordKey,
        identity,
        action: "reject_collision",
        reason: "collides_with_existing_corpus",
      });
      rejectCount += 1;
      errors.push(`collision with existing corpus: ${recordKey}`);
      continue;
    }

    // Also reject same chunkId under existing legacy keys by chunkId alone when locale is protected
    if (record.locale === "ar-EG") {
      entries.push({
        recordKey,
        identity,
        action: "reject_forbidden",
        reason: "ar_eg_locale_not_allowed_in_additive_batch",
      });
      rejectCount += 1;
      errors.push(`ar-EG locale forbidden in additive batch: ${recordKey}`);
      continue;
    }

    const prior = priorBatch?.records.get(recordKey);

    if (retryOnlyFailed) {
      if (!prior) {
        entries.push({
          recordKey,
          identity,
          action: "skip_unchanged",
          reason: "retry_only_failed_skip_absent",
        });
        skipCount += 1;
        continue;
      }
      if (!prior.indexingFailed) {
        entries.push({
          recordKey,
          identity,
          action: "skip_unchanged",
          reason: "retry_only_failed_skip_success",
        });
        skipCount += 1;
        continue;
      }
      entries.push({
        recordKey,
        identity,
        action: "retry_failed",
        reason: "retry_only_failed_selected",
      });
      retryCount += 1;
      continue;
    }

    if (prior && !prior.indexingFailed && prior.chunkChecksum === record.chunkChecksum) {
      entries.push({
        recordKey,
        identity,
        action: "skip_unchanged",
        reason: "idempotent_skip_unchanged",
      });
      skipCount += 1;
      continue;
    }

    if (prior?.indexingFailed) {
      entries.push({
        recordKey,
        identity,
        action: "retry_failed",
        reason: "prior_failed_retry",
      });
      retryCount += 1;
      continue;
    }

    entries.push({
      recordKey,
      identity,
      action: "insert",
      reason: "additive_insert",
    });
    insertCount += 1;
  }

  return {
    batchId,
    ok: errors.length === 0,
    entries,
    insertCount,
    skipCount,
    retryCount,
    rejectCount,
    errors,
  };
}

export interface RollbackPlan {
  batchId: string;
  ok: boolean;
  recordKeysToRemove: string[];
  existingCorpusUntouched: true;
  errors: string[];
}

/** Rollback planning by batch ID — removes only inactive imported batch records. */
export function planRollbackByBatchId(
  batch: ImportedBatch | null,
  batchId: string,
): RollbackPlan {
  if (!batch || batch.batchId !== batchId) {
    return {
      batchId,
      ok: false,
      recordKeysToRemove: [],
      existingCorpusUntouched: true,
      errors: ["batch_not_found"],
    };
  }
  if (batch.state !== "inactive" && batch.state !== "failed") {
    return {
      batchId,
      ok: false,
      recordKeysToRemove: [],
      existingCorpusUntouched: true,
      errors: ["batch_state_not_rollbackable"],
    };
  }
  return {
    batchId,
    ok: true,
    recordKeysToRemove: [...batch.records.keys()].sort(),
    existingCorpusUntouched: true,
    errors: [],
  };
}
