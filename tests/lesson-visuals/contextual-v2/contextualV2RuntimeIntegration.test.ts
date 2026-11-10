import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  auditContextualV2BrowserResolver,
  getContextualV2BrowserManifestEntries,
  resolveContextualV2Visual,
} from "../../../src/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserResolver";
import { IMAGE_GALLERY } from "../../../src/lib/image-gallery-registry";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

describe("contextual-v2 runtime integration", () => {
  it("covers exactly 100 lessons in four exact locales", () => {
    const entries = getContextualV2BrowserManifestEntries();
    expect(entries).toHaveLength(400);
    expect(new Set(entries.map((entry) => entry.cellId)).size).toBe(400);
    expect(new Set(entries.map((entry) => entry.lessonId)).size).toBe(100);
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
      expect(entries.filter((entry) => entry.locale === locale)).toHaveLength(100);
    }
    expect(entries.filter((entry) => entry.sourceType === "infographic")).toHaveLength(396);
    expect(entries.filter((entry) => entry.sourceType === "screenshot")).toHaveLength(4);
    expect(
      new Set(
        entries
          .filter((entry) => entry.sourceType === "screenshot")
          .map((entry) => entry.lessonId),
      ),
    ).toEqual(new Set(["builder-m7-l1-tables-columns"]));
    expect(auditContextualV2BrowserResolver()).toMatchObject({
      manifestIsVerified: true,
      entries: 400,
      lessons: 100,
      uniqueLessonLocaleKeys: 400,
      duplicateMappings: 0,
      staticImageImports: 0,
    });
  });

  it("resolves one exact public URL without locale fallback", () => {
    const lessonId = "creator-m2-l1-know-audience";
    const urls = new Set<string>();
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
      const result = resolveContextualV2Visual({ lessonId, locale });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.locale).toBe(locale);
      expect(result.url).toBe(
        `/lesson-visuals/contextual-v2/${locale}/${lessonId}.webp`,
      );
      urls.add(result.url);
    }
    expect(urls.size).toBe(4);
    expect(resolveContextualV2Visual({ lessonId, locale: "fr-FR" })).toMatchObject({
      ok: false,
      reason: "unsupported_locale",
    });
    expect(
      resolveContextualV2Visual({ lessonId: "missing", locale: "ar-EG" }),
    ).toMatchObject({ ok: false, reason: "missing_lesson" });
  });

  it("pins every manifest digest to committed image bytes", () => {
    for (const entry of getContextualV2BrowserManifestEntries()) {
      const assetPath = join(repo, "public", entry.publicPath);
      expect(existsSync(assetPath), entry.cellId).toBe(true);
      const bytes = readFileSync(assetPath);
      expect(bytes.length, entry.cellId).toBe(entry.assetBytes);
      expect(sha256(bytes), entry.cellId).toBe(entry.assetSha256);
      if (entry.actualFormat === "webp") {
        expect(bytes.subarray(0, 4).toString("ascii"), entry.cellId).toBe("RIFF");
        expect(bytes.subarray(8, 12).toString("ascii"), entry.cellId).toBe("WEBP");
      } else {
        expect([...bytes.subarray(0, 8)], entry.cellId).toEqual([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ]);
      }
    }
  });

  it("contains no eager image glob or image import", () => {
    const source = readFileSync(
      join(
        repo,
        "src/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserResolver.ts",
      ),
      "utf8",
    );
    expect(source).not.toContain("import.meta.glob");
    expect(source).not.toMatch(/import\s+.+\.(?:png|jpe?g|webp|svg)["']/i);
    const gallerySource = readFileSync(
      join(repo, "src/lib/image-gallery-registry.ts"),
      "utf8",
    );
    expect(gallerySource).not.toMatch(/@\/assets\/lessons/);
    const rendererSource = readFileSync(
      join(repo, "src/components/intro/IntroLessonRenderer.tsx"),
      "utf8",
    );
    expect(rendererSource).not.toContain("LESSON_DIAGRAMS");
    expect(rendererSource).not.toContain("strict-localized-visual-policy");
    expect(rendererSource).not.toContain("resolveStrictLocalizedScreenshotSrc");
    expect(rendererSource).not.toContain("resolveStrictLocalizedDiagramSrc");
    expect(rendererSource).not.toContain("data-controlled-v1");
    const adapterSource = readFileSync(
      join(
        repo,
        "src/lib/locale-lessons/adapt-localized-package-to-intro-content.ts",
      ),
      "utf8",
    );
    expect(adapterSource).not.toContain("strict-localized-visual-policy");
    expect(adapterSource).toContain(
      'from "./strict-visual-text-policy"',
    );
    expect(adapterSource).toContain('from "./registry"');
    expect(adapterSource).toContain("isPackageLocale(locale)");
    expect(IMAGE_GALLERY).toHaveLength(100);
    expect(new Set(IMAGE_GALLERY.map((item) => item.lessonSlug)).size).toBe(100);
  });
});
