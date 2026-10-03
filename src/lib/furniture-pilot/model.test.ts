import { describe, expect, it } from "vitest";
import { calculateCabinet, checkAssignment, gradeQuiz, QUIZ_KEY, SAMPLE } from "./model";

describe("furniture teaching geometry", () => {
  it("reconstructs overall dimensions and two equal clear openings", () => {
    const result = calculateCabinet(SAMPLE);
    expect(result.innerWidth).toBe(564);
    expect(result.bodyDepth).toBe(294);
    expect(result.clearOpeningHeight).toBe(273);
    expect(result.innerWidth + 2 * SAMPLE.thickness).toBe(SAMPLE.width);
    expect(result.bodyDepth + SAMPLE.backThickness).toBe(SAMPLE.depth);
    expect(2 * result.clearOpeningHeight + 3 * SAMPLE.thickness).toBe(SAMPLE.height);
    expect(result.panels.flatMap((p) => p.ids)).toEqual(["A1", "A2", "B1", "B2", "C1", "D1"]);
    expect(result.panels.reduce((total, p) => total + p.quantity, 0)).toBe(6);
    expect(result.areaByThickness[18]).toBeCloseTo(0.850248, 6);
    expect(result.areaByThickness[6]).toBeCloseTo(0.36, 6);
  });

  it.each([
    { width: 0 },
    { width: 36 },
    { height: 54 },
    { depth: 6 },
    { thickness: -18 },
    { backThickness: 0 },
    { width: Infinity },
    { height: NaN },
  ])("rejects impossible or nonfinite dimensions: %j", (change) => {
    expect(() => calculateCabinet({ ...SAMPLE, ...change })).toThrow("INVALID_GEOMETRY");
  });

  it("handles changed dimensions and fractional nominal thickness", () => {
    const input = { width: 777, height: 703, depth: 351, thickness: 17.5, backThickness: 5.5 };
    const result = calculateCabinet(input);
    expect(result.innerWidth).toBe(742);
    expect(result.bodyDepth).toBe(345.5);
    expect(result.clearOpeningHeight).toBe(325.25);
    expect(result.panels[3]).toMatchObject({ length: 777, width: 703, thickness: 5.5 });
  });
});

describe("learning checks", () => {
  it("requires every valid answer, including answer index zero", () => {
    expect(gradeQuiz({ ...QUIZ_KEY })).toEqual({
      answered: true,
      correct: 4,
      total: 4,
      passed: true,
    });
    expect(gradeQuiz({ width: 1, depth: 2, release: 1 }).passed).toBe(false);
    expect(gradeQuiz({ ...QUIZ_KEY, quantity: 3 }).answered).toBe(false);
    expect(gradeQuiz({ ...QUIZ_KEY, width: 0 }).passed).toBe(false);
  });

  it("checks the new task independently; blank and nonfinite inputs never pass", () => {
    expect(
      checkAssignment({ innerWidth: "764", bodyDepth: "344", opening: "323" }).every(
        (v) => v.correct,
      ),
    ).toBe(true);
    expect(
      checkAssignment({ innerWidth: "564", bodyDepth: "294", opening: "273" }).every(
        (v) => !v.correct,
      ),
    ).toBe(true);
    expect(
      checkAssignment({ innerWidth: "", bodyDepth: " ", opening: "Infinity" }).every(
        (v) => !v.correct,
      ),
    ).toBe(true);
  });
});
