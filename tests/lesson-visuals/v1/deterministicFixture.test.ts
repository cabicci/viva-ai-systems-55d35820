import { describe, expect, it } from "vitest";
import { renderDeterministicSvg } from "../../../src/lib/lesson-visuals/v1/adapters/deterministic";
import { validateSvgSafety } from "../../../src/lib/lesson-visuals/v1/validators/svgSafety";
import { measureTextWidthPx } from "../../../src/lib/lesson-visuals/v1/validators/textBounds";
import type { LessonVisualMaster } from "../../../src/lib/lesson-visuals/v1/types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const master = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "fixtures/tiny-synthetic.master.json"),
    "utf8",
  ),
) as LessonVisualMaster;

describe("deterministic fixture render", () => {
  it("renders safe SVG with Tajawal metrics available", () => {
    const r = renderDeterministicSvg({
      cellId: `${master.lessonId}__en`,
      lessonId: master.lessonId,
      locale: "en",
      method: 1,
      master,
      fixtureMode: true,
    });
    expect(r.ok).toBe(true);
    expect(r.svg).toBeTruthy();
    const safety = validateSvgSafety(r.svg!);
    expect(safety).toEqual([]);
    expect(r.svg).toContain(master.titles.en);
    expect(r.svg).toContain(master.contentBrief.comparison.en.leftLabel);
    expect(r.svg).toContain(master.contentBrief.comparison.en.rightLabel);
    // Expected structure markers for fixture contract
    expect(r.svg).toMatch(/viewBox="0 0 800 450"/);
    expect(r.svg).toContain("font-family=\"Tajawal");
  });

  it("measures Arabic with vendored Tajawal only", () => {
    const w = measureTextWidthPx("مسارات للتعلم", 18, "regular");
    expect(w).toBeGreaterThan(40);
    expect(w).toBeLessThan(400);
  });
});
