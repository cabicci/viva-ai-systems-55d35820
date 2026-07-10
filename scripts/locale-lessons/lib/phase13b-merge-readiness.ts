/**
 * Phase 13B merge-readiness audit + deterministic repair for recovered packages.
 *
 * Pure functions — no AI, no OpenAI, no publish, no runtime locale merge.
 * Structural audit baseline: immutable recovered ar-MSA corpus (not runtime lessons/).
 * Localized text source: recovered package contentMarkdown / bullets / options.
 */
import path from "node:path";
import type {
  AdaptedLessonPackage,
  LocalizedLessonPackage,
  LocalizedLessonSection,
  LocalizedLessonTable,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  hasQuizCorrectAnswerPrefixLeak,
  hasQuizOptionPrefixLeak,
  isInternalProductionReferenceSection,
} from "./quality-warnings.ts";
import {
  getCorruptedQuizFallback,
  lockQuizOptionsToSourceStructure,
  resolveSourceQuizStructure,
  type QuizStructureFallback,
} from "./quiz-structure.ts";
import {
  normalizeQuizOptionText,
  stripBannedPhrasesFromText,
} from "./quality-warnings.ts";
import { PHASE13B_RECOVERED_PACKAGES_ROOT } from "../collect-phase13b-recovered-report.ts";
import { readJsonFile } from "./source-package.ts";

export const PHASE13B_RECOVERED_LOCALES = ["ar-MSA", "ar-Gulf", "en"] as const;

/** Immutable recovered ar-MSA packages — canonical structural baseline for Phase 13B audit. */
export const PHASE13B_RECOVERED_MSA_AUDIT_BASELINE_ROOT = path.join(
  PHASE13B_RECOVERED_PACKAGES_ROOT,
  "ar-MSA",
);

export function phase13BRecoveredMsaAuditBaselinePath(lessonId: string): string {
  return path.join(PHASE13B_RECOVERED_MSA_AUDIT_BASELINE_ROOT, `${lessonId}.json`);
}

export async function loadPhase13BRecoveredMsaAuditBaseline(
  lessonId: string,
): Promise<LocalizedLessonPackage> {
  return readJsonFile<LocalizedLessonPackage>(
    phase13BRecoveredMsaAuditBaselinePath(lessonId),
  );
}
export type Phase13BRecoveredLocale = (typeof PHASE13B_RECOVERED_LOCALES)[number];

/** Gulf lessons with collapsed Quiz in verified Phase 13B shards — no MSA insert allowed. */
export const BLOCKED_MISSING_GULF_QUIZ_LESSONS = [
  "analyst-m6-l2-interpretation-mistakes",
  "automator-m5-l2-rag-in-n8n",
] as const;

export type BlockedMissingGulfQuizLessonId =
  (typeof BLOCKED_MISSING_GULF_QUIZ_LESSONS)[number];

export const GENERIC_QUIZ_QUESTION_FALLBACK =
  "ما الخيار الأنسب وفقًا لما ورد في القسم أعلاه؟";

export const EGYPTIAN_QUIZ_EXPLANATION_FALLBACK =
  /الإجابة الصحيحة محفوظة من الإنتاج المصري/;

export const TRUNCATED_QUIZ_EXPLANATION_ARTIFACT = /^—\s*للسياق الكامل\.?$/;

/** Malformed markdown where a period was wrapped in bold markers. */
export const MALFORMED_MARKDOWN_PERIOD = /\*\*\.\*\*/g;

export interface Phase13BAuditIssue {
  locale: string;
  lessonId: string;
  path: string;
  kind:
    | "table_shape"
    | "table_markdown_mismatch"
    | "mission_delivery"
    | "mission_parity"
    | "mission_text_trim"
    | "quiz_prefix"
    | "quiz_markdown_artifact"
    | "quiz_structure"
    | "quiz_forbidden_fallback"
    | "section_parity"
    | "structural_parity"
    | "blocked_missing_gulf_quiz";
  message: string;
  severity: "error" | "warning";
}

export interface Phase13BAuditResult {
  packagesScanned: number;
  issues: Phase13BAuditIssue[];
  byKind: Record<Phase13BAuditIssue["kind"], number>;
}

export interface Phase13BValidationSummary {
  arMsa: number;
  arGulf: number;
  en: number;
  total: number;
  jsonParseErrors: number;
  tableShapeErrors: number;
  missionParityErrors: number;
  quizStructuralErrors: number;
  quizPrefixFormatErrors: number;
  sectionParityErrors: number;
  blockedMissingGulfQuiz: string[];
  validationErrors: string[];
  missingIds: string[];
  retryCells: { locale: string; lessonId: string }[];
  complete: boolean;
  ok: boolean;
  mergeBlocked: boolean;
}

/** Sections omitted from learner-final recovered packages (video/diagram/screenshot intent). */
export function isOmittedFromRecoveredPackage(section: LocalizedLessonSection): boolean {
  if (isInternalProductionReferenceSection(section)) return true;
  const role = section.role?.toLowerCase() ?? "";
  return (
    role.includes("diagram block") ||
    role.includes("screenshot block")
  );
}

function learnerFacingSourceSections(source: LocalizedLessonPackage): LocalizedLessonSection[] {
  return source.sections.filter((s) => !isOmittedFromRecoveredPackage(s));
}

const PLACEHOLDER_OPTION_PATTERN =
  /inappropriate (choice|option)|partial answer that misses|خيار غير ملائم|خيار غير مناسب|إجابة جزئية/i;

function hasPlaceholderQuizOptions(options: string[]): boolean {
  return options.some((option) => PLACEHOLDER_OPTION_PATTERN.test(option));
}

function hasRecoveredMetaDistractorQuiz(section: LocalizedLessonSection): boolean {
  if (section.role !== "Quiz" || !section.quiz) return false;
  return hasPlaceholderQuizOptions(section.quiz.options ?? []);
}

function shouldSkipCanonicalQuizIndexParity(
  adapted: LocalizedLessonSection,
): boolean {
  if (adapted.role !== "Quiz" || !adapted.quiz) return false;
  const { correctIndex, options } = adapted.quiz;
  if (
    correctIndex === undefined ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return false;
  }
  const selected = options[correctIndex]?.trim() ?? "";
  if (!selected || PLACEHOLDER_OPTION_PATTERN.test(selected)) return false;
  if (hasRecoveredMetaDistractorQuiz(adapted)) return true;
  return true;
}

