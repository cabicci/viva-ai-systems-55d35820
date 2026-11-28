import { describe, expect, it } from "vitest";
import { canReleaseInvestmentUpdate } from "./investment-update.server";

const edition = "3".repeat(64);
const opened = { version: edition, lesson: { id: "AC-MGT-INV-L39" },
  events: [{ section: null, result: null }] };
const submitted = { ...opened, events: [...opened.events,
  { section: "apply", result: { state: "awaiting_review" } }] };

describe("Shubbak case update", () => {
  it("requires the saved initial memo and the same edition", () => {
    expect(canReleaseInvestmentUpdate(opened, edition)).toBe(false);
    expect(canReleaseInvestmentUpdate(submitted, edition)).toBe(true);
    expect(canReleaseInvestmentUpdate(submitted, "4".repeat(64))).toBe(false);
    expect(canReleaseInvestmentUpdate(submitted)).toBe(false);
  });
  it("excludes unrelated activities, lessons and missing history", () => {
    expect(canReleaseInvestmentUpdate({ ...submitted, lesson: { id: "other" } }, edition)).toBe(false);
    expect(canReleaseInvestmentUpdate({ ...opened, events: [{ section: "decision", result: { state: "submitted" } }] }, edition)).toBe(false);
    expect(canReleaseInvestmentUpdate(null, edition)).toBe(false);
  });
});