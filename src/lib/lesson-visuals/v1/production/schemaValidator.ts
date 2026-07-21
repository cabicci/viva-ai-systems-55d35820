/**
 * Narrow fail-closed structural validators for production artifacts.
 * Equivalent to JSON Schema enforcement without introducing a new dependency.
 */
import { PRODUCTION_LOCALES } from "../constants";
import type {
  AggregateValidationReportShape,
  CellFailureRecord,
  OutputValidationRecord,
  ProductionCellReceipt,
  ProductionMapping,
  ProductionRunSummary,
  RightsProvenanceRecord,
} from "./types";

const LOCALES = new Set<string>(PRODUCTION_LOCALES);
const RECEIPT_STATUSES = new Set([
  "ACCEPTED",
  "FAILED",
  "SKIPPED",
  "RETRYABLE_FAILURE",
  "NON_RETRYABLE_FAILURE",
]);

function reqStr(v: unknown, field: string, errors: string[], min = 1): void {
  if (typeof v !== "string" || v.trim().length < min) {
    errors.push(`${field} missing or empty`);
  }
}

function reqSha40(v: unknown, field: string, errors: string[]): void {
  if (typeof v !== "string" || !/^[a-f0-9]{40}$/.test(v)) {
    errors.push(`${field} must be 40-char lowercase hex`);
  }
}

function reqSha64(v: unknown, field: string, errors: string[]): void {
  if (typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v)) {
    errors.push(`${field} must be 64-char lowercase hex`);
  }
}

export function validateRightsSchema(obj: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, errors: ["rights not an object"] };
  const r = obj as Partial<RightsProvenanceRecord>;
  if (r.schemaVersion !== "lesson-visual-rights/v1") {
    errors.push("unsupported rights schemaVersion");
  }
  if (![1, 2, 3, 4].includes(r.generationMethod as number)) errors.push("generationMethod invalid");
  reqStr(r.providerOrSource, "providerOrSource", errors);
  reqStr(r.providerModelOrRenderer, "providerModelOrRenderer", errors);
  reqStr(r.generatedAt, "generatedAt", errors);
  reqStr(r.providerRequestId, "providerRequestId", errors);
  reqStr(r.licenseOrUsageBasis, "licenseOrUsageBasis", errors);
  reqStr(r.cellId, "cellId", errors);
  reqSha40(r.contentSha, "contentSha", errors);
  reqSha40(r.executionSha, "executionSha", errors);
  reqSha64(r.approvedManifestSha256, "approvedManifestSha256", errors);
  reqSha64(r.outputContentSha256, "outputContentSha256", errors);
  if (r.prohibitedLegacySource !== false) {
    errors.push("prohibitedLegacySource must be boolean false");
  }
  if (!Array.isArray(r.sourceReferences)) errors.push("sourceReferences must be array");
  if (!Array.isArray(r.transformationRecord)) errors.push("transformationRecord must be array");
  if (!Array.isArray(r.evidenceReferences)) errors.push("evidenceReferences must be array");
  if (!Array.isArray(r.evidenceChecksums)) errors.push("evidenceChecksums must be array");
  if (
    !["required", "not-required"].includes(r.humanReviewRequirement as string)
  ) {
    errors.push("humanReviewRequirement invalid");
  }
  if (
    !["pending", "approved", "rejected", "not-applicable"].includes(
      r.humanReviewStatus as string,
    )
  ) {
    errors.push("humanReviewStatus invalid");
  }
  return { ok: errors.length === 0, errors };
}

