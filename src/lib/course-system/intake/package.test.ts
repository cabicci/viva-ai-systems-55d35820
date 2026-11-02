import { intakeFixture } from "./test-fixture";
/* eslint-disable @typescript-eslint/no-explicit-any -- Deliberately corrupt author input to exercise rejection before writes. */
import { describe, expect, it } from "vitest";
import { intakeModel, orderedSections, publicIntake, validateIntake } from "./package";
import { parseIntakeJson } from "./raw-json";
describe("authoritative curriculum admission", () => {
  it("detects known chapter/lesson structure without changing order or accepting ambiguous names", () => {
    const input = intakeFixture() as any;
    input.chapters = input.stations;
    delete input.stations;
    input.chapters[0].lessons = input.chapters[0].steps;
    delete input.chapters[0].steps;
    const parsed = validateIntake(input);
    expect(parsed.stations[0].steps[0].id).toBe("step-one");
    input.stations = input.chapters;
    expect(() => validateIntake(input)).toThrow(/AMBIGUOUS/);
  });
  it("keeps hierarchy/order and derives a different activity model for each course", () => {
    const p = validateIntake(intakeFixture());
    expect(p.stations[0].steps[0].id).toBe("step-one");
    expect(intakeModel(p).activities).toEqual(["reading", "notes", "questions", "practice"]);
    expect(intakeModel(p).completion.required.at(-1)).toEqual({
      lesson: "step-one",
      section: "task",
      rule: "review",
    });
  });
  it("never includes protected answer keys or source/audit material in learner projection", () => {
    const publicCourse = publicIntake(validateIntake(intakeFixture()));
    expect(JSON.stringify(publicCourse)).not.toMatch(
      /correctIndex|assessmentKeys|reviewed source|sha256.*aaaaaaaa/,
    );
    expect(publicCourse.stations[0].steps[0].content.en?.sections[1].questions[0].options).toEqual([
      "A",
      "B",
    ]);
  });
  it("shows instruction/example/video first and preserves the remaining authored activity order", () => {
    const p = validateIntake(intakeFixture());
    const base = p.stations[0].steps[0].content.en!.sections[0];
    expect(
      orderedSections([
        { ...base, kind: "practice" },
        { ...base, kind: "video" },
        { ...base, kind: "example" },
        base,
        { ...base, kind: "exam" },
      ]).map((s) => s.kind),
    ).toEqual(["explanation", "example", "video", "practice", "exam"]);
  });
  it.each([
    (p: any) => {
      p.platform = { access: "admin" };
    },
    (p: any) => {
      p.id = "ai";
    },
    (p: any) => {
      p.locales.push("en");
    },
    (p: any) => {
      p.locales.push("ar-EG");
    },
    (p: any) => {
      p.stations.push(p.stations[0]);
    },
    (p: any) => {
      p.assessmentKeys = [];
    },
    (p: any) => {
      p.assessmentKeys[0].keys[0].correctIndex = 9;
    },
    (p: any) => {
      p.stations[0].steps[0].content.en.sections[2].completion = "read";
    },
    (p: any) => {
      p.stations[0].steps[0].content.en.sections[0].answerKey = "B";
    },
    (p: any) => {
      p.stations[0].steps[0].content.en.sections[0].assets = ["missing"];
    },
  ])(
    "rejects overrides, ambiguous identities and incomplete grading before any write",
    (mutate) => {
      const p = intakeFixture();
      mutate(p);
      expect(() => validateIntake(p)).toThrow();
    },
  );
  it("rejects hidden nested metadata and unsafe hosted assets", () => {
    const p = intakeFixture() as any;
    p.stations[0].steps[0].content.en.assets = [
      {
        id: "v",
        sha256: "b".repeat(64),
        label: "Video",
        type: "video",
        url: "https://masaarat.ai/video?token=secret",
      },
    ];
    expect(() => validateIntake(p)).toThrow();
  });
  it.each([
    '{"id":1,"id":2}',
    '{"id":1,"\\u0069d":2}',
    '{"__proto__":{}}',
    "[1,]",
    '{"a":1} trailing',
    "1e999",
    "\ufeff{}",
  ])("rejects ambiguous or malformed raw JSON: %s", (raw) =>
    expect(() => parseIntakeJson(raw)).toThrow(),
  );
  it("parses valid escaped JSON, arrays and null without prototype effects", () => {
    expect(parseIntakeJson(' {"x":[true,null,"\\u0627",-1.2e2]} ')).toEqual({
      x: [true, null, "ا", -120],
    });
    expect(validateIntake(parseIntakeJson(JSON.stringify(intakeFixture()))).id).toBe(
      "fixture-course",
    );
  });
});
