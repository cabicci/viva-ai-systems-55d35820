/**
 * Phase 13B merge-readiness audit + deterministic repair for recovered packages.
 *
 * Pure functions — no AI, no OpenAI, no publish, no runtime locale merge.
 * Structural source of truth: ar-MSA canonical lessons (read-only).
 * Localized text source: recovered package contentMarkdown / bullets / options.
 */
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
  LocalizedLessonSection,
  LocalizedLessonTable,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  hasQuizCorrectAnswerPrefixLeak,
  hasQuizOptionPrefixLeak,
  isInternalProductionReferenceSection,
  repairQuizSection,
  sanitizeAdaptedLessonMarkdown,
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

export const PHASE13B_RECOVERED_LOCALES = ["ar-MSA", "ar-Gulf", "en"] as const;
export type Phase13BRecoveredLocale = (typeof PHASE13B_RECOVERED_LOCALES)[number];

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
    | "quiz_prefix"
    | "quiz_markdown_artifact"
    | "quiz_structure"
    | "section_parity"
    | "structural_parity";
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
  validationErrors: string[];
  missingIds: string[];
  retryCells: { locale: string; lessonId: string }[];
  complete: boolean;
  ok: boolean;
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

  const resolved = resolveSourceQuizStructure(sourceSection, lessonId);
  if (!resolved.ok) return section;

  const adaptedOptions = (section.quiz.options ?? []).map((option) =>
    normalizeQuizOptionText(stripBannedPhrasesFromText(option)),
  );

  const locked = lockQuizOptionsToSourceStructure(
    resolved.structure,
    adaptedOptions,
    adaptedOptions,
  );

  let options = locked.options;
  let question = stripBannedPhrasesFromText(section.quiz.question ?? "");
  let explanation = stripBannedPhrasesFromText(section.quiz.explanation ?? "");
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
    if (!question.trim()) question = fallback.question;
    if (!explanation.trim()) explanation = fallback.explanation;
  }

  return {
    ...section,
    contentMarkdown: sanitizeMarkdownArtifactsInString(section.contentMarkdown),
    bullets: section.bullets.map((b) => normalizeQuizOptionText(stripBannedPhrasesFromText(b))),
    quiz: {
      ...section.quiz,
      question,
      options,
      explanation,
      correctIndex: resolved.structure.correctIndex,
    },
  };
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

