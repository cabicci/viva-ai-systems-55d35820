/**
 * Final learner-facing sanitizer for fragment-pilot lesson packages.
 *
 * Pure function. Removes internal production-only sections (Bunny / video
 * reference notes), strips quiz-prefix leaks ("Option N:", "خيار ١:",
 * "Correct answer (Option N):", "الإجابة الصحيحة (خيار ٢):"), and balances
 * inline markdown markers (** and «») in every string field including
 * table cells.
 *
 * Used by the collect-fragment-pilot script BEFORE writing the final
 * combined bundle. The result is then re-read from disk and re-validated
 * by validate-final-lesson-package.ts.
 */
import type {
  LocalizedLessonPackage,
  LocalizedLessonSection,
  LocalizedLessonTable,
  LocalizedLessonQuiz,
} from "../../../src/lib/locale-lessons/types.ts";

/** Substrings that prove a production/internal leak survived adaptation. */
export const PRODUCTION_LEAK_SUBSTRINGS = [
  "Video block (production reference only)",
  "Bunny",
  "لا يُعاد توليده",
  "في الإنتاج",
] as const;

/** Regexes that strip leaked quiz-option prefixes from a single line. */
const QUIZ_PREFIX_PATTERNS: RegExp[] = [
  // English
  /^\s*\*{0,2}\s*Correct answer\s*\(Option\s*\d+\)\s*:\s*\*{0,2}\s*/i,
  /^\s*\*{0,2}\s*Option\s*\d+\s*:\s*\*{0,2}\s*/i,
  /^\s*-\s*\*{0,2}\s*Option\s*\d+\s*:\s*\*{0,2}\s*/i,
  /^\s*-\s*\*{0,2}\s*Correct answer\s*\(Option\s*\d+\)\s*:\s*\*{0,2}\s*/i,
  // Arabic (Arabic-Indic + ASCII digits)
  /^\s*\*{0,2}\s*الإجابة الصحيحة\s*\(\s*(?:ال)?خيار\s*[\u0660-\u0669\u06F0-\u06F90-9]+\s*\)\s*:\s*\*{0,2}\s*/u,
  /^\s*\*{0,2}\s*(?:ال)?خيار\s*[\u0660-\u0669\u06F0-\u06F90-9]+\s*:\s*\*{0,2}\s*/u,
  /^\s*-\s*\*{0,2}\s*(?:ال)?خيار\s*[\u0660-\u0669\u06F0-\u06F90-9]+\s*:\s*\*{0,2}\s*/u,
  /^\s*-\s*\*{0,2}\s*الإجابة الصحيحة\s*\(\s*(?:ال)?خيار\s*[\u0660-\u0669\u06F0-\u06F90-9]+\s*\)\s*:\s*\*{0,2}\s*/u,
];

export function stripQuizPrefix(line: string): string {
  let out = line;
  // Apply repeatedly — handles "- **Option 2:** ..." patterns.
  for (let i = 0; i < 4; i++) {
    let changed = false;
    for (const re of QUIZ_PREFIX_PATTERNS) {
      const next = out.replace(re, "");
      if (next !== out) {
        out = next;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return out;
}

/** Balance ** markers in a single string by appending one ** when odd. */
export function balanceBoldMarkers(text: string): string {
  const count = (text.match(/\*\*/g) ?? []).length;
  if (count % 2 === 0) return text;
  return `${text}**`;
}

/** Balance « » pairs by appending closing » when more « than ». */
export function balanceGuillemets(text: string): string {
  const open = (text.match(/«/g) ?? []).length;
  const close = (text.match(/»/g) ?? []).length;
  if (open <= close) return text;
  return text + "»".repeat(open - close);
}

export function sanitizeString(text: string): string {
  return balanceGuillemets(balanceBoldMarkers(text));
}

function sanitizeMultilineMarkdown(md: string): string {
  const lines = md.split("\n").map((line) => sanitizeString(stripQuizPrefix(line)));
  return lines.join("\n");
}

function sanitizeTable(table: LocalizedLessonTable): LocalizedLessonTable {
  return {
    headers: table.headers.map((cell) => sanitizeString(stripQuizPrefix(cell))),
    rows: table.rows.map((row) =>
      row.map((cell) => sanitizeString(stripQuizPrefix(cell))),
    ),
  };
}

function sanitizeQuiz(quiz: LocalizedLessonQuiz): LocalizedLessonQuiz {
  return {
    ...quiz,
    question: quiz.question ? sanitizeString(quiz.question) : quiz.question,
    options: quiz.options.map((opt) => sanitizeString(stripQuizPrefix(opt))),
    explanation: quiz.explanation
      ? sanitizeString(quiz.explanation)
      : quiz.explanation,
  };
}

function isProductionReferenceSection(section: LocalizedLessonSection): boolean {
  const hay = `${section.role}\n${section.heading}\n${section.subtitle ?? ""}\n${section.contentMarkdown}`;
  return PRODUCTION_LEAK_SUBSTRINGS.some((needle) => hay.includes(needle));
}

function sanitizeSection(section: LocalizedLessonSection): LocalizedLessonSection {
  const next: LocalizedLessonSection = {
    ...section,
    heading: sanitizeString(section.heading),
    subtitle: section.subtitle ? sanitizeString(section.subtitle) : section.subtitle,
    contentMarkdown: sanitizeMultilineMarkdown(section.contentMarkdown),
    bullets: section.bullets.map((b) => sanitizeString(stripQuizPrefix(b))),
    tables: section.tables.map(sanitizeTable),
  };
  if (section.quiz) next.quiz = sanitizeQuiz(section.quiz);
  return next;
}

export function sanitizeFinalLessonPackage<
  T extends Pick<LocalizedLessonPackage, "sections"> & Record<string, unknown>,
>(pkg: T): T {
  const kept = pkg.sections.filter((s) => !isProductionReferenceSection(s));
  const sanitized = kept.map(sanitizeSection);
  return { ...pkg, sections: sanitized };
}
