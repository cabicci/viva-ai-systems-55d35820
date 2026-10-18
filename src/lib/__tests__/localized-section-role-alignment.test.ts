import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Sparkles, Lightbulb, CheckCircle2 } from "lucide-react";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import { loadIntroLessonContent } from "@/components/intro/lessons";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import type {
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "@/lib/locale-lessons/types";

function readPackage(locale: string, lessonId: string): LocalizedLessonPackage {
  return JSON.parse(
    readFileSync(
      path.resolve(
        "src/lib/locale-lessons",
        locale,
        "lessons",
        lessonId + ".json",
      ),
      "utf8",
    ),
  );
}
const lessonIds = [
  "creator-m2-l1-know-audience",
  "creator-m6-l4-leads",
  "automator-m3-l1-tools-landscape",
];
// The lead-capture page exercises the same adapter even before its separately
// tracked missing translated mission is restored.
const representativeIds = [
  lessonIds[0],
  lessonIds[1],
  "automator-m6-l1-lead-capture",
  lessonIds[2],
];

describe("educational role alignment", () => {
  for (const locale of ["en", "ar-MSA", "ar-Gulf"] as const) {
    for (const lessonId of representativeIds) {
      it(
        locale +
          " " +
          lessonId +
          " keeps its localized close after the mission slot",
        async () => {
          const pkg = readPackage(locale, lessonId);
          const original = JSON.stringify(pkg);
          const canonical = await loadIntroLessonContent(lessonId);
          expect(canonical).toBeTruthy();
          const canonicalBefore = JSON.stringify(canonical);
          const result = adaptLocalizedPackageToIntroContent(pkg, canonical);
          const close = pkg.sections.find(
            (section) => section.role.toLowerCase() === "confidence close",
          )!;
          expect(close).toBeTruthy();
          const expectedLines = close.bullets.map((line) =>
            line.replace(/\*\*/g, "").trim(),
          );
          const closingSections = result.filter(
            (section) =>
              section.block.kind === "paragraphs" &&
              section.block.paragraphs.some((line) =>
                expectedLines.includes(line),
              ),
          );
          expect(closingSections).toHaveLength(1);
          const closing = closingSections[0];
          expect(closing.block.kind).toBe("paragraphs");
          if (closing.block.kind === "paragraphs")
            expect(closing.block.paragraphs).toEqual(expectedLines);
          expect(result.at(-1)).toBe(closing);
          const missionIndex = result.findIndex(
            (section) => section.block.kind === "mission",
          );
          if (missionIndex >= 0)
            expect(result.indexOf(closing)).toBeGreaterThan(missionIndex);
          const visual = pkg.sections.find((section) =>
            section.role.toLowerCase().includes("diagram"),
          );
          if (visual) {
            const diagram = result.find(
              (section) => section.block.kind === "diagram",
            );
            expect(diagram).toBeTruthy();
            expect(
              result
                .filter((section) => section.block.kind === "paragraphs")
                .some((section) => section.title === visual.heading),
            ).toBe(false);
          }
          expect(JSON.stringify(pkg)).toBe(original);
          expect(JSON.stringify(canonical)).toBe(canonicalBefore);
        },
      );
    }
  }

  const canonical: IntroLessonContent = [
    {
      icon: Sparkles,
      eyebrow: "بداية الدرس",
      title: "Start",
      block: { kind: "paragraphs", paragraphs: ["Egyptian start"] },
    },
    {
      icon: Lightbulb,
      eyebrow: "الفكرة الأساسية",
      title: "Explain",
      block: { kind: "paragraphs", paragraphs: ["Egyptian core"] },
    },
    {
      icon: CheckCircle2,
      eyebrow: "إقفال الدرس",
      title: "Close",
      block: { kind: "paragraphs", paragraphs: ["Egyptian close"] },
    },
  ];
  function section(role: string, line: string): LocalizedLessonSection {
    return {
      role,
      heading: role,
      contentMarkdown: line,
      bullets: [line],
      tables: [],
    };
  }
  it("reordered source roles retain their canonical educational slots", () => {
    const result = adaptLocalizedPackageToIntroContent(
      {
        locale: "en",
        lessonId: "test",
        sections: [
          section("Confidence close", "Localized close"),
          section("Diagram block (intent)", "Diagram description"),
          section("Core idea", "Localized core"),
          section("Video block", "Video description"),
          section("Orientation", "Localized start"),
        ],
      },
      canonical,
    );
    expect(
      result.map((item) =>
        item.block.kind === "paragraphs" ? item.block.paragraphs[0] : "",
      ),
    ).toEqual(["Localized start", "Localized core", "Localized close"]);
  });
  it("a missing explanation never consumes the close or visual description", () => {
    const result = adaptLocalizedPackageToIntroContent(
      {
        locale: "en",
        lessonId: "test",
        sections: [
          section("Orientation", "Start"),
          section("Diagram block (intent)", "Diagram description"),
          section("Confidence close", "Close"),
        ],
      },
      canonical,
    );
    expect(
      result.map((item) =>
        item.block.kind === "paragraphs" ? item.block.paragraphs[0] : "",
      ),
    ).toEqual(["Start", "Close"]);
  });
  it("standalone packages exclude visual descriptions from explanation paragraphs", () => {
    const result = adaptLocalizedPackageToIntroContent(
      {
        locale: "en",
        lessonId: "test",
        sections: [
          section("Diagram block (intent)", "Diagram description"),
          section("Video block", "Video description"),
          section("Confidence close", "Close"),
        ],
      },
      null,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("packageRole");
    expect(result[0].block).toEqual({
      kind: "paragraphs",
      paragraphs: ["Close"],
    });
  });
});
