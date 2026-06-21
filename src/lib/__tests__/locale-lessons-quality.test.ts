import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { AdaptedLessonPackage, AdaptationTargetLocale } from "@/lib/locale-lessons/types";
import { EN_SYSTEM_PROMPT } from "../../../scripts/locale-lessons/prompts/en.ts";
import { AR_GULF_SYSTEM_PROMPT } from "../../../scripts/locale-lessons/prompts/ar-gulf.ts";
import { ADAPTATION_SYSTEM_RULES } from "../../../scripts/locale-lessons/prompts/adaptation-system.ts";
import {
  detectBannedPhraseWarnings,
  detectEnglishTitleMismatchWarning,
  detectGenericBadEnglishTitleWarning,
  detectGulfRegisterInconsistencyWarning,
  detectQuizExplanationSemanticWarnings,
  detectQuizIntegrityWarnings,
  detectQuizMarkdownLeakageWarnings,
  detectQuizOptionPrefixWarnings,
  hasQuizOptionPrefixLeak,
  isGenericBadEnglishTitle,
  normalizeQuizOptionText,
  sanitizeAdaptedLessonMarkdown,
  stripBannedPhrasesFromText,
  stripQuizKeyLeaksFromMarkdown,
  stripQuizOptionPrefix,
  validateAdaptedLessonWarnings,
} from "../../../scripts/locale-lessons/lib/quality-warnings.ts";
import {
  finalizeAdaptedPackage,
  validateAdaptedLessonPackage,
} from "../../../scripts/locale-lessons/lib/validate-adapted-lesson.ts";
import {
  CORRUPTED_SOURCE_QUIZ_OVERRIDES,
  applyDeterministicQuizFallback,
  getCorruptedQuizFallback,
  identifyCorruptedSourceQuizIssues,
  lockQuizOptionsToSourceStructure,
  resolveSourceQuizStructure,
} from "../../../scripts/locale-lessons/lib/quiz-structure.ts";
import { QUALITY_RETRY_QUIZ_RULES } from "../../../scripts/locale-lessons/lib/adaptation-retry-prompt.ts";
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
    expect(ADAPTATION_SYSTEM_RULES).toContain("QUIZ STRUCTURE");
    expect(ADAPTATION_SYSTEM_RULES).toContain("localizes text only");
    expect(EN_SYSTEM_PROMPT).toContain("exactly equal to titleEn");
    expect(EN_SYSTEM_PROMPT).toContain("numbering prefixes");
    expect(QUALITY_RETRY_QUIZ_RULES).toContain("localize quiz.options[i] text only");
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

    expect(warning).toMatch(/generic orientation title/);
  });

  it("flags generic English titles such as Getting Started and Introduction to the Lesson", () => {
    expect(isGenericBadEnglishTitle("Getting Started")).toBe(true);
    expect(isGenericBadEnglishTitle("Introduction to the Lesson")).toBe(true);
    expect(isGenericBadEnglishTitle("Understanding Dashboards")).toBe(true);

    const warning = detectGenericBadEnglishTitleWarning({
      locale: "en",
      lessonId: "test",
      title: "Getting Started",
      titleEn: "Idea to Page",
      sections: [],
      canonicalVersion: "1",
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: "test",
        canonicalVersion: "1",
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    });

    expect(warning).toMatch(/generic orientation title/);
  });

  it("flags English title mismatch for non-intro lessons from pilot artifact review", async () => {
    const analystSource = await loadMsaLessonPackage(
      "analyst-m1-l1-from-automation-to-insight",
    );
    const analystWarning = detectEnglishTitleMismatchWarning(analystSource, {
      locale: "en",
      lessonId: analystSource.lessonId,
      titleEn: "From Automation to Insight",
      title: "Introduction to the Lesson",
      sections: [],
      canonicalVersion: analystSource.canonicalVersion,
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: analystSource.lessonId,
        canonicalVersion: analystSource.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    });
    expect(analystWarning).toMatch(/Introduction to the Lesson/);

    const builderSource = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const builderWarning = detectEnglishTitleMismatchWarning(builderSource, {
      locale: "en",
      lessonId: builderSource.lessonId,
      titleEn: "Idea to Page",
      title: "Getting Started",
      sections: [],
      canonicalVersion: builderSource.canonicalVersion,
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: builderSource.lessonId,
        canonicalVersion: builderSource.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    });
    expect(builderWarning).toMatch(/Getting Started/);
  });

  it("aligns EN catalog titles to titleEn for analyst and builder pilot lessons", async () => {
    for (const [lessonId, badTitle] of [
      ["analyst-m1-l1-from-automation-to-insight", "Introduction to the Lesson"],
      ["builder-m6-l1-idea-to-page", "Getting Started"],
    ] as const) {
      const source = await loadMsaLessonPackage(lessonId);
      const finalized = finalizeAdaptedPackage(
        source,
        {
          ...source,
          locale: "en",
          title: badTitle,
          titleEn: source.titleEn,
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

      expect(finalized.title).toBe(source.titleEn);
      expect(detectEnglishTitleMismatchWarning(source, finalized)).toBeNull();
    }
  });

  it("detects banned production-leak phrases in learner content", () => {
    const warnings = detectBannedPhraseWarnings({
      locale: "en",
      lessonId: "test",
      title: "Test",
      sections: [
        {
          role: "Quiz",
          heading: "Quiz",
          contentMarkdown:
            "The correct answer is preserved from the Egyptian production.",
          bullets: [],
          tables: [],
          quiz: {
            question: "Pick one",
            correctIndex: 0,
            options: ["A", "B"],
            explanation: "refer to the text above",
          },
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

    expect(warnings.some((warning) => warning.includes("egyptian production"))).toBe(
      true,
    );
    expect(warnings.some((warning) => warning.includes("refer to the text above"))).toBe(
      true,
    );
  });

  it("strips banned production-leak phrases from markdown", () => {
    const cleaned = stripBannedPhrasesFromText(
      "الإجابة الصحيحة محفوظة من الإنتاج المصري — راجع النص أعلاه للسياق الكامل.",
    );
    expect(cleaned).not.toMatch(/الإنتاج المصري/);
    expect(cleaned).not.toMatch(/راجع النص أعلاه/);
  });

  it("flags broken analyst-m4 quiz artifact issues before repair", async () => {
    const source = await loadMsaLessonPackage("analyst-m4-automated-dashboard");
    const brokenArtifactQuiz = {
      role: "Quiz" as const,
      heading: "Quiz",
      contentMarkdown:
        "**Correct Answer:** Automate the number you read weekly.\n- Option B\n- Option C",
      bullets: [],
      tables: [],
      quiz: {
        correctIndex: 0,
        options: ["Option B", "Option C"],
        explanation:
          "The correct answer is preserved from the Egyptian production.",
      },
    };

    const warnings = validateAdaptedLessonWarnings(
      source,
      {
        locale: "en",
        lessonId: source.lessonId ?? "analyst-m4-automated-dashboard",
        titleEn: source.titleEn ?? "",
        title: source.titleEn ?? "",
        sections: source.sections.map((section) =>
          section.role === "Quiz" ? brokenArtifactQuiz : section,
        ),
        canonicalVersion: source.canonicalVersion,
        adaptedFrom: {
          locale: "ar-MSA",
          lessonId: source.lessonId,
          canonicalVersion: source.canonicalVersion,
          sourcePackagePath: "x",
        },
        generatedAt: "2026-06-20T00:00:00.000Z",
      },
      "en",
    );

    expect(warnings.some((warning) => warning.includes("missing clear quiz question"))).toBe(
      true,
    );
    expect(warnings.some((warning) => warning.includes("egyptian production"))).toBe(
      true,
    );
    expect(
      warnings.some((warning) => warning.includes("analyst-m4-automated-dashboard")),
    ).toBe(true);
  });

  it("repairs analyst-m4 quiz question, options, and banned phrases during finalization", async () => {
    const source = await loadMsaLessonPackage("analyst-m4-automated-dashboard");
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");

    const broken = {
      ...source,
      locale: "en",
      title: "Automated Dashboard",
      titleEn: "Automated Dashboard",
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex) return section;
        return {
          ...section,
          contentMarkdown:
            "**Correct Answer:** Automate the metric you read weekly after two manual weeks.",
          bullets: [
            "Automate the metric you read weekly after two manual weeks.",
            "Automate all four numbers at once before trying manually.",
            "Build ten extra charts in Looker Studio.",
          ],
          quiz: {
            correctIndex: 0,
            options: [
              "Automate all four numbers at once before trying manually.",
              "Build ten extra charts in Looker Studio.",
            ],
            explanation:
              "The correct answer is preserved from the Egyptian production — refer to the text above.",
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    } as AdaptedLessonPackage;

    const finalized = finalizeAdaptedPackage(
      source,
      broken,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );

    const quiz = finalized.sections.find((section) => section.role === "Quiz")?.quiz;
    expect(quiz?.question).toMatch(/four numbers/i);
    expect(quiz?.options).toHaveLength(3);
    expect(quiz?.options?.[0]).toMatch(/weekly/i);
    expect(quiz?.correctIndex).toBe(0);
    expect(finalized.title).toBe("Automated Dashboard");
    expect(detectBannedPhraseWarnings(finalized)).toEqual([]);
    expect(detectQuizIntegrityWarnings(source, finalized)).toEqual([]);
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
    const adaptedBroken = {
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
    } as AdaptedLessonPackage;

    const preFinalizeWarnings = validateAdaptedLessonWarnings(source, adaptedBroken, "en");
    expect(
      preFinalizeWarnings.some((warning) => warning.includes("generic orientation title")),
    ).toBe(true);

    const finalized = finalizeAdaptedPackage(
      source,
      adaptedBroken,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );

    const errors = validateAdaptedLessonPackage(source, finalized, "en");
    const postFinalizeWarnings = validateAdaptedLessonWarnings(source, finalized, "en");

    expect(errors.length).toBeGreaterThan(0);
    expect(finalized.title).toBe("What Is AI");
    expect(
      postFinalizeWarnings.some((warning) => warning.includes("generic orientation title")),
    ).toBe(false);
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

  it("aligns EN orientation-copy titles to titleEn during finalization", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const finalized = finalizeAdaptedPackage(
      source,
      {
        ...source,
        locale: "en",
        title: "What Will You Understand?",
        titleEn: "What Is AI",
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

    expect(finalized.title).toBe("What Is AI");
    expect(detectEnglishTitleMismatchWarning(source, finalized)).toBeNull();
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

  it("committed EN intro sample has corrected title aligned with titleEn", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const introEn = readSample("en", "intro-m1-l1-what-is-ai");

    expect(introEn.title).toBe("What Is AI");
    expect(introEn.titleEn).toBe("What Is AI");
    expect(detectEnglishTitleMismatchWarning(source, introEn)).toBeNull();
  });

  it("committed sample packages have no quality warnings after regeneration", async () => {
    const enWarnings = await collectSamplePackageWarnings("en");
    const gulfWarnings = await collectSamplePackageWarnings("ar-Gulf");

    expect(enWarnings).toEqual([]);
    expect(gulfWarnings).toEqual([]);
  });

  it("strips English and Arabic/Gulf option numbering prefixes from quiz options only", () => {
    expect(stripQuizOptionPrefix("Option 1: Open ChatGPT and try something small.")).toBe(
      "Open ChatGPT and try something small.",
    );
    expect(stripQuizOptionPrefix("Option 2: Read a long article.")).toBe(
      "Read a long article.",
    );
    expect(stripQuizOptionPrefix("خيار ١: تفتح ChatGPT وتطلب شيء بسيط.")).toBe(
      "تفتح ChatGPT وتطلب شيء بسيط.",
    );
    expect(stripQuizOptionPrefix("الخيار ٢: تقرأ مقال طويل.")).toBe("تقرأ مقال طويل.");
    expect(stripQuizOptionPrefix("1. Try a small prompt.")).toBe("Try a small prompt.");
    expect(stripQuizOptionPrefix("A) Ask ChatGPT first.")).toBe("Ask ChatGPT first.");
    expect(hasQuizOptionPrefixLeak("Option 3: Still prefixed")).toBe(true);
    expect(normalizeQuizOptionText("Option 1: Open ChatGPT and try something small.")).toBe(
      "Open ChatGPT and try something small.",
    );
  });

  it("flags intro quiz when explanation supports option 0 but correctIndex is 1", () => {
    const warnings = detectQuizExplanationSemanticWarnings(
      "intro-m1-l1-what-is-ai",
      "What is the best way to start understanding AI today?",
      [
        "Open ChatGPT and try something simple from your day.",
        "Read a long article about AI before trying anything.",
        "Wait until you finish a full course.",
      ],
      1,
      "One small real attempt teaches you more than a long read.",
    );

    expect(
      warnings.some((warning) => warning.includes("supports option at index 0")),
    ).toBe(true);
  });

  it("locks intro quiz structure by index and preserves correctIndex 1", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");
    const resolved = resolveSourceQuizStructure(
      source.sections[quizIndex],
      source.lessonId,
    );
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.structure.optionCount).toBe(4);
    expect(resolved.structure.correctIndex).toBe(1);

    const localized = {
      ...source,
      locale: "en",
      title: "What Is AI",
      titleEn: "What Is AI",
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex || !section.quiz) return section;
        return {
          ...section,
          quiz: {
            question: "What is the best way to start understanding AI today?",
            correctIndex: 1,
            options: [
              "Read as many articles about AI as you can before trying anything.",
              "Open ChatGPT or Gemini and ask it something simple from your day.",
              "Wait until you have taken a full course on how AI works technically.",
              "Ask a friend who already uses AI to explain everything to you first.",
            ],
            explanation:
              "One small real attempt teaches you more than a long read.",
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    } as AdaptedLessonPackage;

    const finalized = finalizeAdaptedPackage(
      source,
      localized,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );
    const quiz = finalized.sections.find((section) => section.role === "Quiz")?.quiz;

    expect(quiz?.options).toHaveLength(4);
    expect(quiz?.correctIndex).toBe(1);
    expect(quiz?.options?.[1]).toMatch(/ChatGPT/i);
    expect(detectQuizIntegrityWarnings(source, finalized)).toEqual([]);
  });

  it("does not reorder intro quiz options when model swaps order at the same indices", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");

    const misordered = {
      ...source,
      locale: "en",
      title: "What Is AI",
      titleEn: "What Is AI",
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex || !section.quiz) return section;
        return {
          ...section,
          quiz: {
            question: "What is the best way to start understanding AI today?",
            correctIndex: 1,
            options: [
              "Open ChatGPT and try something simple from your day.",
              "Read a long article about AI before trying anything.",
              "Wait until you finish a full course.",
              "Ask a friend to explain everything first.",
            ],
            explanation:
              "One small real attempt teaches you more than a long read.",
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    } as AdaptedLessonPackage;

    const finalized = finalizeAdaptedPackage(
      source,
      misordered,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );
    const quiz = finalized.sections.find((section) => section.role === "Quiz")?.quiz;

    expect(quiz?.correctIndex).toBe(1);
    expect(quiz?.options?.[0]).toMatch(/ChatGPT/i);
    expect(quiz?.options?.[1]).toMatch(/Read a long article/i);
    expect(
      detectQuizExplanationSemanticWarnings(
        source.lessonId,
        quiz?.question ?? "",
        quiz?.options ?? [],
        quiz?.correctIndex ?? -1,
        quiz?.explanation ?? "",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("rejects model attempts to change quiz option count or correctIndex", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");
    const resolved = resolveSourceQuizStructure(
      source.sections[quizIndex],
      source.lessonId,
    );
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const drifted = {
      ...source,
      locale: "en",
      title: source.titleEn,
      titleEn: source.titleEn,
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex || !section.quiz) return section;
        return {
          ...section,
          quiz: {
            ...section.quiz,
            correctIndex: 2,
            options: ["Only one option"],
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    } as AdaptedLessonPackage;

    const warnings = detectQuizIntegrityWarnings(source, drifted);
    expect(
      warnings.some((warning) =>
        warning.includes(`expected exactly ${resolved.structure.optionCount}`),
      ),
    ).toBe(true);
    expect(
      warnings.some((warning) => warning.includes("correctIndex must remain")),
    ).toBe(true);

    const finalized = finalizeAdaptedPackage(
      source,
      drifted,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );
    const quiz = finalized.sections.find((section) => section.role === "Quiz")?.quiz;
    expect(quiz?.options).toHaveLength(resolved.structure.optionCount);
    expect(quiz?.correctIndex).toBe(resolved.structure.correctIndex);
  });

  it("locks quiz options by source index while allowing localized option text", () => {
    const locked = lockQuizOptionsToSourceStructure(
      {
        optionCount: 3,
        correctIndex: 1,
        sourceSchemaValid: true,
        usesOverride: false,
        sourceOptionTextsByIndex: ["A", "B", "C"],
      },
      [
        "Localized A",
        "Localized B",
        "Localized C",
      ],
      [],
    );

    expect(locked.options).toEqual([
      "Localized A",
      "Localized B",
      "Localized C",
    ]);
    expect(locked.correctIndex).toBe(1);
  });

  it("identifies corrupted ar-MSA pilot quizzes and explicit overrides", async () => {
    for (const lessonId of Object.keys(CORRUPTED_SOURCE_QUIZ_OVERRIDES)) {
      const source = await loadMsaLessonPackage(lessonId);
      const issues = identifyCorruptedSourceQuizIssues(source);
      expect(
        issues.some((issue) => issue.includes("explicit override")),
      ).toBe(true);
    }
  });

  it("intro-m1-l1-what-is-ai keeps hands-on answer at correctIndex 1 after finalization", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const introEn = readSample("en", "intro-m1-l1-what-is-ai");
    const quiz = introEn.sections.find((section) => section.role === "Quiz")?.quiz;

    expect(quiz?.correctIndex).toBe(1);
    expect(quiz?.options?.[1]).toMatch(/ChatGPT|Gemini/i);
    expect(detectQuizExplanationSemanticWarnings(
      source.lessonId,
      quiz?.question ?? "",
      quiz?.options ?? [],
      quiz?.correctIndex ?? -1,
      quiz?.explanation ?? "",
    )).toEqual([]);
  });

  it("intro ar-Gulf override provides four non-empty fallback options", () => {
    const fallback = getCorruptedQuizFallback(
      "intro-m1-l1-what-is-ai",
      "ar-Gulf",
    );
    expect(fallback).not.toBeNull();
    expect(fallback?.options).toHaveLength(4);
    expect(fallback?.correctIndex).toBe(1);
    expect(fallback?.options.every((option) => option.trim().length > 0)).toBe(true);
  });

  it("finalizes intro ar-Gulf with empty model options using deterministic fallback", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");

    const emptyModelOutput = {
      ...source,
      locale: "ar-Gulf",
      title: "وش هو الذكاء الاصطناعي؟",
      titleEn: source.titleEn,
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex || !section.quiz) return section;
        return {
          ...section,
          quiz: {
            correctIndex: 1,
            options: [],
            explanation: "",
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    } as AdaptedLessonPackage;

    const preFinalizeWarnings = detectQuizIntegrityWarnings(source, emptyModelOutput);
    expect(
      preFinalizeWarnings.some((warning) => warning.includes("expected exactly 4 quiz options")),
    ).toBe(true);

    const finalized = finalizeAdaptedPackage(
      source,
      emptyModelOutput,
      "ar-Gulf",
      "x",
      "2026-06-20T00:00:00.000Z",
    );
    const quiz = finalized.sections.find((section) => section.role === "Quiz")?.quiz;

    expect(quiz?.options).toHaveLength(4);
    expect(quiz?.options?.every((option) => option.trim().length > 0)).toBe(true);
    expect(quiz?.correctIndex).toBe(1);
    expect(quiz?.options?.[1]).toMatch(/ChatGPT|Gemini/u);
    expect(detectQuizOptionPrefixWarnings(finalized)).toEqual([]);
    expect(validateAdaptedLessonWarnings(source, finalized, "ar-Gulf")).toEqual([]);
  });

  it("throws when empty options have no deterministic fallback", () => {
    expect(() =>
      applyDeterministicQuizFallback({
        lessonId: "builder-m6-l1-idea-to-page",
        targetLocale: "en",
        usesOverride: false,
        lockedOptions: ["", "", ""],
        question: "Pick one",
        explanation: "Because.",
        sourceOptionTextsByIndex: ["", "", ""],
        indexAlignedAdaptedOptions: false,
      }),
    ).toThrow(/empty quiz options/);
  });

  it("analyst quiz cases do not leak Option or خيار prefixes after finalization", async () => {
    const source = await loadMsaLessonPackage("analyst-m4-automated-dashboard");
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");

    const prefixed = {
      ...source,
      locale: "en",
      title: "Automated Dashboard",
      titleEn: source.titleEn,
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex) return section;
        return {
          ...section,
          quiz: {
            correctIndex: 0,
            options: [
              "Option 1: Automate the metric you read weekly after two manual weeks.",
              "Choice 2: Automate all four numbers at once before trying manually.",
              "خيار ٣: Build ten extra charts in Looker Studio.",
            ],
            explanation: "Start with one metric you already track weekly.",
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    } as AdaptedLessonPackage;

    const finalized = finalizeAdaptedPackage(
      source,
      prefixed,
      "en",
      "x",
      "2026-06-20T00:00:00.000Z",
    );

    expect(detectQuizOptionPrefixWarnings(finalized)).toEqual([]);
    finalized.sections
      .find((section) => section.role === "Quiz")
      ?.quiz?.options?.forEach((option) => {
        expect(option).not.toMatch(/^Option\s*\d+/i);
        expect(option).not.toMatch(/^Choice\s*\d+/i);
        expect(option).not.toMatch(/^خيار/u);
      });
  });

  it("detects prefixed quiz options in adapted packages", () => {
    const warnings = detectQuizOptionPrefixWarnings({
      locale: "en",
      lessonId: "analyst-m3-l2-ai-summarization",
      title: "Test",
      sections: [
        {
          role: "Quiz",
          heading: "Quiz",
          contentMarkdown: "Question?",
          bullets: [],
          tables: [],
          quiz: {
            question: "Pick one",
            correctIndex: 0,
            options: ["Option 1: Summarize the report.", "Option 2: Ignore it."],
            explanation: "Summaries help.",
          },
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

    expect(warnings.some((warning) => warning.includes("prefix leakage"))).toBe(true);
  });

  it("committed Gulf and EN samples have no quiz key leakage in markdown", () => {
    const sampleLessonIds = [
      "intro-m1-l1-what-is-ai",
      "builder-m6-l1-idea-to-page",
      "business-m1-l2-reactive-vs-proactive",
    ] as const;

    for (const locale of ["en", "ar-Gulf"] as const) {
      for (const lessonId of sampleLessonIds) {
        const sample = readSample(locale, lessonId);
        const leakageWarnings = detectQuizMarkdownLeakageWarnings(sample);

        expect(leakageWarnings).toEqual([]);
      }
    }
  });
});
