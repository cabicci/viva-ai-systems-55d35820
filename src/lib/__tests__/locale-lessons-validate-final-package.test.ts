import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  validateFinalLessonFile,
  BANNED_PATTERNS,
} from "../../../scripts/locale-lessons/lib/validate-final-lesson-package";

async function tmpWrite(name: string, value: unknown): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "final-validate-"));
  const p = path.join(dir, name);
  await fs.writeFile(p, JSON.stringify(value, null, 2), "utf8");
  return p;
}

describe("validateFinalLessonFile", () => {
  it("passes on clean JSON", async () => {
    const p = await tmpWrite("clean.json", {
      sections: [{ role: "Orientation", heading: "X", contentMarkdown: "**hi** there" }],
    });
    const r = await validateFinalLessonFile(p);
    expect(r.ok).toBe(true);
    expect(r.bannedHits).toEqual([]);
    expect(r.unbalancedFields).toEqual([]);
  });

  it("fails when banned pattern present", async () => {
    const p = await tmpWrite("bad.json", {
      sections: [{ role: "Video block (production reference only)", heading: "x", contentMarkdown: "Bunny here" }],
    });
    const r = await validateFinalLessonFile(p);
    expect(r.ok).toBe(false);
    expect(r.bannedHits).toContain("Bunny");
    expect(r.bannedHits).toContain("Video block (production reference only)");
  });

  it("fails on Option N: leak", async () => {
    const p = await tmpWrite("bad2.json", {
      sections: [{ contentMarkdown: "Option 1: A" }],
    });
    const r = await validateFinalLessonFile(p);
    expect(r.ok).toBe(false);
    expect(r.bannedHits).toContain("Option 1:");
  });

  it("fails on unbalanced ** in any string field", async () => {
    const p = await tmpWrite("bad3.json", {
      sections: [
        {
          tables: [{ headers: ["a"], rows: [["**unclosed"]] }],
        },
      ],
    });
    const r = await validateFinalLessonFile(p);
    expect(r.ok).toBe(false);
    expect(r.unbalancedFields.length).toBeGreaterThan(0);
  });

  it("exports BANNED_PATTERNS list", () => {
    expect(BANNED_PATTERNS.length).toBeGreaterThan(5);
  });
});
