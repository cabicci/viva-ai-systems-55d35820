import { describe, it, expect } from "vitest";
import { summarizeJourney, scopedVisit, type JourneyStep, type JourneyVisit } from "./model";
const steps: JourneyStep[] = [
  { id: "one", title: "One", href: "/one", completed: false, available: true },
  { id: "two", title: "Two", href: "/two", completed: true, available: true },
  { id: "paid", title: "Paid", href: "/paid", completed: false, available: false },
];
const visit: JourneyVisit = {
  line: "ai",
  course_id: "ai",
  subject_id: "me",
  profile_id: null,
  lesson_id: "two",
  locale: "en",
  visited_at: "2026-10-07T07:00:00Z",
};
describe("journey summary", () => {
  it("resumes the actual visited step even if an earlier step is unfinished", () => {
    expect(summarizeJourney(steps, visit).resume?.id).toBe("two");
  });
  it("does not resume a revoked/paid step or inflate the denominator", () => {
    expect(summarizeJourney(steps, { ...visit, lesson_id: "paid" })).toMatchObject({
      total: 2,
      completed: 1,
      percent: 50,
      resume: undefined,
      next: steps[0],
    });
  });
  it("never counts visits as completion", () => {
    expect(
      summarizeJourney(
        steps.map((s) => ({ ...s, completed: false })),
        visit,
      ).completed,
    ).toBe(0);
  });
  it("ignores obsolete lesson IDs and keeps an empty path finite", () => {
    expect(summarizeJourney([], { ...visit, lesson_id: "deleted" })).toMatchObject({
      total: 0,
      percent: 0,
      resume: undefined,
      next: undefined,
    });
  });
  it("separates children, courses and domains", () => {
    const kid = {
      ...visit,
      line: "kids" as const,
      course_id: "level-1",
      subject_id: "child-a",
      profile_id: "child-a",
    };
    expect(scopedVisit([kid], "kids", "level-1", "child-b")).toBeUndefined();
    expect(scopedVisit([visit], "academic", "ai", "me")).toBeUndefined();
    expect(scopedVisit([kid], "kids", "level-1", "child-a")).toBe(kid);
  });
});
