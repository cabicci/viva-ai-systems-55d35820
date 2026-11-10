export type AuditResultLabel =
  | "PASS"
  | "PASS WITH NOTES"
  | "CONTENT FAIL"
  | "ERROR_RETRY_REQUIRED";

/** Raw API reviewer result before normalization */
export type ApiResultLabel = AuditResultLabel | "FAIL";

export type CheckStatus = "pass" | "fail" | "notes" | "skipped" | "unknown";

export interface LessonAuditEntry {
  lessonId: string;
  /** Opaque digest of source, actual request and execution settings. */
  inputIdentity?: string;
  /** Uncertain includes a persisted pre-dispatch marker; never auto-retry. */
  requestState?: "not-started" | "settled" | "uncertain";
  result: AuditResultLabel;
  preflightPassed: boolean;
  preflightErrors: string[];
  apiReviewed: boolean;
  apiError?: string;
  attemptCount?: number;
  objectivePreservation: CheckStatus;
  oneAhaPreservation: CheckStatus;
  missionRubricPreservation: CheckStatus;
  quizKeyPreservation: CheckStatus;
  noHallucinatedConcepts: CheckStatus;
  msaClarity: CheckStatus;
  englishTermGlossIssues: CheckStatus;
  metadataSlugIssues: CheckStatus;
  assistantBoundaryIssues: CheckStatus;
  videoScriptSuitability: CheckStatus;
  hardBlockers: string[];
  softNotes: string[];
  fixRecommendations: string[];
  summary: string;
  productionFile: string;
  canonicalFile: string;
}

export interface ApiReviewResponse {
  result: ApiResultLabel;
  objectivePreservation: CheckStatus;
  oneAhaPreservation: CheckStatus;
  missionRubricPreservation: CheckStatus;
  quizKeyPreservation: CheckStatus;
  noHallucinatedConcepts: CheckStatus;
  msaClarity: CheckStatus;
  englishTermGlossIssues: CheckStatus;
  metadataSlugIssues: CheckStatus;
  assistantBoundaryIssues: CheckStatus;
  videoScriptSuitability: CheckStatus;
  hardBlockers: string[];
  softNotes: string[];
  fixRecommendations: string[];
  summary: string;
}

export interface Reviewer {
  name: string;
  model: string;
  requestIdentity(input: ReviewInput): string;
  reviewLesson(input: ReviewInput, signal?: AbortSignal, expectedRequestIdentity?: string): Promise<ApiReviewResponse>;
}

export interface ReviewInput {
  lessonId: string;
  productionSummary: string;
  canonicalSummary: string;
  productionQuizMission: string;
  canonicalQuizMission: string;
  metadataBlock: string;
}

export function normalizeApiResult(result: ApiResultLabel): AuditResultLabel {
  if (result === "FAIL") return "CONTENT FAIL";
  return result;
}