/** ar-MSA recovered quiz repair uses Gulf canonical fallbacks when placeholders remain. */
function msaQuizFallback(lessonId: string): QuizStructureFallback | null {
  return getCorruptedQuizFallback(lessonId, "ar-Gulf");
}

function repairArMsaQuizSection(
  sourceSection: LocalizedLessonSection,
  section: LocalizedLessonSection,
  lessonId: string,
): LocalizedLessonSection {
  if (section.role !== "Quiz" || !section.quiz) return section;

  let working = repairQuizMechanicalArtifacts(section);
  const quiz = working.quiz!;

  if (!hasPlaceholderQuizOptions(working.quiz?.options ?? [])) {
    return working;
  }

  const resolved = resolveSourceQuizStructure(sourceSection, lessonId);
  if (!resolved.ok) return working;

  const adaptedOptions = (working.quiz!.options ?? []).map((option) =>
    cleanQuizOptionText(option),
  );

  const locked = lockQuizOptionsToSourceStructure(
    resolved.structure,
    adaptedOptions,
    adaptedOptions,
  );

  let options = locked.options;
  const question = working.quiz!.question ?? "";
  let explanation = working.quiz!.explanation ?? "";
  if (TRUNCATED_QUIZ_EXPLANATION_ARTIFACT.test(explanation.trim())) {
    const restored = extractQuizExplanationFromMarkdown(working.contentMarkdown);
    if (restored) explanation = restored;
  }
  const fallback = msaQuizFallback(lessonId);

  if (
    fallback &&
    (hasPlaceholderQuizOptions(options) ||
      options.length !== fallback.options.length ||
      locked.correctIndex !== fallback.correctIndex)
  ) {
    options = options.map(
      (option, index) =>
        option.trim() && !PLACEHOLDER_OPTION_PATTERN.test(option)
          ? option
          : (fallback.options[index]?.trim() ?? ""),
    );
    if (options.some((option) => !option.trim() || PLACEHOLDER_OPTION_PATTERN.test(option))) {
      options = [...fallback.options];
    }
  }

  return {
    ...working,
    contentMarkdown: sanitizeMarkdownArtifactsInString(working.contentMarkdown),
    bullets: options,
    quiz: {
      ...working.quiz!,
      question,
      options,
      explanation,
      correctIndex: working.quiz!.correctIndex,
    },
  };
}

function extractQuizExplanationFromMarkdown(contentMarkdown: string): string | null {
  const patterns = [
    /\*\*التفسير:\*\*\s*(.+)$/m,
    /\*\*Explanation:\*\*\s*(.+)$/im,
    /^Explanation:\s*(.+)$/im,
  ];
  for (const pattern of patterns) {
    const match = contentMarkdown.match(pattern);
    const explanation = match?.[1]?.trim();
    if (explanation && !TRUNCATED_QUIZ_EXPLANATION_ARTIFACT.test(explanation)) {
      return explanation;
    }
  }
  return null;
}

function pairingSourceSections(source: LocalizedLessonPackage): LocalizedLessonSection[] {
  return source.sections.filter((s) => !isInternalProductionReferenceSection(s));
}

function isSectionStructurallyComplete(section: LocalizedLessonSection): boolean {
  if (section.role === "Quiz") {
    return Boolean(section.quiz?.options?.some((option) => option.trim().length > 0));
  }
  if (section.role === "Mission") {
    return Boolean(
      section.mission?.rubric?.length ||
        section.mission?.delivery?.length ||
        section.tables.some((table) => table.rows.length > 0),
    );
  }
  return section.contentMarkdown.trim().length > 0 || section.bullets.length > 0;
}

/** Restore missing/collapsed sections from shipped locale lessons (read-only source). */
export function mergeWithShippedLesson(
  recovered: AdaptedLessonPackage,
  shipped: AdaptedLessonPackage,
): AdaptedLessonPackage {
  if (recovered.locale !== shipped.locale || recovered.lessonId !== shipped.lessonId) {
    return recovered;
  }

  const recoveredByRole = new Map(recovered.sections.map((section) => [section.role, section]));
  const sections = shipped.sections.map((shippedSection) => {
    const existing = recoveredByRole.get(shippedSection.role);
    if (existing && isSectionStructurallyComplete(existing)) {
      return existing;
    }
    return shippedSection;
  });

  return { ...recovered, sections };
}

function isOptionalOmittedSection(role: string): boolean {
  const lower = role.toLowerCase();
  return lower.includes("screenshot block") || lower.includes("diagram block");
}

export function isBlockedCollapsedGulfQuiz(
  pkg: Pick<AdaptedLessonPackage, "locale" | "lessonId">,
  role: string,
): boolean {
  return (
    pkg.locale === "ar-Gulf" &&
    (BLOCKED_MISSING_GULF_QUIZ_LESSONS as readonly string[]).includes(pkg.lessonId) &&
    role === "Quiz"
  );
}

export function isKnownBlockedMissingGulfQuizPackage(
  pkg: Pick<AdaptedLessonPackage, "locale" | "lessonId" | "sections">,
  source: LocalizedLessonPackage,
): boolean {
  return (
    pkg.locale === "ar-Gulf" &&
    (BLOCKED_MISSING_GULF_QUIZ_LESSONS as readonly string[]).includes(pkg.lessonId) &&
    !pkg.sections.some((section) => section.role === "Quiz") &&
    pairingSourceSections(source).some((section) => section.role === "Quiz")
  );
}

function adaptedOptionalIntentOnly(
  adaptedRole: string,
  sourceSections: LocalizedLessonSection[],
): boolean {
  return (
    isOptionalOmittedSection(adaptedRole) &&
    !sourceSections.some((section) => section.role === adaptedRole)
  );
}

export function sectionRolesAlign(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
): boolean {
  const sourceSections = pairingSourceSections(source);
  let sourceIndex = 0;

  for (const adapted of pkg.sections) {
    if (adaptedOptionalIntentOnly(adapted.role ?? "", sourceSections)) {
      continue;
    }

    while (
      sourceIndex < sourceSections.length &&
      sourceSections[sourceIndex].role !== adapted.role
    ) {
      if (
        !isOptionalOmittedSection(sourceSections[sourceIndex].role ?? "") &&
        !isBlockedCollapsedGulfQuiz(pkg, sourceSections[sourceIndex].role ?? "")
      ) {
        return false;
      }
      sourceIndex++;
    }
    if (sourceIndex >= sourceSections.length) return false;
    sourceIndex++;
  }

  while (sourceIndex < sourceSections.length) {
    if (
      !isOptionalOmittedSection(sourceSections[sourceIndex].role ?? "") &&
      !isBlockedCollapsedGulfQuiz(pkg, sourceSections[sourceIndex].role ?? "")
    ) {
      return false;
    }
    sourceIndex++;
  }

  return true;
}

