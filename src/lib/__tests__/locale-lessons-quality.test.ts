import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { AdaptedLessonPackage, AdaptationTargetLocale } from "@/lib/locale-lessons/types";
import { EN_SYSTEM_PROMPT } from "../../../scripts/locale-lessons/prompts/en.ts";
import { AR_GULF_SYSTEM_PROMPT } from "../../../scripts/locale-lessons/prompts/ar-gulf.ts";
import { ADAPTATION_SYSTEM_RULES } from "../../../scripts/locale-lessons/prompts/adaptation-system.ts";
import {
  detectEnglishTitleMismatchWarning,
  detectGulfRegisterInconsistencyWarning,
  detectQuizMarkdownLeakageWarnings,
  sanitizeAdaptedLessonMarkdown,
  stripQuizKeyLeaksFromMarkdown,
  validateAdaptedLessonWarnings,
} from "../../../scripts/locale-lessons/lib/quality-warnings.ts";
import {
  finalizeAdaptedPackage,
  validateAdaptedLessonPackage,
} from "../../../scripts/locale-lessons/lib/validate-adapted-lesson.ts";
import { collectSamplePackageWarnings } from "../../../scripts/locale-lessons/generate-localized-samples.ts";
import {
  loadMsaLessonPackage,
  validateMsaSourcePackage,
} from "../../../scripts/locale-lessons/lib/source-package.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function readSample(locale: AdaptationTargetLocale, lessonId: string): AdaptedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as AdaptedLessonPackage;
}

