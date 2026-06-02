import { describe, it, expect } from "vitest";
import { LESSONS, getLesson, getNextLesson, getPrevLesson } from "@/lib/unified-lessons";

describe("unified-lessons: LESSONS array", () => {
  it("has at least 1 lesson and all entries have id+title", () => {
    expect(LESSONS.length).toBeGreaterThan(0);
    for (const l of LESSONS) {
      expect(l.id).toBeTruthy();
      expect(l.title.length).toBeGreaterThan(0);
    }
  });

  it("ids are unique", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("order field is sequential starting from 1", () => {
    const orders = LESSONS.map((l) => l.order);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });
});

describe("unified-lessons: helpers", () => {
  it("getLesson returns matching lesson for known id", () => {
    const first = LESSONS[0];
    expect(getLesson(first.id)?.id).toBe(first.id);
  });

  it("getLesson returns undefined for unknown id", () => {
    expect(getLesson("nope-xyz")).toBeUndefined();
  });

  it("getNextLesson walks forward and returns undefined at the end", () => {
    if (LESSONS.length < 2) return;
    expect(getNextLesson(LESSONS[0].id)?.id).toBe(LESSONS[1].id);
    expect(getNextLesson(LESSONS[LESSONS.length - 1].id)).toBeUndefined();
  });

  it("getPrevLesson walks backward and returns undefined at the start", () => {
    if (LESSONS.length < 2) return;
    expect(getPrevLesson(LESSONS[1].id)?.id).toBe(LESSONS[0].id);
    expect(getPrevLesson(LESSONS[0].id)).toBeUndefined();
  });
});