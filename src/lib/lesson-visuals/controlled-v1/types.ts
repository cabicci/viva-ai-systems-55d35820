/**
 * Controlled-v1 400-visual pipeline — shared types.
 *
 * This is a NEW, separate pipeline from `src/lib/lesson-visuals/v1/`.
 * It never reads from or writes to the legacy v1 method-decision ledger.
 */

export const LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const CATEGORY_CODES = ["A", "B", "C"] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];

/**
 * Route enum for controlled-v1. This renames the classification-source
 * `DIAGRAM` route to `INSTRUCTIONAL_COMPOSITION` (label-only normalization);
 * `MASAARAT_SCREENSHOT` and `AUTHORIZED_EXTERNAL_SCREENSHOT` are unchanged.
 */
export const ROUTES = [
  "MASAARAT_SCREENSHOT",
  "AUTHORIZED_EXTERNAL_SCREENSHOT",
  "INSTRUCTIONAL_COMPOSITION",
] as const;
export type Route = (typeof ROUTES)[number];

export interface ClassificationLessonEntry {
  position: number;
  lessonId: string;
  title: string;
  cat: CategoryCode;
  route: Route;
}

export interface Classification100 {
  schemaVersion: string;
  ok: boolean;
  sourceReconcileResultPath: string;
  classificationSourceSha256: string;
  acceptedClassificationBaselineSha: string;
  normalizationRule: string;
  counts: Record<Route, number>;
  lessons: ClassificationLessonEntry[];
  masaaratScreenshotLessonIds: string[];
  authorizedExternalScreenshotLessonIds: string[];
}

export type CellStatus = "PENDING" | "ACCEPTED" | "FAILED" | "BLOCKED_UNRESOLVED_SPEC";

export interface ManifestCell {
  cellId: string;
  lessonId: string;
  locale: Locale;
  position: number;
  category: CategoryCode;
  route: Route;
  title: string;
}

export interface ProductionManifest {
  manifestVersion: "controlled-v1-manifest/1";
  generatedAt: string;
  classificationSourceSha256: string;
  acceptedClassificationBaselineSha: string;
  reconciledOriginMainSha: string;
  counts: {
    lessons: number;
    locales: number;
    cells: number;
    perRoute: Record<Route, number>;
  };
  cells: ManifestCell[];
}

export interface PilotManifest {
  manifestVersion: "controlled-v1-pilot-manifest/1";
  generatedAt: string;
  controlledFailureTargetCellId: string;
  cells: ManifestCell[];
}

export interface CellReceipt {
  receiptVersion: "controlled-v1-receipt/1";
  cellId: string;
  lessonId: string;
  locale: Locale;
  route: Route;
  mode: RunnerMode;
  status: CellStatus;
  reason: string | null;
  artifactPath: string | null;
  artifactSha256: string | null;
  bytesWritten: number | null;
  controlledFailureInjected: boolean;
  producedAt: string;
}

export type RunnerMode =
  | "preflight"
  | "pilot"
  | "full-400"
  | "failed-only"
  | "report-only"
  | "method-c-remaining";

export interface GoldenReferenceEntry {
  id: string;
  copyPath: string;
  sourcePath: string;
  sha256: string;
  size: number;
  dims: { width: number; height: number };
  lessonId: string;
  locale: string;
  category: Route;
  referenceKind: string;
  approvalRole: string;
  evidencePath: string;
}

export interface GoldenReferencesFile {
  schemaVersion: string;
  notes: string[];
  references: GoldenReferenceEntry[];
}

export interface GoldenVerifyResult {
  id: string;
  path: string;
  expectedSha256: string;
  actualSha256: string | null;
  expectedSize: number;
  actualSize: number | null;
  ok: boolean;
  error: string | null;
}

export interface UnresolvedLedgerEntry {
  cellId: string;
  lessonId: string;
  locale: Locale;
  route: Route;
  reason: string;
  resolutionPath: string;
}

export interface UnresolvedLedger {
  ledgerVersion: "controlled-v1-unresolved-ledger/1";
  generatedAt: string;
  entries: UnresolvedLedgerEntry[];
}
