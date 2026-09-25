import { describe, expect, it } from "vitest";
import {
  KIDS_BUNDLE_DISCOUNT_PERCENT,
  KIDS_FREE_LESSONS_PER_LEVEL,
  KIDS_LEVELS,
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

  it("records only the approved bundle discount percentage", () => {
    expect(KIDS_BUNDLE_DISCOUNT_PERCENT).toBe(10);
  });
});
