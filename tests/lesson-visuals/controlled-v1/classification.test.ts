import { describe, expect, it } from "vitest";
import {
  loadClassification100,
  validateClassification100,
  verifyMediaMapCopyChecksum,
} from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";
import {
  CLASSIFICATION_SOURCE_SHA256,
  EXPECTED_COUNTS,
  PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
  PILOT_INSTRUCTIONAL_LESSON_ID,
  PILOT_MASAARAT_LESSON_ID,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";

describe("controlled-v1 classification-100.json", () => {
  it("has exactly 100 unique lessons", () => {
    const classification = loadClassification100({ useCache: false });
    expect(classification.lessons.length).toBe(100);
    const ids = new Set(classification.lessons.map((l) => l.lessonId));
    expect(ids.size).toBe(100);
  });

  it("has the expected counts: 7 MASAARAT_SCREENSHOT, 3 AUTHORIZED_EXTERNAL_SCREENSHOT, 90 INSTRUCTIONAL_COMPOSITION", () => {
    const classification = loadClassification100({ useCache: false });
    const counts = {
      MASAARAT_SCREENSHOT: 0,
      AUTHORIZED_EXTERNAL_SCREENSHOT: 0,
      INSTRUCTIONAL_COMPOSITION: 0,
    };
    for (const lesson of classification.lessons) {
      counts[lesson.route] += 1;
    }
    expect(counts.MASAARAT_SCREENSHOT).toBe(EXPECTED_COUNTS.MASAARAT_SCREENSHOT);
    expect(counts.AUTHORIZED_EXTERNAL_SCREENSHOT).toBe(
      EXPECTED_COUNTS.AUTHORIZED_EXTERNAL_SCREENSHOT,
    );
    expect(counts.INSTRUCTIONAL_COMPOSITION).toBe(EXPECTED_COUNTS.INSTRUCTIONAL_COMPOSITION);
    expect(
      counts.MASAARAT_SCREENSHOT +
        counts.AUTHORIZED_EXTERNAL_SCREENSHOT +
        counts.INSTRUCTIONAL_COMPOSITION,
    ).toBe(100);
  });

  it("never uses the legacy DIAGRAM route label", () => {
    const classification = loadClassification100({ useCache: false });
    for (const lesson of classification.lessons) {
      expect(lesson.route).not.toBe("DIAGRAM");
    }
  });

  it("passes structural validation", () => {
    const result = validateClassification100(loadClassification100({ useCache: false }));
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("the repo-committed media-map copy is byte-identical to the recorded checksum", () => {
    const result = verifyMediaMapCopyChecksum(CLASSIFICATION_SOURCE_SHA256);
    expect(result.actualSha256.toUpperCase()).toBe(CLASSIFICATION_SOURCE_SHA256.toUpperCase());
    expect(result.ok).toBe(true);
  });

  it("membership matches the documented masaarat/authorized-external lesson id lists", () => {
    const classification = loadClassification100({ useCache: false });
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

  it("restores authoritative A/B routes for the two previously drifted pilot lessons", () => {
    const classification = loadClassification100({ useCache: false });
    const masaarat = classification.lessons.find((l) => l.lessonId === PILOT_MASAARAT_LESSON_ID);
    const external = classification.lessons.find(
      (l) => l.lessonId === PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
    );
    expect(masaarat?.cat).toBe("A");
    expect(masaarat?.route).toBe("MASAARAT_SCREENSHOT");
    expect(external?.cat).toBe("B");
    expect(external?.route).toBe("AUTHORIZED_EXTERNAL_SCREENSHOT");
    expect(classification.masaaratScreenshotLessonIds).toContain(PILOT_MASAARAT_LESSON_ID);
    expect(classification.authorizedExternalScreenshotLessonIds).toContain(
      PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
    );
    const intro = classification.lessons.find((l) => l.lessonId === PILOT_INSTRUCTIONAL_LESSON_ID);
    expect(intro?.route).toBe("INSTRUCTIONAL_COMPOSITION");
    expect(intro?.cat).toBe("C");
    const setup = classification.lessons.find((l) => l.lessonId === "intro-m1-l3-setup-your-ai");
    expect(setup?.route).toBe("AUTHORIZED_EXTERNAL_SCREENSHOT");
    expect(setup?.cat).toBe("B");
  });
});
