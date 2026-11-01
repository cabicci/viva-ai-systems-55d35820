import { describe, it, expect } from "vitest";
import { cairoInputToUtc, utcToCairoInput, freeAccessInput } from "./free-access";
describe("fixed free access input and Cairo clock", () => {
  it("uses Cairo DST rules, independently of the computer timezone", () => {
    expect(cairoInputToUtc("2026-08-10T12:00")).toBe("2026-08-10T09:00:00.000Z");
    expect(cairoInputToUtc("2026-11-10T12:00")).toBe("2026-11-10T10:00:00.000Z");
    expect(utcToCairoInput("2026-11-10T10:00:00Z")).toBe("2026-11-10T12:00");
  });
  it("rejects missing/repeated Cairo clock-change minutes and invalid dates", () => {
    for (const v of [
      "2026-04-24T00:30",
      "2026-10-29T23:30",
      "2026-02-30T12:00",
      "bad",
      "2026-11-10T25:00",
    ])
      expect(() => cairoInputToUtc(v)).toThrow();
  });
  it("requires multiple valid distinct target choices, explicit fixed dates and a stable operation identity", () => {
    const input = {
      action: "create",
      data: {
        title: "Offer",
        targets: ["ai:business", "academic:AC-BUS"],
        starts_at: "2026-11-01T00:00:00Z",
        ends_at: "2026-11-15T00:00:00Z",
        enabled: true,
        key: "30e7b0d3-70b4-4347-b778-10501b9f117a",
      },
    };
    expect(freeAccessInput.safeParse(input).success).toBe(true);
    for (const patch of [
      { targets: [] },
      { targets: ["ai", "ai"] },
      { ends_at: input.data.starts_at },
      { days: 14 },
      { user_id: "other" },
    ])
      expect(
        freeAccessInput.safeParse({ ...input, data: { ...input.data, ...patch } }).success,
      ).toBe(false);
  });
});
