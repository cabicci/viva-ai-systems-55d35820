import { describe, expect, it } from "vitest";
import { hasSubmittedInitialDecision, initialDecisionForUpdate } from "./management-case-update";

describe("Management case updates", () => {
  it.each([
    ["AC-MGT-CHANGE", "sikka-update"],
    ["AC-MGT-STRAT", "mishwar-update"],
    ["AC-MGT-CONT", "supply-update"],
    ["AC-MGT-BOARD", "board-update"],
  ])("uses the first submission from the same course for %s", (course, asset) => {
    const request = { area: "academic", course, lesson: course + "-L40", asset };
    expect(initialDecisionForUpdate(request)).toBe(course + "-L39");
    expect(initialDecisionForUpdate({ ...request, asset: "case-brief" })).toBeUndefined();
    expect(initialDecisionForUpdate({ ...request, area: "kids" })).toBeUndefined();
    expect(initialDecisionForUpdate({ ...request, lesson: course + "-L38" })).toBeUndefined();
  });

  for (const state of ["awaiting_review", "submitted"]) {
    it("releases the packet after a stored decision in state " + state, () => {
      expect(
        hasSubmittedInitialDecision(
          { version: "v", events: [{ section: "apply", result: { state } }] },
          "v",
        ),
      ).toBe(true);
    });
  }
  it("keeps drafts, other sections and earlier editions closed", () => {
    expect(hasSubmittedInitialDecision(null, "v")).toBe(false);
    expect(hasSubmittedInitialDecision({ version: "v", events: [] }, "v")).toBe(false);
    for (const [version, section, state] of [
      ["old", "apply", "submitted"],
      ["v", "decision", "submitted"],
      ["v", "apply", "started"],
    ])
      expect(
        hasSubmittedInitialDecision({ version, events: [{ section, result: { state } }] }, "v"),
      ).toBe(false);
  });
});
