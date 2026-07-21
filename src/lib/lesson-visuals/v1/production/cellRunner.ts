import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale, Method } from "../types";
import { assertExecutionAllowsMock, executeProviderContract } from "./providerContract";
import type { ProviderTransport } from "./providerContract";
import { buildMappingFromAcceptedReceipt } from "./mappings";
import { buildReceipt, fingerprintProductionReceipt } from "./receipts";
import type {
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
}

export interface RunCellResult {
  receipt: ProductionCellReceipt;
  mapping: ProductionMapping | null;
  costMicros: bigint;
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
      });
      return { receipt: skip, mapping: null, costMicros: 0n };
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
    });
    return { receipt, mapping: null, costMicros: 0n };
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
  };

  // dry-run without API key: mock transport is the authorized path
  const configForCall =
    args.config.executionMode === "dry-run" && !args.config.providerApiKeyPresent
      ? { ...args.config, providerApiKeyPresent: true }
      : args.config;

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

  if (!result.ok || !result.response || !result.bytes || !result.validation) {
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
    });
    writeFileSync(
      join(args.artifactsRoot, "receipts", `${args.cellId}.receipt.json`),
      `${JSON.stringify(receipt, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      join(cellDir, "failure.json"),
      `${JSON.stringify({ errors: result.errors }, null, 2)}\n`,
      "utf8",
    );
    return { receipt, mapping: null, costMicros: result.costMicros ?? 0n };
  }

  const storageKey = `${args.config.outputStorageTarget.replace(/\/$/, "")}/${args.cellId}.png`;
  const outPath = join(cellDir, "output.png");
  writeFileSync(outPath, result.bytes);

  const rightsRef = `rights/${args.cellId}.rights.json`;
  const validationRef = `validations/${args.cellId}.validation.json`;
  writeFileSync(
    join(args.artifactsRoot, rightsRef),
    `${JSON.stringify(result.response.rightsProvenance, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(args.artifactsRoot, validationRef),
    `${JSON.stringify(result.validation, null, 2)}\n`,
    "utf8",
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
    idempotencyKey,
    attemptNumber: args.attemptNumber,
    outputPathOrStorageKey: storageKey,
    mimeType: result.validation.detectedMime,
    width: result.validation.width,
    height: result.validation.height,
    byteLength: result.validation.byteLength,
    contentSha256: result.validation.contentChecksumSha256,
    costMicros: result.costMicros!.toString(),
    rightsProvenanceRef: rightsRef,
    validationRef,
    failureCode: null,
    retryable: null,
    error: null,
    producedAt: now,
    completedAt: new Date().toISOString(),
  });

  const mapping = buildMappingFromAcceptedReceipt(receipt);
  writeFileSync(
    join(args.artifactsRoot, "receipts", `${args.cellId}.receipt.json`),
    `${JSON.stringify(receipt, null, 2)}\n`,
    "utf8",
  );
  if (mapping) {
    writeFileSync(
      join(args.artifactsRoot, "mappings", `${args.cellId}.mapping.json`),
      `${JSON.stringify(mapping, null, 2)}\n`,
      "utf8",
    );
  }

  return { receipt, mapping, costMicros: result.costMicros ?? 0n };
}
