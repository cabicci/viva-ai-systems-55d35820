import { describe, expect, it } from "vitest";
import { renderDeterministicSvg } from "../../../src/lib/lesson-visuals/v1/adapters/deterministic";
import { renderHybrid } from "../../../src/lib/lesson-visuals/v1/adapters/hybrid";
import { runMethodAdapter } from "../../../src/lib/lesson-visuals/v1/adapters/index";
import type { AdapterContext, LessonVisualMaster } from "../../../src/lib/lesson-visuals/v1/types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const fixtureMaster = JSON.parse(
  readFileSync(
    resolve(
      import.meta.dirname,
      "fixtures/tiny-synthetic.master.json",
    ),
    "utf8",
  ),
) as LessonVisualMaster;

function ctx(
  overrides: Partial<AdapterContext> = {},
): AdapterContext {
  return {
    cellId: `${fixtureMaster.lessonId}__en`,
    lessonId: fixtureMaster.lessonId,
    locale: "en",
    method: fixtureMaster.method,
    master: fixtureMaster,
    fixtureMode: true,
    ...overrides,
  };
}

describe("adapters", () => {
  it("routes methods via runMethodAdapter", async () => {
    const r1 = await runMethodAdapter(ctx({ method: 1 }));
    expect(r1.ok).toBe(true);
    expect(r1.svg).toContain("<svg");

    const r4 = await runMethodAdapter(ctx({ method: 4 }));
    expect(r4.ok).toBe(true);
  });

  it("deterministic fixture includes comparison labels", () => {
    const r = renderDeterministicSvg(ctx());
    expect(r.ok).toBe(true);
    expect(r.svg).toContain(fixtureMaster.contentBrief.comparison.en.leftLabel);
    expect(r.svg).toContain("Tajawal");
  });

  it("hybrid overlays labels", () => {
    const r = renderHybrid(ctx({ method: 4 }));
    expect(r.ok).toBe(true);
    expect(r.svg).toContain("hybrid label overlay");
  });
});
