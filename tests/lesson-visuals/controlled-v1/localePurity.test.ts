import { describe, expect, it } from "vitest";
import { checkLocalePurity, checkLocalePurityBatch } from "../../../src/lib/lesson-visuals/controlled-v1/localePurity";

describe("controlled-v1 localePurity smoke checks", () => {
  it("does not flag clean ar-MSA text", () => {
    const issue = checkLocalePurity({
      lessonId: "intro-m1-l4-ai-can-cannot",
      locale: "ar-MSA",
      text: "الذكاء الاصطناعي قوي في اللغة، ولكن يجب التحقق من الحقائق قبل الاعتماد عليها.",
    });
    expect(issue).toBeNull();
  });

  it("does not flag clean ar-Gulf text", () => {
    const issue = checkLocalePurity({
      lessonId: "intro-m1-l4-ai-can-cannot",
      locale: "ar-Gulf",
      text: "الذكاء الاصطناعي قوي في اللغة، لكن لازم نتحقق من المعلومات المهمة قبل الاعتماد عليها.",
    });
    expect(issue).toBeNull();
  });

  it("flags heavy ar-EG dialect leakage in ar-MSA/ar-Gulf text", () => {
    const issue = checkLocalePurity({
      lessonId: "intro-m1-l4-ai-can-cannot",
      locale: "ar-MSA",
      text: "النهاردة هتعمل إيه؟ ازاي هتعرف؟ بتاع مين ده؟ عشان كده لازم تتعلم.",
    });
    expect(issue).not.toBeNull();
    expect(issue?.markerHits).toBeGreaterThanOrEqual(4);
  });

  it("checkLocalePurityBatch aggregates only the flagged entries", () => {
    const issues = checkLocalePurityBatch([
      { lessonId: "a", locale: "ar-MSA", text: "نص عربي فصيح سليم تمامًا بدون أي مؤشرات مصرية." },
      { lessonId: "b", locale: "ar-Gulf", text: "النهاردة ازاي بتاع عشان كده هتعمل" },
    ]);
    expect(issues.length).toBe(1);
    expect(issues[0].lessonId).toBe("b");
  });
});
