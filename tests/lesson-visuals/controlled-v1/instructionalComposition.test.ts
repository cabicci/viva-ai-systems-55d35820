import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  CHROME_RENDER_TIMEOUT_MS,
  generateInstructionalComposition,
  listChromeExecutableCandidates,
  resolveChromeExecutable,
} from "../../../src/lib/lesson-visuals/controlled-v1/routes/instructionalComposition";
import { readPngDimensions } from "../../../src/lib/lesson-visuals/controlled-v1/goldenRefs";
import { ARTIFACTS_ROOT } from "../../../src/lib/lesson-visuals/controlled-v1/paths";
import {
  writeFileSync,
  mkdtempSync,
  rmSync,
  readFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Cold Chrome on GitHub-hosted runners often exceeds Vitest's 5s default.
 * Suite timeout = spawn bound + flush margin + assertion budget.
 * Keep global Vitest default unchanged for static/zero-render suites.
 */
const RENDER_SUITE_TIMEOUT_MS = CHROME_RENDER_TIMEOUT_MS + 30_000;
const RENDER_TEST_TIMEOUT_MS = CHROME_RENDER_TIMEOUT_MS + 15_000;

const FIXTURES_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/synthetic-locale-lessons",
);

/** Synthetic lesson ID — must never collide with production or pilot lesson IDs. */
const SYNTHETIC_LESSON_ID = "synthetic-c-probe-alpha";

