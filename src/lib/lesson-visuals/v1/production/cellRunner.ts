import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FIXTURE_RECEIPT_MARKER } from "../constants";
import type { Locale, Method } from "../types";
import { assertGreenfieldReferences } from "./greenfield";
import { assertExecutionAllowsMock, executeProviderContract } from "./providerContract";
import type { ProviderTransport } from "./providerContract";
import { buildMappingFromAcceptedReceipt } from "./mappings";
import { buildReceipt, fingerprintProductionReceipt } from "./receipts";
import {
  validateFailureRecordSchema,
  validateMappingSchema,
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
  sourceSha: string;
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
  /** Called once when a provider generate() is invoked. */
  onProviderAttempt?: () => void;
}

export interface RunCellResult {
  receipt: ProductionCellReceipt;
  mapping: ProductionMapping | null;
  costMicros: bigint;
  providerAttempted: boolean;
}

function writeValidatedJson(path: string, obj: unknown, validate: (o: unknown) => { ok: boolean; errors: string[] }): void {
  const v = validate(obj);
  if (!v.ok) throw new Error(`refusing to write invalid artifact ${path}: ${v.errors.join("; ")}`);
  writeFileSync(path, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

export async function runProductionCell(args: RunCellArgs): Promise<RunCellResult> {
  const now = new Date().toISOString();
  const idempotencyKey = [
    args.runId,
    args.cellId,
    args.sourceSha,
    args.approvedManifestSha256,
    String(args.method),
  ].join(":");
  const fixtureMarker =
    args.config.executionMode === "dry-run" ? FIXTURE_RECEIPT_MARKER : null;

  if (args.priorAcceptedReceipt?.status === "ACCEPTED") {
    const expectedFp = fingerprintProductionReceipt({
      runId: args.priorAcceptedReceipt.runId,
      cellId: args.cellId,
      lessonId: args.lessonId,
      locale: args.locale,
      method: args.method,
      sourceSha: args.sourceSha,
      approvedManifestSha256: args.approvedManifestSha256,
      idempotencyKey: args.priorAcceptedReceipt.idempotencyKey,
      contentSha256: args.priorAcceptedReceipt.contentSha256,
    });
    if (args.priorAcceptedReceipt.fingerprint === expectedFp) {
      const skip = buildReceipt({
        status: "SKIPPED",
        runId: args.runId,
        controlRoomAuthorizationId: args.controlRoomAuthorizationId,
        sourceSha: args.sourceSha,
        approvedManifestSha256: args.approvedManifestSha256,
        cellId: args.cellId,
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
      mkdirSync(join(args.artifactsRoot, "receipts"), { recursive: true });
      writeValidatedJson(
        join(args.artifactsRoot, "receipts", `${args.cellId}.receipt.json`),
        skip,
        validateReceiptSchema,
      );
      return { receipt: skip, mapping: null, costMicros: 0n, providerAttempted: false };
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
      sourceSha: args.sourceSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId: args.cellId,
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
    return writeFailure(args, receipt, [mockGate], false);
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
      sourceSha: args.sourceSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId: args.cellId,
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
    return writeFailure(args, receipt, gf.errors, false);
  }

  const request: ProviderGenerationRequest = {
    schemaVersion: "lesson-visual-provider-request/v1",
    runId: args.runId,
    controlRoomAuthorizationId: args.controlRoomAuthorizationId,
    sourceSha: args.sourceSha,
    approvedManifestSha256: args.approvedManifestSha256,
    cellId: args.cellId,
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

  const configForCall =
    args.config.executionMode === "dry-run" && !args.config.providerApiKeyPresent
      ? { ...args.config, providerApiKeyPresent: true }
      : args.config;

  args.onProviderAttempt?.();
  const result = await executeProviderContract(request, {
    config: configForCall,
    transport: args.transport,
    expectedProviderName: args.config.providerName,
    remainingRunBudgetMicros: args.remainingRunBudgetMicros,
    seenProviderRequestIds: args.seenProviderRequestIds,
  });

  const cellDir = join(args.artifactsRoot, "cells", args.cellId);
  mkdirSync(cellDir, { recursive: true });
  mkdirSync(join(args.artifactsRoot, "receipts"), { recursive: true });
  mkdirSync(join(args.artifactsRoot, "mappings"), { recursive: true });
  mkdirSync(join(args.artifactsRoot, "rights"), { recursive: true });
  mkdirSync(join(args.artifactsRoot, "validations"), { recursive: true });

  if (!result.ok || !result.response || !result.bytes || !result.validation || !result.independentChecksum) {
    const receipt = buildReceipt({
      status: "RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      sourceSha: args.sourceSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId: args.cellId,
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
    return writeFailure(args, receipt, result.errors, true);
  }

  const storageKey = `${args.config.outputStorageTarget.replace(/\/$/, "")}/${args.cellId}.png`;
  const gfStorage = assertGreenfieldReferences([storageKey]);
  if (!gfStorage.ok) {
    const receipt = buildReceipt({
      status: "NON_RETRYABLE_FAILURE",
      runId: args.runId,
      controlRoomAuthorizationId: args.controlRoomAuthorizationId,
      sourceSha: args.sourceSha,
      approvedManifestSha256: args.approvedManifestSha256,
      cellId: args.cellId,
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
    return writeFailure(args, receipt, gfStorage.errors, true);
  }

  writeFileSync(join(cellDir, "output.png"), result.bytes);

  // Bind rights to independently calculated checksum before write
  const rights = {
    ...result.response.rightsProvenance,
    outputContentSha256: result.independentChecksum,
    cellId: args.cellId,
    sourceSha: args.sourceSha,
    approvedManifestSha256: args.approvedManifestSha256,
  };
  const rightsRef = `rights/${args.cellId}.rights.json`;
  const validationRef = `validations/${args.cellId}.validation.json`;
  writeValidatedJson(join(args.artifactsRoot, rightsRef), rights, validateRightsSchema);
  writeValidatedJson(
    join(args.artifactsRoot, validationRef),
    result.validation,
    (o) => ({ ok: (o as { ok?: boolean }).ok === true || Array.isArray((o as { errors?: unknown }).errors), errors: [] }),
  );

  const receipt = buildReceipt({
    status: "ACCEPTED",
    runId: args.runId,
    controlRoomAuthorizationId: args.controlRoomAuthorizationId,
    sourceSha: args.sourceSha,
    approvedManifestSha256: args.approvedManifestSha256,
    cellId: args.cellId,
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
    mimeType: result.validation.detectedMime,
    width: result.validation.width,
    height: result.validation.height,
    byteLength: result.validation.byteLength,
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
  writeValidatedJson(
    join(args.artifactsRoot, "receipts", `${args.cellId}.receipt.json`),
    receipt,
    validateReceiptSchema,
  );
  if (mapping) {
    writeValidatedJson(
      join(args.artifactsRoot, "mappings", `${args.cellId}.mapping.json`),
      mapping,
      validateMappingSchema,
    );
  }

  return { receipt, mapping, costMicros: result.costMicros ?? 0n, providerAttempted: true };
}

function writeFailure(
  args: RunCellArgs,
  receipt: ProductionCellReceipt,
  errors: string[],
  providerAttempted: boolean,
): RunCellResult {
  const cellDir = join(args.artifactsRoot, "cells", args.cellId);
  mkdirSync(cellDir, { recursive: true });
  mkdirSync(join(args.artifactsRoot, "receipts"), { recursive: true });
  const failure: CellFailureRecord = {
    schemaVersion: "lesson-visual-failure/v1",
    cellId: args.cellId,
    runId: args.runId,
    failureCode: receipt.failureCode ?? "FAILED",
    errors,
    retryable: Boolean(receipt.retryable),
    producedAt: new Date().toISOString(),
  };
  writeValidatedJson(join(cellDir, "failure.json"), failure, validateFailureRecordSchema);
  writeValidatedJson(
    join(args.artifactsRoot, "receipts", `${args.cellId}.receipt.json`),
    receipt,
    validateReceiptSchema,
  );
  return { receipt, mapping: null, costMicros: 0n, providerAttempted };
}
