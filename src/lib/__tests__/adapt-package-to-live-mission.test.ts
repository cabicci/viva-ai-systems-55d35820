import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  adaptPackageMissionToLiveShape,
  adaptPackageMissionsFromSections,
  deliveryToPrompt,
  deriveDeliveryFromContentMarkdown,
  InvalidPackageMissionError,
  packageMissionId,
} from "@/lib/locale-lessons/adapt-package-to-live-mission";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const PACKAGE_LOCALES: LessonPackageLocale[] = ["ar-MSA", "ar-Gulf", "en"];

function readPackage(
  locale: LessonPackageLocale,
  lessonId: string,
): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

function missionSection(pkg: LocalizedLessonPackage): LocalizedLessonSection {
  const section = pkg.sections.find((entry) => entry.mission);
  expect(section).toBeTruthy();
  return section!;
}

describe("adaptPackageMissionToLiveShape", () => {
  const lessonId = "intro-m1-l2-first-prompt";

  it("prefers delivery[] over contentMarkdown for the prompt", () => {
    const pkg = readPackage("en", lessonId);
    const section = missionSection(pkg);
    const live = adaptPackageMissionToLiveShape(lessonId, section, 0);

    expect(live.intro).toBe(section.mission!.intro);
    expect(live.delivery).toEqual(section.mission!.delivery);
    expect(live.prompt).toBe(deliveryToPrompt(section.mission!.delivery));
    expect(live.prompt).not.toContain("**Delivery:**");
  });

  it("derives prompt deterministically from same-section contentMarkdown when delivery is empty", () => {
    const section: LocalizedLessonSection = {
      role: "Mission",
      heading: "Mission",
      contentMarkdown:
        "**Introduction:** Draw 3 screens.\n\n**Submission:**\n\n1. Screen one template\n2. Screen two template\n\n**Evaluation Criteria:**\n\n| Dim | Weight | Criteria |",
      bullets: [],
      tables: [],
      mission: {
        intro: "Draw 3 screens.",
        delivery: [],
        rubric: [
          { dimension: "Clarity", weight: 100, criteria: "Clear screens." },
        ],
        yamlIntent: "wireframe",
        yamlType: "practice",
      },
    };

    const live = adaptPackageMissionToLiveShape("builder-m6-l2-wireframe", section, 0);
    expect(live.delivery).toEqual(["Screen one template", "Screen two template"]);
    expect(live.prompt).toBe(
      "Screen one template\n\nScreen two template",
    );
    expect(deriveDeliveryFromContentMarkdown(section.contentMarkdown)).toEqual(
      live.delivery,
    );
  });

  it("falls back to inline submission block text when delivery uses non-numbered markdown", () => {
    const pkg = readPackage("en", "analyst-m1-l1-from-automation-to-insight");
    const section = missionSection(pkg);
    const live = adaptPackageMissionToLiveShape(
      pkg.lessonId,
      section,
      0,
    );
    expect(live.delivery.length).toBe(1);
    expect(live.prompt).toContain("Source");
    expect(live.prompt).toContain("Decision in one sentence");
  });

  it("normalizes rubric dimension to label and criteria string to string[]", () => {
    const pkg = readPackage("en", lessonId);
    const section = missionSection(pkg);
    const live = adaptPackageMissionToLiveShape(lessonId, section, 0);

    expect(live.rubric[0]?.label).toBe(section.mission!.rubric[0]!.dimension);
    expect(live.rubric[0]?.criteria).toEqual([
      section.mission!.rubric[0]!.criteria,
    ]);
    expect(live.rubric[0]?.weight).toBe(section.mission!.rubric[0]!.weight);
  });

  it("generates a stable deterministic mission id", () => {
    expect(packageMissionId(lessonId, 0)).toBe("intro-m1-l2-first-prompt::mission");
    expect(packageMissionId(lessonId, 1)).toBe(
      "intro-m1-l2-first-prompt::mission::1",
    );

    const pkg = readPackage("en", lessonId);
    const live = adaptPackageMissionToLiveShape(lessonId, missionSection(pkg), 0);
    expect(live.missionId).toBe(packageMissionId(lessonId, 0));
  });

  it("rejects invalid missions", () => {
    const baseSection: LocalizedLessonSection = {
      role: "Mission",
      heading: "Mission",
      contentMarkdown: "",
      bullets: [],
      tables: [],
      mission: {
        intro: "Intro",
        delivery: ["Step one"],
        rubric: [{ dimension: "A", weight: 50, criteria: "ok" }],
        yamlIntent: "x",
        yamlType: "practice",
      },
    };

    expect(() =>
      adaptPackageMissionToLiveShape("x", { ...baseSection, mission: undefined }, 0),
    ).toThrow(InvalidPackageMissionError);

    expect(() =>
      adaptPackageMissionToLiveShape(
        "x",
        {
          ...baseSection,
          mission: { ...baseSection.mission!, intro: "" },
        },
        0,
      ),
    ).toThrow(/missing intro/);

    expect(() =>
      adaptPackageMissionToLiveShape(
        "x",
        {
          ...baseSection,
          mission: { ...baseSection.mission!, delivery: [] },
          contentMarkdown: "No delivery markers here.",
        },
        0,
      ),
    ).toThrow(/unusable prompt/);

    expect(() =>
      adaptPackageMissionToLiveShape(
        "x",
        {
          ...baseSection,
          mission: {
            ...baseSection.mission!,
            rubric: [{ dimension: "A", weight: 50, criteria: "" }],
          },
        },
        0,
      ),
    ).toThrow(/empty criteria/);

    expect(() =>
      adaptPackageMissionToLiveShape(
        "x",
        {
          ...baseSection,
          mission: {
            ...baseSection.mission!,
            rubric: [{ dimension: "A", weight: 0, criteria: "bad" }],
          },
        },
        0,
      ),
    ).toThrow(/invalid weight/);

    expect(() =>
      adaptPackageMissionToLiveShape(
        "x",
        {
          ...baseSection,
          mission: {
            ...baseSection.mission!,
            rubric: [{ dimension: "A", weight: 60, criteria: "bad" }],
          },
        },
        0,
      ),
    ).toThrow(/weights total 60/);
  });

  it("adapts all valid runtime mission packages successfully", () => {
    const knownInvalidLessonIds = new Set([
      "automator-m4-l3-error-handling",
      "intro-m1-l5-ai-vs-software",
    ]);
    let adapted = 0;

    for (const locale of PACKAGE_LOCALES) {
      const dir = path.join(REPO_ROOT, "src/lib/locale-lessons", locale, "lessons");
      for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
        const pkg = JSON.parse(
          readFileSync(path.join(dir, file), "utf8"),
        ) as LocalizedLessonPackage;
        const section = pkg.sections.find((entry) => entry.mission);
        if (!section) continue;

        if (knownInvalidLessonIds.has(pkg.lessonId)) {
          expect(() =>
            adaptPackageMissionToLiveShape(pkg.lessonId, section, 0),
          ).toThrow(InvalidPackageMissionError);
          continue;
        }

        adaptPackageMissionToLiveShape(pkg.lessonId, section, 0);
        adapted += 1;
      }
    }

    expect(adapted).toBe(255);
  });
});
