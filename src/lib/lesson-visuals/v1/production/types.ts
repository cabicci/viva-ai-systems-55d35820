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
  budgetAllocationMicros: string; // decimal-safe integer string
  maxCostMicros: string;
}

export interface ProviderGenerationResponse {
  schemaVersion: "lesson-visual-provider-response/v1";
  providerName: string;
  providerRequestId: string;
  modelOrRenderer: string;
  /** Inline bytes (preferred for validated local/mock). Secure refs must be resolved before validation. */
  outputBytesBase64: string | null;
  /** Optional secure reference — must be fetched by authorized adapter before acceptance. */
  secureByteReference: string | null;
  mimeType: string;
  width: number;
  height: number;
  byteLength: number;
  providerReportedCostMicros: string;
  generationTimestamp: string;
  providerMetadata: Record<string, string>;
  rightsProvenance: RightsProvenanceRecord;
  contentChecksumSha256: string;
  cellId: string;
  lessonId: string;
  locale: Locale;
  runId: string;
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
  acceptedValidationStatus: "ACCEPTED";
  runId: string;
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
  receiptCount: number;
  mappingCount: number;
  artifactIndexSha256: string;
  finalRunStatus: "SUCCESS" | "FAILED" | "PARTIAL";
  errors: string[];
}

export interface ProductionConfig {
  executionMode: ExecutionMode;
  providerName: string;
  providerModel: string;
  providerApiKeyPresent: boolean;
  providerAccountIdPresent: boolean;
  providerAuthIdPresent: boolean;
  storageCredentialPresent: boolean;
  runCostCeilingMicros: UsdMicros;
  cellCostCeilingMicros: UsdMicros;
  maxOutputBytes: number;
  allowedMimeTypes: string[];
  requiredWidth: number;
  requiredHeight: number;
  quotaCells: number;
  maxRetries: number;
  outputStorageTarget: string;
  lovableDispatchActorsRaw: string;
}

export interface BudgetPreflightInput {
  cellCount: number;
  cellCostCeilingMicros: UsdMicros;
  runCostCeilingMicros: UsdMicros;
  quotaCells: number;
  maxRetries: number;
}

export interface BudgetPreflightResult {
  ok: boolean;
  errors: string[];
  projectedMaxCostMicros: UsdMicros;
  projectedMaxAttempts: number;
}
