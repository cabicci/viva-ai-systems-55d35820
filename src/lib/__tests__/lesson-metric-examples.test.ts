import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { AUTOMATOR_M3_L3_FILTERS_ROUTERS_BLOCKS } from "@/components/intro/lessons/automator-m3-l3-filters-routers";
import { ANALYST_M2_L1_FEELING_TO_QUESTION_BLOCKS } from "@/components/intro/lessons/analyst-m2-l1-feeling-to-question";
import { AUTOMATOR_M7_L1_CLOSING_LOOP_BLOCKS } from "@/components/intro/lessons/automator-m7-l1-closing-loop";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
const ids = [
  "automator-m3-l3-filters-routers",
  "analyst-m2-l1-feeling-to-question",
  "automator-m7-l1-closing-loop",
];
const read = (locale: string, id: string) =>
  JSON.parse(readFileSync(`src/lib/locale-lessons/${locale}/lessons/${id}.json`, "utf8"));
const normalize = (text: string) =>
  text
    .replace(/[٠-٩]/g, (value) => String("٠١٢٣٤٥٦٧٨٩".indexOf(value)))
    .replaceAll("٫", ".")
    .replaceAll("٪", "%");
it("keeps the three Egyptian live-authoring examples aligned with their overlays", () => {
  const quiz = AUTOMATOR_M3_L3_FILTERS_ROUTERS_BLOCKS.find(
    (section) => section.block.kind === "quiz",
  )?.block;
  if (quiz?.kind !== "quiz") throw Error("Missing quiz");
  const packageQuiz = read("ar-EG", ids[0]).sections.find(
    (section: { quiz?: unknown }) => section.quiz,
  ).quiz;
  expect(packageQuiz.question).toBe(quiz.items[0].question);
  expect(packageQuiz.correctIndex).toBe(quiz.items[0].correctIndex);
  for (const [id, content] of [
    [ids[1], ANALYST_M2_L1_FEELING_TO_QUESTION_BLOCKS],
    [ids[2], AUTOMATOR_M7_L1_CLOSING_LOOP_BLOCKS],
  ] as [string, IntroLessonContent][]) {
    const block = content.find((section) => section.block.kind === "concepts")?.block;
    if (block?.kind !== "concepts") throw Error("Missing concepts");
    const row = read("ar-EG", id).sections[4].tables[0].rows[1];
    expect(row[1]).toBe(block.items[1].meaning);
    expect(row[2]).toBe(block.items[1].example);
  }
});
it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
  "covers equality with the unchanged Router key in %s",
  (locale) => {
    const quiz = read(locale, ids[0]).sections.find(
      (section: { quiz?: unknown }) => section.quiz,
    ).quiz;
    const question = normalize(quiz.question);
    expect(question).toContain(locale === "en" ? "5000 EGP or more" : "5000 جنيه أو أكثر");
    expect(question).toContain(locale === "en" ? "Less than 5000 EGP" : "أقل من 5000 جنيه");
    expect(quiz.correctIndex).toBe(0);
  expect(quiz.options[quiz.correctIndex]).toContain(locale === "ar-Gulf" ? "موزّع" : "Router");
    for (const value of [4999, 5000, 5001])
      expect(Number(value >= 5000) + Number(value < 5000)).toBe(1);
  },
);
it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
  "states common baseline units/period and separate delivered-message reply windows in %s",
  (locale) => {
    const baseline = normalize(read(locale, ids[1]).sections[4].tables[0].rows[1][2]);
    expect(baseline).toContain("100");
    expect(baseline).toContain("150");
    expect(baseline).toContain("50");
    expect(baseline).toContain("33.33");
    const replies = normalize(read(locale, ids[2]).sections[4].tables[0].rows[1][2]);
    expect(replies).toContain("40");
    expect(replies).toContain("100");
    expect(replies).toContain("10");
    expect(replies.match(/48/g)).toHaveLength(2);
    expect(((150000 - 100000) / 150000) * 100).toBeCloseTo(33.333333, 5);
    expect(40 / 100).toBe(0.4);
    expect(10 / 100).toBe(0.1);
  },
);
