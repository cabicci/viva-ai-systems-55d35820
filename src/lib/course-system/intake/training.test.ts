/* eslint-disable @typescript-eslint/no-explicit-any -- Deliberately malformed authored expressions. */
import { describe, expect, it } from "vitest";
import { trainingFixture } from "./training-fixture";
import { checkTraining, trainingNumber } from "./training";
import { publicIntake, validateIntake } from "./package";
const valid = {
  concentration: "0.08",
  mass: "0.25",
  body: "40",
  answer: "0.0005",
  unit: "intake-unit",
  identity: "verified",
  reason: "Limited to the specified case",
};
const section = () => trainingFixture().stations[0].steps[0].content.en!.sections[2];
describe("authored ungraded numerical training", () => {
  it("uses the student's selected authored unit factor rather than assuming grams or kilograms", () => {
    const p = trainingFixture(),
      s = p.stations[0].steps[0].content.en!.sections[2];
    s.fields.push({
      id: "mass-unit",
      label: "Mass unit",
      input: "choice",
      options: [
        { id: "grams", label: "g/day" },
        { id: "kilograms", label: "kg/day" },
      ],
    });
    s.training!.outputs[0].expression = {
      op: "divide",
      args: [
        {
          op: "multiply",
          args: [
            { field: "concentration" },
            { field: "mass" },
            {
              choice: "mass-unit",
              factors: [
                { value: "grams", factor: 0.001 },
                { value: "kilograms", factor: 1 },
              ],
            },
          ],
        },
        { field: "body" },
      ],
    };
    const checked = validateIntake(p).stations[0].steps[0].content.en!.sections[2];
    expect(checkTraining(checked, { ...valid, mass: "250", "mass-unit": "grams" })).toBe("correct");
    expect(checkTraining(checked, { ...valid, "mass-unit": "kilograms" })).toBe("correct");
    expect(checkTraining(checked, { ...valid, mass: "250", "mass-unit": "kilograms" })).toBe(
      "mismatch",
    );
    expect(checkTraining(checked, { ...valid, "mass-unit": "unknown" })).toBe("invalid");
  });
  it("checks arithmetic/units without mutating student work or awarding a result", () => {
    const before = structuredClone(valid);
    expect(checkTraining(section(), valid)).toBe("correct");
    expect(valid).toEqual(before);
    expect(checkTraining(section(), { ...valid, answer: "0.005" })).toBe("mismatch");
    expect(checkTraining(section(), { ...valid, unit: "food-unit" })).toBe("mismatch");
    expect(checkTraining(section(), { ...valid, identity: "unknown" })).toBe("prerequisite");
    expect(checkTraining(section(), { ...valid, body: "0" })).toBe("invalid");
    expect(checkTraining(section(), { ...valid, mass: "-1" })).toBe("invalid");
  });
  it("accepts Arabic/Persian digits and decimal separators without partial parsing", () => {
    expect(
      checkTraining(section(), {
        ...valid,
        concentration: "٠٫٠٨",
        mass: "۰٫۲۵",
        body: "٤٠",
        answer: "٠٫٠٠٠٥",
      }),
    ).toBe("correct");
    expect(trainingNumber("1,5")).toBe(1.5);
    expect(trainingNumber("0")).toBe(0);
  });
  it.each(["", " ", "0x10", "2 mg", "NaN", "Infinity", "1e309", "1e-999", "1.2.3", "2+2"])(
    "rejects non-numerical or unrepresentable value %s",
    (s) => expect(trainingNumber(s)).toBeNull(),
  );
  it("does not accept zero for a tiny nonzero answer or numerical underflow/overflow", () => {
    expect(
      checkTraining(section(), {
        ...valid,
        concentration: "1e-100",
        mass: "1",
        body: "1",
        answer: "0",
      }),
    ).toBe("mismatch");
    expect(
      checkTraining(section(), {
        ...valid,
        concentration: "1e-200",
        mass: "1e-200",
        body: "1",
        answer: "0",
      }),
    ).toBe("invalid");
    expect(checkTraining(section(), { ...valid, concentration: "1e308", mass: "1e308" })).toBe(
      "invalid",
    );
  });
  it("keeps rubric keys off the learner projection", () => {
    const p = trainingFixture();
    expect(JSON.stringify(p)).toContain("SYNTHETIC_PRIVATE_REVIEW_CRITERION");
    expect(JSON.stringify(publicIntake(p))).not.toMatch(
      /SYNTHETIC_PRIVATE_REVIEW_CRITERION|answerId|rubrics/,
    );
  });
  it("preserves private image scope and mandatory disclosure", () => {
    const p = trainingFixture(),
      step = p.stations[0].steps[0];
    step.content.en!.assets = [
      {
        id: "diagram",
        type: "image",
        label: "Source diagram",
        caption: "Generated teaching illustration",
        sha256: "a".repeat(64),
        storage: { bucket: "academic-downloads", path: "technical/fixture-course/diagram.jpg" },
      },
    ];
    step.content.en!.sections[0].assets = ["diagram"];
    expect(validateIntake(p).stations[0].steps[0].content.en!.assets[0].type).toBe("image");
    delete step.content.en!.assets[0].caption;
    expect(() => validateIntake(p)).toThrow(/caption|disclosure/);
  });
  it.each([
    (p: any, s: any) => {
      s.training.outputs[0].expression = { field: "answer" };
    },
    (p: any, s: any) => {
      s.training.outputs[0].expression = { field: "unknown" };
    },
    (p: any, s: any) => {
      s.training.outputs[0].expression = { op: "eval", args: [1, 2] };
    },
    (p: any, s: any) => {
      s.training.outputs[0].expression = { op: "divide", args: [1, 2, 3] };
    },
    (p: any, s: any) => {
      s.training.outputs[0].unitValue = "missing-unit";
    },
    (p: any, s: any) => {
      s.training.prerequisites[0].value = "missing-option";
    },
    (p: any, s: any) => {
      s.completion = "submit";
    },
    (p: any) => {
      p.assessmentKeys[0].rubrics[0].fieldId = "missing";
    },
    (p: any, s: any) => {
      s.fields[4].options.push(s.fields[4].options[0]);
    },
    (p: any, s: any) => {
      let e: any = 1;
      for (let i = 0; i < 10; i++) e = { op: "add", args: [1, e] };
      s.training.outputs[0].expression = e;
    },
  ])(
    "rejects expressions, choice IDs or review rules that change the declared boundary",
    (mutate) => {
      const p = trainingFixture();
      mutate(p, p.stations[0].steps[0].content.en!.sections[2]);
      expect(() => validateIntake(p)).toThrow();
    },
  );
});
