import { describe, expect, it } from "vitest";
import { generateAiIllustration } from "../../../src/lib/lesson-visuals/v1/adapters/ai_illustration";
import type { LessonVisualMaster } from "../../../src/lib/lesson-visuals/v1/types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const base = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "fixtures/tiny-synthetic.master.json"),
    "utf8",
  ),
) as LessonVisualMaster;

const withContract: LessonVisualMaster = {
  ...base,
  method: 2,
  aiPromptContract: {
    providerClass: "text-free-illustration",
    paidAllowed: false,
    textFree: true,
    promptRules: ["No rendered text glyphs", "Conceptual scene only"],
  },
};

describe("paid AI refusal", () => {
  it("refuses paid without authId", async () => {
    const r = await generateAiIllustration({
      cellId: "x__en",
      lessonId: withContract.lessonId,
      locale: "en",
      method: 2,
      master: withContract,
      costCeilingUsd: 5,
    });
    expect(r.ok).toBe(false);
    expect(r.skippedPaid).toBe(true);
    expect(r.error).toMatch(/authId/);
  });

  it("refuses paid without cost ceiling", async () => {
    const r = await generateAiIllustration({
      cellId: "x__en",
      lessonId: withContract.lessonId,
      locale: "en",
      method: 2,
      master: withContract,
      authId: "test-auth",
      costCeilingUsd: 0,
    });
    expect(r.ok).toBe(false);
    expect(r.skippedPaid).toBe(true);
  });

  it("refuses paid even with auth+ceiling in candidate pipeline", async () => {
    const r = await generateAiIllustration({
      cellId: "x__en",
      lessonId: withContract.lessonId,
      locale: "en",
      method: 2,
      master: withContract,
      authId: "test-auth",
      costCeilingUsd: 3,
    });
    expect(r.ok).toBe(false);
    expect(r.skippedPaid).toBe(true);
    expect(r.error).toMatch(/disabled/);
  });
});