function pairSections(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
): Array<{ source: LocalizedLessonSection; adapted: LocalizedLessonSection }> {
  const sourceSections = pairingSourceSections(source);
  const pairs: Array<{ source: LocalizedLessonSection; adapted: LocalizedLessonSection }> =
    [];
  let sourceIndex = 0;

  for (const adaptedSection of pkg.sections) {
    if (adaptedOptionalIntentOnly(adaptedSection.role ?? "", sourceSections)) {
      continue;
    }

    while (
      sourceIndex < sourceSections.length &&
      sourceSections[sourceIndex].role !== adaptedSection.role
    ) {
      const skippedRole = sourceSections[sourceIndex].role ?? "";
      if (isBlockedCollapsedGulfQuiz(pkg, skippedRole)) {
        sourceIndex++;
        continue;
      }
      sourceIndex++;
    }
    const sourceSection = sourceSections[sourceIndex];
    if (!sourceSection) {
      throw new Error(
        `${pkg.locale}/${pkg.lessonId}: no source section for role "${adaptedSection.role}"`,
      );
    }
    pairs.push({ source: sourceSection, adapted: adaptedSection });
    sourceIndex++;
  }
  return pairs;
}

/** Parse markdown pipe tables from content (skips separator rows). */
export function parseMarkdownTables(
  markdown: string,
): Array<{ headers: string[]; rows: string[][] }> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.includes("|")) {
      index++;
      continue;
    }

    const block: string[] = [];
    while (index < lines.length && lines[index].includes("|")) {
      block.push(lines[index]);
      index++;
    }

    if (block.length < 2) continue;

    const parseRow = (rowLine: string): string[] => {
      const trimmed = rowLine.trim().replace(/^\|/, "").replace(/\|$/, "");
      return trimmed.split("|").map((cell) => cell.trim());
    };

    const isSeparator = (rowLine: string): boolean =>
      /^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$/.test(rowLine);

    const headers = parseRow(block[0]);
    const dataRows: string[][] = [];
    for (let rowIndex = 1; rowIndex < block.length; rowIndex++) {
      if (isSeparator(block[rowIndex])) continue;
      dataRows.push(parseRow(block[rowIndex]));
    }

    if (headers.length > 0 && dataRows.length > 0) {
      tables.push({ headers, rows: dataRows });
    }
  }

  return tables;
}

const QUIZ_LABEL_PREFIX_PATTERNS: RegExp[] = [
  /^\s*The\s+correct\s+answer\s*\(Option\s*\d+\)\s*:\s*/i,
  /^\s*\*{0,2}\s*The\s+correct\s+answer\s*\(Option\s*\d+\)\s*:\s*\*{0,2}\s*/i,
];

export function hasQuizLabelPrefixLeak(text: string): boolean {
  const trimmed = text.trim();
  return (
    hasQuizOptionPrefixLeak(text) ||
    hasQuizCorrectAnswerPrefixLeak(text) ||
    QUIZ_LABEL_PREFIX_PATTERNS.some((pattern) => pattern.test(trimmed))
  );
}

function stripQuizLabelPrefixes(text: string): string {
  let value = text.trim();
  value = value.replace(/^[-*]\s+/, "").trim();
  for (const pattern of QUIZ_LABEL_PREFIX_PATTERNS) {
    value = value.replace(pattern, "").trim();
  }
  value = value
    .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
    .replace(/^\(\s*\d+\)\s*:\s*/, "")
    .replace(/^\*{0,2}\s*الإجابة الصحيحة\s*\*{0,2}\s*\([^)]*\)\s*:\s*\*{0,2}\s*/i, "")
    .replace(/^\*{0,2}\s*The\s+correct\s+answer\s*:\s*\*{0,2}\s*/i, "")
    .replace(/^\*{0,2}\s*الإجابة الصحيحة\s*:\s*\*{0,2}\s*/i, "")
    .trim();
  return value;
}

export function hasMalformedMarkdownPeriodArtifact(text: string): boolean {
  return MALFORMED_MARKDOWN_PERIOD.test(text);
}

export function stripMalformedMarkdownPeriodArtifacts(text: string): string {
  return text.replace(MALFORMED_MARKDOWN_PERIOD, ".");
}

function tableShapeErrors(table: LocalizedLessonTable, basePath: string): string[] {
  const errors: string[] = [];
  const headerCount = table.headers.length;
  if (headerCount === 0) return errors;

  table.rows.forEach((row, rowIndex) => {
    if (row.length !== headerCount) {
      errors.push(
        `${basePath}.rows[${rowIndex}]: ${row.length} cells vs ${headerCount} headers`,
      );
    }
    row.forEach((cell, cellIndex) => {
      if (!cell.trim()) {
        errors.push(`${basePath}.rows[${rowIndex}][${cellIndex}]: empty cell`);
      }
    });
  });

  return errors;
}

function looksLikeEscapedPipeSplit(row: string[], headerCount: number): boolean {
  if (row.length <= headerCount) return false;
  const overflow = row.slice(headerCount - 1);
  return overflow.some((cell) => /\\$/.test(cell) || /^\*\*[^*]*\\/.test(cell));
}

/** Rebuild table rows from contentMarkdown when shape is wrong. */
export function repairTableFromMarkdown(
  table: LocalizedLessonTable,
  contentMarkdown: string,
  tableIndex: number,
): LocalizedLessonTable {
  const parsed = parseMarkdownTables(contentMarkdown);
  const fromMd = parsed[tableIndex];
  if (!fromMd) return table;

  const headerCount = table.headers.length;
  if (headerCount === 0) return table;

  const repairedRows = fromMd.rows.map((row) => {
    if (row.length === headerCount) return row;
    if (row.length > headerCount && looksLikeEscapedPipeSplit(row, headerCount)) {
      const head = row.slice(0, headerCount - 1);
      const tail = row.slice(headerCount - 1).join(" | ").replace(/\\\s*$/g, "").trim();
      return [...head, tail];
    }
    if (row.length > headerCount) {
      const head = row.slice(0, headerCount - 1);
      const tail = row.slice(headerCount - 1).join(" | ");
      return [...head, tail];
    }
    return row;
  });

  return { ...table, rows: repairedRows };
}

