import {
  hasIntroLessonContent,
  loadIntroLessonContent,
} from "@/components/intro/lessons/lesson-registry";
import { adaptPackageQuizzesFromSections } from "@/lib/locale-lessons/adapt-package-to-live-quiz";
import { loadLocalePackageLesson } from "@/lib/locale-lessons/load-locale-package-lesson";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";
import type { SupportedLocale } from "@/lib/locale/types";

export const QUIZ_ATTEMPT_LOCALES = [
  "ar-EG",
  "ar-MSA",
  "ar-Gulf",
  "en",
] as const satisfies readonly SupportedLocale[];

export type QuizAttemptLocale = (typeof QUIZ_ATTEMPT_LOCALES)[number];
export type CanonicalQuizBloomLevel = "remember" | "understand" | "apply";

const EGYPTIAN_QUIZ_OWNER_BY_BLOCK_ID: Readonly<Record<string, string>> = {
  "builder-m5-l5-mini-win-check": "builder-m5-l5-mini-win",
};

export type CanonicalQuizQuestion = {
  lessonId: string;
  questionId: string;
  correctIndex: number;
  optionCount: number;
  bloomLevel: CanonicalQuizBloomLevel;
};

type QuizCandidate = {
  id: string;
  bloom: string;
  options: readonly string[];
  correctIndex: number;
};

function sourceError(reason: string): Error {
  return new Error(`quiz-attempt: canonical source ${reason}`);
}

function requireBoundedText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") throw sourceError(`has invalid ${field}`);
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw sourceError(`has invalid ${field}`);
  }
  return text;
}
function normalizeQuestion(
  lessonId: string,
  question: QuizCandidate,
): CanonicalQuizQuestion {
  const questionId = requireBoundedText(question.id, "question id", 300);
  if (
    !Array.isArray(question.options) ||
    question.options.length === 0 ||
    question.options.some(
      (option) =>
        typeof option !== "string" ||
        !option.trim() ||
        option.length > 4000,
    )
  ) {
    throw sourceError("has invalid quiz options");
  }
  if (
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex >= question.options.length
  ) {
    throw sourceError("has invalid correct index");
  }
  if (
    question.bloom !== "remember" &&
    question.bloom !== "understand" &&
    question.bloom !== "apply"
  ) {
    throw sourceError("has invalid Bloom level");
  }
  return {
    lessonId,
    questionId,
    correctIndex: question.correctIndex,
    optionCount: question.options.length,
    bloomLevel: question.bloom,
  };
}

export function resolveCanonicalQuizQuestionFromCandidates(
  lessonId: string,
  questions: readonly QuizCandidate[],
  questionId: string,
): CanonicalQuizQuestion {
  const matches = questions.filter((question) => question.id === questionId);
  if (matches.length !== 1) {
    throw sourceError(
      matches.length === 0
        ? "does not contain the requested question"
        : "contains an ambiguous question id",
    );
  }
  return normalizeQuestion(lessonId, matches[0]!);
}

async function resolveEgyptianQuestion(
  lessonId: string,
  questionId: string,
): Promise<CanonicalQuizQuestion> {
  const explicitOwner = EGYPTIAN_QUIZ_OWNER_BY_BLOCK_ID[lessonId];
  const registryLessonId = explicitOwner ??
    (hasIntroLessonContent(lessonId)
      ? lessonId
      : lessonId.endsWith("-apply")
        ? lessonId.slice(0, -"-apply".length)
        : lessonId);
  if (!hasIntroLessonContent(registryLessonId)) {
    throw sourceError("does not contain the requested lesson");
  }
  const content = await loadIntroLessonContent(registryLessonId);
  if (!content) throw sourceError("could not load the requested lesson");
  const questions = content.flatMap((section) => {
    if (
      section.block.kind !== "quiz" ||
      section.block.lessonId !== lessonId
    ) {
      return [];
    }
    return section.block.items;
  });
  return resolveCanonicalQuizQuestionFromCandidates(
    lessonId,
    questions,
    questionId,
  );
}

async function resolveLocalizedQuestion(
  locale: LessonPackageLocale,
  lessonId: string,
  questionId: string,
): Promise<CanonicalQuizQuestion> {
  const pkg: LocalizedLessonPackage | null = await loadLocalePackageLesson(
    locale,
    lessonId,
  );
  if (!pkg || pkg.lessonId !== lessonId || pkg.locale !== locale) {
    throw sourceError("does not contain the requested localized lesson");
  }
  return resolveCanonicalQuizQuestionFromCandidates(
    lessonId,
    adaptPackageQuizzesFromSections(pkg.lessonId, pkg.sections),
    questionId,
  );
}
export async function resolveCanonicalQuizQuestion(input: {
  locale: QuizAttemptLocale;
  lessonId: string;
  questionId: string;
}): Promise<CanonicalQuizQuestion> {
  const lessonId = requireBoundedText(input.lessonId, "lesson id", 200);
  const questionId = requireBoundedText(input.questionId, "question id", 300);
  if (input.locale === "ar-EG") {
    return resolveEgyptianQuestion(lessonId, questionId);
  }
  if (
    input.locale === "ar-MSA" ||
    input.locale === "ar-Gulf" ||
    input.locale === "en"
  ) {
    return resolveLocalizedQuestion(input.locale, lessonId, questionId);
  }
  throw sourceError("uses an unsupported locale");
}
