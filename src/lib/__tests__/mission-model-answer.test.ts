import { describe, expect, it } from "vitest";
import { normalizeMissionModelAnswer } from "@/lib/mission-model-answer";

describe("readable mission model answers", () => {
  it("keeps an ordinary answer as text", () => {
    expect(normalizeMissionModelAnswer("A useful answer.")).toBe("A useful answer.");
  });
  it("formats structured sections and steps without object coercion", () => {
    const raw = { goal: "Reply clearly", steps: ["Check context", { action: "Ask for details" }] };
    expect(normalizeMissionModelAnswer(raw)).toBe(
      "goal: Reply clearly\n\nsteps: 1. Check context\n2. action: Ask for details",
    );
    expect(raw.steps).toEqual(["Check context", { action: "Ask for details" }]);
  });
  it("reads a JSON-encoded structured answer", () => {
    expect(normalizeMissionModelAnswer('{"answer":"A specific response","reason":"Evidence"}'))
      .toBe("answer: A specific response\n\nreason: Evidence");
  });
  it("keeps literal brackets when they are not JSON", () => {
    expect(normalizeMissionModelAnswer("[Draft] A specific response")).toBe("[Draft] A specific response");
    expect(normalizeMissionModelAnswer("Avoid coercion to [object Object] in JavaScript."))
      .toBe("Avoid coercion to [object Object] in JavaScript.");
  });
  it.each([null, undefined, "", "   ", "[object Object]", "[object Object],[object Object]", {}, [], 8, true])(
    "does not pretend an unreadable payload is an answer: %j", (raw) => {
      expect(normalizeMissionModelAnswer(raw)).toBeNull();
    },
  );
  it("bounds oversized text and cyclic/deep data", () => {
    expect(normalizeMissionModelAnswer("x".repeat(6000))).toHaveLength(4000);
    const cyclic: Record<string, unknown> = { answer: "Preserved content" };
    cyclic.self = cyclic;
    expect(normalizeMissionModelAnswer(cyclic)).toBe("answer: Preserved content");
  });
  it("retains meaningful numeric and boolean fields inside structured answers", () => {
    expect(normalizeMissionModelAnswer({ count: 3, stop: true, omitted: null }))
      .toBe("count: 3\n\nstop: true");
  });
});

