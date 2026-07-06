import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  INTRO_LESSON_CONTENT_KEYS,
  hasIntroLessonContent,
  loadIntroLessonContent,
} from "@/components/intro/lessons/lesson-registry";
import {
  getExpectedLearnerLessonCount,
  getShippedLessonIdsInCurriculumOrder,
} from "@/lib/shipped-lessons";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("scale batch B — lesson loading", () => {
  it("registry keys match lesson files on disk", () => {
    const indexSource = readFileSync(
      path.join(REPO_ROOT, "src/components/intro/lessons/index.ts"),
      "utf8",
    );
    expect(indexSource).not.toMatch(
      /^import \{ \w+ \} from "\.\//m,
    );
    expect(INTRO_LESSON_CONTENT_KEYS.length).toBeGreaterThanOrEqual(100);
    expect(hasIntroLessonContent("intro-m1-l1-what-is-ai")).toBe(true);
  });

  it("loads a single lesson on demand", async () => {
    const content = await loadIntroLessonContent("intro-m1-l1-what-is-ai");
    expect(content?.length).toBeGreaterThan(0);
    expect(content?.[0]?.block).toBeTruthy();
  });

  it("derives active learner count from curriculum ∩ registry", () => {
    const shipped = getShippedLessonIdsInCurriculumOrder();
    expect(getExpectedLearnerLessonCount()).toBe(shipped.length);
    expect(shipped).toHaveLength(100);
    expect(getExpectedLearnerLessonCount()).toBe(100);
  });

  it("learn route imports dynamic loader not static lesson barrels", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "src/routes/learn.$pathId.$lessonId.tsx"),
      "utf8",
    );
    expect(source).toContain("loadIntroLessonContent");
    expect(source).not.toMatch(
      /INTRO_LESSON_CONTENT\[/,
    );
  });
});
