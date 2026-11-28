import { describe, expect, it } from "vitest";
import { mayReadSikkaUpdate } from "./sikka-release";

describe("Sikka event packet", () => {
  for (const state of ["awaiting_review", "submitted"]) {
    it("releases the packet after a stored decision in state " + state, () => {
      expect(
        mayReadSikkaUpdate(
          { version: "v", events: [{ section: "apply", result: { state } }] },
          "v",
        ),
      ).toBe(true);
    });
  }
  it("keeps drafts, other sections and earlier editions closed", () => {
    expect(mayReadSikkaUpdate(null, "v")).toBe(false);
    expect(mayReadSikkaUpdate({ version: "v", events: [] }, "v")).toBe(false);
    for (const [version, section, state] of [
      ["old", "apply", "submitted"],
      ["v", "decision", "submitted"],
      ["v", "apply", "started"],
    ])
      expect(mayReadSikkaUpdate({ version, events: [{ section, result: { state } }] }, "v")).toBe(
        false,
      );
  });
});
