import type { QuizItem } from "@/components/intro/QuizBlock";
import type { LocalizedLessonQuiz } from "./types";

const DEFAULT_BLOOM: QuizItem["bloom"] = "understand";

export class InvalidPackageQuizError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPackageQuizError";
  }
}

/** Stable deterministic id for package quiz attempts and learner events. */
export function packageQuizQuestionId(
  lessonId: string,
  quizIndex: number,
): string {
  return `${lessonId}::quiz::${quizIndex}`;
}

export function adaptPackageQuizToQuizItem(
  lessonId: string,
  quiz: LocalizedLessonQuiz,
  quizIndex: number,
): QuizItem {
  const options = quiz.options ?? [];
  if (options.length === 0) {
    throw new InvalidPackageQuizError(
      `${lessonId} quiz ${quizIndex}: no options`,
    );
  }

  const correctIndex = quiz.correctIndex;
  if (
    typeof correctIndex !== "number" ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    throw new InvalidPackageQuizError(
      `${lessonId} quiz ${quizIndex}: invalid correctIndex ${String(correctIndex)} for ${options.length} options`,
    );
  }

  const question = quiz.question ?? "";
  if (!question.trim()) {
    throw new InvalidPackageQuizError(
      `${lessonId} quiz ${quizIndex}: missing question`,
    );
  }

  return {
    id: packageQuizQuestionId(lessonId, quizIndex),
    bloom: DEFAULT_BLOOM,
    question,
    options,
    correctIndex,
    explanation: quiz.explanation ?? "",
  };
}

export function adaptPackageQuizzesFromSections(
  lessonId: string,
  sections: ReadonlyArray<{ quiz?: LocalizedLessonQuiz }>,
): QuizItem[] {
  const items: QuizItem[] = [];
  let quizIndex = 0;
  for (const section of sections) {
    if (!section.quiz?.options?.length) continue;
    items.push(adaptPackageQuizToQuizItem(lessonId, section.quiz, quizIndex));
    quizIndex += 1;
  }
  return items;
}
