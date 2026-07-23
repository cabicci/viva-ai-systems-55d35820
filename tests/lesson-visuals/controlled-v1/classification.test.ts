import { describe, expect, it } from "vitest";
import {
  loadClassification100,
  validateClassification100,
  verifyMediaMapCopyChecksum,
} from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";
import { CLASSIFICATION_SOURCE_SHA256 } from "../../../src/lib/lesson-visuals/controlled-v1/constants";

describe("controlled-v1 classification-100.json", () => {
  it("has exactly 100 unique lessons", () => {
    const classification = loadClassification100();
    expect(classification.lessons.length).toBe(100);
    const ids = new Set(classification.lessons.map((l) => l.lessonId));
    expect(ids.size).toBe(100);
  });

  it("has the expected counts: 7 MASAARAT_SCREENSHOT, 3 AUTHORIZED_EXTERNAL_SCREENSHOT, 90 INSTRUCTIONAL_COMPOSITION", () => {
    const classification = loadClassification100();
    const counts = { MASAARAT_SCREENSHOT: 0, AUTHORIZED_EXTERNAL_SCREENSHOT: 0, INSTRUCTIONAL_COMPOSITION: 0 };
    for (const lesson of classification.lessons) {
      counts[lesson.route] += 1;
    }
    expect(counts.MASAARAT_SCREENSHOT).toBe(7);
    expect(counts.AUTHORIZED_EXTERNAL_SCREENSHOT).toBe(3);
    expect(counts.INSTRUCTIONAL_COMPOSITION).toBe(90);
    expect(counts.MASAARAT_SCREENSHOT + counts.AUTHORIZED_EXTERNAL_SCREENSHOT + counts.INSTRUCTIONAL_COMPOSITION).toBe(100);
  });

  it("never uses the legacy DIAGRAM route label", () => {
    const classification = loadClassification100();
    for (const lesson of classification.lessons) {
      expect(lesson.route).not.toBe("DIAGRAM");
    }
  });

  it("passes structural validation", () => {
    const result = validateClassification100();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("the repo-committed media-map copy is byte-identical to the recorded checksum", () => {
    const result = verifyMediaMapCopyChecksum(CLASSIFICATION_SOURCE_SHA256);
    expect(result.actualSha256.toUpperCase()).toBe(CLASSIFICATION_SOURCE_SHA256.toUpperCase());
    expect(result.ok).toBe(true);
  });

  it("membership matches the documented masaarat/authorized-external lesson id lists", () => {
    const classification = loadClassification100();
    const masaaratIds = classification.lessons
      .filter((l) => l.route === "MASAARAT_SCREENSHOT")
      .map((l) => l.lessonId)
      .sort();
    const externalIds = classification.lessons
      .filter((l) => l.route === "AUTHORIZED_EXTERNAL_SCREENSHOT")
      .map((l) => l.lessonId)
      .sort();
    expect(masaaratIds).toEqual([...classification.masaaratScreenshotLessonIds].sort());
    expect(externalIds).toEqual([...classification.authorizedExternalScreenshotLessonIds].sort());
  });
});
