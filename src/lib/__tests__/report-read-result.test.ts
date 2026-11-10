import { describe, it, expect } from "vitest";
import {
  assertReportRead,
  captureReportRead,
  reportSampleLabel,
} from "@/lib/reporting/read-result";

describe("report read outcomes", () => {
  it.each([
    { data: [], error: null },
    { data: null, count: 0, error: null },
  ])("preserves successful empty reads: %j", async (result) => {
    expect(assertReportRead("test section", result)).toBe(result);
    expect(await captureReportRead("test section", Promise.resolve(result))).toBe(result);
  });
  it("does not accept data or count when the SDK also returns an error", async () => {
    const result = {
      data: [{ status: "completed" }],
      count: 42,
      error: { message: "private provider detail" },
    };
    expect(() => assertReportRead("test section", result)).toThrow("Failed to load test section");
    expect(await captureReportRead("test section", Promise.resolve(result))).toEqual({
      __error: "test section",
    });
  });
  it("captures a rejected read without disclosing its details", async () => {
    expect(
      await captureReportRead("test section", Promise.reject(new Error("private detail"))),
    ).toEqual({ __error: "test section" });
  });
  it.each([0, 3, 1000, 5000])("labels %s returned rows as a bounded sample", (count) => {
    expect(reportSampleLabel(count, 5000)).toBe(
      `عينة مسترجعة: ${count} سجل (حد الطلب 5000؛ ليست إجمالي المنصة)`,
    );
  });
});
