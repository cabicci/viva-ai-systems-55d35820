import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  detectQuizStructureDriftWarnings,
  lockQuizOptionsToSourceStructure,
  resolveSourceQuizStructure,
  applyDeterministicQuizFallback,
  classifyQuizOptionIdentity,
  getCanonicalOptionIdentities,
  optionsPreserveCanonicalIdentity,
} from "./quiz-structure.ts";

export interface AdaptedLessonValidationResult {
  errors: string[];
  warnings: string[];
}

const QUIZ_LEAK_PATTERNS: RegExp[] = [
  /correctIndex\s*:\s*\d+/i,
  /\bQuiz key\b/i,
  /\banswer key\b/i,
  /\(\s*unchanged\s*\)\s*:/i,
  /\*\*Correct answer\s*\(\s*correctIndex/i,
];

const BANNED_LEARNER_PHRASE_PATTERNS: RegExp[] = [
  /preserved from (the )?egyptian production/i,
  /refer to the text above/i,
  /refer to the source/i,
  /correctIndex\s*[:=]/i,
  /الإجابة الصحيحة محفوظة من الإنتاج المصري/,
  /راجع النص أعلاه/,
  /راجع المصدر/,
  /egyptian production/i,
  /الإنتاج المصري/,
  /original visual in (egyptian )?production/i,
  /الأصل البصري في الإنتاج/,
  /the original visual in/i,
  /not regenerated/i,
  /not render/i,
  /لا يُعاد توليد/,
  /production reference/i,
  /in production:/i,
  /في الإنتاج:/,
  /\bbunny\b/i,
  /production remains unchanged/i,
  /from (the )?production/i,
  /from production/i,
  /visual original/i,
  /معايير التقييم.*من الإنتاج/,
  /من الإنتاج — الأوزان/,
  /الأوزان غير متغيرة/,
];

const INTERNAL_PRODUCTION_LINE_PATTERNS: RegExp[] = [
  /^>\s*.*في الإنتاج:/,
  /^>\s*.*in production:/i,
  /^>\s*.*production note:/i,
  /\(الأصل البصري في الإنتاج[^)]*\)/,
  /\(the original visual in[^)]*production[^)]*\)/i,
  /\(original visual asset from egyptian production[^)]*\)/i,
  /\(الأصل البصري في الإنتاج المصري[^)]*\)/,
  /\(معايير التقييم \(من الإنتاج[^)]*\)/,
  /\(.*production remains unchanged[^)]*\)/i,
];

export function isInternalProductionReferenceSection(
  section: LocalizedLessonSection,
): boolean {
  const role = section.role?.toLowerCase() ?? "";
  const heading = section.heading?.toLowerCase() ?? "";
  return (
    role.includes("production reference only") ||
    heading.includes("production reference only")
  );
}

const EN_ORIENTATION_TITLE_PATTERNS: RegExp[] = [
  /^what will you understand\??$/i,
  /^what will you learn\??$/i,
  /^what this lesson is about$/i,
  /^orientation\b/i,
];

const GENERIC_BAD_ENGLISH_TITLE_PATTERNS: RegExp[] = [
  /^introduction to the lesson$/i,
  /^getting started$/i,
  /^what will you understand\??$/i,
  /^what will you learn\??$/i,
  /^understanding\b/i,
  ...EN_ORIENTATION_TITLE_PATTERNS,
];

const AR_ORIENTATION_TITLE_PATTERNS: RegExp[] = [
  /^ماذا\s+ستفهم/,
  /^وش\s+راح\s+تفهم/,
  /^بداية\s+الدرس$/,
  /^وين\s+يروح\s+وقتك/,
];

const WEAK_QUIZ_QUESTION_PATTERNS: RegExp[] = [
  /^correct answer$/i,
  /^quiz$/i,
  /^quick check$/i,
  /^تأكيد\s+سريع$/,
  /^correctIndex/i,
];

const QUIZ_OPTION_PREFIX_PATTERNS: RegExp[] = [
  /^Option\s*\d+\s*[:\.]?\s*/i,
  /^Choice\s*\d+\s*[:\.]?\s*/i,
  /^Answer\s*[A-D]\s*[:\.]?\s*/i,
  /^خيار\s*[:\.]?\s*[\u0660-\u0669\d]+\s*[:\.]?\s*/u,
  /^الخيار\s*[:\.]?\s*[\u0660-\u0669\d]+\s*[:\.]?\s*/u,
  /^[\u0660-\u0669\d]+\s*[:\.]\s*/u,
  /^\d+\s*[:\.]\s*/,
  /^[A-D]\)\s*/i,
  /^[أ-د]\)\s*/u,
];

