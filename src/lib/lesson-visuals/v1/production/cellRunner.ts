import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FIXTURE_RECEIPT_MARKER } from "../constants";
import type { Locale, Method } from "../types";
import {
  assertSafeCellId,
  cellPriorEvidencePath,
  cellReceiptPath,
  ensureCellArtifactDir,
} from "./cellPaths";
import { assertGreenfieldReferences } from "./greenfield";
import { assertExecutionAllowsMock, executeProviderContract } from "./providerContract";
import type { ProviderTransport } from "./providerContract";
import { buildMappingFromAcceptedReceipt } from "./mappings";
import { finalizeOutputValidationRecord } from "./outputValidation";
import {
  resolveAttemptSlot,
  validateRuntimeQuotaContext,
  type RuntimeQuotaContext,
} from "./quotaContext";
import { buildReceipt, fingerprintProductionReceipt } from "./receipts";
import {
  validateFailureRecordSchema,
  validateMappingSchema,
  validateOutputValidationSchema,
  validateReceiptSchema,
  validateRightsSchema,
} from "./schemaValidator";
import type {
  CellFailureRecord,
  ProductionCellReceipt,
  ProductionConfig,
  ProductionMapping,
  ProviderGenerationRequest,
} from "./types";

export interface RunCellArgs {
  artifactsRoot: string;
  config: ProductionConfig;
  transport: ProviderTransport & { isMock?: boolean };
  runId: string;
  controlRoomAuthorizationId: string;
  contentSha: string;
  executionSha: string;
  approvedManifestSha256: string;
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  promptOrRenderingSpec: string;
  attemptNumber: number;
  remainingRunBudgetMicros: bigint;
  seenProviderRequestIds: Set<string>;
  priorAcceptedReceipt?: ProductionCellReceipt | null;
  /** Immutable preflight quota context (required before provider calls). */
  quotaContext?: RuntimeQuotaContext | null;
  /** Called once when an external provider generate() is about to be invoked (after quota gate). */
  onProviderAttempt?: () => void;
  /**
   * When false (Methods 1/4 local), generate still runs locally but is not an
   * external provider/HTTP attempt.
   */
  countsAsExternalProviderAttempt?: boolean;
  /** Override expected provider identity (local / screenshot routers). */
  expectedProviderName?: string;
  expectedModel?: string;
}

export interface RunCellResult {
  receipt: ProductionCellReceipt;
  mapping: ProductionMapping | null;
  costMicros: bigint;
  providerAttempted: boolean;
  attemptSlotKey: string | null;
  attemptSlotIndex: number | null;
}

