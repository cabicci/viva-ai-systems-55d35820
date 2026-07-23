import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { generateInstructionalComposition } from "../../../src/lib/lesson-visuals/controlled-v1/routes/instructionalComposition";
import { readPngDimensions } from "../../../src/lib/lesson-visuals/controlled-v1/goldenRefs";
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

function sha(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

describe("controlled-v1 instructionalComposition generator", () => {
  it("produces a valid 1280x720 PNG with joined Arabic for ar-EG", () => {
    const result = generateInstructionalComposition({
      lessonId: "intro-m1-l4-ai-can-cannot",
      locale: "ar-EG",
      position: 4,
      title: "الـ AI يقدر يعمل إيه ومينفعش يعمل إيه؟",
    });
    expect(result.width).toBe(1280);
    expect(result.height).toBe(720);
    expect(result.direction).toBe("rtl");
    expect(result.png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const html = readFileSync(result.htmlPath, "utf8");
    expect(html).toContain("الـ AI قوي في اللغة");
    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("Tajawal");

    const dir = mkdtempSync(resolve(tmpdir(), "controlled-v1-test-"));
    const path = resolve(dir, "out.png");
    try {
      writeFileSync(path, result.png);
      expect(readPngDimensions(path)).toEqual({ width: 1280, height: 720 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is byte-for-byte deterministic given identical inputs (same Chrome)", () => {
    const input = {
      lessonId: "intro-m1-l4-ai-can-cannot" as const,
      locale: "en" as const,
      position: 4,
      title: "AI Can and Cannot",
    };
    const a = generateInstructionalComposition(input);
    const b = generateInstructionalComposition(input);
    expect(sha(a.png)).toBe(sha(b.png));
    expect(a.direction).toBe("ltr");
  });

  it("produces different pixel content across locales for the same lesson", () => {
    const a = generateInstructionalComposition({
      lessonId: "intro-m1-l4-ai-can-cannot",
      locale: "ar-EG",
      position: 4,
      title: "x",
    });
    const b = generateInstructionalComposition({
      lessonId: "intro-m1-l4-ai-can-cannot",
      locale: "en",
      position: 4,
      title: "x",
    });
    expect(sha(a.png)).not.toBe(sha(b.png));
    const htmlEn = readFileSync(b.htmlPath, "utf8");
    expect(htmlEn).toContain("AI is strong in language");
    expect(htmlEn).not.toContain("النهاردة");
  });

  it("fails closed when locale package is missing", () => {
    expect(() =>
      generateInstructionalComposition({
        lessonId: "__no-such-lesson-id-for-test",
        locale: "ar-MSA",
        position: 999,
        title: "عنوان احتياطي",
      }),
    ).toThrow(/BLOCKED_UNRESOLVED_SPEC|locale package missing/);
  });
});
