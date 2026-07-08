import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  adaptPackageQuizToQuizItem,
  adaptPackageQuizzesFromSections,
  InvalidPackageQuizError,
  packageQuizQuestionId,
} from "@/lib/locale-lessons/adapt-package-to-live-quiz";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const PACKAGE_LOCALES: LessonPackageLocale[] = ["ar-MSA", "ar-Gulf", "en"];

function readPackage(
  locale: LessonPackageLocale,
  lessonId: string,
): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

describe("adaptPackageQuizToQuizItem", () => {
  const lessonId = "intro-m1-l1-what-is-ai";

  it("preserves question, option order, correctIndex, and explanation", () => {
    const pkg = readPackage("en", lessonId);
    const quizSection = pkg.sections.find((section) => section.quiz?.options?.length);
    expect(quizSection?.quiz).toBeTruthy();
    const quiz = quizSection!.quiz!;

    const item = adaptPackageQuizToQuizItem(lessonId, quiz, 0);

    expect(item.question).toBe(quiz.question);
    expect([...item.options]).toEqual([...quiz.options]);
    expect(item.correctIndex).toBe(quiz.correctIndex);
    expect(item.explanation).toBe(quiz.explanation);
  });

  it("generates a stable deterministic question id", () => {
    expect(packageQuizQuestionId(lessonId, 0)).toBe(
      "intro-m1-l1-what-is-ai::quiz::0",
    );
    expect(packageQuizQuestionId(lessonId, 2)).toBe(
      "intro-m1-l1-what-is-ai::quiz::2",
    );

    const pkg = readPackage("en", lessonId);
    const quiz = pkg.sections.find((section) => section.quiz)?.quiz!;
    const item = adaptPackageQuizToQuizItem(lessonId, quiz, 0);
    expect(item.id).toBe(packageQuizQuestionId(lessonId, 0));
  });

  it("uses a safe fixed bloom fallback", () => {
    const pkg = readPackage("en", lessonId);
    const quiz = pkg.sections.find((section) => section.quiz)?.quiz!;
    const item = adaptPackageQuizToQuizItem(lessonId, quiz, 0);
    expect(item.bloom).toBe("understand");
  });

  it("rejects invalid or out-of-range correctIndex values", () => {
    expect(() =>
      adaptPackageQuizToQuizItem(
        lessonId,
        {
          question: "Q?",
          options: ["a", "b"],
          correctIndex: 2,
          explanation: "Because.",
        },
        0,
      ),
    ).toThrow(InvalidPackageQuizError);

    expect(() =>
      adaptPackageQuizToQuizItem(
        lessonId,
        {
          question: "Q?",
          options: ["a", "b"],
          correctIndex: -1,
          explanation: "Because.",
        },
        0,
      ),
    ).toThrow(InvalidPackageQuizError);

    expect(() =>
      adaptPackageQuizToQuizItem(
        lessonId,
        {
          question: "Q?",
          options: ["a", "b"],
          explanation: "Because.",
        },
        0,
      ),
    ).toThrow(InvalidPackageQuizError);
  });

  it("adapts all 300 runtime package quizzes successfully", () => {
    let adapted = 0;
    for (const locale of PACKAGE_LOCALES) {
      const dir = path.join(REPO_ROOT, "src/lib/locale-lessons", locale, "lessons");
      for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
        const pkg = JSON.parse(
          readFileSync(path.join(dir, file), "utf8"),
        ) as LocalizedLessonPackage;
        const items = adaptPackageQuizzesFromSections(pkg.lessonId, pkg.sections);
        expect(items.length).toBeGreaterThan(0);
        adapted += items.length;
      }
    }
    expect(adapted).toBe(300);
  });
});
