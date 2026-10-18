import { describe, expect, it } from "vitest";
import { PATHS } from "@/lib/curriculum-data";
import { getValueHook, getValueHookForLocale, VALUE_HOOKS } from "./value-hooks";

const cases = [
  ["creator-m2-l1-know-audience", "creator-m2", "creator-m2"],
  ["creator-m2-l2-content-pillars", "creator-m2", "creator-m2"],
  ["creator-m3-l1-hook", "creator-m3", "creator-m3"],
  ["creator-m3-l2-script-structure", "creator-m3", "creator-m3"],
  ["creator-m3-l3-cta", "creator-m3", "creator-m3"],
  ["creator-m5-l1-editing", "creator-m5-polish", "creator-m5"],
  ["creator-m5-l2-thumbnails-captions", "creator-m5-polish", "creator-m5"],
  ["creator-m4-repurposing", "creator-m5-polish", "creator-m5"],
  ["creator-m6-l1-platforms", "creator-m6-distribute", "creator-m6"],
  ["creator-m6-l2-scheduling", "creator-m6-distribute", "creator-m6"],
  ["creator-m6-l3-analytics", "creator-m6-distribute", "creator-m6"],
  ["creator-m6-l4-leads", "creator-m6-distribute", "creator-m6"],
  ["analyst-m5-l1-four-numbers-dashboard", "analyst-m5", "analyst-m5"],
  ["analyst-m4-automated-dashboard", "analyst-m5", "analyst-m5"],
  ["analyst-m5-l2-weekly-review-ritual", "analyst-m5", "analyst-m5"],
  ["analyst-m5-ab-testing", "analyst-m6", "analyst-m5-ab-testing"],
] as const;

describe("reviewed module outcome ownership", () => {
  it.each(cases)(
    "%s stays in %s and receives its reviewed outcome",
    (lessonId, moduleId, hookKey) => {
      const owners = PATHS.flatMap((path) =>
        path.modules
          .filter((module) => module.lessons.some((lesson) => lesson.id === lessonId))
          .map((module) => module.id),
      );
      expect(owners).toEqual([moduleId]);
      expect(VALUE_HOOKS[hookKey]).toBeTruthy();
      expect(getValueHook(lessonId)).toBe(VALUE_HOOKS[hookKey]);
    },
  );
  it("retains exact intro-lesson precedence over a module fallback", () => {
    expect(getValueHook("intro-m1-l3-setup-your-ai")).toBe(
      VALUE_HOOKS["intro-m1-l3-setup-your-ai"],
    );
  });
  it.each([undefined, "", "unknown-lesson", "toString", "constructor"])(
    "does not turn unknown %s into inherited object content",
    (lessonId) => expect(getValueHook(lessonId)).toBeUndefined(),
  );
  it.each(["en", "ar-MSA", "ar-Gulf"])("keeps Egyptian outcome copy hidden in %s", (locale) => {
    expect(getValueHookForLocale("creator-m4-repurposing", locale)).toBeUndefined();
  });
  it("shows the corrected repurposing outcome in its canonical locale", () => {
    expect(getValueHookForLocale("creator-m4-repurposing", "ar-EG")).toBe(
      VALUE_HOOKS["creator-m5"],
    );
  });
});
