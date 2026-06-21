import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "../../../src/lib/locale-lessons/types.ts";

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
];

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
    ...pkg.sections.flatMap((section) => [learnerFacingText(section)]),
  ].join("\n");
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

function countQuizOptionBullets(bullets: string[]): number {
  return bullets.filter((bullet) => {
    const trimmed = bullet.trim();
    if (!trimmed) return false;
    return !/^(\*\*)?(التفسير|Explanation)\b/i.test(trimmed);
  }).length;
}

function sourceQuizExpectedOptions(
  sourceSection: LocalizedLessonSection | undefined,
): number {
  const quiz = sourceSection?.quiz;
  const options = quiz?.options ?? [];
  const correctIndex = quiz?.correctIndex;

  if (
    options.length >= 2 &&
    correctIndex !== undefined &&
    correctIndex >= 0 &&
    correctIndex < options.length
  ) {
    return options.length;
  }

  const optionBullets = countQuizOptionBullets(sourceSection?.bullets ?? []);
  if (optionBullets >= 2) return optionBullets;

  return 2;
}

function expectedQuizOptionCount(
  sourceSection: LocalizedLessonSection | undefined,
  adaptedSection: LocalizedLessonSection,
): number {
  const adaptedOptions = adaptedSection.quiz?.options?.length ?? 0;
  const adaptedBullets = countQuizOptionBullets(adaptedSection.bullets);

  return Math.max(
    sourceQuizExpectedOptions(sourceSection),
    adaptedBullets,
    adaptedOptions,
    2,
  );
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

    if (isWeakQuizQuestion(quiz.question)) {
      warnings.push(`${label}: missing clear quiz question`);
    }

    const expectedOptions = expectedQuizOptionCount(sourceSection, section);
    const options = quiz.options ?? [];

    if (options.length < expectedOptions) {
      warnings.push(
        `${label}: expected at least ${expectedOptions} quiz options, found ${options.length}`,
      );
    }

    if (options.some((option) => !option.trim())) {
      warnings.push(`${label}: quiz options must not be empty`);
    }

    if (
      quiz.correctIndex === undefined ||
      quiz.correctIndex < 0 ||
      quiz.correctIndex >= options.length
    ) {
      warnings.push(
        `${label}: correctIndex ${String(quiz.correctIndex)} is out of range for ${options.length} options`,
      );
    } else if (!options[quiz.correctIndex]?.trim()) {
      warnings.push(`${label}: correct option at index ${quiz.correctIndex} is missing`);
    }

    if (adapted.lessonId === "analyst-m4-automated-dashboard") {
      if (options.length < 3) {
        warnings.push(`${label}: analyst-m4-automated-dashboard requires 3 quiz options`);
      }
      if (quiz.correctIndex !== 0) {
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

  const registerWarning = detectGulfRegisterInconsistencyWarning(adapted);
  if (registerWarning) warnings.push(registerWarning);

  return warnings;
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

export function stripBannedPhrasesFromText(text: string): string {
  const lines = text.split("\n");
  const cleaned = lines
    .map((line) => {
      let value = line;
      for (const pattern of BANNED_LEARNER_PHRASE_PATTERNS) {
        value = value.replace(pattern, "").trim();
      }
      for (const pattern of QUIZ_LEAK_PATTERNS) {
        value = value.replace(pattern, "").trim();
      }
      return value;
    })
    .filter((line) => line.length > 0);

  return cleaned.join("\n").trimEnd();
}

function normalizeQuizOptionText(text: string): string {
  return text
    .replace(
      /^(\*{1,2})?(الإجابة الصحيحة|Correct answer|Correct Answer)[^:*]*(\([^)]*\))?\*{0,2}\s*:?\s*/i,
      "",
    )
    .replace(/^خيار\s*\d+\s*:\s*/i, "")
    .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
    .replace(/^\*\*|\*\*$/g, "")
    .trim();
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
      contentMarkdown: stripBannedPhrasesFromText(
        stripQuizKeyLeaksFromMarkdown(section.contentMarkdown),
      ),
      bullets: section.bullets
        .map((bullet) => stripBannedPhrasesFromText(stripQuizKeyLeaksFromMarkdown(bullet)))
        .filter((bullet) => bullet.length > 0),
    };
  }

  const quiz = { ...section.quiz };
  let options = [...(quiz.options ?? [])].map((option) =>
    normalizeQuizOptionText(stripBannedPhrasesFromText(option)),
  );

  const rebuiltFromBullets = rebuildQuizOptionsFromBullets(section.bullets);
  const sourceBullets = sourceSection?.bullets ?? [];
  const rebuiltFromSourceBullets = rebuildQuizOptionsFromBullets(sourceBullets);

  const expectedCount = expectedQuizOptionCount(sourceSection, section);
  const correctIndex = quiz.correctIndex ?? sourceSection?.quiz?.correctIndex ?? 0;

  const candidateSets = [rebuiltFromBullets, rebuiltFromSourceBullets, options].filter(
    (set) => set.length >= expectedCount,
  );

  if (
    candidateSets.length > 0 &&
    (options.length < expectedCount ||
      correctIndex >= options.length ||
      !options[correctIndex]?.trim())
  ) {
    options = candidateSets[0] ?? options;
  }

  let question =
    quiz.question?.trim() && !isWeakQuizQuestion(quiz.question)
      ? stripBannedPhrasesFromText(quiz.question)
      : "";

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

  const explanation = stripBannedPhrasesFromText(quiz.explanation ?? "");
  const contentMarkdown = stripBannedPhrasesFromText(
    stripQuizKeyLeaksFromMarkdown(section.contentMarkdown),
  );

  return {
    ...section,
    heading: sanitizeQuizHeading(section.heading) ?? section.heading,
    subtitle: sanitizeQuizHeading(section.subtitle) ?? section.subtitle,
    contentMarkdown,
    bullets: section.bullets
      .map((bullet) => stripBannedPhrasesFromText(stripQuizKeyLeaksFromMarkdown(bullet)))
      .filter((bullet) => bullet.length > 0),
    quiz: {
      ...quiz,
      question,
      options,
      explanation,
      correctIndex,
    },
  };
}

export function sanitizeAdaptedLessonMarkdown(
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  return {
    ...adapted,
    title: stripBannedPhrasesFromText(adapted.title),
    summary: adapted.summary
      ? stripBannedPhrasesFromText(adapted.summary)
      : adapted.summary,
    sections: adapted.sections.map((section) => ({
      ...section,
      contentMarkdown: stripBannedPhrasesFromText(
        stripQuizKeyLeaksFromMarkdown(section.contentMarkdown),
      ),
      bullets: section.bullets
        .map((bullet) =>
          stripBannedPhrasesFromText(stripQuizKeyLeaksFromMarkdown(bullet)),
        )
        .filter((bullet) => bullet.length > 0),
      quiz: section.quiz
        ? {
            ...section.quiz,
            question: stripBannedPhrasesFromText(section.quiz.question ?? ""),
            options: (section.quiz.options ?? []).map((option) =>
              stripBannedPhrasesFromText(normalizeQuizOptionText(option)),
            ),
            explanation: stripBannedPhrasesFromText(section.quiz.explanation ?? ""),
          }
        : section.quiz,
    })),
  };
}
