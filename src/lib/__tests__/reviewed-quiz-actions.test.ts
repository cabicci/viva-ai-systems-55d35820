import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import scope from "../../../scripts/locale-lessons/audit-7-97-quiz-actions.json";
import { adaptPackageQuizToQuizItem } from "@/lib/locale-lessons/adapt-package-to-live-quiz";
import { adaptPackageMissionToLiveShape } from "@/lib/locale-lessons/adapt-package-to-live-mission";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
function readPackage(locale: string, lessonId: string): LocalizedLessonPackage {
  return JSON.parse(
    readFileSync(
      path.resolve(
        "src/lib/locale-lessons",
        locale,
        "lessons",
        lessonId + ".json",
      ),
      "utf8",
    ),
  );
}
describe("reviewed action choices", () => {
  it("keeps the recorded18-cell scope with distinct locale ordering", () => {
    expect(scope.cells).toHaveLength(18);
    expect(
      new Set(scope.cells.map((cell) => cell.locale + "::" + cell.lessonId))
        .size,
    ).toBe(18);
    expect(
      scope.cells.some(
        (cell) => cell.correctIndex !== cell.egyptianCorrectIndex,
      ),
    ).toBe(true);
  });
  for (const cell of scope.cells) {
    it(
      cell.locale +
        " " +
        cell.lessonId +
        " retains its key/id and has concrete distinct alternatives",
      () => {
        const pkg = readPackage(cell.locale, cell.lessonId);
        const quiz = pkg.sections.find((section) => section.quiz)!.quiz!;
        const item = adaptPackageQuizToQuizItem(cell.lessonId, quiz, 0);
        expect(item.id).toBe(cell.lessonId + "::quiz::0");
        expect(item.correctIndex).toBe(cell.correctIndex);
        expect(item.options).toHaveLength(3);
        expect(new Set(item.options).size).toBe(3);
        expect(item.options.every((option) => option.trim().length > 8)).toBe(
          true,
        );
        for (const option of item.options) {
          expect(option).not.toMatch(
            /\bunsuitable\b|\binappropriate\b|\birrelevant\b|\bpartial answer\b|خيار غير|إجابة جزئية/i,
          );
        }
        expect(item.explanation.length).toBeGreaterThan(20);
      },
    );
  }
});
describe("risk-qualified mission contract", () => {
  for (const locale of scope.riskLocales) {
    it(
      locale +
        " provides explicit delivery through the existing stable mission adapter",
      () => {
        const pkg = readPackage(locale, scope.riskLessonId);
        const section = pkg.sections.find((section) => section.mission)!;
        const before = JSON.stringify(pkg);
        const mission = adaptPackageMissionToLiveShape(
          pkg.lessonId,
          section,
          0,
        );
        expect(mission.missionId).toBe(pkg.lessonId + "::mission");
        expect(mission.rubric.map((row) => row.weight)).toEqual(
          scope.riskMissionWeights,
        );
        expect(mission.rubric.reduce((sum, row) => sum + row.weight, 0)).toBe(
          100,
        );
        expect(mission.prompt).toBe(section.mission!.delivery.join("\n\n"));
        expect(mission.prompt.length).toBeGreaterThan(250);
        expect(JSON.stringify(pkg)).toBe(before);
      },
    );
  }
});