function writeValidatedJson(
  path: string,
  obj: unknown,
  validate: (o: unknown) => { ok: boolean; errors: string[] },
): void {
  const v = validate(obj);
  if (!v.ok) throw new Error(`refusing to write invalid artifact ${path}: ${v.errors.join("; ")}`);
  writeFileSync(path, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

export async function runProductionCell(args: RunCellArgs): Promise<RunCellResult> {
  const now = new Date().toISOString();
  const cellId = assertSafeCellId(args.cellId);
  const idempotencyKey = [
    args.runId,
    cellId,
    args.contentSha,
    args.executionSha,
    args.approvedManifestSha256,
    String(args.method),
  ].join(":");
  const fixtureMarker =
    args.config.executionMode === "dry-run" ? FIXTURE_RECEIPT_MARKER : null;

  if (args.priorAcceptedReceipt?.status === "ACCEPTED") {
    const expectedFp = fingerprintProductionReceipt({
      runId: args.priorAcceptedReceipt.runId,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      idempotencyKey: args.priorAcceptedReceipt.idempotencyKey,
      contentSha256: args.priorAcceptedReceipt.contentSha256,
    });
    if (args.priorAcceptedReceipt.fingerprint === expectedFp) {
      const skip = buildReceipt({
        status: "SKIPPED",
        runId: args.runId,
        controlRoomAuthorizationId: args.controlRoomAuthorizationId,
        contentSha: args.contentSha,
      executionSha: args.executionSha,
        approvedManifestSha256: args.approvedManifestSha256,
        cellId,
        lessonId: args.lessonId,
        locale: args.locale,
        method: args.method,
        providerName: args.priorAcceptedReceipt.providerName,
        providerRequestId: args.priorAcceptedReceipt.providerRequestId,
        modelOrRenderer: args.priorAcceptedReceipt.modelOrRenderer,
        providerAccountId: args.priorAcceptedReceipt.providerAccountId,
        providerProjectId: args.priorAcceptedReceipt.providerProjectId,
        providerAuthId: args.priorAcceptedReceipt.providerAuthId,
        idempotencyKey,
        attemptNumber: args.attemptNumber,
        outputPathOrStorageKey: args.priorAcceptedReceipt.outputPathOrStorageKey,
        mimeType: args.priorAcceptedReceipt.mimeType,
        width: args.priorAcceptedReceipt.width,
        height: args.priorAcceptedReceipt.height,
        byteLength: args.priorAcceptedReceipt.byteLength,
        contentSha256: args.priorAcceptedReceipt.contentSha256,
        costMicros: "0",
        rightsProvenanceRef: args.priorAcceptedReceipt.rightsProvenanceRef,
        validationRef: args.priorAcceptedReceipt.validationRef,
        failureCode: null,
        retryable: null,
        error: null,
        producedAt: now,
        completedAt: now,
        fixtureMarker: args.priorAcceptedReceipt.fixtureMarker,
      });
      ensureCellArtifactDir(args.artifactsRoot, cellId);
      mkdirSync(join(args.artifactsRoot, "receipts"), { recursive: true });
      writeValidatedJson(cellReceiptPath(args.artifactsRoot, cellId), skip, validateReceiptSchema);
      const priorEvidence = {
        schemaVersion: "lesson-visual-prior-evidence/v1",
        cellId,
        priorRunId: args.priorAcceptedReceipt.runId,
        priorFingerprint: args.priorAcceptedReceipt.fingerprint,
        priorContentSha256: args.priorAcceptedReceipt.contentSha256,
        priorReceiptRef: `receipts/${cellId}.receipt.json`,
      };
      writeFileSync(
        cellPriorEvidencePath(args.artifactsRoot, cellId),
        `${JSON.stringify(priorEvidence, null, 2)}\n`,
        "utf8",
      );
      return {
        receipt: skip,
        mapping: null,
        costMicros: 0n,
        providerAttempted: false,
        attemptSlotKey: null,
        attemptSlotIndex: null,
      };
    }
  }

  const mockGate = assertExecutionAllowsMock(
    args.config.executionMode,
    Boolean(args.transport.isMock),
  );
  if (mockGate) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: null,
      providerRequestId: null,
      modelOrRenderer: null,
      providerAccountId: null,
      providerProjectId: null,
      providerAuthId: null,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "MOCK_IN_PRODUCTION",
      retryable: false,
      error: mockGate,
      producedAt: now,
      completedAt: now,
      fixtureMarker: null,
    });
    return writeFailure(args, receipt, [mockGate], false, null, null);
  }

  const gf = assertGreenfieldReferences([
    args.promptOrRenderingSpec,
    args.config.outputStorageTarget,
  ]);
  if (!gf.ok) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: null,
      providerRequestId: null,
      modelOrRenderer: null,
      providerAccountId: null,
      providerProjectId: null,
      providerAuthId: null,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "LEGACY_REFERENCE",
      retryable: false,
      error: gf.errors.join("; "),
      producedAt: now,
      completedAt: now,
      fixtureMarker: null,
    });
    return writeFailure(args, receipt, gf.errors, false, null, null);
  }

  // --- Pre-provider attempt quota (static slot; fail before adapter invoke) ---
  if (!args.quotaContext) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: null,
      providerRequestId: null,
      modelOrRenderer: null,
      providerAccountId: null,
      providerProjectId: null,
      providerAuthId: null,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "QUOTA_CONTEXT_MISSING",
      retryable: false,
      error: "runtime quota context required before provider invocation",
      producedAt: now,
      completedAt: now,
      fixtureMarker: null,
    });
    return writeFailure(
      args,
      receipt,
      ["runtime quota context required before provider invocation"],
      false,
      null,
      null,
    );
  }

  const ctxCheck = validateRuntimeQuotaContext(args.quotaContext, {
    runId: args.runId,
    controlRoomAuthorizationId: args.controlRoomAuthorizationId,
    contentSha: args.contentSha,
    executionSha: args.executionSha,
    approvedManifestSha256: args.approvedManifestSha256,
  });
  if (!ctxCheck.ok || !ctxCheck.context) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: null,
      providerRequestId: null,
      modelOrRenderer: null,
      providerAccountId: null,
      providerProjectId: null,
      providerAuthId: null,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "QUOTA_CONTEXT_INVALID",
      retryable: false,
      error: ctxCheck.errors.join("; "),
      producedAt: now,
      completedAt: now,
      fixtureMarker: null,
    });
    return writeFailure(args, receipt, ctxCheck.errors, false, null, null);
  }

  const slot = resolveAttemptSlot(ctxCheck.context, cellId, args.attemptNumber);
  if (!slot.ok || !slot.slot) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: null,
      providerRequestId: null,
      modelOrRenderer: null,
      providerAccountId: null,
      providerProjectId: null,
      providerAuthId: null,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "ATTEMPT_QUOTA_EXCEEDED",
      retryable: false,
      error: slot.errors.join("; "),
      producedAt: now,
      completedAt: now,
      fixtureMarker: null,
    });
    return writeFailure(args, receipt, slot.errors, false, null, null);
  }

  // Persist attempt claim before provider invoke (slot identity; no shared mutable counter).
  const cellDir = ensureCellArtifactDir(args.artifactsRoot, cellId);
  writeFileSync(
    join(cellDir, "attempt-claim.json"),
    `${JSON.stringify(
      {
        schemaVersion: "lesson-visual-attempt-claim/v1",
        ...slot.slot,
        claimedAt: now,
        providerInvoked: false,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const request: ProviderGenerationRequest = {
    schemaVersion: "lesson-visual-provider-request/v1",
    runId: args.runId,
    controlRoomAuthorizationId: args.controlRoomAuthorizationId,
    contentSha: args.contentSha,
    executionSha: args.executionSha,
    approvedManifestSha256: args.approvedManifestSha256,
    cellId,
    lessonId: args.lessonId,
    locale: args.locale,
    method: args.method,
    promptOrRenderingSpec: args.promptOrRenderingSpec,
    requestedWidth: args.config.requiredWidth,
    requestedHeight: args.config.requiredHeight,
    expectedMimeTypes: args.config.allowedMimeTypes,
    rightsProvenanceRequirements: {
      requireGreenfield: true,
      prohibitLegacyReuse: true,
      requireProviderRequestId: true,
      requireLicenseBasis: true,
    },
    idempotencyKey,
    attemptNumber: args.attemptNumber,
    budgetAllocationMicros: args.config.cellCostCeilingMicros.toString(),
    maxCostMicros: args.config.cellCostCeilingMicros.toString(),
    expectedProviderAccountId: args.config.providerAccountId,
    expectedProviderProjectId: args.config.providerProjectId || null,
    expectedProviderAuthId: args.config.providerAuthId,
  };

  const countsExternal = args.countsAsExternalProviderAttempt !== false;
  const expectedProviderName = args.expectedProviderName ?? args.config.providerName;
  const expectedModel = args.expectedModel ?? args.config.providerModel;
  let configForCall: ProductionConfig = {
    ...args.config,
    providerName: expectedProviderName,
    providerModel: expectedModel,
  };
  if (
    (args.config.executionMode === "dry-run" && !args.config.providerApiKeyPresent) ||
    args.method === 1 ||
    args.method === 3 ||
    args.method === 4
  ) {
    configForCall = { ...configForCall, providerApiKeyPresent: true };
  }

  if (countsExternal) {
    args.onProviderAttempt?.();
  }
  const result = await executeProviderContract(request, {
    config: configForCall,
    transport: args.transport,
    expectedProviderName,
    remainingRunBudgetMicros: args.remainingRunBudgetMicros,
    seenProviderRequestIds: args.seenProviderRequestIds,
  });

  writeFileSync(
    join(cellDir, "attempt-claim.json"),
    `${JSON.stringify(
      {
        schemaVersion: "lesson-visual-attempt-claim/v1",
        ...slot.slot,
        claimedAt: now,
        providerInvoked: true,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  mkdirSync(join(args.artifactsRoot, "receipts"), { recursive: true });
  mkdirSync(join(args.artifactsRoot, "mappings"), { recursive: true });
  mkdirSync(join(args.artifactsRoot, "rights"), { recursive: true });
  mkdirSync(join(args.artifactsRoot, "validations"), { recursive: true });

  if (!result.ok || !result.response || !result.bytes || !result.validation || !result.independentChecksum) {
    const receipt = buildReceipt({
      status: "RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: result.response?.providerName ?? null,
      providerRequestId: result.response?.providerRequestId ?? null,
      modelOrRenderer: result.response?.modelOrRenderer ?? null,
      providerAccountId: result.response?.providerAccountId ?? null,
      providerProjectId: result.response?.providerProjectId ?? null,
      providerAuthId: result.response?.providerAuthId ?? null,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: result.costMicros?.toString() ?? null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "PROVIDER_OR_VALIDATION_FAILED",
      retryable: true,
      error: result.errors.join("; "),
      producedAt: now,
      completedAt: new Date().toISOString(),
      fixtureMarker,
    });
    return writeFailure(
      args,
      receipt,
      result.errors,
      countsExternal,
      slot.slot.slotKey,
      slot.slot.slotIndex,
    );
  }

  const storageKey = `${args.config.outputStorageTarget.replace(/\/$/, "")}/${cellId}.png`;
  const gfStorage = assertGreenfieldReferences([storageKey]);
  if (!gfStorage.ok) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: result.response.providerName,
      providerRequestId: result.response.providerRequestId,
      modelOrRenderer: result.response.modelOrRenderer,
      providerAccountId: result.response.providerAccountId,
      providerProjectId: result.response.providerProjectId,
      providerAuthId: result.response.providerAuthId,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: result.costMicros?.toString() ?? null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "LEGACY_STORAGE_TARGET",
      retryable: false,
      error: gfStorage.errors.join("; "),
      producedAt: now,
      completedAt: new Date().toISOString(),
      fixtureMarker,
    });
    return writeFailure(
      args,
      receipt,
      gfStorage.errors,
      countsExternal,
      slot.slot.slotKey,
      slot.slot.slotIndex,
    );
  }

  const rightsRef = `rights/${cellId}.rights.json`;
  const validationRef = `validations/${cellId}.validation.json`;

  // Bind rights + finalize validation BEFORE any accepted artifact writes.
  const rights = {
    ...result.response.rightsProvenance,
    outputContentSha256: result.independentChecksum,
    cellId,
    contentSha: args.contentSha,
    executionSha: args.executionSha,
    approvedManifestSha256: args.approvedManifestSha256,
  };
  const rightsSchema = validateRightsSchema(rights);
  if (!rightsSchema.ok) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: result.response.providerName,
      providerRequestId: result.response.providerRequestId,
      modelOrRenderer: result.response.modelOrRenderer,
      providerAccountId: result.response.providerAccountId,
      providerProjectId: result.response.providerProjectId,
      providerAuthId: result.response.providerAuthId,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: result.costMicros?.toString() ?? null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "RIGHTS_SCHEMA_INVALID",
      retryable: false,
      error: rightsSchema.errors.join("; "),
      producedAt: now,
      completedAt: new Date().toISOString(),
      fixtureMarker,
    });
    return writeFailure(
      args,
      receipt,
      rightsSchema.errors,
      countsExternal,
      slot.slot.slotKey,
      slot.slot.slotIndex,
    );
  }

  const finalized = finalizeOutputValidationRecord(result.validation, {
    rightsProvenanceRef: rightsRef,
    validatedAt: new Date().toISOString(),
    contentChecksumSha256: result.independentChecksum,
    providerName: result.response.providerName,
    providerAccountId: result.response.providerAccountId,
    providerProjectId: result.response.providerProjectId,
    providerAuthId: result.response.providerAuthId,
    providerRequestId: result.response.providerRequestId,
    cellId,
    lessonId: args.lessonId,
    locale: args.locale,
    runId: args.runId,
    controlRoomAuthorizationId: args.controlRoomAuthorizationId,
    contentSha: args.contentSha,
    executionSha: args.executionSha,
    approvedManifestSha256: args.approvedManifestSha256,
    ok: true,
  });
  // Authoritative write-boundary schema gate
  const writeSchema = validateOutputValidationSchema(finalized.record);
  if (!finalized.ok || !writeSchema.ok) {
    const errs = [...finalized.errors, ...writeSchema.errors];
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      contentSha: args.contentSha,
      executionSha: args.executionSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      providerName: result.response.providerName,
      providerRequestId: result.response.providerRequestId,
      modelOrRenderer: result.response.modelOrRenderer,
      providerAccountId: result.response.providerAccountId,
      providerProjectId: result.response.providerProjectId,
      providerAuthId: result.response.providerAuthId,
      idempotencyKey,
      attemptNumber: args.attemptNumber,
      outputPathOrStorageKey: null,
      mimeType: null,
      width: null,
      height: null,
      byteLength: null,
      contentSha256: null,
      costMicros: result.costMicros?.toString() ?? null,
      rightsProvenanceRef: null,
      validationRef: null,
      failureCode: "OUTPUT_VALIDATION_SCHEMA_INVALID",
      retryable: false,
      error: errs.join("; "),
      producedAt: now,
      completedAt: new Date().toISOString(),
      fixtureMarker,
    });
    return writeFailure(args, receipt, errs, countsExternal, slot.slot.slotKey, slot.slot.slotIndex);
  }

  // Only after schema gates pass: write bytes + accepted artifacts (same validated objects).
  writeFileSync(join(cellDir, "output.png"), result.bytes);
  writeValidatedJson(join(args.artifactsRoot, rightsRef), rights, validateRightsSchema);
  writeValidatedJson(
    join(args.artifactsRoot, validationRef),
    finalized.record,
    validateOutputValidationSchema,
  );

  const receipt = buildReceipt({
    status: "ACCEPTED",
    runId: args.runId,
    controlRoomAuthorizationId: args.controlRoomAuthorizationId,
    contentSha: args.contentSha,
    executionSha: args.executionSha,
    approvedManifestSha256: args.approvedManifestSha256,
    cellId,
    lessonId: args.lessonId,
    locale: args.locale,
    method: args.method,
    providerName: result.response.providerName,
    providerRequestId: result.response.providerRequestId,
    modelOrRenderer: result.response.modelOrRenderer,
    providerAccountId: result.response.providerAccountId,
    providerProjectId: result.response.providerProjectId,
    providerAuthId: result.response.providerAuthId,
    idempotencyKey,
    attemptNumber: args.attemptNumber,
    outputPathOrStorageKey: storageKey,
    mimeType: finalized.record.detectedMime,
    width: finalized.record.width,
    height: finalized.record.height,
    byteLength: finalized.record.byteLength,
    contentSha256: result.independentChecksum,
    costMicros: result.costMicros!.toString(),
    rightsProvenanceRef: rightsRef,
    validationRef,
    failureCode: null,
    retryable: null,
    error: null,
    producedAt: now,
    completedAt: new Date().toISOString(),
    fixtureMarker,
  });

  const mapping = buildMappingFromAcceptedReceipt(receipt);
  writeValidatedJson(cellReceiptPath(args.artifactsRoot, cellId), receipt, validateReceiptSchema);
  if (mapping) {
    writeValidatedJson(
      join(args.artifactsRoot, "mappings", `${cellId}.mapping.json`),
      mapping,
      validateMappingSchema,
    );
  }

  return {
    receipt,
    mapping,
    costMicros: result.costMicros ?? 0n,
    providerAttempted: countsExternal,
    attemptSlotKey: slot.slot.slotKey,
    attemptSlotIndex: slot.slot.slotIndex,
  };
}

