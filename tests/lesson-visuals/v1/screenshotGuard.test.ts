import { describe, expect, it } from "vitest";
import {
  captureScreenshot,
  isAllowlistedUrl,
  looksLikeLoginRedirect,
} from "../../../src/lib/lesson-visuals/v1/adapters/screenshot";
import type { AdapterContext, LessonVisualMaster } from "../../../src/lib/lesson-visuals/v1/types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const base = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "fixtures/tiny-synthetic.master.json"),
    "utf8",
  ),
) as LessonVisualMaster;

describe("screenshot guards", () => {
  it("allowlists Masaarat and verified vendor public hosts from allowlist JSON", () => {
    expect(isAllowlistedUrl("https://masaarat.ai/learn")).toBe(true);
    expect(isAllowlistedUrl("https://www.masaarat.ai/x")).toBe(true);
    expect(isAllowlistedUrl("https://lovable.dev/")).toBe(true);
    expect(isAllowlistedUrl("https://n8n.io/")).toBe(true);
    expect(isAllowlistedUrl("https://docs.n8n.io/workflows/")).toBe(true);
    expect(isAllowlistedUrl("https://evil.example/login")).toBe(false);
    expect(isAllowlistedUrl("http://masaarat.ai/x")).toBe(false);
  });

  it("detects login redirects", () => {
    expect(
      looksLikeLoginRedirect("https://masaarat.ai/login", "<html></html>"),
    ).toBe(true);
    expect(
      looksLikeLoginRedirect(
        "https://masaarat.ai/public",
        '<input name="password" />',
      ),
    ).toBe(true);
    expect(
      looksLikeLoginRedirect("https://masaarat.ai/public", "<html>ok</html>"),
    ).toBe(false);
  });

  it("blocks non-allowlisted screenshotSpec", async () => {
    const master: LessonVisualMaster = {
      ...base,
      screenshotSpec: {
        url: "https://evil.example/shot",
        exactUrl: "https://evil.example/shot",
        product: "Evil",
        publicState: "public-marketing",
        capturePurpose: "should fail allowlist",
        rightsStatus: "vendor-public-docs",
        rightsRationale: "not authorized",
        rightsNote: "not owned",
        viewport: { width: 1280, height: 720 },
        requiredRedactions: [],
        deterministicFallbackMethod: 4,
        failOnLoginRedirect: true,
        allowlisted: true,
      },
    };
    const ctx: AdapterContext = {
      cellId: "x__en",
      lessonId: master.lessonId,
      locale: "en",
      method: 3,
      master,
      fixtureMode: false,
    };
    const r = await captureScreenshot(ctx);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not allowlisted/);
  });

  it("refuses null screenshotSpec", async () => {
    const r = await captureScreenshot({
      cellId: "x__en",
      lessonId: base.lessonId,
      locale: "en",
      method: 3,
      master: { ...base, screenshotSpec: null },
    });
    expect(r.ok).toBe(false);
  });
});
