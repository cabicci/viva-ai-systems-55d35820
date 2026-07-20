/**
 * Lesson-driven 400-visual pipeline — shared types (v1).
 * Production generation is out of scope for local fixtures.
 */

export const LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const METHODS = [1, 2, 3, 4] as const;
export type Method = (typeof METHODS)[number];

export type SourcePackageKind = "ts-blocks" | "json";

export interface SourcePackageRef {
  path: string;
  kind: SourcePackageKind;
}

export interface EvidenceRef {
  path: string;
  field: string;
  quote: string;
}

export interface LabelEntry {
  id: string;
  text: string;
  source: { path: string; field: string };
}

export interface ComparisonPack {
  leftLabel: string;
  rightLabel: string;
  leftBody: string;
  rightBody: string;
}

export interface VisualIntent {
  kind:
    | "screenshot"
    | "diagram"
    | "comparison"
    | "process"
    | "system"
    | "decision"
    | "data-relationship"
    | "concept-scene";
  summary: string;
  packageQuotes: Record<Locale, EvidenceRef>;
}

export interface ContentBrief {
  orientation: Record<Locale, string[]>;
  coreIdea: Record<Locale, string>;
  tension: Record<Locale, string>;
  comparison: Record<Locale, ComparisonPack>;
  missionIntro: Record<Locale, string>;
  visualIntent: VisualIntent;
}

export interface AiPromptContract {
  providerClass: string;
  paidAllowed: false;
  textFree: true;
  promptRules: string[];
  costCeilingUsd?: number;
}

export interface ScreenshotSpec {
  url: string;
  rightsNote: string;
  failOnLoginRedirect: true;
  allowlisted: true;
}

export interface FactualClaim {
  claim: string;
  locale: Locale;
  path: string;
  field: string;
  quote: string;
}

export interface LessonVisualMaster {
  schemaVersion: "lesson-visual-master/v1";
  lessonId: string;
  pathId: string;
  moduleId: string;
  sourceSha: string;
  titles: Record<Locale, string>;
  sourcePackages: Record<Locale, SourcePackageRef>;
  contentBrief: ContentBrief;
  method: Method;
  methodRationale: string;
  compositionPattern: string;
  duplicationJustification: string | null;
  labelPacks: Record<Locale, LabelEntry[]>;
  altTexts: Record<Locale, string>;
  aiPromptContract: AiPromptContract | null;
  screenshotSpec: ScreenshotSpec | null;
  factualClaims: FactualClaim[];
  checksum: string;
}

export interface ManifestCell {
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
}

export interface AuthorizedManifest {
  manifestVersion: "lesson-visuals-authorized/v1";
  sourceSha: string;
  lessonIds: string[];
  locales: Locale[];
  cells: ManifestCell[];
  counts: { masters: 100; cells: 400; perLocale: 100 };
}

export type ReceiptStatus = "ACCEPTED" | "FAILED" | "SKIPPED";

export interface CellReceipt {
  receiptVersion: "lesson-visual-receipt/v1";
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  status: ReceiptStatus;
  sourceSha: string;
  masterChecksum: string;
  fingerprint: string;
  artifactSha256: string | null;
  producedAt: string;
  error?: string | null;
}

export interface AdapterContext {
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  master: LessonVisualMaster;
  fixtureMode?: boolean;
  authId?: string;
  costCeilingUsd?: number;
}

export interface AdapterResult {
  ok: boolean;
  svg?: string;
  artifactBytes?: Uint8Array;
  error?: string;
  skippedPaid?: boolean;
}

export const BANNED_GENERIC_LABELS = [
  "Core idea",
  "Core Idea",
  "Option A",
  "Option B",
  "Before",
  "After",
  "Before/After",
  "Step 1",
  "Step 2",
  "Input",
  "Check",
  "Output",
  "Empty",
] as const;

/** Masaarat-owned public hosts allowed for authentic screenshots. */
export const SCREENSHOT_ALLOWLIST_HOSTS = [
  "masaarat.ai",
  "www.masaarat.ai",
  "learn.masaarat.ai",
  "docs.masaarat.ai",
] as const;
