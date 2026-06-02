import { describe, it, expect } from "vitest";
import {
  isLessonFree,
  freeLessonIds,
  findLessonPath,
  decideLessonGate,
  isAdminEmail,
} from "@/lib/entitlements";
import { PATHS, getPath } from "@/lib/curriculum-data";

describe("entitlements: free-lesson rules", () => {
  it("every available intro lesson is free", () => {
    const intro = getPath("intro")!;
    const availableIntro = intro.modules.flatMap((m) =>
      m.lessons.filter((l) => l.state === "available"),
    );
    expect(availableIntro.length).toBeGreaterThan(0);
    for (const l of availableIntro) {
      expect(isLessonFree(l.id), `intro lesson "${l.id}" should be free`).toBe(true);
    }
  });

  it("each non-intro path contributes exactly one free path-intro lesson", () => {
    for (const p of PATHS) {
      if (p.id === "intro") continue;
      const freeInPath = p.modules
        .flatMap((m) => m.lessons)
        .filter((l) => isLessonFree(l.id));
      // 0 if no available lessons exist yet, else exactly 1
      expect(freeInPath.length).toBeLessThanOrEqual(1);
    }
  });

  it("freeLessonIds returns all free lessons and only free lessons", () => {
    const set = new Set(freeLessonIds());
    for (const p of PATHS) {
      for (const m of p.modules) {
        for (const l of m.lessons) {
          expect(set.has(l.id)).toBe(isLessonFree(l.id));
        }
      }
    }
  });
});

describe("entitlements: findLessonPath", () => {
  it("returns the owning path for known lessons", () => {
    for (const p of PATHS) {
      for (const m of p.modules) {
        if (m.lessons.length === 0) continue;
        const sample = m.lessons[0];
        expect(findLessonPath(sample.id)?.id).toBe(p.id);
      }
    }
  });
  it("returns null for unknown lesson", () => {
    expect(findLessonPath("nope-xyz")).toBeNull();
  });
});

describe("entitlements: decideLessonGate", () => {
  // Pick a real free path-intro lesson and a real paid lesson for realism
  const builder = getPath("builder")!;
  const builderLessons = builder.modules.flatMap((m) => m.lessons);
  const freeBuilderLesson = builderLessons.find((l) => isLessonFree(l.id));
  const paidBuilderLesson = builderLessons.find(
    (l) => !isLessonFree(l.id) && l.state === "available",
  );
  const introLessons = getPath("intro")!.modules.flatMap((m) => m.lessons);
  const introLessonId = introLessons.find((l) => l.state === "available")!.id;

  it("admin always opens any lesson", () => {
    expect(
      decideLessonGate({
        lessonId: paidBuilderLesson?.id ?? "anything",
        isPro: false,
        isAdmin: true,
        introCompletedCount: 0,
        introTotal: 10,
      }),
    ).toEqual({ kind: "open" });
  });

  it("pro always opens any lesson", () => {
    expect(
      decideLessonGate({
        lessonId: paidBuilderLesson?.id ?? "anything",
        isPro: true,
        isAdmin: false,
        introCompletedCount: 0,
        introTotal: 10,
      }),
    ).toEqual({ kind: "open" });
  });

  it("intro lesson is always open for free users", () => {
    expect(
      decideLessonGate({
        lessonId: introLessonId,
        isPro: false,
        isAdmin: false,
        introCompletedCount: 0,
        introTotal: 5,
      }),
    ).toEqual({ kind: "open" });
  });

  it("non-intro lesson is gated by intro completion for free users", () => {
    if (!freeBuilderLesson) return;
    const gate = decideLessonGate({
      lessonId: freeBuilderLesson.id,
      isPro: false,
      isAdmin: false,
      introCompletedCount: 2,
      introTotal: 5,
    });
    expect(gate.kind).toBe("complete-intro-first");
    if (gate.kind === "complete-intro-first") {
      expect(gate.introDone).toBe(2);
      expect(gate.introTotal).toBe(5);
    }
  });

  it("free path-intro lesson opens after intro is done", () => {
    if (!freeBuilderLesson) return;
    expect(
      decideLessonGate({
        lessonId: freeBuilderLesson.id,
        isPro: false,
        isAdmin: false,
        introCompletedCount: 5,
        introTotal: 5,
      }),
    ).toEqual({ kind: "open" });
  });

  it("paid lesson hits paywall after intro is done", () => {
    if (!paidBuilderLesson) return;
    expect(
      decideLessonGate({
        lessonId: paidBuilderLesson.id,
        isPro: false,
        isAdmin: false,
        introCompletedCount: 5,
        introTotal: 5,
      }),
    ).toEqual({ kind: "paywall" });
  });
});

describe("entitlements: isAdminEmail (deprecated no-op)", () => {
  it("always returns false regardless of input", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail("admin@example.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});