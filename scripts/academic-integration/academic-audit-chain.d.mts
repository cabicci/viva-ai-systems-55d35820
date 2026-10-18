type Payload = Record<string, unknown>;
export type AcademicAuditSnapshot = {
  items: number[];
  receiptCount: number;
  rows: Array<{
    courseId: string;
    lessonId: string;
    locale: string;
    sourcePath: string;
    latestSha256: string;
    payload: Payload;
    states: Array<{ sha256: string; payload: Payload }>;
  }>;
  stageAfter(
    revisionPath: string,
    lessonId: string,
    locale: string,
  ): {
    payload: Payload;
    latestSha256: string;
  };
};
export const ACADEMIC_AUDIT_CHAIN_PATH: string;
export function canonicalAcademicPayload(value: unknown): string;
export function academicPayloadHash(value: unknown): string;
export function readAcademicAuditChain(read?: (path: string) => string): AcademicAuditSnapshot;
export function renderCurrentAcademicAuditSQL(snapshot?: AcademicAuditSnapshot): {
  sql: string;
  report: {
    items: number[];
    sourceLessons: number;
    immutableReceipts: number;
    exactRecordedStages: boolean;
    databaseChanged: boolean;
  };
};
