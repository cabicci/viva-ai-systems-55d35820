import { describe, expect, it } from "vitest";
import {
  buildMissionEvaluationPrompts,
  type MissionAIPromptLocale,
} from "@/lib/mission-ai-prompts";

const cases: Array<{
  locale: MissionAIPromptLocale;
  submission: string;
  rules: string[];
  oldPraiseRule: string;
}> = [
  {
    locale: "ar-EG",
    submission:
      "تمرين افتراضي: الإعلان أ جاب 20 تفاعل من 100 مشاهدة. الإعلان ب جاب 15 من 50. المقارنة موجودة، لكن لسه ما حددتش فترة متساوية. دي مش حملة فعلية.",
    rules: [
      "متخترعش أفعال أو أرقام أو تفاصيل مش مكتوبة",
      "سمّيه مثال افتراضي أو تمرين",
      "بدل ما تنكر وجوده",
      "من غير مديح مصطنع",
    ],
    oldPraiseRule: "ابدأ feedback كل معيار بنقطة قوة واحدة",
  },
  {
    locale: "ar-MSA",
    submission:
      "حالة افتراضية: حقق الإعلان أ 20 تفاعلاً من 100 مشاهدة، وب 15 من 50. قدّمت المقارنة ولم أحدد فترة متساوية. لم أنفذ حملة حقيقية.",
    rules: [
      "لا تختلق أفعالاً أو أرقاماً أو تفاصيل غير مذكورة",
      "تمريناً أو حالة افتراضية",
      "بدلاً من إنكار وجوده",
      "من دون مديح مصطنع",
    ],
    oldPraiseRule: "ابدأ ملاحظات كل معيار بنقطة قوة واحدة",
  },
  {
    locale: "ar-Gulf",
    submission:
      "تمرين افتراضي: الإعلان أ حقق 20 تفاعل من 100 مشاهدة، وب 15 من 50. المقارنة موجودة بس ما حددت فترة متساوية. ما شغلت حملة فعلية.",
    rules: [
      "لا تخترع أفعال أو أرقام أو تفاصيل ما انذكرت",
      "تمرين أو حالة افتراضية",
      "بدل ما تنكر وجوده",
      "من غير مدح مصطنع",
    ],
    oldPraiseRule: "ابدأ feedback كل معيار بنقطة قوة وحدة",
  },
  {
    locale: "en",
    submission:
      "Hypothetical exercise: post A has 20 interactions from 100 views; B has 15 from 50. I included a comparison but not an equal time window. I did not run a real campaign.",
    rules: [
      "Do not invent actions, numbers or unstated details",
      "exercise or hypothetical case",
      "instead of denying its presence",
      "without invented praise",
    ],
    oldPraiseRule: "Start each criterion's feedback with one strength",
  },
];

describe("evidence-grounded mission feedback instructions", () => {
  it.each(cases)(
    "grounds the $locale hypothetical and incomplete-comparison fixture without forced praise",
    ({ locale, submission, rules, oldPraiseRule }) => {
      const rubric = [
        {
          label: "Comparison",
          weight: 60,
          criteria: ["Compare two rates and name an equal time period."],
        },
        {
          label: "Decision",
          weight: 40,
          criteria: ["Name a cautious next test without promising a real outcome."],
        },
      ];
      const before = JSON.stringify(rubric);
      const prompts = buildMissionEvaluationPrompts({
        locale,
        passThreshold: 50,
        lessonTitle: "Synthetic comparison exercise",
        missionPrompt: "Use the supplied hypothetical data only.",
        rubric,
        submissionText: submission,
      });
      for (const rule of rules) expect(prompts.systemPrompt).toContain(rule);
      expect(prompts.systemPrompt).not.toContain(oldPraiseRule);
      expect(prompts.systemPrompt).toContain("50");
      expect(prompts.systemPrompt).toContain("overall score = ∑(score × weight) / 100");
      expect(prompts.userPrompt).toContain(submission);
      expect(prompts.userPrompt).toContain("60%");
      expect(prompts.userPrompt).toContain("40%");
      expect(prompts.userPrompt).toContain(rubric[0].criteria[0]);
      expect(JSON.stringify(rubric)).toBe(before);
      // These deterministic fixtures verify the provider contract, not the truth
      // of an uncalled model's output or the elimination of all hallucinations.
    },
  );
});