function sha(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function assertOutsideProductionTree(path: string): void {
  const norm = path.replace(/\\/g, "/");
  expect(norm.includes("/artifacts/controlled-v1")).toBe(false);
  expect(norm.startsWith(ARTIFACTS_ROOT.replace(/\\/g, "/"))).toBe(false);
}

const disposableDirs: string[] = [];

describe(
  "controlled-v1 instructionalComposition generator",
  { timeout: RENDER_SUITE_TIMEOUT_MS },
  () => {
    let chromePath: string;

    beforeAll(() => {
      delete process.env.CONTROLLED_V1_ZERO_RENDER;
      const candidates = listChromeExecutableCandidates();
      expect(candidates).toContain("/bin/chromium");
      expect(candidates).toContain("/usr/bin/chromium");
      chromePath = resolveChromeExecutable();
      expect(existsSync(chromePath)).toBe(true);
    });

    afterAll(() => {
      for (const dir of disposableDirs) {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it(
      "produces a valid 1280x720 PNG with joined Arabic for synthetic ar-EG",
      { timeout: RENDER_TEST_TIMEOUT_MS },
      () => {
        const outDir = mkdtempSync(resolve(tmpdir(), "controlled-v1-synth-"));
        disposableDirs.push(outDir);
        const result = generateInstructionalComposition({
          lessonId: SYNTHETIC_LESSON_ID,
          locale: "ar-EG",
          position: 99901,
          title: "مسبار اصطناعي ألفا",
          outputDir: outDir,
          localeLessonsRoot: FIXTURES_ROOT,
          treatArEgAsJsonPackage: true,
        });
        assertOutsideProductionTree(result.htmlPath);
        assertOutsideProductionTree(outDir);
        expect(result.width).toBe(1280);
        expect(result.height).toBe(720);
        expect(result.direction).toBe("rtl");
        expect(result.png.subarray(0, 8)).toEqual(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        );
        const html = readFileSync(result.htmlPath, "utf8");
        expect(html).toContain("SYNTHETIC_AR_EG_PROBE_ALPHA");
        expect(html).toContain('dir="rtl"');
        expect(html).toContain("Tajawal");

        const path = resolve(outDir, "assert-out.png");
        writeFileSync(path, result.png);
        expect(readPngDimensions(path)).toEqual({ width: 1280, height: 720 });
        expect(existsSync(resolve(ARTIFACTS_ROOT, "cells", `${SYNTHETIC_LESSON_ID}__ar-EG`))).toBe(
          false,
        );
      },
    );

    it(
      "is byte-for-byte deterministic given identical inputs (same Chrome)",
      { timeout: RENDER_TEST_TIMEOUT_MS },
      () => {
        const input = {
          lessonId: SYNTHETIC_LESSON_ID,
          locale: "en" as const,
          position: 99901,
          title: "Synthetic Probe Alpha",
          localeLessonsRoot: FIXTURES_ROOT,
          treatArEgAsJsonPackage: true,
        };
        const a = generateInstructionalComposition(input);
        const b = generateInstructionalComposition(input);
        assertOutsideProductionTree(a.htmlPath);
        assertOutsideProductionTree(b.htmlPath);
        expect(sha(a.png)).toBe(sha(b.png));
        expect(a.direction).toBe("ltr");
      },
    );

    it(
      "produces different pixel content across locales for the same synthetic lesson",
      { timeout: RENDER_TEST_TIMEOUT_MS },
      () => {
        const a = generateInstructionalComposition({
          lessonId: SYNTHETIC_LESSON_ID,
          locale: "ar-EG",
          position: 99901,
          title: "x",
          localeLessonsRoot: FIXTURES_ROOT,
          treatArEgAsJsonPackage: true,
        });
        const b = generateInstructionalComposition({
          lessonId: SYNTHETIC_LESSON_ID,
          locale: "en",
          position: 99901,
          title: "x",
          localeLessonsRoot: FIXTURES_ROOT,
          treatArEgAsJsonPackage: true,
        });
        expect(sha(a.png)).not.toBe(sha(b.png));
        const htmlEn = readFileSync(b.htmlPath, "utf8");
        expect(htmlEn).toContain("SYNTHETIC_EN_PROBE_ALPHA");
        expect(htmlEn).not.toContain("SYNTHETIC_AR_EG_PROBE_ALPHA");
      },
    );

    it("refuses outputDir under artifacts/controlled-v1", () => {
      expect(() =>
        generateInstructionalComposition({
          lessonId: SYNTHETIC_LESSON_ID,
          locale: "en",
          position: 99901,
          title: "blocked",
          outputDir: resolve(ARTIFACTS_ROOT, "cells", "should-not-exist"),
          localeLessonsRoot: FIXTURES_ROOT,
          treatArEgAsJsonPackage: true,
        }),
      ).toThrow(/must not be under artifacts\/controlled-v1/);
    });

    it("uses synthetic IDs only (never production pilot lesson id)", () => {
      expect(SYNTHETIC_LESSON_ID).not.toBe("intro-m1-l4-ai-can-cannot");
      expect(SYNTHETIC_LESSON_ID.startsWith("synthetic-")).toBe(true);
      // Fixture root must not live under production artifacts
      expect(FIXTURES_ROOT.replace(/\\/g, "/").includes("/artifacts/controlled-v1")).toBe(false);
    });

    it("fails closed when locale package is missing", () => {
      expect(() =>
        generateInstructionalComposition({
          lessonId: "synthetic-c-probe-missing-zzz",
          locale: "ar-MSA",
          position: 999,
          title: "عنوان احتياطي",
          localeLessonsRoot: FIXTURES_ROOT,
          treatArEgAsJsonPackage: true,
        }),
      ).toThrow(/BLOCKED_UNRESOLVED_SPEC|locale package missing/);
    });

    it("fails closed under CONTROLLED_V1_ZERO_RENDER without launching Chrome", () => {
      process.env.CONTROLLED_V1_ZERO_RENDER = "1";
      try {
        expect(() =>
          generateInstructionalComposition({
            lessonId: SYNTHETIC_LESSON_ID,
            locale: "en",
            position: 99901,
            title: "blocked",
            localeLessonsRoot: FIXTURES_ROOT,
            treatArEgAsJsonPackage: true,
          }),
        ).toThrow(/BLOCKED_ZERO_RENDER/);
      } finally {
        delete process.env.CONTROLLED_V1_ZERO_RENDER;
      }
    });

    it("does not leave synthetic cell directories under production artifacts root", () => {
      if (!existsSync(resolve(ARTIFACTS_ROOT, "cells"))) return;
      const dirs = readdirSync(resolve(ARTIFACTS_ROOT, "cells"));
      expect(dirs.some((d) => d.includes("synthetic-c-probe"))).toBe(false);
    });
  },
);
