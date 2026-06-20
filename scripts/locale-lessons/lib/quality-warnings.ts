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

const EN_ORIENTATION_TITLE_PATTERNS: RegExp[] = [
  /^what will you understand\??$/i,
  /^what this lesson is about$/i,
  /^orientation\b/i,
];

const AR_ORIENTATION_TITLE_PATTERNS: RegExp[] = [
  /^ماذا\s+ستفهم/,
  /^وش\s+راح\s+تفهم/,
  /^بداية\s+الدرس$/,
  /^وين\s+يروح\s+وقتك/,
];

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

export function detectEnglishTitleMismatchWarning(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): string | null {
  if (adapted.locale !== "en") return null;
  const titleEn = adapted.titleEn?.trim();
  const title = adapted.title?.trim();
  if (!titleEn || !title) return null;
  if (titlesAlign(title, titleEn)) return null;
  if (!looksLikeOrientationTitle(title, "en", source)) return null;

  return `title "${title}" appears to be orientation copy while titleEn is "${titleEn}"`;
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

export function sanitizeAdaptedLessonMarkdown(
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  return {
    ...adapted,
    sections: adapted.sections.map((section) => ({
      ...section,
      contentMarkdown: stripQuizKeyLeaksFromMarkdown(section.contentMarkdown),
      bullets: section.bullets
        .map((bullet) => stripQuizKeyLeaksFromMarkdown(bullet))
        .filter((bullet) => bullet.length > 0),
    })),
  };
}
