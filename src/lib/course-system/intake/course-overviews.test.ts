import { describe, expect, it } from "vitest";
import { courseOverview } from "./course-overviews";

describe("courseOverview", () => {
  it("returns the authorized AC-FATE overview in all four locales", () => {
    for (const l of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
      const o = courseOverview("AC-FATE", l)!;
      expect(o.summary && o.goals && o.audience && o.before && o.catalogue).toBeTruthy();
    }
    expect(courseOverview("AC-FATE", "ar-EG")!.summary.startsWith("افهم رحلة المبيد")).toBe(true);
  });
  it("never assigns the pesticides copy to other courses", () => {
    expect(courseOverview("AC-BUS", "ar-EG")).toBeNull();
    expect(courseOverview("toString", "en")).toBeNull();
  });
});
