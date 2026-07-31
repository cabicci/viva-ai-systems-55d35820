import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildProductionManifest } from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  LOCALES,
  METHOD_A_M7L1_FOUR_PILOT_CELL_IDS,
  METHOD_A_M7L1_FOUR_PILOT_CONFIRM_TOKEN,
  METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL,
  METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import { loadClassification100 } from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";
import { selectMethodAFourCellPilot } from "../../../src/lib/lesson-visuals/controlled-v1/methodAFourCellPilot";
import { captureMethodAPilotCell } from "../../../src/lib/lesson-visuals/controlled-v1/routes/methodALiveCapture";
import { runMethodAFourCellPilot } from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import type {
  Locale,
  ManifestCell,
  ProductionManifest,
} from "../../../src/lib/lesson-visuals/controlled-v1/types";

/** Minimal valid 8-bit RGB PNG (IHDR + IDAT + IEND) at exact canvas size via nearest encode path. */
function encodeTinyRgbPng(width: number, height: number): Buffer {
  // Prefer reusing controlled-v1's sibling codec only if needed; for tests build via Bun/canvas-free
  // IHDR-only stub is insufficient for screenshot path — captureMethodAPilotCell only checks IHDR dims.
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i]!;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function chunk(type: string, data: Buffer): Buffer {
    const typeBuf = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  // Empty IDAT is invalid for decoders but IHDR dims are all captureMethodAPilotCell checks.
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdrData),
    chunk("IDAT", Buffer.alloc(0)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("method-a-m7l1-four-pilot selection", () => {
  const classification = loadClassification100({ useCache: false });
  const manifest = buildProductionManifest(classification);
  const selection = selectMethodAFourCellPilot(manifest);

  it("selects exactly four Method A cells for the authorized lesson and locales", () => {
    expect(selection.ok).toBe(true);
    expect(selection.errors).toEqual([]);
    expect(selection.cells).toHaveLength(METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL);
    expect(selection.cells.map((c) => c.cellId)).toEqual([...METHOD_A_M7L1_FOUR_PILOT_CELL_IDS]);
    expect(selection.counts.selected).toBe(4);
    expect(selection.counts.capturedTarget).toBe(4);
    expect(selection.counts.methodBSelected).toBe(0);
    expect(selection.counts.methodCSelected).toBe(0);
    expect(selection.counts.otherMethodASelected).toBe(0);
    expect(selection.counts.otherLessonsSelected).toBe(0);
  });

  it("requires Method A / MASAARAT_SCREENSHOT and exact one-per-locale", () => {
    for (const cell of selection.cells) {
      expect(cell.lessonId).toBe(METHOD_A_M7L1_FOUR_PILOT_LESSON_ID);
      expect(cell.category).toBe("A");
      expect(cell.route).toBe("MASAARAT_SCREENSHOT");
    }
    for (const locale of LOCALES) {
      expect(selection.counts.perLocale[locale]).toBe(1);
    }
  });

  it("does not select Method B/C or other Method A lessons", () => {
    expect(selection.cells.every((c) => c.route === "MASAARAT_SCREENSHOT")).toBe(true);
    expect(selection.cells.every((c) => c.route !== "INSTRUCTIONAL_COMPOSITION")).toBe(true);
    expect(selection.cells.every((c) => c.route !== "AUTHORIZED_EXTERNAL_SCREENSHOT")).toBe(true);
    expect(selection.cells.every((c) => c.lessonId === METHOD_A_M7L1_FOUR_PILOT_LESSON_ID)).toBe(
      true,
    );
  });

  it("fails closed when an authorized cell is missing", () => {
    const missing: ProductionManifest = {
      ...manifest,
      cells: manifest.cells.filter((c) => c.cellId !== METHOD_A_M7L1_FOUR_PILOT_CELL_IDS[0]),
    };
    const missingSelection = selectMethodAFourCellPilot(missing);
    expect(missingSelection.ok).toBe(false);
    expect(
      missingSelection.errors.some((e) => /missing|fewer than four|expected exactly 4/i.test(e)),
    ).toBe(true);
  });

  it("fails closed on duplicate authorized cell ids", () => {
    const dup: ProductionManifest = {
      ...manifest,
      cells: [...manifest.cells, selection.cells[0]!],
    };
    const dupSelection = selectMethodAFourCellPilot(dup);
    expect(dupSelection.ok).toBe(false);
    expect(dupSelection.errors.some((e) => /duplicate|more than four/i.test(e))).toBe(true);
  });

  it("ignores unrelated Method A cells (intrinsic four-cell set)", () => {
    const extra: ManifestCell = {
      ...selection.cells[0]!,
      cellId: "builder-m2-l1-prompt-layer__ar-EG",
      lessonId: "builder-m2-l1-prompt-layer",
    };
    const broadened: ProductionManifest = {
      ...manifest,
      cells: [...manifest.cells, extra],
    };
    const unrelated = selectMethodAFourCellPilot(broadened);
    expect(unrelated.cells).toHaveLength(4);
    expect(unrelated.cells.every((c) => c.lessonId === METHOD_A_M7L1_FOUR_PILOT_LESSON_ID)).toBe(
      true,
    );
  });
});

describe("method-a-m7l1-four-pilot gates", () => {
  it("requires the exact confirmation sentinel", async () => {
    expect(METHOD_A_M7L1_FOUR_PILOT_CONFIRM_TOKEN).toBe(
      "RUN_AUTHORIZED_METHOD_A_FOUR_LOCALE_CAPTURE_PILOT",
    );
    const bad = await runMethodAFourCellPilot("RUN_AUTHORIZED_METHOD_C_356");
    expect(bad.ok).toBe(false);
    expect(bad.receipts).toEqual([]);
    expect(bad.errors[0]).toContain("RUN_AUTHORIZED_METHOD_A_FOUR_LOCALE_CAPTURE_PILOT");
  });

  it("dry-selects exactly four cells under ZERO_CAPTURE", async () => {
    const prev = process.env.CONTROLLED_V1_ZERO_CAPTURE;
    process.env.CONTROLLED_V1_ZERO_CAPTURE = "1";
    try {
      const dry = await runMethodAFourCellPilot(METHOD_A_M7L1_FOUR_PILOT_CONFIRM_TOKEN);
      expect(dry.ok).toBe(true);
      expect(dry.receipts).toEqual([]);
      expect(dry.summary).toMatch(/dry-select: 4 cells/);
      expect(dry.summary).toMatch(/no capture/);
    } finally {
      if (prev === undefined) delete process.env.CONTROLLED_V1_ZERO_CAPTURE;
      else process.env.CONTROLLED_V1_ZERO_CAPTURE = prev;
    }
  });
});

describe("methodALiveCapture fail-closed adapter", () => {
  it("refuses ZERO_CAPTURE even with an injected captureFn", async () => {
    const prev = process.env.CONTROLLED_V1_ZERO_CAPTURE;
    process.env.CONTROLLED_V1_ZERO_CAPTURE = "1";
    const dir = mkdtempSync(join(tmpdir(), "method-a-cap-"));
    try {
      const result = await captureMethodAPilotCell({
        lessonId: METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
        locale: "ar-EG",
        cellId: "builder-m7-l1-tables-columns__ar-EG",
        outputDir: dir,
        captureFn: async () => {
          throw new Error("should not run");
        },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors[0]).toMatch(/ZERO_CAPTURE/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      if (prev === undefined) delete process.env.CONTROLLED_V1_ZERO_CAPTURE;
      else process.env.CONTROLLED_V1_ZERO_CAPTURE = prev;
    }
  });

  it("writes final.png only when injected capture assertions and dims pass", async () => {
    const dir = mkdtempSync(join(tmpdir(), "method-a-cap-ok-"));
    const png = encodeTinyRgbPng(CANVAS_WIDTH, CANVAS_HEIGHT);
    try {
      const result = await captureMethodAPilotCell({
        lessonId: METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
        locale: "en",
        cellId: "builder-m7-l1-tables-columns__en",
        outputDir: dir,
        captureFn: async ({ locale }: { locale: Locale }) => ({
          png,
          finalUrl: `http://127.0.0.1:55440/system-state?locale=${locale}`,
          evidence: {
            requestedLocale: locale,
            resolvedLocale: locale,
            direction: "ltr",
            route: "/system-state",
            finalUrl: `http://127.0.0.1:55440/system-state?locale=${locale}`,
            readiness: {},
            redaction: {},
            networkAudit: {
              total: 0,
              allowed: 0,
              blockedNonLocal: 0,
              forbidden: 0,
              samples: [],
            },
            assertions: [],
          },
        }),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.width).toBe(CANVAS_WIDTH);
        expect(result.height).toBe(CANVAS_HEIGHT);
        expect(result.sha256).toBe(createHash("sha256").update(png).digest("hex").toUpperCase());
        expect(readFileSync(join(dir, "final.png")).equals(png)).toBe(true);
        expect(readFileSync(join(dir, "final-review.html"), "utf8")).toContain(
          "PENDING_HUMAN_REVIEW",
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses to finalize when assertions fail", async () => {
    const dir = mkdtempSync(join(tmpdir(), "method-a-cap-fail-"));
    try {
      const result = await captureMethodAPilotCell({
        lessonId: METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
        locale: "ar-EG",
        cellId: "builder-m7-l1-tables-columns__ar-EG",
        outputDir: dir,
        captureFn: async ({ locale }) => ({
          png: encodeTinyRgbPng(CANVAS_WIDTH, CANVAS_HEIGHT),
          finalUrl: `http://127.0.0.1:55440/login?locale=${locale}`,
          evidence: {
            requestedLocale: locale,
            resolvedLocale: locale,
            direction: "rtl",
            route: "/login",
            finalUrl: `http://127.0.0.1:55440/login?locale=${locale}`,
            readiness: {},
            redaction: {},
            networkAudit: {
              total: 0,
              allowed: 0,
              blockedNonLocal: 0,
              forbidden: 0,
              samples: [],
            },
            assertions: ["route must be /system-state; got /login"],
          },
        }),
      });
      expect(result.ok).toBe(false);
      expect(readFileSync).toBeTruthy();
      let threw = false;
      try {
        readFileSync(join(dir, "final.png"));
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
