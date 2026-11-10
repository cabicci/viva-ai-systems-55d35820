import { describe, expect, it } from "vitest";
import { admittedPath } from "../admitted";
import { summarizeJourney } from "../model";
import type { CurriculumJourney, CurriculumSummary } from "@/lib/course-system/intake/client";
const version = "a".repeat(64);
const course: CurriculumSummary = {
  id: "synthetic",
  area: "kids",
  title: "Synthetic",
  version,
  stations: [
    {
      id: "s",
      title: "Unit",
      steps: [
        { id: "l1", title: "First" },
        { id: "l2", title: "Second" },
      ],
    },
  ],
};
const child = "a1400000-0000-4000-8000-000000000002";
const state: CurriculumJourney = {
  area: "kids",
  course: "synthetic",
  locale: "ar-Gulf",
  activeVersion: version,
  profileId: child,
  recordId: null,
  reviewOnly: false,
  lessons: [
    {
      lesson: "l1",
      available: true,
      required: 1,
      completed: 1,
      done: true,
      deliveryVersion: version,
    },
    {
      lesson: "l2",
      available: true,
      required: 0,
      completed: 0,
      done: false,
      deliveryVersion: version,
    },
  ],
  resume: { lesson: "l1", ratio: 0.5, contentVersion: version, savedAt: "2026-11-05T00:00:00Z" },
};
describe("M14 admitted journey adapter", () => {
  it("preserves station order, namespace, locale and selected child", () => {
    const path = admittedPath(course, state, "parent");
    expect(path.id).toBe(`intake:kids:synthetic:${child}`);
    expect(path.steps.map((x) => x.id)).toEqual(["l1", "l2"]);
    const url = new URL(path.steps[0].href, "https://synthetic.invalid");
    expect(url.searchParams.get("profileId")).toBe(child);
    expect(url.searchParams.get("locale")).toBe("ar-Gulf");
    expect(url.searchParams.has("version")).toBe(false);
    expect(summarizeJourney(path.steps, path.visit).percent).toBe(50);
  });
  it("does not mark optional-only content complete", () => {
    const path = admittedPath(
      course,
      {
        ...state,
        lessons: state.lessons.map((x) => ({ ...x, required: 0, completed: 0, done: true })),
      },
      "parent",
    );
    expect(path.steps.every((x) => !x.completed)).toBe(true);
  });
  it.each(["pinned", "unavailable", "removed", "wrongVersion", "review"])(
    "does not fabricate a resume for %s",
    (kind) => {
      const s = structuredClone(state);
      if (kind === "pinned") s.lessons[0].deliveryVersion = "b".repeat(64);
      if (kind === "unavailable") s.lessons[0].available = false;
      if (kind === "removed") s.resume!.lesson = "gone";
      if (kind === "wrongVersion") s.resume!.contentVersion = "b".repeat(64);
      if (kind === "review") s.reviewOnly = true;
      expect(admittedPath(course, s, "parent").visit).toBeUndefined();
    },
  );
  it("rejects mismatched catalogue version", () => {
    expect(() => admittedPath({ ...course, version: "b".repeat(64) }, state, "parent")).toThrow(
      "CONTENT_CHANGED",
    );
  });
});