export function repairTablesInSection(section: LocalizedLessonSection): LocalizedLessonSection {
  const tables = section.tables.map((table, tableIndex) => {
    const shapeIssues = tableShapeErrors(
      table,
      `sections[${section.role}].tables[${tableIndex}]`,
    );
    if (shapeIssues.length === 0) return table;
    return repairTableFromMarkdown(table, section.contentMarkdown, tableIndex);
  });
  return { ...section, tables };
}

const DELIVERY_SECTION_PATTERNS = [
  /\*\*(?:Delivery|Submission|التسليم):?\*\*:?\s*/i,
  /^(?:Delivery|Submission|التسليم):?\s*/im,
];

const EVALUATION_SECTION_PATTERNS = [
  /\*\*(?:Evaluation Criteria|معايير التقييم)\*\*/i,
  /^(?:Evaluation Criteria|معايير التقييم)/im,
];

function extractNumberedDeliveryLines(contentMarkdown: string): string[] {
  const lines: string[] = [];
  let inDelivery = false;

  for (const line of contentMarkdown.split("\n")) {
    const trimmed = line.trim();
    if (!inDelivery) {
      if (DELIVERY_SECTION_PATTERNS.some((re) => re.test(trimmed))) {
        inDelivery = true;
      } else {
        continue;
      }
    }
    if (EVALUATION_SECTION_PATTERNS.some((re) => re.test(trimmed))) break;
    if (!trimmed || trimmed.startsWith("|")) continue;

    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered?.[1]) {
      lines.push(numbered[1].trim());
      continue;
    }
    if (trimmed.startsWith("- ")) {
      lines.push(trimmed.slice(2).trim());
    }
  }

  return lines.filter((line) => line.length > 0);
}

function stripDeliveryBlockFromMarkdown(contentMarkdown: string): string {
  const lines = contentMarkdown.split("\n");
  const out: string[] = [];
  let inDelivery = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inDelivery && DELIVERY_SECTION_PATTERNS.some((re) => re.test(trimmed))) {
      inDelivery = true;
      continue;
    }
    if (inDelivery) {
      if (EVALUATION_SECTION_PATTERNS.some((re) => re.test(trimmed))) {
        inDelivery = false;
        out.push(line);
      }
      continue;
    }
    out.push(line);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Derive mission.delivery from localized markdown/bullets using canonical count. */
export function deriveMissionDelivery(
  section: LocalizedLessonSection,
  sourceSection: LocalizedLessonSection,
): string[] {
  const expectedCount = sourceSection.mission?.delivery?.length ?? 0;
  const existing = section.mission?.delivery ?? [];

  if (existing.length > 0 && (expectedCount === 0 || existing.length === expectedCount)) {
    return existing;
  }

  const fromMarkdown = extractNumberedDeliveryLines(section.contentMarkdown);
  if (fromMarkdown.length > 0) {
    if (expectedCount === 0 || fromMarkdown.length === expectedCount) {
      return fromMarkdown;
    }
    if (fromMarkdown.length > expectedCount && expectedCount > 0) {
      return fromMarkdown.slice(0, expectedCount);
    }
    return fromMarkdown;
  }

  const bullets = section.bullets.filter((b) => b.trim().length > 0);
  if (bullets.length > 0) {
    if (expectedCount === 0 || bullets.length === expectedCount) {
      return [...bullets];
    }
    if (expectedCount > 0 && bullets.length >= expectedCount) {
      return bullets.slice(0, expectedCount);
    }
    return bullets;
  }

  return existing;
}

export function repairMissionSection(
  section: LocalizedLessonSection,
  sourceSection: LocalizedLessonSection,
): LocalizedLessonSection {
  if (!section.mission) return section;

  const sourceDelivery = sourceSection.mission?.delivery ?? [];
  const localizedDelivery = deriveMissionDelivery(section, sourceSection);
  const shouldPopulateDelivery =
    section.mission.delivery.length === 0 &&
    localizedDelivery.length > 0 &&
    (sourceDelivery.length > 0 ||
      /(?:Submission|التسليم|\*\*Delivery\*\*)/i.test(section.contentMarkdown));

  if (!shouldPopulateDelivery) {
    return section;
  }

  // Additive only: populate mission.delivery without trimming visible learner text.
  return {
    ...section,
    mission: {
      ...section.mission,
      delivery: localizedDelivery,
    },
  };
}

export function sanitizeMarkdownArtifactsInString(text: string): string {
  return stripMalformedMarkdownPeriodArtifacts(text);
}

export function cleanQuizOptionText(text: string): string {
  let value = stripMalformedMarkdownPeriodArtifacts(text);
  value = stripQuizLabelPrefixes(stripBannedPhrasesFromText(value));
  return normalizeQuizOptionText(value);
}

export function cleanQuizLearnerText(text: string): string {
  let value = stripMalformedMarkdownPeriodArtifacts(text);
  if (hasQuizLabelPrefixLeak(value) || /^\(\s*\d+\)\s*:/.test(value.trim())) {
    value = stripQuizLabelPrefixes(value);
  }
  return value;
}

function shouldRealignQuizOptionsFromBullets(
  options: string[],
  bullets: string[],
  correctIndex: number,
): boolean {
  const cleanedBullets = bullets.map((bullet) => cleanQuizOptionText(bullet));
  const cleanedOptions = options.map((option) => cleanQuizOptionText(option));
  if (
    cleanedBullets.length !== cleanedOptions.length ||
    cleanedBullets.length < 2 ||
    correctIndex < 0 ||
    correctIndex >= cleanedOptions.length
  ) {
    return false;
  }

  if (
    hasPlaceholderQuizOptions(cleanedOptions) &&
    !hasPlaceholderQuizOptions(cleanedBullets)
  ) {
    return true;
  }

  const bulletAtCorrect = cleanedBullets[correctIndex]?.trim() ?? "";
  const optionAtCorrect = cleanedOptions[correctIndex]?.trim() ?? "";
  if (!bulletAtCorrect || !optionAtCorrect || bulletAtCorrect === optionAtCorrect) {
    return false;
  }

  if (
    PLACEHOLDER_OPTION_PATTERN.test(optionAtCorrect) &&
    !PLACEHOLDER_OPTION_PATTERN.test(bulletAtCorrect)
  ) {
    return true;
  }

  return cleanedBullets.every(
    (bullet, index) => bullet.trim().length > 0 && bullet === cleanedOptions[index],
  )
    ? false
    : !hasPlaceholderQuizOptions(cleanedBullets);
}

