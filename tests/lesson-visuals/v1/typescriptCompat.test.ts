/**
 * Focused TypeScript-compat coverage for Lesson Images path/canonical/altTexts/verifier fixes.
 */
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ContentBrief, Locale } from "../../../src/lib/lesson-visuals/v1/types";
import { LOCALES } from "../../../src/lib/lesson-visuals/v1/types";
import {
  MASTERS_DIR,
  REPO_ROOT,
  canonicalJson,
  loadJson,
} from "../../../src/lib/lesson-visuals/v1/validators/shared";
import type { LessonVisualMaster } from "../../../src/lib/lesson-visuals/v1/types";
import { verifyCellArtifacts } from "../../../src/lib/lesson-visuals/v1/production/verifyCellArtifacts";
import { loadScreenshotAllowlist } from "../../../src/lib/lesson-visuals/v1/screenshotAssessment";

describe("Lesson Images TypeScript compatibility", () => {
  it("resolves module-relative paths to absolute repo roots (not cwd)", () => {
    expect(REPO_ROOT.length).toBeGreaterThan(0);
    expect(existsSync(resolve(REPO_ROOT, "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json"))).toBe(
      true,
    );
    expect(existsSync(MASTERS_DIR)).toBe(true);
    const allowlist = loadScreenshotAllowlist();
    expect(allowlist.entries.length).toBeGreaterThan(0);
  });

  it("types ContentBrief without nested altTexts; master altTexts is Record<Locale, string>", () => {
    const master = loadJson<LessonVisualMaster>(
      resolve(MASTERS_DIR, "analyst-m1-l1-from-automation-to-insight.master.json"),
    );
    const altTexts: Record<Locale, string> = master.altTexts;
    for (const loc of LOCALES) {
      expect(typeof altTexts[loc]).toBe("string");
      expect(altTexts[loc].trim().length).toBeGreaterThanOrEqual(8);
    }
    // ContentBrief authoritative fields (altTexts live on the master, not the brief).
    const brief: ContentBrief = master.contentBrief;
    expect(brief.coreIdea.en.length).toBeGreaterThan(0);
    expect("altTexts" in brief).toBe(false);
  });

  it("canonicalJson export is deterministic with stable key ordering", () => {
    const a = canonicalJson({ b: 1, a: { z: 2, m: 3 } });
    const b = canonicalJson({ a: { m: 3, z: 2 }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"m":3,"z":2},"b":1}');
  });

  it("verifyCellArtifacts result exposes a single ok boolean with diagnostics", () => {
    const result = verifyCellArtifacts({
      artifactsRoot: resolve(REPO_ROOT, "artifacts"),
      cellId: "missing-cell__en",
      status: "FAILED",
    });
    expect(Object.keys(result).sort()).toEqual(["missing", "ok", "required", "unexpected"].sort());
    expect(typeof result.ok).toBe("boolean");
    expect(result.ok).toBe(false);
    expect(Array.isArray(result.missing)).toBe(true);
  });
});