export function validateReceiptSchema(obj: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, errors: ["receipt not an object"] };
  const raw = obj as Partial<ProductionCellReceipt> & { sourceSha?: string };
  const r: Partial<ProductionCellReceipt> = {
    ...raw,
    contentSha: raw.contentSha ?? raw.sourceSha,
    executionSha: raw.executionSha ?? raw.sourceSha ?? raw.contentSha,
  };
  if (r.schemaVersion !== "lesson-visual-production-receipt/v1") {
    errors.push("unsupported receipt schemaVersion");
  }
  if (!RECEIPT_STATUSES.has(r.status as string)) errors.push("status invalid enum");
  reqStr(r.runId, "runId", errors);
  reqStr(r.controlRoomAuthorizationId, "controlRoomAuthorizationId", errors);
  reqSha40(r.contentSha, "contentSha", errors);
  reqSha40(r.executionSha, "executionSha", errors);
  reqSha64(r.approvedManifestSha256, "approvedManifestSha256", errors);
  reqStr(r.cellId, "cellId", errors);
  reqStr(r.lessonId, "lessonId", errors);
  if (!LOCALES.has(r.locale as string)) errors.push("locale invalid");
  if (![1, 2, 3, 4].includes(r.method as number)) errors.push("method invalid");
  reqStr(r.idempotencyKey, "idempotencyKey", errors);
  if (!Number.isInteger(r.attemptNumber) || (r.attemptNumber as number) < 1) {
    errors.push("attemptNumber invalid");
  }
  reqSha64(r.fingerprint, "fingerprint", errors);
  reqStr(r.producedAt, "producedAt", errors);
  reqStr(r.completedAt, "completedAt", errors);
  if (r.status === "ACCEPTED") {
    reqSha64(r.contentSha256, "contentSha256", errors);
    reqStr(r.mimeType, "mimeType", errors);
    reqStr(r.outputPathOrStorageKey, "outputPathOrStorageKey", errors);
    reqStr(r.providerAccountId, "providerAccountId", errors);
    reqStr(r.providerName, "providerName", errors);
    reqStr(r.providerRequestId, "providerRequestId", errors);
    if (typeof r.byteLength !== "number" || r.byteLength <= 0) {
      errors.push("byteLength must be positive for ACCEPTED");
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateMappingSchema(obj: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, errors: ["mapping not an object"] };
  const m = obj as Partial<ProductionMapping>;
  if (m.schemaVersion !== "lesson-visual-production-mapping/v1") {
    errors.push("unsupported mapping schemaVersion");
  }
  reqStr(m.cellId, "cellId", errors);
  reqStr(m.lessonId, "lessonId", errors);
  if (!LOCALES.has(m.locale as string)) errors.push("locale invalid");
  reqStr(m.immutableOutputStorageId, "immutableOutputStorageId", errors);
  reqSha64(m.contentSha256, "contentSha256", errors);
  reqStr(m.mimeType, "mimeType", errors);
  reqSha40(m.contentSha, "contentSha", errors);
  reqSha40(m.executionSha, "executionSha", errors);
  reqSha64(m.approvedManifestSha256, "approvedManifestSha256", errors);
  reqStr(m.receiptRef, "receiptRef", errors);
  reqStr(m.rightsProvenanceRef, "rightsProvenanceRef", errors);
  reqStr(m.validationRef, "validationRef", errors);
  if (m.acceptedValidationStatus !== "ACCEPTED") {
    errors.push("acceptedValidationStatus must be ACCEPTED");
  }
  reqStr(m.runId, "runId", errors);
  if (typeof m.width !== "number" || typeof m.height !== "number") {
    errors.push("dimensions required");
  }
  return { ok: errors.length === 0, errors };
}

export function validateOutputValidationSchema(obj: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") {
    return { ok: false, errors: ["output validation not an object"] };
  }
  const v = obj as Partial<OutputValidationRecord>;
  if (v.schemaVersion !== "lesson-visual-output-validation/v1") {
    errors.push("unsupported output validation schemaVersion");
  }
  if (typeof v.ok !== "boolean") errors.push("ok must be boolean");
  if (!Array.isArray(v.errors)) errors.push("errors must be array");
  if (typeof v.byteLength !== "number") errors.push("byteLength required");
  if (typeof v.fixtureRejected !== "boolean" || typeof v.stubRejected !== "boolean") {
    errors.push("fixture/stub flags required");
  }
  reqStr(v.cellId, "cellId", errors);
  reqStr(v.lessonId, "lessonId", errors);
  if (!LOCALES.has(v.locale as string)) errors.push("locale invalid");
  reqStr(v.runId, "runId", errors);
  reqStr(v.controlRoomAuthorizationId, "controlRoomAuthorizationId", errors);
  reqSha40(v.contentSha, "contentSha", errors);
  reqSha40(v.executionSha, "executionSha", errors);
  reqSha64(v.approvedManifestSha256, "approvedManifestSha256", errors);
  reqStr(v.validatedAt, "validatedAt", errors);
  if (v.ok) {
    reqSha64(v.contentChecksumSha256, "contentChecksumSha256", errors);
    reqStr(v.detectedMime, "detectedMime", errors);
    reqStr(v.providerName, "providerName", errors);
    reqStr(v.providerAccountId, "providerAccountId", errors);
    reqStr(v.providerAuthId, "providerAuthId", errors);
    reqStr(v.providerRequestId, "providerRequestId", errors);
    reqStr(v.rightsProvenanceRef, "rightsProvenanceRef", errors);
    if (typeof v.width !== "number" || typeof v.height !== "number") {
      errors.push("dimensions required when ok");
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateFailureRecordSchema(obj: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, errors: ["failure record not an object"] };
  const f = obj as Partial<CellFailureRecord>;
  if (f.schemaVersion !== "lesson-visual-failure/v1") {
    errors.push("unsupported failure schemaVersion");
  }
  reqStr(f.cellId, "cellId", errors);
  reqStr(f.runId, "runId", errors);
  if (!Array.isArray(f.errors) || f.errors.length === 0) {
    errors.push("errors must be non-empty array");
  }
  reqStr(f.failureCode, "failureCode", errors);
  return { ok: errors.length === 0, errors };
}

export function validateRunSummarySchema(obj: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, errors: ["run summary not an object"] };
  const s = obj as Partial<ProductionRunSummary>;
  if (s.schemaVersion !== "lesson-visual-run-summary/v1") {
    errors.push("unsupported run summary schemaVersion");
  }
  reqStr(s.runId, "runId", errors);
  reqSha40(s.contentSha, "contentSha", errors);
  reqSha40(s.executionSha, "executionSha", errors);
  reqSha64(s.approvedManifestSha256, "approvedManifestSha256", errors);
  if (s.mode !== "full" && s.mode !== "failed-only" && s.mode !== "pilot") errors.push("mode invalid");
  if (s.executionMode !== "production" && s.executionMode !== "dry-run") {
    errors.push("executionMode invalid");
  }
  for (const k of [
    "expectedCells",
    "attempted",
    "accepted",
    "skipped",
    "failed",
    "retryable",
    "nonRetryable",
    "quotaUsage",
    "quotaCeiling",
    "receiptCount",
    "mappingCount",
    "providerAttemptQuota",
    "providerAttemptsUsed",
  ] as const) {
    if (typeof (s as Record<string, unknown>)[k] !== "number") {
      errors.push(`${k} must be number`);
    }
  }
  reqStr(s.totalCostMicros, "totalCostMicros", errors);
  reqSha64(s.artifactIndexSha256, "artifactIndexSha256", errors);
  if (!["SUCCESS", "FAILED", "PARTIAL"].includes(s.finalRunStatus as string)) {
    errors.push("finalRunStatus invalid");
  }
  if (!Array.isArray(s.errors)) errors.push("errors must be array");
  return { ok: errors.length === 0, errors };
}

export function validateAggregateReportSchema(obj: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") {
    return { ok: false, errors: ["aggregate report not an object"] };
  }
  const a = obj as Partial<AggregateValidationReportShape>;
  if (a.schemaVersion !== "lesson-visual-aggregate-validation/v1") {
    errors.push("unsupported aggregate schemaVersion");
  }
  if (typeof a.ok !== "boolean") errors.push("ok must be boolean");
  if (!Array.isArray(a.errors)) errors.push("errors must be array");
  const rs = validateRunSummarySchema(a.runSummary);
  if (!rs.ok) errors.push(...rs.errors.map((e) => `runSummary: ${e}`));
  reqSha64(a.reportSha256, "reportSha256", errors);
  return { ok: errors.length === 0, errors };
}