function repairQuizMechanicalArtifacts(
  section: LocalizedLessonSection,
): LocalizedLessonSection {
  if (section.role !== "Quiz" || !section.quiz) return section;

  const quiz = section.quiz;
  let options = (quiz.options ?? []).map((option) => cleanQuizOptionText(option));
  let bullets = section.bullets.map((bullet) => cleanQuizOptionText(bullet));
  const question = quiz.question ? cleanQuizLearnerText(quiz.question) : quiz.question;
  const explanation = quiz.explanation
    ? cleanQuizLearnerText(quiz.explanation)
    : quiz.explanation;
  const contentMarkdown = section.contentMarkdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (
        hasQuizOptionPrefixLeak(line) ||
        hasQuizCorrectAnswerPrefixLeak(line) ||
        /^\(\s*\d+\)\s*:/.test(trimmed) ||
        /^[-*]\s*\*{0,2}\s*الإجابة الصحيحة/i.test(trimmed)
      ) {
        return cleanQuizOptionText(line);
      }
      return cleanQuizLearnerText(line);
    })
    .join("\n");

  const alignedBullets =
    options.length > 0 && bullets.length === options.length
      ? options.map((option, index) => {
          const rawBullet = section.bullets[index] ?? "";
          const cleanedBullet = bullets[index]?.trim() ?? "";
          if (!cleanedBullet || cleanedBullet === option) return option;
          if (
            hasQuizLabelPrefixLeak(rawBullet) ||
            hasQuizCorrectAnswerPrefixLeak(rawBullet) ||
            /^\(\s*\d+\)\s*:/.test(rawBullet.trim())
          ) {
            return option;
          }
          return bullets[index] ?? option;
        })
      : bullets;

  const changed =
    JSON.stringify({ options, bullets: alignedBullets, question, explanation, contentMarkdown }) !==
    JSON.stringify({
      options: quiz.options,
      bullets: section.bullets,
      question: quiz.question,
      explanation: quiz.explanation,
      contentMarkdown: section.contentMarkdown,
    });

  if (!changed) return section;

  return {
    ...section,
    contentMarkdown,
    bullets: alignedBullets,
    quiz: { ...quiz, question, options, explanation, correctIndex: quiz.correctIndex },
  };
}

function sectionNeedsTableRepair(section: LocalizedLessonSection): boolean {
  return section.tables.some(
    (table, tableIndex) =>
      tableShapeErrors(table, `tables[${tableIndex}]`).length > 0,
  );
}

function sectionNeedsMissionRepair(
  section: LocalizedLessonSection,
  sourceSection: LocalizedLessonSection,
): boolean {
  if (!section.mission) return false;
  const sourceDelivery = sourceSection.mission?.delivery ?? [];
  if (sourceDelivery.length > 0 && section.mission.delivery.length === 0) return true;
  if (
    section.mission.delivery.length === 0 &&
    deriveMissionDelivery(section, sourceSection).length > 0 &&
    /(?:Submission|التسليم|\*\*Delivery\*\*|\*\*Delivery:\*\*)/i.test(
      section.contentMarkdown,
    )
  ) {
    return true;
  }
  return false;
}

function sectionNeedsQuizRepair(section: LocalizedLessonSection): boolean {
  if (section.role !== "Quiz" || !section.quiz) return false;
  const fields = [
    section.quiz.question ?? "",
    section.quiz.explanation ?? "",
    ...(section.quiz.options ?? []),
    ...section.bullets,
    section.contentMarkdown,
  ];
  return (
    hasPlaceholderQuizOptions(section.quiz.options ?? []) ||
    fields.some(
      (field) =>
        hasMalformedMarkdownPeriodArtifact(field) ||
        hasQuizLabelPrefixLeak(field) ||
        hasQuizOptionPrefixLeak(field) ||
        hasQuizCorrectAnswerPrefixLeak(field) ||
        /^\(\s*\d+\)\s*:/.test(field.trim()),
    )
  );
}

function sectionNeedsCorruptedQuizRepair(
  _sourceSection: LocalizedLessonSection,
  section: LocalizedLessonSection,
  _lessonId: string,
  locale: string,
): boolean {
  if (section.role !== "Quiz" || !section.quiz) return false;
  if ((locale as string) !== "ar-MSA") return false;
  return hasPlaceholderQuizOptions(section.quiz.options);
}

/** Insert only missing Quiz sections — never overwrite existing learner sections. */
export function reconstructMissingQuizSection(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
  options?: { msaRecoveredQuizSection?: LocalizedLessonSection | null },
): AdaptedLessonPackage {
  if (sectionRolesAlign(source, pkg)) return pkg;
  if (pkg.sections.some((section) => section.role === "Quiz")) return pkg;

  // ar-Gulf: never auto-insert ar-MSA or unverified quiz content without Gulf provenance.
  if (pkg.locale === "ar-Gulf") {
    return pkg;
  }

  const sourceSections = pairingSourceSections(source);
  const existingByRole = new Map(pkg.sections.map((section) => [section.role, section]));
  const sections: LocalizedLessonSection[] = [];

  for (const sourceSection of sourceSections) {
    if (
      isOptionalOmittedSection(sourceSection.role ?? "") &&
      !existingByRole.has(sourceSection.role)
    ) {
      continue;
    }

    const existing = existingByRole.get(sourceSection.role);
    if (existing) {
      sections.push(existing);
      continue;
    }

    if (sourceSection.role === "Quiz") {
      const recoveredQuiz = options?.msaRecoveredQuizSection;
      if (!recoveredQuiz?.quiz) {
        throw new Error(
          `${pkg.locale}/${pkg.lessonId}: missing Quiz section and no Phase 13B ar-MSA recovered quiz to insert`,
        );
      }
      sections.push(structuredClone(recoveredQuiz));
      continue;
    }
  }

  if (sections.length === pkg.sections.length) return pkg;
  return { ...pkg, sections };
}