type QuizOptionSignal = "hands_on" | "reading_theory" | "unknown";

/** MSA source omits structured quiz.question for this lesson; repair during finalization only. */
export const ANALYST_M4_QUIZ_QUESTION_FALLBACK: Record<
  AdaptationTargetLocale,
  string
> = {
  en: "You have four numbers on the dashboard — what is the best first step for automation?",
  "ar-Gulf":
    "عندك ٤ أرقام في الـ Dashboard — وش أفضل خطوة أولى للأتمتة؟",
};

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function stripQuizOptionPrefix(text: string): string {
  let value = text.trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (const pattern of QUIZ_OPTION_PREFIX_PATTERNS) {
      const next = value.replace(pattern, "").trim();
      if (next !== value) {
        value = next;
        changed = true;
      }
    }
  }

  return value;
}

export function hasQuizOptionPrefixLeak(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return QUIZ_OPTION_PREFIX_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function classifyQuizOption(text: string): QuizOptionSignal {
  const normalized = normalizeTitle(text);

  if (
    /chatgpt|gemini|claude|open .{0,20} ask|try something|try .{0,20} small|ask it something|ask .{0,20} simple|تفتح|جرّ?ب|اطلب|جرب/.test(
      normalized,
    )
  ) {
    return "hands_on";
  }

  if (
    /read .{0,20} article|long article|textbook|full course|many article|as many|wait until you have taken|قراءة|مقال|دورة|مقالات/.test(
      normalized,
    )
  ) {
    return "reading_theory";
  }

  return "unknown";
}

type ExplanationPreference = QuizOptionSignal | "specific_location" | "general_totals";

function classifyExplanationPreference(explanation: string): ExplanationPreference {
  const normalized = normalizeTitle(explanation);

  if (
    /specific question|locates the problem|purchase path|مسار الشر|وين المشكلة|أين المشكلة|where the problem|general totals alone|أرقام عام.*ما تكفي|not enough/.test(
      normalized,
    )
  ) {
    return "specific_location";
  }

  if (/general total|visitor total|totals alone|أرقام عام/.test(normalized)) {
    return "general_totals";
  }

  if (
    /small (real )?attempt|more than a long read|try .{0,20} yourself|hands-on|hands on|تجربة .{0,20} قراءة|قراءة طويلة|جرّ?ب/.test(
      normalized,
    )
  ) {
    return "hands_on";
  }

  if (/prefer reading|read first|long read|اقرأ/.test(normalized)) {
    return "reading_theory";
  }

  return "unknown";
}

function learnerFacingText(section: LocalizedLessonSection): string {
  return [
    section.heading,
    section.subtitle ?? "",
    section.contentMarkdown,
    ...section.bullets,
    section.quiz?.question ?? "",
    ...(section.quiz?.options ?? []),
    section.quiz?.explanation ?? "",
    section.mission?.intro ?? "",
    ...(section.mission?.delivery ?? []),
    ...(section.mission?.rubric?.map((row) => `${row.dimension} ${row.criteria}`) ??
      []),
  ].join("\n");
}

function allLearnerFacingText(pkg: AdaptedLessonPackage): string {
  return [
    pkg.title,
    pkg.titleEn ?? "",
    pkg.summary ?? "",
    ...pkg.sections
      .filter((section) => !isInternalProductionReferenceSection(section))
      .flatMap((section) => [learnerFacingText(section)]),
  ].join("\n");
}

function sanitizeInternalProductionReferenceSection(
  section: LocalizedLessonSection,
): LocalizedLessonSection {
  if (!isInternalProductionReferenceSection(section)) {
    return section;
  }

  return {
    ...section,
    contentMarkdown: "",
    bullets: [],
  };
}

function titlesAlign(a: string, b: string): boolean {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  return false;
}

function orientationSectionSubtitle(source: LocalizedLessonPackage): string | null {
  const orientation = source.sections.find((section) => section.role === "Orientation");
  return orientation?.subtitle?.trim() ?? null;
}

export function isGenericBadEnglishTitle(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return false;
  return GENERIC_BAD_ENGLISH_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function looksLikeOrientationTitle(
  title: string,
  targetLocale: AdaptationTargetLocale,
  source: LocalizedLessonPackage,
): boolean {
  const normalized = normalizeTitle(title);
  const orientationSubtitle = orientationSectionSubtitle(source);
  if (orientationSubtitle && normalizeTitle(orientationSubtitle) === normalized) {
    return true;
  }

  const patterns =
    targetLocale === "en" ? EN_ORIENTATION_TITLE_PATTERNS : AR_ORIENTATION_TITLE_PATTERNS;
  return patterns.some((pattern) => pattern.test(title.trim()));
}

export function detectGenericBadEnglishTitleWarning(
  adapted: AdaptedLessonPackage,
): string | null {
  if (adapted.locale !== "en") return null;
  const title = adapted.title?.trim();
  if (!title || !isGenericBadEnglishTitle(title)) return null;
  const titleEn = adapted.titleEn?.trim();
  return titleEn
    ? `title "${title}" is a generic orientation title; use titleEn "${titleEn}"`
    : `title "${title}" is a generic orientation title and must be replaced`;
}

export function detectEnglishTitleMismatchWarning(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): string | null {
  if (adapted.locale !== "en") return null;
  const titleEn = adapted.titleEn?.trim();
  const title = adapted.title?.trim();
  if (!titleEn || !title) return null;
  if (titlesAlign(title, titleEn)) return null;

  const genericWarning = detectGenericBadEnglishTitleWarning(adapted);
  if (genericWarning) return genericWarning;

  if (looksLikeOrientationTitle(title, "en", source)) {
    return `title "${title}" appears to be orientation copy while titleEn is "${titleEn}"`;
  }

  return `title "${title}" must match titleEn "${titleEn}" for English packages`;
}

/** Align EN catalog title to titleEn when mismatched or generic. */
export function alignEnglishCatalogTitle(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  if (adapted.locale !== "en") return adapted;

  const titleEn = adapted.titleEn?.trim() ?? source.titleEn?.trim();
  if (!titleEn) return adapted;

  const title = adapted.title?.trim() ?? "";
  const needsAlign =
    !titlesAlign(title, titleEn) ||
    isGenericBadEnglishTitle(title) ||
    looksLikeOrientationTitle(title, "en", source);

  if (!needsAlign) return adapted;

  return { ...adapted, title: titleEn };
}

export function detectGulfTitleMismatchWarning(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): string | null {
  if (adapted.locale !== "ar-Gulf") return null;
  const titleEn = adapted.titleEn?.trim();
  const title = adapted.title?.trim();
  if (!title) return null;

  const orientationSubtitle = orientationSectionSubtitle(source);
  if (
    orientationSubtitle &&
    normalizeTitle(title) === normalizeTitle(orientationSubtitle) &&
    titleEn &&
    !titlesAlign(title, titleEn)
  ) {
    return `title "${title}" matches orientation subtitle; derive a short Gulf topic title from titleEn "${titleEn}"`;
  }

  return null;
}

export function detectQuizMarkdownLeakageWarnings(
  adapted: AdaptedLessonPackage,
): string[] {
  const warnings: string[] = [];

  for (const section of adapted.sections) {
    const fields = [
      section.heading,
      section.subtitle ?? "",
      section.contentMarkdown,
      ...section.bullets,
      section.quiz?.question ?? "",
      ...(section.quiz?.options ?? []),
      section.quiz?.explanation ?? "",
    ];

    for (const field of fields) {
      for (const pattern of QUIZ_LEAK_PATTERNS) {
        if (pattern.test(field)) {
          warnings.push(
            `quiz markdown leakage in section "${section.role}": internal key pattern "${pattern.source}"`,
          );
          break;
        }
      }
    }
  }

  return [...new Set(warnings)];
}

export function detectBannedPhraseWarnings(
  adapted: AdaptedLessonPackage,
): string[] {
  const warnings: string[] = [];
  const text = allLearnerFacingText(adapted);

  for (const pattern of BANNED_LEARNER_PHRASE_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push(
        `banned production-leak phrase detected: "${pattern.source}"`,
      );
    }
  }

  return [...new Set(warnings)];
}

function isWeakQuizQuestion(question: string | undefined): boolean {
  const trimmed = question?.trim() ?? "";
  if (!trimmed) return true;
  if (trimmed.length < 12) return true;
  return WEAK_QUIZ_QUESTION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function detectQuizIntegrityWarnings(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): string[] {
  const warnings: string[] = [];

  for (let index = 0; index < adapted.sections.length; index++) {
    const section = adapted.sections[index];
    if (section.role !== "Quiz") continue;

    const sourceSection = source.sections[index];
    const quiz = section.quiz;
    const label = `${adapted.lessonId} quiz section`;

    if (!quiz) {
      warnings.push(`${label}: missing structured quiz object`);
      continue;
    }

    const resolved = resolveSourceQuizStructure(sourceSection, adapted.lessonId);
    if (!resolved.ok) {
      warnings.push(`${label}: ${resolved.issues.join("; ")}`);
      continue;
    }

    warnings.push(
      ...detectQuizStructureDriftWarnings(
        adapted.lessonId,
        resolved.structure,
        quiz.options ?? [],
        quiz.correctIndex,
      ),
    );

    if (isWeakQuizQuestion(quiz.question)) {
      warnings.push(`${label}: missing clear quiz question`);
    }

    const expectedOptions = resolved.structure.optionCount;
    const options = quiz.options ?? [];

    if (options.length !== expectedOptions) {
      warnings.push(
        `${label}: expected exactly ${expectedOptions} quiz options, found ${options.length}`,
      );
    }

    if (options.some((option) => !option.trim())) {
      warnings.push(`${label}: quiz options must not be empty`);
    }

    const correctIndex = resolved.structure.correctIndex;
    if (
      quiz.correctIndex === undefined ||
      quiz.correctIndex < 0 ||
      quiz.correctIndex >= expectedOptions
    ) {
      warnings.push(
        `${label}: correctIndex ${String(quiz.correctIndex)} is out of range for ${expectedOptions} options`,
      );
    } else if (quiz.correctIndex !== correctIndex) {
      warnings.push(
        `${label}: correctIndex must remain ${correctIndex}, found ${quiz.correctIndex}`,
      );
    } else if (!options[quiz.correctIndex]?.trim()) {
      warnings.push(`${label}: correct option at index ${quiz.correctIndex} is missing`);
    }

    if (adapted.lessonId === "analyst-m4-automated-dashboard") {
      if (expectedOptions !== 3) {
        warnings.push(`${label}: analyst-m4-automated-dashboard requires 3 quiz options`);
      }
      if (correctIndex !== 0) {
        warnings.push(
          `${label}: analyst-m4-automated-dashboard must keep correctIndex 0`,
        );
      }
      if (isWeakQuizQuestion(quiz.question)) {
        warnings.push(
          `${label}: analyst-m4-automated-dashboard requires an explicit learner question`,
        );
      }
    }

    warnings.push(
      ...detectQuizExplanationSemanticWarnings(
        adapted.lessonId,
        quiz.question ?? "",
        options,
        correctIndex,
        quiz.explanation ?? "",
      ),
    );
  }

  return warnings;
}

export function detectQuizExplanationSemanticWarnings(
  lessonId: string,
  question: string,
  options: string[],
  correctIndex: number,
  explanation: string,
): string[] {
  const warnings: string[] = [];
  const label = `${lessonId} quiz section`;

  if (
    correctIndex < 0 ||
    correctIndex >= options.length ||
    !explanation.trim() ||
    options.length < 2
  ) {
    return warnings;
  }

  const preference = classifyExplanationPreference(explanation);
  const correctClass = classifyQuizOptionIdentity(options[correctIndex] ?? "");
  const correctLegacyClass = classifyQuizOption(options[correctIndex] ?? "");

  if (
    preference === "specific_location" &&
    correctClass !== "funnel_dropoff" &&
    correctClass !== "automate_weekly_metric" &&
    correctClass !== "unknown"
  ) {
    for (let index = 0; index < options.length; index++) {
      if (index === correctIndex) continue;
      const optionClass = classifyQuizOptionIdentity(options[index] ?? "");
      if (
        optionClass === "funnel_dropoff" ||
        optionClass === "automate_weekly_metric"
      ) {
        warnings.push(
          `${label}: explanation supports specific-location option at index ${index} but correctIndex is ${correctIndex}`,
        );
        break;
      }
    }
  }

  if (
    preference === "hands_on" &&
    correctLegacyClass === "reading_theory"
  ) {
    warnings.push(
      `${label}: explanation supports hands-on trying but correctIndex ${correctIndex} points to a reading/theory option`,
    );
  }

  if (
    preference === "reading_theory" &&
    correctLegacyClass === "hands_on"
  ) {
    warnings.push(
      `${label}: explanation supports reading/theory but correctIndex ${correctIndex} points to a hands-on option`,
    );
  }

  for (let index = 0; index < options.length; index++) {
    if (index === correctIndex) continue;
    const optionClass = classifyQuizOption(options[index] ?? "");
    if (
      preference !== "unknown" &&
      preference !== "specific_location" &&
      preference !== "general_totals" &&
      optionClass === preference &&
      correctLegacyClass !== preference
    ) {
      warnings.push(
        `${label}: explanation supports option at index ${index} but correctIndex is ${correctIndex}`,
      );
      break;
    }
  }

  return warnings;
}

export function detectQuizOptionIdentityWarnings(
  adapted: AdaptedLessonPackage,
): string[] {
  const warnings: string[] = [];
  const expectedByLesson = getCanonicalOptionIdentities(adapted.lessonId);
  if (!expectedByLesson) return warnings;

  for (const section of adapted.sections) {
    if (section.role !== "Quiz" || !section.quiz?.options) continue;
    const label = `${adapted.lessonId} quiz section`;
    const options = section.quiz.options;

    if (!optionsPreserveCanonicalIdentity(adapted.lessonId, options)) {
      options.forEach((option, index) => {
        const actual = classifyQuizOptionIdentity(option);
        const expected = expectedByLesson[index];
        if (expected !== "unknown" && actual !== "unknown" && actual !== expected) {
          warnings.push(
            `${label}: quiz.options[${index}] semantic identity mismatch (expected ${expected}, found ${actual})`,
          );
        }
      });
    }
  }

  return warnings;
}

export function countMarkdownEmphasisMarkers(text: string): number {
  return (text.match(/\*\*/g) ?? []).length;
}

export function hasUnbalancedMarkdownEmphasis(text: string): boolean {
  return countMarkdownEmphasisMarkers(text) % 2 !== 0;
}

export function stripMarkdownEmphasisFromText(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function sanitizeLearnerFacingField(
  text: string,
  options: { stripQuizOptionPrefixes?: boolean } = {},
): string {
  let value = stripQuizKeyLeaksFromMarkdown(text);
  if (options.stripQuizOptionPrefixes) {
    value = value
      .split("\n")
      .map((line) => stripQuizOptionPrefix(line))
      .join("\n");
  }
  value = stripMarkdownEmphasisFromText(value);
  return stripBannedPhrasesFromText(value);
}

function learnerFacingFieldsForSection(
  section: LocalizedLessonSection,
): Array<{ label: string; text: string }> {
  const fields: Array<{ label: string; text: string }> = [
    { label: "heading", text: section.heading },
    { label: "subtitle", text: section.subtitle ?? "" },
    { label: "contentMarkdown", text: section.contentMarkdown },
  ];

  section.bullets.forEach((bullet, index) => {
    fields.push({ label: `bullets[${index}]`, text: bullet });
  });

  if (section.quiz) {
    fields.push({ label: "quiz.question", text: section.quiz.question ?? "" });
    (section.quiz.options ?? []).forEach((option, index) => {
      fields.push({ label: `quiz.options[${index}]`, text: option });
    });
    fields.push({
      label: "quiz.explanation",
      text: section.quiz.explanation ?? "",
    });
  }

  if (section.mission) {
    fields.push({ label: "mission.intro", text: section.mission.intro ?? "" });
    (section.mission.delivery ?? []).forEach((line, index) => {
      fields.push({ label: `mission.delivery[${index}]`, text: line });
    });
    (section.mission.rubric ?? []).forEach((row, index) => {
      fields.push({
        label: `mission.rubric[${index}].dimension`,
        text: row.dimension,
      });
      fields.push({
        label: `mission.rubric[${index}].criteria`,
        text: row.criteria,
      });
    });
  }

  return fields;
}

export function detectUnbalancedLearnerMarkdownWarnings(
  adapted: AdaptedLessonPackage,
): string[] {
  const warnings: string[] = [];
  const label = adapted.lessonId;

  for (const field of [
    { name: "title", text: adapted.title },
    { name: "titleEn", text: adapted.titleEn ?? "" },
    { name: "summary", text: adapted.summary ?? "" },
  ]) {
    if (field.text && hasUnbalancedMarkdownEmphasis(field.text)) {
      warnings.push(
        `${label}: ${field.name} contains unbalanced markdown emphasis markers`,
      );
    }
  }

  for (const section of adapted.sections) {
    if (isInternalProductionReferenceSection(section)) continue;
    const sectionLabel = `${label} section "${section.role}"`;

    for (const field of learnerFacingFieldsForSection(section)) {
      if (!field.text.trim()) continue;
      if (hasUnbalancedMarkdownEmphasis(field.text)) {
        warnings.push(
          `${sectionLabel}: ${field.label} contains unbalanced markdown emphasis markers`,
        );
      }
    }
  }

  return warnings;
}

export function detectUnbalancedQuizOptionMarkdownWarnings(
  adapted: AdaptedLessonPackage,
): string[] {
  const warnings: string[] = [];

  for (const section of adapted.sections) {
    if (section.role !== "Quiz" || !section.quiz?.options) continue;
    const label = `${adapted.lessonId} quiz section`;

    section.quiz.options.forEach((option, index) => {
      if (hasUnbalancedMarkdownEmphasis(option)) {
        warnings.push(
          `${label}: quiz.options[${index}] contains unbalanced markdown emphasis markers`,
        );
      }
    });
  }

  return warnings;
}

export function detectQuizOptionPrefixWarnings(
  adapted: AdaptedLessonPackage,
): string[] {
  const warnings: string[] = [];

  for (const section of adapted.sections) {
    if (section.role !== "Quiz") continue;
    const label = `${adapted.lessonId} quiz section`;

    section.quiz?.options?.forEach((option, index) => {
      if (hasQuizOptionPrefixLeak(option)) {
        warnings.push(
          `${label}: quiz.options[${index}] contains numbering prefix leakage`,
        );
      }
    });

    section.bullets.forEach((bullet, index) => {
      if (hasQuizOptionPrefixLeak(bullet)) {
        warnings.push(
          `${label}: bullets[${index}] contains numbering prefix leakage`,
        );
      }
    });

    section.contentMarkdown.split("\n").forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (hasQuizOptionPrefixLeak(trimmed)) {
        warnings.push(
          `${label}: contentMarkdown line ${index + 1} contains numbering prefix leakage`,
        );
      }
    });
  }

  return warnings;
}

export function detectGulfRegisterInconsistencyWarning(
  adapted: AdaptedLessonPackage,
): string | null {
  if (adapted.locale !== "ar-Gulf") return null;

  const text = allLearnerFacingText(adapted);
  const aishCount = (text.match(/ايش/g) ?? []).length;
  const washCount = (text.match(/وش/g) ?? []).length;

  if (aishCount >= 2 && washCount >= 2) {
    return `Gulf register mixes "ايش" (${aishCount}x) and "وش" (${washCount}x); prefer consistent وش، ليش، مو، راح`;
  }

  return null;
}

export function validateAdaptedLessonWarnings(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
): string[] {
  const warnings: string[] = [];

  const titleWarning =
    targetLocale === "en"
      ? detectEnglishTitleMismatchWarning(source, adapted)
      : detectGulfTitleMismatchWarning(source, adapted);
  if (titleWarning) warnings.push(titleWarning);

  warnings.push(...detectQuizMarkdownLeakageWarnings(adapted));
  warnings.push(...detectBannedPhraseWarnings(adapted));
  warnings.push(...detectQuizIntegrityWarnings(source, adapted));
  warnings.push(...detectQuizOptionIdentityWarnings(adapted));
  warnings.push(...detectUnbalancedLearnerMarkdownWarnings(adapted));
  warnings.push(...detectUnbalancedQuizOptionMarkdownWarnings(adapted));
  warnings.push(...detectQuizOptionPrefixWarnings(adapted));

  const registerWarning = detectGulfRegisterInconsistencyWarning(adapted);
  if (registerWarning) warnings.push(registerWarning);

  return warnings;
}

/** Validate learner-facing text after sanitation — use for pilot/sample CI gates. */
export function validateSanitizedAdaptedLessonWarnings(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
): string[] {
  const sanitized = sanitizeAdaptedLessonMarkdown(adapted);
  return validateAdaptedLessonWarnings(source, sanitized, targetLocale);
}

export function collectLearnerTextQualityViolations(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
  lessonPrefix: string,
): string[] {
  const violations = validateSanitizedAdaptedLessonWarnings(
    source,
    adapted,
    targetLocale,
  );
  return violations.map((violation) => `${lessonPrefix}: ${violation}`);
}

export function stripQuizKeyLeaksFromMarkdown(text: string): string {
  const lines = text.split("\n");
  const cleaned = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    return !QUIZ_LEAK_PATTERNS.some((pattern) => pattern.test(trimmed));
  });
  return cleaned.join("\n").trimEnd();
}