function writeFailure(
  args: RunCellArgs,
  receipt: ProductionCellReceipt,
  errors: string[],
  providerAttempted: boolean,
  attemptSlotKey: string | null,
  attemptSlotIndex: number | null,
): RunCellResult {
  const cellId = assertSafeCellId(args.cellId);
  const cellDir = ensureCellArtifactDir(args.artifactsRoot, cellId);
  mkdirSync(join(args.artifactsRoot, "receipts"), { recursive: true });
  const failure: CellFailureRecord = {
    schemaVersion: "lesson-visual-failure/v1",
    cellId,
    runId: args.runId,
    contentSha: args.contentSha,
    executionSha: args.executionSha,
    failureCode: receipt.failureCode ?? "FAILED",
    errors,
    retryable: Boolean(receipt.retryable),
    producedAt: new Date().toISOString(),
  };
  writeValidatedJson(join(cellDir, "failure.json"), failure, validateFailureRecordSchema);
  writeValidatedJson(cellReceiptPath(args.artifactsRoot, cellId), receipt, validateReceiptSchema);
  return {
    receipt,
    mapping: null,
    costMicros: 0n,
    providerAttempted,
    attemptSlotKey,
    attemptSlotIndex,
  };
}

/** Exported for tests: prove unexpected accepted artifacts are absent after skip. */
export function assertSkippedCellHasNoAcceptedOutputs(
  artifactsRoot: string,
  cellId: string,
): string[] {
  const safe = assertSafeCellId(cellId);
  const errors: string[] = [];
  const forbidden = [
    join(artifactsRoot, "cells", safe, "output.png"),
    join(artifactsRoot, "mappings", `${safe}.mapping.json`),
    join(artifactsRoot, "rights", `${safe}.rights.json`),
    join(artifactsRoot, "validations", `${safe}.validation.json`),
  ];
  for (const p of forbidden) {
    if (existsSync(p)) errors.push(`unexpected artifact after skip: ${p}`);
  }
  return errors;
}