export function packageNeedsRepair(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
): boolean {
  if (!sectionRolesAlign(source, pkg)) {
    if (!isKnownBlockedMissingGulfQuizPackage(pkg, source)) {
      return true;
    }
  }
  if (
    auditRecoveredPackage(source, pkg).some(
      (issue) =>
        issue.severity === "error" && issue.kind !== "blocked_missing_gulf_quiz",
    )
  ) {
    return true;
  }

  try {
    const pairs = pairSections(source, pkg);
    for (const { source: sourceSection, adapted } of pairs) {
      if (sectionNeedsTableRepair(adapted)) return true;
      if (
        adapted.role === "Mission" &&
        adapted.mission &&
        sectionNeedsMissionRepair(adapted, sourceSection)
      ) {
        return true;
      }
      if (adapted.role === "Quiz" && adapted.quiz && sectionNeedsQuizRepair(adapted)) {
        return true;
      }
      if (adapted.role === "Quiz" && adapted.quiz && detectQuizBulletsOptionsMismatch(adapted)) {
        return true;
      }
      if (
        adapted.role === "Quiz" &&
        adapted.quiz &&
        sectionNeedsCorruptedQuizRepair(sourceSection, adapted, pkg.lessonId, pkg.locale)
      ) {
        return true;
      }
    }
  } catch {
    return true;
  }

  return false;
}

function detectMissionTextTrimming(adapted: LocalizedLessonSection): string | null {
  if (adapted.role !== "Mission" || !adapted.mission?.delivery.length) return null;
  const markdown = adapted.contentMarkdown;
  const hasSubmission = /(?:Submission|التسليم|\*\*Delivery\*\*|^Delivery:)/im.test(
    markdown,
  );
  const hasEvaluation = /(?:Evaluation Criteria|معايير التقييم)/i.test(markdown);
  const hasRubricTable =
    /\|\s*(?:البعد|Dimension)\s*\|/i.test(markdown) ||
    (adapted.tables?.some((table) =>
      table.headers.some((header) =>
        /^(?:البعد|Dimension|الوزن|Weight|المعيار|Criteria)$/i.test(header.trim()),
      ),
    ) ??
      false);
  if (!hasSubmission && !hasEvaluation && !hasRubricTable) {
    return "mission delivery populated but submission/evaluation learner text missing from contentMarkdown";
  }
  return null;
}

function detectQuizBulletsOptionsMismatch(section: LocalizedLessonSection): string | null {
  if (section.role !== "Quiz" || !section.quiz) return null;
  const options = (section.quiz.options ?? []).map((option) => cleanQuizOptionText(option));
  const bullets = section.bullets
    .slice(0, options.length)
    .map((bullet) => cleanQuizOptionText(bullet));
  const correctIndex = section.quiz.correctIndex ?? 0;
  if (
    options.length === 0 ||
    bullets.length !== options.length ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return null;
  }
  const bulletAtCorrect = bullets[correctIndex]?.trim() ?? "";
  const optionAtCorrect = options[correctIndex]?.trim() ?? "";
  if (bulletAtCorrect && optionAtCorrect && bulletAtCorrect !== optionAtCorrect) {
    return `quiz correctIndex ${correctIndex} bullet vs option mismatch after normalize`;
  }
  return null;
}

function detectForbiddenQuizFallbacks(
  locale: string,
  section: LocalizedLessonSection,
): string[] {
  if (section.role !== "Quiz" || !section.quiz) return [];
  const messages: string[] = [];
  const explanation = section.quiz.explanation?.trim() ?? "";

  if (locale === "ar-Gulf" && EGYPTIAN_QUIZ_EXPLANATION_FALLBACK.test(explanation)) {
    messages.push("explanation contains Egyptian production fallback prose");
  }
  if (locale === "ar-Gulf" && EGYPTIAN_QUIZ_EXPLANATION_FALLBACK.test(section.contentMarkdown)) {
    messages.push("Gulf package contains Egyptian production fallback prose in quiz markdown");
  }
  if (TRUNCATED_QUIZ_EXPLANATION_ARTIFACT.test(explanation)) {
    messages.push("truncated quiz explanation artifact from banned-phrase stripping");
  }
  return messages;
}

function detectInternalQuizLabelLeaks(section: LocalizedLessonSection): string[] {
  if (section.role !== "Quiz" || !section.quiz) return [];
  const messages: string[] = [];
  const fields = [
    ...(section.quiz.options ?? []),
    ...section.bullets,
    section.quiz.question ?? "",
    section.contentMarkdown,
  ];
  for (const field of fields) {
    if (/^\(\s*\d+\)\s*:/.test(field.trim())) {
      messages.push("internal ( N): quiz label leak");
      break;
    }
  }
  return messages;
}

