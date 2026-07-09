import { describe, expect, it } from "vitest";
import { deterministicMockMissionFeedback } from "@/components/locale/LocaleMockMissionSubmit";

describe("deterministicMockMissionFeedback", () => {
  it("never returns a passing result", () => {
    const samples = [
      ["intro-m1-l2-first-prompt::mission", "A".repeat(40)],
      ["builder-m6-l2-wireframe::mission", "My wireframe answer with enough detail."],
      ["automator-m3-testing-automation::mission", "Checklist for automation testing steps."],
    ] as const;

    for (const [missionId, answer] of samples) {
      const feedback = deterministicMockMissionFeedback(missionId, answer);
      expect(feedback.passed).toBe(false);
      expect(feedback.kind === "improve" || feedback.kind === "weak").toBe(true);
    }
  });

  it("is deterministic for the same mission id and answer", () => {
    const first = deterministicMockMissionFeedback(
      "intro-m1-l2-first-prompt::mission",
      "Same answer text for deterministic hashing.",
    );
    const second = deterministicMockMissionFeedback(
      "intro-m1-l2-first-prompt::mission",
      "Same answer text for deterministic hashing.",
    );

    expect(second).toEqual(first);
  });

  it("can vary feedback kind across different answers", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const feedback = deterministicMockMissionFeedback(
        "intro-m1-l2-first-prompt::mission",
        `Answer variant number ${i} with enough characters.`,
      );
      kinds.add(feedback.kind);
    }

    expect(kinds.size).toBeGreaterThan(1);
  });
});