export function stripInternalProductionNotesFromText(text: string): string {
  const lines = text.split("\n");
  const cleaned = lines
    .map((line) => {
      let value = line;
      for (const pattern of INTERNAL_PRODUCTION_LINE_PATTERNS) {
        value = value.replace(pattern, "").trim();
      }
      for (const pattern of BANNED_LEARNER_PHRASE_PATTERNS) {
        value = value.replace(pattern, "").trim();
      }
      for (const pattern of QUIZ_LEAK_PATTERNS) {
        value = value.replace(pattern, "").trim();
      }
      return value;
    })
    .filter((line) => {
      if (!line.trim()) return false;
      return !INTERNAL_PRODUCTION_LINE_PATTERNS.some((pattern) =>
        pattern.test(line),
      );
    });

  return cleaned.join("\n").trimEnd();
}

export function stripBannedPhrasesFromText(text: string): string {
  return stripInternalProductionNotesFromText(text);
}

export function normalizeQuizOptionText(text: string): string {
  const withoutPrefixes = stripQuizOptionPrefix(
    text
      .replace(
        /^(\*{1,2})?(الإجابة الصحيحة|Correct answer|Correct Answer)[^:*]*(\([^)]*\))?\*{0,2}\s*:?\s*/i,
        "",
      )
      .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
      .replace(/^\*\*|\*\*$/g, "")
      .trim(),
  );
  return stripMarkdownEmphasisFromText(withoutPrefixes);
}