export function auditRecoveredPackage(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
): Phase13BAuditIssue[] {
  const issues: Phase13BAuditIssue[] = [];
  const { locale, lessonId } = pkg;
  const prefix = `${locale}/${lessonId}`;

  if (isKnownBlockedMissingGulfQuizPackage(pkg, source)) {
    issues.push({
      locale,
      lessonId,
      path: "sections/Quiz",
      kind: "blocked_missing_gulf_quiz",
      message:
        "Gulf Quiz collapsed — no verified Phase 13B Gulf quiz provenance (merge blocked)",
      severity: "error",
    });
  }

  const structuralKeys = [
    "lessonId",
    "canonicalVersion",
    "pathId",
    "moduleId",
    "productionRoute",
    "nextLessonId",
    "estimatedMinutes",
  ] as const;

  for (const key of structuralKeys) {
    if (source[key] !== pkg[key]) {
      issues.push({
        locale,
        lessonId,
        path: key,
        kind: "structural_parity",
        message: `${key}: source=${String(source[key])} localized=${String(pkg[key])}`,
        severity: "error",
      });
    }
  }

  let pairs: Array<{ source: LocalizedLessonSection; adapted: LocalizedLessonSection }>;
  try {
    pairs = pairSections(source, pkg);
  } catch (error) {
    issues.push({
      locale,
      lessonId,
      path: "sections",
      kind: "section_parity",
      message: error instanceof Error ? error.message : String(error),
      severity: "error",
    });
    return issues;
  }

  if (!sectionRolesAlign(source, pkg)) {
    if (!isKnownBlockedMissingGulfQuizPackage(pkg, source)) {
      issues.push({
        locale,
        lessonId,
        path: "sections",
        kind: "section_parity",
        message: "section role sequence does not align with canonical source",
        severity: "error",
      });
    }
  }

  for (const { source: sourceSection, adapted } of pairs) {
    const sectionPath = `sections[${adapted.role}]`;

    if (sourceSection.role !== adapted.role) {
      issues.push({
        locale,
        lessonId,
        path: sectionPath,
        kind: "section_parity",
        message: `role mismatch ${adapted.role} vs ${sourceSection.role}`,
        severity: "error",
      });
    }

    adapted.tables.forEach((table, tableIndex) => {
      const basePath = `${sectionPath}.tables[${tableIndex}]`;
      for (const err of tableShapeErrors(table, basePath)) {
        issues.push({
          locale,
          lessonId,
          path: basePath,
          kind: "table_shape",
          message: err,
          severity: "error",
        });
      }

      const parsed = parseMarkdownTables(adapted.contentMarkdown)[tableIndex];
      if (parsed && table.rows.length === parsed.rows.length) {
        table.rows.forEach((row, rowIndex) => {
          if (row.length !== table.headers.length && parsed.rows[rowIndex]?.length === table.headers.length) {
            issues.push({
              locale,
              lessonId,
              path: `${basePath}.rows[${rowIndex}]`,
              kind: "table_markdown_mismatch",
              message: "structured row disagrees with contentMarkdown table",
              severity: "error",
            });
          }
        });
      }
    });

    if (adapted.role === "Quiz" && adapted.quiz) {
      const resolved = resolveSourceQuizStructure(sourceSection, lessonId);
      const quizPath = `${sectionPath}.quiz`;

      if (!resolved.ok) {
        issues.push({
          locale,
          lessonId,
          path: quizPath,
          kind: "quiz_structure",
          message: resolved.issues.join("; "),
          severity: "error",
        });
      } else {
        const { structure } = resolved;
        if (
          adapted.quiz.options.length !== structure.optionCount &&
          !shouldSkipCanonicalQuizIndexParity(adapted)
        ) {
          issues.push({
            locale,
            lessonId,
            path: `${quizPath}.options`,
            kind: "quiz_structure",
            message: `option count ${adapted.quiz.options.length} vs ${structure.optionCount}`,
            severity: "error",
          });
        }
        if (
          adapted.quiz.correctIndex !== structure.correctIndex &&
          !shouldSkipCanonicalQuizIndexParity(adapted)
        ) {
          issues.push({
            locale,
            lessonId,
            path: `${quizPath}.correctIndex`,
            kind: "quiz_structure",
            message: `correctIndex ${adapted.quiz.correctIndex} vs ${structure.correctIndex}`,
            severity: "error",
          });
        }
        if (!adapted.quiz.question?.trim()) {
          issues.push({
            locale,
            lessonId,
            path: `${quizPath}.question`,
            kind: "quiz_structure",
            message: "empty question",
            severity: "error",
          });
        }
        if (sourceSection.quiz?.explanation?.trim() && !adapted.quiz.explanation?.trim()) {
          issues.push({
            locale,
            lessonId,
            path: `${quizPath}.explanation`,
            kind: "quiz_structure",
            message: "missing explanation where source has one",
            severity: "error",
          });
        }
      }

      adapted.quiz.options.forEach((option, index) => {
        if (hasQuizLabelPrefixLeak(option)) {
          issues.push({
            locale,
            lessonId,
            path: `${quizPath}.options[${index}]`,
            kind: "quiz_prefix",
            message: "quiz option prefix leakage",
            severity: "error",
          });
        }
        if (hasMalformedMarkdownPeriodArtifact(option)) {
          issues.push({
            locale,
            lessonId,
            path: `${quizPath}.options[${index}]`,
            kind: "quiz_markdown_artifact",
            message: "malformed **.** artifact",
            severity: "error",
          });
        }
      });

      for (const field of [
        adapted.quiz.question ?? "",
        adapted.quiz.explanation ?? "",
        ...adapted.bullets,
        adapted.contentMarkdown,
      ]) {
        if (hasMalformedMarkdownPeriodArtifact(field)) {
          issues.push({
            locale,
            lessonId,
            path: quizPath,
            kind: "quiz_markdown_artifact",
            message: "malformed **.** artifact in quiz section text",
            severity: "error",
          });
          break;
        }
      }

      for (const message of detectForbiddenQuizFallbacks(locale, adapted)) {
        issues.push({
          locale,
          lessonId,
          path: quizPath,
          kind: "quiz_forbidden_fallback",
          message,
          severity: "error",
        });
      }

      const bulletsMismatch = detectQuizBulletsOptionsMismatch(adapted);
      if (bulletsMismatch) {
        issues.push({
          locale,
          lessonId,
          path: `${quizPath}.options`,
          kind: "quiz_structure",
          message: bulletsMismatch,
          severity: "error",
        });
      }

      for (const message of detectInternalQuizLabelLeaks(adapted)) {
        issues.push({
          locale,
          lessonId,
          path: quizPath,
          kind: "quiz_prefix",
          message,
          severity: "error",
        });
      }
    }

    if (adapted.mission) {
      const sourceMission = sourceSection.mission;
      const missionPath = `${sectionPath}.mission`;

      if (sourceMission && !adapted.mission) {
        issues.push({
          locale,
          lessonId,
          path: missionPath,
          kind: "mission_parity",
          message: "source mission present but localized mission missing",
          severity: "error",
        });
      }

      if (sourceMission?.delivery?.length && adapted.mission.delivery.length === 0) {
        issues.push({
          locale,
          lessonId,
          path: `${missionPath}.delivery`,
          kind: "mission_delivery",
          message: `empty delivery; source has ${sourceMission.delivery.length} items`,
          severity: "error",
        });
      }

      if (
        sourceMission?.delivery?.length &&
        adapted.mission.delivery.length > 0 &&
        adapted.mission.delivery.length !== sourceMission.delivery.length
      ) {
        issues.push({
          locale,
          lessonId,
          path: `${missionPath}.delivery`,
          kind: "mission_delivery",
          message: `delivery count ${adapted.mission.delivery.length} vs source ${sourceMission.delivery.length}`,
          severity: "error",
        });
      }

      const srcRubric = sourceMission?.rubric ?? [];
      const locRubric = adapted.mission.rubric ?? [];
      if (srcRubric.length !== locRubric.length) {
        issues.push({
          locale,
          lessonId,
          path: `${missionPath}.rubric`,
          kind: "mission_parity",
          message: `rubric row count ${locRubric.length} vs ${srcRubric.length}`,
          severity: "error",
        });
      }
      srcRubric.forEach((row, index) => {
        if (locRubric[index]?.weight !== row.weight) {
          issues.push({
            locale,
            lessonId,
            path: `${missionPath}.rubric[${index}].weight`,
            kind: "mission_parity",
            message: `weight ${locRubric[index]?.weight} vs ${row.weight}`,
            severity: "error",
          });
        }
      });

      const weightSum = locRubric.reduce((sum, row) => sum + row.weight, 0);
      if (locRubric.length > 0 && weightSum !== 100) {
        issues.push({
          locale,
          lessonId,
          path: `${missionPath}.rubric`,
          kind: "mission_parity",
          message: `rubric weights sum to ${weightSum}, expected 100`,
          severity: "error",
        });
      }

      if (sourceMission?.intro && !adapted.mission.intro?.trim()) {
        issues.push({
          locale,
          lessonId,
          path: `${missionPath}.intro`,
          kind: "mission_parity",
          message: "missing intro where source has one",
          severity: "error",
        });
      }
      if (sourceMission?.yamlIntent && !adapted.mission.yamlIntent?.trim()) {
        issues.push({
          locale,
          lessonId,
          path: `${missionPath}.yamlIntent`,
          kind: "mission_parity",
          message: "missing yamlIntent",
          severity: "error",
        });
      }
      if (sourceMission?.yamlType && !adapted.mission.yamlType?.trim()) {
        issues.push({
          locale,
          lessonId,
          path: `${missionPath}.yamlType`,
          kind: "mission_parity",
          message: "missing yamlType",
          severity: "error",
        });
      }

      const missionTrim = detectMissionTextTrimming(adapted);
      if (missionTrim) {
        issues.push({
          locale,
          lessonId,
          path: `${sectionPath}.contentMarkdown`,
          kind: "mission_text_trim",
          message: missionTrim,
          severity: "error",
        });
      }

    }
  }

  return issues;
}

