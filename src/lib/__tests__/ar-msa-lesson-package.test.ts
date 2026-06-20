import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHIVED_LESSON_ID_SET } from "@/lib/archived-lessons";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons/index";
import type {
  LocalizedLessonManifest,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";
import { parseCanonicalLessonMarkdown } from "../../../scripts/locale-lessons/parse-canonical-lesson.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const PACKAGE_DIR = path.join(REPO_ROOT, "src/lib/locale-lessons/ar-MSA");
const LESSONS_DIR = path.join(PACKAGE_DIR, "lessons");
const MANIFEST_PATH = path.join(PACKAGE_DIR, "manifest.json");

function activeLessonIds(): string[] {
  return Object.keys(INTRO_LESSON_CONTENT)
    .filter((id) => !ARCHIVED_LESSON_ID_SET.has(id))
    .sort();
}

describe("ar-MSA lesson package", () => {
  const manifest = JSON.parse(
    readFileSync(MANIFEST_PATH, "utf8"),
  ) as LocalizedLessonManifest;
  const lessonFiles = readdirSync(LESSONS_DIR).filter((file) =>
    file.endsWith(".json"),
  );

  it("manifest lists exactly 100 active lessons", () => {
    expect(manifest.locale).toBe("ar-MSA");
    expect(manifest.lessonCount).toBe(100);
    expect(manifest.lessonIds).toHaveLength(100);
    expect(lessonFiles).toHaveLength(100);
  });

  it("excludes archived Business lessons", () => {
    for (const id of manifest.lessonIds) {
      expect(ARCHIVED_LESSON_ID_SET.has(id)).toBe(false);
    }
  });

  it("matches active production lesson IDs with no missing or extra IDs", () => {
    const expected = activeLessonIds();
    expect(manifest.lessonIds).toEqual(expected);

    const generatedIds = lessonFiles
      .map((file) => file.replace(/\.json$/, ""))
      .sort();
    expect(generatedIds).toEqual(expected);
  });

  it("maps every generated lesson to an existing active lessonId", () => {
    for (const id of manifest.lessonIds) {
      expect(INTRO_LESSON_CONTENT[id], `missing production registry for ${id}`).toBeTruthy();
      expect(ARCHIVED_LESSON_ID_SET.has(id)).toBe(false);
    }
  });

  it("includes title, summary, sections, and mission copy for a sample lesson", () => {
    const sample = JSON.parse(
      readFileSync(path.join(LESSONS_DIR, "intro-m1-l1-what-is-ai.json"), "utf8"),
    ) as LocalizedLessonPackage;

    expect(sample.locale).toBe("ar-MSA");
    expect(sample.lessonId).toBe("intro-m1-l1-what-is-ai");
    expect(sample.title.length).toBeGreaterThan(0);
    expect(sample.summary?.length).toBeGreaterThan(0);
    expect(sample.sections.length).toBeGreaterThan(5);

    const missionSection = sample.sections.find((section) =>
      section.role.toLowerCase().includes("mission"),
    );
    expect(missionSection?.mission?.intro?.length).toBeGreaterThan(0);
    expect(missionSection?.mission?.delivery.length).toBeGreaterThan(0);
    expect(missionSection?.mission?.rubric.length).toBeGreaterThan(0);
  });
});

describe("parseCanonicalLessonMarkdown", () => {
  it("parses yaml and MSA sections from canonical markdown without modifying source", () => {
    const sourcePath = path.join(
      REPO_ROOT,
      "docs/playbooks/adaptive-canonical/intro-m1-l1-what-is-ai.canonical.md",
    );
    const md = readFileSync(sourcePath, "utf8");
    const parsed = parseCanonicalLessonMarkdown(
      md,
      "docs/playbooks/adaptive-canonical/intro-m1-l1-what-is-ai.canonical.md",
      "2026-06-04T00:00:00.000Z",
    );

    expect(parsed.lessonId).toBe("intro-m1-l1-what-is-ai");
    expect(parsed.titleEn).toBe("What Is AI");
    expect(parsed.sections.some((section) => section.role === "Orientation")).toBe(
      true,
    );
    expect(
      parsed.sections.some((section) => section.quiz?.correctIndex === 1),
    ).toBe(true);
  });
});
