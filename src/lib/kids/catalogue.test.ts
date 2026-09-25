import { describe, expect, it } from "vitest";
import {
  KIDS_BUNDLE_DISCOUNT_PERCENT,
  KIDS_FREE_LESSONS_PER_LEVEL,
  KIDS_LEVELS,
  bundleTotalMinor,
  isKidsFreeLesson,
} from "./catalogue";

describe("Kids product boundaries", () => {
  it("makes exactly the first two lessons free in each separate level", () => {
    expect(KIDS_LEVELS).toHaveLength(3);
    expect(KIDS_FREE_LESSONS_PER_LEVEL).toBe(2);
    for (const { id, lessonCount } of KIDS_LEVELS) {
      expect(lessonCount).toBe(12);
      expect(isKidsFreeLesson(id, 1)).toBe(true);
      expect(isKidsFreeLesson(id, 2)).toBe(true);
      expect(isKidsFreeLesson(id, 3)).toBe(false);
      expect(isKidsFreeLesson(id, 0)).toBe(false);
      expect(isKidsFreeLesson(id, 1.5)).toBe(false);
    }
  });

  it("discounts the combined adult and Kids price by ten percent", () => {
    expect(KIDS_BUNDLE_DISCOUNT_PERCENT).toBe(10);
    expect(bundleTotalMinor("pro", 10000, 20000)).toBe(27000);
    expect(bundleTotalMinor("pro_plus", 20000, 20000)).toBe(36000);
    expect(() => bundleTotalMinor("free" as "pro", 0, 20000)).toThrow();
    expect(() => bundleTotalMinor("pro", -1, 20000)).toThrow();
  });
});
