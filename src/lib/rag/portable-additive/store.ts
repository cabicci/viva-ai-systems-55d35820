import { buildRecordKey, identityFromParts, sha256Json } from "./identity";
import { planAdditiveImport, planRollbackByBatchId, rejectForbiddenCorpusMutation, type RollbackPlan } from "./planner";
import type {
  AuditReceipt,
  ExistingCorpusRecord,
  ForbiddenCorpusMutation,
  ImportPlan,
  ImportedBatch,
  ImportedBatchRecord,
  PortableVectorRecord,
} from "./types";
import { createAuditReceipt } from "./receipts";

export interface CorpusSnapshot {
  records: ExistingCorpusRecord[];
  fingerprint: string;
}

export function fingerprintExistingCorpus(records: ExistingCorpusRecord[]): string {
  const sorted = [...records].sort((a, b) => a.recordKey.localeCompare(b.recordKey));
  return sha256Json(sorted);
}

export function snapshotExistingCorpus(records: ExistingCorpusRecord[]): CorpusSnapshot {
  return {
    records: records.map((r) => ({ ...r })),
    fingerprint: fingerprintExistingCorpus(records),
  };
}

export function existingCorpusUnchanged(
  before: CorpusSnapshot,
  after: ExistingCorpusRecord[],
): boolean {
  return before.fingerprint === fingerprintExistingCorpus(after);
}

/** In-memory additive import store — never mutates existing corpus records. */
export class PortableAdditiveStore {
  readonly existing: ExistingCorpusRecord[];
  private readonly existingSnapshot: CorpusSnapshot;
  private batches = new Map<string, ImportedBatch>();
  private receipts: AuditReceipt[] = [];

  constructor(existing: ExistingCorpusRecord[]) {
    this.existing = existing.map((r) => ({ ...r }));
    this.existingSnapshot = snapshotExistingCorpus(this.existing);
  }

  getReceipts(): AuditReceipt[] {
    return [...this.receipts];
  }

  private pushReceipt(receipt: AuditReceipt): void {
    this.receipts.push(receipt);
  }

  getBatch(batchId: string): ImportedBatch | undefined {
    return this.batches.get(batchId);
  }

  listBatchIds(): string[] {
    return [...this.batches.keys()].sort();
  }

  existingPreserved(): boolean {
    return existingCorpusUnchanged(this.existingSnapshot, this.existing);
  }

  rejectForbidden(mutation: ForbiddenCorpusMutation, target?: string): ImportPlan {
    const plan = rejectForbiddenCorpusMutation(mutation, target);
    this.pushReceipt(
      createAuditReceipt({
        operation: "reject_forbidden",
        batchId: null,
        ok: false,
        details: { mutation, target: target ?? null, errors: plan.errors },
      }),
    );
    return plan;
  }