describe("locale-lessons adaptation quality checks", () => {
  it("includes title and quiz cleanup rules in adaptation prompts", () => {
    expect(ADAPTATION_SYSTEM_RULES).toContain("TITLE RULES");
    expect(ADAPTATION_SYSTEM_RULES).toContain("What Will You Understand?");
    expect(ADAPTATION_SYSTEM_RULES).toContain("correctIndex");
    expect(EN_SYSTEM_PROMPT).toContain("align title with titleEn");
    expect(AR_GULF_SYSTEM_PROMPT).toContain("وش، ليش، مو، راح");
    expect(AR_GULF_SYSTEM_PROMPT).toContain("Avoid mixing ايش with وش");
  });

  it("flags English title mismatch when title copies orientation copy", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const warning = detectEnglishTitleMismatchWarning(source, {
      locale: "en",
      lessonId: source.lessonId,
      titleEn: "What Is AI",
      title: "What Will You Understand?",
      sections: [],
      canonicalVersion: source.canonicalVersion,
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    });

    expect(warning).toMatch(/orientation copy/);
  });

  it("detects quiz markdown leakage patterns", () => {
    const warnings = detectQuizMarkdownLeakageWarnings({
      locale: "en",
      lessonId: "test",
      title: "Test",
      sections: [
        {
          role: "Quiz",
          heading: "Quiz",
          contentMarkdown: "> **Quiz key (unchanged):** correctIndex: 0",
          bullets: ["**Correct answer (correctIndex: 1):** option"],
          tables: [],
        },
      ],
      canonicalVersion: "1",
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: "test",
        canonicalVersion: "1",
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    });

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((warning) => warning.includes("quiz markdown leakage"))).toBe(
      true,
    );
  });

  it("strips quiz key leaks from markdown during sanitization", () => {
    const cleaned = stripQuizKeyLeaksFromMarkdown(
      "> **Quiz key (unchanged):** correctIndex: 0\n\n**Question:** Pick one.",
    );
    expect(cleaned).not.toMatch(/correctIndex/i);
    expect(cleaned).toContain("**Question:** Pick one.");
  });

  it("flags Gulf register inconsistency when ايش and وش both appear heavily", () => {
    const warning = detectGulfRegisterInconsistencyWarning({
      locale: "ar-Gulf",
      lessonId: "test",
      title: "وش العنوان",
      sections: [
        {
          role: "Orientation",
          heading: "Orientation",
          contentMarkdown: "ايش بتفهم؟ وش راح تسوي؟ ايش بعد الدرس؟ وش بعد؟",
          bullets: [],
          tables: [],
        },
      ],
      canonicalVersion: "1",
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: "test",
        canonicalVersion: "1",
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    });

    expect(warning).toMatch(/Gulf register mixes/);
  });

  it("keeps hard validation errors separate from quality warnings", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const broken = finalizeAdaptedPackage(
      source,
      {
        ...source,
        locale: "en",
        title: "What Will You Understand?",
        titleEn: "What Is AI",
        sections: source.sections.slice(0, 1),
        adaptedFrom: {
          locale: "ar-MSA",
          lessonId: source.lessonId,
          canonicalVersion: source.canonicalVersion,
          sourcePackagePath: "x",
        },
        generatedAt: "2026-06-20T00:00:00.000Z",
      } as AdaptedLessonPackage,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );

    const errors = validateAdaptedLessonPackage(source, broken, "en");
    const warnings = validateAdaptedLessonWarnings(source, broken, "en");

    expect(errors.length).toBeGreaterThan(0);
    expect(warnings.some((warning) => warning.includes("orientation copy"))).toBe(true);
  });

  it("preserves mission yamlIntent/yamlType from source when provider omits them", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const missionSection = source.sections.find((section) => section.role === "Mission");
    expect(missionSection?.mission?.yamlIntent).toBeTruthy();

    const finalized = finalizeAdaptedPackage(
      source,
      {
        ...source,
        locale: "en",
        title: "What Is AI",
        sections: source.sections.map((section) => ({
          ...section,
          mission: section.mission
            ? {
                ...section.mission,
                yamlIntent: undefined,
                yamlType: undefined,
              }
            : section.mission,
        })),
        adaptedFrom: {
          locale: "ar-MSA",
          lessonId: source.lessonId,
          canonicalVersion: source.canonicalVersion,
          sourcePackagePath: "x",
        },
        generatedAt: "2026-06-20T00:00:00.000Z",
      } as AdaptedLessonPackage,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );

    const mission = finalized.sections.find((section) => section.role === "Mission")?.mission;
    expect(mission?.yamlIntent).toBe(missionSection?.mission?.yamlIntent);
    expect(mission?.yamlType).toBe(missionSection?.mission?.yamlType);
  });

  it("sanitizes adapted markdown without changing structured quiz keys", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const adapted = readSample("en", "builder-m6-l1-idea-to-page");
    const quizSection = adapted.sections.find((section) => section.role === "Quiz");
    const originalIndex = quizSection?.quiz?.correctIndex;

    const sanitized = sanitizeAdaptedLessonMarkdown(adapted);
    const sanitizedQuiz = sanitized.sections.find((section) => section.role === "Quiz");

    expect(sanitizedQuiz?.quiz?.correctIndex).toBe(originalIndex);
    expect(sanitizedQuiz?.contentMarkdown).not.toMatch(/Quiz key/i);
    expect(source.sections.length).toBe(adapted.sections.length);
  });

  it("validates ar-MSA source package remains 100/100", async () => {
    const result = await validateMsaSourcePackage();
    expect(result.ok).toBe(true);
    expect(result.foundLessonCount).toBe(100);
  });

  it("does not mutate committed sample JSON files on disk", () => {
    const introEn = readSample("en", "intro-m1-l1-what-is-ai");
    expect(introEn.title).toBe("What Will You Understand?");
    expect(introEn.titleEn).toBe("What Is AI");
  });

  it("detects known quality warnings in committed sample packages", async () => {
    const warnings = await collectSamplePackageWarnings("en");
    expect(
      warnings.some((warning) =>
        warning.includes("intro-m1-l1-what-is-ai") &&
        warning.includes("orientation copy"),
      ),
    ).toBe(true);
    expect(
      warnings.some((warning) =>
        warning.includes("builder-m6-l1-idea-to-page") &&
        warning.includes("quiz markdown leakage"),
      ),
    ).toBe(true);

    const gulfWarnings = await collectSamplePackageWarnings("ar-Gulf");
    expect(
      gulfWarnings.some((warning) =>
        warning.includes("business-m1-l2-reactive-vs-proactive") &&
        warning.includes("quiz markdown leakage"),
      ),
    ).toBe(true);
    expect(warnings.length).toBeGreaterThan(0);
    expect(gulfWarnings.length).toBeGreaterThan(0);
  });
});