export function extractQuizQuestionFromMarkdown(contentMarkdown: string): string | null {
  const patterns = [
    /\*\*Question:\*\*\s*(.+)/i,
    /\*\*السؤال:\*\*\s*(.+)/,
    /^Question:\s*(.+)/im,
    /^السؤال:\s*(.+)/m,
  ];

  for (const pattern of patterns) {
    const match = contentMarkdown.match(pattern);
    const question = match?.[1]?.trim();
    if (question && !isWeakQuizQuestion(question)) {
      return question.replace(/\*\*/g, "").trim();
    }
  }

  return null;
}

function rebuildQuizOptionsFromBullets(bullets: string[]): string[] {
  return bullets
    .map((bullet) => normalizeQuizOptionText(stripBannedPhrasesFromText(bullet)))
    .filter(
      (option) =>
        option.length > 0 &&
        !/^(\*\*)?(التفسير|Explanation)\b/i.test(option) &&
        !/^Explanation:/i.test(option),
    );
}

function sanitizeQuizHeading(text: string | undefined): string | undefined {
  if (!text?.trim()) return text;
  const cleaned = stripBannedPhrasesFromText(stripQuizKeyLeaksFromMarkdown(text));
  if (!cleaned || /correctIndex/i.test(cleaned)) {
    return "Quiz";
  }
  return cleaned.replace(/\s*—\s*correctIndex\s*:\s*\d+\s*$/i, "").trim() || "Quiz";
}

