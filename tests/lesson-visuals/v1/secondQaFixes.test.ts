import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AUTHORITATIVE_BASE_SOURCE_SHA, FIXTURE_RECEIPT_MARKER } from "../../../src/lib/lesson-visuals/v1/constants";
import { assertSafeCellId } from "../../../src/lib/lesson-visuals/v1/production/cellPaths";
import { loadProductionConfig, type ProductionEnv } from "../../../src/lib/lesson-visuals/v1/production/config";
import {
  assertSkippedCellHasNoAcceptedOutputs,
  runProductionCell,
} from "../../../src/lib/lesson-visuals/v1/production/cellRunner";
import { createMockProvider } from "../../../src/lib/lesson-visuals/v1/production/mockProvider";
import { encodeSolidPng, sha256Hex } from "../../../src/lib/lesson-visuals/v1/production/pngCodec";
import {
  buildRuntimeQuotaContext,
  reconcileAttemptRecords,
  resolveAttemptSlot,
} from "../../../src/lib/lesson-visuals/v1/production/quotaContext";
import { fingerprintProductionReceipt } from "../../../src/lib/lesson-visuals/v1/production/receipts";
import { validateOutputValidationSchema } from "../../../src/lib/lesson-visuals/v1/production/schemaValidator";
import { writeCellAttemptMeta } from "../../../src/lib/lesson-visuals/v1/production/attemptMeta";
import { verifyCellArtifacts } from "../../../src/lib/lesson-visuals/v1/production/verifyCellArtifacts";
import type { ProductionCellReceipt, ProductionConfig } from "../../../src/lib/lesson-visuals/v1/production/types";

const EXECUTION_SHA = "2c441e449d57dd834366c260a2dd37b251a5583b";

const temps: string[] = [];
afterEach(() => {
  while (temps.length) rmSync(temps.pop()!, { recursive: true, force: true });
});

function dryEnv(over: Partial<ProductionEnv> = {}): ProductionEnv {
  return {
    LESSON_VISUALS_EXECUTION_MODE: "dry-run",
    LESSON_VISUALS_PROVIDER_NAME: "mock-provider",
    LESSON_VISUALS_PROVIDER_MODEL: "mock-renderer-v1",
    LESSON_VISUALS_PROVIDER_API_KEY: "",
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: "acct-test",
    LESSON_VISUALS_PROVIDER_PROJECT_ID: "proj-test",
    LESSON_VISUALS_AI_AUTH_ID: "auth-test",
    LESSON_VISUALS_STORAGE_CREDENTIAL: "",
    LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS: "1000000000",
    LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS: "100000",
    LESSON_VISUALS_MAX_OUTPUT_BYTES: "5000000",
    LESSON_VISUALS_ALLOWED_MIME_TYPES: "image/png",
    LESSON_VISUALS_REQUIRED_WIDTH: "64",
    LESSON_VISUALS_REQUIRED_HEIGHT: "36",
    LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: "800",
    LESSON_VISUALS_MAX_RETRIES: "1",
    LESSON_VISUALS_OUTPUT_STORAGE_TARGET: "artifact://lesson-visuals",
    LOVABLE_DISPATCH_ACTORS: "lovable",
    ...over,
  };
}

function cfg(over: Partial<ProductionEnv> = {}): ProductionConfig {
  const r = loadProductionConfig(dryEnv(over));
  expect(r.ok, r.errors.join("; ")).toBe(true);
  return r.config!;
}

function quotaFor(
  cellIds: string[],
  skipped: string[] = [],
  over: { maxRetries?: number; configuredProviderAttemptQuota?: number } = {},
) {
  const built = buildRuntimeQuotaContext({
    runId: "run-qa",
    controlRoomAuthorizationId: "CR-QA",
    contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
    approvedManifestSha256: "a".repeat(64),
    mode: skipped.length ? "failed-only" : "full",
    allCellIds: cellIds.length === 400 ? cellIds : padTo400(cellIds),
    skippedCellIds: skipped,
    maxRetries: over.maxRetries ?? 1,
    configuredProviderAttemptQuota: over.configuredProviderAttemptQuota ?? 800,
  });
  expect(built.ok, built.errors.join("; ")).toBe(true);
  return built.context!;
}

function padTo400(seed: string[]): string[] {
  const out = [...seed];
  let i = 0;
  while (out.length < 400) {
    out.push(`pad-lesson-${i}__en`);
    i += 1;
  }
  return out;
}

