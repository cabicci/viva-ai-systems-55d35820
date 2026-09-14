import { beforeEach, describe, expect, it, vi } from "vitest";

const registry = vi.hoisted(() => ({
  loadAll: vi.fn(),
}));

vi.mock("@/components/intro/lessons", () => ({
  loadAllIntroLessonContent: registry.loadAll,
}));

import { INTRO_LESSON_CONTENT_KEYS } from "@/components/intro/lessons/lesson-registry";
import { LESSONS } from "@/lib/lesson-catalog";
import { loadUnifiedLessonsContent } from "@/lib/unified-lessons-content";

describe("lazy unified lesson content boundary", () => {
  beforeEach(() => {
    registry.loadAll.mockReset();
  });

  it("keeps the active catalog synchronous without loading registry content", () => {
    expect(LESSONS).toHaveLength(100);
    expect(LESSONS.map((lesson) => lesson.order)).toEqual(
      LESSONS.map((_, index) => index + 1),
    );
    expect(INTRO_LESSON_CONTENT_KEYS).toHaveLength(104);
    expect(registry.loadAll).not.toHaveBeenCalled();
  });

  it("loads real mission fields only after an explicit content request", async () => {
    const first = LESSONS[0];
    registry.loadAll.mockResolvedValue({
      [first.id]: [
        {
          icon: () => null,
          eyebrow: "eyebrow",
          title: "Mission title",
          block: {
            kind: "mission",
            intro: "Mission intro",
            prompt: "Mission prompt",
            buttonLabel: "Copy",
            copiedLabel: "Copied",
          },
        },
      ],
    });

    const loaded = await loadUnifiedLessonsContent();

    expect(registry.loadAll).toHaveBeenCalledTimes(1);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      id: first.id,
      title: first.title,
      mission: {
        title: "Mission title",
        intro: "Mission intro",
        prompt: "Mission prompt",
      },
    });
  });
});