export function repairQuizSection(
  sourceSection: LocalizedLessonSection | undefined,
  section: LocalizedLessonSection,
  lessonId: string,
  targetLocale: AdaptationTargetLocale,
): LocalizedLessonSection {
  if (section.role !== "Quiz" || !section.quiz) {
    return {
      ...section,
      heading: sanitizeQuizHeading(section.heading) ?? section.heading,
      subtitle: sanitizeQuizHeading(section.subtitle) ?? section.subtitle,
      contentMarkdown: sanitizeLearnerFacingField(section.contentMarkdown),
      bullets: section.bullets
        .map((bullet) => sanitizeLearnerFacingField(bullet))
        .filter((bullet) => bullet.length > 0),
    };
  }

  const resolved = resolveSourceQuizStructure(sourceSection, lessonId);
  if (!resolved.ok) {
    throw new Error(
      `${lessonId} quiz section: ${resolved.issues.join("; ")} — cannot finalize without source structure`,
    );
  }

  const quiz = { ...section.quiz };
  const adaptedOptions = [...(quiz.options ?? [])].map((option) =>
    normalizeQuizOptionText(stripBannedPhrasesFromText(option)),
  );
  const adaptedOptionBullets = rebuildQuizOptionsFromBullets(section.bullets);

  const locked = lockQuizOptionsToSourceStructure(
    resolved.structure,
    adaptedOptions,
    adaptedOptionBullets,
  );

  let question =
    quiz.question?.trim() && !isWeakQuizQuestion(quiz.question)
      ? stripBannedPhrasesFromText(quiz.question)
      : "";

  let explanation = stripBannedPhrasesFromText(quiz.explanation ?? "");

  const merged = applyDeterministicQuizFallback({
    lessonId,
    targetLocale,
    usesOverride: resolved.structure.usesOverride,
    lockedOptions: locked.options,
    question,
    explanation,
    sourceOptionTextsByIndex: resolved.structure.sourceOptionTextsByIndex,
    indexAlignedAdaptedOptions: adaptedOptions.length === resolved.structure.optionCount,
  });

  const options = merged.options;
  question = merged.question;
  explanation = merged.explanation;

  if (!question) {
    question =
      extractQuizQuestionFromMarkdown(section.contentMarkdown) ??
      extractQuizQuestionFromMarkdown(sourceSection?.contentMarkdown ?? "") ??
      "";
  }

  if (
    !question &&
    lessonId === "analyst-m4-automated-dashboard" &&
    ANALYST_M4_QUIZ_QUESTION_FALLBACK[targetLocale]
  ) {
    question = ANALYST_M4_QUIZ_QUESTION_FALLBACK[targetLocale];
  }

  if (!question.trim()) {
    throw new Error(`${lessonId} quiz section: cannot finalize with empty quiz question`);
  }
  const contentMarkdown = sanitizeLearnerFacingField(section.contentMarkdown, {
    stripQuizOptionPrefixes: true,
  });

  return {
    ...section,
    heading: sanitizeQuizHeading(section.heading) ?? section.heading,
    subtitle: sanitizeQuizHeading(section.subtitle) ?? section.subtitle,
    contentMarkdown,
    bullets: section.bullets
      .map((bullet) =>
        sanitizeLearnerFacingField(bullet, { stripQuizOptionPrefixes: true }),
      )
      .filter((bullet) => bullet.length > 0),
    quiz: {
      ...quiz,
      question,
      options,
      explanation,
      correctIndex: locked.correctIndex,
    },
  };
}