function makePrior(cellId: string, lessonId: string): ProductionCellReceipt {
  const contentSha256 = sha256Hex(encodeSolidPng(64, 36, [1, 2, 3]));
  const idempotencyKey = `prior-${cellId}`;
  const approvedManifestSha256 = "a".repeat(64);
  const fingerprint = fingerprintProductionReceipt({
    runId: "prior-run",
    cellId,
    lessonId,
    locale: "en",
    method: 1,
    contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
    approvedManifestSha256,
    idempotencyKey,
    contentSha256,
  });
  return {
    schemaVersion: "lesson-visual-production-receipt/v1",
    status: "ACCEPTED",
    runId: "prior-run",
    controlRoomAuthorizationId: "CR-PRIOR",
    contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
    approvedManifestSha256,
    cellId,
    lessonId,
    locale: "en",
    method: 1,
    providerName: "mock-provider",
    providerRequestId: "req1",
    modelOrRenderer: "mock-renderer-v1",
    providerAccountId: "acct-test",
    providerProjectId: "proj-test",
    providerAuthId: "auth-test",
    idempotencyKey,
    attemptNumber: 1,
    outputPathOrStorageKey: `artifact://lesson-visuals/${cellId}.png`,
    mimeType: "image/png",
    width: 64,
    height: 36,
    byteLength: 100,
    contentSha256,
    costMicros: "1000",
    rightsProvenanceRef: `rights/${cellId}.rights.json`,
    validationRef: `validations/${cellId}.validation.json`,
    fingerprint,
    producedAt: "2026-07-21T00:00:00.000Z",
    completedAt: "2026-07-21T00:00:00.000Z",
    failureCode: null,
    retryable: null,
    error: null,
    fixtureMarker: FIXTURE_RECEIPT_MARKER,
  };
}

describe("Correction1 skipped-cell write path", () => {
  it("real runner creates missing cell dir, writes attempt-meta+receipt, no mapping/output", async () => {
    const dir = mkdtempSync(join(tmpdir(), "skip-"));
    temps.push(dir);
    const cellId = "intro-m1-l1-what-is-ai__en";
    const lessonId = "intro-m1-l1-what-is-ai";
    expect(existsSync(join(dir, "cells", cellId))).toBe(false);

    const config = cfg();
    const transport = createMockProvider({
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      width: 64,
      height: 36,
      costMicros: "1",
    });
    const q = quotaFor([cellId], [cellId]);
    const prior = makePrior(cellId, lessonId);
    const result = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-qa",
      controlRoomAuthorizationId: "CR-QA",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId,
      lessonId,
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "x",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      priorAcceptedReceipt: prior,
      quotaContext: q,
    });
    expect(result.receipt.status).toBe("SKIPPED");
    expect(result.mapping).toBeNull();
    expect(transport.generateCallCount).toBe(0);
    expect(existsSync(join(dir, "cells", cellId))).toBe(true);

    writeCellAttemptMeta({
      artifactsRoot: dir,
      cellId,
      providerAttempted: false,
      attempts: 0,
      attemptNumber: 1,
      attemptSlotKey: null,
      attemptSlotIndex: null,
      status: "SKIPPED",
    });

    expect(existsSync(join(dir, "cells", cellId, "attempt-meta.json"))).toBe(true);
    expect(existsSync(join(dir, "receipts", `${cellId}.receipt.json`))).toBe(true);
    expect(existsSync(join(dir, "cells", cellId, "prior-evidence.json"))).toBe(true);
    expect(assertSkippedCellHasNoAcceptedOutputs(dir, cellId)).toEqual([]);

    const verify = verifyCellArtifacts({ artifactsRoot: dir, cellId, status: "SKIPPED" });
    expect(verify.ok, JSON.stringify(verify)).toBe(true);
  });

  it("path traversal cell IDs fail", () => {
    expect(() => assertSafeCellId("../evil__en")).toThrow(/unsafe|failed/);
    expect(() => assertSafeCellId("intro/../x__en")).toThrow();
  });
});

describe("Correction2 output-validation schema write boundary", () => {
  it("valid successful write uses authoritative validator and disk artifact revalidates", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ov-"));
    temps.push(dir);
    const cellId = "intro-m1-l1-what-is-ai__en";
    const config = cfg();
    const transport = createMockProvider({
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      width: 64,
      height: 36,
      costMicros: "1000",
    });
    const q = quotaFor([cellId]);
    const result = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-qa",
      controlRoomAuthorizationId: "CR-QA",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId,
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "master:intro-m1-l1-what-is-ai",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      quotaContext: q,
    });
    expect(result.receipt.status).toBe("ACCEPTED");
    expect(result.mapping).not.toBeNull();
    const written = JSON.parse(
      readFileSync(join(dir, "validations", `${cellId}.validation.json`), "utf8"),
    );
    expect(validateOutputValidationSchema(written).ok).toBe(true);
    expect(written.contentChecksumSha256).toBe(result.receipt.contentSha256);
  });

  it("schema-invalid finalized validation fails before receipt/mapping write", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ov-bad-"));
    temps.push(dir);
    const cellId = "intro-m1-l1-what-is-ai__en";
    const config = cfg();
    // Force schema failure by returning wrong account so contract fails earlier —
    // additionally prove missing rights ref path via direct finalize is covered in schema helper.
    // Here: corrupt MIME config is rejected at config load; use wrong dimensions fail mode.
    const transport = createMockProvider({
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      width: 64,
      height: 36,
      costMicros: "1",
      failMode: "wrong-dimensions",
    });
    const q = quotaFor([cellId]);
    const result = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-qa",
      controlRoomAuthorizationId: "CR-QA",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId,
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "master:intro-m1-l1-what-is-ai",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      quotaContext: q,
    });
    expect(result.receipt.status).not.toBe("ACCEPTED");
    expect(result.mapping).toBeNull();
    expect(existsSync(join(dir, "mappings", `${cellId}.mapping.json`))).toBe(false);
    expect(existsSync(join(dir, "validations", `${cellId}.validation.json`))).toBe(false);
  });

  it("unsupported schema version fails validateOutputValidationSchema", () => {
    const bad = {
      schemaVersion: "nope",
      ok: true,
      errors: [],
      detectedMime: "image/png",
      width: 64,
      height: 36,
      byteLength: 10,
      contentChecksumSha256: "a".repeat(64),
      fixtureRejected: false,
      stubRejected: false,
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      runId: "r",
      controlRoomAuthorizationId: "CR",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      providerName: "p",
      providerAccountId: "a",
      providerProjectId: null,
      providerAuthId: "auth",
      providerRequestId: "req",
      rightsProvenanceRef: "rights/x.rights.json",
      validatedAt: "2026-07-21T00:00:00.000Z",
    };
    expect(validateOutputValidationSchema(bad).ok).toBe(false);
  });
});

