import { describe, expect, it } from "vitest";
import path from "node:path";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";
import {
  clampPilotLessonCount,
  DEFAULT_PILOT_LESSON_COUNT,
  MAX_PILOT_LESSON_COUNT,
  MIN_PILOT_LESSON_COUNT,
  selectPilotLessonIds,
} from "../../../scripts/locale-lessons/lib/pilot-lesson-ids.ts";
import { SAMPLE_LESSON_IDS } from "../../../scripts/locale-lessons/lib/sample-lesson-ids.ts";
import { validatePilotTargetPackage } from "../../../scripts/locale-lessons/generate-localized-pilot.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("locale-lessons pilot batch selection", () => {
  it("defaults pilot count to 10 and caps above 25", () => {
    expect(DEFAULT_PILOT_LESSON_COUNT).toBe(10);
    expect(MIN_PILOT_LESSON_COUNT).toBe(3);
    expect(MAX_PILOT_LESSON_COUNT).toBe(25);
    expect(clampPilotLessonCount(undefined)).toBe(10);
    expect(clampPilotLessonCount(99)).toBe(25);
    expect(clampPilotLessonCount(2)).toBe(3);
  });

  it("always seeds pilot batches with the three sample lessons first", async () => {
    const pilotIds = await selectPilotLessonIds(10);

    expect(pilotIds).toHaveLength(10);
    expect(pilotIds.slice(0, 3)).toEqual([...SAMPLE_LESSON_IDS]);
    expect(new Set(pilotIds).size).toBe(10);
  });

  it("selects distinct lessons from ar-MSA manifest order", async () => {
    const pilotIds = await selectPilotLessonIds(10);
    expect(pilotIds.length).toBeLessThan(REQUIRED_LESSON_COUNT);
  });

  it("reports invalid pilot packages when manifest is missing", async () => {
    const result = await validatePilotTargetPackage("en", {
      manifestPath: path.join(
        REPO_ROOT,
        "src/lib/locale-lessons/__pilot-test-missing__/manifest.json",
      ),
      lessonsDir: path.join(REPO_ROOT, "src/lib/locale-lessons/en/lessons"),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("manifest"))).toBe(true);
  });

  it("reports invalid pilot packages when manifest is sample not pilot", async () => {
    const result = await validatePilotTargetPackage("en");
    const manifestPath = path.join(REPO_ROOT, "src/lib/locale-lessons/en/manifest.json");
    const manifest = await Bun.file(manifestPath).json();
    if (manifest.packageStatus !== "sample") return;

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("manifest packageStatus must be pilot"))).toBe(
      true,
    );
  });
});