  /**
   * Apply additive import. Batch remains inactive.
   * Activation is out of scope and intentionally unsupported.
   */
  importRecords(options: {
    batchId: string;
    model: string;
    vectorDimensions: number;
    records: PortableVectorRecord[];
    retryOnlyFailed?: boolean;
    markFailedKeys?: Set<string>;
  }): { plan: ImportPlan; batch: ImportedBatch | null; receipt: AuditReceipt } {
    const prior = this.batches.get(options.batchId) ?? null;

    // Duplicate batch rejection: same batchId already fully imported successfully and replay without retry
    if (
      prior &&
      !options.retryOnlyFailed &&
      prior.records.size > 0 &&
      [...prior.records.values()].every((r) => !r.indexingFailed)
    ) {
      const allMatch = options.records.every((record) => {
        const key = buildRecordKey(
          identityFromParts(record.locale, record.lessonId, record.chunkId),
        );
        const existing = prior.records.get(key);
        return existing && existing.chunkChecksum === record.chunkChecksum;
      });
      if (allMatch && options.records.length === prior.records.size) {
        const plan = planAdditiveImport({
          batchId: options.batchId,
          records: options.records,
          existing: this.existing,
          priorBatch: prior,
          retryOnlyFailed: false,
        });
        const receipt = createAuditReceipt({
          operation: "replay",
          batchId: options.batchId,
          ok: plan.ok,
          details: {
            insertCount: plan.insertCount,
            skipCount: plan.skipCount,
            retryCount: plan.retryCount,
            rejectCount: plan.rejectCount,
            duplicateBatchReplay: true,
            batchState: prior.state,
          },
        });
        this.pushReceipt(receipt);
        return { plan, batch: prior, receipt };
      }
    }

    // Reject attempting to register a second distinct successful batch under same ID with different payloads
    if (prior && prior.records.size > 0 && !options.retryOnlyFailed) {
      const conflict = options.records.some((record) => {
        const key = buildRecordKey(
          identityFromParts(record.locale, record.lessonId, record.chunkId),
        );
        const existing = prior.records.get(key);
        return existing && existing.chunkChecksum !== record.chunkChecksum && !existing.indexingFailed;
      });
      if (conflict) {
        const plan: ImportPlan = {
          batchId: options.batchId,
          ok: false,
          entries: [],
          insertCount: 0,
          skipCount: 0,
          retryCount: 0,
          rejectCount: 1,
          errors: ["duplicate_batch_conflict"],
        };
        const receipt = createAuditReceipt({
          operation: "import",
          batchId: options.batchId,
          ok: false,
          details: { errors: plan.errors },
        });
        this.pushReceipt(receipt);
        return { plan, batch: prior, receipt };
      }
    }

    const plan = planAdditiveImport({
      batchId: options.batchId,
      records: options.records,
      existing: this.existing,
      priorBatch: prior,
      retryOnlyFailed: options.retryOnlyFailed,
    });

    if (!plan.ok && plan.rejectCount > 0 && plan.insertCount === 0 && plan.retryCount === 0) {
      const receipt = createAuditReceipt({
        operation: options.retryOnlyFailed ? "retry_failed" : "import",
        batchId: options.batchId,
        ok: false,
        details: {
          errors: plan.errors,
          rejectCount: plan.rejectCount,
        },
      });
      this.pushReceipt(receipt);
      return { plan, batch: prior, receipt };
    }

    const batch: ImportedBatch = prior
      ? {
          batchId: prior.batchId,
          state: "inactive",
          model: options.model,
          vectorDimensions: options.vectorDimensions,
          records: new Map(prior.records),
        }
      : {
          batchId: options.batchId,
          state: "inactive",
          model: options.model,
          vectorDimensions: options.vectorDimensions,
          records: new Map(),
        };

    const recordByKey = new Map(
      options.records.map((r) => {
        const identity = identityFromParts(r.locale, r.lessonId, r.chunkId);
        return [buildRecordKey(identity), r] as const;
      }),
    );

    for (const entry of plan.entries) {
      if (
        entry.action !== "insert" &&
        entry.action !== "retry_failed"
      ) {
        continue;
      }
      const source = recordByKey.get(entry.recordKey);
      if (!source) continue;

      const failed = options.markFailedKeys?.has(entry.recordKey) ?? false;
      const imported: ImportedBatchRecord = {
        recordKey: entry.recordKey,
        identity: entry.identity,
        chunkChecksum: source.chunkChecksum,
        model: source.model,
        vectorDimensions: source.vectorDimensions,
        embedding: [...source.embedding],
        state: "inactive",
        indexingFailed: failed,
      };
      batch.records.set(entry.recordKey, imported);
    }

    // Ensure all successful records remain inactive
    for (const [key, rec] of batch.records) {
      batch.records.set(key, { ...rec, state: "inactive" });
    }
    batch.state = "inactive";

    this.batches.set(options.batchId, batch);

    const receipt = createAuditReceipt({
      operation: options.retryOnlyFailed ? "retry_failed" : prior ? "replay" : "import",
      batchId: options.batchId,
      ok: plan.ok && this.existingPreserved(),
      details: {
        insertCount: plan.insertCount,
        skipCount: plan.skipCount,
        retryCount: plan.retryCount,
        rejectCount: plan.rejectCount,
        batchState: batch.state,
        recordCount: batch.records.size,
        existingCorpusPreserved: this.existingPreserved(),
        activeRecords: 0,
      },
    });
    this.pushReceipt(receipt);
    return { plan, batch, receipt };
  }

  planRollback(batchId: string): { plan: RollbackPlan; receipt: AuditReceipt } {
    const batch = this.batches.get(batchId) ?? null;
    const plan = planRollbackByBatchId(batch, batchId);
    const receipt = createAuditReceipt({
      operation: "plan_rollback",
      batchId,
      ok: plan.ok,
      details: {
        recordKeysToRemove: plan.recordKeysToRemove,
        existingCorpusUntouched: plan.existingCorpusUntouched,
        errors: plan.errors,
      },
    });
    this.pushReceipt(receipt);
    return { plan, receipt };
  }

  applyRollback(batchId: string): { ok: boolean; removed: number } {
    const { plan } = this.planRollback(batchId);
    if (!plan.ok) return { ok: false, removed: 0 };
    this.batches.delete(batchId);
    return {
      ok: this.existingPreserved(),
      removed: plan.recordKeysToRemove.length,
    };
  }

  /** Activation is out of scope — always fail closed. */
  activateBatch(_batchId: string): { ok: false; reason: string } {
    return { ok: false, reason: "activation_out_of_scope" };
  }

  getInactiveRecordCount(batchId: string): number {
    const batch = this.batches.get(batchId);
    if (!batch) return 0;
    return [...batch.records.values()].filter((r) => r.state === "inactive").length;
  }
}
