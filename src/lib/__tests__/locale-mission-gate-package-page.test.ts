import { describe, expect, it } from "vitest";
import {
  isLessonNavigationMissionLocked,
  type MissionGateState,
} from "@/lib/mission-gate";

const MISSION_ID = "intro-m1-l2-first-prompt::mission";

describe("isLessonNavigationMissionLocked — localized package preview", () => {
  it("does not lock navigation when previewing a localized package page", () => {
    const lockedStates: MissionGateState[] = [
      { kind: "loading" },
      { kind: "needs-mission", missionId: MISSION_ID },
    ];

    for (const missionGate of lockedStates) {
      expect(
        isLessonNavigationMissionLocked(missionGate, {
          localizedPackagePreview: true,
        }),
      ).toBe(false);
    }
  });

  it("does not lock navigation for passed or no-mission preview pages", () => {
    expect(
      isLessonNavigationMissionLocked(
        { kind: "no-mission" },
        { localizedPackagePreview: true },
      ),
    ).toBe(false);
    expect(
      isLessonNavigationMissionLocked(
        { kind: "passed", missionId: MISSION_ID, score: 4 },
        { localizedPackagePreview: true },
      ),
    ).toBe(false);
  });
});

describe("isLessonNavigationMissionLocked — ar-EG regression", () => {
  it("locks navigation while the mission gate is loading", () => {
    expect(isLessonNavigationMissionLocked({ kind: "loading" })).toBe(true);
    expect(
      isLessonNavigationMissionLocked({ kind: "loading" }, {
        localizedPackagePreview: false,
      }),
    ).toBe(true);
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