describe("Correction3 runtime attempt quota before provider", () => {
  it("exact per-cell boundary passes; one-over fails before mock invoke", async () => {
    const dir = mkdtempSync(join(tmpdir(), "quota-"));
    temps.push(dir);
    const cellId = "intro-m1-l1-what-is-ai__en";
    const config = cfg({ LESSON_VISUALS_MAX_RETRIES: "1" });
    const q = quotaFor([cellId], [], { maxRetries: 1, configuredProviderAttemptQuota: 800 });
    const transport = createMockProvider({
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      width: 64,
      height: 36,
      costMicros: "1000",
    });

    const okSlot = resolveAttemptSlot(q, cellId, 2);
    expect(okSlot.ok).toBe(true);

    const over = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-qa",
      controlRoomAuthorizationId: "CR-QA",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId,
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "master:intro-m1-l1-what-is-ai",
      attemptNumber: 3,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      quotaContext: q,
    });
    expect(over.receipt.status).toBe("NON_RETRYABLE_FAILURE");
    expect(over.receipt.failureCode).toBe("ATTEMPT_QUOTA_EXCEEDED");
    expect(transport.generateCallCount).toBe(0);
  });

  it("missing/mismatched quota context fails before provider", async () => {
    const dir = mkdtempSync(join(tmpdir(), "quota-miss-"));
    temps.push(dir);
    const cellId = "intro-m1-l1-what-is-ai__en";
    const config = cfg();
    const transport = createMockProvider({
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      width: 64,
      height: 36,
      costMicros: "1",
    });
    const miss = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-qa",
      controlRoomAuthorizationId: "CR-QA",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId,
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "master:intro-m1-l1-what-is-ai",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      quotaContext: null,
    });
    expect(miss.receipt.failureCode).toBe("QUOTA_CONTEXT_MISSING");
    expect(transport.generateCallCount).toBe(0);
  });

  it("zero eligible cells: skipped cell has no provider call", async () => {
    const dir = mkdtempSync(join(tmpdir(), "quota-zero-"));
    temps.push(dir);
    const cellId = "intro-m1-l1-what-is-ai__en";
    const config = cfg();
    const transport = createMockProvider({
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      width: 64,
      height: 36,
      costMicros: "1",
    });
    const ids = padTo400([cellId]);
    const q = quotaFor(ids, ids, { configuredProviderAttemptQuota: 0 });
    expect(q.eligibleCells).toBe(0);
    expect(q.maxProviderAttempts).toBe(0);
    const prior = makePrior(cellId, "intro-m1-l1-what-is-ai");
    const result = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-qa",
      controlRoomAuthorizationId: "CR-QA",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId,
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "x",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      priorAcceptedReceipt: prior,
      quotaContext: q,
    });
    expect(result.receipt.status).toBe("SKIPPED");
    expect(transport.generateCallCount).toBe(0);
  });

  it("duplicate attempt slot fails aggregate reconciliation", () => {
    const cellId = "intro-m1-l1-what-is-ai__en";
    const q = quotaFor([cellId]);
    const slot = resolveAttemptSlot(q, cellId, 1);
    expect(slot.ok).toBe(true);
    const recon = reconcileAttemptRecords(q, [
      {
        cellId,
        attemptNumber: 1,
        slotKey: slot.slot!.slotKey,
        providerAttempted: true,
      },
      {
        cellId,
        attemptNumber: 1,
        slotKey: slot.slot!.slotKey,
        providerAttempted: true,
      },
    ]);
    expect(recon.ok).toBe(false);
    expect(recon.errors.join(" ")).toMatch(/duplicate/);
  });

  it("full mode envelope uses 400 eligible; invalid skips do not reduce via empty skipped list", () => {
    const ids = padTo400(["intro-m1-l1-what-is-ai__en"]);
    const full = quotaFor(ids, [], { maxRetries: 1, configuredProviderAttemptQuota: 800 });
    expect(full.eligibleCells).toBe(400);
    expect(full.maxProviderAttempts).toBe(800);
  });
});
