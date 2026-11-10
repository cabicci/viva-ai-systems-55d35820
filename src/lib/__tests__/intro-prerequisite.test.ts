import { describe, expect, it } from "vitest";
import type { CurriculumModule } from "@/lib/curriculum-data";
import { selectIntroPrerequisiteLessons } from "@/lib/intro-prerequisite";

describe("Intro prerequisite lessons", () => {
  it("preserves module and lesson order and includes available lessons without routes", () => {
    const pathless = { id: "z", title: "Z", order: 9, state: "available" as const };
    const linked = {
      id: "a",
      title: "A",
      order: 1,
      state: "available" as const,
      route: "/learn/intro/a",
    };
    const modules: CurriculumModule[] = [
      {
        id: "second",
        title: "Second",
        order: 2,
        lessons: [
          pathless,
          {
            id: "unavailable",
            title: "Unavailable",
            order: 0,
            state: "coming-soon",
            route: "/unused",
          },
        ],
      },
      { id: "first", title: "First", order: 1, lessons: [linked] },
    ];
    const before = JSON.stringify(modules);
    const selected = selectIntroPrerequisiteLessons(modules);
    expect(selected.map((lesson) => lesson.id)).toEqual(["z", "a"]);
    expect(selected).toHaveLength(2);
    expect(selected[0]).toBe(pathless);
    expect(selected[1]).toBe(linked);
    expect(JSON.stringify(modules)).toBe(before);
  });

  it("keeps empty input empty", () => {
    expect(selectIntroPrerequisiteLessons([])).toEqual([]);
    expect(
      selectIntroPrerequisiteLessons([{ id: "empty", title: "Empty", order: 1, lessons: [] }]),
    ).toEqual([]);
  });
});
