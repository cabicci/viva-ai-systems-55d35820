import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { getUiString } from "@/lib/locale/ui-strings";
import scope from "../../../scripts/locale-lessons/audit-62-mission-restorations.json";
import {
  adaptPackageMissionToLiveShape,
  packageMissionId,
} from "@/lib/locale-lessons/adapt-package-to-live-mission";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import { loadIntroLessonContent } from "@/components/intro/lessons";
import { renderLocalizedLesson } from "@/lib/__tests__/locale-test-utils";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "audit62-test-user" }, loading: false }),
}));
vi.mock("@/components/intro/QuizBlock", () => ({ QuizBlock: () => null }));
vi.mock("@/components/intro/value-hooks", () => ({
  getValueHookForLocale: () => null,
}));
vi.mock("@/lib/mission-evaluation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/mission-evaluation")>()),
  getActiveSubmissionForMission: vi.fn().mockResolvedValue(null),
  getLatestEvaluatedSubmissionForMission: vi.fn().mockResolvedValue(null),
  prepareSubmissionForAttempt: vi.fn(() => {
    throw new Error("No submission authorized in this fixture");
  }),
  submitForEvaluation: vi.fn(() => {
    throw new Error("No submission authorized in this fixture");
  }),
}));
vi.mock("@/lib/mission-ai-evaluation.functions", () => ({
  evaluateMissionWithAI: vi.fn(() => {
    throw new Error("No AI call in this fixture");
  }),
  revealModelMissionAnswer: vi.fn(() => {
    throw new Error("No reveal in this fixture");
  }),
}));
vi.mock("@/lib/mission-skip.functions", () => ({ skipMissionServer: vi.fn() }));
vi.mock("@/lib/learner-events", () => ({ logLearnerEvent: vi.fn() }));
afterEach(cleanup);

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
describe("restored guided mission contracts", () => {
  it("covers twelve lesson tasks in all three translated locales exactly once", () => {
    expect(scope.cells).toHaveLength(36);
    expect(
      new Set(scope.cells.map((cell) => cell.lessonId + "::" + cell.locale))
        .size,
    ).toBe(36);
    for (const id of new Set(scope.cells.map((cell) => cell.lessonId))) {
      expect(
        scope.cells
          .filter((cell) => cell.lessonId === id)
          .map((cell) => cell.locale)
          .sort(),
      ).toEqual(["ar-Gulf", "ar-MSA", "en"]);
    }
  });
  for (const cell of scope.cells) {
    it(
      cell.locale +
        " " +
        cell.lessonId +
        " restores the existing live mission contract and id",
      async () => {
        const pkg = readPackage(cell.locale, cell.lessonId);
        const before = JSON.stringify(pkg);
        const section = pkg.sections.find(
          (section) => section.role === "Mission",
        )!;
        expect(section.mission).toBeTruthy();
        const live = adaptPackageMissionToLiveShape(cell.lessonId, section);
        expect(live.missionId).toBe(packageMissionId(cell.lessonId, 0));
        expect(live.missionId).toBe(cell.lessonId + "::mission");
        expect(live.delivery.length).toBeGreaterThanOrEqual(5);
        expect(live.prompt).toBe(section.mission!.delivery.join("\n\n"));
        expect(live.rubric.map((row) => row.weight)).toEqual(cell.weights);
        expect(live.rubric.reduce((total, row) => total + row.weight, 0)).toBe(
          100,
        );
        const eg = readPackage("ar-EG", cell.lessonId);
        const original = eg.sections.find(
          (section) => section.mission,
        )!.mission!;
        expect(live.rubric.map((row) => row.weight)).toEqual(
          original.rubric.map((row) => row.weight),
        );
        if (cell.locale !== "en") {
          expect(live.intro).not.toBe(original.intro);
          expect(live.prompt).not.toBe(original.delivery.join("\n\n"));
        }
        const canonical = await loadIntroLessonContent(cell.lessonId);
        expect(canonical).toBeTruthy();
        const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);
        const missions = adapted.filter(
          (section) => section.block.kind === "mission",
        );
        expect(missions).toHaveLength(1);
        expect(missions[0].block).toMatchObject({
          kind: "mission",
          missionId: live.missionId,
          lessonId: cell.lessonId,
          intro: live.intro,
          prompt: live.prompt,
        });
        expect(JSON.stringify(pkg)).toBe(before);
      },
    );
  }
});
describe("restored learner input", () => {
  for (const [locale, lessonId] of [
    ["en", "automator-m5-l2-rag-in-n8n"],
    ["ar-Gulf", "automator-m5-l2-rag-in-n8n"],
    ["ar-MSA", "business-m4-l1-premature-scaling"],
  ] as const) {
    it(
      locale +
        " displays the actual answer field and guided instructions without submitting",
      async () => {
        const pkg = readPackage(locale, lessonId);
        const mission = pkg.sections.find(
          (section) => section.mission,
        )!.mission!;
        const view = await renderLocalizedLesson(pkg);
        expect(await screen.findByRole("textbox")).toBeTruthy();
        expect(view.container.textContent).toContain(mission.intro);
        fireEvent.click(
          screen.getByRole("button", {
            name: getUiString(locale, "mission.showSteps"),
          }),
        );
        expect(view.container.textContent).toContain(mission.delivery[0]);
        expect(view.container.textContent).not.toContain("mock-disabled");
        expect(view.container.querySelector("#mission")).toBeTruthy();
      },
    );
  }
});
