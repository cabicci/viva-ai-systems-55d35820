import { createHash } from "node:crypto";
import type { Locale, Method } from "../types";
import { validateReceiptSchema } from "./schemaValidator";
import type { CellRunStatus, ProductionCellReceipt } from "./types";

export function fingerprintProductionReceipt(input: {
  runId: string;
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  sourceSha: string;
  approvedManifestSha256: string;
  idempotencyKey: string;
  contentSha256: string | null;
}): string {
  const canonical = JSON.stringify({
    approvedManifestSha256: input.approvedManifestSha256,
    cellId: input.cellId,
    contentSha256: input.contentSha256,
    idempotencyKey: input.idempotencyKey,
    lessonId: input.lessonId,
    locale: input.locale,
    method: input.method,
    runId: input.runId,
    sourceSha: input.sourceSha,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function buildReceipt(args: {
  status: CellRunStatus;
  runId: string;
  controlRoomAuthorizationId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  providerName: string | null;
  providerRequestId: string | null;
  modelOrRenderer: string | null;
  providerAccountId: string | null;
  providerProjectId: string | null;
  providerAuthId: string | null;
  idempotencyKey: string;
  attemptNumber: number;
  outputPathOrStorageKey: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  byteLength: number | null;
  contentSha256: string | null;
  costMicros: string | null;
  rightsProvenanceRef: string | null;
  validationRef: string | null;
  failureCode: string | null;
  retryable: boolean | null;
  error: string | null;
  producedAt: string;
  completedAt: string;
  fixtureMarker: string | null;
}): ProductionCellReceipt {
  const fingerprint = fingerprintProductionReceipt({
    runId: args.runId,
    cellId: args.cellId,
    lessonId: args.lessonId,
    locale: args.locale,
    method: args.method,
    sourceSha: args.sourceSha,
    approvedManifestSha256: args.approvedManifestSha256,
    idempotencyKey: args.idempotencyKey,
    contentSha256: args.contentSha256,
  });
  const receipt: ProductionCellReceipt = {
    schemaVersion: "lesson-visual-production-receipt/v1",
    status: args.status,
    runId: args.runId,
    controlRoomAuthorizationId: args.controlRoomAuthorizationId,
    sourceSha: args.sourceSha,
    approvedManifestSha256: args.approvedManifestSha256,
    cellId: args.cellId,
    lessonId: args.lessonId,
    locale: args.locale,
    method: args.method,
    providerName: args.providerName,
    providerRequestId: args.providerRequestId,
    modelOrRenderer: args.modelOrRenderer,
    providerAccountId: args.providerAccountId,
    providerProjectId: args.providerProjectId,
    providerAuthId: args.providerAuthId,
    idempotencyKey: args.idempotencyKey,
    attemptNumber: args.attemptNumber,
    outputPathOrStorageKey: args.outputPathOrStorageKey,
    mimeType: args.mimeType,
    width: args.width,
    height: args.height,
    byteLength: args.byteLength,
    contentSha256: args.contentSha256,
    costMicros: args.costMicros,
    rightsProvenanceRef: args.rightsProvenanceRef,
    validationRef: args.validationRef,
    fingerprint,
    producedAt: args.producedAt,
    completedAt: args.completedAt,
    failureCode: args.failureCode,
    retryable: args.retryable,
    error: args.error,
    fixtureMarker: args.fixtureMarker,
  };
  const schema = validateReceiptSchema(receipt);
  if (!schema.ok && args.status === "ACCEPTED") {
    throw new Error(`ACCEPTED receipt failed schema: ${schema.errors.join("; ")}`);
  }
  return receipt;
}
