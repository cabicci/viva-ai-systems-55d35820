import { expect, it } from "vitest";
import { normalizeAcademicPracticeValues } from "./practice-fields";

const previous = ["Original title", "Task one", "Task two", "Task three", "Task four"];
it("appends only the new fifth-task slot without shifting the five saved values", () => {
  const actual = normalizeAcademicPracticeValues("AC-BUS-M02-L01", "en", 6, previous);
  expect(actual).toEqual([...previous, ""]);
  expect(previous).toHaveLength(5);
});
it("copies an exact current draft without changing Unicode or long text", () => {
  const current = [...previous, "نص " + "x".repeat(6000)];
  const actual = normalizeAcademicPracticeValues("AC-BUS-M02-L01", "en", 6, current);
  expect(actual).toEqual(current);
  expect(actual).not.toBe(current);
});
it.each(["ar-EG", "ar-MSA", "ar-Gulf"])("does not guess an append migration for %s", (locale) => {
  expect(normalizeAcademicPracticeValues("AC-BUS-M02-L01", locale, 6, previous)).toBeNull();
});
it("does not apply the append rule to another lesson", () => {
  expect(normalizeAcademicPracticeValues("AC-BUS-M02-L02", "en", 6, previous)).toBeNull();
});
it.each([4, 7])(
  "refuses an unknown target count %s rather than truncating or guessing",
  (count) => {
    expect(normalizeAcademicPracticeValues("AC-BUS-M02-L01", "en", count, previous)).toBeNull();
  },
);
it("does not truncate a longer stored draft", () => {
  const original = [...previous, "fifth", "extra retained value"];
  expect(normalizeAcademicPracticeValues("AC-BUS-M02-L01", "en", 6, original)).toBeNull();
  expect(original).toHaveLength(7);
});
it.each([{ values: null }, { values: {} }, { values: ["valid", 3] }, { values: ["valid", null] }])(
  "rejects malformed values %j",
  ({ values }) => {
    expect(normalizeAcademicPracticeValues("AC-BUS-M02-L01", "en", 6, values)).toBeNull();
  },
);
