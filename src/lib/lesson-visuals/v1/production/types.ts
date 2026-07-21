import type { Locale, Method } from "../types";
import type { UsdMicros } from "./money";

export type ExecutionMode = "production" | "dry-run";
export type ProductionRunMode = "full" | "failed-only";
export type CellRunStatus =
  | "ACCEPTED"
  | "FAILED"
  | "SKIPPED"
  | "RETRYABLE_FAILURE"
  | "NON_RETRYABLE_FAILURE";

export interface RightsProvenanceRecord {
  schemaVersion: "lesson-visual-rights/v1";
  generationMethod: Method;
  providerOrSource: string;
  providerModelOrRenderer: string;
  generatedAt: string;
  providerRequestId: string;
  cellId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  /** Independently calculated final accepted output SHA-256. */
  outputContentSha256: string;
  sourceReferences: string[];
  screenshotSiteIdentity: string | null;
  licenseOrUsageBasis: string;
  humanReviewRequirement: "required" | "not-required";
  humanReviewStatus: "pending" | "approved" | "rejected" | "not-applicable";
  prohibitedLegacySource: false;
  transformationRecord: string[];
  evidenceReferences: string[];
  evidenceChecksums: string[];
}

export interface ProviderGenerationRequest {
  schemaVersion: "lesson-visual-provider-request/v1";
  runId: string;
  controlRoomAuthorizationId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  promptOrRenderingSpec: string;
  requestedWidth: number;
  requestedHeight: number;
  expectedMimeTypes: readonly string[];
  rightsProvenanceRequirements: {
    requireGreenfield: true;
    prohibitLegacyReuse: true;
    requireProviderRequestId: true;
    requireLicenseBasis: true;
  };
  idempotencyKey: string;
  attemptNumber: number;
  budgetAllocationMicros: string;
  maxCostMicros: string;
  expectedProviderAccountId: string;
  expectedProviderProjectId: string | null;
  expectedProviderAuthId: string;
}

export interface ProviderGenerationResponse {
  schemaVersion: "lesson-visual-provider-response/v1";
  providerName: string;
  providerRequestId: string;
  modelOrRenderer: string;
  providerAccountId: string;
  providerProjectId: string | null;
  providerAuthId: string;
  outputBytesBase64: string | null;
  secureByteReference: string | null;
  mimeType: string;
  width: number;
  height: number;
  byteLength: number;
  providerReportedCostMicros: string;
  generationTimestamp: string;
  providerMetadata: Record<string, string>;
  rightsProvenance: RightsProvenanceRecord;
  /** Provider-reported checksum — must match independently calculated bytes. */
  contentChecksumSha256: string;
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  runId: string;
  controlRoomAuthorizationId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  idempotencyKey: string;
  attemptNumber: number;
}

export interface OutputValidationRecord {
  schemaVersion: "lesson-visual-output-validation/v1";
  ok: boolean;
  errors: string[];
  detectedMime: string | null;
  width: number | null;
  height: number | null;
  byteLength: number;
  contentChecksumSha256: string | null;
  fixtureRejected: boolean;
  stubRejected: boolean;
  cellId: string;
  lessonId: string;
  locale: Locale;
  runId: string;
  controlRoomAuthorizationId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  providerName: string | null;
  providerAccountId: string | null;
  providerProjectId: string | null;
  providerAuthId: string | null;
  providerRequestId: string | null;
  rightsProvenanceRef: string | null;
  validatedAt: string;
}

export interface ProductionCellReceipt {
  schemaVersion: "lesson-visual-production-receipt/v1";
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
  fingerprint: string;
  producedAt: string;
  completedAt: string;
  failureCode: string | null;
  retryable: boolean | null;
  error: string | null;
  /** Explicit dry-run/fixture marker; production reuse rejected when set. */
  fixtureMarker: string | null;
}

export interface ProductionMapping {
  schemaVersion: "lesson-visual-production-mapping/v1";
  cellId: string;
  lessonId: string;
  locale: Locale;
  immutableOutputStorageId: string;
  contentSha256: string;
  mimeType: string;
  width: number;
  height: number;
  sourceSha: string;
  approvedManifestSha256: string;
  receiptRef: string;
  rightsProvenanceRef: string;
  validationRef: string;
  acceptedValidationStatus: "ACCEPTED";
  runId: string;
}

export interface CellFailureRecord {
  schemaVersion: "lesson-visual-failure/v1";
  cellId: string;
  runId: string;
  failureCode: string;
  errors: string[];
  retryable: boolean;
  producedAt: string;
}

export interface ProductionRunSummary {
  schemaVersion: "lesson-visual-run-summary/v1";
  runId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  mode: ProductionRunMode;
  executionMode: ExecutionMode;
  expectedCells: number;
  attempted: number;
  accepted: number;
  skipped: number;
  failed: number;
  retryable: number;
  nonRetryable: number;
  totalCostMicros: string;
  quotaUsage: number;
  quotaCeiling: number;
  providerAttemptQuota: number;
  providerAttemptsUsed: number;
  receiptCount: number;
  mappingCount: number;
  artifactIndexSha256: string;
  finalRunStatus: "SUCCESS" | "FAILED" | "PARTIAL";
  errors: string[];
}

export interface AggregateValidationReportShape {
  schemaVersion: "lesson-visual-aggregate-validation/v1";
  ok: boolean;
  errors: string[];
  runSummary: ProductionRunSummary;
  reportSha256: string;
}

export interface ProductionConfig {
  executionMode: ExecutionMode;
  providerName: string;
  providerModel: string;
  /** Explicit expected account identity (never secret value). */
  providerAccountId: string;
  /** Explicit expected project identity; empty string means unused. */
  providerProjectId: string;
  providerAuthId: string;
  providerApiKeyPresent: boolean;
  providerAccountIdPresent: boolean;
  providerProjectIdPresent: boolean;
  providerAuthIdPresent: boolean;
  storageCredentialPresent: boolean;
  runCostCeilingMicros: UsdMicros;
  cellCostCeilingMicros: UsdMicros;
  maxOutputBytes: number;
  allowedMimeTypes: string[];
  requiredWidth: number;
  requiredHeight: number;
  /** Provider-attempt quota (max total generate calls). */
  providerAttemptQuota: number;
  maxRetries: number;
  outputStorageTarget: string;
  lovableDispatchActorsRaw: string;
}

export interface BudgetPreflightInput {
  eligibleCellCount: number;
  cellCostCeilingMicros: UsdMicros;
  runCostCeilingMicros: UsdMicros;
  providerAttemptQuota: number;
  maxRetries: number;
}

export interface BudgetPreflightResult {
  ok: boolean;
  errors: string[];
  projectedMaxCostMicros: UsdMicros;
  projectedMaxProviderAttempts: number;
}