export function sanitizeAdaptedLessonMarkdown(
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  return {
    ...adapted,
    title: sanitizeLearnerFacingField(adapted.title),
    summary: adapted.summary
      ? sanitizeLearnerFacingField(adapted.summary)
      : adapted.summary,
    sections: adapted.sections.map((section) => {
      const cleaned = sanitizeInternalProductionReferenceSection(section);
      const isQuiz = cleaned.role === "Quiz";
      return {
        ...cleaned,
        heading: sanitizeLearnerFacingField(cleaned.heading),
        subtitle: cleaned.subtitle
          ? sanitizeLearnerFacingField(cleaned.subtitle)
          : cleaned.subtitle,
        contentMarkdown: sanitizeLearnerFacingField(cleaned.contentMarkdown, {
          stripQuizOptionPrefixes: isQuiz,
        }),
        bullets: cleaned.bullets
          .map((bullet) =>
            sanitizeLearnerFacingField(bullet, {
              stripQuizOptionPrefixes: isQuiz,
            }),
          )
          .filter((bullet) => bullet.length > 0),
        quiz: cleaned.quiz
          ? {
              ...cleaned.quiz,
              question: sanitizeLearnerFacingField(cleaned.quiz.question ?? ""),
              options: (cleaned.quiz.options ?? []).map((option) =>
                sanitizeLearnerFacingField(normalizeQuizOptionText(option), {
                  stripQuizOptionPrefixes: true,
                }),
              ),
              explanation: sanitizeLearnerFacingField(
                cleaned.quiz.explanation ?? "",
              ),
            }
          : cleaned.quiz,
        mission: cleaned.mission
          ? {
              ...cleaned.mission,
              intro: sanitizeLearnerFacingField(cleaned.mission.intro ?? ""),
              delivery: (cleaned.mission.delivery ?? []).map((line) =>
                sanitizeLearnerFacingField(line),
              ),
              rubric: (cleaned.mission.rubric ?? []).map((row) => ({
                ...row,
                dimension: sanitizeLearnerFacingField(row.dimension),
                criteria: sanitizeLearnerFacingField(row.criteria),
              })),
            }
          : cleaned.mission,
      };
    }),
  };
}
