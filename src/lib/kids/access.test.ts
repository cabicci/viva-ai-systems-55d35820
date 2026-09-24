import { describe, expect, it } from "vitest";
import { decideKidsLessonAccess } from "./access";

const approved = {
  level: "level-2" as const,
  contentApproved: true,
  parentVerified: true,
  familySubscriptionActive: false,
};

describe("Kids access isolation", () => {
  it("requires publication review and a verified parent even for free lessons", () => {
    expect(
      decideKidsLessonAccess({ ...approved, lessonNumber: 1, contentApproved: false }).kind,
    ).toBe("unavailable");
    expect(
      decideKidsLessonAccess({ ...approved, lessonNumber: 1, parentVerified: false }).kind,
    ).toBe("parent-required");
    expect(decideKidsLessonAccess({ ...approved, lessonNumber: 1 }).kind).toBe("open");
  });

  it("gates lesson 3 on a separate family subscription", () => {
    expect(decideKidsLessonAccess({ ...approved, lessonNumber: 3 }).kind).toBe(
      "family-subscription-required",
    );
    expect(
      decideKidsLessonAccess({ ...approved, lessonNumber: 3, familySubscriptionActive: true }).kind,
    ).toBe("open");
  });

  it("rejects invalid lessons even with an active family subscription", () => {
    for (const lessonNumber of [0, 13, 1.5]) {
      expect(
        decideKidsLessonAccess({ ...approved, lessonNumber, familySubscriptionActive: true }).kind,
      ).toBe("unavailable");
    }
  });
});