export function repairRecoveredPackage(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
  options?: { msaRecoveredQuizSection?: LocalizedLessonSection | null },
): AdaptedLessonPackage {
  let working = reconstructMissingQuizSection(source, pkg, options);
  const pairs = pairSections(source, working);
  const sourceSections = pairingSourceSections(source);

  const repairedFromPairs = pairs.map(({ source: sourceSection, adapted }) => {
    let section = adapted;

    if (sectionNeedsTableRepair(section)) {
      section = repairTablesInSection(section);
    }

    if (section.role === "Mission" && section.mission && sectionNeedsMissionRepair(section, sourceSection)) {
      section = repairMissionSection(section, sourceSection);
    }

    if (section.role === "Quiz" && section.quiz) {
      if (sectionNeedsQuizRepair(section)) {
        section = repairQuizMechanicalArtifacts(section);
      }
      if (
        sectionNeedsCorruptedQuizRepair(sourceSection, section, pkg.lessonId, pkg.locale)
      ) {
        section = repairArMsaQuizSection(sourceSection, section, pkg.lessonId);
      }
    }

    return section;
  });

  const mergedSections: LocalizedLessonSection[] = [];
  let pairIndex = 0;
  for (const section of working.sections) {
    if (adaptedOptionalIntentOnly(section.role ?? "", sourceSections)) {
      mergedSections.push(section);
      continue;
    }
    mergedSections.push(repairedFromPairs[pairIndex]!);
    pairIndex++;
  }

  return { ...working, sections: mergedSections };
}

export function summarizeAuditIssues(issues: Phase13BAuditIssue[]): Phase13BAuditResult["byKind"] {
  const byKind = {
    table_shape: 0,
    table_markdown_mismatch: 0,
    mission_delivery: 0,
    mission_parity: 0,
    mission_text_trim: 0,
    quiz_prefix: 0,
    quiz_markdown_artifact: 0,
    quiz_structure: 0,
    quiz_forbidden_fallback: 0,
    section_parity: 0,
    structural_parity: 0,
    blocked_missing_gulf_quiz: 0,
  } satisfies Record<Phase13BAuditIssue["kind"], number>;

  for (const issue of issues) {
    byKind[issue.kind]++;
  }
  return byKind;
}

export function buildValidationSummary(input: {
  perLocaleCounts: Record<string, number>;
  issues: Phase13BAuditIssue[];
  missingIds: string[];
  retryCells: { locale: string; lessonId: string }[];
  jsonParseErrors: number;
}): Phase13BValidationSummary {
  const errors = input.issues.filter((i) => i.severity === "error");
  const validationErrors = errors.map((e) => `${e.locale}/${e.lessonId}: ${e.path} — ${e.message}`);

  const tableShapeErrors = errors.filter((e) =>
    e.kind === "table_shape" || e.kind === "table_markdown_mismatch",
  ).length;
  const missionParityErrors = errors.filter((e) =>
    e.kind === "mission_delivery" ||
    e.kind === "mission_parity" ||
    e.kind === "mission_text_trim",
  ).length;
  const quizStructuralErrors = errors.filter((e) =>
    e.kind === "quiz_structure" || e.kind === "quiz_forbidden_fallback",
  ).length;
  const quizPrefixFormatErrors = errors.filter((e) =>
    e.kind === "quiz_prefix" || e.kind === "quiz_markdown_artifact",
  ).length;
  const sectionParityErrors = errors.filter((e) =>
    e.kind === "section_parity" || e.kind === "structural_parity",
  ).length;
  const blockedMissingGulfQuiz = [
    ...new Set(
      errors
        .filter((e) => e.kind === "blocked_missing_gulf_quiz")
        .map((e) => `${e.locale}/${e.lessonId}`),
    ),
  ];

  const total =
    (input.perLocaleCounts["ar-MSA"] ?? 0) +
    (input.perLocaleCounts["ar-Gulf"] ?? 0) +
    (input.perLocaleCounts.en ?? 0);

  const mergeBlocked = blockedMissingGulfQuiz.length > 0;

  const ok =
    input.jsonParseErrors === 0 &&
    tableShapeErrors === 0 &&
    missionParityErrors === 0 &&
    quizStructuralErrors === 0 &&
    quizPrefixFormatErrors === 0 &&
    sectionParityErrors === 0 &&
    validationErrors.length === 0 &&
    input.missingIds.length === 0 &&
    input.retryCells.length === 0 &&
    !mergeBlocked;

  return {
    arMsa: input.perLocaleCounts["ar-MSA"] ?? 0,
    arGulf: input.perLocaleCounts["ar-Gulf"] ?? 0,
    en: input.perLocaleCounts.en ?? 0,
    total,
    jsonParseErrors: input.jsonParseErrors,
    tableShapeErrors,
    missionParityErrors,
    quizStructuralErrors,
    quizPrefixFormatErrors,
    sectionParityErrors,
    blockedMissingGulfQuiz,
    validationErrors,
    missingIds: input.missingIds,
    retryCells: input.retryCells,
    complete: total === 300,
    ok,
    mergeBlocked,
  };
}
