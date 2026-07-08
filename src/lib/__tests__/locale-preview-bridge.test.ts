import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { localizedLessonsEnabled, localeUiEnabled } from "@/lib/locale/feature-flags";
import {
  adaptLocalizedPackageToPreviewContent,
  previewBodyDirection,
} from "@/lib/locale-lessons/adapt-package-to-preview-content";
import {
  learnerFacingTitle,
  parseInternalHeading,
  PREVIEW_INTERNAL_LABEL_LEAKS,
} from "@/lib/locale-lessons/package-section-labels";
import {
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";
import { adaptPackageQuizToQuizItem } from "@/lib/locale-lessons/adapt-package-to-live-quiz";
import { getPackageLessonIds } from "@/lib/locale-lessons/registry";
import type { LessonPackageLocale, LocalizedLessonPackage } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const PACKAGE_LOCALES: LessonPackageLocale[] = ["en", "ar-Gulf", "ar-MSA"];

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

function serializedPreviewText(
  sections: ReturnType<typeof adaptLocalizedPackageToPreviewContent>,
): string {
  return JSON.stringify(sections);
}

function findPreviewInternalLabelLeaks(blob: string): string[] {
  return PREVIEW_INTERNAL_LABEL_LEAKS.filter((label) => blob.includes(label));
}

function cleanPreviewQuizOption(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .trim()
    .replace(/^(correct answer|الإجابة الصحيحة)\s*:?\s*/i, "")
    .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
    .trim();
}

describe("package-section-labels compound prefix stripping", () => {
  it("strips internal labels joined with em dash, hyphen, colon, or pipe", () => {
    expect(parseInternalHeading("Orientation — بداية الدرس")).toEqual({
      isInternal: true,
      learnerPart: "بداية الدرس",
    });
    expect(parseInternalHeading("Orientation: Start here")).toEqual({
      isInternal: true,
      learnerPart: "Start here",
    });
    expect(parseInternalHeading("Quiz - Quick Confirmation")).toEqual({
      isInternal: true,
      learnerPart: "Quick Confirmation",
    });
    expect(parseInternalHeading("Mission | Your task")).toEqual({
      isInternal: true,
      learnerPart: "Your task",
    });
  });

  it("keeps exact internal headings for subtitle/fallback resolution", () => {
    expect(parseInternalHeading("Orientation")).toEqual({
      isInternal: true,
      learnerPart: "",
    });
    expect(
      learnerFacingTitle("Orientation", "What Will You Understand?", "Section"),
    ).toBe("What Will You Understand?");
    expect(learnerFacingTitle("Orientation", undefined, "Getting started")).toBe(
      "Getting started",
    );
  });

  it("treats production-reference screenshot headings as internal-only", () => {
    expect(
      parseInternalHeading("Screenshot block (optional — production reference)"),
    ).toEqual({
      isInternal: true,
      learnerPart: "",
    });
    expect(
      learnerFacingTitle(
        "Screenshot block (optional — production reference)",
        "production reference)",
        "Inside the platform",
      ),
    ).toBe("Inside the platform");
  });
});

describe("locale preview bridge (Phase 6.5)", () => {
  it("keeps localizedLessonsEnabled on for Phase 9 live mode", () => {
    expect(localizedLessonsEnabled).toBe(true);
    expect(localeUiEnabled).toBe(true);
  });

  it("defaults non-preview routes to ar-EG", () => {
    const access = resolveRouteLessonAccess(
      "intro-m1-l1-what-is-ai",
      parseLessonPreviewSearch({}),
    );
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });

  it("hides internal role labels in adapted preview sections", () => {
    const pkg = readPackage("en", "intro-m1-l1-what-is-ai");
    const sections = adaptLocalizedPackageToPreviewContent(pkg);
    const blob = serializedPreviewText(sections);

    expect(blob).not.toContain("Orientation");
    expect(blob).not.toContain("Screenshot block (intent)");
    expect(blob).not.toContain("production reference");
    expect(sections.some((section) => section.title === "What Will You Understand?")).toBe(
      true,
    );
  });

  it("renders glossary tables as concepts blocks", () => {
    const pkg = readPackage("en", "intro-m1-l1-what-is-ai");
    const concepts = adaptLocalizedPackageToPreviewContent(pkg).find(
      (section) => section.block.kind === "concepts",
    );

    expect(concepts).toBeTruthy();
    if (!concepts || concepts.block.kind !== "concepts") return;
    expect(concepts.block.items.length).toBeGreaterThan(0);
    expect(concepts.block.items[0]?.term).toMatch(/AI/i);
  });

  it("renders mission rubric tables without enabling submission", () => {
    const pkg = readPackage("en", "intro-m1-l1-what-is-ai");
    const mission = adaptLocalizedPackageToPreviewContent(pkg).find(
      (section) => section.block.kind === "missionPreview",
    );

    expect(mission).toBeTruthy();
    if (!mission || mission.block.kind !== "missionPreview") return;
    expect(mission.block.rubric.length).toBeGreaterThan(0);
    expect(mission.block.intro.length).toBeGreaterThan(0);
  });

  it("does not expose quiz correctIndex in preview blocks", () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    const pkg = readPackage("en", lessonId);
    const quizSection = pkg.sections.find((section) => section.quiz?.options?.length);
    expect(quizSection?.quiz).toBeTruthy();
    const runtimeQuiz = quizSection!.quiz!;
    const expectedOptionCount = runtimeQuiz.options.length;

    expect(typeof runtimeQuiz.correctIndex).toBe("number");
    expect(Number.isInteger(runtimeQuiz.correctIndex)).toBe(true);
    expect(runtimeQuiz.correctIndex!).toBeGreaterThanOrEqual(0);
    expect(runtimeQuiz.correctIndex!).toBeLessThan(expectedOptionCount);

    const liveItem = adaptPackageQuizToQuizItem(lessonId, runtimeQuiz, 0);
    expect([...liveItem.options]).toEqual([...runtimeQuiz.options]);
    expect(liveItem.correctIndex).toBe(runtimeQuiz.correctIndex);

    const quiz = adaptLocalizedPackageToPreviewContent(pkg).find(
      (section) => section.block.kind === "quizPreview",
    );

    expect(quiz).toBeTruthy();
    if (!quiz || quiz.block.kind !== "quizPreview") return;
    expect(quiz.block.options.length).toBe(expectedOptionCount);
    expect(quiz.block.options).toEqual(
      runtimeQuiz.options.map(cleanPreviewQuizOption).filter(Boolean),
    );
    expect(serializedPreviewText([quiz])).not.toMatch(/correctIndex/i);
    expect(quiz.block.options.join(" ")).not.toMatch(/^\*\*Correct Answer/i);
  });

  it("uses LTR body direction for EN and RTL for ar-Gulf", () => {
    expect(previewBodyDirection("en")).toBe("ltr");
    expect(previewBodyDirection("ar-Gulf")).toBe("rtl");
    expect(previewBodyDirection("ar-MSA")).toBe("rtl");
  });

  it("adapts business lesson preview with comparison or table content", () => {
    const pkg = readPackage("en", "business-m1-l2-reactive-vs-proactive");
    const sections = adaptLocalizedPackageToPreviewContent(pkg);

    expect(sections.length).toBeGreaterThan(3);
    expect(
      sections.some(
        (section) =>
          section.block.kind === "comparison" ||
          section.block.kind === "dataTable" ||
          section.block.kind === "paragraphs",
      ),
    ).toBe(true);
  });

  it("strict hygiene: 100 lessons x 3 locales have no internal label leaks", () => {
    const failures: string[] = [];
    let passCount = 0;

    for (const locale of PACKAGE_LOCALES) {
      const lessonIds = [...getPackageLessonIds(locale)].sort();
      expect(lessonIds.length).toBe(100);

      for (const lessonId of lessonIds) {
        const access = resolveRouteLessonAccess(
          lessonId,
          parseLessonPreviewSearch({ locale, previewLocale: "1" }),
        );
        if (access.contentSource !== "locale-package-json") {
          failures.push(`${locale}/${lessonId}: route access ${access.contentSource}`);
          continue;
        }

        const pkg = readPackage(locale, lessonId);
        const sections = adaptLocalizedPackageToPreviewContent(pkg);
        if (sections.length === 0) {
          failures.push(`${locale}/${lessonId}: adapter produced no sections`);
          continue;
        }

        const blob = serializedPreviewText(sections);
        const leaks = findPreviewInternalLabelLeaks(blob);
        if (leaks.length > 0) {
          failures.push(`${locale}/${lessonId}: ${leaks.join(", ")}`);
          continue;
        }

        if (blob.match(/correctIndex/i)) {
          failures.push(`${locale}/${lessonId}: correctIndex leak`);
          continue;
        }

        const direction = previewBodyDirection(locale);
        if (locale === "en" && direction !== "ltr") {
          failures.push(`${locale}/${lessonId}: expected ltr direction`);
          continue;
        }
        if (locale !== "en" && direction !== "rtl") {
          failures.push(`${locale}/${lessonId}: expected rtl direction`);
          continue;
        }

        passCount += 1;
      }
    }

    expect(failures).toEqual([]);
    expect(passCount).toBe(300);
  });

  it("strict hygiene: compound orientation headings are stripped in adapted output", () => {
    const pkg = readPackage("en", "builder-m7-l1-tables-columns");
    const blob = serializedPreviewText(adaptLocalizedPackageToPreviewContent(pkg));

    expect(blob).not.toContain("Orientation —");
    expect(blob).not.toContain("Screenshot block (intent)");
    expect(
      adaptLocalizedPackageToPreviewContent(pkg).some(
        (section) => section.title === "Lesson Start",
      ),
    ).toBe(true);
  });
});