export function sectionRolesAlign(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
): boolean {
  const sourceSections = pairingSourceSections(source);
  let sourceIndex = 0;

  for (const adapted of pkg.sections) {
    while (
      sourceIndex < sourceSections.length &&
      sourceSections[sourceIndex].role !== adapted.role
    ) {
      if (!isOptionalOmittedSection(sourceSections[sourceIndex].role ?? "")) {
        return false;
      }
      sourceIndex++;
    }
    if (sourceIndex >= sourceSections.length) return false;
    sourceIndex++;
  }

  while (sourceIndex < sourceSections.length) {
    if (!isOptionalOmittedSection(sourceSections[sourceIndex].role ?? "")) {
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
    while (
      sourceIndex < sourceSections.length &&
      sourceSections[sourceIndex].role !== adaptedSection.role
    ) {
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
  for (const pattern of QUIZ_LABEL_PREFIX_PATTERNS) {
    value = value.replace(pattern, "").trim();
  }
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

  const delivery = localizedDelivery;

  let contentMarkdown = section.contentMarkdown;
  let bullets = section.bullets;

  if (delivery.length > 0) {
    contentMarkdown = stripDeliveryBlockFromMarkdown(contentMarkdown);
    if (
      bullets.length > 0 &&
      bullets.length === delivery.length &&
      bullets.every((b, i) => b.trim() === delivery[i]?.trim())
    ) {
      bullets = [];
    }
  }

  return {
    ...section,
    contentMarkdown,
    bullets,
    mission: {
      ...section.mission,
      delivery,
    },
  };
}

export function sanitizeMarkdownArtifactsInString(text: string): string {
  return stripMalformedMarkdownPeriodArtifacts(text);
}

function sanitizeArtifactsInSection(section: LocalizedLessonSection): LocalizedLessonSection {
  const mapStr = (s: string) => sanitizeMarkdownArtifactsInString(s);
  return {
    ...section,
    heading: mapStr(section.heading),
    subtitle: section.subtitle ? mapStr(section.subtitle) : section.subtitle,
    contentMarkdown: mapStr(section.contentMarkdown),
    bullets: section.bullets.map(mapStr),
    tables: section.tables.map((table) => ({
      ...table,
      headers: table.headers.map(mapStr),
      rows: table.rows.map((row) => row.map(mapStr)),
    })),
    quiz: section.quiz
      ? {
          ...section.quiz,
          question: section.quiz.question ? mapStr(section.quiz.question) : section.quiz.question,
          options: (section.quiz.options ?? []).map((opt) =>
            stripQuizLabelPrefixes(mapStr(opt)),
          ),
          explanation: section.quiz.explanation
            ? mapStr(section.quiz.explanation)
            : section.quiz.explanation,
        }
      : section.quiz,
    mission: section.mission
      ? {
          ...section.mission,
          intro: section.mission.intro ? mapStr(section.mission.intro) : section.mission.intro,
          delivery: (section.mission.delivery ?? []).map(mapStr),
          rubric: (section.mission.rubric ?? []).map((row) => ({
            ...row,
            dimension: mapStr(row.dimension),
            criteria: mapStr(row.criteria),
          })),
        }
      : section.mission,
  };
}

export function auditRecoveredPackage(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
): Phase13BAuditIssue[] {
  const issues: Phase13BAuditIssue[] = [];
  const { locale, lessonId } = pkg;
  const prefix = `${locale}/${lessonId}`;

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
    issues.push({
      locale,
      lessonId,
      path: "sections",
      kind: "section_parity",
      message: "section role sequence does not align with canonical source",
      severity: "error",
    });
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
        if (adapted.quiz.options.length !== structure.optionCount) {
          issues.push({
            locale,
            lessonId,
            path: `${quizPath}.options`,
            kind: "quiz_structure",
            message: `option count ${adapted.quiz.options.length} vs ${structure.optionCount}`,
            severity: "error",
          });
        }
        if (adapted.quiz.correctIndex !== structure.correctIndex) {
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

    }
  }

  return issues;
}

export function repairRecoveredPackage(
  source: LocalizedLessonPackage,
  pkg: AdaptedLessonPackage,
): AdaptedLessonPackage {
  const locale = pkg.locale as AdaptationTargetLocale;
  const pairs = pairSections(source, pkg);

  const repairedSections = pairs.map(({ source: sourceSection, adapted }) => {
    let section = repairTablesInSection(adapted);
    section = sanitizeArtifactsInSection(section);
    if (section.role === "Mission" && section.mission) {
      section = repairMissionSection(section, sourceSection);
    }
    if (section.role === "Quiz" && section.quiz) {
      section =
        (pkg.locale as string) === "ar-MSA"
          ? repairArMsaQuizSection(sourceSection, section, pkg.lessonId)
          : repairQuizSection(sourceSection, section, pkg.lessonId, locale);
      section = {
        ...section,
        bullets: section.bullets.map((bullet) => stripQuizLabelPrefixes(bullet)),
        quiz: {
          ...section.quiz!,
          options: section.quiz!.options.map((option) => stripQuizLabelPrefixes(option)),
        },
      };
    }
    return section;
  });

  return sanitizeAdaptedLessonMarkdown({
    ...pkg,
    sections: repairedSections,
  });
}

export function summarizeAuditIssues(issues: Phase13BAuditIssue[]): Phase13BAuditResult["byKind"] {
  const byKind = {
    table_shape: 0,
    table_markdown_mismatch: 0,
    mission_delivery: 0,
    mission_parity: 0,
    quiz_prefix: 0,
    quiz_markdown_artifact: 0,
    quiz_structure: 0,
    section_parity: 0,
    structural_parity: 0,
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
    e.kind === "mission_delivery" || e.kind === "mission_parity",
  ).length;
  const quizStructuralErrors = errors.filter((e) => e.kind === "quiz_structure").length;
  const quizPrefixFormatErrors = errors.filter((e) =>
    e.kind === "quiz_prefix" || e.kind === "quiz_markdown_artifact",
  ).length;
  const sectionParityErrors = errors.filter((e) =>
    e.kind === "section_parity" || e.kind === "structural_parity",
  ).length;

  const total =
    (input.perLocaleCounts["ar-MSA"] ?? 0) +
    (input.perLocaleCounts["ar-Gulf"] ?? 0) +
    (input.perLocaleCounts.en ?? 0);

  const ok =
    input.jsonParseErrors === 0 &&
    tableShapeErrors === 0 &&
    missionParityErrors === 0 &&
    quizStructuralErrors === 0 &&
    quizPrefixFormatErrors === 0 &&
    sectionParityErrors === 0 &&
    validationErrors.length === 0 &&
    input.missingIds.length === 0 &&
    input.retryCells.length === 0;

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
    validationErrors,
    missingIds: input.missingIds,
    retryCells: input.retryCells,
    complete: total === 300,
    ok,
  };
}
