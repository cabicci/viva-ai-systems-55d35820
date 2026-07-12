import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isLessonNavigationMissionLocked,
  type MissionGateState,
} from "@/lib/mission-gate";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const LEARN_ROUTE = path.join(
  REPO_ROOT,
  "src/routes/learn.$pathId.$lessonId.tsx",
);

describe("localized package completion policy", () => {
  it("enables mark-complete on localized package pages", () => {
    const source = readFileSync(LEARN_ROUTE, "utf8");
    expect(source).not.toMatch(
      /const markCompleted = \(\) => \{[\s\S]*?if \(isLocalizedPackagePage\) return;/,
    );
    expect(source).toMatch(/\{!isCompleted && \(/);
    expect(source).not.toMatch(
      /\{!isCompleted && !isLocalizedPackagePage && \(/,
    );
  });

  it("applies mission-gate locking on localized package pages", () => {
    const source = readFileSync(LEARN_ROUTE, "utf8");
    expect(source).toContain("isLessonNavigationMissionLocked(missionGate)");
    expect(source).not.toContain("localizedPackagePreview");
    expect(source).toContain("useMissionGateForPage");

    const lockedStates: MissionGateState[] = [
      { kind: "loading" },
      { kind: "needs-mission", missionId: "intro-m1-l2-first-prompt::mission" },
    ];
    for (const missionGate of lockedStates) {
      expect(isLessonNavigationMissionLocked(missionGate)).toBe(true);
    }
  });

  it("preserves ar-EG mission-gate locking when not on package pages", () => {
    expect(
      isLessonNavigationMissionLocked({
        kind: "needs-mission",
        missionId: "intro-m1-l2-first-prompt::mission",
      }),
    ).toBe(true);
    expect(isLessonNavigationMissionLocked({ kind: "loading" })).toBe(true);
  });
});

describe("mark-complete uses existing progress path", () => {
  it("still writes lesson progress through setStatus in markCompleted", () => {
    const source = readFileSync(LEARN_ROUTE, "utf8");
    expect(source).toContain('setStatus(lesson.id, "completed")');
    expect(source).toContain("recordActivity()");
    expect(source).toContain('type: "lesson_completed"');
  });
});
