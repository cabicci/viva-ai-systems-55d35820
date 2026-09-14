import { describe, expect, it } from "vitest";
import {
  buildMissionEvaluationPrompts,
  MISSION_AI_LOCALES,
  type MissionAIPromptLocale,
} from "@/lib/mission-ai-prompts";

const rubric = [
  {
    label: "Canonical criterion",
    weight: 100,
    criteria: ["Canonical rubric requirement"],
  },
] as const;

const localeCases: ReadonlyArray<[MissionAIPromptLocale, string, string]> = [
  ["ar-EG", "بالعربية المصرية", "الدرس:"],
  ["ar-MSA", "بالعربية الفصحى", "الدرس:"],
  ["ar-Gulf", "بالعربية الخليجية", "الدرس:"],
  ["en", "clear English", "Lesson:"],
];

describe("mission AI evaluation prompts", () => {
  it("supports exactly the current application locales", () => {
    expect(MISSION_AI_LOCALES).toEqual(["ar-EG", "ar-MSA", "ar-Gulf", "en"]);
  });

  it.each(localeCases)(
    "selects the %s language while preserving grading inputs and JSON contract",
    (locale, languageMarker, lessonMarker) => {
      const prompts = buildMissionEvaluationPrompts({
        locale,
        passThreshold: 50,
        lessonTitle: "Canonical lesson title",
        missionPrompt: "Canonical mission prompt",
        rubric,
        submissionText: "Stored learner submission",
      });

      expect(prompts.systemPrompt).toContain(languageMarker);
      expect(prompts.systemPrompt).toContain("overall score = ∑(score × weight) / 100");
      expect(prompts.systemPrompt).toContain("50");
      expect(prompts.userPrompt).toContain(lessonMarker);
      expect(prompts.userPrompt).toContain("Canonical lesson title");
      expect(prompts.userPrompt).toContain("Canonical mission prompt");
      expect(prompts.userPrompt).toContain("Canonical criterion");
      expect(prompts.userPrompt).toContain("Canonical rubric requirement");
      expect(prompts.userPrompt).toContain("Stored learner submission");

      for (const key of [
        "overallScore",
        "passed",
        "perCriterion",
        "label",
        "score",
        "feedback",
        "summary",
        "nextStep",
        "socraticQuestion",
      ]) {
        expect(prompts.userPrompt).toContain(`"${key}"`);
      }

      if (locale !== "ar-EG") {
        expect(prompts.systemPrompt).not.toContain("بالعربية المصرية");
      }
    },
  );
});
