import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isLessonNavigationMissionLocked,
  type MissionGateState,
} from "@/lib/mission-gate";

const MISSION_ID = "intro-m1-l2-first-prompt::mission";

describe("isLessonNavigationMissionLocked — localized package pages", () => {
  it("locks navigation while the mission gate is loading", () => {
    expect(isLessonNavigationMissionLocked({ kind: "loading" })).toBe(true);
  });

  it("locks navigation when a rubric mission still needs submission", () => {
    expect(
      isLessonNavigationMissionLocked({
        kind: "needs-mission",
        missionId: MISSION_ID,
      }),
    ).toBe(true);
  });

  it("does not lock navigation when the mission is passed or absent", () => {
    const openStates: MissionGateState[] = [
      { kind: "no-mission" },
      { kind: "passed", missionId: MISSION_ID, score: 4 },
    ];

    for (const missionGate of openStates) {
      expect(isLessonNavigationMissionLocked(missionGate)).toBe(false);
    }
  });
});

describe("isLessonNavigationMissionLocked — ar-EG regression", () => {
  it("locks navigation while the mission gate is loading", () => {
    expect(isLessonNavigationMissionLocked({ kind: "loading" })).toBe(true);
  });

  it("locks navigation when a rubric mission still needs submission", () => {
    expect(
      isLessonNavigationMissionLocked({
        kind: "needs-mission",
        missionId: MISSION_ID,
      }),
    ).toBe(true);
  });

  it("does not lock navigation when the mission is passed or absent", () => {
    expect(isLessonNavigationMissionLocked({ kind: "no-mission" })).toBe(
      false,
    );
    expect(
      isLessonNavigationMissionLocked({
        kind: "passed",
        missionId: MISSION_ID,
        score: 5,
      }),
    ).toBe(false);
  });
});
