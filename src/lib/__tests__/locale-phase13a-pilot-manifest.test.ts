import { describe, expect, it } from "vitest";
import {
  clampPhase13PilotCount,
  pathsRepresented,
  PHASE13_DEFAULT_PILOT_COUNT,
  PHASE13_MAX_PILOT_COUNT,
  PHASE13_MIN_PILOT_COUNT,
  selectPhase13PilotLessonIds,
} from "../../../scripts/locale-lessons/lib/phase13-pilot-manifest.ts";
import { buildPhase13PilotMatrix } from "../../../scripts/locale-lessons/lib/resolve-phase13-pilot-lesson-ids.ts";
import { SAMPLE_LESSON_IDS } from "../../../scripts/locale-lessons/lib/sample-lesson-ids.ts";

describe("Phase 13A pilot manifest", () => {
  it("clamps pilot count to 3–20", () => {
    expect(clampPhase13PilotCount(undefined)).toBe(PHASE13_DEFAULT_PILOT_COUNT);
    expect(clampPhase13PilotCount(2)).toBe(PHASE13_MIN_PILOT_COUNT);
    expect(clampPhase13PilotCount(99)).toBe(PHASE13_MAX_PILOT_COUNT);
    expect(clampPhase13PilotCount(15)).toBe(15);
  });

  it("selects cross-path pilot lessons including samples", async () => {
    const ids = await selectPhase13PilotLessonIds({ count: 10 });
    expect(ids).toHaveLength(10);
    for (const sampleId of SAMPLE_LESSON_IDS) {
      expect(ids).toContain(sampleId);
    }
    const paths = pathsRepresented(ids);
    expect(paths.length).toBeGreaterThanOrEqual(4);
  });

  it("builds lesson×locale matrix cells", async () => {
    const matrix = await buildPhase13PilotMatrix({
      sourceScope: "ar-MSA",
      target: "all",
      count: 5,
    });
    expect(matrix).toHaveLength(10);
    expect(matrix[0]).toMatchObject({
      source_scope: "ar-MSA",
      locale: expect.stringMatching(/^(ar-Gulf|en)$/),
      lesson_id: expect.any(String),
    });
  });

  it("honors explicit lesson_ids override", async () => {
    const override = ["intro-m1-l1-what-is-ai", "builder-m6-l1-idea-to-page"];
    const ids = await selectPhase13PilotLessonIds({ lessonIdsOverride: override });
    expect(ids).toEqual(override);
  });
});
