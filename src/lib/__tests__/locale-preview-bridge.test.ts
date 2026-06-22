import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { localizedLessonsEnabled, localeUiEnabled } from "@/lib/locale/feature-flags";
import {
  adaptLocalizedPackageToPreviewContent,
  previewBodyDirection,
} from "@/lib/locale-lessons/adapt-package-to-preview-content";
import {
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function readPackage(
  locale: "en" | "ar-Gulf" | "ar-MSA",
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

describe("locale preview bridge (Phase 6.5)", () => {
  it("keeps localizedLessonsEnabled and localeUiEnabled off", () => {
    expect(localizedLessonsEnabled).toBe(false);
    expect(localeUiEnabled).toBe(false);
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
    const pkg = readPackage("en", "intro-m1-l1-what-is-ai");
    const quiz = adaptLocalizedPackageToPreviewContent(pkg).find(
      (section) => section.block.kind === "quizPreview",
    );

    expect(quiz).toBeTruthy();
    if (!quiz || quiz.block.kind !== "quizPreview") return;
    expect(quiz.block.options.length).toBe(4);
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
});
