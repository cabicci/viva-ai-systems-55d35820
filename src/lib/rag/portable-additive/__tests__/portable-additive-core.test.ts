import { describe, expect, it, beforeEach } from "vitest";
import {
  buildBatchId,
  buildPortableArtifact,
  buildRecordKey,
  identityFromParts,
  makeExistingCorpus,
  makeSyntheticLocalizedCorpus,
  makeSyntheticVector,
  planAdditiveImport,
  planRollbackByBatchId,
  PortableAdditiveStore,
  resetReceiptSeqForTests,
  validatePortableArtifact,
  readArtifactRecords,
  serializeManifest,
  type PortableArtifactManifest,
} from "@/lib/rag/portable-additive";

const MODEL = "text-embedding-3-small";
const DIMS = 8;

describe("portable additive RAG core", () => {
  beforeEach(() => {
    resetReceiptSeqForTests();
  });

  it("builds deterministic batch and record identity independent of corpus size", () => {
    const identity = {
      candidateSha: "aaa",
      contentFreezeSha: "bbb",
      model: MODEL,
      vectorDimensions: DIMS,
      packageManifestChecksum: "pkg",
      chunkManifestChecksum: "chk",
    };
    const a = buildBatchId(identity);
    const b = buildBatchId(identity);
    expect(a).toBe(b);
    expect(a.startsWith("rag-additive-")).toBe(true);

    const small = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const large = makeSyntheticLocalizedCorpus({ perLocale: 5, dims: DIMS, model: MODEL });
    expect(small).toHaveLength(3);
    expect(large).toHaveLength(15);

    const key = buildRecordKey(identityFromParts("en", "lesson-1", "en/lesson-1/s0/c0"));
    expect(key).toBe("en::lesson-1::en/lesson-1/s0/c0");
  });

  it("validates portable artifact schema and complete vector payloads", () => {
    const records = makeSyntheticLocalizedCorpus({ perLocale: 2, dims: DIMS, model: MODEL });
    const built = buildPortableArtifact({
      candidateSha: "cand",
      contentFreezeSha: "freeze",
      model: MODEL,
      vectorDimensions: DIMS,
      packageCount: 6,
      packageManifestChecksum: "pkg-sum",
      chunkManifestChecksum: "chk-sum",
      records,
    });

    expect(built.manifest.schemaVersion).toBe("rag-portable-additive-v1");
    expect(built.manifest.chunkCount).toBe(records.length);
    expect(built.files.has("artifact-manifest.json")).toBe(true);
    expect([...built.files.keys()].some((k) => k.startsWith("vectors-shard-"))).toBe(true);

    const report = validatePortableArtifact(built.files);
    expect(report.ok).toBe(true);
    expect(report.recordCount).toBe(records.length);
    expect(report.checksumMismatches).toBe(0);
    expect(report.dimensionMismatches).toBe(0);
    expect(report.modelMismatches).toBe(0);
    expect(report.duplicateChunkIds).toBe(0);

    const loaded = readArtifactRecords(built.files);
    expect(loaded.records).toHaveLength(records.length);
    expect(loaded.records.every((r) => r.embedding.length === DIMS)).toBe(true);
  });

  it("supports arbitrary corpus sizes without hard-coded 2692 behavior", () => {
    for (const perLocale of [1, 2, 4, 7]) {
      const records = makeSyntheticLocalizedCorpus({ perLocale, dims: DIMS, model: MODEL });
      const existing = makeExistingCorpus(3);
      const store = new PortableAdditiveStore(existing);
      const built = buildPortableArtifact({
        candidateSha: `cand-${perLocale}`,
        contentFreezeSha: "freeze",
        model: MODEL,
        vectorDimensions: DIMS,
        packageCount: perLocale * 3,
        packageManifestChecksum: `pkg-${perLocale}`,
        chunkManifestChecksum: `chk-${perLocale}`,
        records,
      });
      const result = store.importRecords({
        batchId: built.manifest.batchId,
        model: MODEL,
        vectorDimensions: DIMS,
        records,
      });
      expect(result.plan.insertCount).toBe(records.length);
      expect(result.batch?.records.size).toBe(records.length);
      expect(store.getInactiveRecordCount(built.manifest.batchId)).toBe(records.length);
      expect(store.existingPreserved()).toBe(true);
    }
  });

  it("plans valid additive import and keeps batch inactive", () => {
    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const store = new PortableAdditiveStore(makeExistingCorpus(2));
    const batchId = buildBatchId({
      candidateSha: "c1",
      contentFreezeSha: "f1",
      model: MODEL,
      vectorDimensions: DIMS,
      packageManifestChecksum: "p1",
      chunkManifestChecksum: "h1",
    });
    const { plan, batch, receipt } = store.importRecords({
      batchId,
      model: MODEL,
      vectorDimensions: DIMS,
      records,
    });
    expect(plan.ok).toBe(true);
    expect(plan.insertCount).toBe(3);
    expect(batch?.state).toBe("inactive");
    expect(store.activateBatch(batchId).ok).toBe(false);
    expect(store.activateBatch(batchId).reason).toBe("activation_out_of_scope");
    expect(receipt.ok).toBe(true);
    expect(receipt.details.batchState).toBe("inactive");
    expect(receipt.details.activeRecords).toBe(0);
  });

  it("idempotent replay skips unchanged successful records", () => {
    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const store = new PortableAdditiveStore(makeExistingCorpus(1));
    const batchId = "batch-idem";
    const first = store.importRecords({ batchId, model: MODEL, vectorDimensions: DIMS, records });
    expect(first.plan.insertCount).toBe(3);
    const second = store.importRecords({ batchId, model: MODEL, vectorDimensions: DIMS, records });
    expect(second.plan.insertCount).toBe(0);
    expect(second.plan.skipCount).toBe(3);
    expect(second.receipt.operation).toBe("replay");
    expect(store.getInactiveRecordCount(batchId)).toBe(3);
  });

  it("rejects duplicate records in artifact and duplicate batch conflicts", () => {
    const base = makeSyntheticVector("en", "lesson-1", 0, DIMS, MODEL);
    const dup = { ...base };
    const plan = planAdditiveImport({
      batchId: "b1",
      records: [base, dup],
      existing: [],
    });
    expect(plan.rejectCount).toBe(1);
    expect(plan.ok).toBe(false);

    const store = new PortableAdditiveStore([]);
    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    store.importRecords({ batchId: "b-conflict", model: MODEL, vectorDimensions: DIMS, records });
    const mutated = records.map((r, i) =>
      i === 0 ? { ...r, chunkChecksum: "different", embedding: [...r.embedding] } : r,
    );
    const conflict = store.importRecords({
      batchId: "b-conflict",
      model: MODEL,
      vectorDimensions: DIMS,
      records: mutated,
    });
    expect(conflict.plan.ok).toBe(false);
    expect(conflict.plan.errors).toContain("duplicate_batch_conflict");
  });

  it("selects retry-only-failed units after partial failure", () => {
    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const store = new PortableAdditiveStore([]);
    const batchId = "batch-retry";
    const failedKey = buildRecordKey(
      identityFromParts(records[0].locale, records[0].lessonId, records[0].chunkId),
    );
    const first = store.importRecords({
      batchId,
      model: MODEL,
      vectorDimensions: DIMS,
      records,
      markFailedKeys: new Set([failedKey]),
    });
    expect(first.batch?.records.get(failedKey)?.indexingFailed).toBe(true);

    const retryPlan = planAdditiveImport({
      batchId,
      records,
      existing: [],
      priorBatch: first.batch!,
      retryOnlyFailed: true,
    });
    expect(retryPlan.retryCount).toBe(1);
    expect(retryPlan.skipCount).toBe(2);

    const retry = store.importRecords({
      batchId,
      model: MODEL,
      vectorDimensions: DIMS,
      records,
      retryOnlyFailed: true,
    });
    expect(retry.plan.retryCount).toBe(1);
    expect(retry.receipt.operation).toBe("retry_failed");
    expect(retry.batch?.records.get(failedKey)?.indexingFailed).toBe(false);
  });

  it("plans rollback by batch ID without touching existing corpus", () => {
    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const existing = makeExistingCorpus(5);
    const store = new PortableAdditiveStore(existing);
    const batchId = "batch-rb";
    store.importRecords({ batchId, model: MODEL, vectorDimensions: DIMS, records });
    const { plan } = store.planRollback(batchId);
    expect(plan.ok).toBe(true);
    expect(plan.recordKeysToRemove).toHaveLength(3);
    expect(plan.existingCorpusUntouched).toBe(true);

    const applied = store.applyRollback(batchId);
    expect(applied.ok).toBe(true);
    expect(applied.removed).toBe(3);
    expect(store.getBatch(batchId)).toBeUndefined();
    expect(store.existingPreserved()).toBe(true);
    expect(store.existing).toHaveLength(5);

    const missing = planRollbackByBatchId(null, "nope");
    expect(missing.ok).toBe(false);
  });

  it("fails closed on incomplete and inconsistent artifacts", () => {
    const incomplete = validatePortableArtifact(new Map());
    expect(incomplete.ok).toBe(false);
    expect(incomplete.errors).toContain("artifact-manifest.json missing");

    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const built = buildPortableArtifact({
      candidateSha: "cand",
      contentFreezeSha: "freeze",
      model: MODEL,
      vectorDimensions: DIMS,
      packageCount: 3,
      packageManifestChecksum: "pkg",
      chunkManifestChecksum: "chk",
      records,
    });
    const tampered = new Map(built.files);
    const manifest = JSON.parse(
      tampered.get("artifact-manifest.json")!.toString("utf8"),
    ) as PortableArtifactManifest;
    manifest.payloadChecksum = "0".repeat(64);
    tampered.set("artifact-manifest.json", serializeManifest(manifest));
    const inconsistent = validatePortableArtifact(tampered);
    expect(inconsistent.ok).toBe(false);
    expect(inconsistent.errors.some((e) => e.includes("payloadChecksum"))).toBe(true);
  });

  it("rejects dimension and model mismatches", () => {
    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const badDim = [{ ...records[0], embedding: [1, 2, 3], vectorDimensions: 3 }];
    expect(() =>
      buildPortableArtifact({
        candidateSha: "c",
        contentFreezeSha: "f",
        model: MODEL,
        vectorDimensions: DIMS,
        packageCount: 1,
        packageManifestChecksum: "p",
        chunkManifestChecksum: "h",
        records: badDim,
      }),
    ).toThrow(/dimension mismatch/);

    const badModel = [{ ...records[0], model: "other-model" }];
    expect(() =>
      buildPortableArtifact({
        candidateSha: "c",
        contentFreezeSha: "f",
        model: MODEL,
        vectorDimensions: DIMS,
        packageCount: 1,
        packageManifestChecksum: "p",
        chunkManifestChecksum: "h",
        records: badModel,
      }),
    ).toThrow(/model mismatch/);
  });

  it("rejects existing-corpus delete, overwrite, and re-key mutations", () => {
    const store = new PortableAdditiveStore(makeExistingCorpus(2));
    for (const mutation of ["delete_existing", "overwrite_existing", "rekey_existing", "rebuild_existing"] as const) {
      const plan = store.rejectForbidden(mutation, "ar-EG::legacy-l1::legacy/legacy-l1/c0");
      expect(plan.ok).toBe(false);
      expect(plan.entries[0].action).toBe("reject_forbidden");
    }
    expect(store.existingPreserved()).toBe(true);

    const collision = makeSyntheticVector("ar-EG", "legacy-l1", 0, DIMS, MODEL);
    collision.chunkId = "legacy/legacy-l1/c0";
    const plan = planAdditiveImport({
      batchId: "x",
      records: [collision],
      existing: store.existing,
    });
    expect(plan.ok).toBe(false);
    expect(plan.entries.some((e) => e.action === "reject_collision" || e.action === "reject_forbidden")).toBe(
      true,
    );
  });

  it("emits deterministic audit receipts and validation reports", () => {
    resetReceiptSeqForTests();
    const storeA = new PortableAdditiveStore([]);
    const storeB = new PortableAdditiveStore([]);
    const records = makeSyntheticLocalizedCorpus({ perLocale: 1, dims: DIMS, model: MODEL });
    const a = storeA.importRecords({
      batchId: "receipt-batch",
      model: MODEL,
      vectorDimensions: DIMS,
      records,
    });
    resetReceiptSeqForTests();
    const b = storeB.importRecords({
      batchId: "receipt-batch",
      model: MODEL,
      vectorDimensions: DIMS,
      records,
    });
    expect(a.receipt.receiptId).toBe(b.receipt.receiptId);
    expect(a.receipt.operation).toBe("import");
    expect(storeA.getReceipts()).toHaveLength(1);
  });
});
